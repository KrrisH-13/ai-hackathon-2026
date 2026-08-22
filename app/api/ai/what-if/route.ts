import { createRouteHandlerClient } from "@/lib/supabase/server";
import { getRecentCo2Logs, toCo2LogEntries } from "@/lib/ecopilot/queries";
import { projectWhatIfScenario } from "@/lib/ecopilot/gemini";

/** Ecopilot: "what if" scenario projections, grounded in the resident's own logged CO2 ledger. */
export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { question, userProfile, currentSeason } = await request.json();

    if (typeof question !== "string" || !question.trim()) {
      return Response.json({ success: false, error: "question is required" }, { status: 400 });
    }
    if (!userProfile) {
      return Response.json({ success: false, error: "userProfile is required" }, { status: 400 });
    }

    // 90 days gives the model enough of a pattern to reason over without an unbounded prompt.
    const logs = await getRecentCo2Logs(user.id, supabase, 90);
    const data = await projectWhatIfScenario(question, userProfile, toCo2LogEntries(logs), currentSeason);

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("POST /api/ai/what-if:", err);
    return Response.json({ success: false, error: "Failed to generate a projection" }, { status: 500 });
  }
}
