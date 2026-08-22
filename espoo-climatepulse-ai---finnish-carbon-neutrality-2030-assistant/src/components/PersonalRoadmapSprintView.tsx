import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  RotateCw,
  Award,
  TrendingDown,
  Building,
  Heart,
  Share2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { UserProfile, Season } from '../types/climate';
import { generateRoadmapPlanAPI } from '../services/aiClient';

interface PersonalRoadmapSprintViewProps {
  userProfile: UserProfile;
  currentSeason: Season;
  isFinnish: boolean;
  onOpenShareModal: () => void;
}

export const PersonalRoadmapSprintView: React.FC<PersonalRoadmapSprintViewProps> = ({
  userProfile,
  currentSeason,
  isFinnish,
  onOpenShareModal,
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [sprintData, setSprintData] = useState<{
    personalizedTagline: string;
    roadmapSummary: string;
    weeklyActions: {
      day: string;
      actionTitle: string;
      category: string;
      impactDescription: string;
      co2KgSaved: number;
      moneyEurSaved: number;
      howToExecute: string;
    }[];
    housingCompanyAdvice: string;
    communityImpactText: string;
  } | null>(null);

  const [completedDays, setCompletedDays] = useState<Record<number, boolean>>({
    0: true,
    1: true,
  });

  const fetchSprint = async () => {
    setIsGenerating(true);
    try {
      const plan = await generateRoadmapPlanAPI(userProfile, currentSeason);
      setSprintData(plan);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchSprint();
  }, [userProfile.id, currentSeason]);

  const toggleDayCompletion = (idx: number) => {
    setCompletedDays((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Calculate totals
  const totalCo2SavedInSprint =
    sprintData?.weeklyActions.reduce((acc, act, idx) => {
      return completedDays[idx] ? acc + act.co2KgSaved : acc;
    }, 0) || 0;

  const totalMoneySavedInSprint =
    sprintData?.weeklyActions.reduce((acc, act, idx) => {
      return completedDays[idx] ? acc + act.moneyEurSaved : acc;
    }, 0) || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 text-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-emerald-200 border border-white/30">
              🌟 {isFinnish ? 'Henkilökohtainen 7 Päivän Ilmastosprintti' : 'Personal 7-Day Climate Sprint'}
            </span>
            <span className="text-xs text-emerald-200">
              {userProfile.district.split('(')[0]}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {sprintData?.personalizedTagline ||
              (isFinnish
                ? `${userProfile.name} — Espoon 2030 Ilmastokumppani`
                : `${userProfile.name} — Espoo 2030 Climate Partner`)}
          </h2>
          <p className="text-xs text-slate-200 max-w-2xl leading-relaxed">
            {sprintData?.roadmapSummary ||
              (isFinnish
                ? `Räätälöity suunnitelma auttaa viemään arjen asumisen, saunomisen ja työmatkat kohti Espoon 2.5 t CO2e/asukas tavoitetasoa.`
                : `A tailored sprint to help align daily heating, sauna schedules, and commutes with Espoo's 2.5 t CO2e/resident target.`)}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchSprint}
            disabled={isGenerating}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20"
          >
            {isGenerating ? (
              <RotateCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-300" />
            )}
            <span>{isFinnish ? 'Päivitä AI-Sprintti' : 'Regenerate Sprint'}</span>
          </button>

          <button
            onClick={onOpenShareModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-xs font-black transition flex items-center gap-1.5 shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>{isFinnish ? 'Jaa Sitoumus' : 'Share Pledge'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards: Carbon Budget & Sprint Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Footprint Gauge */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isFinnish ? 'Arvioitu Hiilijalanjälki:' : 'Estimated Annual Footprint:'}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {userProfile.housingType}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-black text-slate-900">
              {userProfile.estimatedFootprintTonnes}
            </div>
            <div className="text-xs text-slate-500 font-bold">t CO2e / vuosi</div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>{isFinnish ? 'Espoo 2030 Tavoite:' : 'Espoo 2030 Target:'}</span>
              <span className="font-bold text-emerald-700">&lt; 2.5 t CO2e</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    (2.5 / userProfile.estimatedFootprintTonnes) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Sprint Live Savings */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {isFinnish ? 'Tämän viikon saavutettu säästö:' : 'Sprint Completed Savings:'}
          </span>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
              <div className="text-2xl font-black text-emerald-800">
                -{totalCo2SavedInSprint.toFixed(1)} kg
              </div>
              <div className="text-[10px] text-emerald-950 font-bold">CO2e Säästetty</div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 text-center">
              <div className="text-2xl font-black text-amber-800">
                +{totalMoneySavedInSprint.toFixed(1)} €
              </div>
              <div className="text-[10px] text-amber-950 font-bold">Rahasäästö</div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            {isFinnish
              ? 'Rastita alta suorittamasi arjen toimenpiteet.'
              : 'Check off actions below as you complete them.'}
          </p>
        </div>

        {/* Community Multiplier */}
        <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" />
              <span>{isFinnish ? 'Yhteisövaikutus Espoossa' : 'Collective Espoo Impact'}</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {sprintData?.communityImpactText ||
                'Kun 1 000 espoolaista kotitaloutta tekee samat valinnat, säästämme yli 36 tonnia päästöjä joka viikko.'}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Espoon asukkaat mukana:</span>
            <span className="font-extrabold text-emerald-400">314 000 asukasta</span>
          </div>
        </div>
      </div>

      {/* 7-Day Sprint Interactive List */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {isFinnish ? '7 Päivän Arjen Ilmastoteot:' : '7-Day Climate Action Schedule:'}
            </h3>
            <p className="text-xs text-slate-500">
              {isFinnish ? 'Konkreettisia ja helppoja askeleita joka päivälle' : 'Practical, quantified steps for each day of the week'}
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            {Object.values(completedDays).filter(Boolean).length} / 7 {isFinnish ? 'Valmiina' : 'Done'}
          </span>
        </div>

        <div className="space-y-3">
          {sprintData?.weeklyActions.map((action, idx) => {
            const isDone = Boolean(completedDays[idx]);

            return (
              <div
                key={idx}
                onClick={() => toggleDayCompletion(idx)}
                className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isDone
                    ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-white text-slate-700 text-[10px] font-black uppercase border border-slate-200">
                        {action.day}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800">
                        {action.category}
                      </span>
                    </div>

                    <h4
                      className={`text-xs font-extrabold ${
                        isDone ? 'text-emerald-950 line-through opacity-80' : 'text-slate-900'
                      }`}
                    >
                      {action.actionTitle}
                    </h4>

                    <p className="text-[11px] text-slate-600 leading-relaxed max-w-xl">
                      {action.impactDescription}
                    </p>

                    <div className="text-[10px] text-slate-500 italic">
                      💡 <strong>Ohje:</strong> {action.howToExecute}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end gap-1 shrink-0 self-end sm:self-center">
                  <span className="px-2.5 py-1 rounded-xl bg-white text-xs font-bold text-emerald-800 border border-emerald-200 shadow-2xs">
                    -{action.co2KgSaved} kg CO2
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    +{action.moneyEurSaved} € säästö
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Housing Company (Taloyhtiö) Advisory Section */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100">
              {isFinnish ? 'Taloyhtiön Energiaremontti & Aurinkoyhteisö' : 'Housing Company Energy & Solar Communities'}
            </h3>
            <p className="text-xs text-slate-400">
              {isFinnish ? 'Asunto-osakeyhtiöiden mahdollisuudet Espoossa' : 'Opportunities for Housing Companies in Espoo'}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {sprintData?.housingCompanyAdvice ||
            'Taloyhtiössänne kannattaa selvittää poistoilman lämmöntalteenotto (LTO) ja kattoaurinkovoimala, joihin saa ARA-avustusta ja jotka maksavat itsensä takaisin 4-7 vuodessa.'}
        </p>

        <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
          <span className="px-3 py-1 rounded-lg bg-slate-800 text-emerald-300 border border-slate-700 font-medium">
            ARA Energia-avustus
          </span>
          <span className="px-3 py-1 rounded-lg bg-slate-800 text-emerald-300 border border-slate-700 font-medium">
            Espoon Energia-neuvonta (Maksuton)
          </span>
          <span className="px-3 py-1 rounded-lg bg-slate-800 text-emerald-300 border border-slate-700 font-medium">
            Hyvityslaskentamalli (Aurinkosähkö asuntoihin)
          </span>
        </div>
      </div>
    </div>
  );
};
