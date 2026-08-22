import React, { useState } from 'react';
import { Calendar, CheckCircle2, Sparkles, Award, ArrowRight, ShieldCheck, Flame, Zap } from 'lucide-react';
import { EcoPilotUserProfile } from '../types/user';
import { Season } from '../types/climate';

interface PersonalRoadmapSprintViewProps {
  userProfile: EcoPilotUserProfile;
  currentSeason: Season;
  isFinnish: boolean;
}

export const PersonalRoadmapSprintView: React.FC<PersonalRoadmapSprintViewProps> = ({
  userProfile,
  currentSeason,
  isFinnish,
}) => {
  const [completedDays, setCompletedDays] = useState<number[]>([1, 2]);

  const days = [
    { day: 1, title: 'Sauna Smart-Shift', desc: 'Heat electric sauna after 21:00 off-peak', savingEur: 1.55, co2Kg: 1.25 },
    { day: 2, title: 'HSY 100% Bio-Waste', desc: 'Divert food waste to Ämmässuo biogas', savingEur: 0.30, co2Kg: 0.85 },
    { day: 3, title: 'Indoor Heating Tune', desc: 'Adjust comfort setpoint to 21°C', savingEur: 0.85, co2Kg: 2.70 },
    { day: 4, title: 'HSL Rail Commute', desc: 'Take Pikaratikka 15 instead of driving', savingEur: 2.70, co2Kg: 1.42 },
    { day: 5, title: 'EV Dynamic Wind Charge', desc: 'Automate EV charging to 01:00-05:00', savingEur: 4.80, co2Kg: 3.10 },
    { day: 6, title: 'Plastic Packaging Sorting', desc: 'Rinse and recycle clean food trays', savingEur: 0.20, co2Kg: 0.60 },
    { day: 7, title: 'Weekly Climate Review', desc: 'Check total verified Espoo impact', savingEur: 0.00, co2Kg: 0.00 },
  ];

  const toggleDay = (dayNum: number) => {
    if (completedDays.includes(dayNum)) {
      setCompletedDays(completedDays.filter((d) => d !== dayNum));
    } else {
      setCompletedDays([...completedDays, dayNum]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn text-slate-100">
      <div className="space-y-1 pb-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            7-DAY CLIMATE SPRINT
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {isFinnish ? '7 Päivän Ilmastohaaste' : 'Your 7-Day Personalized Sprint'}
        </h2>
        <p className="text-xs text-slate-300">
          {isFinnish
            ? 'Räätälöity arjen toimenpidesuunnitelma kotiisi'
            : `Tailored for ${userProfile.name} in ${userProfile.neighborhood} (${userProfile.housingType.replace(/_/g, ' ')})`}
        </p>
      </div>

      {/* 7 Days Schedule Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {days.map((item) => {
          const isDone = completedDays.includes(item.day);
          return (
            <div
              key={item.day}
              onClick={() => toggleDay(item.day)}
              className={`p-5 rounded-3xl border transition cursor-pointer space-y-3 ${
                isDone
                  ? 'bg-purple-950/40 border-purple-500/40 text-slate-200'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                  Day {item.day}
                </span>
                <span
                  className={`w-6 h-6 rounded-xl border flex items-center justify-center transition ${
                    isDone ? 'border-purple-400 bg-purple-500 text-slate-950 font-bold' : 'border-slate-700 bg-slate-800'
                  }`}
                >
                  {isDone && <CheckCircle2 className="w-4 h-4" />}
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-white">{item.title}</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.desc}</p>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-slate-800">
                <span className="text-emerald-400 font-bold">€{item.savingEur.toFixed(2)}</span>
                <span className="text-teal-300 font-bold">{item.co2Kg.toFixed(1)} kg CO₂</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
