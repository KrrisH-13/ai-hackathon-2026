import React, { useState } from 'react';
import {
  User,
  Sliders,
  TrendingUp,
  Award,
  Gift,
  BookmarkCheck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Pause,
  Play,
  ArrowRight,
  Database,
  Calculator,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { EcoPilotUserProfile, SavedGoal, EcoCreditTransaction } from '../types/user';
import { Season } from '../types/climate';
import { ProgressView } from './ProgressView';
import { RewardsAndImpactView } from './RewardsAndImpactView';
import { getUserRewardStatus } from '../rewards/rewardsEngine';
import { ContextualWhatIfModal } from './ContextualWhatIfModal';
import { getCurrentObservationSnapshot } from '../services/ecoPilotService';

export type MeSubTab =
  | 'profile'
  | 'preferences'
  | 'progress'
  | 'ecocredits'
  | 'rewards'
  | 'saved-goals'
  | 'privacy';

interface MeHubViewProps {
  userProfile: EcoPilotUserProfile;
  currentSeason: Season;
  isFinnish: boolean;
  initialSubTab?: MeSubTab;
  onUpdateProfile: (updated: EcoPilotUserProfile) => void;
  onResetToAlex: () => void;
  onOpenProfileCustomizer: () => void;
  onOpenPreferenceExtractor: () => void;
  onOpenDataSources: () => void;
  onOpenCalculationEngine: () => void;
  onNavigateToToday: () => void;
  onSaveGoal?: (goal: SavedGoal) => void;
  onOpenAskAssistant?: (query?: string, title?: string) => void;
}

export const MeHubView: React.FC<MeHubViewProps> = ({
  userProfile,
  currentSeason,
  isFinnish,
  initialSubTab = 'profile',
  onUpdateProfile,
  onResetToAlex,
  onOpenProfileCustomizer,
  onOpenPreferenceExtractor,
  onOpenDataSources,
  onOpenCalculationEngine,
  onNavigateToToday,
  onSaveGoal,
  onOpenAskAssistant,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<MeSubTab>(initialSubTab);
  const [useEnergyInfo, setUseEnergyInfo] = useState<boolean>(true);
  const [pauseAiLearning, setPauseAiLearning] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false);

  const rewardStatus = getUserRewardStatus(userProfile);
  const observation = getCurrentObservationSnapshot(currentSeason || 'winter', 21);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleGoalPause = (goalId: string) => {
    const existing = userProfile.savedGoals || [];
    const updated = existing.map((g) => {
      if (g.id === goalId) {
        return { ...g, scenario: g.scenario.includes('[PAUSED]') ? g.scenario.replace('[PAUSED] ', '') : `[PAUSED] ${g.scenario}` };
      }
      return g;
    });
    onUpdateProfile({ ...userProfile, savedGoals: updated });
    showToast(isFinnish ? 'Tavoitteen tila päivitetty.' : 'Goal status updated.');
  };

  const handleDeleteGoal = (goalId: string) => {
    const existing = userProfile.savedGoals || [];
    const updated = existing.filter((g) => g.id !== goalId);
    onUpdateProfile({ ...userProfile, savedGoals: updated });
    showToast(isFinnish ? 'Tavoite poistettu.' : 'Goal removed.');
  };

  const handleResetPreferences = () => {
    const updated: EcoPilotUserProfile = {
      ...userProfile,
      canChange: ['EV charging', 'dishwasher', 'laundry'],
      cannotChange: ['renting_no_renovations'],
      categoryStats: {
        'EV charging': { accepted: 8, rejected: 1 },
        'Heating': { accepted: 0, rejected: 5 },
        'Dishwasher': { accepted: 5, rejected: 1 },
      },
    };
    onUpdateProfile(updated);
    showToast(isFinnish ? 'Joustavuusasetukset palautettu oletuksiin.' : 'Preferences reset to defaults.');
  };

  // Sub-Navigation Tabs inside ME
  const meNavItems: Array<{ id: MeSubTab; label: string; labelFi: string; icon: any; badge?: string }> = [
    { id: 'profile', label: 'Profile', labelFi: 'Profiili', icon: User },
    { id: 'preferences', label: 'Preferences & AI', labelFi: 'Säännöt & AI', icon: Sliders },
    { id: 'progress', label: 'Progress', labelFi: 'Edistyminen', icon: TrendingUp },
    { id: 'ecocredits', label: 'EcoCredits', labelFi: 'EcoCredits', icon: Award, badge: `${userProfile.ecoCredits} pts` },
    { id: 'rewards', label: 'Rewards & Impact', labelFi: 'Palkinnot', icon: Gift },
    { id: 'saved-goals', label: 'Saved Goals', labelFi: 'Tavoitteet', icon: BookmarkCheck, badge: `${userProfile.savedGoals?.length || 0}` },
    { id: 'privacy', label: 'Privacy & Data', labelFi: 'Tietosuoja', icon: ShieldCheck },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. ME Header: Profile Summary Card */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-xl shadow-xs">
            {userProfile.name.charAt(0)}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {userProfile.name}
              </h1>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {userProfile.district || 'Espoo'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {userProfile.housingType} • {userProfile.heatingSystem.split('(')[0]} • {userProfile.householdSize} {isFinnish ? 'henkilöä' : 'people'}
            </p>
          </div>
        </div>

        {/* Quick actions: Reset Demo + EcoCredits summary */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <div
            onClick={() => setActiveSubTab('ecocredits')}
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <span>🌱</span>
            <span className="font-extrabold">{userProfile.ecoCredits}</span>
            <span className="text-[10px] text-amber-700">EcoCredits</span>
          </div>

          <button
            type="button"
            onClick={onResetToAlex}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5"
            title="Reset synthetic demo user Alex"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>{isFinnish ? 'Palauta Alex' : 'Reset Alex'}</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
        {meNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSubTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSubTab(item.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap border ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{isFinnish ? item.labelFi : item.label}</span>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-emerald-400 text-slate-950' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Sub-View Content */}

      {/* SUB-VIEW 1: PROFILE */}
      {activeSubTab === 'profile' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900">
                  {isFinnish ? 'Arjen profiili & Asumis- ja liikkumistiedot' : 'Lifestyle, Housing & Transport Profile'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isFinnish
                    ? 'EcoPilot räätälöi yhden toimen kerrallaan asuinpaikkasi, kotisi ja työmatkasi pohjalta.'
                    : 'EcoPilot tailors one realistic recommendation at a time based on where and how you live.'}
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenProfileCustomizer}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isFinnish ? 'Muokkaa arkitietoja' : 'Edit Profile & Constraints'}</span>
              </button>
            </div>

            {/* 4 Profile Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. About My Lifestyle */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                    📍 1. About My Lifestyle
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    {userProfile.municipality || 'Espoo'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Location</span>
                    <span className="font-bold text-slate-800">{userProfile.neighborhood || 'Tapiola'}, {userProfile.municipality || 'Espoo'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Household Size</span>
                    <span className="font-bold text-slate-800">{userProfile.householdSize || 2} people</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Dietary Preference</span>
                    <span className="font-bold text-slate-800 capitalize">{userProfile.dietPreference || 'Flexitarian'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Location Privacy</span>
                    <span className="font-bold text-slate-800">Coarse (No GPS)</span>
                  </div>
                </div>
              </div>

              {/* 2. Housing Profile */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                    🏠 2. Housing & Heating
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {userProfile.housingTypeCategory || 'Apartment'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Living Area</span>
                    <span className="font-bold text-slate-800">{userProfile.livingAreaSqM || 72} m²</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Heating System</span>
                    <span className="font-bold text-slate-800">{userProfile.heatingTypeDetail || 'District heating'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Controls Heating</span>
                    <span className="font-bold text-slate-800">{userProfile.controlsHeating || 'No (Taloyhtiö automated)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Electricity Contract</span>
                    <span className="font-bold text-slate-800">Hourly Spot (Nord Pool)</span>
                  </div>
                </div>
              </div>

              {/* 3. Transport Profile */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                    🚗 3. Transport & Car
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    {userProfile.carOwnership || 'Petrol'} car
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Primary Transport</span>
                    <span className="font-bold text-slate-800">{userProfile.primaryTransport || 'Mixed (Car + HSL)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Car Ownership</span>
                    <span className="font-bold text-slate-800">{userProfile.carOwnership || 'Petrol'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Public Transit Use</span>
                    <span className="font-bold text-slate-800">{userProfile.publicTransportUsage || '3–4 days/week'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Cycling & Walking</span>
                    <span className="font-bold text-slate-800">{userProfile.cyclingFrequency || 'Sometimes'} / Frequent</span>
                  </div>
                </div>
              </div>

              {/* 4. Commute Profile */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                    🚆 4. Commute Profile
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    {userProfile.commuteDistanceKm || 12} km one-way
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Route</span>
                    <span className="font-bold text-slate-800">{userProfile.commuteOrigin || 'Tapiola'} → {userProfile.commuteDestination || 'Otaniemi / Keilaniemi Innovation Hub'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Commute Frequency</span>
                    <span className="font-bold text-slate-800">{userProfile.commuteDaysPerWeek || 4} days/week</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Car Occupancy</span>
                    <span className="font-bold text-slate-800">{userProfile.carOccupancy || 1} person (Solo)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-4">
              <span>
                {isFinnish
                  ? '🔒 Yksityisyyslupaus: EcoPilot ei kerää tarkkoja GPS-tietoja tai yhteystietoja.'
                  : '🔒 Privacy Notice: EcoPilot uses coarse municipality & commute distance with zero contact harvesting.'}
              </span>
              <button
                type="button"
                onClick={() => setActiveSubTab('privacy')}
                className="font-bold underline underline-offset-2 shrink-0"
              >
                {isFinnish ? 'Lue lisää' : 'Learn more'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: PREFERENCES */}
      {activeSubTab === 'preferences' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900">
                  {isFinnish ? 'Opitut säännöt & arjen rajoitteet' : 'Learned Preferences & AI Rules'}
                </h2>
                <p className="text-xs text-slate-500 max-w-xl">
                  {isFinnish
                    ? 'EcoPilot käyttää näitä sääntöjä välttääkseen suosituksia, jotka eivät sovi arkeesi.'
                    : 'EcoPilot uses these preferences to avoid recommending actions that don’t fit your life.'}
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenPreferenceExtractor}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                <span>{isFinnish ? 'Puhu tekoälylle rajoitteesi' : 'Extract from Natural Language'}</span>
              </button>
            </div>

            {/* Rules Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-950 block">✓ EV Charging</span>
                  <span className="text-[11px] text-emerald-700">Flexible window (after 21:00)</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-200/80 text-emerald-900">
                  Flexible
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-950 block">✓ Dishwasher & Laundry</span>
                  <span className="text-[11px] text-emerald-700">Flexible delay timer</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-200/80 text-emerald-900">
                  Flexible
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-rose-950 block">✕ Room Heating Setback</span>
                  <span className="text-[11px] text-rose-700">Comfort priority (no aggressive cutbacks)</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-rose-200/80 text-rose-900">
                  Protected
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-rose-950 block">✕ Morning Commute Routine</span>
                  <span className="text-[11px] text-rose-700">Protected schedule & daycare drop-off</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-rose-200/80 text-rose-900">
                  Protected
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleResetPreferences}
                className="text-xs text-slate-500 hover:text-slate-900 font-bold underline underline-offset-2 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isFinnish ? 'Palauta säännöt oletuksiin' : 'Reset learned rules to defaults'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: PROGRESS */}
      {activeSubTab === 'progress' && (
        <div className="animate-fadeIn">
          <ProgressView
            userProfile={userProfile}
            isFinnish={isFinnish}
            onOpenPreferences={onOpenProfileCustomizer}
            onOpenRewards={() => setActiveSubTab('rewards')}
            onSaveGoal={onSaveGoal}
            onOpenAskAssistant={onOpenAskAssistant}
          />
        </div>
      )}

      {/* SUB-VIEW 4: ECOCREDITS */}
      {activeSubTab === 'ecocredits' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Balance Hero Card */}
          <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white p-6 sm:p-8 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-white/20 text-amber-100 border border-white/20">
                  {isFinnish ? 'PROTOTYYPPIN SALDO' : 'PROTOTYPE BALANCE'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl sm:text-5xl font-black font-mono">
                    🌱 {userProfile.ecoCredits}
                  </span>
                  <span className="text-lg font-bold text-amber-100">EcoCredits</span>
                </div>
                <p className="text-xs text-amber-100/90 max-w-md">
                  {isFinnish
                    ? `Taso: ${rewardStatus.currentTier.tierName} • Seuraavaan tasoon: ${rewardStatus.creditsToNext} pts`
                    : `Current Tier: ${rewardStatus.currentTier.tierName} • ${rewardStatus.creditsToNext} pts to next tier`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveSubTab('rewards')}
                className="px-5 py-3 rounded-2xl bg-white text-slate-900 font-extrabold text-xs transition hover:bg-amber-50 flex items-center gap-2 shadow-xs shrink-0 self-start sm:self-auto"
              >
                <Gift className="w-4 h-4 text-amber-600" />
                <span>{isFinnish ? 'Avaa Palkinnot' : 'Explore Rewards'}</span>
              </button>
            </div>
          </div>

          {/* EcoCredits Deterministic Formula Card */}
          <div className="rounded-3xl bg-amber-50 border border-amber-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📐</span>
              <h3 className="text-sm font-black text-amber-950">
                {isFinnish ? 'EcoCredits Päästölaskentakaava & Luotettavuustasot' : 'EcoCredits Calculation Engine & Confidence Scaling'}
              </h3>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              {isFinnish
                ? 'Pisteet lasketaan suoraan vältetyn hiilidioksidin pohjalta ilman keksittyjä numeroita: 1 EcoCredit per 0,1 kg CO₂e (10 pistettä per 1,0 kg CO₂e). Enimmäispalkkio on 50 pistettä per yksittäinen toimi taloudellisen kestävyyden takaamiseksi.'
                : 'EcoCredits are derived deterministically from verified or estimated CO₂e reduction: 1 EcoCredit per 0.1 kg CO₂e avoided (10 pts per 1.0 kg CO₂e). Capped at 50 pts per single action.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-white border border-amber-200 space-y-0.5">
                <span className="font-bold text-slate-900 block text-[11px]">HIGH Confidence (1.0×)</span>
                <span className="text-[10px] text-slate-600">Direct distance / smart meter data (100% credits awarded)</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-amber-200 space-y-0.5">
                <span className="font-bold text-slate-900 block text-[11px]">MEDIUM Confidence (0.7×)</span>
                <span className="text-[10px] text-slate-600">Profile-based regional averages (70% credits awarded)</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-amber-200 space-y-0.5">
                <span className="font-bold text-slate-900 block text-[11px]">LOW Confidence (0.0×)</span>
                <span className="text-[10px] text-slate-600">Rough estimate (credits withheld to maintain credibility)</span>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>{isFinnish ? 'Tapahtumaloki (EcoCredits Ledger)' : 'Recent EcoCredits Ledger & Impact'}</span>
              <span className="text-xs text-slate-400 font-normal">{userProfile.ecoCreditTransactions?.length || 0} entries</span>
            </h3>

            <div className="divide-y divide-slate-100 text-xs">
              {userProfile.ecoCreditTransactions && userProfile.ecoCreditTransactions.length > 0 ? (
                userProfile.ecoCreditTransactions.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900">
                        {isFinnish && tx.titleFi ? tx.titleFi : tx.title}
                      </p>
                      <span className="text-[11px] text-slate-400">
                        {tx.dateLabel} • {tx.category} {tx.co2SavedKg ? `(↓ ${tx.co2SavedKg} kg CO₂e)` : ''}
                      </span>
                    </div>
                    <span className="text-sm font-extrabold text-emerald-600 font-mono">
                      +{tx.amount} pts
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-slate-400">No transactions recorded yet.</div>
              )}
            </div>
          </div>

          {/* EcoCredits Legal Disclaimer */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <span className="font-bold block text-slate-900">
              {isFinnish ? 'ℹ️ Prototyyppihuomautus:' : 'ℹ️ Prototype Disclaimer:'}
            </span>
            <p className="leading-relaxed text-[11px] text-slate-500">
              {isFinnish
                ? 'EcoCredits ovat prototyyppipisteitä, jotka perustuvat arvioituun ilmastovaikutukseen. Ne eivät ole virallisia hiilikrediittejä, kompensointiyksiköitä tai rahallista arvoa.'
                : 'EcoCredits are prototype reward points based on estimated impact. They are not verified carbon credits, offsets or monetary value.'}
            </p>
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: REWARDS & IMPACT */}
      {activeSubTab === 'rewards' && (
        <div className="animate-fadeIn">
          <RewardsAndImpactView
            userProfile={userProfile}
            isFinnish={isFinnish}
            onUpdateProfile={onUpdateProfile}
            onResetToAlex={onResetToAlex}
            onOpenDataSources={onOpenDataSources}
            onOpenCalculationEngine={onOpenCalculationEngine}
            onNavigateToToday={onNavigateToToday}
            onSaveGoal={onSaveGoal}
            onOpenAskAssistant={onOpenAskAssistant}
          />
        </div>
      )}

      {/* SUB-VIEW 6: SAVED GOALS */}
      {activeSubTab === 'saved-goals' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900">
                  {isFinnish ? 'Omat Tallennetut Tavoitteet' : 'My Saved What-If Goals'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isFinnish
                    ? 'Simulaatioista ja arjen valinnoista tallentamasi ilmastolupaukset.'
                    : 'Personal action pledges saved from What-If simulators across EcoPilot.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsWhatIfOpen(true)}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs self-start sm:self-auto shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isFinnish ? 'Luo Uusi Tavoite' : 'New What-If Goal'}</span>
              </button>
            </div>

            {/* List of Goals */}
            {userProfile.savedGoals && userProfile.savedGoals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userProfile.savedGoals.map((goal) => {
                  const isPaused = goal.scenario.includes('[PAUSED]');
                  return (
                    <div
                      key={goal.id}
                      className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 ${
                        isPaused ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-purple-200 shadow-xs'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            {goal.category}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(goal.savedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900">
                          {isFinnish && goal.titleFi ? goal.titleFi : goal.title}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {goal.scenario}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-emerald-700 font-mono">
                            -{goal.estimatedCo2KgMonth} kg CO₂ / kk
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            ~€{goal.estimatedEurMonth.toFixed(1)} säästö
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleGoalPause(goal.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                            title={isPaused ? 'Resume goal' : 'Pause goal'}
                          >
                            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                            title="Delete goal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-3">
                <BookmarkCheck className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {isFinnish
                    ? 'Ei vielä tallennettuja tavoitteita. Kokeile [🔮 Mitä jos?] -simulaattoria ja tallenna sinulle sopivia arkitapoja!'
                    : 'No saved goals yet. Explore the [🔮 What if?] simulator to project and save routines that fit your lifestyle!'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 7: PRIVACY & RESPONSIBLE AI */}
      {activeSubTab === 'privacy' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {isFinnish ? 'Yksityisyys & Vastuullinen Tekoäly' : 'Responsible AI & Privacy Boundaries'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isFinnish ? 'Tiukat pohjoismaiset tietosuojakriteerit. Ei henkilöseurantaa.' : 'Strict Nordic privacy principles. Zero personal surveillance.'}
                </p>
              </div>
            </div>

            {/* Privacy Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{isFinnish ? 'Mitä EcoPilot käyttää:' : 'What EcoPilot Uses:'}</span>
                </span>
                <ul className="space-y-1.5 text-slate-700">
                  <li>✓ Asuntotyyppi & ilmoitetut arjen mieltymykset</li>
                  <li>✓ Fingridin & Nord Poolin avoin kantaverkkodata</li>
                  <li>✓ Antamasi palaute (`[DO IT]`, `[NOT TODAY]`)</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-slate-400" />
                  <span>{isFinnish ? 'Mitä EcoPilot EI KOSKAAN tarvitse:' : 'What EcoPilot NEVER Needs:'}</span>
                </span>
                <ul className="space-y-1.5 text-slate-600">
                  <li>✕ Puhelinnumerot, osoitekirja tai kontaktit</li>
                  <li>✕ Yksityisviestit tai sähköpostit</li>
                  <li>✕ Jatkuva tausta-GPS-seuranta</li>
                </ul>
              </div>
            </div>

            {/* Toggle Controls */}
            <div className="divide-y divide-slate-100 pt-2">
              <div className="py-3 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-slate-900 block">
                    {isFinnish ? 'Pörssisähkön ja kantaverkkotiedon hyödyntäminen' : 'Spot Energy & Grid Telemetry'}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {isFinnish ? 'Mahdollistaa säästölaskelmat ja tuulivoimahuiput.' : 'Enables deterministic € savings and wind peak scheduling.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUseEnergyInfo(!useEnergyInfo);
                    showToast(useEnergyInfo ? 'Energy data paused' : 'Energy data active');
                  }}
                  className={`w-11 h-6 rounded-full transition relative ${
                    useEnergyInfo ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      useEnergyInfo ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-slate-900 block">
                    {isFinnish ? 'Tauota tekoälyn oppiminen' : 'Pause AI Rule Learning'}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {isFinnish ? 'Hylkäykset eivät muuta sääntöjäsi tauon aikana.' : 'Rejections will not update your flexibility rules while paused.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPauseAiLearning(!pauseAiLearning);
                    showToast(pauseAiLearning ? 'Learning resumed' : 'Learning paused');
                  }}
                  className={`w-11 h-6 rounded-full transition relative ${
                    pauseAiLearning ? 'bg-amber-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      pauseAiLearning ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Transparency links */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-bold text-slate-800">
                {isFinnish ? 'Avoimen datan & laskennan auditointi:' : 'Audit Open Data & Math Engine:'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenDataSources}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold transition shadow-xs"
                >
                  {isFinnish ? 'Tietolähteet' : 'Data APIs'}
                </button>
                <button
                  type="button"
                  onClick={onOpenCalculationEngine}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold transition shadow-xs"
                >
                  {isFinnish ? 'Laskentakaavat' : 'Formulas'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded What-If Modal for Goals */}
      <ContextualWhatIfModal
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
        context="weekly"
        userProfile={userProfile}
        observation={observation}
        onSaveGoal={(g) => {
          if (onSaveGoal) onSaveGoal(g);
          showToast(isFinnish ? 'Uusi tavoite lisätty!' : 'New goal added!');
        }}
        onOpenAskAssistant={onOpenAskAssistant}
        isFinnish={isFinnish}
      />
    </div>
  );
};
