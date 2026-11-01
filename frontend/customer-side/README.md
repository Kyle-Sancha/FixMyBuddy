# FixMyBuddy Customer Side

React + Tailwind CSS customer frontend for the FixMyBuddy roadside assistance app. This directory is separate from the future mechanic-side app.

Appearance: Account → Appearance offers Light, Dark and Use device setting. The default follows the device; an explicit choice is saved on this browser and synchronized across tabs. Switching appearance keeps forms and request drafts mounted. If browser storage is blocked, the choice still works for the current tab. Shared color tokens in `src/styles/theme.css` cover the interface while photos, map tiles and payment QR images retain their original colors.

## Tech Stack

- React
- Vite
- Tailwind CSS
- React Router
- Lucide React icons

## Getting Started

Run these commands inside `frontend/customer-side/` (from the repository root, run `cd frontend/customer-side` first).

```bash
npm install
npm run dev
```

The location screen uses browser geolocation when permission is granted. Provider results are loaded through `src/services/providerService.js`, which is ready to connect to the future backend and does not ship fake provider records.

## Scripts

Connection feedback: browser offline status shows an animated Waiting for internet banner. Failed API connections show a connection-error notice; the browser online event asks the customer to retry. Only an actual HTTP response clears the connection-error state automatically. No booking, payment, message or upload is automatically resent. Browser network availability does not guarantee internet/API reachability; reduced-motion preferences disable the spinner.

- `npm run dev` starts the development server.
- `npm run build` creates a production build.
- `npm run preview` previews the production build locally.
- `npm run lint` checks the frontend source with ESLint.
- `npm test` checks attachment limits, quote validation, filters, QR URL safety and peso precision.

On Windows PowerShell, use `npm.cmd install` and `npm.cmd run dev` if execution policy blocks npm.ps1.

## Provider Search and Booking

Account settings and the Help Center are available from `/account` and `/help`. English/Filipino selection is under `/settings/language`. Profile changes, chat, disputes, sharing and logout use authenticated API contracts documented in `ACCOUNT_API.md`; missing backend services never produce simulated successes.

Customer requests continue to `/providers`, `/provider-filters`, a provider profile and `/confirm-request`. Data comes exclusively from `VITE_API_BASE_URL`; unconfigured search is explicitly unavailable. No provider records, prices, reviews, QR codes or bookings are seeded into the app. See `CUSTOMER_API.md` for the search, quote, booking, repair approval and payment-report contracts.

QR payment is provider-supplied, not gateway integration. A customer payment report remains pending verification until the server confirms provider receipt. Visit estimates and later repair estimates require separate approval. Missing estimates or cancellation terms block booking.

The optional `tests/provider-preview.mjs` harness is isolated browser QA only, on ports 5184/5984. Its test fixtures are never loaded by the regular app. Stop it after testing; it is not a backend implementation.

