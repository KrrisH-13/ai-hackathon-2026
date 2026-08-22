"use client";

import { useState } from "react";
import type { UserProfile, Season, EcopilotTab, SpotPricePoint } from "@/lib/ecopilot/types";
import { SEASONAL_PRESETS } from "@/lib/ecopilot/data";
import { updateEcopilotProfileAPI } from "@/lib/ecopilot/profileClient";
import { EcopilotSidebar } from "@/components/ecopilot/EcopilotSidebar";
import { EcopilotTopBar } from "@/components/ecopilot/EcopilotTopBar";
import { AiClimateCopilotView } from "@/components/ecopilot/views/AiClimateCopilotView";
import { NordPoolEnergyOptimizerView } from "@/components/ecopilot/views/NordPoolEnergyOptimizerView";
import { HsyRecyclingScannerView } from "@/components/ecopilot/views/HsyRecyclingScannerView";
import { HslTransitCommuteView } from "@/components/ecopilot/views/HslTransitCommuteView";
import { EspooClimateWatch2030View } from "@/components/ecopilot/views/EspooClimateWatch2030View";
import { PersonalRoadmapSprintView } from "@/components/ecopilot/views/PersonalRoadmapSprintView";
import { ActivityLoggerView } from "@/components/ecopilot/views/ActivityLoggerView";
import { ReceiptScannerView } from "@/components/ecopilot/views/ReceiptScannerView";
import { WhatIfView } from "@/components/ecopilot/views/WhatIfView";
import { Co2TrackerView } from "@/components/ecopilot/views/Co2TrackerView";
import { RewardsView } from "@/components/ecopilot/views/RewardsView";
import { ProfileCustomizerModal } from "@/components/ecopilot/ProfileCustomizerModal";
import { SharePledgeModal } from "@/components/ecopilot/SharePledgeModal";

interface EcopilotAppProps {
  /** The logged-in user's real, persisted climate profile (app/api/ecopilot/profile). */
  initialProfile: UserProfile;
  /** Signed-in account's email, for the logout control in EcopilotTopBar. */
  accountEmail?: string;
  /** Today's real Northern-hemisphere season, computed server-side (lib/ecopilot/weather.ts). */
  initialSeason: Season;
  /** Live outdoor temperature for Espoo (Open-Meteo), or a seasonal mock fallback if the fetch failed. */
  initialOutdoorTempCelsius: number;
  /** Whether initialOutdoorTempCelsius came from the live weather API vs. the seasonal mock fallback. */
  isLiveWeather: boolean;
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
  initialSeason,
  initialOutdoorTempCelsius,
  isLiveWeather,
  spotPrices,
  isLiveSpotPrices,
}: EcopilotAppProps) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [currentTab, setCurrentTab] = useState<EcopilotTab>("chat");
  const [currentSeason, setCurrentSeason] = useState<Season>(initialSeason);
  const [isFinnish, setIsFinnish] = useState<boolean>(false);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Real weather only applies to today's actual season — flipping the season
  // switcher to explore a different one falls back to that season's typical
  // mock temperature, same as before live weather existed.
  const isShowingLiveWeather = isLiveWeather && currentSeason === initialSeason;
  const outdoorTempCelsius = isShowingLiveWeather ? initialOutdoorTempCelsius : SEASONAL_PRESETS[currentSeason].typicalTemp;

  const handleSaveProfile = async (updated: UserProfile) => {
    setSaveError(null);
    try {
      const saved = await updateEcopilotProfileAPI(updated);
      setProfile(saved);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save profile");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <EcopilotSidebar currentTab={currentTab} onSelectTab={setCurrentTab} isFinnish={isFinnish} />

      <div className="flex-1 min-w-0 flex flex-col">
        <EcopilotTopBar
          userProfile={profile}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          currentSeason={currentSeason}
          onSelectSeason={setCurrentSeason}
          isFinnish={isFinnish}
          onToggleLanguage={() => setIsFinnish((prev) => !prev)}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          accountEmail={accountEmail}
          outdoorTempCelsius={outdoorTempCelsius}
          isLiveWeather={isShowingLiveWeather}
        />

        {saveError && (
          <div className="px-4 sm:px-8 py-2 bg-rose-50 border-b border-rose-200 text-xs text-rose-700 font-medium">
            {saveError}
          </div>
        )}

        <main className="flex-1 pb-16">
          {currentTab === "chat" && (
            <AiClimateCopilotView
              userProfile={profile}
              currentSeason={currentSeason}
              outdoorTempCelsius={outdoorTempCelsius}
              isFinnish={isFinnish}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === "energy" && (
            <NordPoolEnergyOptimizerView
              userProfile={profile}
              currentSeason={currentSeason}
              outdoorTempCelsius={outdoorTempCelsius}
              spotPrices={spotPrices}
              isLiveSpotPrices={isLiveSpotPrices}
              isFinnish={isFinnish}
            />
          )}

          {currentTab === "recycling" && <HsyRecyclingScannerView isFinnish={isFinnish} />}

          {currentTab === "transit" && <HslTransitCommuteView isFinnish={isFinnish} />}

          {currentTab === "roadmap" && <EspooClimateWatch2030View isFinnish={isFinnish} />}

          {currentTab === "activityLog" && <ActivityLoggerView isFinnish={isFinnish} />}

          {currentTab === "receiptScanner" && <ReceiptScannerView isFinnish={isFinnish} />}

          {currentTab === "whatIf" && (
            <WhatIfView userProfile={profile} currentSeason={currentSeason} isFinnish={isFinnish} />
          )}

          {currentTab === "tracker" && <Co2TrackerView userProfile={profile} isFinnish={isFinnish} />}

          {currentTab === "rewards" && <RewardsView isFinnish={isFinnish} />}

          {currentTab === "personal" && (
            <PersonalRoadmapSprintView
              userProfile={profile}
              currentSeason={currentSeason}
              isFinnish={isFinnish}
              onOpenShareModal={() => setIsShareModalOpen(true)}
            />
          )}
        </main>

        <footer className="border-t border-slate-200 bg-white py-6 px-4 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-emerald-600 rounded flex items-center justify-center text-white font-bold text-[10px]">
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

      <ProfileCustomizerModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={profile}
        onSaveProfile={handleSaveProfile}
        isFinnish={isFinnish}
      />

      <SharePledgeModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        userProfile={profile}
        isFinnish={isFinnish}
      />
    </div>
  );
}
