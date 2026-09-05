import { createRouteHandlerClient } from "@/lib/supabase/server";
import { extractActivityFromText } from "@/lib/ecopilot/gemini";
import { estimateCo2Kg } from "@/lib/ecopilot/emissionFactors";
import { activityExtractRequestSchema } from "@/lib/validation";
import type { ActivityLogEstimate } from "@/lib/ecopilot/types";

/**
 * Ecopilot: natural-language activity logger. Gemini function calling decides
 * whether the entry is a trip or a general activity: trips are priced by the
 * country-aware factor table here; general activities carry Gemini's own
 * lifecycle estimate straight through.
 */
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

    let data: ActivityLogEstimate;
    if (extraction.kind === "trip") {
      const { co2Kg, gramsPerKm, matchedCountry, isFallback } = estimateCo2Kg(
        extraction.mode,
        extraction.distanceKm,
        extraction.country
      );
      const factorNote = isFallback
        ? `No specific factor for "${matchedCountry}" — used a grid-average estimate (${gramsPerKm} g CO2/km).`
        : `Using ${matchedCountry}'s grid-aware factor for ${extraction.mode}: ${gramsPerKm} g CO2/km.`;
      data = { extraction, co2Kg, emissionFactorGramsPerKm: gramsPerKm, factorNote };
    } else {
      data = {
        extraction,
        co2Kg: extraction.co2Kg,
        emissionFactorGramsPerKm: null,
        factorNote: extraction.note,
      };
    }

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("POST /api/ai/extract-activity:", err);
    return Response.json({ success: false, error: "Failed to parse that activity" }, { status: 400 });
  }
}
