-- =====================================================================
-- Dayflow HRMS — Canonical Database Schema (PostgreSQL)
-- =====================================================================
-- This is the single source of truth for the data model. All four
-- developers use this file as-is (via Prisma `db pull`/migration or
-- direct psql). Do not create parallel schemas with different column
-- names — that is the #1 way a 4-person / 8-hour build falls apart
-- on integration.
--
-- Primary keys are UUIDs everywhere (see Security Checklist #14 —
-- predictable IDs). `login_id` is a separate, human-readable business
-- identifier used only for sign-in, never as a lookup key elsewhere.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('ADMIN', 'HR_OFFICER', 'EMPLOYEE');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE');
CREATE TYPE leave_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE computation_type AS ENUM ('FIXED_AMOUNT', 'PERCENTAGE');
CREATE TYPE percentage_base AS ENUM ('WAGE', 'BASIC');
CREATE TYPE salary_component_key AS ENUM (
  'BASIC', 'HRA', 'STANDARD_ALLOWANCE', 'PERFORMANCE_BONUS',
  'LTA', 'FIXED_ALLOWANCE', 'PROFESSIONAL_TAX', 'PF_EMPLOYEE', 'PF_EMPLOYER'
);

-- ---------------------------------------------------------------------
-- COMPANIES
-- ---------------------------------------------------------------------
CREATE TABLE companies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                VARCHAR(255) NOT NULL,
  login_prefix        VARCHAR(4) NOT NULL,          -- e.g. 'OI' used in Login ID generation
  logo_url            TEXT,
  working_days_per_week SMALLINT NOT NULL DEFAULT 5,
  break_time_minutes  SMALLINT NOT NULL DEFAULT 60,
  standard_work_hours NUMERIC(4,2) NOT NULL DEFAULT 8.00,
  half_day_threshold_hours NUMERIC(4,2) NOT NULL DEFAULT 4.00,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- USERS (employees, including Admin/HR — one table, role column)
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  login_id            VARCHAR(32) NOT NULL UNIQUE,   -- e.g. OIJODO20220001
  emp_code            VARCHAR(32) NOT NULL UNIQUE,
  email               CITEXT NOT NULL UNIQUE,        -- work email, requires `citext` ext (optional)
  personal_email      CITEXT,
  password_hash       TEXT NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  role                user_role NOT NULL DEFAULT 'EMPLOYEE',
  status              user_status NOT NULL DEFAULT 'ACTIVE',

  first_name          VARCHAR(100) NOT NULL,
  last_name            VARCHAR(100) NOT NULL,
  phone               VARCHAR(20),
  avatar_url          TEXT,

  department          VARCHAR(100),
  job_position        VARCHAR(100),
  manager_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  location            VARCHAR(150),
  date_of_joining     DATE NOT NULL,

  -- Private Info
  date_of_birth       DATE,
  residing_address    TEXT,
  nationality         VARCHAR(100),
  gender              VARCHAR(30),
  marital_status      VARCHAR(30),
  pan_no              VARCHAR(20),
  uan_no              VARCHAR(20),

  -- Resume
  about               TEXT,
  job_love_text       TEXT,
  interests           TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_login_id ON users(login_id);
CREATE INDEX idx_users_email ON users(email);

-- Login ID sequence per company per joining year (prevents race conditions
-- when two employees are created concurrently in the same year).
CREATE TABLE login_id_sequences (
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  joining_year SMALLINT NOT NULL,
  next_seq     INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (company_id, joining_year)
);

-- ---------------------------------------------------------------------
-- BANK DETAILS (1:1 with users)
-- ---------------------------------------------------------------------
CREATE TABLE bank_details (
  user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  account_number  TEXT NOT NULL,   -- encrypt at the application layer before insert
  bank_name       VARCHAR(150),
  ifsc_code       VARCHAR(20),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- SKILLS / CERTIFICATIONS
-- ---------------------------------------------------------------------
CREATE TABLE skills (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name      VARCHAR(100) NOT NULL
);
CREATE INDEX idx_skills_user ON skills(user_id);

CREATE TABLE certifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(200) NOT NULL,
  issued_by    VARCHAR(200),
  issued_on    DATE
);
CREATE INDEX idx_certifications_user ON certifications(user_id);

-- ---------------------------------------------------------------------
-- ATTENDANCE
-- ---------------------------------------------------------------------
CREATE TABLE attendance_records (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date           DATE NOT NULL,
  check_in_at    TIMESTAMPTZ,
  check_out_at   TIMESTAMPTZ,
  work_hours     NUMERIC(5,2),      -- computed on check-out
  extra_hours    NUMERIC(5,2),      -- computed against company standard_work_hours
  status         attendance_status NOT NULL DEFAULT 'ABSENT',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
CREATE INDEX idx_attendance_user_date ON attendance_records(user_id, date);
CREATE INDEX idx_attendance_date ON attendance_records(date);

-- ---------------------------------------------------------------------
-- LEAVE / TIME-OFF
-- ---------------------------------------------------------------------
CREATE TABLE leave_types (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id             UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name                   VARCHAR(50) NOT NULL,    -- 'Paid Time Off' | 'Sick Leave' | 'Unpaid Leave'
  is_paid                BOOLEAN NOT NULL DEFAULT true,
  requires_attachment    BOOLEAN NOT NULL DEFAULT false,
  default_allocation_days NUMERIC(5,2) NOT NULL DEFAULT 0,
  UNIQUE (company_id, name)
);

CREATE TABLE leave_balances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type_id   UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  year            SMALLINT NOT NULL,
  allocated_days  NUMERIC(5,2) NOT NULL DEFAULT 0,
  used_days       NUMERIC(5,2) NOT NULL DEFAULT 0,
  UNIQUE (user_id, leave_type_id, year)
);

CREATE TABLE leave_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type_id    UUID NOT NULL REFERENCES leave_types(id),
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  days_requested   NUMERIC(5,2) NOT NULL,
  remarks          TEXT,
  attachment_url   TEXT,
  status           leave_status NOT NULL DEFAULT 'PENDING',
  reviewed_by      UUID REFERENCES users(id),
  reviewed_at      TIMESTAMPTZ,
  review_comment   TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);
CREATE INDEX idx_leave_requests_user_status ON leave_requests(user_id, status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- ---------------------------------------------------------------------
-- SALARY
-- ---------------------------------------------------------------------
CREATE TABLE salary_structures (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  monthly_wage     NUMERIC(12,2) NOT NULL,
  wage_type        VARCHAR(20) NOT NULL DEFAULT 'FIXED',
  effective_from   DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_salary_structures_user ON salary_structures(user_id);

CREATE TABLE salary_components (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salary_structure_id UUID NOT NULL REFERENCES salary_structures(id) ON DELETE CASCADE,
  component_key       salary_component_key NOT NULL,
  computation_type    computation_type NOT NULL,
  percentage_base      percentage_base,             -- NULL when FIXED_AMOUNT
  configured_value     NUMERIC(12,4) NOT NULL,       -- % value or fixed amount, per computation_type
  computed_amount      NUMERIC(12,2) NOT NULL,        -- always recomputed by the service layer, never trust client input
  UNIQUE (salary_structure_id, component_key)
);

-- ---------------------------------------------------------------------
-- AUDIT LOG (cheap, high-value — logs who changed what)
-- ---------------------------------------------------------------------
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id),
  action        VARCHAR(100) NOT NULL,   -- e.g. 'LEAVE_APPROVED', 'SALARY_UPDATED'
  entity        VARCHAR(100) NOT NULL,   -- e.g. 'leave_requests'
  entity_id     UUID,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);

-- ---------------------------------------------------------------------
-- REFRESH TOKENS / SESSIONS
-- ---------------------------------------------------------------------
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- =====================================================================
-- OPTIONAL: Row-Level Security example (Security Checklist item #3)
-- Enable if you want DB-enforced defense-in-depth in addition to
-- service-layer filtering. Requires setting `app.current_user_id` and
-- `app.current_user_role` via `SET LOCAL` at the start of each request
-- transaction from the backend.
-- =====================================================================
-- ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY attendance_self_or_admin ON attendance_records
--   USING (
--     user_id = current_setting('app.current_user_id')::uuid
--     OR current_setting('app.current_user_role') IN ('ADMIN', 'HR_OFFICER')
--   );
--
-- Apply the same pattern to leave_requests and salary_structures once
-- the app sets the session variables consistently.
