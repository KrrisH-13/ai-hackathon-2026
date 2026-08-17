# Scaffolding Prompt for Claude / AI Agents

**Copy and paste this into Claude (or another agent) to scaffold the entire hackathon project.**

---

## Full Scaffolding Prompt

```
You are scaffolding a Next.js + Supabase PWA for an Espoo city hackathon (1-day build).

Follow the CODING_GUIDELINES.md in this repo meticulously. This is your source of truth for file structure, patterns, and conventions.

## Task: Create a complete, empty-but-runnable scaffold

The project should compile and deploy immediately, with:
- Authentication flow (signup/login/logout) using Supabase Auth
- Role-based access control (citizen, staff, admin) enforced via Postgres RLS
- PWA configuration (Serwist service worker + manifest)
- Responsive UI using shadcn/ui + Tailwind
- All the boilerplate so human developers can immediately start adding features

## Deliverables

### 1. Package Dependencies
Create `package.json` with:
- next@latest, react@latest, typescript
- @supabase/ssr, @supabase/supabase-js
- @serwist/next, @serwist/precaching, @serwist/sw
- shadcn/ui (install via `npx shadcn-ui@latest add` later, but include in deps)
- react-hook-form, zod, @hookform/resolvers
- tailwindcss, postcss, autoprefixer
- class-variance-authority, clsx, tailwind-merge

### 2. Configuration Files
Create:
- `next.config.ts` – Next.js + Serwist PWA config
- `tsconfig.json` – Path aliases (@/components, @/lib, etc)
- `tailwind.config.ts` – Tailwind config
- `postcss.config.js` – PostCSS config
- `.env.local.example` – Template with placeholders for Supabase keys
- `.gitignore` – Standard Node.js + Next.js ignores
- `.editorconfig` – Consistent formatting
- `.prettierrc` – Prettier config (2-space indent)

### 3. Directory Structure
Create empty directories:
```
app/
  (auth)/
  (dashboard)/
  api/
components/
  ui/
  forms/
  dashboard/
  layout/
lib/
  supabase/
  db/
  hooks/
public/
  icons/
supabase/
  migrations/
```

### 4. Core Supabase Client Setup
Create:
- `lib/supabase/client.ts` – Browser client (createBrowserClient)
- `lib/supabase/server.ts` – Server component client (createServerComponentClient)
- `lib/supabase/admin.ts` – Admin client (createServiceRoleClient, server-only)
- `lib/supabase/auth.ts` – Auth helper functions (getUser, signOut, etc)

### 5. Database Layer
Create:
- `lib/db/types.ts` – TypeScript types for: profiles, submissions, etc (see below for schema)
- `lib/db/queries.ts` – Reusable query functions with error handling
- `supabase/migrations/v001_initial_schema.sql` – Initial schema + RLS policies

**v001 Schema includes:**
```sql
-- profiles (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'staff', 'admin')),
  district_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- submissions (user-generated data)
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS policies (see CODING_GUIDELINES for examples)
-- Citizens see only their own submissions
-- Staff see submissions in their district
-- Admin sees all
```

### 6. Auth Routes (Placeholder)
Create:
- `app/(auth)/layout.tsx` – Auth layout (no sidebar)
- `app/(auth)/login/page.tsx` – Login form (server component + LoginForm client component)
- `app/(auth)/signup/page.tsx` – Signup form (server component + SignupForm client component)
- `app/(auth)/callback/route.ts` – OAuth callback handler
- `app/(auth)/logout/action.ts` – Server action for logout

### 7. Dashboard Routes (Placeholder)
Create:
- `app/(dashboard)/layout.tsx` – Dashboard layout with header, sidebar, role checks
- `app/(dashboard)/[role]/page.tsx` – Role-specific dashboard (citizen vs staff)
- `app/(dashboard)/submissions/page.tsx` – View all submissions (role-gated)

### 8. API Routes (Placeholder)
Create:
- `app/api/submissions/route.ts` – GET (list) & POST (create) submissions
- `app/api/submissions/[id]/route.ts` – GET (detail), PUT (update), DELETE (delete)
- `app/api/auth/user/route.ts` – GET current user profile

### 9. Components
Create:
- `components/ui/button.tsx` – shadcn/ui Button (can paste from shadcn site)
- `components/ui/input.tsx` – shadcn/ui Input
- `components/ui/textarea.tsx` – shadcn/ui Textarea
- `components/forms/LoginForm.tsx` – Login form (React Hook Form + Zod)
- `components/forms/SignupForm.tsx` – Signup form
- `components/forms/SubmissionForm.tsx` – Submission form (for dashboard)
- `components/layout/Header.tsx` – Top navigation
- `components/layout/Sidebar.tsx` – Sidebar nav (role-aware)
- `components/dashboard/CitizenDashboard.tsx` – Citizen view
- `components/dashboard/StaffDashboard.tsx` – Staff view

### 10. Root Layout & Providers
Create:
- `app/layout.tsx` – Root layout with Supabase provider, Tailwind, metadata
- `app/manifest.ts` – PWA manifest (Next.js 13+)
- `lib/providers.tsx` – Client providers (Supabase context, etc)

### 11. Middleware & Auth Guards
Create:
- `middleware.ts` – Check auth before dashboard routes, role checks
- `lib/hooks.ts` – useAuth(), useOnlineStatus(), etc

### 12. Utilities
Create:
- `lib/utils.ts` – cn() for classnames, formatDate(), other helpers
- `lib/constants.ts` – ROLES, STATUSES, API endpoints

### 13. Public Assets
Create:
- `public/manifest.json` – PWA manifest (separate from Next.js manifest.ts)
- `public/icons/` – Placeholder 192x192.png and 512x512.png
- `public/offline.html` – Offline fallback (optional, Serwist can serve offline page)

### 14. Documentation
Create:
- `README.md` – Setup, env var instructions, deployment to Vercel
- `CONTRIBUTING.md` – Point to CODING_GUIDELINES.md
- `.env.local.example` – Supabase URL, keys, etc

## Code Style Requirements (All code must follow these)

1. **TypeScript:** All `.ts` / `.tsx` files use strict TypeScript.
2. **Imports:** Use path aliases (`@/components`, `@/lib`).
3. **Supabase Clients:** Use correct client per context (server vs browser).
4. **Forms:** React Hook Form + Zod validation.
5. **UI:** shadcn/ui components + Tailwind (no inline styles).
6. **Error Handling:** Try/catch + console.error, user-facing messages.
7. **Comments:** JSDoc for exported functions; inline comments for complex logic.
8. **Naming:** PascalCase for components, camelCase for functions/hooks, snake_case for env vars.
9. **File Structure:** Follow the directory structure in CODING_GUIDELINES.md exactly.

## Important Notes

- **Do NOT create example data or demo files.** The scaffold should be empty but functional.
- **Do NOT add extra dependencies** beyond what's listed.
- **Do NOT hardcode secrets.** Use environment variables.
- **Serwist config:** Should auto-generate service worker on build. Provide next.config.ts snippet.
- **Testing:** Scaffold should compile (`npm run build`) without errors.

## Deliverable Format

Output as a list of file paths + contents. For large files (like migrations), use clear sections. Make it easy to copy-paste into the repo.

Example format:
```
### File: package.json
\`\`\`json
{ ... }
\`\`\`

### File: lib/supabase/client.ts
\`\`\`typescript
import { ... }
export function createClient() { ... }
\`\`\`
```

Start now. Create the complete scaffold.
```

---

## How to Use This Prompt

1. Copy the text above (everything between the triple backticks).
2. Paste into Claude or your preferred AI agent.
3. Wait for the agent to generate all files.
4. Copy-paste each file into your repo.
5. Run:
   ```bash
   npm install
   npm run dev
   ```
6. App should boot at `localhost:3000` (login page).
7. Set up Supabase project, add `.env.local` with your keys, test auth flow.

---

## What This Prompt Guarantees

✅ Compiles without errors
✅ Follows CODING_GUIDELINES.md exactly
✅ Auth flow (signup → dashboard → logout) works
✅ RLS policies in place
✅ Serwist PWA configured
✅ Responsive UI (mobile-first)
✅ Ready for human developers to add features

❌ No test data or example submissions
❌ No AI integrations or advanced features
❌ No external API integrations (comes later)

---

## After Scaffolding

1. **Set up Supabase project:**
   - Create project at supabase.com
   - Run the migration (v001_initial_schema.sql) in SQL editor
   - Note the project URL and keys

2. **Create `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx
   SUPABASE_SERVICE_ROLE_KEY=eyJxxxx
   ```

3. **Deploy to Vercel:**
   - Push to GitHub
   - Connect repo to Vercel
   - Set env vars in Vercel dashboard
   - Deploy

4. **Test the PWA:**
   - Open app in Chrome (mobile view)
   - Look for "Install app" prompt
   - Click install, verify offline page loads

5. **Start adding features:**
   - Human developers can now create new forms, API routes, dashboard panels
   - Reference CODING_GUIDELINES.md for patterns
   - AI agents can be given feature requests; they'll follow the guidelines

---

## Questions for the Agent?

Add anything unclear to the prompt before sending. Example:
- "What should the default redirect be after signup?"
- "Should we include a 'Terms of Service' page?"
- "Should submissions include file uploads?"

These will guide the scaffold.
