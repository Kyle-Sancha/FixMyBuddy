import { Router } from 'express';
import { query } from '../db/pool.js';
import { haversineKm } from '../utils/validation.js';

export const providerRouter = Router();

function buildVisitEstimate(profile, serviceType = 'mechanic', distanceKm = 2.4) {
  const baseFee = Number(profile.base_visit_fee || 300);
  const diagFee = Number(profile.diagnosis_fee || 150);
  const items =
    serviceType === 'towing'
      ? [
          { label: 'Flatbed dispatch & hook-up', amount: 1000 },
          {
            label: `Distance charge (${Math.max(1, Math.round(distanceKm))} km)`,
            amount: Math.max(1, Math.round(distanceKm)) * 100,
          },
        ]
      : [
          { label: 'Roadside call-out', amount: baseFee },
          { label: 'On-site diagnosis', amount: diagFee },
        ];
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  return {
    id: `EST-${profile.id}-${serviceType.toUpperCase()}`,
    version: 1,
    currency: 'PHP',
    items,
    total,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };
}

async function formatProviderRecord(profile, { location, request } = {}) {
  const distanceKm =
    haversineKm(
      Number(location?.latitude),
      Number(location?.longitude),
      Number(profile.latitude),
      Number(profile.longitude),
    ) ?? 2.4;
  const etaMinutes = Math.max(6, Math.round(distanceKm * 4.5));
  const serviceType = request?.serviceType === 'towing' ? 'towing' : 'mechanic';
  const estimate = buildVisitEstimate(profile, serviceType, distanceKm);

  const policyRes = await query(
    `SELECT id, text FROM cancellation_policies WHERE id = $1 LIMIT 1`,
    [profile.cancellation_policy_id || 'policy-standard-v1'],
  );
  const cancellationPolicy = policyRes.rows[0] || {
    id: 'policy-standard-v1',
    text: 'Free cancellation before provider dispatch. Once the provider is en route, the call-out fee may apply.',
  };

  const reviewsRes = await query(
    `SELECT r.id, r.rating, r.body AS text, r.created_at, u.name AS author_name
     FROM booking_reviews r
     JOIN users u ON u.id = r.customer_id
     WHERE r.provider_id = $1
     ORDER BY r.created_at DESC
     LIMIT 10`,
    [profile.id],
  );

  const record = {
    id: String(profile.id),
    name: profile.display_name,
    verified: Boolean(profile.verified),
    rating: Number(profile.rating || 5),
    reviewsCount: Number(profile.reviews_count || 0),
    jobsCompleted: Number(profile.jobs_completed || 0),
    distanceKm,
    etaMinutes,
    specialties: Array.isArray(profile.specialties) ? profile.specialties : [],
    credentials: Array.isArray(profile.credentials) ? profile.credentials : [],
    ...(profile.latitude != null && profile.longitude != null
      ? { latitude: Number(profile.latitude), longitude: Number(profile.longitude) }
      : {}),
    estimate,
    cancellationPolicy: {
      id: String(cancellationPolicy.id),
      text: cancellationPolicy.text,
    },
    customerReviews: reviewsRes.rows.map((r) => ({
      id: String(r.id),
      authorName: r.author_name || 'Customer',
      rating: Number(r.rating),
      createdAt: new Date(r.created_at).toISOString(),
      text: r.text || '',
    })),
  };

  if (serviceType === 'towing') {
    record.towingQuote = {
      routeId: `ROUTE-${profile.id}`,
      version: 1,
      distanceKm: Math.max(1, distanceKm),
      pickupAddress: location?.address || 'Pickup location',
      destinationAddress: request?.destination || 'Repair shop destination',
      equipment: profile.flatbed_capability ? `Flatbed (${profile.flatbed_capability})` : 'Wheel-lift tow truck',
    };
  }

  return record;
}

// POST /providers/search
providerRouter.post('/providers/search', async (req, res, next) => {
  try {
    const { location, filters = {}, ...requestFields } = req.body || {};
    const radiusKm = Number(filters.radiusKm || 15);
    const minimumRating = Number(filters.minimumRating || 0);
    const verifiedOnly = Boolean(filters.verifiedOnly);
    const specialty = typeof filters.specialty === 'string' ? filters.specialty.trim() : '';
    const maximumVisitPrice =
      filters.maximumVisitPrice !== '' && filters.maximumVisitPrice != null
        ? Number(filters.maximumVisitPrice)
        : null;

    const result = await query(
      `SELECT * FROM mechanic_profiles WHERE online = TRUE ORDER BY rating DESC, jobs_completed DESC`,
    );

    const formatted = [];
    for (const profile of result.rows) {
      if (verifiedOnly && !profile.verified) continue;
      if (Number(profile.rating || 0) < minimumRating) continue;
      if (
        specialty &&
        Array.isArray(profile.specialties) &&
        !profile.specialties.some((s) => s.toLowerCase() === specialty.toLowerCase())
      ) {
        continue;
      }
      const item = await formatProviderRecord(profile, {
        location,
        request: requestFields,
      });
      if (item.distanceKm > radiusKm) continue;
      if (maximumVisitPrice !== null && item.estimate.total > maximumVisitPrice) continue;
      formatted.push(item);
    }

    const sort = filters.sort || 'eta';
    formatted.sort((a, b) => {
      if (sort === 'price') return a.estimate.total - b.estimate.total;
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'distance') return a.distanceKm - b.distanceKm;
      return a.etaMinutes - b.etaMinutes;
    });

    return res.json({
      providers: formatted,
      recommendedProviderId: formatted[0]?.id || null,
    });
  } catch (error) {
    return next(error);
  }
});

// POST /providers/:id/quote
providerRouter.post('/providers/:id/quote', async (req, res, next) => {
  try {
    const providerId = String(req.params.id);
    const result = await query(
      `SELECT * FROM mechanic_profiles WHERE id = $1 LIMIT 1`,
      [providerId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found.' });
    }
    const provider = await formatProviderRecord(result.rows[0], {
      location: req.body?.location,
      request: req.body?.request,
    });
    return res.json({ provider });
  } catch (error) {
    return next(error);
  }
});

// POST /repair-shops/search
providerRouter.post('/repair-shops/search', async (req, res, next) => {
  try {
    const { location, vehicleType, radiusKm = 15 } = req.body || {};
    const result = await query(
      `SELECT * FROM repair_shops WHERE active = TRUE ORDER BY name ASC`,
    );

    const shops = [];
    for (const row of result.rows) {
      if (
        vehicleType &&
        Array.isArray(row.vehicle_types) &&
        !row.vehicle_types.includes(vehicleType)
      ) {
        continue;
      }
      const dist = haversineKm(
        Number(location?.latitude),
        Number(location?.longitude),
        Number(row.latitude),
        Number(row.longitude),
      );
      if (dist !== null && dist > Number(radiusKm || 30)) continue;
      shops.push({
        id: String(row.id),
        name: row.name,
        address: row.address,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        ...(dist !== null ? { distanceKm: dist } : { distanceKm: 2.0 }),
      });
    }

    return res.json({ shops });
  } catch (error) {
    return next(error);
  }
});
