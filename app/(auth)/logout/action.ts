"use server";

import { redirect } from "next/navigation";
import { createServerActionClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants";

export async function signOut() {
  const supabase = await createServerActionClient();
  await supabase.auth.signOut();
  redirect(ROUTES.login);
}
