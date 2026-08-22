import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Lock,
  Sliders,
  RotateCcw,
  Sparkles,
  Database,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  AlertCircle,
  Brain,
  Zap,
} from 'lucide-react';
import { EcoPilotUserProfile } from '../types/user';
import { DataFreshnessBadge } from './DataFreshnessBadge';

interface MeViewProps {
  userProfile: EcoPilotUserProfile;
  isFinnish?: boolean;
  onUpdateProfile: (updated: EcoPilotUserProfile) => void;
  onResetToAlex: () => void;
  onOpenDataSources: () => void;
  onOpenCalculationEngine: () => void;
  onOpenProfileCustomizer: () => void;
}

export const MeView: React.FC<MeViewProps> = ({
  userProfile,
  isFinnish = false,
  onUpdateProfile,
  onResetToAlex,
  onOpenDataSources,
  onOpenCalculationEngine,
  onOpenProfileCustomizer,
}) => {
  const [useEnergyInfo, setUseEnergyInfo] = useState<boolean>(true);
  const [pauseAiLearning, setPauseAiLearning] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn text-slate-800">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              PROFILE & RESPONSIBLE AI
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isFinnish ? `Profiili & Tietosuoja` : `Me & Responsible AI`}
          </h2>
          <p className="text-xs text-slate-500">
            {isFinnish
              ? 'Täysi läpinäkyvyys tekoälyn oppimiseen, yksityisyyteen ja arjen parametreihin.'
              : 'Complete transparency over AI learning, privacy boundaries, and lifestyle settings.'}
          </p>
        </div>

        {/* 1-Click Alex Demo Reset Button */}
        <button
          onClick={onResetToAlex}
          className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition flex items-center gap-2 shadow-xs shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
          <span>{isFinnish ? 'Palauta Alex (Demo)' : 'Reset Demo Profile (Alex)'}</span>
        </button>
      </div>

      {/* 2. Synthetic User Card */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
              {userProfile.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{userProfile.name}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {userProfile.district}, Espoo
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {userProfile.housingType} • {userProfile.heatingSystem} • {userProfile.commuteHabit}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenProfileCustomizer}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isFinnish ? 'Muokkaa arkitietoja' : 'Edit Profile & Housing'}</span>
          </button>
        </div>

        {/* Current Learned Flexibility Rules */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 block">
            {isFinnish ? 'Nykyiset tekoälysäännöt:' : 'Current EcoPilot Learning Rules:'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <span className="font-semibold text-emerald-900">✓ EV Charging</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Flexible (after 21:00)
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <span className="font-semibold text-emerald-900">✓ Dishwasher</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Flexible (after 21:00)
              </span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between">
              <span className="font-semibold text-rose-900">✕ Room Heating</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                Protected (Comfort priority)
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-semibold text-slate-700">✓ Sauna Window</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                Weekends & Wind peaks
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleResetPreferences}
            className="text-xs text-slate-500 hover:text-slate-900 font-semibold underline underline-offset-2 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isFinnish ? 'Palauta säännöt oletuksiin' : 'Reset learned rules to defaults'}</span>
          </button>
        </div>
      </div>

      {/* 3. Responsible AI & Privacy Boundaries */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              {isFinnish ? 'YKSITYISYYS & TEKOÄLYN VASTUULLISUUS' : 'RESPONSIBLE AI & PRIVACY BOUNDARIES'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isFinnish ? 'EcoPilot toimii tiukkojen pohjoismaisten tietosuojaperiaatteiden mukaan.' : 'Strict Nordic privacy standards. Zero personal surveillance.'}
            </p>
          </div>
        </div>

        {/* Privacy Comparison: Uses vs Never Needs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
            <span className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{isFinnish ? 'Mitä EcoPilot käyttää:' : 'What EcoPilot Uses:'}</span>
            </span>
            <ul className="space-y-1.5 text-slate-700">
              <li className="flex items-center gap-1.5">✓ User-stated lifestyle preferences</li>
              <li className="flex items-center gap-1.5">✓ Optional spot price / energy context</li>
              <li className="flex items-center gap-1.5">✓ Direct feedback (`[DO IT]`, `[NOT TODAY]`)</li>
              <li className="flex items-center gap-1.5">✓ Public environmental & transit open data</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-slate-400" />
              <span>{isFinnish ? 'Mitä EcoPilot EI KOSKAAN tarvitse:' : 'What EcoPilot NEVER Needs:'}</span>
            </span>
            <ul className="space-y-1.5 text-slate-600">
              <li className="flex items-center gap-1.5">✕ Contacts, address book or phonebook</li>
              <li className="flex items-center gap-1.5">✕ Private chats, emails or text messages</li>
              <li className="flex items-center gap-1.5">✕ Continuous background GPS tracking</li>
              <li className="flex items-center gap-1.5">✕ Unnecessary personal identifiable information</li>
            </ul>
          </div>
        </div>

        {/* Consent & AI Controls */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold text-slate-700 block">
            {isFinnish ? 'Tekoälyn ja tietojen hallintakytkimet:' : 'AI & Data Controls:'}
          </span>

          <div className="divide-y divide-slate-100">
            {/* Toggle 1: Use energy info */}
            <div className="py-3 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-semibold text-xs text-slate-900 block">
                  {isFinnish ? 'Käytä pörssisähkön hintatietoja' : 'Use spot energy & grid information'}
                </span>
                <p className="text-[11px] text-slate-500">
                  {isFinnish
                    ? 'Mahdollistaa sähkön hintalaskelmat ja tuulivoimahuippujen hyödyntämisen.'
                    : 'Enables deterministic € savings and clean wind energy peak timing.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUseEnergyInfo(!useEnergyInfo);
                  showToast(useEnergyInfo ? 'Energy context disabled' : 'Energy context enabled');
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

            {/* Toggle 2: Pause AI learning */}
            <div className="py-3 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-semibold text-xs text-slate-900 block">
                  {isFinnish ? 'Tauota tekoälyn oppiminen' : 'Pause AI preference learning'}
                </span>
                <p className="text-[11px] text-slate-500">
                  {isFinnish
                    ? 'Hylkäykset eivät päivitä sääntöjä tauon aikana.'
                    : 'Temporary freeze on updating profile flexibility rules from rejections.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPauseAiLearning(!pauseAiLearning);
                  showToast(pauseAiLearning ? 'AI learning resumed' : 'AI learning paused');
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
        </div>
      </div>

      {/* 4. Data Transparency & Verification Links */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <span className="font-bold text-slate-900 block">
            {isFinnish ? 'Laskennan ja avoimen datan tarkastelu' : 'Calculation & Open Data Transparency'}
          </span>
          <p className="text-[11px] text-slate-500">
            {isFinnish
              ? 'Tarkista laskentakaavat, päästökertoimet (HSY, Fingrid) ja reaaliaikaiset rajapinnat.'
              : 'Audit deterministic formulas, emission factors (HSY, Fingrid) and live endpoints.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCalculationEngine}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs transition shadow-xs whitespace-nowrap"
          >
            {isFinnish ? 'Laskentakaavat' : 'Calculation Engine'}
          </button>
          <button
            onClick={onOpenDataSources}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs transition shadow-xs whitespace-nowrap"
          >
            {isFinnish ? 'Tietolähteet' : 'Open Data APIs'}
          </button>
        </div>
      </div>
    </div>
  );
};
