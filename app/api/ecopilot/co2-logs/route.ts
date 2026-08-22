import { createRouteHandlerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getRecentCo2Logs, insertCo2Log, aggregateDailyTotals, toCo2LogEntries, getActivityStreakDays, awardCredits } from "@/lib/ecopilot/queries";
import { calculateEcoCreditsForImpact } from "@/lib/ecopilot/calculations";
import { co2LogInsertSchema } from "@/lib/validation";

/** The logged-in user's recent CO2 ledger — raw entries + daily net totals. */
export async function GET(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const days = Number(new URL(request.url).searchParams.get("days")) || 30;
    const logs = await getRecentCo2Logs(user.id, supabase, days);

    return Response.json({
      entries: toCo2LogEntries(logs),
      dailyTotals: aggregateDailyTotals(logs),
    });
  } catch (err) {
    console.error("GET /api/ecopilot/co2-logs:", err);
    return Response.json({ error: "Failed to fetch CO2 logs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validated = co2LogInsertSchema.parse(body);

    const log = await insertCo2Log(
      user.id,
      {
        occurred_on: validated.occurredOn,
        category: validated.category,
        description: validated.description,
        co2_kg: validated.co2Kg,
        source: validated.source ?? "manual",
      },
      supabase
    );

    // Only savings (negative co2_kg) earn EcoCredits. Self-reported entries
    // get MEDIUM confidence (not independently verified) in the credit formula.
    if (validated.co2Kg < 0) {
      const streakDays = await getActivityStreakDays(user.id, supabase);
      const credits = calculateEcoCreditsForImpact({
        actionId: log.id,
        actionTitle: validated.description,
        avoidedCo2Kg: -validated.co2Kg,
        confidence: "MEDIUM",
        streakDays,
      });
      const serviceRole = createServiceRoleClient();
      await awardCredits(user.id, credits.finalCreditsAwarded, `Logged: ${validated.description}`, log.id, serviceRole);
    }

    return Response.json(log);
  } catch (err) {
    console.error("POST /api/ecopilot/co2-logs:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to log CO2 activity" },
      { status: 400 }
    );
  }
}
