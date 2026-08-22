import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/supabase/auth";
import { ROUTES } from "@/lib/constants";

/**
 * Auth guard only — no shared chrome here. The `[roleSlug]` route (eCopilot) is
 * a full-page experience with its own header/nav (EcopilotSidebar +
 * EcopilotTopBar), so this layout stays a plain pass-through rather than
 * wrapping it in another Header/Sidebar.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect(ROUTES.login);

  const profile = await getProfile();
  if (!profile) redirect(ROUTES.login);

  return <>{children}</>;
}
