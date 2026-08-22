import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/supabase/auth";
import { createServerComponentClient } from "@/lib/supabase/server";
import { getEcopilotProfile, getTotalCo2SavedKg, mapProfileRowToUserProfile, displayNameFromUser } from "@/lib/ecopilot/queries";
import { currentSeason, fetchCurrentEspooTemperatureCelsius } from "@/lib/ecopilot/weather";
import { fetchTodaySpotPricesCentsPerKwh, applyLivePrices } from "@/lib/ecopilot/gridPrice";
import { SEASONAL_PRESETS, MOCK_HOURLY_SPOT_PRICES } from "@/lib/ecopilot/data";
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
  const ecopilotProfileRow = await getEcopilotProfile(user.id, supabase);
  if (!ecopilotProfileRow) redirect(ROUTES.unauthorized);

  const [savedCo2Kg, liveTemperatureCelsius, liveSpotPrices] = await Promise.all([
    getTotalCo2SavedKg(user.id, supabase),
    fetchCurrentEspooTemperatureCelsius(),
    fetchTodaySpotPricesCentsPerKwh(),
  ]);
  const ecopilotProfile = mapProfileRowToUserProfile(ecopilotProfileRow, displayNameFromUser(user), savedCo2Kg);

  const initialSeason = currentSeason(new Date());
  const initialOutdoorTempCelsius = liveTemperatureCelsius ?? SEASONAL_PRESETS[initialSeason].typicalTemp;
  const spotPrices = applyLivePrices(MOCK_HOURLY_SPOT_PRICES, liveSpotPrices);

  return (
    <EcopilotApp
      initialProfile={ecopilotProfile}
      accountEmail={user.email}
      initialSeason={initialSeason}
      initialOutdoorTempCelsius={initialOutdoorTempCelsius}
      isLiveWeather={liveTemperatureCelsius !== null}
      spotPrices={spotPrices}
      isLiveSpotPrices={liveSpotPrices !== null}
    />
  );
}
