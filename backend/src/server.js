import { Buffer } from 'node:buffer';
import process from 'node:process';
import express from 'express';
import { loadEnv } from './utils/env.js';
import { isDbConfigured, query } from './db/pool.js';
import { attachSession, securityHeadersAndCsrf } from './middleware/security.js';
import { authRouter } from './routes/authRoutes.js';
import { providerRouter } from './routes/providerRoutes.js';
import { customerRouter } from './routes/customerRoutes.js';
import { mechanicRouter } from './routes/mechanicRoutes.js';

loadEnv();

export function createApp() {
  const app = express();

  const allowedOrigins = new Set(
    (process.env.FRONTEND_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

  function isOriginAllowed(origin) {
    if (!origin) return true;
    if (allowedOrigins.has(origin)) return true;
    if (process.env.NODE_ENV !== 'production') {
      return /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(
        origin,
      );
    }
    return false;
  }

  // CORS with credentials support
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    }
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    return next();
  });

  app.use(securityHeadersAndCsrf(isOriginAllowed));
  app.use(express.json({ limit: '1mb' }));

  // Lightweight multipart/form-data parser using Node's native Web Fetch FormData
  app.use(async (req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) return next();
    try {
      const chunks = [];
      let totalSize = 0;
      for await (const chunk of req) {
        totalSize += chunk.length;
        if (totalSize > 120 * 1024 * 1024) {
          return res.status(413).json({ error: 'Uploaded files exceed maximum size limit.' });
        }
        chunks.push(chunk);
      }
      const raw = Buffer.concat(chunks);
      const form = await new Response(raw, {
        headers: { 'Content-Type': contentType },
      }).formData();
      const detailsRaw = form.get('details');
      req.body = {
        details: detailsRaw ? JSON.parse(String(detailsRaw)) : {},
      };
      req.evidenceFiles = form.getAll('evidence').map((file) => ({
        name: String(file.name || 'evidence').replace(/[^\w.-]/g, '_'),
        type: String(file.type || 'application/octet-stream'),
        size: Number(file.size || 0),
      }));
      return next();
    } catch {
      return res.status(400).json({ error: 'Invalid multipart upload.' });
    }
  });

  app.use(attachSession);

  // Health & Database connectivity status
  app.get('/health', async (_req, res) => {
    if (!isDbConfigured()) {
      return res.status(503).json({
        status: 'unconfigured',
        message: 'Replace [YOUR-PASSWORD] in backend/.env DATABASE_URL with your Supabase password.',
      });
    }
    try {
      await query('SELECT 1');
      return res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
      return res.status(503).json({ status: 'error', message: error.message });
    }
  });

  // Mount routes under both root (/) and (/api) so VITE_API_BASE_URL works with or without /api
  for (const prefix of ['', '/api']) {
    app.use(`${prefix}/auth`, authRouter);
    app.use(prefix, providerRouter);
    app.use(prefix, customerRouter);
    app.use(prefix, mechanicRouter);
  }

  // Error handler
  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    if (process.env.NODE_ENV !== 'test') {
      console.error('[API Error]', err.message);
    }
    res.status(status).json({
      error: status === 500 ? 'Internal server error.' : err.message,
    });
  });

  return app;
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const port = Number(process.env.PORT || 4000);
  const app = createApp();
  app.listen(port, () => {
    console.log(`FixMyBuddy backend listening on http://localhost:${port}`);
    if (!isDbConfigured()) {
      console.warn(
        'WARNING: DATABASE_URL still has [YOUR-PASSWORD]. Update backend/.env and run `npm run db:migrate`.',
      );
    }
  });
}
