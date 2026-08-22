import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/supabase/auth";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ROUTES } from "@/lib/constants";

/** Header+Sidebar chrome, scoped to /submissions — the eCopilot route provides its own. */
export default async function SubmissionsLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect(ROUTES.login);

  const profile = await getProfile();
  if (!profile) redirect(ROUTES.login);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header userEmail={user.email} role={profile.role} />
      <div className="flex flex-1">
        <Sidebar role={profile.role} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
