import { createRouteHandlerClient } from "@/lib/supabase/server";
import {
  getAllSubmissions,
  getDistrictSubmissions,
  getMySubmissions,
  createSubmission,
} from "@/lib/db/queries";
import { submissionSchema } from "@/lib/validation";

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, district_id")
      .eq("id", user.id)
      .single();

    if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 });

    const submissions =
      profile.role === "admin"
        ? await getAllSubmissions(supabase)
        : profile.role === "staff"
          ? profile.district_id
            ? await getDistrictSubmissions(profile.district_id, supabase)
            : []
          : await getMySubmissions(user.id, supabase);

    return Response.json(submissions);
  } catch (err) {
    console.error("GET /api/submissions:", err);
    return Response.json({ error: "Failed to fetch submissions" }, { status: 500 });
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
    const validated = submissionSchema.parse(body);

    const submission = await createSubmission(validated, user.id, supabase);

    return Response.json(submission);
  } catch (err) {
    console.error("POST /api/submissions:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to create submission" },
      { status: 400 }
    );
  }
}
