import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Job } from "@/lib/db/types";

type Client = SupabaseClient<Database>;

/**
 * Enqueue a background job. The `jobs` table has no anon/authenticated
 * grants (see the migration), so this must be called with the
 * service-role client (lib/supabase/admin.ts) from trusted server code —
 * e.g. inside a route handler, after validating the request.
 */
export async function enqueueJob(
  type: string,
  payload: Record<string, unknown>,
  client: Client
): Promise<Job> {
  const { data, error } = await client.from("jobs").insert([{ type, payload }]).select().single();

  if (error) throw new Error(`Failed to enqueue job: ${error.message}`);
  return data;
}

/** Atomically claims up to `limit` pending jobs (SKIP LOCKED under the hood). */
export async function claimJobs(limit: number, client: Client): Promise<Job[]> {
  const { data, error } = await client.rpc("claim_jobs", { job_limit: limit });
  if (error) throw new Error(`Failed to claim jobs: ${error.message}`);
  return data ?? [];
}

export async function completeJob(id: string, client: Client): Promise<void> {
  const { error } = await client.from("jobs").update({ status: "completed" }).eq("id", id);
  if (error) throw new Error(`Failed to complete job ${id}: ${error.message}`);
}

/** Marks a job failed; leaves it "pending" for another claim if attempts remain. */
export async function failJob(id: string, errorMessage: string, client: Client): Promise<void> {
  const { data: job, error: fetchError } = await client
    .from("jobs")
    .select("attempts, max_attempts")
    .eq("id", id)
    .single();

  if (fetchError) throw new Error(`Failed to load job ${id}: ${fetchError.message}`);

  const status = job.attempts >= job.max_attempts ? "failed" : "pending";

  const { error } = await client.from("jobs").update({ status, last_error: errorMessage }).eq("id", id);
  if (error) throw new Error(`Failed to update job ${id}: ${error.message}`);
}
