import { createRouteHandlerClient } from "@/lib/supabase/server";
import { generatePersonalizedRoadmapPlan } from "@/lib/ecopilot/gemini";

/** Ecopilot: personalized 7-day Espoo 2030 climate action plan, backed by Gemini. */
export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { userProfile, season } = await request.json();

    if (!userProfile) {
      return Response.json({ success: false, error: "userProfile is required" }, { status: 400 });
    }

    const data = await generatePersonalizedRoadmapPlan(userProfile, season);

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("POST /api/ai/generate-roadmap-plan:", err);
    return Response.json({ success: false, error: "Failed to generate roadmap plan" }, { status: 500 });
  }
}
