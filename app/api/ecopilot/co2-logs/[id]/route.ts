import { createRouteHandlerClient } from "@/lib/supabase/server";
import { deleteCo2Log } from "@/lib/ecopilot/queries";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await deleteCo2Log(user.id, id, supabase);

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/ecopilot/co2-logs/[id]:", err);
    return Response.json({ error: "Failed to delete CO2 log" }, { status: 400 });
  }
}
