# Customer authentication integration

The React + Tailwind customer onboarding follows the supplied signup prototype.
The phone-first customer landing page is at `/`; `/start` redirects there.
Login and signup are centered single-column forms on both phones and desktops,
without a separate promotional sidebar. Both forms link back to the landing page.
Routes: `/login`, `/signup`, `/verify`, `/permissions`, `/profile`,
and `/forgot-password`. `/register` redirects to `/signup`.

## Configuration

Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to the Express API
base URL, including `/api` if appropriate. Restart Vite after changing it.
Until configured, account submissions show an unavailable message; no account,
OTP, verification status, or successful booking is fabricated.

`VITE_TERMS_URL` and `VITE_PRIVACY_URL` must point to the project's real published
policies. Without these URLs, links explain that the policies are unavailable.
The backend must enforce acceptance of a published policy version at signup.

`VITE_PROVIDER_PORTAL_URL` optionally enables the landing page's provider signup
link. It is hidden until a real provider portal is configured.
The landing map is explicitly an illustration until the customer has selected
coordinates. It never displays example providers, routes, ETA, or a serving city.

## Proposed Backend Contract

All bodies and responses are JSON. All authenticated endpoints use secure,
HTTP-only session cookies. No passwords, OTPs, or tokens are persisted in
local/session storage. The API must implement CSRF/Origin checks, secure session
rotation, login/OTP rate limits, OTP expiration, uniqueness checks, and server
validation. Configure credentialed CORS for the frontend origin if needed.

| Method | Endpoint | Request | Successful response |
| --- | --- | --- | --- |
| GET | `/auth/session` | none | `{ user }` or `{ user: null }` |
| POST | `/auth/phone/start` | `{ phone }` | `{ challenge }` |
| POST | `/auth/signup` | `{ name, phone, email, password, acceptedTerms }` | `{ challenge }` |
| POST | `/auth/login` | `{ email, password }` | `{ user }` |
| POST | `/auth/phone/verify` | `{ challengeId, code }` | `{ user }` |
| POST | `/auth/phone/resend` | `{ challengeId }` | `{ challenge }` |
| POST | `/auth/password/forgot` | `{ email }` | generic response, regardless of account existence |
| PATCH | `/customers/me` | `{ name?, emergencyContact }` | `{ user }` |

`challenge` includes `id`, `expiresAt`, `resendAt` (ISO timestamps). A challenge
is held in memory only; a page reload requires restarting verification. Real
SMS delivery and OTP verification belong to the backend. Never return the OTP.
Phone numbers are submitted normalized as `+639XXXXXXXXX`.

`user` includes `id`, `name`, `email`, `phone`, `phoneVerified` (boolean), and
optional `emergencyContact: { name, phone, relationship }`. The frontend only
displays a phone-verified badge when the server supplies `phoneVerified: true`.
Phone sign-in creates no profile automatically: the backend must handle unknown
numbers consistently with its customer-registration policy.

Location and notification permission requests require explicit user actions.
Both can be skipped. Browser notification permission alone does not register a
push subscription or deliver messages. HTTPS (or localhost) is required for
geolocation; mobile browser notification support varies.

## Visual asset

`public/images/roadside-buddy.png` is a decorative generated illustration, not
a live map or actual provider. Generated with the built-in image-generation tool:
"Polished editorial bitmap illustration of roadside motorcycle assistance in
the Philippines, yellow service pickup and navy scooter, mechanic and rider,
tropical roadside, muted mint/blue-gray landscape, navy and yellow accents,
no text, no labels, no logos, no simulated live map."

## Draft policy content
Default Terms and Privacy links now show bilingual in-app documents and preserve the current form. Public routes /terms and /privacy are also available. VITE_TERMS_URL and VITE_PRIVACY_URL may still point to reviewed, externally published documents. Current local content is explicitly draft and not effective. Operator name supplied by the team: FixMyBuddy. Legal operator identity, privacy email, retention periods, processing bases and recipients, and final service terms still require confirmation before public use. Acknowledging a privacy notice is separate from optional GPS, notification and per-booking sharing choices. Production acceptance should record the actual published policy version and timestamp server-side; the existing acceptedTerms field has not been changed into a simulated acceptance ledger.

