import { createRouteHandlerClient } from "@/lib/supabase/server";
import { getRecentCo2Logs, insertCo2Log, aggregateDailyTotals, toCo2LogEntries } from "@/lib/ecopilot/queries";
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

    return Response.json(log);
  } catch (err) {
    console.error("POST /api/ecopilot/co2-logs:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to log CO2 activity" },
      { status: 400 }
    );
  }
}
