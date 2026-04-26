# Royalty Details — Admin Backend

Next.js (App Router) backend for the Royalty Details site. Receives contact form submissions and exposes a password-protected dashboard for staff to review them.

## Stack

- Next.js 16 (App Router, Fluid Compute)
- Email + password auth (bcrypt hashing, signed JWT cookie via `jose`) — no third-party auth provider
- Neon Postgres (via Vercel Marketplace) — storage
- Drizzle ORM — schema + queries

## Local setup

```bash
cd admin
npm install
cp .env.example .env.local
# Edit .env.local and set DATABASE_URL, SESSION_SECRET, ALLOWED_ORIGIN
npm run db:push                                            # create tables in Neon
npm run user:create -- --email=you@example.com --password='YourStrongPass'
npm run dev                                                # http://localhost:3000
```

Then visit `http://localhost:3000/sign-in` and log in with the credentials you just created.

## Generating SESSION_SECRET

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Paste the output into `.env.local` as `SESSION_SECRET=...`.

## Creating accounts

Each person who needs access gets their own account. Run for each user:

```bash
npm run user:create -- --email=staff@example.com --password='StrongPass123'
```

Re-running with an existing email updates that user's password.

## Deploy on Vercel

```bash
vercel link
vercel integration add neon          # provisions DATABASE_URL
vercel env add SESSION_SECRET        # paste the random string
vercel env add ALLOWED_ORIGIN        # e.g. https://royaltydetails.com
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
| `ALLOWED_ORIGIN` | Comma-separated origins allowed to POST to `/api/contact` (the static site's domain) |

## Wiring the static site

The static site's `script.js` posts to `/api/contact` on the same origin by default. If the admin app is deployed to a separate domain, set this **before** loading `script.js`:

```html
<script>window.RD_API_BASE = 'https://admin.royaltydetails.com';</script>
<script src="script.js" defer></script>
```

Add that domain to `ALLOWED_ORIGIN` on the admin deployment.

## Routes

- `POST /api/contact` — accepts `{ name, email, phone, vehicle?, service?, message? }`. Public, CORS-gated by `ALLOWED_ORIGIN`.
- `/sign-in` — email + password form.
- `/admin` — auth-protected dashboard (most recent 200 submissions).
