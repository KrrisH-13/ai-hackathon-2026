import type { Job } from "@/lib/db/types";

export type JobHandler = (job: Job) => Promise<void>;

/**
 * One entry per job `type`, looked up by app/api/jobs/process/route.ts.
 * Empty by design — add handlers as features land, e.g.:
 *
 *   export const jobHandlers: Record<string, JobHandler> = {
 *     "classify-image": async (job) => { ... },
 *     "chat-reply": async (job) => { ... },
 *   };
 */
export const jobHandlers: Record<string, JobHandler> = {};
