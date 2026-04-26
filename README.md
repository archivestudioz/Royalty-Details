# Royalty Details

Single Vercel project that serves the marketing site **and** the staff admin dashboard.

- `/` , `/about`, `/services`, `/book`, `/contact` — the public marketing pages (static HTML in `public/`)
- `POST /api/contact` — receives contact form submissions
- `/sign-in` — staff login (email + password)
- `/admin` — auth-protected dashboard listing submissions

## Stack

- Next.js 16 (App Router, Fluid Compute) — serves both the static site and the dashboard
- Email + password auth (bcrypt hashing, signed JWT cookie via `jose`)
- Neon Postgres (via Vercel Marketplace) — storage
- Drizzle ORM — schema + queries

## Local setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local: set DATABASE_URL, SESSION_SECRET, ALLOWED_ORIGIN
npm run db:push                                            # creates tables in Neon
npm run user:create -- --email=you@example.com --password='YourStrongPass'
npm run dev                                                # http://localhost:3000
```

Visit `/` for the site, `/sign-in` to log in, `/admin` for submissions.

## Generating SESSION_SECRET

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Paste the output into `.env.local` as `SESSION_SECRET=...`.

## Creating accounts

Each person who needs access gets their own account:

```bash
npm run user:create -- --email=staff@example.com --password='StrongPass123'
```

Re-running with an existing email updates that user's password.

## Deploy on Vercel

```bash
vercel link
vercel integration add neon          # provisions DATABASE_URL automatically
vercel env add SESSION_SECRET        # paste the random string from above
vercel env add ALLOWED_ORIGIN        # set to the production domain, e.g. https://royaltydetails.com
vercel env pull .env.local --yes
npm run db:push
npm run user:create -- --email=...   # creates the user against the prod DB
vercel deploy --prod
```

## Environment variables

| Var | Notes |
|-----|-------|
| `DATABASE_URL` | Neon Postgres connection string (auto-set by Marketplace integration) |
| `SESSION_SECRET` | 32+ random bytes; signs the auth cookie |
| `ALLOWED_ORIGIN` | Origin allowed to POST to `/api/contact` — usually the production domain |

## Project layout

```
app/                  Next.js app (admin dashboard, sign-in, /api/contact)
  actions/auth.ts     server actions for sign-in / sign-out
  admin/page.tsx      dashboard
  api/contact/        public POST endpoint
  sign-in/page.tsx    login form
lib/
  db.ts               Drizzle + Neon client
  schema.ts           submissions, users tables
  session.ts          JWT cookie helpers
public/               static marketing pages (index.html, etc.)
proxy.ts              Next.js 16 proxy gating /admin
scripts/create-user.ts  CLI for creating admin accounts
```
