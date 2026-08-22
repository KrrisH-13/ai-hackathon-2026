/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Season } from './types/climate';
import { EcoPilotUserProfile, SavedGoal } from './types/user';
import { INITIAL_PROFILES } from './user/userContext';
import { Navbar, AppTab } from './components/Navbar';
import { TodayDashboardView } from './components/TodayDashboardView';
import { ToolsCatalogView } from './components/ToolsCatalogView';
import { AskEcoPilotView } from './components/AskEcoPilotView';
import { MeHubView, MeSubTab } from './components/MeHubView';

// Dedicated Tool Views
import { GreenWindowToolView } from './components/GreenWindowToolView';
import { ReceiptScannerToolView } from './components/ReceiptScannerToolView';
import { WhatIfToolView } from './components/WhatIfToolView';
import { HslTransitCommuteView } from './components/HslTransitCommuteView';
import { HsyRecyclingScannerView } from './components/HsyRecyclingScannerView';
import { NordPoolEnergyOptimizerView } from './components/NordPoolEnergyOptimizerView';
import { EspooClimateWatch2030View } from './components/EspooClimateWatch2030View';
import { EcoPilotLoopView } from './components/EcoPilotLoopView';

// Modals and drawers
import { ProfileCustomizerModal } from './components/ProfileCustomizerModal';
import { SharePledgeModal } from './components/SharePledgeModal';
import { DataSourcesDrawer } from './components/DataSourcesDrawer';
import { CalculationEngineModal } from './components/CalculationEngineModal';
import { AskEcoPilotDrawer } from './components/AskEcoPilotDrawer';
import { PreferenceExtractorModal } from './components/PreferenceExtractorModal';
import { getCurrentObservationSnapshot } from './services/ecoPilotService';
import { ECO_TOOLS_REGISTRY } from './tools/toolsRegistry';

export default function App() {
  const [profiles, setProfiles] = useState<EcoPilotUserProfile[]>(INITIAL_PROFILES);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(INITIAL_PROFILES[0].id);
  const [currentSeason, setCurrentSeason] = useState<Season>('winter');
  const [currentTab, setCurrentTab] = useState<AppTab>('today');
  const [isFinnish, setIsFinnish] = useState<boolean>(false);

  // Sub-navigation states
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [meSubSection, setMeSubSection] = useState<MeSubTab>('profile');

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isDataSourcesOpen, setIsDataSourcesOpen] = useState<boolean>(false);
  const [isCalculationEngineOpen, setIsCalculationEngineOpen] = useState<boolean>(false);
  const [isAskEcoPilotDrawerOpen, setIsAskEcoPilotDrawerOpen] = useState<boolean>(false);
  const [askEcoPilotQuery, setAskEcoPilotQuery] = useState<string>('');
  const [isPreferenceExtractorOpen, setIsPreferenceExtractorOpen] = useState<boolean>(false);

  const activeProfile = profiles.find((p) => p.id === selectedProfileId) || profiles[0];

  const handleUpdateProfile = (updated: EcoPilotUserProfile) => {
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleSaveGoal = (goal: SavedGoal) => {
    const existing = activeProfile.savedGoals || [];
    const updatedGoals = [goal, ...existing.filter((g) => g.id !== goal.id)];
    handleUpdateProfile({
      ...activeProfile,
      savedGoals: updatedGoals,
    });
  };

  const handleOpenAskAssistant = (initialQuery?: string, title?: string) => {
    if (initialQuery) {
      setAskEcoPilotQuery(initialQuery);
    }
    // Navigate directly to the primary "Ask EcoPilot" tab for an immersive experience
    setCurrentTab('ask');
  };

  // 1-Click Reset for Hackathon Demo Mode
  const handleResetToAlex = () => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === 'user-alex' ? { ...INITIAL_PROFILES[0] } : p))
    );
    setSelectedProfileId('user-alex');
    setCurrentTab('today');
    setActiveToolId(null);
    setMeSubSection('profile');
  };

  const handleSelectTab = (tab: AppTab) => {
    setCurrentTab(tab);
    if (tab !== 'tools') {
      setActiveToolId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col selection:bg-emerald-500 selection:text-white relative overflow-x-hidden">
      {/* Subtle ambient light accents */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Navigation: [ 1. TODAY | 2. TOOLS | 3. ASK ECOPILOT | 4. ME ] */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        userProfile={activeProfile}
        allProfiles={profiles}
        onSelectProfile={setSelectedProfileId}
        onResetToAlex={handleResetToAlex}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        currentSeason={currentSeason}
        onSelectSeason={setCurrentSeason}
        isFinnish={isFinnish}
        onToggleLanguage={() => setIsFinnish(!isFinnish)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenDataSources={() => setIsDataSourcesOpen(true)}
        onOpenCalculationEngine={() => setIsCalculationEngineOpen(true)}
        onOpenAskEcoPilot={() => {
          setAskEcoPilotQuery('');
          setCurrentTab('ask');
        }}
        onOpenPreferenceExtractor={() => setIsPreferenceExtractorOpen(true)}
      />

      {/* Main Active Tab Content */}
      <main className="flex-1 pb-20 sm:pb-16 relative z-10">
        {/* 1. TODAY */}
        {currentTab === 'today' && (
          <TodayDashboardView
            userProfile={activeProfile}
            isFinnish={isFinnish}
            onUpdateProfile={handleUpdateProfile}
            onOpenDataSources={() => setIsDataSourcesOpen(true)}
            onOpenCalculationEngine={() => setIsCalculationEngineOpen(true)}
            onOpenAskEcoPilot={() => {
              setAskEcoPilotQuery('');
              setCurrentTab('ask');
            }}
            onOpenProgress={() => {
              setCurrentTab('me');
              setMeSubSection('progress');
            }}
            onOpenRewards={() => {
              setCurrentTab('me');
              setMeSubSection('rewards');
            }}
            onSaveGoal={handleSaveGoal}
            onOpenReceiptScanner={() => {
              setCurrentTab('tools');
              setActiveToolId('receipt-scanner');
            }}
            onOpenAskAssistant={handleOpenAskAssistant}
          />
        )}

        {/* 2. TOOLS */}
        {currentTab === 'tools' && (
          <>
            {activeToolId === null && (
              <ToolsCatalogView
                userProfile={activeProfile}
                currentSeason={currentSeason}
                isFinnish={isFinnish}
                onOpenTool={(toolId) => setActiveToolId(toolId)}
                onOpenAskAssistant={handleOpenAskAssistant}
                onOpenDataSources={() => setIsDataSourcesOpen(true)}
                onOpenCalculationEngine={() => setIsCalculationEngineOpen(true)}
              />
            )}

            {activeToolId === 'green-window' && (
              <GreenWindowToolView
                userProfile={activeProfile}
                currentSeason={currentSeason}
                isFinnish={isFinnish}
                onBackToTools={() => setActiveToolId(null)}
                onSaveGoal={handleSaveGoal}
                onOpenAskAssistant={handleOpenAskAssistant}
              />
            )}

            {activeToolId === 'receipt-scanner' && (
              <ReceiptScannerToolView
                userProfile={activeProfile}
                currentSeason={currentSeason}
                isFinnish={isFinnish}
                onBackToTools={() => setActiveToolId(null)}
                onSaveGoal={handleSaveGoal}
                onOpenAskAssistant={handleOpenAskAssistant}
              />
            )}

            {activeToolId === 'what-if' && (
              <WhatIfToolView
                userProfile={activeProfile}
                currentSeason={currentSeason}
                isFinnish={isFinnish}
                onBackToTools={() => setActiveToolId(null)}
                onSaveGoal={handleSaveGoal}
                onOpenAskAssistant={handleOpenAskAssistant}
              />
            )}

            {activeToolId === 'transport' && (
              <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                <button
                  type="button"
                  onClick={() => setActiveToolId(null)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isFinnish ? '← Takaisin Työkaluihin' : '← Back to Tools'}</span>
                </button>
                <HslTransitCommuteView
                  isFinnish={isFinnish}
                  userProfile={activeProfile}
                  onSaveGoal={handleSaveGoal}
                  onOpenAskAssistant={handleOpenAskAssistant}
                />
              </div>
            )}

            {activeToolId === 'recycling' && (
              <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                <button
                  type="button"
                  onClick={() => setActiveToolId(null)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isFinnish ? '← Takaisin Työkaluihin' : '← Back to Tools'}</span>
                </button>
                <HsyRecyclingScannerView
                  isFinnish={isFinnish}
                  userProfile={activeProfile}
                  onSaveGoal={handleSaveGoal}
                  onOpenAskAssistant={handleOpenAskAssistant}
                />
              </div>
            )}

            {activeToolId === 'home-energy' && (
              <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                <button
                  type="button"
                  onClick={() => setActiveToolId(null)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isFinnish ? '← Takaisin Työkaluihin' : '← Back to Tools'}</span>
                </button>
                <NordPoolEnergyOptimizerView
                  userProfile={activeProfile}
                  currentSeason={currentSeason}
                  isFinnish={isFinnish}
                  onSaveGoal={handleSaveGoal}
                  onOpenAskAssistant={handleOpenAskAssistant}
                />
              </div>
            )}

            {activeToolId === 'espoo-2030' && (
              <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                <button
                  type="button"
                  onClick={() => setActiveToolId(null)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isFinnish ? '← Takaisin Työkaluihin' : '← Back to Tools'}</span>
                </button>
                <EspooClimateWatch2030View isFinnish={isFinnish} />
              </div>
            )}

            {activeToolId === 'ecopilot-loop' && (
              <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                <button
                  type="button"
                  onClick={() => setActiveToolId(null)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isFinnish ? '← Takaisin Työkaluihin' : '← Back to Tools'}</span>
                </button>
                <EcoPilotLoopView
                  userProfile={activeProfile}
                  currentSeason={currentSeason}
                  isFinnish={isFinnish}
                  onUpdateProfile={handleUpdateProfile}
                  onNavigateTab={(tab) => {
                    if (tab === 'today') setCurrentTab('today');
                    else if (tab === 'me') setCurrentTab('me');
                    else if (tab === 'chat') setCurrentTab('ask');
                  }}
                  onOpenDataSources={() => setIsDataSourcesOpen(true)}
                  onOpenCalculationEngine={() => setIsCalculationEngineOpen(true)}
                />
              </div>
            )}
          </>
        )}

        {/* 3. ASK ECOPILOT */}
        {currentTab === 'ask' && (
          <AskEcoPilotView
            userProfile={activeProfile}
            currentSeason={currentSeason}
            isFinnish={isFinnish}
            initialQuery={askEcoPilotQuery}
          />
        )}

        {/* 4. ME */}
        {currentTab === 'me' && (
          <MeHubView
            userProfile={activeProfile}
            currentSeason={currentSeason}
            isFinnish={isFinnish}
            initialSubTab={meSubSection}
            onUpdateProfile={handleUpdateProfile}
            onResetToAlex={handleResetToAlex}
            onOpenProfileCustomizer={() => setIsProfileModalOpen(true)}
            onOpenPreferenceExtractor={() => setIsPreferenceExtractorOpen(true)}
            onOpenDataSources={() => setIsDataSourcesOpen(true)}
            onOpenCalculationEngine={() => setIsCalculationEngineOpen(true)}
            onNavigateToToday={() => setCurrentTab('today')}
            onSaveGoal={handleSaveGoal}
            onOpenAskAssistant={handleOpenAskAssistant}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white text-slate-500 text-xs py-8 px-4 sm:px-8 border-t border-slate-200 mt-auto shadow-xs hidden sm:block">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              🌱
            </div>
            <span className="font-bold text-slate-900 tracking-tight">EcoPilot</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">
              {isFinnish
                ? 'Pohjoismaisen arjen älykäs tekoäly- ja ilmastokumppani'
                : 'AI Lifestyle Companion for Smarter Nordic Living'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium flex-wrap">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600">Hiilineutraali Espoo 2030</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600">HSY Kiertotalous (Avoin data)</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600">HSL Digitransit</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600">Fingrid Kantaverkko</span>
          </div>
        </div>
      </footer>

      {/* Modals and Drawers */}
      <ProfileCustomizerModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={activeProfile}
        onSaveProfile={handleUpdateProfile}
        isFinnish={isFinnish}
      />

      <SharePledgeModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        userProfile={activeProfile}
        isFinnish={isFinnish}
      />

      <DataSourcesDrawer
        isOpen={isDataSourcesOpen}
        onClose={() => setIsDataSourcesOpen(false)}
        isFinnish={isFinnish}
      />

      <CalculationEngineModal
        isOpen={isCalculationEngineOpen}
        onClose={() => setIsCalculationEngineOpen(false)}
        isFinnish={isFinnish}
      />

      <AskEcoPilotDrawer
        isOpen={isAskEcoPilotDrawerOpen}
        onClose={() => {
          setIsAskEcoPilotDrawerOpen(false);
          setAskEcoPilotQuery('');
        }}
        userProfile={activeProfile}
        observation={getCurrentObservationSnapshot(currentSeason, 21)}
        isFinnish={isFinnish}
        initialQuery={askEcoPilotQuery}
      />

      <PreferenceExtractorModal
        isOpen={isPreferenceExtractorOpen}
        onClose={() => setIsPreferenceExtractorOpen(false)}
        userProfile={activeProfile}
        onApplyPreferences={handleUpdateProfile}
        isFinnish={isFinnish}
      />
    </div>
  );
}
