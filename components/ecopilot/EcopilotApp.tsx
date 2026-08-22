"use client";

import { useState } from "react";
import type { UserProfile, Season, EcopilotTab } from "@/lib/ecopilot/types";
import { DEFAULT_PROFILES } from "@/lib/ecopilot/data";
import { EcopilotSidebar } from "@/components/ecopilot/EcopilotSidebar";
import { EcopilotTopBar } from "@/components/ecopilot/EcopilotTopBar";
import { AiClimateCopilotView } from "@/components/ecopilot/views/AiClimateCopilotView";
import { NordPoolEnergyOptimizerView } from "@/components/ecopilot/views/NordPoolEnergyOptimizerView";
import { HsyRecyclingScannerView } from "@/components/ecopilot/views/HsyRecyclingScannerView";
import { HslTransitCommuteView } from "@/components/ecopilot/views/HslTransitCommuteView";
import { EspooClimateWatch2030View } from "@/components/ecopilot/views/EspooClimateWatch2030View";
import { PersonalRoadmapSprintView } from "@/components/ecopilot/views/PersonalRoadmapSprintView";
import { GreenWindowView } from "@/components/ecopilot/views/GreenWindowView";
import { ActivityLoggerView } from "@/components/ecopilot/views/ActivityLoggerView";
import { ReceiptScannerView } from "@/components/ecopilot/views/ReceiptScannerView";
import { WhatIfView } from "@/components/ecopilot/views/WhatIfView";
import { ProfileCustomizerModal } from "@/components/ecopilot/ProfileCustomizerModal";
import { SharePledgeModal } from "@/components/ecopilot/SharePledgeModal";

interface EcopilotAppProps {
  /** Signed-in account's email, for the logout control in EcopilotTopBar. */
  accountEmail?: string;
}

/**
 * "Kipinä Espoo AI" — the ecopilot feature, ported from the standalone
 * espoo-climatepulse-ai---finnish-carbon-neutrality-2030-assistant prototype
 * into this app's [role] route. It's a full-page experience with its own
 * left nav (EcopilotSidebar) + top bar (EcopilotTopBar) rather than the
 * scaffold's generic Header/Sidebar — see app/(dashboard)/layout.tsx for
 * why those aren't layered on top.
 */
export function EcopilotApp({ accountEmail }: EcopilotAppProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>(DEFAULT_PROFILES);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(DEFAULT_PROFILES[0].id);
  const [currentTab, setCurrentTab] = useState<EcopilotTab>("chat");
  const [currentSeason, setCurrentSeason] = useState<Season>("winter");
  const [isFinnish, setIsFinnish] = useState<boolean>(false);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  const currentProfile = profiles.find((p) => p.id === selectedProfileId) || profiles[0];

  const handleSaveProfile = (updated: UserProfile) => {
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <EcopilotSidebar currentTab={currentTab} onSelectTab={setCurrentTab} isFinnish={isFinnish} />

      <div className="flex-1 min-w-0 flex flex-col">
        <EcopilotTopBar
          userProfile={currentProfile}
          allProfiles={profiles}
          onSelectProfile={setSelectedProfileId}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          currentSeason={currentSeason}
          onSelectSeason={setCurrentSeason}
          isFinnish={isFinnish}
          onToggleLanguage={() => setIsFinnish((prev) => !prev)}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          accountEmail={accountEmail}
        />

        <main className="flex-1 pb-16">
          {currentTab === "chat" && (
            <AiClimateCopilotView
              userProfile={currentProfile}
              currentSeason={currentSeason}
              isFinnish={isFinnish}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === "energy" && (
            <NordPoolEnergyOptimizerView userProfile={currentProfile} currentSeason={currentSeason} isFinnish={isFinnish} />
          )}

          {currentTab === "recycling" && <HsyRecyclingScannerView isFinnish={isFinnish} />}

          {currentTab === "transit" && <HslTransitCommuteView isFinnish={isFinnish} />}

          {currentTab === "roadmap" && <EspooClimateWatch2030View isFinnish={isFinnish} />}

          {currentTab === "greenWindow" && <GreenWindowView isFinnish={isFinnish} />}

          {currentTab === "activityLog" && <ActivityLoggerView isFinnish={isFinnish} />}

          {currentTab === "receiptScanner" && <ReceiptScannerView isFinnish={isFinnish} />}

          {currentTab === "whatIf" && <WhatIfView isFinnish={isFinnish} />}

          {currentTab === "personal" && (
            <PersonalRoadmapSprintView
              userProfile={currentProfile}
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
                Kipinä <span className="text-emerald-600">Espoo AI</span>
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
        userProfile={currentProfile}
        onSaveProfile={handleSaveProfile}
        isFinnish={isFinnish}
      />

      <SharePledgeModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        userProfile={currentProfile}
        isFinnish={isFinnish}
      />
    </div>
  );
}
