// Isolated browser-test fixture. Never imported by the application.
import http from 'node:http';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const origin = 'http://127.0.0.1:5184';
const estimate = { id: 'test-quote', version: 1, currency: 'PHP', items: [{ label: 'Test call-out', amount: 300 }, { label: 'Test diagnosis', amount: 125.5 }], total: 425.5 };
const provider = { id: 'test-provider', name: 'QA fixture provider (test only)', verified: true, rating: 4.7, reviewsCount: 1, distanceKm: 2, etaMinutes: 10, specialties: ['Battery'], jobsCompleted: 1, credentials: ['Test credential only'], estimate, cancellationPolicy: { id: 'test-policy', text: 'Test-only terms. No real booking or payment is made in this isolated preview.' }, customerReviews: [{ id: 'test-review', authorName: 'QA review', rating: 5, text: 'Test review content, not a real customer review.' }] };
const vehicle = { id: 'test-vehicle', make: 'QA', model: 'Fixture vehicle', year: 2024, type: 'car', color: 'Test', plate: '' };
let sessionUser = { id: 'test-customer', name: 'QA fixture customer', phoneVerified: true, emergencyContact: { name: 'QA trusted contact', phone: '+639170000000', relationship: 'Friend' } };
const supportMessages = [];
const disputes = [];
const qaTime = new Date().toISOString();
const qaMechanic = { id: 'qa-mechanic', name: 'QA mechanic (test only)', chatEnabled: true, verified: true, rating: 4.7, reviewsCount: 1 };
const qaRepair = { id: 'qa-repair-quote', version: 1, currency: 'PHP', total: 425.5, items: [{ label: 'QA test repair only', amount: 425.5 }] };
const qaRevision = { id: 'qa-revision', version: 2, currency: 'PHP', total: 475.5, items: [{ label: 'QA test repair only', amount: 425.5 }, { label: 'QA additional work only', amount: 50 }], baseQuoteId: qaRepair.id, baseQuoteVersion: qaRepair.version };
const bookings = [
  { id: 'qa-active-mechanic', version: 1, reference: 'QA-ACTIVE', serviceType: 'mechanic', issueType: 'QA active service (test only)', status: 'en_route', providerName: qaMechanic.name, mechanic: { status: 'en_route', provider: qaMechanic, updatedAt: qaTime, etaMinutes: 10, arrivalPinAvailable: true, timeline: [{ id: 'qa-confirmed', label: 'QA booking confirmed', status: 'completed', at: qaTime }, { id: 'qa-travel', label: 'QA mechanic on the way', status: 'current' }, { id: 'qa-arrival', label: 'QA arrival and inspection', status: 'upcoming' }] } },
  { id: 'qa-repair-review', version: 1, reference: 'QA-REPAIR', serviceType: 'mechanic', issueType: 'QA repair approval (test only)', status: 'in_progress', repairApprovalStatus: 'awaiting_customer', repairEstimate: qaRepair, mechanic: { status: 'awaiting_approval', provider: qaMechanic, updatedAt: qaTime, diagnosis: { summary: 'QA test findings only. No real diagnosis.', createdAt: qaTime }, timeline: [{ id: 'qa-diagnosis', label: 'QA diagnosis completed', status: 'completed', at: qaTime }, { id: 'qa-approval', label: 'QA customer decision', status: 'current' }] } },
  { id: 'qa-extra-review', version: 1, reference: 'QA-EXTRA', serviceType: 'mechanic', issueType: 'QA extra work (test only)', status: 'in_progress', repairApprovalStatus: 'approved', approvedQuote: qaRepair, pendingRevision: qaRevision, revisionStatus: 'awaiting_customer', mechanic: { status: 'awaiting_approval', workPaused: true, provider: qaMechanic, updatedAt: qaTime, timeline: [{ id: 'qa-extra', label: 'QA additional work requires a decision', status: 'current' }], updates: [{ id: 'qa-findings', title: 'QA additional finding', body: 'QA-only example. Nothing has been repaired or charged.', createdAt: qaTime }] } },
  { id: 'qa-repair-progress', version: 1, reference: 'QA-PROGRESS', serviceType: 'mechanic', issueType: 'QA repair progress (test only)', status: 'in_progress', repairApprovalStatus: 'approved', approvedQuote: qaRepair, mechanic: { status: 'repairing', provider: qaMechanic, updatedAt: qaTime, timeline: [{ id: 'qa-approved', label: 'QA repair approved', status: 'completed', at: qaTime }, { id: 'qa-working', label: 'QA repair being performed', status: 'current' }, { id: 'qa-final', label: 'QA final test', status: 'upcoming' }], updates: [{ id: 'qa-update', title: 'QA repair update', body: 'This is an isolated test update, not a real service.', createdAt: qaTime }] } },
  { id: 'test-tow-handover', version: 1, serviceType: 'towing', issueType: 'Breakdown', vehicleId: vehicle.id, status: 'in_progress', towing: { status: 'at_destination', canConfirmHandover: true, destinationAddress: 'QA test destination', provider: { name: 'QA towing provider (test only)', chatEnabled: true }, handover: { requiresPin: true } } },
  { id: 'history-upcoming', version: 1, reference: 'QA-UPCOMING', serviceType: 'mechanic', issueType: 'QA scheduled service', vehicleId: vehicle.id, vehicleLabel: 'QA fixture vehicle', providerName: provider.name, scheduledAt: '2027-01-20T02:00:00Z', status: 'scheduled', quotedAmount: 425.5, canCancel: true, canReschedule: true, cancellationPolicy: provider.cancellationPolicy, payment: { status: 'unverified' } },
  { id: 'history-completed', version: 1, reference: 'QA-COMPLETED', serviceType: 'towing', issueType: 'QA completed towing', vehicleId: vehicle.id, vehicleLabel: 'QA fixture vehicle', providerName: provider.name, createdAt: '2026-10-20T02:00:00Z', status: 'completed', paidAmount: 425.5, quotedAmount: 425.5, receiptAvailable: true, payment: { status: 'verified' } },
  { id: 'history-dispatched', serviceType: 'mechanic', issueType: 'QA dispatched service', vehicleId: vehicle.id, status: 'en_route', dispatchedAt: '2026-10-25T01:00:00Z', canCancel: true, canReschedule: true, payment: { status: 'unverified' } },
];
let reminders = [];
const updates = [{ id: 'test-update', type: 'booking_confirmed', title: 'QA booking update', message: 'Isolated test notification, not a real booking.', bookingId: 'history-upcoming', createdAt: '2026-10-25T01:00:00Z', read: false }];
const towingMessages = [];
const mechanicConversations = new Map();
function receiptFixture() {
  const stream = 'BT /F1 16 Tf 40 730 Td (TEST ONLY - NOT A REAL RECEIPT) Tj ET';
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>', `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  return pdf + `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
}
let lastSearch = null;
const api = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks);
  let body = {};
  let evidence = [];
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    const form = await new Response(raw, { headers: { 'Content-Type': req.headers['content-type'] } }).formData();
    body = JSON.parse(form.get('details'));
    evidence = form.getAll('evidence').map(file => ({ name: file.name, size: file.size }));
  } else if (raw.length) body = JSON.parse(raw.toString());
  let result;
  if (req.url === '/customers/me/bookings/history-completed/receipt') { res.setHeader('Content-Type', 'application/pdf'); res.end(receiptFixture()); return; }
  if (req.url === '/auth/session') result = { user: sessionUser };
  else if (req.url.endsWith('/mechanic/arrival-pin')) {
    const booking = bookings.find(item => item.id === req.url.split('/')[4]);
    if (!booking?.mechanic?.arrivalPinAvailable) { res.writeHead(404).end(); return; }
    res.setHeader('Cache-Control', 'no-store');
    result = { bookingId: booking.id, pin: 'QA1234', expiresAt: new Date(Date.now() + 300000).toISOString() };
  }
  else if (req.url.endsWith('/mechanic/messages')) {
    const booking = bookings.find(item => item.id === req.url.split('/')[4]);
    if (!booking?.mechanic?.provider?.chatEnabled) { res.writeHead(404).end(); return; }
    if (!mechanicConversations.has(booking.id)) mechanicConversations.set(booking.id, []);
    const conversation = mechanicConversations.get(booking.id);
    if (req.method === 'GET') result = { messages: conversation };
    else {
      let message = conversation.find(item => item.clientId === body.clientId);
      if (!message) { message = { id: 'qa-message-' + conversation.length, sender: 'customer', body: body.body, clientId: body.clientId, createdAt: new Date().toISOString() }; conversation.push(message); }
      result = { message };
    }
  }
  else if (req.url.endsWith('/quote-decision')) {
    const booking = bookings.find(item => item.id === req.url.split('/')[4]);
    const revision = booking?.revisionStatus === 'awaiting_customer';
    const quote = revision ? booking.pendingRevision : booking?.repairEstimate;
    if (!quote || quote.id !== body.quoteId || quote.version !== body.quoteVersion || !['approve','reject'].includes(body.decision) || booking.version !== body.bookingVersion) { res.writeHead(409).end(); return; }
    booking[revision ? 'revisionStatus' : 'repairApprovalStatus'] = body.decision === 'approve' ? 'approved' : 'rejected';
    if (body.decision === 'approve') booking.approvedQuote = quote;
    if (booking.mechanic) {
      booking.mechanic.status = 'awaiting_provider';
      booking.mechanic.updatedAt = new Date().toISOString();
      booking.mechanic.timeline = [...(booking.mechanic.timeline || []).map(step => step.status === 'current' ? { ...step, status: 'completed', at: booking.mechanic.updatedAt } : step), { id: 'qa-provider-next', label: 'QA waiting for provider update', status: 'current' }];
    }
    booking.version += 1;
    result = { booking, decision: { quoteId: quote.id, quoteVersion: quote.version, decision: body.decision } };
  }
  else if (req.url === '/repair-shops/search') result = { shops: [{ id: 'qa-repair-shop', name: 'QA repair shop (test only)', address: 'QA test destination address', latitude: 13.62, longitude: 123.19, distanceKm: 2 }] };
  else if (req.url.endsWith('/towing/handover')) {
    const booking = bookings.find(item => item.id === req.url.split('/')[4]);
    if (!booking || booking.towing.status !== 'at_destination' || body.pin !== 'QA-TEST-PIN' || !body.vehicleReceived || !body.keysReceived) { res.writeHead(409).end(); return; }
    booking.towing.handover = { id: 'test-handover', status: 'confirmed', condition: body.condition, damageNotes: body.damageNotes, keysReceived: true, vehicleReceived: true };
    booking.towing.canConfirmHandover = false;
    result = { handover: booking.towing.handover };
  }
  else if (req.url.endsWith('/towing/messages') && req.method === 'GET') result = { messages: towingMessages };
  else if (req.url.endsWith('/towing/messages')) { const message = { id: 'test-tow-message-' + towingMessages.length, body: body.body, sender: 'customer' }; towingMessages.push(message); result = { message }; }
  else if (req.url === '/auth/logout') { sessionUser = null; res.writeHead(204).end(); return; }
  else if (req.url === '/customers/me') { Object.assign(sessionUser, body); result = { user: sessionUser }; }
  else if (req.url === '/support/config') result = { phone: '', email: '' };
  else if (req.url === '/customers/me/support/messages' && req.method === 'GET') result = { messages: supportMessages };
  else if (req.url === '/customers/me/support/messages') { let message = supportMessages.find(item => item.clientId === body.clientId); if (!message) { message = { id: 'test-message-' + supportMessages.length, sender: 'customer', body: body.body, clientId: body.clientId, createdAt: new Date().toISOString() }; supportMessages.push(message); } result = { message }; }
  else if (req.url === '/customers/me/disputes' && req.method === 'GET') result = { disputes };
  else if (req.url === '/customers/me/disputes') { let dispute = disputes.find(item => item.clientId === body.clientId); if (!dispute) { dispute = { ...body, id: 'test-case-' + disputes.length, status: 'submitted', evidence, updatedAt: new Date().toISOString() }; disputes.push(dispute); } result = { dispute }; }
  else if (req.url.endsWith('/sharing')) { const booking = bookings.find(item => item.id === req.url.split('/')[4]); booking.sharing = { enabled: body.enabled }; result = { sharing: booking.sharing }; }
  else if (req.url === '/customers/me/vehicles') result = { vehicles: [vehicle] };
  else if (req.url === '/customers/me/updates') result = { updates };
  else if (req.url === '/customers/me/updates/read') { for (const item of updates) if (body.ids.includes(item.id)) item.read = true; result = { readIds: body.ids }; }
  else if (req.url === '/customers/me/reminders' && req.method === 'GET') result = { reminders };
  else if (req.url === '/customers/me/reminders' && req.method === 'POST') { const reminder = { ...body, id: 'test-reminder' }; reminders.push(reminder); result = { reminder }; }
  else if (req.url.startsWith('/customers/me/reminders/')) { const id = req.url.split('/').pop(); if (req.method === 'DELETE') { reminders = reminders.filter(item => item.id !== id); res.writeHead(204).end(); return; } const reminder = reminders.find(item => item.id === id); Object.assign(reminder, body); result = { reminder }; }
  else if (/\/customers\/me\/bookings\/[^/]+\/(cancel|reschedule)$/.test(req.url)) {
    const parts = req.url.split('/'); const booking = bookings.find(item => item.id === parts[4]);
    if (!booking || booking.dispatchedAt || !body.cancellationPolicyId) { res.writeHead(409).end(); return; }
    if (parts[5] === 'cancel') booking.status = 'cancelled'; else booking.scheduledAt = body.scheduledAt;
    booking.version += 1; result = { booking };
  }
  else if (req.url === '/providers/search') {
    lastSearch = body;
    const filters = body.filters || {};
    const visible = (!filters.specialty || filters.specialty === 'Battery') && Number(filters.radiusKm || 5) >= 2 && (filters.maximumVisitPrice === '' || filters.maximumVisitPrice == null || Number(filters.maximumVisitPrice) >= estimate.total);
    result = { providers: visible ? [provider] : [], recommendedProviderId: visible ? provider.id : null };
  } else if (req.url === '/providers/test-provider/quote') result = { provider };
  else if (req.url === '/customers/me/bookings' && req.method === 'POST') {
    if (body.estimateId !== estimate.id || body.cancellationPolicyId !== provider.cancellationPolicy.id || body.repairsApproved !== false) { res.writeHead(400).end(); return; }
    const booking = { ...body, id: 'test-booking', providerName: provider.name, vehicleLabel: 'QA Fixture vehicle', status: 'requested', quotedAmount: estimate.total, payment: { status: 'unverified' }, repairApprovalStatus: 'awaiting_customer', repairEstimate: { ...estimate, id: 'test-repair' } };
    bookings.push(booking); result = { booking };
  } else if (req.url === '/customers/me/bookings') result = { bookings };
  else if (req.url === '/customers/me/bookings/test-booking/repair-approval') { bookings[0].repairApprovalStatus = 'approved'; result = { booking: bookings[0] }; }
  else if (req.url === '/test-state') result = { lastSearch, bookings, reminders, updates };
  else { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(result));
});
api.listen(5984, '127.0.0.1');
process.env.VITE_API_BASE_URL = 'http://127.0.0.1:5984';
const vite = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { host: '127.0.0.1', port: 5184, strictPort: true } });
await vite.listen();
console.log('TEST ONLY: http://127.0.0.1:5184. No production data, bookings or payments.');
async function stop() { await vite.close(); api.close(); process.exit(); }
process.on('SIGTERM', stop); process.on('SIGINT', stop);

