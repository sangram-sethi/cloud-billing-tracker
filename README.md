# Cloud Budget Guard (MVP)

Prevent cloud bill surprises with anomaly alerts + a weekly founder report.

**Status:** Week 1 = UI + design system + mocked data (no backend yet).  
**MVP scope:** AWS-only.

---

## What’s built (Week 1)

- Marketing site:
  - Landing (`/`)
  - Pricing (`/pricing`)
  - Security / Trust Center (`/security`)
- App shell (`/app/*`)
  - Dashboard UI with mocked data (`/app`)
  - Connect AWS flow UI (`/app/connect-aws`) — Role ARN + External ID
  - Reports placeholder (`/app/reports`)
  - Settings placeholder (`/app/settings`)
- Auth routes (minimal layout):
  - Login (`/login`)
  - Signup (`/signup`)
- UI system:
  - Tailwind v4 tokens in `globals.css` (`@theme`)
  - Card / Button / Input / Label / Badge primitives
  - Premium hover glow + cursor-following glow
  - Page transitions (Framer Motion)
  - Icons (lucide-react)

---

## Tech stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS v4
- Framer Motion (page transitions)
- lucide-react (icons)
- Package manager: `pnpm`

---

## Local development

### 1) Install
```bash
pnpm install
