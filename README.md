# HACA Placement — backup copy (2026-09-18)

**The live code lives in `nidhill/SHO-PRODUCTION`** — this repo is a backup snapshot only.
Do not develop here; changes have to be hand-ported to the monorepo.

- Frontend: `SHO-PRODUCTION/placement/` (this folder's root) — Vite + React, deployed on Vercel,
  talks to the shared SHO server with `VITE_API_URL=https://ecoapi.harisandcoacademy.com`.
- Backend: `SHO-PRODUCTION/server/placement/` and `server/routes/placement.js` (copied here under `backend/`)
  — mounted at `/api/placement` inside the SHO Express/MongoDB server. There is no standalone server any more.
- Auth: SHO App staff token (admin / placement_team / leadership / ceo_haca) or LMS student token.
- Eligibility: mentors mark students in SHO App → Placement Eligibility (`backend/routes/placementEligibility.js`),
  synced instantly into `placement_students`.

Snapshot of SHO-PRODUCTION `main` at commit b4e2850 (2026-09-21).
