# Cloud Budget Guard (MVP)

Prevent cloud bill surprises with anomaly alerts + a weekly founder report.

**Status:** Week 1 UI + premium design system + mocked data.  
**Now added:** MongoDB-backed auth foundation (real signup/login + protected app routes).  
**MVP scope:** AWS-only.

---

## What’s built so far

- Marketing site:
  - Landing (`/`)
  - Pricing (`/pricing`)
  - Security / Trust Center (`/security`)
- App shell (`/app/*`)
  - Dashboard UI with mocked data (`/app`)
  - Connect AWS flow UI (`/app/connect-aws`) — Role ARN + External ID
  - Reports placeholder (`/app/reports`)
  - Settings (`/app/settings`) — shows account + sign out
- Auth (real)
  - Signup (`/signup`) → creates Mongo user with hashed password
  - Login (`/login`) → credentials auth via NextAuth v5 (JWT session)
  - `/app/*` protected (redirects to `/login`)

---

## Tech stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS v4
- Framer Motion
- Auth.js / NextAuth v5 (Credentials)
- MongoDB Atlas (no local DB required)

---

## Local development

### 1) Install
```bash
pnpm install
