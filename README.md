# Dayflow — Human Resource Management System

> *Every workday, perfectly aligned.*

Dayflow digitizes core HR operations: authentication, employee records, attendance, leave/time-off, and salary/payroll visibility, with strict role-based access between **Admin**, **HR Officer**, and **Employee**.

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **PostgreSQL** ≥ 14

### 1. Clone & Install

```bash
git clone <repo-url>
cd dayflow
npm install
```

### 2. Environment Setup

Copy the example env files and fill in your values:

```bash
# Backend
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — set DATABASE_URL, JWT secrets, FRONTEND_URL

# Frontend
cp apps/web/.env.example apps/web/.env
```

Generate JWT secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Database Setup

Create a PostgreSQL database:
```sql
CREATE DATABASE dayflow;
```

Enable the `pgcrypto` extension (required for UUID generation):
```sql
\c dayflow
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

Run Prisma migrations:
```bash
cd apps/api
npx prisma db push
npx prisma generate
```

### 4. Seed Data (Optional)

```bash
cd apps/api
npm run prisma:seed
```

> **Note:** Seed script is a placeholder — each developer will add seed data for their module.

### 5. Run Dev Servers

From the repo root:
```bash
npm run dev
```

This starts both servers concurrently:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api/v1/health

### 6. Verify

```bash
npm run verify    # lint + typecheck across all workspaces
```

---

## Project Structure

```
dayflow/
├── apps/
│   ├── api/                 # Express + TypeScript backend
│   │   ├── prisma/          # Schema & migrations
│   │   ├── src/
│   │   │   ├── lib/         # Prisma client, error classes
│   │   │   ├── middleware/   # Auth, CORS, helmet, rate limiter, validation
│   │   │   └── routes/      # API route handlers
│   │   └── .env.example
│   └── web/                 # React + Vite + TypeScript frontend
│       ├── public/          # Static assets (favicon, robots.txt, etc.)
│       ├── src/
│       │   ├── hooks/       # Custom hooks (useDocumentTitle, etc.)
│       │   ├── layouts/     # AppLayout with top nav
│       │   └── pages/       # Route page components
│       └── .env.example
├── packages/
│   └── shared/              # Shared TypeScript types & DTOs
│       └── src/             # Enums, API types, entity shapes
├── docs/                    # Project documentation (source of truth)
└── package.json             # Root workspace config
```

## Documentation

These four documents are the source of truth for all development:

| Document | Purpose |
|---|---|
| [`Dayflow_SRS.md`](docs/Dayflow_SRS.md) | Software Requirements Specification — functional requirements, permission matrix, state machines |
| [`Dayflow_schema.sql`](docs/Dayflow_schema.sql) | Canonical database schema — all developers use this as-is |
| [`Dayflow_Security_and_Quality_Checklist.md`](docs/Dayflow_Security_and_Quality_Checklist.md) | 20 backend security + 19 frontend hygiene requirements — PR gate |
| [`Dayflow_Team_Plan_and_Phases.md`](docs/Dayflow_Team_Plan_and_Phases.md) | Team roles, phase timeline, git workflow |
| [`design.md`](docs/design.md) | Visual design system — colors, typography, spacing, components |

## Branch Workflow

| Branch | Owner | Scope |
|---|---|---|
| `feat/auth-foundation` | Dev 1 | Login, bootstrap, JWT, RBAC, password generation |
| `feat/employee-profile` | Dev 2 | Employee CRUD, directory, profile tabs |
| `feat/attendance-leave` | Dev 3 | Check-in/out, attendance views, leave workflow |
| `feat/salary-shell` | Dev 4 | Salary structure, calculation engine, payable days |

Commit style: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, React Hook Form + Zod |
| Backend | Node.js, Express, TypeScript, Prisma ORM, Zod, bcrypt, JWT (httpOnly cookies) |
| Database | PostgreSQL with pgcrypto extension |
| Package Manager | npm (workspaces) |
