import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/supabase/auth";
import { ROUTES } from "@/lib/constants";

/**
 * Auth guard only — no shared chrome here. The `[role]` route (eCopilot) is
 * a full-page experience with its own header/nav (EcopilotSidebar/EcopilotTopBar), so wrapping
 * it in a second Header+Sidebar produced two stacked nav bars in two
 * different visual languages. `submissions/layout.tsx` renders the
 * Header+Sidebar for the one route that still needs them.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect(ROUTES.login);

  const profile = await getProfile();
  if (!profile) redirect(ROUTES.login);

  return <>{children}</>;
}
