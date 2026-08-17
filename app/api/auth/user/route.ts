import { createRouteHandlerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) return Response.json({ error: "Profile not found" }, { status: 404 });

    return Response.json({ user: { id: user.id, email: user.email }, profile });
  } catch (err) {
    console.error("GET /api/auth/user:", err);
    return Response.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
