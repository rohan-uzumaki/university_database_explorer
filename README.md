# Malaysia University & Program Explorer — editable, database-backed version

A public search site (universities + program fees) with an admin panel for
editing the data, gated so only people you approve can make changes.

Stack: **Next.js** (frontend) + **Supabase** (Postgres database, auth, and
hosting for the API) + **Vercel** (hosts the frontend, free tier).

You have a GitHub account already — that's all you need to get started, the
other two accounts below are also free and can be created with GitHub login.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → sign in with GitHub → **New project**.
2. Pick any name/region, set a database password (save it somewhere), wait ~2 min for it to spin up.
3. Open **SQL Editor** → **New query** → paste the entire contents of `supabase/schema.sql` → **Run**.
   - Before running, edit the line near the top:
     ```sql
     insert into admins (email) values ('you@example.com')
     ```
     Replace `you@example.com` with your real email — this makes you the first admin.
4. Go to **Project Settings → API**. You'll need three values from this page shortly:
   - `Project URL`
   - `anon public` key
   - `service_role` key (keep this one secret — never put it in the frontend)

## 2. Load the existing data

This repo already includes `scripts/seed_universities.json` and
`scripts/seed_programs.json` — everything that was extracted from your Word
docs and spreadsheet. You run the seed script once, from your own computer:

```bash
npm install
SUPABASE_URL="https://YOUR-PROJECT.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
node scripts/seed.mjs
```

This pushes 76 universities and 3,570 programs into your new database. You
can re-run it safely — universities upsert by slug; if you re-run after
already seeding programs once, delete existing program rows first (Table
Editor → programs → select all → delete) to avoid duplicates.

## 3. Configure environment variables locally

```bash
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
Project Settings → API (the anon key, not the service role key — this one
*is* safe to expose to the browser, since Row Level Security controls what
it's actually allowed to do).

Try it locally:

```bash
npm run dev
```

Visit `http://localhost:3000`.

## 4. Push to GitHub

```bash
git init
git add .
git commit -m "Malaysia university explorer"
gh repo create malaysia-university-explorer --private --source=. --push
```

(Or create the repo on github.com and `git remote add origin ...` + `git push` the usual way.)

## 5. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → sign in with GitHub → **Add New Project** → import the repo you just pushed.
2. In the import screen, add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (same values as your `.env.local` — do **not** add the service role key here)
3. Deploy. You'll get a URL like `malaysia-university-explorer.vercel.app`.

## 6. Fix the auth redirect

Supabase needs to know your live URL is allowed to receive login links:

1. Supabase → **Authentication → URL Configuration**.
2. Set **Site URL** to your Vercel URL (e.g. `https://malaysia-university-explorer.vercel.app`).
3. Add the same URL (plus `http://localhost:3000` for local dev) under **Redirect URLs**.

## 7. Add trusted admins

Go to Supabase → **Table Editor → admins → Insert row**, add each trusted
person's email. That's the entire process — no code, no redeploy. They then
go to `yoursite.com/admin/login`, enter that email, and click the sign-in
link sent to their inbox.

To remove someone's access later, just delete their row from `admins`.

---

## How access control works

- Anyone can view the public site (`/` and `/university/[slug]`) — no login needed.
- `/admin` requires signing in via a magic link (passwordless — Supabase emails a one-time link).
- Being signed in isn't enough to edit: the database only allows writes from
  emails present in the `admins` table (enforced by Postgres Row Level
  Security, not just app logic — so it holds even if someone bypasses the UI).
- Add/remove admins directly in the Supabase table editor at any time.

## Project structure

```
app/
  page.js                    Public search (programs + universities)
  university/[slug]/page.js  Public university profile
  admin/login/page.js        Magic-link sign-in
  admin/page.js              Gated dashboard — add/edit/delete universities & programs
lib/
  supabaseClient.js          Browser Supabase client (anon key)
  useAuth.js                 Session + admin-allowlist check
supabase/
  schema.sql                 Tables, indexes, RLS policies — run once in Supabase SQL editor
scripts/
  seed.mjs                   One-time loader for the existing data
  seed_universities.json     76 university profiles
  seed_programs.json         3,570 programs with fees
```

## Making further edits

- Editing data → use the `/admin` panel, or the Supabase Table Editor directly (also respects RLS, but the service role / dashboard login bypasses it for you as project owner).
- Editing the site's look or adding features → edit files under `app/`, commit, push — Vercel redeploys automatically on every push to your main branch.
