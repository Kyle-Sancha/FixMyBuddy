import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nodeModules = (name) =>
  fileURLToPath(new URL(`./node_modules/${name}`, import.meta.url));

function fixMyBuddyApiPlugin() {
  let apiAppPromise = null;

  async function getApiApp() {
    if (!apiAppPromise) {
      apiAppPromise = (async () => {
        const { loadEnv } = await import('../../backend/src/utils/env.js');
        loadEnv(path.resolve(__dirname, '../../backend/.env'));
        const { createApp } = await import('../../backend/src/server.js');
        return createApp();
      })();
    }
    return apiAppPromise;
  }

  return {
    name: 'fixmybuddy-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || (!req.url.startsWith('/api/') && req.url !== '/api')) {
          return next();
        }
        try {
          const app = await getApiApp();
          return app(req, res, next);
        } catch (error) {
          console.error('[Vite API Middleware Error]', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error.message || 'Backend initialization error.' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), fixMyBuddyApiPlugin()],
  resolve: {
    // Mechanic files live outside this package, so point shared deps at one copy.
    alias: {
      'react/jsx-runtime': nodeModules('react/jsx-runtime.js'),
      'react/jsx-dev-runtime': nodeModules('react/jsx-dev-runtime.js'),
      'react-router-dom': nodeModules('react-router-dom'),
      'lucide-react': nodeModules('lucide-react'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
