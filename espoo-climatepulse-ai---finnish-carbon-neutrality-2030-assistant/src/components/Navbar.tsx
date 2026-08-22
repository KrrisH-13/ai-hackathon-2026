import React from 'react';
import {
  Sparkles,
  Sliders,
  Share2,
  Database,
  Calculator,
  MessageSquare,
  Wrench,
  User,
  RotateCcw,
  Sun,
  Snowflake,
  CloudSun,
  Leaf,
  Layers,
} from 'lucide-react';
import { Season } from '../types/climate';
import { EcoPilotUserProfile } from '../types/user';
import { getUserRewardStatus } from '../rewards/rewardsEngine';

export type AppTab = 'today' | 'tools' | 'ask' | 'me';

interface NavbarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  userProfile: EcoPilotUserProfile;
  allProfiles: EcoPilotUserProfile[];
  onSelectProfile: (id: string) => void;
  onResetToAlex: () => void;
  onOpenProfileModal: () => void;
  currentSeason: Season;
  onSelectSeason: (season: Season) => void;
  isFinnish: boolean;
  onToggleLanguage: () => void;
  onOpenShareModal: () => void;
  onOpenDataSources: () => void;
  onOpenCalculationEngine: () => void;
  onOpenAskEcoPilot: () => void;
  onOpenPreferenceExtractor: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  userProfile,
  allProfiles,
  onSelectProfile,
  onResetToAlex,
  onOpenProfileModal,
  currentSeason,
  onSelectSeason,
  isFinnish,
  onToggleLanguage,
  onOpenShareModal,
  onOpenDataSources,
  onOpenCalculationEngine,
}) => {
  const rewardStatus = getUserRewardStatus(userProfile);

  // The 4 Primary Navigation Tabs
  const primaryTabs: Array<{
    id: AppTab;
    label: string;
    labelFi: string;
    sublabel: string;
    sublabelFi: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'today',
      label: 'Today',
      labelFi: 'Tänään',
      sublabel: 'What should I do?',
      sublabelFi: 'Mitä tekisin tänään?',
      icon: <Sparkles className="w-4 h-4 text-emerald-500" />,
    },
    {
      id: 'tools',
      label: 'Tools',
      labelFi: 'Työkalut',
      sublabel: 'What can EcoPilot help with?',
      sublabelFi: 'Mihin EcoPilot voi auttaa?',
      icon: <Wrench className="w-4 h-4 text-blue-500" />,
    },
    {
      id: 'ask',
      label: 'Ask EcoPilot',
      labelFi: 'Kysy EcoPilotilta',
      sublabel: 'Let me ask',
      sublabelFi: 'Kysy vapaasti',
      icon: <MessageSquare className="w-4 h-4 text-purple-500" />,
    },
    {
      id: 'me',
      label: 'Me',
      labelFi: 'Minä',
      sublabel: 'What has EcoPilot learned?',
      sublabelFi: 'Mitä EcoPilot on oppinut?',
      icon: <User className="w-4 h-4 text-indigo-500" />,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          {/* Top row: Brand + Reset Alex Demo + Profile switch + Season + Credits + Quick Tools */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onSelectTab('today')}
                className="flex items-center gap-2.5 text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-600 group-hover:bg-emerald-700 flex items-center justify-center text-white font-black text-base shadow-xs transition">
                  🌱
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base tracking-tight text-slate-900">EcoPilot</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ESPOO
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 hidden sm:block">
                    {isFinnish ? 'Pohjoismainen arjen ilmastotekoäly' : 'Nordic AI Lifestyle Assistant'}
                  </p>
                </div>
              </button>
            </div>

            {/* Right controls: Demo Reset + Profile selector + EcoCredits + Quick Tools */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* 1-Click Hackathon Demo Reset Button */}
              <button
                type="button"
                onClick={onResetToAlex}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                title={isFinnish ? 'Palauta Alexin profiili ja esitystila' : 'Reset synthetic demo user Alex'}
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">{isFinnish ? 'Palauta Alex (Demo)' : 'Reset Demo (Alex)'}</span>
                <span className="sm:hidden">Reset</span>
              </button>

              {/* User Profile Selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
                <span className="text-slate-500 font-medium text-[11px] hidden md:inline">
                  {isFinnish ? 'Profiili:' : 'Profile:'}
                </span>
                <select
                  value={userProfile.id}
                  onChange={(e) => onSelectProfile(e.target.value)}
                  className="bg-transparent text-slate-900 font-bold text-xs focus:outline-none cursor-pointer"
                >
                  {allProfiles.map((p) => (
                    <option key={p.id} value={p.id} className="bg-white text-slate-900">
                      {p.name} ({p.neighborhood})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={onOpenProfileModal}
                  className="text-slate-400 hover:text-slate-700 ml-1 p-0.5 transition"
                  title={isFinnish ? 'Muokkaa rajoitteita ja profiilia' : 'Customize preferences & constraints'}
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Season Selector */}
              <div className="hidden lg:flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs">
                {(['winter', 'spring', 'summer', 'autumn'] as Season[]).map((s) => {
                  const isActive = currentSeason === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onSelectSeason(s)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition flex items-center gap-1 ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                      title={`Nordic Season: ${s}`}
                    >
                      {s === 'winter' && <Snowflake className="w-3 h-3 text-cyan-600" />}
                      {s === 'spring' && <CloudSun className="w-3 h-3 text-amber-600" />}
                      {s === 'summer' && <Sun className="w-3 h-3 text-amber-500" />}
                      {s === 'autumn' && <Leaf className="w-3 h-3 text-orange-600" />}
                      <span>{s}</span>
                    </button>
                  );
                })}
              </div>

              {/* EcoCredits Pill -> Takes to ME section */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold shadow-xs cursor-pointer transition"
                onClick={() => onSelectTab('me')}
                title={`${rewardStatus.currentTier.tierName} (${rewardStatus.disclaimer})`}
              >
                <span>{rewardStatus.currentTier.badge}</span>
                <span className="text-amber-800 font-extrabold">{userProfile.ecoCredits}</span>
                <span className="text-[10px] text-amber-600 font-medium hidden sm:inline">pts</span>
              </div>

              {/* Transparency Modals Quick Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onOpenDataSources}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs transition"
                  title={isFinnish ? 'Avoimet tietolähteet (Nord Pool, Fingrid, HSY, FMI)' : 'Public Data Sources'}
                >
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                </button>
                <button
                  type="button"
                  onClick={onOpenCalculationEngine}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs transition"
                  title={isFinnish ? 'Deterministinen laskentamoottori & Kaavat' : 'Deterministic Calculation Engine'}
                >
                  <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                </button>
                <button
                  type="button"
                  onClick={onOpenShareModal}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs transition"
                  title={isFinnish ? 'Jaa Espoon ilmastolupaus' : 'Share Climate Pledge'}
                >
                  <Share2 className="w-3.5 h-3.5 text-teal-600" />
                </button>
                {/* Language Switch */}
                <button
                  type="button"
                  onClick={onToggleLanguage}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 transition"
                >
                  {isFinnish ? 'EN' : 'FI'}
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Primary Navigation Row (4 Main Tabs) */}
          <nav className="hidden sm:flex items-center gap-2 pt-1 border-t border-slate-100">
            {primaryTabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 border ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tab.icon}
                  <span>{isFinnish ? tab.labelFi : tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar: [ 1. TODAY | 2. TOOLS | 3. ASK ECOPILOT | 4. ME ] */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg flex items-center justify-around">
        {primaryTabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl transition ${
                isActive ? 'text-slate-900 font-extrabold' : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition ${isActive ? 'bg-emerald-50 text-emerald-800' : ''}`}>
                {tab.icon}
              </div>
              <span className="text-[10px] leading-tight tracking-tight">
                {isFinnish ? tab.labelFi : tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};
