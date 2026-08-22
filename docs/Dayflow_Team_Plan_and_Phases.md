# Dayflow — Team Plan, Phases & Git Workflow

Assumes ~8 hours of build time (per the source file name) and 4 developers working **in parallel**, not in sequence. If your actual time budget is different, keep the module split and just stretch/compress the hour markers.

## Recommended Stack (lock this in during kickoff, don't debate mid-build)
- **Frontend:** React + Vite + TypeScript, Tailwind CSS, React Router, TanStack Query, React Hook Form + Zod
- **Backend:** Node.js + Express (or Fastify) + TypeScript, Prisma ORM, Zod, bcrypt, JWT-in-httpOnly-cookies
- **Database:** PostgreSQL (chosen over MySQL for native Row-Level Security, enums, and Prisma ergonomics — see Security Checklist #3)
- **Package manager:** pnpm or npm — pick one, everyone uses it

## What Makes 4 People Stay Consistent
1. `Dayflow_schema.sql` is committed **first**, before anyone writes a feature. Nobody invents their own columns.
2. A single `packages/shared` (or `src/types`) folder holds shared TypeScript types/DTOs generated from the schema — every module imports from there, nobody redefines `User` locally.
3. ESLint + Prettier config committed in commit #1; everyone runs it before pushing.
4. `Dayflow_SRS.md` and `Dayflow_Security_and_Quality_Checklist.md` are read by every Antigravity session (see `Dayflow_Antigravity_Prompts.md`) — the spec lives in the repo, not in someone's head.
5. One shared repo, feature branches, PRs into `main` — not four disconnected repos. GitHub's contributor/commit graph on one repo satisfies "individual evaluation" far better than four apps that don't talk to each other.

## Git Workflow
- Branch naming: `feat/<area>-<short-desc>` e.g. `feat/attendance-checkin`
- Commit style: Conventional Commits — `feat:`, `fix:`, `chore:`, `docs:` — makes individual contribution easy to audit.
- Every dev opens a PR into `main` (or a shared `integration` branch) even solo — self-review against the checklist, then merge.
- `Dayflow_Progress_Log.md` gets one line per meaningful commit/session — this is your paper trail for both consistency and grading.

---

## Phase Timeline

| Phase | Time | Who | Goal |
|---|---|---|---|
| **0 — Kickoff** | 0:00–0:30 | All 4 together | Agree on stack, walk the SRS + schema together, split branches, confirm API contract shape (REST paths, response envelope) |
| **1 — Foundation** | 0:30–2:00 | Dev 1 leads; 2/3/4 scaffold their own modules against the agreed contract | Repo scaffold, DB migrations from `Dayflow_schema.sql`, auth (login/bootstrap), RBAC middleware, base layout/routing shell |
| **2 — Parallel build** | 2:00–5:00 | Dev 2, 3, 4 build their modules; Dev 1 hardens security + supports integration | Feature-complete modules per role split below |
| **3 — Integration** | 5:00–6:30 | All 4 | Merge branches, wire frontend↔backend end-to-end, fix seams |
| **4 — QA & security pass** | 6:30–7:30 | All 4, one owner per checklist section | Walk both parts of `Dayflow_Security_and_Quality_Checklist.md` against the live app |
| **5 — Polish & submit** | 7:30–8:00 | All 4 | README, seed/demo data, final commits, tag release |

---

## Role Split (4 Developers)

### Dev 1 — Backend & Platform Lead
**Owns:** repo scaffolding, environment/config, DB migrations, authentication, RBAC, cross-cutting security middleware.
- [ ] Initialize repo structure (frontend/backend or monorepo), ESLint/Prettier/TS config
- [ ] `.env.example`, `.gitignore` (verify `.env` excluded from commit #1)
- [ ] Apply `Dayflow_schema.sql`, set up Prisma schema/migrations
- [ ] Company + Admin bootstrap signup (with email verification) — FR-1
- [ ] Login (Login ID/email + password), httpOnly cookie session, logout — FR-2, FR-5
- [ ] Login ID + initial password auto-generation service (FR-3, FR-4) — this needs a unit test around the year-based sequence counter
- [ ] RBAC middleware (role + ownership checks reusable across routes)
- [ ] Rate limiting, CORS allowlist, helmet-equivalent headers, centralized error handler (no stack traces in prod)
- [ ] Support Devs 2–4 during Phase 2/3 with auth/permissions questions; owns final security checklist pass in Phase 4

### Dev 2 — Employee Directory & Profile
**Owns:** employee CRUD, directory, and the full profile tab set.
- [ ] Admin/HR "Create Employee" flow, calling Dev 1's ID/password generator
- [ ] Employee directory: searchable card grid, status indicator (present/leave/absent) — FR-9, FR-10
- [ ] Employee profile — header + Resume tab (About, skills, certifications) — FR-12, FR-14
- [ ] Private Info tab incl. Bank Details sub-section — FR-13
- [ ] View-only vs. editable profile modes, field-level edit permissions — FR-11, FR-15
- [ ] Avatar upload with validation (type/size/randomized filename) — Security Checklist #20
- [ ] Security tab: change password flow — FR-17

### Dev 3 — Attendance & Time-Off
**Owns:** the two workflow-heavy modules and their shared derived-status logic.
- [ ] Check-in/check-out endpoint + UI control + status dot — FR-8, FR-19
- [ ] Attendance record computation (work hours, extra hours) and day-wise views (self + admin org-wide) — FR-20 to FR-23
- [ ] Leave types + balances seeding/config — FR-24, FR-25
- [ ] Leave request form incl. attachment upload for sick leave — FR-26
- [ ] Approval workflow (pending/approved/rejected), balance updates on decision — FR-27, FR-28
- [ ] Overlap validation on leave requests — FR-29
- [ ] Attendance status derivation tying into leave approvals (Leave/Absent/Half-day logic) — FR-23, state machine in SRS §7

### Dev 4 — Salary Engine, Frontend Shell & Site Quality
**Owns:** the calculation engine, the app shell everyone else's screens sit inside, and the entire frontend hygiene/SEO checklist.
- [ ] Salary structure + component CRUD (Admin/HR only, per SRS §3) — FR-30 to FR-33
- [ ] Calculation + validation engine (recompute on wage change, Σcomponents ≤ wage, Fixed Allowance residual) — FR-34, FR-35. Unit test against the worked example in SRS §8.
- [ ] Payable-days engine (FR-37) as a pure, tested function consuming attendance + leave data
- [ ] Company settings screen (working days/week, break time) — FR-36
- [ ] App shell: routing, top nav (logo/tabs/avatar dropdown), layout, design tokens per `design.md`
- [ ] Full run of Part B of `Dayflow_Security_and_Quality_Checklist.md`: favicon, meta tags, 404 page, single-H1 audit, alt text, `lang` attribute, sourcemap config, bundle size check, console-error sweep

---

## Definition of Done (per module, before opening a PR)
- [ ] Matches the relevant FR numbers in `Dayflow_SRS.md`
- [ ] Every write endpoint has server-side validation + role/ownership check
- [ ] No console errors/warnings on the screens you touched
- [ ] `Dayflow_Progress_Log.md` updated with what you did
- [ ] Self-checked against the applicable rows of `Dayflow_Security_and_Quality_Checklist.md`
