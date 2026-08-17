import type { Submission } from "@/lib/db/types";
import { SubmissionList } from "@/components/dashboard/SubmissionList";

interface StaffDashboardProps {
  submissions: Submission[];
  districtId: string | null;
}

export default function StaffDashboard({ submissions, districtId }: StaffDashboardProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        Submissions{districtId ? ` — District ${districtId}` : ""}
      </h1>
      <SubmissionList submissions={submissions} emptyMessage="No submissions in this district yet." />
    </div>
  );
}
