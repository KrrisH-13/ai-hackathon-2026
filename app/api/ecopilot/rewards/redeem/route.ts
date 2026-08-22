import { createRouteHandlerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { redeemReward } from "@/lib/ecopilot/queries";
import { PROTOTYPE_REWARDS } from "@/lib/ecopilot/rewards";

/** Redeem a catalog reward for EcoCredits — atomic balance-check via the redeem_ecopilot_reward() Postgres function. */
export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { rewardId } = await request.json();
    const reward = PROTOTYPE_REWARDS.find((r) => r.id === rewardId);
    if (!reward) return Response.json({ error: "Unknown reward" }, { status: 400 });

    const serviceRole = createServiceRoleClient();
    const redemption = await redeemReward(user.id, reward.id, reward.creditsCost, serviceRole);

    return Response.json(redemption);
  } catch (err) {
    console.error("POST /api/ecopilot/rewards/redeem:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to redeem reward" },
      { status: 400 }
    );
  }
}
