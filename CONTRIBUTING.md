# Contributing

Read [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) before contributing —
it's the source of truth for file structure, Supabase client usage, form
patterns, RLS policies, error handling, and naming conventions for both
human and AI-agent contributors.

## Quick checklist before opening a PR

- [ ] Followed the directory structure in `CODING_GUIDELINES.md`
- [ ] Used the right Supabase client for the context (see the client table there)
- [ ] Forms use React Hook Form + Zod
- [ ] Database access goes through RLS, not client-side role checks alone
- [ ] `npm run build` passes
- [ ] New tables/columns: added a migration in `supabase/migrations/` and
      updated `lib/db/types.ts`

## Git workflow

- Branches: `feature/issue-name`, `fix/bug-name`
- Commits: descriptive, lowercase, present tense (`add login form`, not `WIP`)
