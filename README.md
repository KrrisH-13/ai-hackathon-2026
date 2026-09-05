# eCopilot

An AI climate copilot for Espoo residents, built on a Next.js + Supabase PWA
scaffold. Helps residents act on the Carbon-Neutral Espoo 2030 roadmap —
Nord Pool-aware energy/sauna scheduling, HSY waste sorting, HSL commute
comparisons, the Espoo 2030 measure tracker, and a personalized weekly
action plan. See `lib/ecopilot/` and `components/ecopilot/` for the
feature; `CODING_GUIDELINES.md` still describes the underlying scaffold
conventions (auth, RLS, forms, error handling).

## Demo

Live: [ai-hackathon-espoo.vercel.app](https://ai-hackathon-espoo.vercel.app/)

## Stack

- **Next.js** (App Router) + TypeScript
- **Supabase** — Auth + Postgres with Row-Level Security
- **Serwist** — PWA service worker
- **shadcn/ui** + Tailwind CSS
- **React Hook Form** + **Zod**

## Prerequisites

Install these before doing anything else. If you already have them, skip ahead.

1. **Node.js 20.9 or later** (required by Next.js 16).
   - Download the LTS installer from [nodejs.org](https://nodejs.org/) and run it (Windows/Mac/Linux).
   - Verify: `node -v` should print `v20.x` or higher.
   - If you manage multiple Node versions, [nvm](https://github.com/nvm-sh/nvm) (Mac/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows) works too.
2. **Git** — [git-scm.com](https://git-scm.com/downloads). Verify: `git --version`.
3. **Docker Desktop** — only required for [Option A](#option-a--local-supabase-stack-no-cloud-account-needed) below (local Supabase). Skip it if you're doing Option B or C.
   - Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) and install.
   - **Windows:** the installer will prompt to enable WSL2 — accept it. After installing, launch the **Docker Desktop app** and wait for the whale icon in the system tray to say "Docker Desktop is running" before running any `db:*` script. Docker Desktop does not start automatically after a reboot unless you enable "Start Docker Desktop when you log in" in its settings.
   - Verify it's actually running (not just installed): `docker info` should print server details with no connection errors.
4. A code editor — [VS Code](https://code.visualstudio.com/) is a safe default if you don't have a preference.

Once all of the above are installed, clone the repo and continue below.

## Getting started

Install dependencies first:

```bash
npm install
```

Then pick one of the paths below.

### Option A — Local Supabase stack (no cloud account needed)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) running.
The Supabase CLI is already a project dependency (`npm install` pulled it in).

```bash
npm run db:start   # starts local Postgres + Auth + PostgREST + Studio in Docker,
                    # and applies supabase/migrations/*.sql automatically
npm run db:env      # writes the local instance's URL/keys into .env.local
npm run dev
```

Local Studio (a DB/Auth admin UI) is at the URL printed by `npm run db:start`
(default `http://127.0.0.1:54323`). Email confirmations are disabled locally by
default, so signup logs you in immediately — see `supabase/config.toml` to
change that or any other local setting.

To wipe and re-apply migrations from scratch: `npm run db:reset`.
To stop the containers: `npm run db:stop`.

One-liner that does the above in sequence: `npm run dev:local`.

### Option B — Hosted Supabase project

1. Create a [Supabase](https://supabase.com) project, then run
   `supabase/migrations/v001_initial_schema.sql` in the SQL editor.
2. Copy the env template and fill in your Supabase project's keys:

   ```bash
   cp .env.local.example .env.local
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

### Option C — Deployed Supabase project (no Docker, no new project)

Points local dev straight at the already-deployed hosted Supabase project
(the one backing the [live demo](https://ai-hackathon-espoo.vercel.app/)),
instead of a local Docker stack or a fresh project of your own. No Docker
Desktop needed.

1. Create a `.env.prod` file in the repo root with that project's values —
   ask a teammate for them, or copy them from the Vercel project's
   environment variables (Vercel dashboard → Project Settings →
   Environment Variables). Same shape as `.env.local.example`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx
   SUPABASE_SERVICE_ROLE_KEY=eyJxxxx
   CRON_SECRET=
   GEMINI_API_KEY=
   ```

   `.env.prod` is gitignored (matches `.env.*`) — never commit it.

2. Start the dev server against it:

   ```bash
   npm run dev:prod
   ```

   This loads `.env.prod` instead of `.env.local` (via `env-cmd`, already a
   project dependency) and runs `next dev` as usual.

**A few things to know before using this:**

- **You're reading and writing the real production database.** There's no
  isolation from Option A/B — any profile edits, CO2 log entries, etc. you
  create while testing are real rows in the live project. Don't run
  destructive testing against it.
- **Google login needs one manual Supabase Dashboard change first**, or it
  will redirect you to the production domain instead of back to
  `localhost` after a successful sign-in. Supabase Auth only redirects to
  URLs on that project's allow-list. In the Supabase Dashboard for that
  project, go to **Authentication → URL Configuration → Redirect URLs**
  and add:

  ```
  http://localhost:3000/**
  ```

  Leave the project's Site URL as the production domain — you're only
  widening the allow-list, not changing the default. This is a one-time
  setup step per Supabase project, not per developer machine.
- **`supabase/migrations/` may be ahead of what's actually applied to this
  project.** The env vars above only give the app (and you) API access —
  they say nothing about migration state. Running `next dev` against
  `.env.prod` does not apply migrations; if someone added a migration file
  without also running it against the hosted project, your local app can
  hit columns/tables that don't exist there yet. Check with
  `npx supabase migration list` (compares local files against the linked
  project) before assuming your checkout matches the database.
  - That command — and `npx supabase migration up` / `db push` — needs the
    CLI linked to *this specific* Supabase project, which needs your own
    account to have access to it. Since it was created under one
    developer's login, everyone else will need to be invited as a
    collaborator (Supabase Dashboard → project → **Project Settings →
    Team**) and then run `npx supabase login` followed by
    `npx supabase link --project-ref <project-ref>` once, locally, before
    they can list or push migrations against it. Until then, `.env.prod`
    still works fine for running the app — it's only the CLI's migration
    commands that need this extra setup.

Whichever option you pick, open [http://localhost:3000](http://localhost:3000) once running.

## What's here

- Auth flow: signup → email confirmation (if enabled) → login → dashboard → logout
- Role-based dashboards at `/dashboard`, `/staff`, `/admin`, enforced by Postgres RLS
  (see `supabase/migrations/v001_initial_schema.sql`)
- A `submissions` table + form/API/dashboard wiring as a starting example — replace
  with your hackathon's actual domain model
- PWA install support (manifest + Serwist service worker, offline fallback page)

## Project structure & conventions

See [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) for file structure, patterns
(Supabase client usage, forms, RLS, error handling) and the AI-agent contribution
checklist. Keep following it as you add features.

> Note: Next.js 16 renamed the `middleware.ts` convention to `proxy.ts` (same
> idea — the exported function is now named `proxy` instead of `middleware`).
> This scaffold uses `proxy.ts`; CODING_GUIDELINES.md still refers to the
> older `middleware.ts` name in its examples.

## Deploying

1. Push to GitHub, connect the repo to [Vercel](https://vercel.com).
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` in the Vercel project's environment variables.
3. Deploy. `next build` should complete without errors.
