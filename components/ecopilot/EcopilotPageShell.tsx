"use client";

import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/ecopilot/types";
import { EcopilotSidebar } from "@/components/ecopilot/EcopilotSidebar";

interface EcopilotPageShellProps {
  /** Which sidebar row to highlight — "places" on the Favourite Locations page, null elsewhere (e.g. Profile). */
  currentTab: "places" | null;
  isFinnish: boolean;
  userProfile: UserProfile;
  /** Where the sidebar's tab buttons navigate back to — the main dashboard route. */
  dashboardHref: string;
  profileHref: string;
  placesHref: string;
  accountEmail?: string;
  children: React.ReactNode;
}

/**
 * Keeps EcopilotSidebar mounted around a standalone route (Profile, Favourite
 * Locations) that lives outside EcopilotApp's own tab-switching shell — without
 * this, navigating to those pages made the whole left nav vanish. Clicking a
 * tab from here can't just flip local state (there is none on this route), so
 * it navigates back to the dashboard with `?tab=` and EcopilotApp picks that
 * up on mount (see its `initialTab` logic).
 */
export function EcopilotPageShell({
  currentTab,
  isFinnish,
  userProfile,
  dashboardHref,
  profileHref,
  placesHref,
  accountEmail,
  children,
}: EcopilotPageShellProps) {
  const router = useRouter();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800">
      <EcopilotSidebar
        currentTab={currentTab}
        onSelectTab={(tab) => router.push(`${dashboardHref}?tab=${tab}`)}
        isFinnish={isFinnish}
        userProfile={userProfile}
        profileHref={profileHref}
        placesHref={placesHref}
        accountEmail={accountEmail}
      />
      <div className="flex-1 min-w-0 min-h-0 overflow-y-auto">{children}</div>
    </div>
  );
}
