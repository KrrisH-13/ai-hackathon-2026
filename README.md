# Hackathon App

A Next.js + Supabase PWA scaffold, built for a one-day hackathon. Rename
the project (this README, `package.json` `name`, and `lib/constants.ts`
`APP_NAME`) once the actual hackathon topic is decided — everything else
is generic and topic-agnostic by design.

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
3. **Docker Desktop** — only required for [Option A](#option-a--local-supabase-stack-no-cloud-account-needed) below (local Supabase). Skip it if you're only doing Option B.
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

Then pick one of the two paths below.

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

Either way, open [http://localhost:3000](http://localhost:3000) once running.

## What's here

- Auth flow: signup → email confirmation (if enabled) → login → dashboard → logout
- Role-based dashboards at `/citizen`, `/staff`, `/admin`, enforced by Postgres RLS
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
