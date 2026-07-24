# NESHMART — Student Marketplace with M-Pesa Escrow

A multi-vendor marketplace for University of Kabianga students, with Safaricom
Daraja STK Push payments held in escrow until the buyer confirms delivery.

## What's built (working end-to-end)

- **Auth**: register/login, JWT, bcrypt, auto "Verified Student" badge for
  `@uo-kabianga.ac.ke` emails, Kenyan phone validation.
- **Listings**: create/edit/pause/delete, category + campus filters, full-text
  search, pagination.
- **Payments (the core flow)**:
  1. Buyer clicks "Buy via M-Pesa" → `POST /api/mpesa/stkpush` → Safaricom
     sends an STK Push to their phone.
  2. Safaricom calls `POST /api/mpesa/callback` → payment marked `SUCCESS`,
     escrow set to `HELD_IN_ESCROW`, product quantity decremented.
  3. Buyer meets seller in person, then clicks **Confirm & Release Funds** →
     `POST /api/escrow/release` → backend calculates 95/5 split and calls
     Safaricom's B2C API to pay the seller directly → escrow `RELEASED`,
     product marked `SOLD`.
- **Seller dashboard**: live stats (active listings, sold, escrow balance,
  revenue) + sell wizard + listing management.
- **Buyer dashboard**: purchase history with live escrow status and the
  release button.
- **Database**: full schema in `backend/db/schema.sql`, including tables for
  messages, wishlist, reviews, and reported listings so those features can be
  built on top without a schema change.

## What's scaffolded but not fully wired yet

The spec's full admin panel (fraud detection, commission reports, campus
management), in-app messaging UI, wishlist UI, and reviews UI aren't built
out yet — the DB tables and API patterns are there, but no dedicated
frontend screens. Happy to build any of these next; just tell me which to
prioritize.

## Local setup

### 1. Database
```bash
createdb neshmart
psql neshmart -f backend/db/schema.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env   # fill in your values
npm install
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Visit `http://localhost:5173`. The Vite dev server proxies `/api` to
`http://localhost:5000`.

## Getting Daraja credentials

1. Create an account at https://developer.safaricom.co.ke
2. Create an app under "My Apps" — this gives you `DARAJA_CONSUMER_KEY` and
   `DARAJA_CONSUMER_SECRET`.
3. For **sandbox testing**, use the test shortcode `174379` and the sandbox
   passkey shown on the "Lipa Na M-Pesa Sandbox" page — both go in
   `BUSINESS_SHORTCODE` and `PASSKEY`.
4. `CALLBACK_URL` **must be a public HTTPS URL** — Safaricom cannot reach
   `localhost`. Use `ngrok http 5000` while developing locally and put the
   ngrok URL in `.env`.
5. For B2C (seller payouts) you'll need to apply for **Go-Live** production
   credentials separately — sandbox B2C requires its own test credentials
   under the "B2C" API product in the developer portal, plus an initiator
   name/security credential Safaricom issues you.

## Deployment

- **Frontend** → Vercel: import the `frontend/` folder, set build command
  `npm run build`, output `dist/`.
- **Backend** → Render: import `backend/`, set start command `npm start`,
  add all `.env` variables in Render's dashboard. Render gives you a stable
  HTTPS URL — use it for `CALLBACK_URL`, `B2C_RESULT_URL`, and
  `B2C_QUEUE_TIMEOUT_URL`.
- **Database** → Render Postgres or Supabase; run `schema.sql` against it.
- **Images** → Cloudinary: create a free account, put the credentials in
  `.env`. The seller wizard currently accepts a pasted image URL — wiring
  direct upload through Multer + Cloudinary is a quick follow-up if you want
  it.

## Security notes already in place

JWT auth, bcrypt (12 rounds), helmet, CORS lock to `FRONTEND_URL`, rate
limiting (global + stricter on auth), xss-clean input sanitization,
parameterized SQL everywhere (no injection surface), centralized error
handler that hides internals in production.
