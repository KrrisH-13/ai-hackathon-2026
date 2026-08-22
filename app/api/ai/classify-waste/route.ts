import { createRouteHandlerClient } from "@/lib/supabase/server";
import { classifyWaste } from "@/lib/ecopilot/gemini";

/** Ecopilot: HSY waste & recycling classifier, backed by Gemini. */
export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { query, imageBase64 } = await request.json();

    if (typeof query !== "string" || !query.trim()) {
      return Response.json({ success: false, error: "query is required" }, { status: 400 });
    }

    const data = await classifyWaste(query, imageBase64);

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("POST /api/ai/classify-waste:", err);
    return Response.json({ success: false, error: "Failed to classify item" }, { status: 500 });
  }
}
