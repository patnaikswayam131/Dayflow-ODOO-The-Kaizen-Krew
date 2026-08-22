# Dayflow — Progress Log

Update this on every meaningful commit or work session (not every single commit if you're committing every 5 minutes — but at least once per hour per person). This is your evidence trail for individual contribution and for reconstructing "why did we build it this way" after the fact.

**Format:** one row per entry. Keep entries factual and specific — "fixed bug" is not useful, "fixed leave-balance not decrementing on approval (off-by-one in days_requested calc)" is.

| Date | Time | Author | Phase | Module | Summary | Branch / Commit | Status |
|---|---|---|---|---|---|---|---|
| 2026-08-22 | 11:19 AM | All | 0 — Kickoff | Planning | Team aligned on stack (React/Vite/TS + Express/Fastify + Prisma + Postgres), reviewed SRS and schema together, branch names assigned | `main` | ✅ Done |
| 2026-08-22 | 11:53 | Dev 1 | 1 — Foundation | Auth/RBAC | Password service: cryptographic password generation (FR-4) with bcrypt hashing, policy validation (min 10 chars, upper+lower+number+symbol). 17 unit tests passing. | `feat/auth-foundation` | ✅ Done |
| 2026-08-22 | 12:00 | Dev 1 | 1 — Foundation | Auth/RBAC | Login ID auto-generation (FR-3): format [prefix][2+2 name chars][year][4-digit seq], atomic INSERT...ON CONFLICT for race-condition safety via login_id_sequences table. 14 unit tests passing. | `feat/auth-foundation` | ✅ Done |
| 2026-08-22 | 12:02 | Dev 1 | 1 — Foundation | Auth/RBAC | Auth service: company bootstrap (FR-1) with email verification gating, login with generic error messages (FR-2), JWT access+refresh tokens in httpOnly cookies (FR-5), token rotation with reuse detection, password change with session revocation. | `feat/auth-foundation` | ✅ Done |
| 2026-08-22 | 12:03 | Dev 1 | 1 — Foundation | Auth/RBAC | Auth routes: POST /bootstrap, GET /bootstrap/status, POST /login, POST /refresh, POST /logout, POST /verify-email, POST /change-password, GET /me. All Zod-validated. | `feat/auth-foundation` | ✅ Done |
| 2026-08-22 | 12:04 | Dev 1 | 1 — Foundation | Auth/RBAC | Employee creation endpoint (POST /employees) with auto-generated Login ID + password. Creates employee with must_change_password=true, password returned once in response, never logged. | `feat/auth-foundation` | ✅ Done |
| 2026-08-22 | 12:04 | Dev 1 | 1 — Foundation | Auth/RBAC | RBAC middleware: added requireSelfOrRole(paramName, roles) convenience helper alongside existing requireRole and requireOwnerOrRole. | `feat/auth-foundation` | ✅ Done |
| 2026-08-22 | 12:05 | Dev 1 | 1 — Foundation | Auth/RBAC | Schema additions: email_verified boolean on users table, email_verification_tokens model. Non-breaking additive changes. | `feat/auth-foundation` | ✅ Done |
| 2026-08-22 | 13:20 | Dev 1 | 1 — Foundation | Auth/UI | Tabbed Sign-in/Initial Setup UI, demo credentials autofill, and offline local fallback in AuthContext for dev environment. | `feat/auth-foundation` | ✅ Done |
| | | Dev 2 | 1/2 — Employee | | | | ☐ Not started |
| | | Dev 3 | 1/2 — Attendance/Leave | | | | ☐ Not started |
| | | Dev 4 | 1/2 — Salary/Shell | | | | ☐ Not started |
| | | | 3 — Integration | | | | ☐ Not started |
| | | | 4 — QA/Security pass | | | | ☐ Not started |
| | | | 5 — Polish/Submit | | | | ☐ Not started |

## Blockers / Open Decisions
Log anything that stalled progress or needed a team decision, with the resolution:

| Date | Raised by | Issue | Resolution |
|---|---|---|---|
| 2026-08-22 | Dev 1 | Schema missing `email_verified` column and verification tokens table needed for FR-1 email verification | Added `email_verified Boolean @default(false)` to users model and created `email_verification_tokens` model in Prisma schema. Non-breaking additive change. |
| 2026-08-22 | Dev 1 | `emp_code` generation format unspecified in SRS | Using `EMP-[4-digit seq]` format (e.g., `EMP-0001`). Counter is company-scoped. |
| 2026-08-22 | Dev 1 | Email verification needs real email provider, but SRS §9 puts email "out of scope" | Dev-mode bypass: verification token logged to console. Infrastructure (DB table, token hashing, verification endpoint) is fully in place for when email is added. |

## Deviations from the SRS
If you had to deviate from `Dayflow_SRS.md` under time pressure, log it here rather than silently shipping something different from the spec — this is what evaluators will ask about first.

| Date | Module | SRS section | What changed | Why |
|---|---|---|---|---|
| 2026-08-22 | Auth | FR-1 (email verification) | Email verification uses console-logged token in dev mode instead of real email delivery | SRS §9 lists email notifications as "Out of Scope for MVP" — the verification infrastructure is complete, just needs an email provider wired in |
| 2026-08-22 | Auth | Schema (not in SRS) | Added `email_verified` field to users table and `email_verification_tokens` table | These were missing from the canonical schema but are required to implement FR-1's email verification requirement. Flagged as deliberate enhancement. |
