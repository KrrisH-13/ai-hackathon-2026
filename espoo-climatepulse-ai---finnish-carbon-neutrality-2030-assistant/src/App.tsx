import React, { useState } from 'react';
import { UserProfile, Season } from './types/climate';
import { DEFAULT_PROFILES } from './data/espooData';
import { Navbar } from './components/Navbar';
import { AiClimateCopilotView } from './components/AiClimateCopilotView';
import { NordPoolEnergyOptimizerView } from './components/NordPoolEnergyOptimizerView';
import { HsyRecyclingScannerView } from './components/HsyRecyclingScannerView';
import { HslTransitCommuteView } from './components/HslTransitCommuteView';
import { EspooClimateWatch2030View } from './components/EspooClimateWatch2030View';
import { PersonalRoadmapSprintView } from './components/PersonalRoadmapSprintView';
import { ProfileCustomizerModal } from './components/ProfileCustomizerModal';
import { SharePledgeModal } from './components/SharePledgeModal';

export default function App() {
  const [profiles, setProfiles] = useState<UserProfile[]>(DEFAULT_PROFILES);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    DEFAULT_PROFILES[0].id
  );
  const [currentTab, setCurrentTab] = useState<
    'chat' | 'energy' | 'recycling' | 'transit' | 'roadmap' | 'personal'
  >('chat');
  const [currentSeason, setCurrentSeason] = useState<Season>('winter');
  const [isFinnish, setIsFinnish] = useState<boolean>(false);

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  const currentProfile =
    profiles.find((p) => p.id === selectedProfileId) || profiles[0];

  const handleSaveProfile = (updated: UserProfile) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Top Main Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        userProfile={currentProfile}
        allProfiles={profiles}
        onSelectProfile={setSelectedProfileId}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        currentSeason={currentSeason}
        onSelectSeason={setCurrentSeason}
        isFinnish={isFinnish}
        onToggleLanguage={() => setIsFinnish((prev) => !prev)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {currentTab === 'chat' && (
          <AiClimateCopilotView
            userProfile={currentProfile}
            currentSeason={currentSeason}
            isFinnish={isFinnish}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'energy' && (
          <NordPoolEnergyOptimizerView
            userProfile={currentProfile}
            currentSeason={currentSeason}
            isFinnish={isFinnish}
          />
        )}

        {currentTab === 'recycling' && (
          <HsyRecyclingScannerView isFinnish={isFinnish} />
        )}

        {currentTab === 'transit' && (
          <HslTransitCommuteView isFinnish={isFinnish} />
        )}

        {currentTab === 'roadmap' && (
          <EspooClimateWatch2030View isFinnish={isFinnish} />
        )}

        {currentTab === 'personal' && (
          <PersonalRoadmapSprintView
            userProfile={currentProfile}
            currentSeason={currentSeason}
            isFinnish={isFinnish}
            onOpenShareModal={() => setIsShareModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
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
                ? 'Hiilineutraali Espoo 2030 -tiekartan ja Ilmastovahdin asukaspalvelu'
                : 'Citizen Copilot for the Carbon-Neutral Espoo 2030 Roadmap'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-600 font-semibold">
            <a
              href="https://ilmastovahti.espoo.fi"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-700 transition"
            >
              Ilmastovahti.espoo.fi
            </a>
            <span>•</span>
            <a
              href="https://www.hsy.fi/jateopas"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-700 transition"
            >
              HSY Jäteopas
            </a>
            <span>•</span>
            <a
              href="https://www.hsl.fi"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-700 transition"
            >
              HSL Reittiopas
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
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
