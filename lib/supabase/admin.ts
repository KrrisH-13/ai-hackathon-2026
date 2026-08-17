import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

/**
 * Admin client using the service role key. Bypasses Row-Level Security.
 * Server-only: never import this from a Client Component. Use for
 * privileged operations only (e.g. cron jobs, admin tooling).
 */
export function createServiceRoleClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
