# Royalty Details — Admin Backend

Next.js (App Router) backend for the Royalty Details site. Receives contact form submissions and exposes a sign-in protected dashboard for staff to review them.

## Stack

- Next.js 16 (App Router, Fluid Compute)
- Clerk — authentication
- Neon Postgres (via Vercel Marketplace) — storage
- Drizzle ORM — schema + queries

## Local setup

```bash
cd admin
npm install
cp .env.example .env.local
# Fill in DATABASE_URL, Clerk keys, ALLOWED_ORIGIN
npm run db:push   # creates the submissions table in Neon
npm run dev       # http://localhost:3000
```

Sign up at `/sign-in` (Clerk dashboard controls who is allowed). Anyone you invite via Clerk can view `/admin`.

## Deploy on Vercel

```bash
vercel link
vercel integration add neon          # provisions DATABASE_URL
# Add Clerk keys + ALLOWED_ORIGIN in Vercel dashboard or via:
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
vercel env add ALLOWED_ORIGIN        # e.g. https://royaltydetails.com
vercel env pull .env.local --yes
npm run db:push
vercel deploy --prod
```

## Environment variables

| Var | Notes |
|-----|-------|
| `DATABASE_URL` | Neon Postgres connection string (auto-set by Marketplace integration) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | From Clerk dashboard |
| `CLERK_SECRET_KEY` | From Clerk dashboard |
| `ALLOWED_ORIGIN` | Comma-separated list of origins allowed to POST to `/api/contact` (the static site's domain) |

## Wiring the static site

The static site's `script.js` posts to `/api/contact` on the same origin by default. If the admin app is deployed to a separate domain, set this **before** loading `script.js`:

```html
<script>window.RD_API_BASE = 'https://admin.royaltydetails.com';</script>
<script src="script.js" defer></script>
```

Make sure that domain is listed in `ALLOWED_ORIGIN` on the admin deployment.

## Routes

- `POST /api/contact` — accepts `{ name, email, phone, vehicle?, service?, message? }`. Public, CORS-gated by `ALLOWED_ORIGIN`.
- `/admin` — auth-protected dashboard (most recent 200 submissions).
- `/sign-in` — Clerk sign-in.
