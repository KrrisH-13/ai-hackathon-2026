import { createRouteHandlerClient } from "@/lib/supabase/server";
import { compareCommuteEmissions } from "@/lib/ecopilot/gemini";

/** Ecopilot: HSL vs bike vs car commute cost/CO2 comparator, backed by Gemini. */
export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { origin, destination } = await request.json();

    if (typeof origin !== "string" || !origin.trim() || typeof destination !== "string" || !destination.trim()) {
      return Response.json({ success: false, error: "origin and destination are required" }, { status: 400 });
    }

    const data = await compareCommuteEmissions(origin, destination);

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("POST /api/ai/compare-commute:", err);
    return Response.json({ success: false, error: "Failed to compare commute options" }, { status: 500 });
  }
}
