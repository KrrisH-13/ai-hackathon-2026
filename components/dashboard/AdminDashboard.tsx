import type { Submission } from "@/lib/db/types";
import { SubmissionList } from "@/components/dashboard/SubmissionList";

interface AdminDashboardProps {
  submissions: Submission[];
}

export default function AdminDashboard({ submissions }: AdminDashboardProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">All submissions</h1>
      <SubmissionList submissions={submissions} showDistrict />
    </div>
  );
}
