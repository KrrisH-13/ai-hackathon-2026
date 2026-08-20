import { createRouteHandlerClient } from "@/lib/supabase/server";
import { uploadFile } from "@/lib/supabase/storage";
import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES } from "@/lib/constants";

/** Generic authenticated file upload. Expects multipart/form-data with a "file" field. */
export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "Missing file" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return Response.json({ error: "File too large" }, { status: 413 });
    }

    if (ALLOWED_UPLOAD_MIME_TYPES.length > 0 && !ALLOWED_UPLOAD_MIME_TYPES.includes(file.type)) {
      return Response.json({ error: `Unsupported file type: ${file.type}` }, { status: 415 });
    }

    const path = await uploadFile(file, user.id, supabase);

    return Response.json({ path });
  } catch (err) {
    console.error("POST /api/upload:", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
