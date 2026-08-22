import { createRouteHandlerClient } from "@/lib/supabase/server";
import { chatWithClimateAssistant } from "@/lib/ecopilot/gemini";

/** Ecopilot: AI Climate Copilot chat (eCopilot), backed by Gemini. */
export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { chatHistory, userMessage, userProfile, currentSeason } = await request.json();

    if (typeof userMessage !== "string" || !userMessage.trim()) {
      return Response.json({ success: false, error: "userMessage is required" }, { status: 400 });
    }

    const data = await chatWithClimateAssistant(chatHistory ?? [], userMessage, userProfile, currentSeason);

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("POST /api/ai/chat:", err);
    return Response.json({ success: false, error: "Failed to generate a reply" }, { status: 500 });
  }
}
