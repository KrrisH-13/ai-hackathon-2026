import { createServiceRoleClient } from "@/lib/supabase/admin";
import { claimJobs, completeJob, failJob } from "@/lib/jobs/queue";
import { jobHandlers } from "@/lib/jobs/handlers";

const BATCH_SIZE = 5;

/**
 * Worker endpoint: claims a batch of pending jobs and runs their handlers.
 * Trigger it two ways — wiring up both keeps a hackathon demo responsive:
 *
 * 1. A Supabase Database Webhook on `jobs` INSERT, POSTing here immediately
 *    (Database > Webhooks in the dashboard; add an `Authorization: Bearer
 *    <CRON_SECRET>` header in the webhook config). Near-instant processing.
 * 2. The Vercel Cron in vercel.json, as a periodic retry sweep for jobs a
 *    webhook call missed or that failed and got re-queued. Vercel sends
 *    cron requests as GET and auto-adds the same Bearer header when an env
 *    var named exactly CRON_SECRET is set — no extra config needed there.
 *
 * Note: Vercel's Hobby plan only runs cron on a daily cadence (Pro allows
 * finer schedules) — fine here since the webhook is the fast path and cron
 * is just a safety net. See the "upgrade path" notes if job volume or
 * processing time grows past what this Postgres-backed queue handles well.
 */
async function processJobs(): Promise<Response> {
  const supabase = createServiceRoleClient();
  const jobs = await claimJobs(BATCH_SIZE, supabase);

  const results = await Promise.all(
    jobs.map(async (job) => {
      const handler = jobHandlers[job.type];

      if (!handler) {
        await failJob(job.id, `No handler registered for job type "${job.type}"`, supabase);
        return { id: job.id, type: job.type, ok: false };
      }

      try {
        await handler(job);
        await completeJob(job.id, supabase);
        return { id: job.id, type: job.type, ok: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        await failJob(job.id, message, supabase);
        return { id: job.id, type: job.type, ok: false };
      }
    })
  );

  return Response.json({ claimed: jobs.length, results });
}

function isAuthorized(request: Request): boolean {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  return Boolean(process.env.CRON_SECRET) && secret === process.env.CRON_SECRET;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return processJobs();
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return processJobs();
}
