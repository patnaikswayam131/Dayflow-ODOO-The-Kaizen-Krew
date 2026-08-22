# Dayflow — Progress Log

Update this on every meaningful commit or work session (not every single commit if you're committing every 5 minutes — but at least once per hour per person). This is your evidence trail for individual contribution and for reconstructing "why did we build it this way" after the fact.

**Format:** one row per entry. Keep entries factual and specific — "fixed bug" is not useful, "fixed leave-balance not decrementing on approval (off-by-one in days_requested calc)" is.

| Date | Time | Author | Phase | Module | Summary | Branch / Commit | Status |
|---|---|---|---|---|---|---|---|
| | | | 0 — Kickoff | Planning | Team aligned on stack (React/Vite/TS + Express/Fastify + Prisma + Postgres), reviewed SRS and schema together, branch names assigned | `main` | ✅ Done |
| | | Dev 1 | 1 — Foundation | Auth/RBAC | | | ☐ In progress |
| | | Dev 2 | 1/2 — Employee | | | | ☐ Not started |
| | | Dev 3 | 1/2 — Attendance/Leave | | | | ☐ Not started |
| 2026-08-22 | 12:48 | Dev 4 | 1/2 — Salary/Shell | Salary & Shell | Implemented pure salary engine (FR-31-35), payable days engine (FR-37), company settings (FR-36), salary API & UI, top nav shell, and Security Checklist Part B audit | `feat/salary-shell` | ✅ Done |
| 2026-08-22 | 13:33 | Dev 4 | 3 — Integration | HRMS Full Suite | Built interactive HRMS web application with Auth Context, Live Demo Role Switcher, Employees Directory, Profile Tabs, Attendance Tracking (Check-In/Out), Leave Requests & Manager Approval Workflow | `feat/salary-shell` | ✅ Done |
| | | | 3 — Integration | | | | ☐ Not started |
| | | | 4 — QA/Security pass | | | | ☐ Not started |
| | | | 5 — Polish/Submit | | | | ☐ Not started |

## Blockers / Open Decisions
Log anything that stalled progress or needed a team decision, with the resolution:

| Date | Raised by | Issue | Resolution |
|---|---|---|---|
| | | | |

## Deviations from the SRS
If you had to deviate from `Dayflow_SRS.md` under time pressure, log it here rather than silently shipping something different from the spec — this is what evaluators will ask about first.

| Date | Module | SRS section | What changed | Why |
|---|---|---|---|---|
| | | | | |
