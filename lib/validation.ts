import { z } from "zod";

/** Shared between SubmissionForm and the /api/submissions route handler. */
export const submissionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type SubmissionFormData = z.infer<typeof submissionSchema>;
