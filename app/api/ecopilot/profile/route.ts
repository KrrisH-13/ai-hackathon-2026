import { createRouteHandlerClient } from "@/lib/supabase/server";
import {
  getEcopilotProfile,
  updateEcopilotProfile,
  getTotalCo2SavedKg,
  mapProfileRowToUserProfile,
  mapUserProfileToUpdate,
  displayNameFromUser,
} from "@/lib/ecopilot/queries";
import { ecopilotProfileUpdateSchema } from "@/lib/validation";

/** The logged-in user's ecopilot climate profile. */
export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await getEcopilotProfile(user.id, supabase);
    if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 });

    const savedCo2Kg = await getTotalCo2SavedKg(user.id, supabase);

    return Response.json(mapProfileRowToUserProfile(profile, displayNameFromUser(user), savedCo2Kg));
  } catch (err) {
    console.error("GET /api/ecopilot/profile:", err);
    return Response.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validated = ecopilotProfileUpdateSchema.parse(body);

    const profile = await updateEcopilotProfile(user.id, mapUserProfileToUpdate(validated), supabase);
    const savedCo2Kg = await getTotalCo2SavedKg(user.id, supabase);

    return Response.json(mapProfileRowToUserProfile(profile, displayNameFromUser(user), savedCo2Kg));
  } catch (err) {
    console.error("PATCH /api/ecopilot/profile:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to update profile" },
      { status: 400 }
    );
  }
}
