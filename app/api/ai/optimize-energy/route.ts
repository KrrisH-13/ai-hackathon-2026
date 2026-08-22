import { createRouteHandlerClient } from "@/lib/supabase/server";
import { optimizeDailyEnergy } from "@/lib/ecopilot/gemini";

/** Ecopilot: Nord Pool spot-price aware daily energy/sauna plan, backed by Gemini. */
export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { userProfile, currentSeason, outdoorTemp, spotPrices } = await request.json();

    if (!userProfile || typeof outdoorTemp !== "number" || !Array.isArray(spotPrices)) {
      return Response.json(
        { success: false, error: "userProfile, outdoorTemp, and spotPrices are required" },
        { status: 400 }
      );
    }

    const data = await optimizeDailyEnergy(userProfile, currentSeason, outdoorTemp, spotPrices);

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("POST /api/ai/optimize-energy:", err);
    return Response.json({ success: false, error: "Failed to generate energy plan" }, { status: 500 });
  }
}
