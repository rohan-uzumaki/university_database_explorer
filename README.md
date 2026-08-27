# University & Program Explorer

A searchable database of universities — program fees, admission requirements,
scholarships, and QS rankings — with role-based access control and an
admin panel for managing data and users.

**Live at:** universitydatabaseexplorer.vercel.app

## Stack

- **Next.js** — frontend
- **Supabase** — Postgres database, authentication, row-level security
- **Vercel** — hosting, auto-deploys on push to `main`

## Access control

The whole site requires an account — there's no public browsing. Three roles:

| Role | Can do |
|---|---|
| `viewer` | Browse universities and programs |
| `editor` | Also add/edit/delete universities and programs |
| `admin` | Editor + create/manage user accounts, view activity logs |

Admins create accounts for people directly from `/admin` → **Users** — no
sign-up flow, no email required. Every login and every data change is
automatically logged and viewable under `/admin` → **Activity Log** (admin only).

## Project structure

app/
page.js Search — programs & universities (login required)
university/[slug]/page.js University profile page
login/page.js General sign-in (email + password)
admin/page.js Dashboard: universities, programs, users, activity log
api/admin/users/route.js Server-side endpoint that creates new accounts
lib/
supabaseClient.js Browser Supabase client
useAuth.js Session + role lookup
AuthGate.js Wraps pages that require login
ThemeToggle.js Light/dark mode toggle
supabase/
schema.sql Base schema
migration_2_access_control.sql Roles, view-gating, audit logs
scripts/
seed.mjs + seed_*.json One-time data loader


## Local setup

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase URL + keys
npm run dev
```

Deploys automatically on push to `main` via Vercel. Database changes go
through Supabase's SQL Editor, not migrations run at build time.
