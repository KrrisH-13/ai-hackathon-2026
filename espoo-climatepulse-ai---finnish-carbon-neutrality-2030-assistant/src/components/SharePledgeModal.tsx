import React, { useState } from 'react';
import { X, Share2, Copy, Check, Sparkles, Award, ShieldCheck } from 'lucide-react';
import { EcoPilotUserProfile } from '../types/user';

interface SharePledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: EcoPilotUserProfile;
  isFinnish?: boolean;
}

export const SharePledgeModal: React.FC<SharePledgeModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  isFinnish = false,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = isFinnish
    ? `🌿 Olen mukana tekemässä Espoosta hiilineutraalia 2030! Olen säästänyt jo ${userProfile.savedCo2Kg.toFixed(1)} kg CO₂ ja kerännyt ${userProfile.ecoCredits} EcoCredits-pistettä EcoPilotilla (${userProfile.neighborhood}, Espoo). #EcoPilotEspoo #HiilineutraaliEspoo2030`
    : `🌿 I'm taking climate action with EcoPilot Espoo! I've saved ${userProfile.savedCo2Kg.toFixed(1)} kg CO₂ and earned ${userProfile.ecoCredits} EcoCredits in ${userProfile.neighborhood}, Espoo. Towards Carbon Neutral Espoo 2030! #EcoPilotEspoo #ClimateAction`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-slate-100 relative space-y-5"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {isFinnish ? 'Jaa Espoon Ilmastolupaus' : 'Share Your Espoo Climate Pledge'}
              </h3>
              <p className="text-xs text-slate-400">
                {isFinnish ? 'Inspiroi naapureitasi ja taloyhtiötäsi mukaan' : 'Inspire your neighbors and community'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share Preview Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              Espoo 2030 Climate Leader
            </span>
            <span className="text-slate-400 font-mono text-[11px]">{userProfile.neighborhood}</span>
          </div>

          <p className="text-sm font-semibold text-slate-100 leading-relaxed italic">
            &ldquo;{shareText}&rdquo;
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2 text-center text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Verified CO₂ Saved</div>
              <div className="text-lg font-black text-emerald-400">{userProfile.savedCo2Kg.toFixed(1)} kg</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">EcoCredits Earned</div>
              <div className="text-lg font-black text-amber-400">{userProfile.ecoCredits} pts</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={handleCopy}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>{isFinnish ? 'Kopioitu leikepöydälle!' : 'Copied to clipboard!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{isFinnish ? 'Kopioi ja jaa' : 'Copy Text'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
