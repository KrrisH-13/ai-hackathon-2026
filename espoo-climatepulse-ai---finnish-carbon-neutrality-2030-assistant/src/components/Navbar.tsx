import React from 'react';
import {
  Sparkles,
  Zap,
  RotateCw,
  Compass,
  Building2,
  ThermometerSnowflake,
  Sun,
  Flame,
  CloudRain,
  Share2,
} from 'lucide-react';
import { UserProfile, Season } from '../types/climate';
import { SEASONAL_PRESETS } from '../data/espooData';

interface NavbarProps {
  currentTab: 'chat' | 'energy' | 'recycling' | 'transit' | 'roadmap' | 'personal';
  onSelectTab: (tab: 'chat' | 'energy' | 'recycling' | 'transit' | 'roadmap' | 'personal') => void;
  userProfile: UserProfile;
  allProfiles: UserProfile[];
  onSelectProfile: (id: string) => void;
  onOpenProfileModal: () => void;
  currentSeason: Season;
  onSelectSeason: (s: Season) => void;
  isFinnish: boolean;
  onToggleLanguage: () => void;
  onOpenShareModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  userProfile,
  allProfiles,
  onSelectProfile,
  onOpenProfileModal,
  currentSeason,
  onSelectSeason,
  isFinnish,
  onToggleLanguage,
  onOpenShareModal,
}) => {
  const seasonInfo = SEASONAL_PRESETS[currentSeason];

  const SeasonIcon = {
    winter: ThermometerSnowflake,
    spring: Sun,
    summer: Flame,
    autumn: CloudRain,
  }[currentSeason];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Banner / Municipal Roadmap Context */}
      <div className="bg-slate-900 text-white text-[11px] py-1.5 px-4 sm:px-8 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {isFinnish ? 'Hiilineutraali Espoo 2030' : 'Carbon-Neutral Espoo 2030'}
          </span>
          <span className="text-slate-300 hidden md:inline">
            {isFinnish
              ? 'Ilmastovahti: Kaukolämmön ja arjen päästövähennykset etenevät tavoiteaikataulussa (-68% 1990 tasosta)'
              : 'Climate Watch: District heating & resident daily decarbonization on track (-68% vs 1990 baseline)'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Season Switcher */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            {(['winter', 'spring', 'summer', 'autumn'] as Season[]).map((s) => (
              <button
                key={s}
                onClick={() => onSelectSeason(s)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition ${
                  currentSeason === s
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={isFinnish ? SEASONAL_PRESETS[s].nameFi : SEASONAL_PRESETS[s].nameEn}
              >
                {isFinnish
                  ? s === 'winter'
                    ? 'Talvi'
                    : s === 'spring'
                    ? 'Kevät'
                    : s === 'summer'
                    ? 'Kesä'
                    : 'Syys'
                  : s === 'winter'
                  ? 'Winter'
                  : s === 'spring'
                  ? 'Spring'
                  : s === 'summer'
                  ? 'Summer'
                  : 'Autumn'}
              </button>
            ))}
          </div>

          {/* Language Toggle */}
          <button
            onClick={onToggleLanguage}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 border border-slate-700 transition"
          >
            {isFinnish ? 'FI / EN' : 'EN / FI'}
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight leading-none">
                Kipinä <span className="text-emerald-600">Espoo AI</span>
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:inline">
                Gemini 3.7
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {isFinnish ? 'Arjen energia-, HSL- ja HSY-ilmastoapuri' : 'Finnish Living & 2030 Climate Copilot'}
            </p>
          </div>
        </div>

        {/* Tab Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => onSelectTab('chat')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              currentTab === 'chat'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isFinnish ? 'AI-Ilmastoapuri' : 'AI Copilot'}</span>
          </button>

          <button
            onClick={() => onSelectTab('energy')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              currentTab === 'energy'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>{isFinnish ? 'Pörssisähkö & Sauna' : 'Nord Pool & Energy'}</span>
          </button>

          <button
            onClick={() => onSelectTab('recycling')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              currentTab === 'recycling'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5 text-teal-600" />
            <span>{isFinnish ? 'HSY-Lajittelu' : 'HSY Recycling'}</span>
          </button>

          <button
            onClick={() => onSelectTab('transit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              currentTab === 'transit'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span>{isFinnish ? 'HSL & Matkat' : 'HSL Transit'}</span>
          </button>

          <button
            onClick={() => onSelectTab('roadmap')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              currentTab === 'roadmap'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isFinnish ? 'Ilmastovahti 2030' : 'Espoo 2030 Watch'}</span>
          </button>

          <button
            onClick={() => onSelectTab('personal')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              currentTab === 'personal'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{isFinnish ? 'Oma Ilmastopolku' : 'My 2030 Plan'}</span>
          </button>
        </nav>

        {/* Right Actions & Profile Quick Picker */}
        <div className="flex items-center gap-2">
          {/* Profile Dropdown */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1.5">
            <select
              value={userProfile.id}
              onChange={(e) => onSelectProfile(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {allProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.district.split(' ')[0]})
                </option>
              ))}
            </select>

            <button
              onClick={onOpenProfileModal}
              className="p-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-200 transition"
              title="Edit Finnish home profile"
            >
              ⚙️
            </button>
          </div>

          <button
            onClick={onOpenShareModal}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Export / Share Climate Commitment"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation */}
      <div className="lg:hidden flex items-center justify-start overflow-x-auto px-4 py-2 bg-slate-50 border-t border-slate-200 gap-1 scrollbar-none">
        <button
          onClick={() => onSelectTab('chat')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
            currentTab === 'chat' ? 'bg-emerald-600 text-white' : 'text-slate-600'
          }`}
        >
          {isFinnish ? 'AI-Apuri' : 'AI Copilot'}
        </button>
        <button
          onClick={() => onSelectTab('energy')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
            currentTab === 'energy' ? 'bg-emerald-600 text-white' : 'text-slate-600'
          }`}
        >
          {isFinnish ? 'Pörssisähkö & Sauna' : 'Nord Pool & Energy'}
        </button>
        <button
          onClick={() => onSelectTab('recycling')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
            currentTab === 'recycling' ? 'bg-emerald-600 text-white' : 'text-slate-600'
          }`}
        >
          {isFinnish ? 'HSY-Lajittelu' : 'HSY Recycling'}
        </button>
        <button
          onClick={() => onSelectTab('transit')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
            currentTab === 'transit' ? 'bg-emerald-600 text-white' : 'text-slate-600'
          }`}
        >
          {isFinnish ? 'HSL & Pikaratikka' : 'HSL Transit'}
        </button>
        <button
          onClick={() => onSelectTab('roadmap')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
            currentTab === 'roadmap' ? 'bg-emerald-600 text-white' : 'text-slate-600'
          }`}
        >
          {isFinnish ? 'Espoo 2030' : 'Espoo 2030 Watch'}
        </button>
        <button
          onClick={() => onSelectTab('personal')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
            currentTab === 'personal' ? 'bg-emerald-600 text-white' : 'text-slate-600'
          }`}
        >
          {isFinnish ? 'Oma Polku' : 'My 2030 Plan'}
        </button>
      </div>
    </header>
  );
};
