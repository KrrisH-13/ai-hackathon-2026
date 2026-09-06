import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/supabase/auth";
import { createServerComponentClient } from "@/lib/supabase/server";
import { loadUserProfile, displayNameFromUser } from "@/lib/ecopilot/queries";
import { FrequentPlacesView } from "@/components/ecopilot/FrequentPlacesView";
import { ROUTES, ROLES, ROLE_ROUTE_SLUGS } from "@/lib/constants";

interface FrequentPlacesPageProps {
  params: Promise<{ roleSlug: string }>;
  /** ?lang=fi carries the language the user had toggled on the dashboard — see EcopilotSidebar. */
  searchParams: Promise<{ lang?: string }>;
}

/** Full-page editor for the profile's frequently-visited places — split out of /profile so it's a direct sidebar link. */
export default async function FrequentPlacesPage({ params, searchParams }: FrequentPlacesPageProps) {
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

  const dashboardHref = ROUTES.dashboard(role);
  const langQuery = `?lang=${lang === "fi" ? "fi" : "en"}`;

  return (
    <FrequentPlacesView
      userProfile={userProfile}
      initialIsFinnish={lang === "fi"}
      backHref={dashboardHref}
      profileHref={`${dashboardHref}/profile${langQuery}`}
      placesHref={`${dashboardHref}/places${langQuery}`}
      accountEmail={user.email}
    />
  );
}
