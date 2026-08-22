import React from 'react';
import { Layers, Target, ShieldCheck, CheckCircle2, TrendingDown, ExternalLink } from 'lucide-react';
import { ESPOO_CLIMATE_WATCH_DATA } from '../data/espooData';

interface EspooClimateWatch2030ViewProps {
  isFinnish: boolean;
}

export const EspooClimateWatch2030View: React.FC<EspooClimateWatch2030ViewProps> = ({ isFinnish }) => {
  const data = ESPOO_CLIMATE_WATCH_DATA;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn text-slate-100">
      <div className="space-y-1 pb-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            ESPOO ILMASTOVAHTI 2030
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {isFinnish ? 'Hiilineutraali Espoo 2030 -tiekartta' : 'Carbon Neutral Espoo 2030 Roadmap'}
        </h2>
        <p className="text-xs text-slate-300">
          {isFinnish
            ? 'Espoon kaupungin virallinen tavoite: -80% päästövähennys vuoden 1990 tasosta'
            : 'City of Espoo target: -80% emissions by 2030 vs 1990 baseline'}
        </p>
      </div>

      {/* Target Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Target Year</span>
          <div className="text-2xl font-black text-white">{data.targetYear}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase">City Target</span>
          <div className="text-2xl font-black text-emerald-400">-{data.totalReductionTargetPercent}%</div>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Achieved so far</span>
          <div className="text-2xl font-black text-indigo-400">-{data.currentAchievedReductionPercent}%</div>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Clean Kaukolämpö</span>
          <div className="text-2xl font-black text-teal-300">{data.districtHeatingDecarbonizationYear}</div>
        </div>
      </div>

      {/* 4 Sectors Breakdown */}
      <div className="space-y-4">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
          {isFinnish ? 'Päästösektorit ja Kaupungin Toimenpiteet:' : 'City Roadmap Sectors & Key Actions:'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.sectors.map((sec) => (
            <div
              key={sec.id}
              className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-white">{isFinnish ? sec.nameFi : sec.name}</h4>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {sec.progressPercent}% completed
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${sec.progressPercent}%` }}
                />
              </div>

              <div className="space-y-1.5 pt-1 text-xs">
                {sec.keyActions.map((act, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
