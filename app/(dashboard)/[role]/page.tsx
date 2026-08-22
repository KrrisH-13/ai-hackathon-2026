import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/supabase/auth";
import { createServerComponentClient } from "@/lib/supabase/server";
import { getEcopilotProfile, getTotalCo2SavedKg, mapProfileRowToUserProfile, displayNameFromUser } from "@/lib/ecopilot/queries";
import { currentSeason, fetchCurrentEspooTemperatureCelsius } from "@/lib/ecopilot/weather";
import { SEASONAL_PRESETS } from "@/lib/ecopilot/data";
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

  const supabase = await createServerComponentClient();
  const ecopilotProfileRow = await getEcopilotProfile(user.id, supabase);
  if (!ecopilotProfileRow) redirect(ROUTES.unauthorized);

  const [savedCo2Kg, liveTemperatureCelsius] = await Promise.all([
    getTotalCo2SavedKg(user.id, supabase),
    fetchCurrentEspooTemperatureCelsius(),
  ]);
  const ecopilotProfile = mapProfileRowToUserProfile(ecopilotProfileRow, displayNameFromUser(user), savedCo2Kg);

  const initialSeason = currentSeason(new Date());
  const initialOutdoorTempCelsius = liveTemperatureCelsius ?? SEASONAL_PRESETS[initialSeason].typicalTemp;

  return (
    <EcopilotApp
      initialProfile={ecopilotProfile}
      accountEmail={user.email}
      initialSeason={initialSeason}
      initialOutdoorTempCelsius={initialOutdoorTempCelsius}
      isLiveWeather={liveTemperatureCelsius !== null}
    />
  );
}
