import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/supabase/auth";
import { createServerComponentClient } from "@/lib/supabase/server";
import { loadUserProfile, displayNameFromUser } from "@/lib/ecopilot/queries";
import { ProfileEditView } from "@/components/ecopilot/ProfileEditView";
import { ROUTES, ROLES, ROLE_ROUTE_SLUGS } from "@/lib/constants";

interface ProfileEditPageProps {
  params: Promise<{ roleSlug: string }>;
  /** ?lang=fi carries the language the user had toggled on the dashboard — see EcopilotTopBar's profile link. */
  searchParams: Promise<{ lang?: string }>;
}

/** Full-page climate profile editor — a separate route rather than a modal overlay, so it has its own URL and back/cancel navigation. */
export default async function ProfileEditPage({ params, searchParams }: ProfileEditPageProps) {
  const { roleSlug } = await params;
  const { lang } = await searchParams;
  const role = ROLES.find((r) => ROLE_ROUTE_SLUGS[r] === roleSlug);

  if (!role) redirect(ROUTES.unauthorized);

  const user = await getUser();
  if (!user) redirect(ROUTES.login);

  const profile = await getProfile();
  if (!profile) redirect(ROUTES.login);

  if (profile.role !== role) redirect(ROUTES.dashboard(profile.role));

  const supabase = await createServerComponentClient();
  const userProfile = await loadUserProfile(user.id, displayNameFromUser(user), supabase);
  if (!userProfile) redirect(ROUTES.unauthorized);

  return <ProfileEditView userProfile={userProfile} initialIsFinnish={lang === "fi"} backHref={ROUTES.dashboard(role)} />;
}
