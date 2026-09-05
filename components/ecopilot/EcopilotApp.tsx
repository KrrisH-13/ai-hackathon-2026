"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { UserProfile, EcopilotTab, SpotPricePoint } from "@/lib/ecopilot/types";
import { EcopilotSidebar } from "@/components/ecopilot/EcopilotSidebar";
import { EcopilotTopBar } from "@/components/ecopilot/EcopilotTopBar";
import { AiClimateCopilotView } from "@/components/ecopilot/views/AiClimateCopilotView";
import { GuideView } from "@/components/ecopilot/views/GuideView";
import { NordPoolEnergyOptimizerView } from "@/components/ecopilot/views/NordPoolEnergyOptimizerView";
import { HsyRecyclingScannerView } from "@/components/ecopilot/views/HsyRecyclingScannerView";
import { HslTransitCommuteView } from "@/components/ecopilot/views/HslTransitCommuteView";
import { EspooClimateWatch2030View } from "@/components/ecopilot/views/EspooClimateWatch2030View";
import { ActivityLoggerView } from "@/components/ecopilot/views/ActivityLoggerView";
import { WhatIfView } from "@/components/ecopilot/views/WhatIfView";
import { TrackerRewardsView } from "@/components/ecopilot/views/TrackerRewardsView";
import { SharePledgeModal } from "@/components/ecopilot/SharePledgeModal";

interface EcopilotAppProps {
  /** The logged-in user's real, persisted climate profile (app/api/ecopilot/profile). */
  initialProfile: UserProfile;
  /** Signed-in account's email, for the logout control in EcopilotTopBar. */
  accountEmail?: string;
  /** Live outdoor temperature for Espoo (Open-Meteo), or a fallback if the fetch failed. */
  initialOutdoorTempCelsius: number;
  /** Today's 24h spot price curve — live prices (porssisahko.net) merged onto the mock curve where available. */
  spotPrices: SpotPricePoint[];
  /** Whether the live spot-price fetch actually succeeded this page load. */
  isLiveSpotPrices: boolean;
}

/**
 * "Kipinä Espoo AI" — the ecopilot feature, ported from the standalone
 * espoo-climatepulse-ai---finnish-carbon-neutrality-2030-assistant prototype.
 * Full-page experience with its own left nav (EcopilotSidebar) + top bar
 * (EcopilotTopBar) — see app/(dashboard)/layout.tsx for why the scaffold's
 * generic Header/Sidebar aren't layered on top. The climate profile is real
 * (linked to the logged-in account, see supabase/migrations/20260822090000_*.sql)
 * rather than a mock persona switcher.
 */
export function EcopilotApp({
  initialProfile,
  accountEmail,
  initialOutdoorTempCelsius,
  spotPrices,
  isLiveSpotPrices,
}: EcopilotAppProps) {
  const [profile] = useState<UserProfile>(initialProfile);
  const [currentTab, setCurrentTab] = useState<EcopilotTab>("chat");
  const [isFinnish, setIsFinnish] = useState<boolean>(false);

  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // The whole app scrolls on the window (no inner scroll container), so
  // switching tabs otherwise leaves you wherever the previous tab's content
  // had scrolled to instead of starting each tab at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentTab]);

  const pathname = usePathname();
  // The profile editor is a separate page (app/(dashboard)/[roleSlug]/profile)
  // rather than a modal — carry the current language over via query param
  // since it's otherwise only kept in this component's local state.
  const profileHref = `${pathname}/profile?lang=${isFinnish ? "fi" : "en"}`;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800">
      <EcopilotSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isFinnish={isFinnish}
        userProfile={profile}
        profileHref={profileHref}
        accountEmail={accountEmail}
      />

      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <EcopilotTopBar
          onOpenRoadmap={() => setCurrentTab("roadmap")}
          isFinnish={isFinnish}
          onToggleLanguage={() => setIsFinnish((prev) => !prev)}
          onOpenShareModal={() => setIsShareModalOpen(true)}
        />

        <main className="flex-1 min-h-0 overflow-y-auto">
          {currentTab === "chat" && (
            <AiClimateCopilotView
              userProfile={profile}
              outdoorTempCelsius={initialOutdoorTempCelsius}
              isFinnish={isFinnish}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === "guide" && <GuideView isFinnish={isFinnish} onNavigateTab={setCurrentTab} />}

          {currentTab === "energy" && (
            <NordPoolEnergyOptimizerView
              userProfile={profile}
              outdoorTempCelsius={initialOutdoorTempCelsius}
              spotPrices={spotPrices}
              isLiveSpotPrices={isLiveSpotPrices}
              isFinnish={isFinnish}
            />
          )}

          {currentTab === "recycling" && <HsyRecyclingScannerView isFinnish={isFinnish} />}

          {currentTab === "transit" && <HslTransitCommuteView isFinnish={isFinnish} />}

          {currentTab === "roadmap" && <EspooClimateWatch2030View isFinnish={isFinnish} />}

          {currentTab === "activityLog" && <ActivityLoggerView isFinnish={isFinnish} />}

          {currentTab === "whatIf" && <WhatIfView userProfile={profile} isFinnish={isFinnish} />}

          {currentTab === "trackerRewards" && <TrackerRewardsView userProfile={profile} isFinnish={isFinnish} />}
        </main>

        <footer className="border-t border-slate-200 bg-white py-6 px-4 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-emerald-600 rounded flex items-center justify-center text-white font-bold text-[12px]">
                E
              </div>
              <span className="font-bold text-slate-900">
                e<span className="text-emerald-600">Copilot</span>
              </span>
              <span>—</span>
              <span>
                {isFinnish
                  ? "Hiilineutraali Espoo 2030 -tiekartan ja Ilmastovahdin asukaspalvelu"
                  : "Citizen Copilot for the Carbon-Neutral Espoo 2030 Roadmap"}
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-600 font-semibold">
              <a href="https://ilmastovahti.espoo.fi" target="_blank" rel="noreferrer" className="hover:text-emerald-700 transition">
                Ilmastovahti.espoo.fi
              </a>
              <span>•</span>
              <a href="https://www.hsy.fi/jateopas" target="_blank" rel="noreferrer" className="hover:text-emerald-700 transition">
                HSY Jäteopas
              </a>
              <span>•</span>
              <a href="https://www.hsl.fi" target="_blank" rel="noreferrer" className="hover:text-emerald-700 transition">
                HSL Reittiopas
              </a>
            </div>
          </div>
        </footer>
      </div>

      <SharePledgeModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        userProfile={profile}
        isFinnish={isFinnish}
      />
    </div>
  );
}
