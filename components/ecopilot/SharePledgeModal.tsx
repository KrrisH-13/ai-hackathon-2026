"use client";

import { useState } from "react";
import { X, Copy, CheckCircle, Award, Sparkles, Download } from "lucide-react";
import type { UserProfile } from "@/lib/ecopilot/types";

interface SharePledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  isFinnish: boolean;
}

export function SharePledgeModal({ isOpen, onClose, userProfile, isFinnish }: SharePledgeModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = isFinnish
    ? `🌱 Olen mukana tekemässä Espoosta hiilineutraalia vuoteen 2030 mennessä!\n\n🏡 Asunto: ${userProfile.housingType}, ${userProfile.district.split("(")[0]}\n⚡ Sähkö & Lämpö: ${userProfile.heatingSystem.split("(")[0]}\n🎯 Tavoite: ${userProfile.targetFootprintTonnes} t CO2e/vuosi\n✨ Arjen teot: Saunan ajoitus pörssisähköön, Pikaratikka 15 & HSY-kiertotalous.\n\nTutustu ja laske oma polkusi: Kipinä Espoo AI #HiilineutraaliEspoo2030 #Ilmastovahti`
    : `🌱 I've pledged to support the Carbon-Neutral Espoo 2030 roadmap!\n\n🏡 Home: ${userProfile.housingType}, ${userProfile.district.split("(")[0]}\n⚡ Heating: ${userProfile.heatingSystem.split("(")[0]}\n🎯 2030 Target: ${userProfile.targetFootprintTonnes} t CO2e/year\n✨ Actions: Nord Pool sauna scheduling, Pikaratikka 15 & HSY circular sorting.\n\nExplore your footprint with Kipinä Espoo AI #CarbonNeutralEspoo2030`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-extrabold text-slate-900">
              {isFinnish ? "Espoon 2030 Ilmastositoumus" : "Espoo 2030 Resident Climate Pledge"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white shadow-md space-y-4 text-center">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-emerald-200 border border-white/20">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Espoon Ilmastokumppani 2030</span>
            </div>

            <div className="space-y-1">
              <h4 className="text-xl font-black">{userProfile.name}</h4>
              <p className="text-xs text-emerald-200">
                {userProfile.district.split("(")[0]} • {userProfile.housingType}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20">
                <div className="text-lg font-black text-amber-300">{userProfile.targetFootprintTonnes} t</div>
                <div className="text-[9px] text-slate-200 font-bold">2030 CO2e Tavoite</div>
              </div>
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20">
                <div className="text-lg font-black text-emerald-300">+{userProfile.savedCo2Kg} kg</div>
                <div className="text-[9px] text-slate-200 font-bold">CO2e Säästetty</div>
              </div>
            </div>

            <p className="text-[10px] text-slate-300 italic pt-1">
              &quot;Sitoudun edistämään Espoon hiilineutraaliutta 2030 arjen energiavalinnoilla, HSL-joukkoliikenteellä ja
              HSY-kierrätyksellä.&quot;
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              {isFinnish ? "Jaa sosiaaliseen mediaan tai taloyhtiön kanavalle:" : "Copy shareable text:"}
            </label>
            <textarea
              value={shareText}
              readOnly
              rows={4}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>{isFinnish ? "Kopioitu leikepöydälle!" : "Copied to Clipboard!"}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{isFinnish ? "Kopioi Teksti" : "Copy Text"}</span>
                </>
              )}
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>{isFinnish ? "Tulosta" : "Print"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
