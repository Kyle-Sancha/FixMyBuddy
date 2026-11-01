# Customer home and vehicles

## Towing Route, Tracking and Handover

Towing requests additionally require destination and towingCondition `{ starts, rolls, collision }`, each an explicit yes/no/unknown choice. Values remain language-independent. GPS/manual pickup stays in location; typed destinations are not assigned fictional coordinates. Provider quote responses must include towingQuote `{ routeId, version, distanceKm, pickupAddress, destinationAddress, equipment }` alongside the actual itemized estimate and terms. Booking creation sends towingRouteId/towingRouteVersion. Validate the quote's route, pickup, destination, vehicle/condition, schedule, equipment capability, prices and version atomically on the backend. No client distance/fee or cancellation charge is invented.

GET booking records may include towing `{ status, destinationAddress, distanceKm?, etaMinutes?, equipment?, provider: { name, phone?, chatEnabled?, position?: { latitude, longitude, updatedAt? } }, pickupPhotos?: [{ id, url }], arrivalPhotos?: [{ id, url }], canConfirmHandover, handover?: { status, requiresPin?, condition?, ... } }`. Only actual non-null valid coordinates produce an OpenStreetMap point, labeled as last reported, not a simulated route or vehicle movement. Refresh loads current backend records. Contact actions use only the assigned provider's supplied phone/chat capability. Photo URLs must be authorized HTTPS records; no sample pictures are inserted.

`GET/POST /customers/me/bookings/:id/towing/messages` provides assigned-provider chat. GET returns `{ messages: [{ id, body, sender: 'customer'|'provider' }] }`; POST accepts body/clientId, returns `{ message }` for an acknowledged customer message. Authenticate booking ownership and assignment, derive sender server-side, rate-limit, deduplicate clientId and prevent cross-booking conversation access. Refresh retrieves actual replies, never automatic fake responses.

Handover is exposed only for towing.status at_destination plus canConfirmHandover true, not cancelled/rejected or already confirmed. It requires explicit vehicleReceived/keysReceived, condition no_new_damage or damage_reported, and at least 10 characters of damageNotes when damage is reported. Missing keys/vehicle should be resolved with the provider/support instead of checking false statements. Optional arrival evidence reuses the 10-file photo/video limits and previews. If requiresPin is true, enter the backend-issued PIN; no PIN is generated or persisted in browser storage.

`POST /customers/me/bookings/:id/towing/handover` accepts multipart details JSON `{ condition, vehicleReceived, keysReceived, damageNotes, pin?, bookingVersion, clientId }` plus repeated evidence File fields. Return `{ handover: { id, status: 'confirmed', condition, damageNotes?, keysReceived: true, vehicleReceived: true } }`. Damage reports must be preserved in the acknowledgement. Backend must enforce ownership/assignment, arrival state, version, PIN expiry/rate limits, successful-request idempotency and private evidence storage/content validation. Never log or expose the PIN; revoke it after success. GET booking records must reflect the confirmed handover and evidence links. Handover does not imply payment verification or automatically complete the service in the client. Unverified towing payment reporting stays blocked until handover is confirmed; existing server-verified receipts remain viewable.

## Estimated Repair Price and Revisions

Focused bookings show optional initialEstimate (not a final quote), approvedQuote, pendingRevision, revisionStatus, repairEstimate/repairApprovalStatus, and declinePayableEstimate. All estimates use the existing PHP itemized quote schema, including ID and version. No call-out, diagnosis, repair, parts, fee or declined-repair amount is supplied by the frontend. Approved/historical quotes remain viewable after expiry; pending quotes must still be current to accept a decision.

A pendingRevision requires baseQuoteId/baseQuoteVersion matching approvedQuote. `POST /customers/me/bookings/:id/quote-decision` accepts quoteId, quoteVersion, decision (approve/reject), approvedQuoteId, approvedQuoteVersion and bookingVersion. Return `{ booking, decision: { quoteId, quoteVersion, decision } }`. For revisions, booking.revisionStatus must become approved/rejected; for first repair quotes use booking.repairApprovalStatus. Approval must return that exact approvedQuote; rejection must return the unchanged previously approved quote (or no approved quote for an initial rejection). No client success is shown without a consistent acknowledgement. An initial rejection's payable charges must come from declinePayableEstimate, never a frontend fee assumption.

The backend must authenticate ownership, atomically check quote/base versions, expiry and booking state, deduplicate retries, record consent/decision history, and prevent unapproved work or charges. A revised total is compared in centavos for display only; the client does not set authoritative charges. Rejection does not cancel or increase the original approved scope.

An optional canRequestInspection flag exposes `POST /customers/me/bookings/:id/inspection-request` with version. Return `{ booking: { id, inspectionStatus: 'requested', ... } }` only after saving the real request. Server must enforce state and idempotency. No automatic inspection-completed state is generated.

Service completed, QR payment reported/pending verification, verified payment and receipt issuance remain distinct. Existing provider-supplied GCash QR flow is unchanged; no Maya/card/cash simulation, payment attempt generator or invented success/failure screen is added.

## History and Updates

History groups coming-up, completed and cancelled/rejected bookings, with service and status filters. Reference numbers, providers, timestamps, amounts and payment verification come only from server records. A completed service is not assumed paid. Centavos are preserved.

Booking management requires an explicitly allowed pre-dispatch status (requested, pending, confirmed, accepted or scheduled), no dispatchedAt, and canCancel/canReschedule true. The actual cancellationPolicy `{ id, text }` must exist and be accepted. `POST /customers/me/bookings/:id/cancel` takes `{ version?, cancellationPolicyId }` and returns `{ booking }` with status cancelled. `/reschedule` additionally takes scheduledAt (future ISO timestamp) and returns the authoritative booking with its new scheduledAt. The server must check authorization, ownership, current dispatch state, quote/policy version, slot availability and fees atomically. Client visibility is not authorization. Conflict responses must not be represented as success.

Rebook starts a fresh draft, selects the old vehicle only if it is still in the garage, and preserves only the service and issue choice. It clears old pickup coordinates, schedule, provider, prices, approvals and media. Missing vehicles require selection again. Towing destination and pickup must be entered/confirmed again.

Receipts require both payment.status verified and receiptAvailable true. `GET /customers/me/bookings/:id/receipt` must enforce these server-side and return an authenticated application/pdf response. The customer can preview/open/download the actual PDF. No receipt is generated from frontend totals. Blob URLs are revoked when closed/unmounted.

Updates supports `POST /customers/me/updates/read` with `{ ids: string[] }`, returning `{ readIds: string[] }`. Only IDs explicitly acknowledged by the server are marked read; concurrent new notifications stay unread. Notifications may include type, createdAt, read/readAt and bookingId. Times display in Asia/Manila; links open the actual booking. Payment/warranty messages must be derived from authoritative provider/payment/warranty events, not fabricated by the client. Manual refresh is available; push delivery is not simulated.

Maintenance reminders use `GET/POST /customers/me/reminders`, `PATCH/DELETE /customers/me/reminders/:id`. GET returns `{ reminders }`, writes `{ reminder }`, deletion may return 204. Schema: `{ id, title, vehicleId, dueDate?, targetMileage?, currentMileage?, notes?, completedAt? }`. dueDate is YYYY-MM-DD; mileage is a nonnegative number or null. At least a date or target mileage is required. Completion uses completedAt and reopening null. The server must validate vehicle ownership and reminder ownership. Deletion has an explicit confirmation dialog.

Without an authenticated configured API, user-created reminders are labeled device-only, stored under fixmybuddy-reminders:<customer-id-or-guest>, and never presented as push notifications. Nothing is seeded. Signed-in configured accounts use API records instead of local reminder records; guest data is not silently uploaded. Due status is derived from the entered date (Asia/Manila) and/or entered odometer reading; the frontend does not track vehicle mileage automatically.

React + Tailwind, using the approved customer branding and motion. The approved
landing and authentication layouts remain the entry points.

## Routes

- `/app`: customer home, pickup preview, selected vehicle, now/later request time,
  mechanic/towing actions, and next booking.
- `/vehicles`: add, edit, select, and remove a car or motorcycle.
- `/vehicles?continue=mechanic` (or `towing`): complete vehicle selection before
  continuing a request. Selected vehicle and scheduled time accompany the draft.
- `/history`: upcoming/completed/cancelled filters and booking detail links.
- `/updates`: updates supplied by the customer API.
- `/account`: customer details, garage, pickup location, and safety profile links.
- `/location`: GPS or a manually entered pickup address. Editing the address
  clears old coordinates so the map cannot show a stale GPS pin.

The shared bottom navigation remains visible with safe-area spacing. Long pages
scroll above it. Guest customers can explore and add vehicle information.
Email and returning-customer phone sign-ins both open `/app`; signup verification
continues through the approved permissions/safety-contact onboarding.

## Data Behavior Before Backend Integration

There are no seeded customers, vehicles, bookings, prices, notifications, provider
positions, routes, or ETAs. Greeting names come from the authenticated user.

Vehicles entered by a guest are explicitly saved on that browser under
`fixmybuddy-garage:guest`. Only user-entered fields and the selected ID are stored.
With an authenticated API session, vehicles are read/written through the backend;
only the selection preference is stored locally under the customer ID. Guest
vehicles are not silently migrated into another account. Storage failures are
shown to the customer. Removing a selected vehicle requires selecting another
before requesting help, and does not change past booking records.

Bookings and updates are API-only. Guest views ask for sign-in; API failures show
retry states. A scheduled request is a draft, not a confirmed booking. The client
does not fabricate a successful booking or mark a new request completed.

## Proposed Express Contract

Set `VITE_API_BASE_URL` as described in `AUTH_API.md`. Use authenticated HTTP-only
session cookies. The backend must scope all resources to the current customer,
validate ownership of vehicle/provider IDs, validate scheduling and quoted
prices, enforce status transitions, and protect writes against CSRF/invalid
origins. All timestamps are ISO strings; user date inputs use the device's local
timezone and are converted to UTC for requests. Booking summaries display
Philippine local time.

| Method | Path | Response |
| --- | --- | --- |
| GET | `/customers/me/vehicles` | `{ vehicles: Vehicle[] }` |
| POST | `/customers/me/vehicles` | `{ vehicle: Vehicle }` |
| PATCH | `/customers/me/vehicles/:id` | `{ vehicle: Vehicle }` |
| DELETE | `/customers/me/vehicles/:id` | HTTP 204 |
| GET | `/customers/me/bookings` | `{ bookings: Booking[] }` |
| POST | `/customers/me/bookings` | `{ booking: Booking }` |
| GET | `/customers/me/updates` | `{ updates: Update[] }` |

`Vehicle`: `{ id, type: "car" | "motorcycle", make, model, year, color, plate }`.
Plate is optional. Duplicate plates are checked case-insensitively, ignoring
spaces/hyphens on the client; enforce uniqueness appropriately on the server.

`Booking`: `{ id, serviceType, issueType, vehicleId, vehicleLabel, scheduledAt,
createdAt, status, providerName?, quotedAmount?, notes? }`. Monetary amounts are
PHP; `quotedAmount` must be a number. Supported completed/end statuses are
`completed`, `cancelled`, and `rejected`; other statuses remain upcoming/active.
Create payload includes the request draft, selected provider ID, vehicle ID,
optional `scheduledAt`, and location. The backend must return the actual accepted
status. Do not interpret creation as completion.

`Update`: `{ id, title, message, bookingId? }`.

Booking cancellation/reassignment, payment, live provider tracking, and push
delivery remain separate backend workflows, not simulated on these screens.
# Request workflow

The request flow is issue selection, details/media, pickup confirmation, and matching preference. Both mechanic and towing requests carry the selected vehicle ID and optional scheduled ISO timestamp. Towing requires a destination. Pickup may have GPS coordinates or a user-entered address; manual addresses are not geocoded by this frontend.

Photos/videos are optional: 10 total, 20 MiB per photo, 100 MiB per video. Accepted MIME types are JPEG, PNG, WebP, HEIC/HEIF, MP4, QuickTime, and WebM. Preview support depends on the browser. Files stay in React memory, never localStorage; reloading drops them. Client checks are usability checks, not security validation. The backend must independently enforce type, size, count, authorization, scanning, and upload limits. Booking with media is deliberately blocked until an upload contract exists.

`POST /providers/search` accepts the request fields, vehicleId, location, matchingMode (manual or auto), and `filters: { radiusKm, specialty, minimumRating, verifiedOnly, maximumVisitPrice, sort }`. An empty price limit means no cap; zero is a valid cap. Sort is eta, price, rating, or distance. Returns `{ providers: [...], recommendedProviderId? }`. Automatic matching only opens the explicit recommended provider's profile, never silently chooses the first result or books. Empty results are distinct from unavailable API/error states.

Request additions: destination (towing only), landmark, matchingMode. The backend must validate these, issue eligibility, current vehicle ownership, location, schedule, and provider availability again when booking. Search must enforce service area, authorization, rate limits and ranking server-side. Request drafts contain customer-entered text and location in browser storage, not authentication secrets; media does not persist.

## Provider and Booking Review Contract

- `/providers`: list/map views, sorting, verified filter, true empty results, wider radius and retry.
- `/provider-filters`: radius (1-30 km), specialty, minimum rating, verified only, maximum PHP estimate, now/scheduled with future-date validation. Applying triggers a server search; the UI never invents a matching count.
- `/providers/:providerId`: profile, optional server-supplied credentials and reviews, current itemized estimate.
- `/confirm-request`: review and accept the current visit estimate and actual cancellation terms. Missing/invalid/expired estimates or missing terms block booking. No sample booking number or cancellation fee is displayed.

`POST /providers/:id/quote` takes `{ request, location }` and returns `{ provider }`. The provider includes `id` (string), `name`, optional numeric `etaMinutes`, `distanceKm`, `rating`, `reviewsCount`, `jobsCompleted`, optional `verified: true`, `credentials: string[]`, `specialties: string[]`, and `customerReviews: [{ id, authorName?, rating?, createdAt?, text }]`. Only true verification from the API produces a badge. Optional latitude/longitude show an OpenStreetMap location; missing positions are not fabricated. No live tracking is implied.

`estimate: { id, version, currency: 'PHP', items: [{ label, amount }], total, expiresAt? }`. IDs are strings; version is a number or nonempty string. Prices are nonnegative numeric PHP amounts, including centavos. Item amounts must sum to total. `cancellationPolicy: { id, text }` must be actual provider terms. Backend quote/policy versions must be immutable and revalidated during booking.

Booking creation additionally sends estimateId, estimateVersion, cancellationPolicyId, paymentMethod `provider_qr`, and repairsApproved `false`. Never trust client totals, verification, availability, approval status or user IDs. Authenticate the cookie session, verify ownership, recheck quote expiry/price and provider availability atomically, and deduplicate retries server-side. Approving the visit does not approve repairs.

## Mechanic active service and communication

Owned mechanic bookings link to `/bookings/:id/service` and `/bookings/:id/provider-chat`. Booking records may include `mechanic: { status, updatedAt, provider: { id, name, verified?, rating?, reviewsCount?, phone?, chatEnabled? }, etaMinutes?, position?: { latitude, longitude, updatedAt }, arrivalPinAvailable?, workPaused?, estimatedFinishAt?, diagnosis?: { summary, createdAt }, timeline?: [{ id, label, status: 'completed' | 'current' | 'upcoming', at? }], updates?: [{ id, title, body?, photoUrl?, createdAt? }] }`. All positions, steps, timestamps, credentials, findings, photos and estimated completion times must be actual provider records. The UI shows the last reported map point and timestamp, with explicit refresh; it does not animate a fabricated trip or simulate live delivery. Use HTTPS for photo URLs. Missing tracking data remains unavailable.

`GET /customers/me/bookings/:id/mechanic/messages` returns `{ messages: [{ id, body, sender: 'provider' | 'customer', createdAt?, readAt? }] }`. `POST` at the same path accepts `{ body, clientId }` and returns `{ message: { id, body, sender: 'customer', clientId, createdAt? } }`. Authenticate ownership and the currently assigned provider; deduplicate client IDs for retries. Enforce text length and sender identity on the server. Do not claim delivery/read without real provider acknowledgement. No outgoing messages are automatically resent and drafts remain visible on failure.

`GET /customers/me/bookings/:id/mechanic/arrival-pin` returns `{ bookingId, pin, expiresAt }` only when authorized for an active booking with an assigned mechanic. Pins are issued and verified server-side, never generated in the client. Return `Cache-Control: no-store`; rate-limit issuance and verification, apply short expiry and invalidate after verification, reassignment or cancellation. The frontend reveals only an actual unexpired PIN on customer action, clears it on hiding, expiry, tab hiding or navigation, and never stores it in local storage, a URL or the booking request. Arrival verification does not approve repair work or payment. Share only after the assigned provider arrives.

Repair approvals and extra-work decisions reuse the existing versioned quote-decision contract and per-booking sharing contract. The backend must prevent paid repair work and extra charges without current explicit approval. `workPaused` and repair progress are provider-confirmed records, not a client timer or a result inferred from the approval button.

Pending repair quotes may include a provider-supplied `warrantySummary` string. No warranty duration or coverage is assumed when it is absent. Full post-service warranties continue to use the existing warranty records.

## Nearby repair shops for towing

`POST /repair-shops/search` accepts `{ location: { address, latitude?, longitude? }, vehicleType, radiusKm }` and returns `{ shops: [{ id, name, address, latitude?, longitude?, distanceKm? }] }`. Names and addresses must be nonempty strings; coordinates must be valid pairs, and any distance must be a nonnegative number. Resolve typed pickup addresses and compute search distances on the backend. Return only actual search results; the frontend does not fabricate shop records, opening hours, route distances or availability. Return an empty array for a successful search with no results and an error status when the service is unavailable.

Towing requests now start at `/request/towing`. The request carries `destinationMode: 'manual' | 'nearby'` and `destinationShop: null | { id, name, address, latitude?, longitude?, distanceKm? }`, in addition to `destination` and `towingCondition`. Revalidate shop identity/address and destination on the server before generating a route or accepting a booking. Shop selection does not guarantee the shop is open or has accepted the vehicle. Manual addresses remain available without shop search. Do not trust client-supplied distances or totals.

## Provider QR and Separate Repairs

Focused history bookings render server-provided `payment: { status, qrUrl?, payeeName?, reportable? }`. QR URLs must use HTTPS and should be hosted/validated by your backend. No QR is generated, no personal GCash account is prefilled, and missing/broken QR images do not offer payment reporting. Payment QR appears only on an actual returned booking, not as a prerequisite for search. Only `status: 'verified'` from the API shows confirmed receipt.

`POST /customers/me/bookings/:id/payment-reports` accepts optional `{ reference }`, returning `{ payment: { status: 'pending_verification' } }`. This reports the customer's claim only. The provider must independently verify receipt; the customer endpoint must never set verified. Protect against duplicates, validate the booking's payable state and amount server-side, enforce CSRF protection for cookie sessions and rate limits.

Separate repairs use `repairApprovalStatus: 'awaiting_customer'` and a valid `repairEstimate` with the same estimate schema. `POST /customers/me/bookings/:id/repair-approval` accepts `{ estimateId, estimateVersion }`, returning `{ booking: { ..., repairApprovalStatus: 'approved' } }`. Validate quote version, booking ownership and current state on the server. Changed estimates require new consent.

For isolated browser QA only: `node tests/provider-preview.mjs` starts a test API at 5984 and Vite at 5184. Its explicitly named test records live only in that process, on a separate origin, and are never imported by the application or enabled by npm run dev/build. Stop the process after testing; never deploy it as a backend. No real payments or bookings occur there.


### Pickup map and address lookup
The customer pickup preview opens a full-screen Leaflet picker. Panning changes a local draft; Back/Escape leaves the confirmed pickup unchanged. Confirm saves the pin, editable address, and optional request landmark. GPS requests also reverse-geocode the returned coordinates. Address suggestions use Photon-compatible GET /reverse?lat=...&lon=...&limit=1&lang=en (GeoJSON features[].properties). Set VITE_GEOCODER_URL to your hosted Photon service or compatible proxy for production; the default public Photon server has reasonable-use limits and no availability guarantee (https://github.com/komoot/photon#demo-server). Only coordinates are sent to this service; typed addresses, landmarks, and account details are not. Lookups are debounced after map movement, time out after eight seconds, and use a bounded in-memory cache. Map tiles use OpenStreetMap attribution. Address results are approximate and remain customer-editable; failed lookups preserve the pin and allow manual entry. No provider positions or routes are fabricated.

