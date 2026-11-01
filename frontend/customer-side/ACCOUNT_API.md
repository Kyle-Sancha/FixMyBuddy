# Account, Settings and Help Center

## After Service

Completed bookings render an editable 1-5 star review with optional feedback (2000 characters maximum). `PUT /customers/me/bookings/:id/review` accepts `{ rating, body, version?, clientId }`, returning `{ review: { id, bookingId, rating, body, version? } }`. GET bookings must return the same record as booking.review. Enforce one review per booking/customer with a unique constraint, authenticated ownership, completed service status, version conflict checks and idempotent retries. Payment verification is separate from completion. canReview/canEditReview false disables edits; backend authorization remains mandatory. No optimistic review success or fictitious ratings are generated.

Optional booking.warranties is an array of `{ id, title, status, startsAt?, endsAt?, coverage?, exclusions? }`; coverage and exclusions are strings. Only provider-supplied records, status and dates are shown. Missing or invalid details are explicitly unavailable. No default warranty duration, active status or coverage is inferred. Warranty support opens the existing booking-linked dispute form.

Dispute details additionally accept reason (service/refund/warranty/payment/other), optional amountInQuestion (nonnegative PHP number or null), and currency PHP. Customer-entered amounts must be representable in centavos; the server must independently validate decimal precision and any booking-specific limits. The amount is a claim, never an approved refund, credit or price change. Return it only as canonical dispute data. Refund review, outcome and timing must come from actual backend decisions and provider terms; no default refund policy or deadline is supplied.

React and Tailwind only, with the existing customer navigation, mobile-first layout and reduced-motion support. No support contacts, replies, dispute records or sharing confirmations are seeded into the application.

## Routes

- `/account`: profile, vehicles, emergency contact, permission/privacy/payment/language links, Help Center, confirmed server logout.
- `/account/profile` and `/account/emergency-contact`: PATCH the authenticated customer using the existing profile API. Mobile/email edits require a separate verified update workflow and are read-only here.
- `/settings/notifications` and `/settings/location`: actual browser permission states and user-initiated permission requests. Revoking access must be done in browser settings. Notification permission does not imply push delivery is implemented.
- `/settings/privacy`: explains default-off, per-booking sharing; no global opt-in.
- `/settings/payments`: explains provider-supplied QR payment, not saved payment accounts or a payment gateway.
- `/settings/language`: English/Filipino interface preference stored under fixmybuddy-language. Names, submitted data, provider messages and actual policy text retain their original content. Browser-native controls use the browser's own localization.
- `/help`, `/help/chat`, `/help/disputes`: contact links, expandable help topics, server-backed messages, booking-linked multipart evidence and server-provided case tracking.

## Account and Sessions

Existing `PATCH /customers/me` accepts a name and/or `{ emergencyContact: { name, phone, relationship } | null }` and returns `{ user }`. Validate Philippine mobile numbers, contact consent and ownership server-side. Updating a profile must not change or verify a phone/email without the dedicated verification flow.

`POST /auth/logout` invalidates the actual cookie session and returns success/204. Only then does the UI clear the authenticated user, pending challenge, phone, selected provider, request draft, media and pickup state. A failed logout does not pretend the server session ended. Protect cookie mutations with CSRF defenses, secure session cookies and appropriate SameSite/CORS policy.

## Support

`GET /support/config` returns `{ phone?, email? }`. Only supplied valid contacts become tel/mailto links. There is no prefilled personal number, email or automatic support bot.

`GET /customers/me/support/messages` returns `{ messages: [{ id, sender: 'customer' | 'support', body, createdAt? }] }` for the current account's conversation. `POST` on the same path accepts `{ body, clientId }`, returning `{ message }`. Derive sender/ownership from the authenticated session, limit message size and rate, and deduplicate by customer/clientId. Only acknowledged messages appear as sent. Refresh retrieves actual replies; no typing indicators or fake replies are generated. Enforce safe support-agent access server-side.

## Disputes and Evidence

`GET /customers/me/disputes` returns `{ disputes: [{ id, reference?, subject, status, bookingId?, description?, updatedAt? }] }`, scoped to the authenticated customer.

`POST /customers/me/disputes` accepts multipart FormData: `details` is JSON `{ bookingId, subject, description, clientId }`; repeated `evidence` fields contain real File bytes. Returns `{ dispute }` with an actual nonempty ID, subject and status. The customer sees saved status only after that response. Requests time out after 120 seconds for media; preserve/deduplicate ambiguous retries server-side. Reuse clientId while retrying the same draft. The UI keeps failed drafts/files for retry, but does not persist media in localStorage.

Evidence is optional, maximum 10 files total, 20 MiB per photo or 100 MiB per video, using the request-flow MIME allowlist. The backend must independently check account/booking ownership, file count, size, MIME/content signatures, malware, filename safety, storage authorization and retention. Store files privately and authorize all subsequent downloads. Do not trust client IDs, client MIME values, case status, fees or provider identities. Case resolution/refunds are actual reviewed backend operations, not client-generated outcomes.

## Sharing

Focused history bookings include optional `sharing: { enabled: boolean }`, default false when absent. A saved emergency contact is required to enable sharing. Completed/cancelled/rejected bookings cannot be newly enabled from the UI, but an existing opt-in can be revoked.

`PATCH /customers/me/bookings/:id/sharing` accepts `{ enabled, version? }`, returning `{ sharing: { enabled: boolean } }`. Only that returned value is shown as confirmed. Resolve the contact from the authenticated profile rather than trusting a supplied phone number. Enforce explicit per-booking consent, ownership, concurrency/version checks, short-lived access tokens, terminal-status expiry and immediate revocation. Never carry consent to another booking, and never expose location just because an emergency contact is saved. Changing/removing the emergency contact must revoke old grants server-side. No external message or location delivery is simulated by the frontend.

## Language and QA

The locale provider and Filipino catalog translate UI strings and display templates. Internal service/status identifiers, names, user text, request fields and URLs remain unchanged. Switching language remounts only the routed UI while the authenticated customer/request stores remain above it. Server-supplied content is not machine-translated or replaced with sample text. Add future UI strings to the catalog or use the locale hook with explicit English and Filipino text.

`scripts/localize-interface.mjs` is a one-time, AST-based migration helper, not part of runtime/build. It uses the installed Babel toolchain, skips internal comparison values and non-display attributes, and is not required to run the frontend. `npm test` checks validation, contact URL safety, locale templates and existing request/booking rules.

The isolated `tests/provider-preview.mjs` fixture runs on ports 5184/5984 only. Its explicitly named QA customer, contact, messages and cases never enter the regular 5173 frontend or production bundle. No real support messages, disputes, bookings, emergency sharing or payments occur in this fixture.
