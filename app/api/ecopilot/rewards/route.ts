import { createRouteHandlerClient } from "@/lib/supabase/server";
import { getCreditsBalance, getRecentCreditTransactions, getRedemptions } from "@/lib/ecopilot/queries";

/** The logged-in user's EcoCredits balance, recent transactions, and reward redemptions. */
export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const [balance, transactions, redemptions] = await Promise.all([
      getCreditsBalance(user.id, supabase),
      getRecentCreditTransactions(user.id, supabase),
      getRedemptions(user.id, supabase),
    ]);

    return Response.json({ balance, transactions, redemptions });
  } catch (err) {
    console.error("GET /api/ecopilot/rewards:", err);
    return Response.json({ error: "Failed to fetch rewards" }, { status: 500 });
  }
}
