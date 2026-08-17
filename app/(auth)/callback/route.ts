import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants";

/** OAuth / magic-link callback: exchanges the auth code for a session. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? ROUTES.home;

  if (code) {
    const supabase = await createRouteHandlerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("Auth callback error:", error.message);
  }

  return NextResponse.redirect(`${origin}${ROUTES.login}?error=auth_callback_error`);
}
