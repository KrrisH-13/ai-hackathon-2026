import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/db/types";

/**
 * Core server-side Supabase client factory. `next/headers`' `cookies()`
 * works the same way in Server Components, Route Handlers, and Server
 * Actions, so all three named exports below share this implementation.
 */
async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components can't set cookies; middleware refreshes
            // the session on every request, so this is safe to ignore.
          }
        },
      },
    }
  );
}

/** Supabase client for use in Server Components. */
export const createServerComponentClient = createClient;

/** Supabase client for use in Route Handlers (app/api/**\/route.ts). */
export const createRouteHandlerClient = createClient;

/** Supabase client for use in Server Actions. */
export const createServerActionClient = createClient;
