import { createRouteHandlerClient } from "@/lib/supabase/server";
import { getRecentCo2Logs, toCo2LogEntries } from "@/lib/ecopilot/queries";
import { suggestHeatingOptimizations } from "@/lib/ecopilot/gemini";

/** Ecopilot: personalized structural heating-optimization ideas, backed by Gemini. */
export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { userProfile } = await request.json();
    if (!userProfile) {
      return Response.json({ success: false, error: "userProfile is required" }, { status: 400 });
    }

    const logs = await getRecentCo2Logs(user.id, supabase, 90);
    const data = await suggestHeatingOptimizations(userProfile, toCo2LogEntries(logs));

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("POST /api/ai/suggest-heating:", err);
    return Response.json({ success: false, error: "Failed to generate heating suggestions" }, { status: 500 });
  }
}
