import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/supabase/auth";
import { createServerComponentClient } from "@/lib/supabase/server";
import { loadUserProfile, displayNameFromUser } from "@/lib/ecopilot/queries";
import { fetchCurrentEspooTemperatureCelsius, FALLBACK_OUTDOOR_TEMP_CELSIUS } from "@/lib/ecopilot/weather";
import { fetchTodaySpotPricesCentsPerKwh, applyLivePrices } from "@/lib/ecopilot/gridPrice";
import { MOCK_HOURLY_SPOT_PRICES } from "@/lib/ecopilot/data";
import { EcopilotApp } from "@/components/ecopilot/EcopilotApp";
import { ROUTES, ROLES, ROLE_ROUTE_SLUGS } from "@/lib/constants";

interface RoleDashboardPageProps {
  params: Promise<{ roleSlug: string }>;
}

/** eCopilot's main page — same for every role, so this route only guards access. */
export default async function RoleDashboardPage({ params }: RoleDashboardPageProps) {
  const { roleSlug } = await params;
  const role = ROLES.find((r) => ROLE_ROUTE_SLUGS[r] === roleSlug);

  if (!role) redirect(ROUTES.unauthorized);

  const user = await getUser();
  if (!user) redirect(ROUTES.login);

  const profile = await getProfile();
  if (!profile) redirect(ROUTES.login);

  // Each user only ever sees their own role's dashboard.
  if (profile.role !== role) redirect(ROUTES.dashboard(profile.role));

  const supabase = await createServerComponentClient();
  const [ecopilotProfile, liveTemperatureCelsius, liveSpotPrices] = await Promise.all([
    loadUserProfile(user.id, displayNameFromUser(user), supabase),
    fetchCurrentEspooTemperatureCelsius(),
    fetchTodaySpotPricesCentsPerKwh(),
  ]);
  if (!ecopilotProfile) redirect(ROUTES.unauthorized);

  const initialOutdoorTempCelsius = liveTemperatureCelsius ?? FALLBACK_OUTDOOR_TEMP_CELSIUS;
  const spotPrices = applyLivePrices(MOCK_HOURLY_SPOT_PRICES, liveSpotPrices);

  return (
    <EcopilotApp
      initialProfile={ecopilotProfile}
      accountEmail={user.email}
      initialOutdoorTempCelsius={initialOutdoorTempCelsius}
      spotPrices={spotPrices}
      isLiveSpotPrices={liveSpotPrices !== null}
    />
  );
}
