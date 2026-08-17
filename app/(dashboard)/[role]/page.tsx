import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/supabase/auth";
import { createServerComponentClient } from "@/lib/supabase/server";
import { getMySubmissions, getDistrictSubmissions, getAllSubmissions } from "@/lib/db/queries";
import CitizenDashboard from "@/components/dashboard/CitizenDashboard";
import StaffDashboard from "@/components/dashboard/StaffDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import { ROUTES, ROLES, type Role } from "@/lib/constants";

interface RoleDashboardPageProps {
  params: Promise<{ role: string }>;
}

export default async function RoleDashboardPage({ params }: RoleDashboardPageProps) {
  const { role } = await params;

  if (!ROLES.includes(role as Role)) redirect(ROUTES.unauthorized);

  const user = await getUser();
  if (!user) redirect(ROUTES.login);

  const profile = await getProfile();
  if (!profile) redirect(ROUTES.login);

  // Each user only ever sees their own role's dashboard.
  if (profile.role !== role) redirect(ROUTES.dashboard(profile.role));

  const supabase = await createServerComponentClient();

  if (profile.role === "citizen") {
    const submissions = await getMySubmissions(user.id, supabase);
    return <CitizenDashboard submissions={submissions} />;
  }

  if (profile.role === "staff") {
    const submissions = profile.district_id
      ? await getDistrictSubmissions(profile.district_id, supabase)
      : [];
    return <StaffDashboard submissions={submissions} districtId={profile.district_id} />;
  }

  const submissions = await getAllSubmissions(supabase);
  return <AdminDashboard submissions={submissions} />;
}
