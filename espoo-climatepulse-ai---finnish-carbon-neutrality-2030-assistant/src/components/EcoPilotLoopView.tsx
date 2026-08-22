import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RotateCcw,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  HelpCircle,
  Database,
} from 'lucide-react';
import { EcoPilotUserProfile } from '../types/user';
import { Season } from '../types/climate';
import { getCurrentObservationSnapshot, executeEcoPilotAction } from '../services/ecoPilotService';
import { CANDIDATE_ACTIONS } from '../data/actions/candidateActions';
import { ExplanationDrawer } from './ExplanationDrawer';
import { RejectReasonModal } from './RejectReasonModal';
import { FeedbackLearningResult } from '../ai/schemas';

interface EcoPilotLoopViewProps {
  userProfile: EcoPilotUserProfile;
  currentSeason: Season;
  isFinnish: boolean;
  onUpdateProfile: (updated: EcoPilotUserProfile) => void;
  onNavigateTab: (tab: any) => void;
  onOpenDataSources: () => void;
  onOpenCalculationEngine: () => void;
}

export const EcoPilotLoopView: React.FC<EcoPilotLoopViewProps> = ({
  userProfile,
  currentSeason,
  isFinnish,
  onUpdateProfile,
  onNavigateTab,
  onOpenDataSources,
  onOpenCalculationEngine,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedActionId, setSelectedActionId] = useState<string>('action-ev-night-charge');
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [feedbackLearnedMsg, setFeedbackLearnedMsg] = useState<string | null>(null);

  const observation = getCurrentObservationSnapshot(currentSeason, 21);
  const selectedAction = CANDIDATE_ACTIONS.find((a) => a.id === selectedActionId) || CANDIDATE_ACTIONS[0];

  const steps = [
    { num: 1, title: 'OBSERVE', desc: 'Real-time grid & weather telemetry', icon: '📡' },
    { num: 2, title: 'UNDERSTAND', desc: 'Profile habits & hard boundaries', icon: '🧠' },
    { num: 3, title: 'RECOMMEND', desc: 'Ranked best action for right now', icon: '⚡' },
    { num: 4, title: 'USER DECISION', desc: 'Accept or reject with reason', icon: '👤' },
    { num: 5, title: 'LEARN', desc: 'Update flexibility model', icon: '📈' },
  ];

  const handleAccept = () => {
    const res = executeEcoPilotAction(selectedAction, userProfile, observation);
    onUpdateProfile(res.updatedProfile);
    setActiveStep(5);
  };

  const handleFeedbackLearned = (result: FeedbackLearningResult) => {
    setFeedbackLearnedMsg(result.learning);
    setActiveStep(5);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
            5-STEP AI ARCHITECTURE
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {isFinnish ? 'EcoPilot AI -Päätöksentekosilmukka' : 'The EcoPilot Decision Loop'}
        </h2>
        <p className="text-xs text-slate-300">
          OBSERVE → UNDERSTAND → RECOMMEND → USER ACCEPTS/REJECTS → LEARN → IMPROVE TOMORROW
        </p>
      </div>

      {/* Visual Step Indicator */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {steps.map((step) => {
          const isActive = activeStep === step.num;
          return (
            <button
              key={step.num}
              onClick={() => setActiveStep(step.num)}
              className={`p-3.5 rounded-2xl border text-left transition relative overflow-hidden ${
                isActive
                  ? 'bg-teal-500/20 border-teal-500/60 shadow-lg text-white'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="text-xl mb-1">{step.icon}</div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400">
                Step {step.num}: {step.title}
              </div>
              <div className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                {step.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step Content Showcase */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl space-y-6 text-slate-100">
        {activeStep === 1 && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📡</span>
              <div>
                <h3 className="text-lg font-extrabold text-white">Step 1: OBSERVE — Live Context Snapshot</h3>
                <p className="text-xs text-slate-400">Telemetric signals ingested into the snapshot</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase">Spot Electricity</span>
                <div className="text-lg font-black text-amber-400">{observation.currentSpotPriceCents} c/kWh</div>
                <p className="text-[11px] text-slate-400 font-mono">Nord Pool Day-Ahead (FI zone)</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase">Grid Clean Share</span>
                <div className="text-lg font-black text-emerald-400">{observation.cleanEnergySharePercent}%</div>
                <p className="text-[11px] text-slate-400 font-mono">Fingrid Telemetry (Nuclear+Wind+Hydro)</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase">Outdoor Weather</span>
                <div className="text-lg font-black text-blue-400">{observation.outdoorTempCelsius}°C ({observation.currentSeason})</div>
                <p className="text-[11px] text-slate-400 font-mono">FMI Espoo Tapiola Radar</p>
              </div>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧠</span>
              <div>
                <h3 className="text-lg font-extrabold text-white">Step 2: UNDERSTAND — User Habits & Invariants</h3>
                <p className="text-xs text-slate-400">Constraint verification before generating actions</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Flexible Activities:
                </span>
                <div className="space-y-1 text-slate-200">
                  {userProfile.canChange.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                  Hard Constraints (cannotChange):
                </span>
                <div className="space-y-1 text-slate-200">
                  {userProfile.cannotChange.map((con, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                      <span>{con.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h3 className="text-lg font-extrabold text-white">Step 3: RECOMMEND — High-Confidence Action</h3>
                <p className="text-xs text-slate-400">Selected based on spot prices, emission factors, and user profile</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h4 className="text-base font-black text-white">{selectedAction.titleEn}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedAction.descriptionEn}</p>
              <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-800">
                <span className="text-emerald-400 font-bold">Estimated saving: €{selectedAction.calcParameters.baseEurSaved?.toFixed(2) || '0.65'}</span>
                <span className="text-teal-300 font-bold">CO₂ benefit: {selectedAction.calcParameters.baseCo2KgSaved?.toFixed(1) || '0.9'} kg</span>
              </div>
            </div>
          </div>
        )}

        {activeStep === 4 && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👤</span>
              <div>
                <h3 className="text-lg font-extrabold text-white">Step 4: USER ACCEPTS / REJECTS</h3>
                <p className="text-xs text-slate-400">Simulate user interaction and decision</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleAccept}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20"
              >
                [Accept Action]
              </button>
              <button
                onClick={() => setIsRejectOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 border border-slate-700 font-bold text-xs transition"
              >
                [Not Today (Reject)]
              </button>
              <button
                onClick={() => setIsExplanationOpen(true)}
                className="text-xs text-slate-400 hover:text-white underline underline-offset-4 font-semibold"
              >
                [Why this recommendation?]
              </button>
            </div>
          </div>
        )}

        {activeStep === 5 && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📈</span>
              <div>
                <h3 className="text-lg font-extrabold text-white">Step 5: LEARN — Adaptive Profile Memory</h3>
                <p className="text-xs text-slate-400">EcoPilot refines its model without altering permanent preferences</p>
              </div>
            </div>
            {feedbackLearnedMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-slate-200 space-y-1">
                <span className="font-extrabold text-emerald-400 uppercase tracking-wider block text-[10px]">
                  EcoPilot Learned:
                </span>
                <p className="text-sm font-semibold text-emerald-200">&ldquo;{feedbackLearnedMsg}&rdquo;</p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                Action recorded. Acceptance streak updated to <strong className="text-emerald-400">{userProfile.streakDays} days</strong>.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Explanation Drawer */}
      <ExplanationDrawer
        isOpen={isExplanationOpen}
        onClose={() => setIsExplanationOpen(false)}
        actionId={selectedAction.id}
        actionTitle={selectedAction.titleEn}
        userProfile={userProfile}
        observation={observation}
        isFinnish={isFinnish}
      />

      {/* Reject Reason Modal */}
      <RejectReasonModal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        actionId={selectedAction.id}
        actionTitle={selectedAction.titleEn}
        userProfile={userProfile}
        onFeedbackLearnedAndRegenerate={handleFeedbackLearned}
        isFinnish={isFinnish}
      />
    </div>
  );
};
