import { createRouteHandlerClient } from "@/lib/supabase/server";
import { updateSubmission, deleteSubmission } from "@/lib/db/queries";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase.from("submissions").select("*").eq("id", id).single();

    if (error) return Response.json({ error: "Submission not found" }, { status: 404 });

    return Response.json(data);
  } catch (err) {
    console.error("GET /api/submissions/[id]:", err);
    return Response.json({ error: "Failed to fetch submission" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const submission = await updateSubmission(id, body, supabase);

    return Response.json(submission);
  } catch (err) {
    console.error("PUT /api/submissions/[id]:", err);
    return Response.json({ error: "Failed to update submission" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await deleteSubmission(id, supabase);

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/submissions/[id]:", err);
    return Response.json({ error: "Failed to delete submission" }, { status: 400 });
  }
}
