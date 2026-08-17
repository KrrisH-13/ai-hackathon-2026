import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/supabase/auth";
import { createServerComponentClient } from "@/lib/supabase/server";
import { getMySubmissions, getDistrictSubmissions, getAllSubmissions } from "@/lib/db/queries";
import { SubmissionForm } from "@/components/forms/SubmissionForm";
import { SubmissionList } from "@/components/dashboard/SubmissionList";
import { ROUTES } from "@/lib/constants";

export default async function SubmissionsPage() {
  const user = await getUser();
  if (!user) redirect(ROUTES.login);

  const profile = await getProfile();
  if (!profile) redirect(ROUTES.login);

  const supabase = await createServerComponentClient();

  const submissions =
    profile.role === "admin"
      ? await getAllSubmissions(supabase)
      : profile.role === "staff"
        ? profile.district_id
          ? await getDistrictSubmissions(profile.district_id, supabase)
          : []
        : await getMySubmissions(user.id, supabase);

  return (
    <div className="space-y-8">
      {profile.role === "citizen" && (
        <section className="space-y-4">
          <h2 className="text-lg font-medium">New submission</h2>
          <SubmissionForm />
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Submissions</h2>
        <SubmissionList submissions={submissions} showDistrict={profile.role !== "citizen"} />
      </section>
    </div>
  );
}
