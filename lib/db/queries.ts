import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Submission, SubmissionInsert, SubmissionUpdate } from "@/lib/db/types";

type Client = SupabaseClient<Database>;

/** Submissions belonging to the given user. RLS enforces this scope too. */
export async function getMySubmissions(userId: string, client: Client): Promise<Submission[]> {
  const { data, error } = await client
    .from("submissions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch submissions: ${error.message}`);
  return data;
}

/** Submissions in a given district. RLS restricts this to staff/admin. */
export async function getDistrictSubmissions(districtId: string, client: Client): Promise<Submission[]> {
  const { data, error } = await client
    .from("submissions")
    .select("*")
    .eq("district_id", districtId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch district submissions: ${error.message}`);
  return data;
}

/** All submissions. RLS restricts this to admin. */
export async function getAllSubmissions(client: Client): Promise<Submission[]> {
  const { data, error } = await client
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch submissions: ${error.message}`);
  return data;
}

/** Create a submission owned by `userId`. RLS enforces ownership on insert. */
export async function createSubmission(
  input: SubmissionInsert,
  userId: string,
  client: Client
): Promise<Submission> {
  const { data, error } = await client
    .from("submissions")
    .insert([{ ...input, user_id: userId }])
    .select()
    .single();

  if (error) throw new Error(`Failed to create submission: ${error.message}`);
  return data;
}

/** Update a submission. RLS enforces who is allowed to update which rows. */
export async function updateSubmission(
  id: string,
  input: SubmissionUpdate,
  client: Client
): Promise<Submission> {
  const { data, error } = await client
    .from("submissions")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update submission: ${error.message}`);
  return data;
}

/** Delete a submission. RLS enforces who is allowed to delete which rows. */
export async function deleteSubmission(id: string, client: Client): Promise<void> {
  const { error } = await client.from("submissions").delete().eq("id", id);

  if (error) throw new Error(`Failed to delete submission: ${error.message}`);
}
