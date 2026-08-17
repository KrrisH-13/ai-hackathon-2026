import type { Submission } from "@/lib/db/types";
import { formatDate } from "@/lib/utils";

interface SubmissionListProps {
  submissions: Submission[];
  emptyMessage?: string;
  showDistrict?: boolean;
}

export function SubmissionList({
  submissions,
  emptyMessage = "No submissions yet.",
  showDistrict = false,
}: SubmissionListProps) {
  if (submissions.length === 0) {
    return <p className="text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-3">
      {submissions.map((submission) => (
        <li key={submission.id} className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{submission.title}</h3>
            <span className="text-xs text-muted-foreground">{formatDate(submission.created_at)}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{submission.description}</p>
          <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-secondary px-2 py-0.5">{submission.status}</span>
            {showDistrict && submission.district_id && (
              <span className="rounded-full bg-secondary px-2 py-0.5">
                District {submission.district_id}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
