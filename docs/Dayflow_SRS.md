# Dayflow — Software Requirements Specification (SRS)

**Every workday, perfectly aligned.**
Version 1.0 · Status: Draft for team review · Source: `Dayflow - Human Resource Management System.md` + Excalidraw flow diagram (`Human_Resource_Management_System_-_8_hours.svg`)

> This SRS is the single source of truth for all four developers. If the flow diagram, the original requirements doc, and this SRS ever disagree, **this document wins** — the conflicts below were resolved deliberately, not accidentally. If you think a resolution is wrong, raise it with the team before changing behavior, and update this file in the same PR.

---

## 0. Assumptions Declared Up Front

The source SVG is named `..._8_hours.svg`, and the ask describes a 4-person team pushing individually to GitHub for evaluation. This SRS assumes:

- **Time budget:** ~8 hours of build time, worked in parallel by 4 people, not sequentially.
- **Team:** 4 developers, one shared repo, individual branches/commits (see `Dayflow_Team_Plan_and_Phases.md`).
- **Tooling:** Google Antigravity as the primary AI coding agent for each member.
- **Single tenant for the demo:** one company record is enough; multi-company support is not required unless your `design.md` says otherwise.

If any of these are wrong, adjust the phase plan — the module boundaries and data model below don't change.

---

## 1. Introduction

### 1.1 Purpose
Dayflow digitizes core HR operations: authentication, employee records, attendance, leave/time-off, and salary/payroll visibility, with strict role-based access between **Admin**, **HR Officer**, and **Employee**.

### 1.2 In Scope (MVP)
- Authentication (company/admin bootstrap + HR/Admin-provisioned employee accounts)
- Role-based access control (Admin / HR Officer / Employee)
- Employee directory + profile management (Resume, Private Info, Bank Details, Salary Info, Security)
- Attendance: check-in/out, daily/monthly views, org-wide admin view
- Leave/time-off: request, balance tracking, approval workflow
- Salary structure: wage, components, automatic computation, validation
- Payable-days engine (attendance + leave → payroll input)

### 1.3 Out of Scope for MVP (see §9)
Payslip PDF generation, email/SMS notifications, multi-company support, OAuth/SSO, advanced analytics dashboards.

### 1.4 Definitions
| Term | Meaning |
|---|---|
| Admin | Full system access, only role that can edit salary info for others |
| HR Officer | Operational HR role: creates employees, manages attendance/leave. Same permission set as Admin in MVP except salary edit (see §3) |
| Employee | Self-service user: own profile, own attendance, own leave |
| Login ID | System-generated unique username, not user-chosen |
| Payable Days | Days an employee is eligible to be paid for, derived from attendance + leave |

---

## 2. User Roles & Permission Matrix

| Capability | Admin | HR Officer | Employee |
|---|:---:|:---:|:---:|
| Create/deactivate employee accounts | ✅ | ✅ | ❌ |
| View any employee's basic profile (view-only) | ✅ | ✅ | ❌ |
| View own profile (editable subset) | ✅ | ✅ | ✅ |
| Edit any employee's full profile | ✅ | ✅ | ❌ (own limited fields only) |
| View **own** Salary Info (read-only) | ✅ | ✅ | ✅ |
| View/edit **another employee's** Salary Info | ✅ | ❌ (view only, per note in diagram) | ❌ |
| Configure company-wide salary component rules | ✅ | ❌ | ❌ |
| Check in / check out | ✅ | ✅ | ✅ |
| View own attendance | ✅ | ✅ | ✅ |
| View all employees' attendance | ✅ | ✅ | ❌ |
| Submit leave request | ✅ | ✅ | ✅ |
| View own leave requests/balance | ✅ | ✅ | ✅ |
| View all leave requests | ✅ | ✅ | ❌ |
| Approve/reject leave | ✅ | ✅ | ❌ |

**Every row above must be enforced server-side, on every request, regardless of what the UI hides.** See `Dayflow_Security_and_Quality_Checklist.md` item #3–4.

---

## 3. Resolved Ambiguities (read before building)

The two source documents genuinely conflict in a few places. Resolutions:

1. **Public "Sign Up" screen.** The original `.md` doc implies open self-registration; the flow diagram explicitly states *"Normal user cannot register."* **Resolution:** the Sign Up screen is a **one-time Company + first-Admin bootstrap** (Company Name, Admin Name, Email, Phone, Password, Upload Logo). After that, it is disabled/hidden. All employee accounts are created **only** by Admin/HR from inside the app, with auto-generated Login ID + password.
2. **Email verification.** Applies to the one-time Admin bootstrap signup only (verify the admin's email before the company account activates). Employees never self-register, so they don't go through email verification — they log in with the credentials HR/Admin issues them.
3. **Salary Info visibility.** The diagram says *"Salary Info tab should only be visible to Admin"*; the original doc says *"Payroll data is read-only for employees."* **Resolution:** an employee can view their **own** Salary Info tab, read-only. Only Admin can view/edit **other employees'** salary. HR Officer can view other employees' salary (needed to do HR work) but cannot edit it — flag this for confirmation if your evaluators clarify otherwise.
4. **Admin vs HR Officer distinction.** Not fully specified in the source. MVP treats them identically except salary-edit rights (§2). Document this as an open item, don't silently invent more differences.
5. **Leave balances (24 days PTO / 7 days sick) and salary numbers (₹50,000 wage, 12% PF, etc.)** shown in the mockup are **example/seed data**, not hardcoded business rules. Make them configurable (`leave_types.default_allocation_days`, company salary-rule defaults).
6. **Working days/week and break time** are company-level settings (not per-employee), editable by Admin.

---

## 4. Functional Requirements

### 4.1 Authentication & Authorization
- **FR-1** One-time Company/Admin bootstrap: Company Name, Logo upload, Admin Name, Email, Phone, Password, Confirm Password. Requires email verification before first login.
- **FR-2** Sign-in: Login ID or Email + Password. Generic error message on failure ("Invalid credentials") — never reveal which field was wrong.
- **FR-3** Login ID auto-generation on employee creation, format:
  `[CompanyPrefix][First 2 letters of first name + first 2 letters of last name][YYYY joining year][4-digit sequence for that year]`
  Example: `OIJODO20220001`. The sequence increments per company per joining year; must be generated inside a DB transaction/unique constraint to avoid race conditions when two employees are created concurrently.
- **FR-4** Initial password is system-generated (cryptographically random, meets the policy in §6.1), shown once to the creating Admin/HR, and hashed before storage. **Recommended addition (not explicit in source, added for security):** force a password change on first login (`must_change_password` flag) — flag this as a deliberate enhancement when you demo it.
- **FR-5** Session handling: httpOnly, Secure, SameSite cookie — never localStorage (see security checklist #10).
- **FR-6** Role-based redirect after login (all roles land on the same dashboard shell; visible modules differ by role).

### 4.2 Dashboard / Navigation
- **FR-7** Persistent top nav: Company Logo · Employees · Attendance · Time Off · Check-in status dot · Avatar (dropdown: My Profile, Log Out).
- **FR-8** Check-in status dot: red = not checked in today, green = checked in. Updates immediately on successful check-in without a full page reload.
- **FR-9** Employees tab: searchable grid of employee cards (avatar, name, status indicator). Admin/HR see a "New Employee" action; Employee role does not.
- **FR-10** Employee card status indicator (Admin/HR view of the directory): 🟢 present (checked in today) · ✈️ on approved leave today · 🟡 absent (no check-in, no approved leave).
- **FR-11** Clicking another employee's card opens their profile in **view-only** mode. Clicking your own avatar → "My Profile" opens your own profile in **editable** mode (within the fields you're allowed to edit, §2).

### 4.3 Employee Profile
Profile is tabbed: **Resume | Private Info | Salary Info | Security**

- **FR-12 Resume tab:** About, "What I love about my job", Interests/hobbies (free text, self-editable), Skills (add/remove chips), Certifications (add/remove).
- **FR-13 Private Info tab:** Date of Birth, Residing Address, Nationality, Personal Email, Gender, Marital Status, Date of Joining (read-only after creation), Emp Code (read-only), PAN No, UAN No, plus **Bank Details** sub-section: Account Number, Bank Name, IFSC Code.
- **FR-14 Header fields** (always visible): Name, Login ID (read-only), Email, Mobile, Company, Department, Job Position, Manager, Location.
- **FR-15 Edit permissions:** Employee can edit own — address, phone, profile picture, About/skills/interests. Admin/HR can edit **all** fields for **any** employee. Login ID and Emp Code are immutable once generated.
- **FR-16 Salary Info tab:** see §4.6 for computation logic; visibility per §3 resolution #3.
- **FR-17 Security tab:** change password (requires current password), enforces policy in §6.1.
- **FR-18** File uploads (avatar, sick-leave attachment, resume/certification files if implemented) must pass the validation rules in the security checklist (#20) — type allowlist, size limit, randomized storage filename.

### 4.4 Attendance
- **FR-19** Check-In / Check-Out control in the top nav, available to every logged-in user. One check-in and one check-out per calendar day (server-enforced, not just UI-disabled).
- **FR-20** Attendance record fields: Date, Day, Check-In time, Check-Out time, Work Hours (computed), Extra Hours (computed against configured standard hours), Break Time (from company settings).
- **FR-21** Employee attendance view: day-wise, default to current month, own records only, with prev/next month navigation.
- **FR-22** Admin/HR attendance view: all employees, filterable by date, default to "today."
- **FR-23** Status types per record: Present, Absent, Half-day, Leave — derived, not manually set (Leave comes from an approved leave request covering that date; Absent = working day with no check-in and no approved leave; Half-day = check-in but work hours below a configurable threshold).

### 4.5 Leave / Time-Off
- **FR-24** Leave types: Paid Time Off, Sick Leave, Unpaid Leave — stored as configurable records, not hardcoded strings.
- **FR-25** Leave balance per employee per leave type per year: Allocated − Used = Available. Displayed on the employee's Time-Off screen.
- **FR-26** Leave request form: Leave Type, Start date, End date (validity period), auto-computed day count, Remarks, optional Attachment (required-by-policy only for Sick Leave certificates — enforce file rules per #20).
- **FR-27** Leave request status lifecycle: `Pending → Approved | Rejected`. No further transitions once decided (create a new request instead of editing a decided one).
- **FR-28** Employee: can view/create only their own requests. Admin/HR: can view all requests, approve/reject, and add a review comment. Approving/rejecting must update the leave balance and attendance-derived status atomically.
- **FR-29** Overlapping leave requests for the same employee/date range should be rejected at the API level with a clear validation error.

### 4.6 Salary Information (Admin/HR configuration, per §3 visibility rules)
- **FR-30** Wage Type: Fixed wage (MVP scope only — don't build hourly/variable wage UI).
- **FR-31** Monthly Wage is the single source input; Yearly Wage = Monthly × 12, always derived, never independently editable.
- **FR-32** Salary Components, each with a `computation_type` of `FIXED_AMOUNT` or `PERCENTAGE`, and a `percentage_of` base of `WAGE` or `BASIC`:
  | Component | Default computation | Example |
  |---|---|---|
  | Basic Salary | % of Wage | 50% of ₹50,000 = ₹25,000 |
  | House Rent Allowance | % of Basic | 50% of ₹25,000 = ₹12,500 |
  | Standard Allowance | Fixed amount | ₹4,167 |
  | Performance Bonus | % of Basic | 8.33% of ₹25,000 = ₹2,082.50 |
  | Leave Travel Allowance | % of Basic | 8.33% of ₹25,000 = ₹2,082.50 |
  | Fixed Allowance | **Residual** = Wage − Σ(all other components) | balancing figure, never entered directly |
- **FR-33** Deductions, shown separately from earnings components: Employee PF (% of Basic, e.g. 12%), Employer PF (% of Basic, informational, not deducted from employee pay), Professional Tax (fixed amount/month, deducted from gross).
- **FR-34** Validation: `Σ(earning components) ≤ Monthly Wage`. Reject the save with a specific error if violated — never silently clamp values.
- **FR-35** Recalculation: changing Monthly Wage must recompute every percentage-based component automatically; Fixed Allowance recalculates last, as the residual.
- **FR-36** Company settings: No. of working days/week, Break time (hrs) — used by both attendance (extra-hours calc) and payroll (payable-days calc).

### 4.7 Payroll Dependency Engine (backbone, not a UI screen in MVP)
- **FR-37** Payable Days for a period = Total working days in period − Unpaid Leave days − Unexplained Absent days (no check-in, no approved leave). This must be a pure, testable function — it's the piece evaluators are most likely to probe with edge cases.
- **FR-38** This engine doesn't need a payslip UI for MVP (see §9), but its output (payable days, computed component amounts) should be exposed via an internal service/API so it can be demoed or wired into a "Preview Payslip" screen if time allows.

---

## 5. Data Model Overview

See `Dayflow_schema.sql` for the full DDL — every developer must use that file as-is; don't create parallel migrations with different column names.

**Core entities:** `companies`, `users` (employees, includes role), `bank_details`, `skills`, `certifications`, `attendance_records`, `leave_types`, `leave_balances`, `leave_requests`, `salary_structures`, `salary_components`, `audit_logs`, `refresh_tokens`.

**Key relationships:**
- `users.company_id → companies.id`
- `users.manager_id → users.id` (self-referencing, nullable)
- `attendance_records.user_id → users.id`
- `leave_requests.user_id → users.id`, `leave_requests.leave_type_id → leave_types.id`
- `salary_components.salary_structure_id → salary_structures.id`, `salary_structures.user_id → users.id`

---

## 6. Non-Functional Requirements

### 6.1 Security
Full checklist with required countermeasures for every listed AI failure mode lives in `Dayflow_Security_and_Quality_Checklist.md`. Headline rules baked into this SRS:
- Passwords: bcrypt/argon2 hashed, min 10 chars, mixed case + number + symbol, enforced server-side.
- All authorization checks re-verified server-side on every request — UI hiding a button is never sufficient.
- Parameterized queries / ORM only, everywhere.
- Rate limiting on `/auth/login`, `/auth/*`, and all write endpoints.

### 6.2 Performance & Scalability
- Employee directory and attendance/leave lists must be paginated server-side (never "load all employees").
- Salary computation logic isolated in a pure service layer so it can be unit-tested and later moved to a background job without touching controllers.
- DB indexes on: `users.login_id`, `users.email`, `attendance_records(user_id, date)`, `leave_requests(user_id, status)`.

### 6.3 Usability
- Every destructive/irreversible action (reject leave, deactivate employee) requires a confirmation step.
- Form validation errors shown inline, next to the field, not just as a toast.
- Empty states designed intentionally (e.g., "No leave requests yet") — not blank tables.

### 6.4 Accessibility & Frontend Technical Hygiene
Full checklist in `Dayflow_Security_and_Quality_Checklist.md` (favicon, meta tags, 404 page, alt text, single H1, lang attribute, bundle size, console errors, source maps, etc.).

---

## 7. State Machines

**Attendance record (per employee per day, derived — no manual status field):**
```
No check-in yet ──check-in──> Checked In (green dot) ──check-out──> Completed
No check-in + no approved leave by EOD ──> Absent
Approved leave covers date ──> Leave
Checked in, work hours < half-day threshold ──> Half-day
```

**Leave request:**
```
Draft (client-side only) ──submit──> Pending ──approve──> Approved
                                     Pending ──reject───> Rejected
(Approved/Rejected are terminal — no further transitions)
```

**Employee account:**
```
Created by Admin/HR (auto ID + password, must_change_password=true)
   ──first login + password change──> Active
   ──admin deactivates──> Inactive (login blocked, data retained)
```

---

## 8. Salary Calculation Reference Example

Given Monthly Wage = ₹50,000:

| Component | Rule | Amount |
|---|---|---|
| Basic | 50% of Wage | ₹25,000.00 |
| HRA | 50% of Basic | ₹12,500.00 |
| Standard Allowance | Fixed | ₹4,167.00 |
| Performance Bonus | 8.33% of Basic | ₹2,082.50 |
| LTA | 8.33% of Basic | ₹2,082.50 |
| Fixed Allowance | Residual (Wage − above) | ₹4,168.00 |
| **Sum of earnings** | | **≤ ₹50,000.00** ✓ |
| Employee PF (deduction) | 12% of Basic | ₹3,000.00 |
| Professional Tax (deduction) | Fixed | ₹200.00 |

Use this table as your unit-test fixture for the salary engine.

---

## 9. Out of Scope / Future Enhancements
- Payslip PDF generation & download
- Email/SMS notification alerts
- Analytics/reports dashboard
- Multi-company / multi-tenant support
- SSO/OAuth login
- Overtime pay rules, holiday calendars, timezone handling

## 10. Open Questions to Confirm (don't silently invent answers)
- Exact permission split between Admin and HR Officer beyond salary editing.
- Whether Sick Leave attachments are mandatory or optional.
- Whether unpaid leave requires balance tracking at all, or is unlimited by definition.
- Half-day work-hour threshold (suggest 4 hours as a placeholder — confirm or keep configurable).
