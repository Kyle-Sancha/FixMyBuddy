import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/security.js';
import { verifyTokenHash } from '../utils/crypto.js';

export const mechanicRouter = Router();

// All /mechanics/me/* endpoints require an authenticated mechanic (or admin) session
mechanicRouter.use('/mechanics/me', requireAuth(['mechanic']));

async function ensureMechanicProfile(user) {
  const existing = await query(
    `SELECT * FROM mechanic_profiles WHERE user_id = $1 LIMIT 1`,
    [user.id],
  );
  if (existing.rows.length > 0) return existing.rows[0];

  const proId = `PRO-${String(Math.floor(1000 + Math.random() * 9000))}`;
  const created = await query(
    `INSERT INTO mechanic_profiles (id, user_id, display_name, verified, online)
     VALUES ($1, $2, $3, FALSE, TRUE)
     RETURNING *`,
    [proId, user.id, user.name],
  );
  return created.rows[0];
}

function formatMechanicProfile(profile, user) {
  const initials = (profile.display_name || user.name || 'MP')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return {
    id: String(profile.id),
    name: profile.display_name || user.name,
    initials,
    email: user.email,
    mobile: user.phone || '',
    identityVerified: Boolean(profile.verified),
    credentials: Array.isArray(profile.credentials) ? profile.credentials : [],
    online: Boolean(profile.online),
    serviceRadiusKm: Number(profile.service_radius_km || 15),
    workingHours: profile.working_hours || 'Mon–Sat · 8 AM–6 PM',
    flatbedCapability: profile.flatbed_capability || '',
    specialties: Array.isArray(profile.specialties) ? profile.specialties : [],
  };
}

function formatMechanicJobRow(row, customerRow) {
  const visitEstimate = Number(row.quoted_amount || 450);
  const estimatedNet = Math.round(visitEstimate * 0.9);
  const custName = customerRow?.name || 'Customer';
  const initials = custName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return {
    id: String(row.id),
    reference: row.reference,
    version: Number(row.version || 1),
    type: row.service_type === 'towing' ? 'towing' : 'repair',
    service: row.issue_type || 'Roadside assistance',
    status: row.status,
    customer: {
      name: custName,
      initials,
      verified: Boolean(customerRow?.phone_verified),
    },
    vehicle: row.vehicle_label || 'Customer vehicle',
    description: `${row.pickup_address} · ${row.notes || row.issue_type}`,
    location: row.landmark || row.pickup_address,
    distance: '2.4 km',
    visitEstimate,
    estimatedNet,
    scheduledAt: row.scheduled_at ? new Date(row.scheduled_at).toISOString() : null,
    mechanicState: row.mechanic_state || {},
    towingState: row.towing_state || {},
    repairEstimate: row.repair_estimate || null,
    approvedQuote: row.approved_quote || null,
    pendingRevision: row.pending_revision || null,
  };
}

// GET /mechanics/me
mechanicRouter.get('/mechanics/me', async (req, res, next) => {
  try {
    const profile = await ensureMechanicProfile(req.user);
    return res.json({ mechanic: formatMechanicProfile(profile, req.user) });
  } catch (error) {
    return next(error);
  }
});

// PATCH /mechanics/me/profile
mechanicRouter.patch('/mechanics/me/profile', async (req, res, next) => {
  try {
    const profile = await ensureMechanicProfile(req.user);
    const {
      name,
      serviceRadiusKm,
      workingHours,
      flatbedCapability,
      credentials,
    } = req.body || {};

    const updated = await query(
      `UPDATE mechanic_profiles
       SET display_name = COALESCE($1, display_name),
           service_radius_km = COALESCE($2, service_radius_km),
           working_hours = COALESCE($3, working_hours),
           flatbed_capability = COALESCE($4, flatbed_capability),
           credentials = COALESCE($5, credentials),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        name ? String(name).trim() : null,
        serviceRadiusKm != null ? Number(serviceRadiusKm) : null,
        workingHours ? String(workingHours).trim() : null,
        flatbedCapability !== undefined ? String(flatbedCapability).trim() : null,
        Array.isArray(credentials) ? credentials.map(String) : null,
        profile.id,
      ],
    );
    return res.json({ mechanic: formatMechanicProfile(updated.rows[0], req.user) });
  } catch (error) {
    return next(error);
  }
});

// PATCH /mechanics/me/availability
mechanicRouter.patch('/mechanics/me/availability', async (req, res, next) => {
  try {
    const profile = await ensureMechanicProfile(req.user);
    const { online, services, serviceRadiusKm, workingHours } = req.body || {};

    const updated = await query(
      `UPDATE mechanic_profiles
       SET online = COALESCE($1, online),
           specialties = COALESCE($2, specialties),
           service_radius_km = COALESCE($3, service_radius_km),
           working_hours = COALESCE($4, working_hours),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        typeof online === 'boolean' ? online : null,
        Array.isArray(services) ? services.map(String) : null,
        serviceRadiusKm != null ? Number(serviceRadiusKm) : null,
        workingHours ? String(workingHours).trim() : null,
        profile.id,
      ],
    );
    const row = updated.rows[0];
    return res.json({
      availability: {
        online: Boolean(row.online),
        services: row.specialties || [],
        serviceRadiusKm: Number(row.service_radius_km || 15),
        workingHours: row.working_hours,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// GET /mechanics/me/jobs
mechanicRouter.get('/mechanics/me/jobs', async (req, res, next) => {
  try {
    const profile = await ensureMechanicProfile(req.user);
    const statusFilter = req.query.status ? String(req.query.status) : null;

    const params = [profile.id];
    let sql = `
      SELECT b.*, u.name AS customer_name, u.phone_verified AS customer_verified
      FROM bookings b
      LEFT JOIN users u ON u.id = b.customer_id
      WHERE b.provider_id = $1
    `;
    if (statusFilter) {
      params.push(statusFilter);
      sql += ` AND b.status = $2`;
    }
    sql += ` ORDER BY b.created_at DESC`;

    const result = await query(sql, params);
    const jobs = result.rows.map((r) =>
      formatMechanicJobRow(r, {
        name: r.customer_name,
        phone_verified: r.customer_verified,
      }),
    );
    return res.json({ jobs });
  } catch (error) {
    return next(error);
  }
});

// GET /mechanics/me/jobs/:jobId
mechanicRouter.get('/mechanics/me/jobs/:jobId', async (req, res, next) => {
  try {
    const profile = await ensureMechanicProfile(req.user);
    const result = await query(
      `SELECT b.*, u.name AS customer_name, u.phone_verified AS customer_verified
       FROM bookings b
       LEFT JOIN users u ON u.id = b.customer_id
       WHERE b.id = $1 AND b.provider_id = $2
       LIMIT 1`,
      [req.params.jobId, profile.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found or not assigned to your account.' });
    }
    const r = result.rows[0];
    return res.json({
      job: formatMechanicJobRow(r, {
        name: r.customer_name,
        phone_verified: r.customer_verified,
      }),
    });
  } catch (error) {
    return next(error);
  }
});

// POST /mechanics/me/jobs/:jobId/accept
mechanicRouter.post('/mechanics/me/jobs/:jobId/accept', async (req, res, next) => {
  try {
    const profile = await ensureMechanicProfile(req.user);
    const nowIso = new Date().toISOString();
    const updated = await query(
      `UPDATE bookings
       SET status = 'en_route',
           dispatched_at = NOW(),
           mechanic_state = jsonb_set(
             COALESCE(mechanic_state, '{}'::jsonb),
             '{status}',
             '"en_route"'
           ),
           version = version + 1,
           updated_at = NOW()
       WHERE id = $1 AND provider_id = $2
       RETURNING *`,
      [req.params.jobId, profile.id],
    );
    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found.' });
    }
    const row = updated.rows[0];
    await query(
      `INSERT INTO notifications (user_id, booking_id, type, title, message)
       VALUES ($1, $2, 'booking_confirmed', $3, $4)`,
      [
        row.customer_id,
        row.id,
        `${profile.display_name} is on the way`,
        `Your provider accepted booking ${row.reference} at ${nowIso.slice(11, 16)}.`,
      ],
    );
    return res.json({ job: formatMechanicJobRow(row, null) });
  } catch (error) {
    return next(error);
  }
});

// POST /mechanics/me/jobs/:jobId/decline
mechanicRouter.post('/mechanics/me/jobs/:jobId/decline', async (req, res, next) => {
  try {
    const profile = await ensureMechanicProfile(req.user);
    const updated = await query(
      `UPDATE bookings
       SET status = 'rejected', version = version + 1, updated_at = NOW()
       WHERE id = $1 AND provider_id = $2
       RETURNING *`,
      [req.params.jobId, profile.id],
    );
    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found.' });
    }
    return res.json({ job: formatMechanicJobRow(updated.rows[0], null) });
  } catch (error) {
    return next(error);
  }
});

// POST /mechanics/me/jobs/:jobId/arrival-verification
mechanicRouter.post('/mechanics/me/jobs/:jobId/arrival-verification', async (req, res, next) => {
  try {
    const profile = await ensureMechanicProfile(req.user);
    const { pin } = req.body || {};
    const jobRes = await query(
      `SELECT * FROM bookings WHERE id = $1 AND provider_id = $2 LIMIT 1`,
      [req.params.jobId, profile.id],
    );
    if (jobRes.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found.' });
    }
    const job = jobRes.rows[0];

    const cleanPin = String(pin || '').trim();
    const validPin =
      cleanPin === job.arrival_pin_plain ||
      (job.arrival_pin_hash && verifyTokenHash(cleanPin, job.arrival_pin_hash));

    if (!validPin) {
      return res.status(409).json({ error: 'Incorrect arrival PIN.' });
    }

    const nextMechanicState = {
      ...(job.mechanic_state || {}),
      status: 'inspecting',
      arrivalPinAvailable: false,
      updatedAt: new Date().toISOString(),
    };

    const updated = await query(
      `UPDATE bookings
       SET status = 'in_progress',
           arrival_verified_at = NOW(),
           arrival_pin_plain = NULL,
           mechanic_state = $1::jsonb,
           version = version + 1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(nextMechanicState), job.id],
    );
    return res.json({ job: formatMechanicJobRow(updated.rows[0], null) });
  } catch (error) {
    return next(error);
  }
});

// POST /mechanics/me/jobs/:jobId/diagnosis
mechanicRouter.post('/mechanics/me/jobs/:jobId/diagnosis', async (req, res, next) => {
  try {
    const profile = await ensureMechanicProfile(req.user);
    const { findings = '', checklist = [] } = req.body || {};
    if (!String(findings).trim()) {
      return res.status(400).json({ error: 'Diagnosis findings are required.' });
    }

    const jobRes = await query(
      `SELECT * FROM bookings WHERE id = $1 AND provider_id = $2 LIMIT 1`,
      [req.params.jobId, profile.id],
    );
    if (jobRes.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found.' });
    }
    const job = jobRes.rows[0];
    const diagnosis = {
      summary: String(findings).trim(),
      checklist,
      createdAt: new Date().toISOString(),
    };
    const nextMechanicState = {
      ...(job.mechanic_state || {}),
      status: 'diagnosed',
      diagnosis,
      updatedAt: diagnosis.createdAt,
    };

    await query(
      `UPDATE bookings
       SET mechanic_state = $1::jsonb, version = version + 1, updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(nextMechanicState), job.id],
    );
    return res.status(201).json({ diagnosis });
  } catch (error) {
    return next(error);
  }
});

// POST /mechanics/me/jobs/:jobId/quotes
mechanicRouter.post('/mechanics/me/jobs/:jobId/quotes', async (req, res, next) => {
  try {
    const profile = await ensureMechanicProfile(req.user);
    const { items = [], warrantySummary = '' } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Quote items are required.' });
    }

    const normalizedItems = items.map((item) => ({
      label: String(item.label || item.name || 'Service item').trim(),
      amount: Number(item.amount || 0),
    }));
    const total = normalizedItems.reduce((sum, i) => sum + i.amount, 0);
    const quote = {
      id: `QUOTE-${req.params.jobId}`,
      version: 1,
      currency: 'PHP',
      items: normalizedItems,
      total,
      ...(warrantySummary ? { warrantySummary: String(warrantySummary) } : {}),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };

    const updated = await query(
      `UPDATE bookings
       SET repair_estimate = $1::jsonb,
           repair_approval_status = 'awaiting_customer',
           version = version + 1,
           updated_at = NOW()
       WHERE id = $2 AND provider_id = $3
       RETURNING *`,
      [JSON.stringify(quote), req.params.jobId, profile.id],
    );
    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found.' });
    }
    return res.status(201).json({ quote });
  } catch (error) {
    return next(error);
  }
});

// POST /mechanics/me/jobs/:jobId/additional-work
mechanicRouter.post('/mechanics/me/jobs/:jobId/additional-work', async (req, res, next) => {
  try {
    const profile = await ensureMechanicProfile(req.user);
    const { reason = '', items = [] } = req.body || {};
    const jobRes = await query(
      `SELECT * FROM bookings WHERE id = $1 AND provider_id = $2 LIMIT 1`,
      [req.params.jobId, profile.id],
    );
    if (jobRes.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found.' });
    }
    const job = jobRes.rows[0];
    const baseQuote = job.approved_quote || job.repair_estimate || job.initial_estimate;
    const extraItems = Array.isArray(items) && items.length
      ? items.map((i) => ({ label: String(i.label), amount: Number(i.amount) }))
      : [{ label: 'Additional terminal & fitting', amount: 200 }];

    const combinedItems = [...(baseQuote?.items || []), ...extraItems];
    const total = combinedItems.reduce((sum, i) => sum + i.amount, 0);
    const revision = {
      id: `${baseQuote?.id || `QUOTE-${job.id}`}-REV`,
      version: Number(baseQuote?.version || 1) + 1,
      currency: 'PHP',
      items: combinedItems,
      total,
      baseQuoteId: baseQuote?.id || `QUOTE-${job.id}`,
      baseQuoteVersion: Number(baseQuote?.version || 1),
      reasonForExtraWork: String(reason),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };

    const nextMechanicState = {
      ...(job.mechanic_state || {}),
      status: 'awaiting_approval',
      workPaused: true,
      updatedAt: new Date().toISOString(),
    };

    await query(
      `UPDATE bookings
       SET pending_revision = $1::jsonb,
           revision_status = 'awaiting_customer',
           mechanic_state = $2::jsonb,
           version = version + 1,
           updated_at = NOW()
       WHERE id = $3`,
      [JSON.stringify(revision), JSON.stringify(nextMechanicState), job.id],
    );

    return res.status(201).json({ request: revision });
  } catch (error) {
    return next(error);
  }
});

// PATCH /mechanics/me/jobs/:jobId/progress
mechanicRouter.patch('/mechanics/me/jobs/:jobId/progress', async (req, res, next) => {
  try {
    const profile = await ensureMechanicProfile(req.user);
    const { message, steps } = req.body || {};
    const jobRes = await query(
      `SELECT * FROM bookings WHERE id = $1 AND provider_id = $2 LIMIT 1`,
      [req.params.jobId, profile.id],
    );
    if (jobRes.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found.' });
    }
    const job = jobRes.rows[0];
    const nowIso = new Date().toISOString();
    const existingUpdates = Array.isArray(job.mechanic_state?.updates)
      ? job.mechanic_state.updates
      : [];
    const nextUpdates = message
      ? [
          ...existingUpdates,
          {
            id: `UPD-${existingUpdates.length + 1}`,
            title: 'Mechanic progress update',
            body: String(message),
            createdAt: nowIso,
          },
        ]
      : existingUpdates;

    const nextMechanicState = {
      ...(job.mechanic_state || {}),
      status: 'repairing',
      workPaused: false,
      updatedAt: nowIso,
      ...(Array.isArray(steps) ? { timeline: steps } : {}),
      updates: nextUpdates,
    };

    const updated = await query(
      `UPDATE bookings
       SET mechanic_state = $1::jsonb, version = version + 1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(nextMechanicState), job.id],
    );
    return res.json({ job: formatMechanicJobRow(updated.rows[0], null) });
  } catch (error) {
    return next(error);
  }
});

// POST /mechanics/me/jobs/:jobId/handover
mechanicRouter.post('/mechanics/me/jobs/:jobId/handover', async (req, res, next) => {
  try {
    const profile = await ensureMechanicProfile(req.user);
    const { pin } = req.body || {};
    const jobRes = await query(
      `SELECT * FROM bookings WHERE id = $1 AND provider_id = $2 LIMIT 1`,
      [req.params.jobId, profile.id],
    );
    if (jobRes.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found.' });
    }
    const job = jobRes.rows[0];
    const cleanPin = String(pin || '').trim();
    const validPin =
      !job.handover_pin_plain ||
      cleanPin === job.handover_pin_plain ||
      (job.handover_pin_hash && verifyTokenHash(cleanPin, job.handover_pin_hash));

    if (!validPin) {
      return res.status(409).json({ error: 'Incorrect handover PIN.' });
    }

    const nextTowingState = {
      ...(job.towing_state || {}),
      status: 'at_destination',
      canConfirmHandover: true,
      handover: {
        id: `HO-${job.id}`,
        status: 'confirmed',
        condition: 'no_new_damage',
        keysReceived: true,
        vehicleReceived: true,
      },
    };

    const updated = await query(
      `UPDATE bookings
       SET towing_state = $1::jsonb,
           handover_pin_plain = NULL,
           version = version + 1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(nextTowingState), job.id],
    );
    return res.json({ job: formatMechanicJobRow(updated.rows[0], null) });
  } catch (error) {
    return next(error);
  }
});

// POST /mechanics/me/jobs/:jobId/completion
mechanicRouter.post('/mechanics/me/jobs/:jobId/completion', async (req, res, next) => {
  try {
    const profile = await ensureMechanicProfile(req.user);
    const jobRes = await query(
      `SELECT * FROM bookings WHERE id = $1 AND provider_id = $2 LIMIT 1`,
      [req.params.jobId, profile.id],
    );
    if (jobRes.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found.' });
    }
    const job = jobRes.rows[0];
    const finalAmount = Number(
      job.approved_quote?.total || job.repair_estimate?.total || job.quoted_amount || 450,
    );

    const updated = await query(
      `UPDATE bookings
       SET status = 'completed',
           completed_at = NOW(),
           paid_amount = $1,
           payment_status = 'verified',
           receipt_available = TRUE,
           receipt_number = $2,
           version = version + 1,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [finalAmount, `RC-${job.reference}`, job.id],
    );

    await query(
      `UPDATE mechanic_profiles
       SET jobs_completed = jobs_completed + 1, updated_at = NOW()
       WHERE id = $1`,
      [profile.id],
    );

    await query(
      `INSERT INTO notifications (user_id, booking_id, type, title, message)
       VALUES ($1, $2, 'payment_received', $3, $4)`,
      [
        job.customer_id,
        job.id,
        `Service completed (${job.reference})`,
        `Payment of ₱${finalAmount.toLocaleString('en-PH')} verified. Your official PDF receipt is ready.`,
      ],
    );

    return res.json({ job: formatMechanicJobRow(updated.rows[0], null) });
  } catch (error) {
    return next(error);
  }
});

// GET /mechanics/me/earnings
mechanicRouter.get('/mechanics/me/earnings', async (req, res, next) => {
  try {
    const profile = await ensureMechanicProfile(req.user);
    const result = await query(
      `SELECT * FROM bookings WHERE provider_id = $1 ORDER BY created_at DESC LIMIT 30`,
      [profile.id],
    );

    const completed = result.rows.filter((r) => r.status === 'completed');
    const grossCollected = completed.reduce(
      (sum, r) => sum + Number(r.paid_amount || r.quoted_amount || 0),
      0,
    );
    const platformFeeRate = 0.1;
    const netEarnings = Math.round(grossCollected * (1 - platformFeeRate));

    return res.json({
      earnings: {
        currency: 'PHP',
        grossCollected,
        platformFeeRate,
        netEarnings,
        completedJobs: completed.length,
        history: result.rows.map((r) => {
          const gross = Number(r.paid_amount || r.quoted_amount || 0);
          return {
            jobId: String(r.id),
            service: r.issue_type,
            date: new Date(r.created_at).toISOString().slice(0, 10),
            status: r.status,
            gross,
            net: Math.round(gross * (1 - platformFeeRate)),
          };
        }),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// GET /mechanics/me/updates
mechanicRouter.get('/mechanics/me/updates', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30`,
      [req.user.id],
    );
    return res.json({
      updates: result.rows.map((u) => ({
        id: String(u.id),
        type: u.type,
        title: u.title,
        message: u.message,
        jobId: u.booking_id || undefined,
        time: new Date(u.created_at).toLocaleTimeString('en-PH', {
          hour: 'numeric',
          minute: '2-digit',
        }),
      })),
    });
  } catch (error) {
    return next(error);
  }
});
