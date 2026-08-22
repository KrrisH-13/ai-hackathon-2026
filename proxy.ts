import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";
import { ROUTES } from "@/lib/constants";

export async function proxy(request: NextRequest) {
  const { response, user } = await createMiddlewareClient(request);

  if (!user) {
    if (request.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL(ROUTES.login, request.url));
  }

  return response;
}

// Route matching (rather than in-body checks) keeps auth enforcement
// declarative and easy to audit alongside page-level redirects.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/staff/:path*",
    "/admin/:path*",
    "/api/auth/user",
  ],
};
