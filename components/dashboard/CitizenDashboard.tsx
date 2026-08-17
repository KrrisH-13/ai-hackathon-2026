import type { Submission } from "@/lib/db/types";
import { SubmissionList } from "@/components/dashboard/SubmissionList";

interface CitizenDashboardProps {
  submissions: Submission[];
}

export default function CitizenDashboard({ submissions }: CitizenDashboardProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Your submissions</h1>
      <SubmissionList submissions={submissions} emptyMessage="You haven't submitted anything yet." />
    </div>
  );
}
