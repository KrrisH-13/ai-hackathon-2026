import { createRouteHandlerClient } from "@/lib/supabase/server";
import { extractActivityFromText } from "@/lib/ecopilot/gemini";
import { estimateCo2Kg } from "@/lib/ecopilot/emissionFactors";
import { activityExtractRequestSchema } from "@/lib/validation";
import type { ActivityLogEstimate } from "@/lib/ecopilot/types";

/** Ecopilot: natural-language activity logger — Gemini function calling extracts a trip, then a country-aware factor table prices its CO2. */
export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { text } = activityExtractRequestSchema.parse(body);

    const extraction = await extractActivityFromText(text);
    const { co2Kg, gramsPerKm, matchedCountry, isFallback } = estimateCo2Kg(extraction.mode, extraction.distanceKm, extraction.country);

    const factorNote = isFallback
      ? `No specific factor for "${matchedCountry}" — used a grid-average estimate (${gramsPerKm} g CO2/km).`
      : `Using ${matchedCountry}'s grid-aware factor for ${extraction.mode}: ${gramsPerKm} g CO2/km.`;

    const data: ActivityLogEstimate = { extraction, co2Kg, emissionFactorGramsPerKm: gramsPerKm, factorNote };

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("POST /api/ai/extract-activity:", err);
    return Response.json({ success: false, error: "Failed to parse that activity" }, { status: 400 });
  }
}
