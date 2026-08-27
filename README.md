# University & Program Explorer

A searchable database of universities — program fees, admission requirements,
scholarships, and QS rankings — with role-based access control and an
admin panel for managing data and users.

**Live at:** universitydatabaseexplorer.vercel.app

> **This data is private and not intended for public access.** The entire
> site sits behind a login — there is no public browsing. Access is granted
> only by an admin creating an account for a specific person; nobody can
> sign themselves up.

## Stack

- **Next.js** — frontend
- **Supabase** — Postgres database, authentication, row-level security
- **Vercel** — hosting, auto-deploys on push to `main`

## Access control

Three roles, all requiring an admin-created account:

| Role | Can do |
|---|---|
| `viewer` | Browse universities and programs |
| `editor` | Also add/edit/delete universities and programs |
| `admin` | Editor + create/manage user accounts, view activity logs |

Admins create accounts for people directly from `/admin` → **Users** — no
public sign-up, no self-registration, no email required. Every login and
every data change is automatically logged and viewable under `/admin` →
**Activity Log** (admin only), so access is traceable at all times.

**Repo visibility matters here too:** if this repo is ever made public,
`scripts/seed_universities.json` and `scripts/seed_programs.json` contain a
full copy of the original dataset in plain text — keep the repo private.

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
