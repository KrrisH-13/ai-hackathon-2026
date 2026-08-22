import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/supabase/auth";
import { EcopilotApp } from "@/components/ecopilot/EcopilotApp";
import { ROUTES, ROLES, type Role } from "@/lib/constants";

interface RoleDashboardPageProps {
  params: Promise<{ role: string }>;
}

/** eCopilot's main page — same for every role, so this route only guards access. */
export default async function RoleDashboardPage({ params }: RoleDashboardPageProps) {
  const { role } = await params;

  if (!ROLES.includes(role as Role)) redirect(ROUTES.unauthorized);

  const user = await getUser();
  if (!user) redirect(ROUTES.login);

  const profile = await getProfile();
  if (!profile) redirect(ROUTES.login);

  // Each user only ever sees their own role's dashboard.
  if (profile.role !== role) redirect(ROUTES.dashboard(profile.role));

  return <EcopilotApp accountEmail={user.email} />;
}
