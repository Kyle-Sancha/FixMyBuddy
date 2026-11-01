import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import process from 'node:process';
import { Router } from 'express';
import { query, withTransaction } from '../db/pool.js';
import { formatUser, requireAuth } from '../middleware/security.js';
import { generateNumericCode, hashToken, verifyTokenHash } from '../utils/crypto.js';
import { cleanPlate, normalizePhone, normalizedPlateKey } from '../utils/validation.js';

export const customerRouter = Router();

function formatVehicleRow(row) {
  return {
    id: String(row.id),
    type: row.type,
    make: row.make,
    model: row.model,
    year: Number(row.year),
    color: row.color,
    plate: row.plate || '',
  };
}

export async function formatBookingRow(row) {
  let providerProfile = null;
  if (row.provider_id) {
    const provRes = await query(
      `SELECT p.*, u.phone AS provider_phone
       FROM mechanic_profiles p
       LEFT JOIN users u ON u.id = p.user_id
       WHERE p.id = $1 LIMIT 1`,
      [row.provider_id],
    );
    providerProfile = provRes.rows[0] || null;
  }

  let policy = null;
  if (row.cancellation_policy_id) {
    const polRes = await query(
      `SELECT id, text FROM cancellation_policies WHERE id = $1 LIMIT 1`,
      [row.cancellation_policy_id],
    );
    policy = polRes.rows[0] || null;
  }

  const reviewRes = await query(
    `SELECT * FROM booking_reviews WHERE booking_id = $1 LIMIT 1`,
    [row.id],
  );
  const reviewRow = reviewRes.rows[0] || null;

  const preDispatch =
    ['requested', 'pending', 'confirmed', 'accepted', 'scheduled'].includes(row.status) &&
    !row.dispatched_at;

  const providerSummary = providerProfile
    ? {
        id: String(providerProfile.id),
        name: providerProfile.display_name,
        verified: Boolean(providerProfile.verified),
        rating: Number(providerProfile.rating || 5),
        reviewsCount: Number(providerProfile.reviews_count || 0),
        chatEnabled: true,
        ...(providerProfile.provider_phone ? { phone: providerProfile.provider_phone } : {}),
        ...(providerProfile.latitude != null && providerProfile.longitude != null
          ? {
              position: {
                latitude: Number(providerProfile.latitude),
                longitude: Number(providerProfile.longitude),
                updatedAt: providerProfile.position_updated_at
                  ? new Date(providerProfile.position_updated_at).toISOString()
                  : new Date().toISOString(),
              },
            }
          : {}),
      }
    : null;

  const mechanicState =
    row.service_type === 'mechanic'
      ? {
          status: row.mechanic_state?.status || row.status,
          updatedAt: row.mechanic_state?.updatedAt || new Date(row.updated_at).toISOString(),
          provider: providerSummary || {
            id: row.provider_id || 'PRO-0042',
            name: 'Assigned Mechanic',
            chatEnabled: true,
          },
          etaMinutes: row.mechanic_state?.etaMinutes ?? 12,
          ...(providerSummary?.position ? { position: providerSummary.position } : {}),
          arrivalPinAvailable:
            !row.arrival_verified_at &&
            Boolean(row.arrival_pin_plain) &&
            !['completed', 'cancelled', 'rejected'].includes(row.status),
          workPaused: Boolean(row.mechanic_state?.workPaused),
          ...(row.mechanic_state?.estimatedFinishAt
            ? { estimatedFinishAt: row.mechanic_state.estimatedFinishAt }
            : {}),
          ...(row.mechanic_state?.diagnosis ? { diagnosis: row.mechanic_state.diagnosis } : {}),
          timeline: Array.isArray(row.mechanic_state?.timeline)
            ? row.mechanic_state.timeline
            : [
                {
                  id: 'confirmed',
                  label: 'Booking confirmed',
                  status: 'completed',
                  at: new Date(row.created_at).toISOString(),
                },
                {
                  id: 'service',
                  label: 'Roadside service in progress',
                  status: row.status === 'completed' ? 'completed' : 'current',
                },
              ],
          updates: Array.isArray(row.mechanic_state?.updates)
            ? row.mechanic_state.updates
            : [],
        }
      : undefined;

  const towingState =
    row.service_type === 'towing'
      ? {
          status: row.towing_state?.status || 'en_route',
          destinationAddress: row.destination_address || 'Destination repair shop',
          distanceKm: row.towing_route?.distanceKm ?? 5,
          etaMinutes: row.towing_state?.etaMinutes ?? 15,
          equipment: row.towing_route?.equipment || 'Flatbed tow truck',
          provider: providerSummary || {
            name: 'Assigned Towing Provider',
            chatEnabled: true,
          },
          canConfirmHandover:
            row.towing_state?.status === 'at_destination' &&
            row.towing_state?.handover?.status !== 'confirmed',
          handover: row.towing_state?.handover || {
            requiresPin: true,
          },
        }
      : undefined;

  return {
    id: String(row.id),
    reference: row.reference,
    version: Number(row.version || 1),
    serviceType: row.service_type,
    issueType: row.issue_type,
    vehicleId: row.vehicle_id ? String(row.vehicle_id) : '',
    vehicleLabel: row.vehicle_label,
    scheduledAt: row.scheduled_at ? new Date(row.scheduled_at).toISOString() : null,
    dispatchedAt: row.dispatched_at ? new Date(row.dispatched_at).toISOString() : null,
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    status: row.status,
    providerName: providerProfile?.display_name || 'FixMyBuddy Pro',
    quotedAmount: Number(row.quoted_amount || 0),
    ...(row.paid_amount != null ? { paidAmount: Number(row.paid_amount) } : {}),
    notes: row.notes || '',
    canCancel: preDispatch,
    canReschedule: preDispatch,
    ...(policy ? { cancellationPolicy: { id: String(policy.id), text: policy.text } } : {}),
    payment: {
      status: row.payment_status || 'unverified',
      ...(providerProfile?.payment_qr_url ? { qrUrl: providerProfile.payment_qr_url } : {}),
      ...(providerProfile?.payee_name
        ? { payeeName: providerProfile.payee_name }
        : { payeeName: providerProfile?.display_name || 'FixMyBuddy Provider' }),
      reportable: row.payment_status === 'unverified',
    },
    receiptAvailable: Boolean(row.receipt_available && row.payment_status === 'verified'),
    ...(row.initial_estimate ? { initialEstimate: row.initial_estimate } : {}),
    ...(row.repair_estimate ? { repairEstimate: row.repair_estimate } : {}),
    ...(row.approved_quote ? { approvedQuote: row.approved_quote } : {}),
    ...(row.pending_revision ? { pendingRevision: row.pending_revision } : {}),
    ...(row.decline_payable_estimate
      ? { declinePayableEstimate: row.decline_payable_estimate }
      : {}),
    ...(row.repair_approval_status
      ? { repairApprovalStatus: row.repair_approval_status }
      : {}),
    ...(row.revision_status ? { revisionStatus: row.revision_status } : {}),
    ...(row.inspection_status ? { inspectionStatus: row.inspection_status } : {}),
    sharing: {
      enabled: Boolean(row.sharing_enabled),
    },
    ...(mechanicState ? { mechanic: mechanicState } : {}),
    ...(towingState ? { towing: towingState } : {}),
    ...(reviewRow
      ? {
          review: {
            id: String(reviewRow.id),
            bookingId: String(row.id),
            rating: Number(reviewRow.rating),
            body: reviewRow.body || '',
            version: Number(reviewRow.version || 1),
          },
          canReview: true,
          canEditReview: true,
        }
      : {
          canReview: row.status === 'completed',
          canEditReview: row.status === 'completed',
        }),
    warranties: Array.isArray(row.warranties) ? row.warranties : [],
  };
}

function generatePdfBuffer(booking) {
  const text = `FixMyBuddy Verified Receipt | Ref: ${booking.reference} | Paid: PHP ${Number(booking.paid_amount || booking.quoted_amount).toFixed(2)}`;
  const stream = `BT /F1 13 Tf 40 730 Td (${text.replace(/[()\\]/g, '')}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

// GET /support/config (public)
customerRouter.get('/support/config', (_req, res) => {
  res.json({
    phone: process.env.SUPPORT_PHONE || '+639170000111',
    email: process.env.SUPPORT_EMAIL || 'support@fixmybuddy.ph',
  });
});

// Require an authenticated customer (or admin) for all /customers/me/* routes
customerRouter.use('/customers/me', requireAuth(['customer']));

// PATCH /customers/me
customerRouter.patch('/customers/me', async (req, res, next) => {
  try {
    const { name, emergencyContact } = req.body || {};
    const updates = [];
    const values = [];

    if (name !== undefined) {
      const cleanName = typeof name === 'string' ? name.trim() : '';
      if (cleanName.length < 2) {
        return res.status(400).json({ error: 'Enter your full name.' });
      }
      values.push(cleanName);
      updates.push(`name = $${values.length}`);
    }

    if (emergencyContact !== undefined) {
      if (emergencyContact === null) {
        updates.push(
          `emergency_contact_name = NULL, emergency_contact_phone = NULL, emergency_contact_relationship = NULL`,
        );
        // Revoke any active booking sharing when emergency contact is removed
        await query(
          `UPDATE bookings SET sharing_enabled = FALSE WHERE customer_id = $1`,
          [req.user.id],
        );
      } else {
        const cName = typeof emergencyContact.name === 'string' ? emergencyContact.name.trim() : '';
        const cPhone = normalizePhone(emergencyContact.phone);
        const cRel = typeof emergencyContact.relationship === 'string'
          ? emergencyContact.relationship.trim()
          : '';
        if (cName.length < 2 || !cPhone || !cRel) {
          return res.status(400).json({ error: 'Invalid emergency contact details.' });
        }
        if (cPhone === normalizePhone(req.user.phone || '')) {
          return res.status(400).json({ error: 'Choose someone other than yourself.' });
        }
        values.push(cName, cPhone, cRel);
        updates.push(
          `emergency_contact_name = $${values.length - 2}, emergency_contact_phone = $${values.length - 1}, emergency_contact_relationship = $${values.length}`,
        );
      }
    }

    if (updates.length === 0) {
      return res.json({ user: req.user });
    }

    values.push(req.user.id);
    const result = await query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING *`,
      values,
    );
    return res.json({ user: formatUser(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

// -----------------------------------------------------------------------------
// VEHICLES
// -----------------------------------------------------------------------------
customerRouter.get('/customers/me/vehicles', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM vehicles WHERE user_id = $1 ORDER BY created_at ASC`,
      [req.user.id],
    );
    return res.json({ vehicles: result.rows.map(formatVehicleRow) });
  } catch (error) {
    return next(error);
  }
});

customerRouter.post('/customers/me/vehicles', async (req, res, next) => {
  try {
    const { type, make, model, year, color, plate = '' } = req.body || {};
    if (!['car', 'motorcycle'].includes(type) || !make?.trim() || !model?.trim() || !color?.trim()) {
      return res.status(400).json({ error: 'Invalid vehicle details.' });
    }
    const cleanedPlate = cleanPlate(plate);
    const normPlate = normalizedPlateKey(plate);

    const result = await query(
      `INSERT INTO vehicles (user_id, type, make, model, year, color, plate, normalized_plate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.user.id,
        type,
        make.trim(),
        model.trim(),
        Number(year),
        color.trim(),
        cleanedPlate,
        normPlate,
      ],
    );
    return res.status(201).json({ vehicle: formatVehicleRow(result.rows[0]) });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A vehicle with this plate is already saved.' });
    }
    return next(error);
  }
});

customerRouter.patch('/customers/me/vehicles/:id', async (req, res, next) => {
  try {
    const { type, make, model, year, color, plate = '' } = req.body || {};
    const cleanedPlate = cleanPlate(plate);
    const normPlate = normalizedPlateKey(plate);

    const result = await query(
      `UPDATE vehicles
       SET type = $1, make = $2, model = $3, year = $4, color = $5,
           plate = $6, normalized_plate = $7, updated_at = NOW()
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [
        type,
        make?.trim(),
        model?.trim(),
        Number(year),
        color?.trim(),
        cleanedPlate,
        normPlate,
        req.params.id,
        req.user.id,
      ],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }
    return res.json({ vehicle: formatVehicleRow(result.rows[0]) });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A vehicle with this plate is already saved.' });
    }
    return next(error);
  }
});

customerRouter.delete('/customers/me/vehicles/:id', async (req, res, next) => {
  try {
    await query(
      `DELETE FROM vehicles WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id],
    );
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

// -----------------------------------------------------------------------------
// REMINDERS
// -----------------------------------------------------------------------------
function formatReminderRow(row) {
  return {
    id: String(row.id),
    title: row.title,
    vehicleId: String(row.vehicle_id),
    dueDate: row.due_date ? new Date(row.due_date).toISOString().slice(0, 10) : '',
    targetMileage: row.target_mileage != null ? Number(row.target_mileage) : null,
    currentMileage: row.current_mileage != null ? Number(row.current_mileage) : null,
    notes: row.notes || '',
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
  };
}

customerRouter.get('/customers/me/reminders', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM maintenance_reminders WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id],
    );
    return res.json({ reminders: result.rows.map(formatReminderRow) });
  } catch (error) {
    return next(error);
  }
});

customerRouter.post('/customers/me/reminders', async (req, res, next) => {
  try {
    const { title, vehicleId, dueDate, targetMileage, currentMileage, notes = '' } = req.body || {};
    const vehCheck = await query(
      `SELECT id FROM vehicles WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [vehicleId, req.user.id],
    );
    if (vehCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Vehicle does not belong to your account.' });
    }
    const result = await query(
      `INSERT INTO maintenance_reminders (
         user_id, vehicle_id, title, due_date, target_mileage, current_mileage, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.id,
        vehicleId,
        title.trim(),
        dueDate || null,
        targetMileage !== '' && targetMileage != null ? Number(targetMileage) : null,
        currentMileage !== '' && currentMileage != null ? Number(currentMileage) : null,
        notes,
      ],
    );
    return res.status(201).json({ reminder: formatReminderRow(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

customerRouter.patch('/customers/me/reminders/:id', async (req, res, next) => {
  try {
    const existingRes = await query(
      `SELECT * FROM maintenance_reminders WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [req.params.id, req.user.id],
    );
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Reminder not found.' });
    }
    const existing = existingRes.rows[0];
    const nextTitle = req.body.title !== undefined ? req.body.title.trim() : existing.title;
    const nextVehicleId = req.body.vehicleId !== undefined ? req.body.vehicleId : existing.vehicle_id;
    const nextDueDate = req.body.dueDate !== undefined ? req.body.dueDate || null : existing.due_date;
    const nextTarget =
      req.body.targetMileage !== undefined
        ? req.body.targetMileage !== '' && req.body.targetMileage != null
          ? Number(req.body.targetMileage)
          : null
        : existing.target_mileage;
    const nextCurrent =
      req.body.currentMileage !== undefined
        ? req.body.currentMileage !== '' && req.body.currentMileage != null
          ? Number(req.body.currentMileage)
          : null
        : existing.current_mileage;
    const nextNotes = req.body.notes !== undefined ? req.body.notes : existing.notes;
    const nextCompleted =
      req.body.completedAt !== undefined ? req.body.completedAt : existing.completed_at;

    const result = await query(
      `UPDATE maintenance_reminders
       SET title = $1, vehicle_id = $2, due_date = $3,
           target_mileage = $4, current_mileage = $5, notes = $6,
           completed_at = $7, updated_at = NOW()
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [
        nextTitle,
        nextVehicleId,
        nextDueDate,
        nextTarget,
        nextCurrent,
        nextNotes,
        nextCompleted,
        req.params.id,
        req.user.id,
      ],
    );
    return res.json({ reminder: formatReminderRow(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

customerRouter.delete('/customers/me/reminders/:id', async (req, res, next) => {
  try {
    await query(
      `DELETE FROM maintenance_reminders WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id],
    );
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

// -----------------------------------------------------------------------------
// BOOKINGS & ACTIVE SERVICE
// -----------------------------------------------------------------------------
customerRouter.get('/customers/me/bookings', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM bookings WHERE customer_id = $1 ORDER BY created_at DESC`,
      [req.user.id],
    );
    const bookings = [];
    for (const row of result.rows) {
      bookings.push(await formatBookingRow(row));
    }
    return res.json({ bookings });
  } catch (error) {
    return next(error);
  }
});

customerRouter.post('/customers/me/bookings', async (req, res, next) => {
  try {
    const {
      providerId,
      vehicleId,
      serviceType = 'mechanic',
      issueType = 'Roadside assistance',
      notes = '',
      landmark = '',
      location,
      destination,
      destinationShop,
      towingCondition,
      scheduledAt = null,
      estimateId,
      estimateVersion = 1,
      cancellationPolicyId = 'policy-standard-v1',
      repairsApproved,
    } = req.body || {};

    if (repairsApproved !== false) {
      return res.status(400).json({ error: 'Initial booking cannot pre-approve repairs.' });
    }
    if (!estimateId || !cancellationPolicyId) {
      return res.status(400).json({ error: 'Estimate and cancellation policy are required.' });
    }

    const vehRes = await query(
      `SELECT * FROM vehicles WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [vehicleId, req.user.id],
    );
    if (vehRes.rows.length === 0) {
      return res.status(403).json({ error: 'Selected vehicle does not belong to your account.' });
    }
    const veh = vehRes.rows[0];
    const vehicleLabel = `${veh.make} ${veh.model} · ${veh.year}`;

    const provRes = await query(
      `SELECT * FROM mechanic_profiles WHERE id = $1 LIMIT 1`,
      [providerId],
    );
    const prov = provRes.rows[0];
    const quotedAmount =
      serviceType === 'towing'
        ? 1250
        : Number(prov?.base_visit_fee || 300) + Number(prov?.diagnosis_fee || 150);

    const refNum = `${serviceType === 'towing' ? 'TOW' : 'FMB'}-${Math.floor(1000 + Math.random() * 9000)}`;
    const arrivalPin = generateNumericCode(4);
    const handoverPin = generateNumericCode(4);

    const visitEstimate = {
      id: String(estimateId),
      version: Number(estimateVersion || 1),
      currency: 'PHP',
      items:
        serviceType === 'towing'
          ? [
              { label: 'Flatbed dispatch & hook-up', amount: 1000 },
              { label: 'Distance charge', amount: 250 },
            ]
          : [
              { label: 'Roadside call-out', amount: Number(prov?.base_visit_fee || 300) },
              { label: 'On-site diagnosis', amount: Number(prov?.diagnosis_fee || 150) },
            ],
      total: quotedAmount,
    };

    const insertRes = await query(
      `INSERT INTO bookings (
         id, reference, version, customer_id, provider_id, vehicle_id, vehicle_label,
         service_type, issue_type, notes, landmark, pickup_address, pickup_lat, pickup_lng,
         destination_address, destination_shop, towing_condition,
         status, scheduled_at, estimate_id, estimate_version, quoted_amount,
         cancellation_policy_id, initial_estimate,
         arrival_pin_hash, arrival_pin_plain, arrival_pin_expires_at,
         handover_pin_hash, handover_pin_plain, handover_pin_expires_at,
         mechanic_state, towing_state
       )
       VALUES (
         $1, $1, 1, $2, $3, $4, $5,
         $6, $7, $8, $9, $10, $11, $12,
         $13, $14::jsonb, $15::jsonb,
         $16, $17, $18, $19, $20,
         $21, $22::jsonb,
         $23, $24, NOW() + INTERVAL '2 hours',
         $25, $26, NOW() + INTERVAL '4 hours',
         $27::jsonb, $28::jsonb
       )
       RETURNING *`,
      [
        refNum,
        req.user.id,
        providerId || 'PRO-0042',
        veh.id,
        vehicleLabel,
        serviceType,
        issueType,
        notes,
        landmark,
        location?.address || 'Pinned location',
        location?.latitude ?? null,
        location?.longitude ?? null,
        destination || null,
        destinationShop ? JSON.stringify(destinationShop) : null,
        towingCondition ? JSON.stringify(towingCondition) : null,
        scheduledAt ? 'scheduled' : 'requested',
        scheduledAt || null,
        String(estimateId),
        Number(estimateVersion || 1),
        quotedAmount,
        cancellationPolicyId,
        JSON.stringify(visitEstimate),
        hashToken(arrivalPin),
        arrivalPin,
        hashToken(handoverPin),
        handoverPin,
        JSON.stringify({
          status: 'requested',
          updatedAt: new Date().toISOString(),
          etaMinutes: 12,
          arrivalPinAvailable: true,
          timeline: [
            {
              id: 'confirmed',
              label: 'Booking requested',
              status: 'completed',
              at: new Date().toISOString(),
            },
            { id: 'dispatch', label: 'Awaiting mechanic dispatch', status: 'current' },
          ],
          updates: [],
        }),
        JSON.stringify({
          status: 'en_route',
          canConfirmHandover: false,
          handover: { requiresPin: true },
        }),
      ],
    );

    await query(
      `INSERT INTO notifications (user_id, booking_id, type, title, message)
       VALUES ($1, $2, 'booking_confirmed', $3, $4)`,
      [
        req.user.id,
        refNum,
        `Booking ${refNum} received`,
        `Your ${serviceType} request for ${vehicleLabel} has been sent to ${prov?.display_name || 'your provider'}.`,
      ],
    );

    const booking = await formatBookingRow(insertRes.rows[0]);
    return res.status(201).json({ booking });
  } catch (error) {
    return next(error);
  }
});

// POST /customers/me/bookings/:id/cancel & /reschedule
customerRouter.post('/customers/me/bookings/:id/:action(cancel|reschedule)', async (req, res, next) => {
  try {
    const { id, action } = req.params;
    const { cancellationPolicyId, scheduledAt, version } = req.body || {};
    const bookRes = await query(
      `SELECT * FROM bookings WHERE id = $1 AND customer_id = $2 LIMIT 1`,
      [id, req.user.id],
    );
    if (bookRes.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    const row = bookRes.rows[0];
    if (
      row.dispatched_at ||
      !['requested', 'pending', 'confirmed', 'accepted', 'scheduled'].includes(row.status) ||
      !cancellationPolicyId ||
      (version != null && Number(row.version) !== Number(version))
    ) {
      return res.status(409).json({ error: 'Booking cannot be modified in its current state.' });
    }

    if (action === 'cancel') {
      const updated = await query(
        `UPDATE bookings
         SET status = 'cancelled', version = version + 1, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id],
      );
      return res.json({ booking: await formatBookingRow(updated.rows[0]) });
    }

    if (!scheduledAt || Number.isNaN(Date.parse(scheduledAt)) || Date.parse(scheduledAt) <= Date.now()) {
      return res.status(400).json({ error: 'Choose a valid future schedule time.' });
    }
    const updated = await query(
      `UPDATE bookings
       SET status = 'scheduled', scheduled_at = $1, version = version + 1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [new Date(scheduledAt).toISOString(), id],
    );
    return res.json({ booking: await formatBookingRow(updated.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

// PATCH /customers/me/bookings/:id/sharing
customerRouter.patch('/customers/me/bookings/:id/sharing', async (req, res, next) => {
  try {
    const { enabled } = req.body || {};
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled boolean is required.' });
    }
    if (enabled && !req.user.emergencyContact) {
      return res.status(409).json({ error: 'Add an emergency contact before enabling trip sharing.' });
    }

    const updated = await query(
      `UPDATE bookings
       SET sharing_enabled = $1, version = version + 1, updated_at = NOW()
       WHERE id = $2 AND customer_id = $3
       RETURNING sharing_enabled`,
      [enabled, req.params.id, req.user.id],
    );
    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    return res.json({ sharing: { enabled: Boolean(updated.rows[0].sharing_enabled) } });
  } catch (error) {
    return next(error);
  }
});

// POST /customers/me/bookings/:id/quote-decision
customerRouter.post('/customers/me/bookings/:id/quote-decision', async (req, res, next) => {
  try {
    const { quoteId, quoteVersion, decision, bookingVersion } = req.body || {};
    const bookRes = await query(
      `SELECT * FROM bookings WHERE id = $1 AND customer_id = $2 LIMIT 1`,
      [req.params.id, req.user.id],
    );
    if (bookRes.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    const row = bookRes.rows[0];
    const isRevision = row.revision_status === 'awaiting_customer';
    const quote = isRevision ? row.pending_revision : row.repair_estimate;

    if (
      !quote ||
      quote.id !== quoteId ||
      Number(quote.version) !== Number(quoteVersion) ||
      !['approve', 'reject'].includes(decision) ||
      Number(row.version) !== Number(bookingVersion)
    ) {
      return res.status(409).json({ error: 'Quote or booking state changed.' });
    }

    const nextStatus = decision === 'approve' ? 'approved' : 'rejected';
    const nextApprovedQuote = decision === 'approve' ? quote : row.approved_quote;
    const nextQuotedAmount =
      decision === 'approve' ? Number(quote.total) : Number(row.quoted_amount);

    const updated = await query(
      `UPDATE bookings
       SET ${isRevision ? 'revision_status' : 'repair_approval_status'} = $1,
           approved_quote = $2::jsonb,
           quoted_amount = $3,
           repairs_approved = CASE WHEN $1 = 'approved' THEN TRUE ELSE repairs_approved END,
           version = version + 1,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [
        nextStatus,
        nextApprovedQuote ? JSON.stringify(nextApprovedQuote) : null,
        nextQuotedAmount,
        row.id,
      ],
    );

    const booking = await formatBookingRow(updated.rows[0]);
    return res.json({
      booking,
      decision: { quoteId: quote.id, quoteVersion: quote.version, decision },
    });
  } catch (error) {
    return next(error);
  }
});

// POST /customers/me/bookings/:id/repair-approval
customerRouter.post('/customers/me/bookings/:id/repair-approval', async (req, res, next) => {
  try {
    const updated = await query(
      `UPDATE bookings
       SET repair_approval_status = 'approved',
           approved_quote = COALESCE(repair_estimate, initial_estimate),
           repairs_approved = TRUE,
           version = version + 1,
           updated_at = NOW()
       WHERE id = $1 AND customer_id = $2
       RETURNING *`,
      [req.params.id, req.user.id],
    );
    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    return res.json({ booking: await formatBookingRow(updated.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

// POST /customers/me/bookings/:id/inspection-request
customerRouter.post('/customers/me/bookings/:id/inspection-request', async (req, res, next) => {
  try {
    const updated = await query(
      `UPDATE bookings
       SET inspection_status = 'requested', version = version + 1, updated_at = NOW()
       WHERE id = $1 AND customer_id = $2
       RETURNING *`,
      [req.params.id, req.user.id],
    );
    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    return res.json({ booking: await formatBookingRow(updated.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

// POST /customers/me/bookings/:id/payment-reports
customerRouter.post('/customers/me/bookings/:id/payment-reports', async (req, res, next) => {
  try {
    const { reference = '' } = req.body || {};
    const updated = await query(
      `UPDATE bookings
       SET payment_status = 'pending_verification',
           payment_reference = $1,
           version = version + 1,
           updated_at = NOW()
       WHERE id = $2 AND customer_id = $3
       RETURNING payment_status`,
      [String(reference).trim(), req.params.id, req.user.id],
    );
    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    return res.json({ payment: { status: 'pending_verification' } });
  } catch (error) {
    return next(error);
  }
});

// GET /customers/me/bookings/:id/receipt
customerRouter.get('/customers/me/bookings/:id/receipt', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM bookings WHERE id = $1 AND customer_id = $2 LIMIT 1`,
      [req.params.id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    const row = result.rows[0];
    if (row.payment_status !== 'verified' || !row.receipt_available) {
      return res.status(403).json({ error: 'Verified receipt is not available for this booking.' });
    }
    const pdf = generatePdfBuffer(row);
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(pdf);
  } catch (error) {
    return next(error);
  }
});

// PUT /customers/me/bookings/:id/review
customerRouter.put('/customers/me/bookings/:id/review', async (req, res, next) => {
  try {
    const { rating, body = '', clientId = '' } = req.body || {};
    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5 || body.length > 2000) {
      return res.status(400).json({ error: 'Provide a valid 1-5 star rating.' });
    }

    const bookRes = await query(
      `SELECT * FROM bookings WHERE id = $1 AND customer_id = $2 LIMIT 1`,
      [req.params.id, req.user.id],
    );
    if (bookRes.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    const booking = bookRes.rows[0];
    if (booking.status !== 'completed') {
      return res.status(409).json({ error: 'Reviews can only be submitted for completed bookings.' });
    }

    const result = await query(
      `INSERT INTO booking_reviews (booking_id, customer_id, provider_id, rating, body, version, client_id)
       VALUES ($1, $2, $3, $4, $5, 1, $6)
       ON CONFLICT (booking_id) DO UPDATE SET
         rating = EXCLUDED.rating,
         body = EXCLUDED.body,
         version = booking_reviews.version + 1,
         updated_at = NOW()
       RETURNING *`,
      [booking.id, req.user.id, booking.provider_id, numRating, String(body), String(clientId)],
    );

    const rev = result.rows[0];
    return res.json({
      review: {
        id: String(rev.id),
        bookingId: String(rev.booking_id),
        rating: Number(rev.rating),
        body: rev.body || '',
        version: Number(rev.version),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// GET /customers/me/bookings/:id/mechanic/arrival-pin
customerRouter.get('/customers/me/bookings/:id/mechanic/arrival-pin', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM bookings WHERE id = $1 AND customer_id = $2 LIMIT 1`,
      [req.params.id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    const row = result.rows[0];
    if (row.arrival_verified_at || !row.arrival_pin_plain) {
      return res.status(404).json({ error: 'Arrival PIN is no longer active.' });
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.json({
      bookingId: String(row.id),
      pin: String(row.arrival_pin_plain),
      expiresAt: row.arrival_pin_expires_at
        ? new Date(row.arrival_pin_expires_at).toISOString()
        : new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    return next(error);
  }
});

// GET & POST /customers/me/bookings/:id/:channel(mechanic|towing)/messages
customerRouter.get(
  '/customers/me/bookings/:id/:channel(mechanic|towing)/messages',
  async (req, res, next) => {
    try {
      const { id, channel } = req.params;
      const ownCheck = await query(
        `SELECT id FROM bookings WHERE id = $1 AND customer_id = $2 LIMIT 1`,
        [id, req.user.id],
      );
      if (ownCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Booking not found.' });
      }
      const msgRes = await query(
        `SELECT * FROM booking_messages
         WHERE booking_id = $1 AND channel = $2
         ORDER BY created_at ASC`,
        [id, channel],
      );
      return res.json({
        messages: msgRes.rows.map((m) => ({
          id: String(m.id),
          sender: m.sender,
          body: m.body,
          clientId: m.client_id,
          createdAt: new Date(m.created_at).toISOString(),
        })),
      });
    } catch (error) {
      return next(error);
    }
  },
);

customerRouter.post(
  '/customers/me/bookings/:id/:channel(mechanic|towing)/messages',
  async (req, res, next) => {
    try {
      const { id, channel } = req.params;
      const { body, clientId } = req.body || {};
      const cleanBody = typeof body === 'string' ? body.trim() : '';
      if (!cleanBody || cleanBody.length > 2000 || !clientId) {
        return res.status(400).json({ error: 'Message body and clientId are required.' });
      }
      const ownCheck = await query(
        `SELECT id FROM bookings WHERE id = $1 AND customer_id = $2 LIMIT 1`,
        [id, req.user.id],
      );
      if (ownCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Booking not found.' });
      }
      const inserted = await query(
        `INSERT INTO booking_messages (booking_id, channel, sender, body, client_id)
         VALUES ($1, $2, 'customer', $3, $4)
         ON CONFLICT (booking_id, channel, client_id) DO UPDATE SET body = EXCLUDED.body
         RETURNING *`,
        [id, channel, cleanBody, String(clientId)],
      );
      const m = inserted.rows[0];
      return res.status(201).json({
        message: {
          id: String(m.id),
          sender: m.sender,
          body: m.body,
          clientId: m.client_id,
          createdAt: new Date(m.created_at).toISOString(),
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

// POST /customers/me/bookings/:id/towing/handover
customerRouter.post('/customers/me/bookings/:id/towing/handover', async (req, res, next) => {
  try {
    let details = req.body?.details || req.body || {};
    if (typeof details === 'string') {
      details = JSON.parse(details);
    }
    const { condition, vehicleReceived, keysReceived, damageNotes = '', pin } = details;
    const bookRes = await query(
      `SELECT * FROM bookings WHERE id = $1 AND customer_id = $2 LIMIT 1`,
      [req.params.id, req.user.id],
    );
    if (bookRes.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    const row = bookRes.rows[0];
    if (
      !['no_new_damage', 'damage_reported'].includes(condition) ||
      vehicleReceived !== true ||
      keysReceived !== true
    ) {
      return res.status(409).json({ error: 'Invalid handover confirmation fields.' });
    }
    if (row.handover_pin_hash && pin && !verifyTokenHash(String(pin).trim(), row.handover_pin_hash)) {
      return res.status(409).json({ error: 'Invalid handover PIN.' });
    }

    const handover = {
      id: `HO-${row.id}`,
      status: 'confirmed',
      condition,
      damageNotes,
      keysReceived: true,
      vehicleReceived: true,
    };
    const nextTowingState = {
      ...(row.towing_state || {}),
      canConfirmHandover: false,
      handover,
    };

    await query(
      `UPDATE bookings
       SET towing_state = $1::jsonb,
           handover_pin_plain = NULL,
           version = version + 1,
           updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(nextTowingState), row.id],
    );

    return res.json({ handover });
  } catch (error) {
    return next(error);
  }
});

// -----------------------------------------------------------------------------
// UPDATES (NOTIFICATIONS), SUPPORT MESSAGES & DISPUTES
// -----------------------------------------------------------------------------
customerRouter.get('/customers/me/updates', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id],
    );
    return res.json({
      updates: result.rows.map((u) => ({
        id: String(u.id),
        type: u.type,
        title: u.title,
        message: u.message,
        bookingId: u.booking_id || undefined,
        read: Boolean(u.read),
        readAt: u.read_at ? new Date(u.read_at).toISOString() : null,
        createdAt: new Date(u.created_at).toISOString(),
      })),
    });
  } catch (error) {
    return next(error);
  }
});

customerRouter.post('/customers/me/updates/read', async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    if (ids.length === 0) return res.json({ readIds: [] });

    const result = await query(
      `UPDATE notifications
       SET read = TRUE, read_at = NOW()
       WHERE user_id = $1 AND id::text = ANY($2::text[])
       RETURNING id`,
      [req.user.id, ids],
    );
    return res.json({ readIds: result.rows.map((r) => String(r.id)) });
  } catch (error) {
    return next(error);
  }
});

customerRouter.get('/customers/me/support/messages', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM support_messages WHERE user_id = $1 ORDER BY created_at ASC`,
      [req.user.id],
    );
    return res.json({
      messages: result.rows.map((m) => ({
        id: String(m.id),
        sender: m.sender,
        body: m.body,
        clientId: m.client_id,
        createdAt: new Date(m.created_at).toISOString(),
      })),
    });
  } catch (error) {
    return next(error);
  }
});

customerRouter.post('/customers/me/support/messages', async (req, res, next) => {
  try {
    const { body, clientId } = req.body || {};
    const cleanBody = typeof body === 'string' ? body.trim() : '';
    if (!cleanBody || cleanBody.length > 2000 || !clientId) {
      return res.status(400).json({ error: 'Message body and clientId are required.' });
    }
    const result = await query(
      `INSERT INTO support_messages (user_id, sender, body, client_id)
       VALUES ($1, 'customer', $2, $3)
       ON CONFLICT (user_id, client_id) DO UPDATE SET body = EXCLUDED.body
       RETURNING *`,
      [req.user.id, cleanBody, String(clientId)],
    );
    const m = result.rows[0];
    return res.status(201).json({
      message: {
        id: String(m.id),
        sender: m.sender,
        body: m.body,
        clientId: m.client_id,
        createdAt: new Date(m.created_at).toISOString(),
      },
    });
  } catch (error) {
    return next(error);
  }
});

customerRouter.get('/customers/me/disputes', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM disputes WHERE user_id = $1 ORDER BY updated_at DESC`,
      [req.user.id],
    );
    return res.json({
      disputes: result.rows.map((d) => ({
        id: String(d.id),
        reference: d.reference,
        bookingId: d.booking_id || undefined,
        reason: d.reason,
        subject: d.subject,
        description: d.description,
        amountInQuestion: d.amount_in_question != null ? Number(d.amount_in_question) : null,
        currency: d.currency,
        status: d.status,
        updatedAt: new Date(d.updated_at).toISOString(),
      })),
    });
  } catch (error) {
    return next(error);
  }
});

customerRouter.post('/customers/me/disputes', async (req, res, next) => {
  try {
    let details = req.body?.details || req.body || {};
    if (typeof details === 'string') {
      details = JSON.parse(details);
    }
    const {
      bookingId = null,
      reason = 'service',
      subject = '',
      description = '',
      amountInQuestion = null,
      clientId = crypto.randomUUID(),
    } = details;

    if (!subject.trim() || !description.trim()) {
      return res.status(400).json({ error: 'Subject and description are required.' });
    }

    const ref = `CL-${Math.floor(100 + Math.random() * 900)}`;
    const result = await query(
      `INSERT INTO disputes (
         reference, user_id, booking_id, reason, subject, description,
         amount_in_question, status, client_id, evidence
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'submitted', $8, $9::jsonb)
       ON CONFLICT (user_id, client_id) DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [
        ref,
        req.user.id,
        bookingId || null,
        reason,
        subject.trim(),
        description.trim(),
        amountInQuestion != null && amountInQuestion !== '' ? Number(amountInQuestion) : null,
        String(clientId),
        JSON.stringify(req.evidenceFiles || []),
      ],
    );

    const d = result.rows[0];
    return res.status(201).json({
      dispute: {
        id: String(d.id),
        reference: d.reference,
        bookingId: d.booking_id || undefined,
        reason: d.reason,
        subject: d.subject,
        description: d.description,
        amountInQuestion: d.amount_in_question != null ? Number(d.amount_in_question) : null,
        currency: d.currency,
        status: d.status,
        updatedAt: new Date(d.updated_at).toISOString(),
      },
    });
  } catch (error) {
    return next(error);
  }
});
