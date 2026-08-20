import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

type Client = SupabaseClient<Database>;

export const ATTACHMENTS_BUCKET = "attachments";

/**
 * Upload a file into the caller's own folder (`${userId}/...`) — required
 * by the `attachments_*_own` storage policies in
 * supabase/migrations/20260820150000_storage_and_jobs.sql. Returns the
 * storage path, not a URL; use `getSignedUrl` to read it back.
 */
export async function uploadFile(file: File, userId: string, client: Client): Promise<string> {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : undefined;
  const path = `${userId}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;

  const { error } = await client.storage.from(ATTACHMENTS_BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });

  if (error) throw new Error(`Failed to upload file: ${error.message}`);
  return path;
}

/** Short-lived signed URL for a private object (default: 1 hour). */
export async function getSignedUrl(
  path: string,
  client: Client,
  expiresInSeconds = 3600
): Promise<string> {
  const { data, error } = await client.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error) throw new Error(`Failed to sign URL for ${path}: ${error.message}`);
  return data.signedUrl;
}

export async function deleteFile(path: string, client: Client): Promise<void> {
  const { error } = await client.storage.from(ATTACHMENTS_BUCKET).remove([path]);
  if (error) throw new Error(`Failed to delete file ${path}: ${error.message}`);
}
