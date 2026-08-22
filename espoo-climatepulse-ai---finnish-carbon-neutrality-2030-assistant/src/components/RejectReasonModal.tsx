import React, { useState } from 'react';
import { X, Brain, ShieldCheck, CheckCircle2, RotateCcw, Sliders, RefreshCw, ArrowRight, Sparkles } from 'lucide-react';
import { EcoPilotUserProfile } from '../types/user';
import { learnFromFeedbackWithAI } from '../ai/feedbackLearner';
import { FeedbackLearningResult } from '../ai/schemas';

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionId: string;
  actionTitle: string;
  userProfile: EcoPilotUserProfile;
  onFeedbackLearnedAndRegenerate: (learning: FeedbackLearningResult) => void;
  onOpenMakeItEasier?: () => void;
  isFinnish?: boolean;
}

const REJECTION_OPTIONS_EN = [
  { id: 'too_inconvenient', label: 'Too inconvenient', feedbackText: 'Too inconvenient for my routine today.' },
  { id: 'need_now', label: 'I need it now', feedbackText: 'I need it now and cannot delay.' },
  { id: 'travelling', label: "I'm travelling", feedbackText: "I'm travelling today and away from home." },
  { id: 'not_possible', label: 'Not possible', feedbackText: 'Not possible for my home equipment or schedule.' },
  { id: 'dont_agree', label: "I don't agree", feedbackText: "I don't agree with this recommendation." },
  { id: 'dont_suggest_again', label: "Don't suggest this again", feedbackText: "Please do not suggest this action in the future." },
  { id: 'other', label: 'Other', feedbackText: '' },
];

const REJECTION_OPTIONS_FI = [
  { id: 'too_inconvenient', label: 'Liian hankala tänään', feedbackText: 'Liian hankala toteuttaa arjessa tänään.' },
  { id: 'need_now', label: 'Tarvitsen heti', feedbackText: 'Tarvitsen heti enkä voi odottaa myöhempää ajankohtaa.' },
  { id: 'travelling', label: 'Olen matkoilla', feedbackText: 'Olen matkoilla tänään pois kotoa.' },
  { id: 'not_possible', label: 'Ei mahdollista', feedbackText: 'Ei ole mahdollista nykyisillä laitteilla tai tilanteessa.' },
  { id: 'dont_agree', label: 'En ole samaa mieltä', feedbackText: 'En ole samaa mieltä tämän toimenpiteen hyödystä.' },
  { id: 'dont_suggest_again', label: 'Älä ehdota tätä uudelleen', feedbackText: 'Älä ehdota tätä toimenpidettä jatkossa.' },
  { id: 'other', label: 'Muu syy', feedbackText: '' },
];

export const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  isOpen,
  onClose,
  actionId,
  actionTitle,
  userProfile,
  onFeedbackLearnedAndRegenerate,
  onOpenMakeItEasier,
  isFinnish = false,
}) => {
  const options = isFinnish ? REJECTION_OPTIONS_FI : REJECTION_OPTIONS_EN;
  const [selectedOption, setSelectedOption] = useState<string>('travelling');
  const [customText, setCustomText] = useState<string>("I'm travelling today.");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [learningResult, setLearningResult] = useState<FeedbackLearningResult | null>(null);

  if (!isOpen) return null;

  const handleSelectOption = (optId: string) => {
    setSelectedOption(optId);
    const matched = options.find((o) => o.id === optId);
    if (matched && matched.feedbackText) {
      setCustomText(matched.feedbackText);
    } else if (optId === 'other') {
      setCustomText('');
    }
  };

  const handleSendFeedback = async () => {
    const feedbackToSend = customText.trim() || 'Not today.';
    setIsLoading(true);
    try {
      const res = await learnFromFeedbackWithAI({
        actionId,
        actionTitle,
        userFeedback: feedbackToSend,
        userProfile,
      });
      setLearningResult(res);
    } catch (err) {
      console.error('Failed to interpret feedback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyAndRegenerate = () => {
    if (!learningResult) return;
    onFeedbackLearnedAndRegenerate(learningResult);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-800 relative space-y-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isFinnish ? 'Ei tänään — Kerro syy' : 'Not today — Tell EcoPilot why'}
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-xs">{actionTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!learningResult ? (
          <div className="space-y-4 text-xs">
            {/* Quick Negotiation Banner */}
            {onOpenMakeItEasier && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{isFinnish ? 'Haluatko vain kevyemmän version?' : 'Want a less demanding version?'}</span>
                  </span>
                  <p className="text-[11px] text-emerald-800">
                    {isFinnish
                      ? 'Voit siirtää ajoitusta esim. klo 20:00 tai valita pikasäästön.'
                      : 'You can adjust to 20:00 or choose a lower-effort compromise.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenMakeItEasier();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs whitespace-nowrap shadow-xs"
                >
                  {isFinnish ? 'Tee helpommaksi' : 'Make it easier'}
                </button>
              </div>
            )}

            <div className="space-y-2">
              <span className="font-semibold text-slate-700 block">
                {isFinnish ? 'Valitse syy:' : 'Select feedback reason:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.id)}
                    className={`p-2.5 rounded-xl border text-left font-medium transition flex items-center justify-between ${
                      selectedOption === opt.id
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      selectedOption === opt.id ? 'border-emerald-400 bg-emerald-400' : 'border-slate-300'
                    }`}>
                      {selectedOption === opt.id && <span className="w-1 h-1 rounded-full bg-slate-900" />}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {selectedOption === 'other' && (
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {isFinnish ? 'Tarkenna syy:' : 'Specify reason:'}
                </label>
                <textarea
                  rows={2}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="e.g. Going to the summer cottage this weekend..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition"
              >
                {isFinnish ? 'Peruuta' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSendFeedback}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>{isFinnish ? 'Tekoäly oppii...' : 'AI Learning...'}</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isFinnish ? 'Lähetä palaute' : 'Send feedback'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Show EcoPilot Learned Result */
          <div className="space-y-4 animate-in fade-in-50 duration-300 text-xs">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>{isFinnish ? 'EcoPilot oppi:' : 'EcoPilot learned:'}</span>
              </div>
              <p className="text-slate-800 text-xs leading-relaxed font-medium bg-white p-3 rounded-lg border border-emerald-100">
                &ldquo;{learningResult.learning}&rdquo;
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Type: <strong className="text-slate-800 font-mono">{learningResult.feedbackType}</strong></span>
                <span>Duration: <strong className="text-slate-800 font-mono">{learningResult.duration}</strong></span>
              </div>
            </div>

            <p className="text-slate-500 text-[11px]">
              {isFinnish
                ? 'Päivittäinen suositus luodaan nyt automaattisesti uudelleen ottaen tämän uuden säännön huomioon.'
                : "Your daily recommendation will now regenerate immediately with a fresh, eligible candidate action."}
            </p>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleApplyAndRegenerate}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
              >
                <span>{isFinnish ? 'Päivitä suositus nyt' : 'Regenerate Recommendation'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
