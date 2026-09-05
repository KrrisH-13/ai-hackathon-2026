<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Working with this project

- Full contribution conventions (architecture, patterns, migrations, git
  workflow) live in `CODING_GUIDELINES.md` — read it before making
  non-trivial changes, especially the
  [Applying Database Migrations](./CODING_GUIDELINES.md#applying-database-migrations)
  section.
- **Never apply a Supabase migration to the hosted/production project
  (`npx supabase db push`, or equivalent) without explicit user
  confirmation** — even one you just wrote yourself. Always run
  `npx supabase db push --dry-run` first, read every pending migration's
  SQL, and call out anything that drops a column/table or rewrites data as
  irreversible before asking whether to proceed.
- Local dev can point at either a local Docker Supabase stack (`npm run
  dev:local`) or the real hosted/production project (`npm run dev:prod`) —
  see `README.md`. When working against `dev:prod`, remember you're
  reading and writing real production data.
