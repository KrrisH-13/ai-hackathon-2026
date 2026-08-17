import { createServerComponentClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/db/types";

/** Get the current authenticated user (Server Components / Route Handlers). */
export async function getUser() {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) return null;
  return user;
}

/** Get the current user's profile row, or null if not signed in / not found. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("getProfile:", error.message);
    return null;
  }

  return data;
}
