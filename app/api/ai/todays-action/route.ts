import { createRouteHandlerClient } from "@/lib/supabase/server";
import { generateTodaysBestAction } from "@/lib/ecopilot/gemini";
import { getRecentCo2Logs, aggregateDailyTotals } from "@/lib/ecopilot/queries";

/** Ecopilot: one grounded "best action for today" suggestion, backed by Gemini + the user's real recent CO2 log history. */
export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { userProfile, currentSeason, outdoorTempCelsius } = await request.json();

    if (!userProfile || typeof outdoorTempCelsius !== "number") {
      return Response.json({ success: false, error: "userProfile and outdoorTempCelsius are required" }, { status: 400 });
    }

    const recentLogs = await getRecentCo2Logs(user.id, supabase, 7);
    const dailyTotals = aggregateDailyTotals(recentLogs);
    const recentLogsSummary =
      dailyTotals.length === 0
        ? ""
        : `Last 7 days: ${recentLogs.length} logged entries, net ${dailyTotals.reduce((s, d) => s + d.netCo2Kg, 0).toFixed(1)} kg CO2 (negative = saved).`;

    const data = await generateTodaysBestAction(userProfile, currentSeason, outdoorTempCelsius, recentLogsSummary);

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("POST /api/ai/todays-action:", err);
    return Response.json({ success: false, error: "Failed to generate today's action" }, { status: 500 });
  }
}
