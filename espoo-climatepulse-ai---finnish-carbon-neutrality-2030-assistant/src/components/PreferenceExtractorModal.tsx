import React, { useState } from 'react';
import { X, Sparkles, Sliders, CheckCircle2, ShieldCheck, RefreshCw, ArrowRight, Brain } from 'lucide-react';
import { EcoPilotUserProfile } from '../types/user';
import { extractUserPreferencesWithAI } from '../ai/preferenceExtractor';
import { PreferenceExtractionResult } from '../ai/schemas';

interface PreferenceExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: EcoPilotUserProfile;
  onApplyPreferences: (updated: EcoPilotUserProfile) => void;
  isFinnish?: boolean;
}

const EXAMPLE_PHRASES_EN = [
  "I work 9 to 5, charge my EV at night, don't want to change heating, and I don't mind running the dishwasher later.",
  "I live in a rental in Tapiola, no sauna, commute by metro to Kamppi, and want to save money on electricity.",
  "I have small kids, strictly keep heating at 22°C, have solar panels on the roof, and love taking evening saunas.",
];

const EXAMPLE_PHRASES_FI = [
  "Teen töitä 9-17, lataan sähköautoa öisin, en halua laskea lämpötilaa ja voin ajaa tiskikoneen myöhemmin.",
  "Asun vuokralla Tapiolassa, ei saunaa, kuljen metrolla Kamppiin ja haluan säästää sähkölaskussa.",
  "Perheessä on pieniä lapsia, lämpö pidetään 22 asteessa, katolla on aurinkopaneelit ja sauna lämpiää usein.",
];

export const PreferenceExtractorModal: React.FC<PreferenceExtractorModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onApplyPreferences,
  isFinnish = false,
}) => {
  const examplePhrases = isFinnish ? EXAMPLE_PHRASES_FI : EXAMPLE_PHRASES_EN;
  const [inputText, setInputText] = useState<string>(examplePhrases[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [extractedResult, setExtractedResult] = useState<PreferenceExtractionResult | null>(null);

  if (!isOpen) return null;

  const handleExtract = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    try {
      const res = await extractUserPreferencesWithAI(inputText, userProfile);
      setExtractedResult(res);
    } catch (err) {
      console.error('Preference extraction error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToProfile = () => {
    if (!extractedResult) return;

    const newCanChange = Array.from(
      new Set([...userProfile.canChange, ...extractedResult.flexibleActivities])
    );

    const updatedProfile: EcoPilotUserProfile = {
      ...userProfile,
      canChange: newCanChange,
      cannotChange: Array.from(new Set([...userProfile.cannotChange, ...(extractedResult.constraints.map(c => c.replace(/\s+/g, '_')) as any)])),
      notes: extractedResult.summary,
    };

    onApplyPreferences(updatedProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl text-slate-100 relative space-y-5 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {isFinnish ? 'Tekoälyn Arkitulkitsin (NLU)' : 'AI Routine & Preference NLU'}
              </h3>
              <p className="text-xs text-slate-400">
                {isFinnish
                  ? 'Kirjoita vapaamuotoisesti arkirutiineistasi — Gemini erottelee joustot ja rajoitteet'
                  : 'Describe your routine in natural language — Gemini extracts structured rules without inventing data'}
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

        {/* Input Area */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 block">
            {isFinnish ? 'Kerro arjestasi omin sanoin:' : 'Tell EcoPilot about your daily habits & boundaries:'}
          </label>
          <textarea
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-400 font-sans leading-relaxed"
            placeholder="e.g. I work 9 to 5, charge EV at night, do not touch heating..."
          />

          {/* Quick Examples */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {isFinnish ? 'Kokeile esimerkkejä:' : 'Try quick examples:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {examplePhrases.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(phrase)}
                  className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 text-left transition"
                >
                  &ldquo;{phrase.slice(0, 48)}...&rdquo;
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={handleExtract}
            disabled={isLoading || !inputText.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{isFinnish ? 'Puretaan säännöiksi...' : 'Extracting with Gemini...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isFinnish ? 'Tunnista profiilin säännöt' : 'Extract Preferences & Constraints'}</span>
              </>
            )}
          </button>
        </div>

        {/* Structured Result Display */}
        {extractedResult && (
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-teal-500/40 space-y-4 animate-in fade-in-50 duration-300 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                {isFinnish ? 'Zod-validoitu JSON-tulos' : 'Zod-Validated Extraction Output'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">Strict Schema Verified</span>
            </div>

            {/* Flexible vs Protected */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Flexible */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Flexible Activities:
                </span>
                {extractedResult.flexibleActivities.length > 0 ? (
                  extractedResult.flexibleActivities.map((act, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-slate-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{act}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-400 italic">None specified</span>
                )}
              </div>

              {/* Constraints */}
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1.5">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                  Constraints & Protected:
                </span>
                {extractedResult.constraints.length > 0 ? (
                  extractedResult.constraints.map((con, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-slate-200">
                      <ShieldCheck className="w-3 h-3 text-rose-400 shrink-0" />
                      <span>{con}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-400 italic">None specified</span>
                )}
              </div>
            </div>

            {/* Schedule & Priorities */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-300">
              <div>
                Work Hours:{' '}
                <strong className="text-white">
                  {extractedResult.schedule?.work || 'Not stated'}
                </strong>
              </div>
              <div>
                Home Arrival:{' '}
                <strong className="text-white">
                  {extractedResult.schedule?.homeArrival || 'Not stated'}
                </strong>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleApplyToProfile}
                className="px-5 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-lg shadow-teal-400/20"
              >
                <span>{isFinnish ? 'Tallenna säännöt profiiliin' : 'Apply to EcoPilot Profile'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
