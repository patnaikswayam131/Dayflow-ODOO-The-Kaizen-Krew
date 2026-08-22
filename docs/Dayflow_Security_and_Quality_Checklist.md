# Dayflow — Security & Technical Quality Checklist

This is a **gate, not a wishlist**. Nobody merges a PR that fails an applicable row. Reviewer checks this file against the diff before approving. Copy the relevant section into your PR description and tick items as you satisfy them.

Recommended stack referenced below (see `Dayflow_Team_Plan_and_Phases.md` for full rationale): **React + Vite + TypeScript** (frontend), **Node.js + Express/Fastify + TypeScript + Prisma** (backend), **PostgreSQL** (database). Swap tool names if your team picks differently — the *requirement* in the middle column doesn't change.

---

## Part A — Backend / Application Security

| # | Failure mode | Required countermeasure |
|---|---|---|
| 1 | `.env` committed to GitHub | `.gitignore` includes `.env`, `.env.*` from commit #1. Commit `.env.example` with **placeholder** keys only. Run `git secrets` / `gitleaks` locally or as a pre-commit hook before the first push. |
| 2 | API keys in frontend | No secret key is ever shipped in frontend bundle or `VITE_*` env vars. Third-party calls (if any — keep to a minimum per SRS) go through the backend, which holds the real key server-side. |
| 3 | No Row-Level Security | Every query that returns "my data" (attendance, leave requests, own profile) filters by the authenticated user's ID **in the service layer**, not the client. If using Postgres, add the RLS policies in `Dayflow_schema.sql` as a second line of defense. |
| 4 | Frontend-only permission checks | Hiding a button ≠ authorization. Every API route re-checks role + resource ownership server-side, independent of what the UI sent. Write at least one test per role per protected route confirming a 403 for the wrong role. |
| 5 | No rate limiting | Rate-limit `/auth/login`, `/auth/change-password`, and all `POST/PUT/PATCH/DELETE` routes (e.g. `express-rate-limit` or `@fastify/rate-limit`). Stricter limits on auth endpoints (e.g. 5 attempts / 15 min / IP). |
| 6 | SQL string concatenation | Prisma (or equivalent ORM/query builder) only. No manual string interpolation into SQL, ever — including "just this one admin report query." |
| 7 | No input validation | Zod (or Joi/Yup) schema on every request body/query/param, on the server — client-side validation is UX only, never authoritative. Validate business rules too (e.g. salary component sum ≤ wage, date ranges valid). |
| 8 | User content rendered as raw HTML | Never `dangerouslySetInnerHTML` on user-entered text (About, interests, remarks, comments). Render as plain text/escaped by default. |
| 9 | Plain-text passwords | bcrypt or argon2 with proper cost factor. Never log passwords (including auto-generated ones) anywhere persistent — show the generated password to the creating Admin/HR exactly once in the response payload, never store or log it in plaintext. |
| 10 | Auth token in localStorage | Session/JWT stored in an httpOnly, Secure, SameSite cookie. If using JWT, short-lived access token + rotating refresh token, both cookie-based. |
| 11 | OAuth admin panel / implicit admin trust | Not using OAuth for MVP (internal login only per SRS §3). Principle still applies: no endpoint infers "isAdmin" from a client-supplied field — always re-derive role from the authenticated session on the server. |
| 12 | CORS set to `*` | Explicit origin allowlist (your deployed frontend URL(s) only). `credentials: true` is only ever paired with an explicit origin, never a wildcard. |
| 13 | No email verification | Applies to the one-time Company/Admin bootstrap signup (SRS §3, resolution 1–2) — verify that email before activation. Employees never self-register, so this doesn't apply to employee accounts. |
| 14 | Predictable IDs | All DB primary keys / URL resource identifiers are UUIDs — never auto-increment integers exposed in a URL or API response (prevents IDOR/enumeration). Login ID is an intentional human-readable *username*, not a lookup key for authorization — keep it separate from the primary key. |
| 15 | Saving the whole request body | Explicitly whitelist/pick fields before writing to the DB (e.g. via a Zod schema or DTO) — never `db.update(req.body)`. Prevents mass-assignment (e.g. a client sneaking `role: "ADMIN"` into a profile-update payload). |
| 16 | Unverified webhook signatures | No inbound webhooks in MVP scope. If one is added later (e.g. email provider delivery events), verify its HMAC signature before processing — don't trust the payload. |
| 17 | Stack traces in production responses | Centralized error handler: generic message + error code to the client in production; full stack trace only to server-side logs (e.g. pino/winston). Gate on `NODE_ENV`. |
| 18 | Outdated dependencies | Lockfile committed. Enable Dependabot (or run `npm audit` / `pnpm audit`) before final submission; no known-critical vulnerabilities open at handoff. |
| 19 | No password strength requirement | Server-side policy: min 10–12 chars, upper+lower+number+symbol. Reject weak passwords with a specific message, both at bootstrap-admin signup and at "change password." |
| 20 | No file upload validation | Allowlist MIME type + extension (avatars: jpg/png/webp; sick-leave attachment: pdf/jpg/png). Enforce a max size (e.g. 5MB). Store with a randomized filename, never the client-supplied name. Don't trust the client-reported `Content-Type` header alone — verify actual file signature/bytes server-side. |

---

## Part B — Frontend Technical Hygiene / SEO Basics

These matter less for an internal, auth-gated tool than for a public site — but they're free, and graders will open dev tools. Apply the "public route" items (login, 404, landing) fully; apply the rest as general hygiene across the app.

| # | Failure mode | Required countermeasure |
|---|---|---|
| 1 | `view-source` essentially empty | `index.html` ships a real `<title>`, meta description, and a `<noscript>` fallback message even though the app is a Vite/React SPA. Full prerendering isn't required for an internal tool — don't over-invest here. |
| 2 | No 404 page | Catch-all route renders a branded "Page not found" screen with a link back to the dashboard/login. |
| 3 | Vite + React works only in-browser | Confirm the production build (`vite build` + `vite preview`) actually runs clean, not just the dev server — check this before submission. |
| 4 | Same `<title>` on every page | Update `document.title` per route (React Router's `<title>` via a small hook, or `react-helmet-async`). |
| 5 | No meta description | Set on public pages (login, 404) at minimum. |
| 6 | No `og:image` | Add basic Open Graph tags on the login/landing page. |
| 7 | No structured data | Optional JSON-LD `Organization`/`WebSite` on the public landing/login page only — skip for authenticated app screens. |
| 8 | Multiple `<h1>`s | Exactly one `<h1>` per rendered page. |
| 9 | No `<h1>` at all | Every page has exactly one. |
| 10 | No canonical tag | Add `<link rel="canonical">` on public pages. |
| 11 | No `llms.txt` | Add a short `/llms.txt` at the site root describing what Dayflow is (a few lines is enough). |
| 12 | `robots.txt` blocks everything, including reasonable AI/crawler access | Decide deliberately: since almost everything is behind auth, `Disallow: /app` (or your authenticated route prefix) is fine — don't blanket-block `/` by default without thinking about it. |
| 13 | No favicon | Add `favicon.ico` + an apple-touch-icon. |
| 14 | No `sitemap.xml` | Generate one covering the public routes only (login, 404 isn't included). |
| 15 | No `lang` attribute | `<html lang="en">` in `index.html`. |
| 16 | Missing alt text | Every `<img>` (avatars, logos) has meaningful `alt`; purely decorative icons use `alt=""`. |
| 17 | Source maps exposed in production | `build.sourcemap: false` in `vite.config.ts` for production builds (or upload privately to an error tracker only, never publicly served). |
| 18 | Console errors/warnings | Zero console errors on every screen at demo time. ESLint + `tsc --noEmit` run clean in CI before merge. |
| 19 | Massive JS bundle | Route-based code splitting (`React.lazy` + `Suspense`), avoid unnecessary heavy dependencies, check bundle size with `vite-bundle-visualizer` before submission, lazy-load non-critical images. |

---

## How this gets enforced across 4 people
1. Commit this file and `Dayflow_schema.sql` to the repo **first**, before any feature branch starts — every Antigravity session should be pointed at both (see `Dayflow_Antigravity_Prompts.md`).
2. Add ESLint + Prettier + `tsc --noEmit` as a required check (even a simple `npm run verify` script run manually before each push is enough for an 8-hour window — full CI is a nice-to-have, not the priority).
3. Whoever does the final integration pass (see phase plan) runs down this whole file against the merged app before submission.
