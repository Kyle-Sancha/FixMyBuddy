import process from 'node:process';
import { query, withTransaction } from './pool.js';
import { hashPassword, hashToken } from '../utils/crypto.js';

async function seed() {
  console.log('Seeding FixMyBuddy initial data...');
  const customerPass = await hashPassword('Customer123');
  const mechanicPass = await hashPassword('Mechanic123');

  await withTransaction(async (client) => {
    // 1. Default cancellation policy
    await client.query(
      `INSERT INTO cancellation_policies (id, text, active)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text`,
      [
        'policy-standard-v1',
        'Free cancellation before provider dispatch. Once the provider is en route, the call-out fee may apply.',
      ],
    );

    // 2. Demo Customer Account (Alex Reyes)
    const customerRes = await client.query(
      `INSERT INTO users (
         role, name, email, phone, phone_verified, password_hash,
         accepted_terms, accepted_terms_at,
         emergency_contact_name, emergency_contact_phone, emergency_contact_relationship
       )
       VALUES ($1, $2, $3, $4, TRUE, $5, TRUE, NOW(), $6, $7, $8)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         phone = EXCLUDED.phone,
         phone_verified = TRUE
       RETURNING id`,
      [
        'customer',
        'Alex Reyes',
        'alex.reyes@example.com',
        '+639171234567',
        customerPass,
        'Jamie Reyes',
        '+639179876543',
        'Sibling',
      ],
    );
    const customerId = customerRes.rows[0].id;

    // 3. Demo Mechanic Account (Miguel Santos)
    const mechanicRes = await client.query(
      `INSERT INTO users (
         role, name, email, phone, phone_verified, password_hash,
         accepted_terms, accepted_terms_at
       )
       VALUES ($1, $2, $3, $4, TRUE, $5, TRUE, NOW())
       ON CONFLICT (email) DO UPDATE SET
         role = 'mechanic',
         name = EXCLUDED.name,
         phone = EXCLUDED.phone,
         phone_verified = TRUE
       RETURNING id`,
      [
        'mechanic',
        'Miguel Santos',
        'miguel.santos@example.com',
        '+639175550142',
        mechanicPass,
      ],
    );
    const mechanicUserId = mechanicRes.rows[0].id;

    // 4. Mechanic Profile (PRO-0042)
    await client.query(
      `INSERT INTO mechanic_profiles (
         id, user_id, display_name, verified, online, rating, reviews_count,
         jobs_completed, service_radius_km, working_hours, flatbed_capability,
         specialties, credentials, base_visit_fee, diagnosis_fee,
         latitude, longitude, position_updated_at, cancellation_policy_id
       )
       VALUES (
         'PRO-0042', $1, 'Miguel Santos', TRUE, TRUE, 4.90, 28,
         142, 15, 'Mon–Sat · 8 AM–6 PM', 'FMB-08',
         ARRAY['Battery', 'Flat tire', 'Overheating', 'Not starting', 'Towing'],
         ARRAY['TESDA Automotive Servicing NC II', 'Verified Roadside Partner'],
         300.00, 150.00, 13.6218, 123.1948, NOW(), 'policy-standard-v1'
       )
       ON CONFLICT (id) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         online = TRUE,
         verified = TRUE`,
      [mechanicUserId],
    );

    // 5. Customer Vehicle (Toyota Vios)
    const vehicleRes = await client.query(
      `INSERT INTO vehicles (
         user_id, type, make, model, year, color, plate, normalized_plate
       )
       VALUES ($1, 'car', 'Toyota', 'Vios', 2021, 'Silver', 'ABC 1234', 'ABC1234')
       ON CONFLICT (user_id, normalized_plate) WHERE normalized_plate <> ''
       DO UPDATE SET color = EXCLUDED.color
       RETURNING id`,
      [customerId],
    );
    const vehicleId = vehicleRes.rows[0].id;

    // 6. Nearby Repair Shops in Naga City
    const shops = [
      ['shop-naga-autocare', 'Naga AutoCare Center', 'Panganiban Drive, Naga City', 13.6245, 123.1965],
      ['shop-bicol-motorworks', 'Bicol Motorworks & Tire', 'Magsaysay Avenue, Naga City', 13.6312, 123.1998],
      ['shop-mabolo-garage', 'Mabolo Service Bay', 'Mabolo Road, Naga City', 13.6178, 123.1882],
    ];
    for (const [id, name, address, lat, lng] of shops) {
      await client.query(
        `INSERT INTO repair_shops (id, name, address, latitude, longitude, active)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address`,
        [id, name, address, lat, lng],
      );
    }

    // 7. Sample Active Offer Booking (FMB-1042)
    const visitEstimate = {
      id: 'EST-1042',
      version: 1,
      currency: 'PHP',
      items: [
        { label: 'Roadside call-out', amount: 300 },
        { label: 'On-site diagnosis', amount: 150 },
      ],
      total: 450,
    };

    await client.query(
      `INSERT INTO bookings (
         id, reference, version, customer_id, provider_id, vehicle_id, vehicle_label,
         service_type, issue_type, notes, landmark, pickup_address, pickup_lat, pickup_lng,
         status, estimate_id, estimate_version, quoted_amount, cancellation_policy_id,
         initial_estimate, arrival_pin_hash, arrival_pin_plain, arrival_pin_expires_at,
         handover_pin_hash, handover_pin_plain, handover_pin_expires_at, mechanic_state
       )
       VALUES (
         'FMB-1042', 'FMB-1042', 1, $1, 'PRO-0042', $2, 'Toyota Vios · 2021',
         'mechanic', 'Battery', 'Clicking, won’t start', 'Mabolo Barangay Hall',
         'Mabolo Road, Naga City', 13.6185, 123.1895,
         'requested', 'EST-1042', 1, 450.00, 'policy-standard-v1',
         $3::jsonb, $4, '4826', NOW() + INTERVAL '2 hours',
         $5, '7152', NOW() + INTERVAL '4 hours',
         $6::jsonb
       )
       ON CONFLICT (id) DO NOTHING`,
      [
        customerId,
        vehicleId,
        JSON.stringify(visitEstimate),
        hashToken('4826'),
        hashToken('7152'),
        JSON.stringify({
          status: 'en_route',
          updatedAt: new Date().toISOString(),
          etaMinutes: 12,
          arrivalPinAvailable: true,
          timeline: [
            { id: 'confirmed', label: 'Booking confirmed', status: 'completed', at: new Date().toISOString() },
            { id: 'travel', label: 'Mechanic on the way', status: 'current' },
            { id: 'arrival', label: 'Arrival and inspection', status: 'upcoming' },
          ],
          updates: [],
        }),
      ],
    );
  });

  const countRes = await query('SELECT COUNT(*)::int AS total FROM users');
  console.log(`Seed complete. Total users in database: ${countRes.rows[0].total}`);
  console.log('Demo logins:');
  console.log('  Customer -> alex.reyes@example.com / Customer123 (or +639171234567)');
  console.log('  Mechanic -> miguel.santos@example.com / Mechanic123 (or +639175550142)');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exit(1);
  });
