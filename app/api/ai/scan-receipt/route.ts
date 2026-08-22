import { createRouteHandlerClient } from "@/lib/supabase/server";
import { classifyGroceryReceipt } from "@/lib/ecopilot/gemini";

/** Ecopilot: grocery receipt CO2 estimator, backed by Gemini vision. */
export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { imageBase64 } = await request.json();

    if (typeof imageBase64 !== "string" || !imageBase64.trim()) {
      return Response.json({ success: false, error: "imageBase64 is required" }, { status: 400 });
    }

    const data = await classifyGroceryReceipt(imageBase64);

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("POST /api/ai/scan-receipt:", err);
    return Response.json({ success: false, error: "Failed to scan receipt" }, { status: 500 });
  }
}
