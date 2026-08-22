import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Brain,
  Sliders,
  Check,
  X,
  RefreshCw,
  Award,
  HelpCircle,
  TrendingDown,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Leaf,
  Calendar,
  AlertCircle,
  Briefcase,
  Plane,
  Home,
  Sun,
} from 'lucide-react';
import { calculateEcoCreditsForImpact } from '../services/ecoCreditsEngine';
import { EcoPilotUserProfile } from '../types/user';
import { ObservationSnapshot, ActionDefinition } from '../types/recommendation';
import { getCurrentObservationSnapshot } from '../services/ecoPilotService';
import { CANDIDATE_ACTIONS } from '../data/actions/candidateActions';
import { reasonRecommendationWithAI } from '../ai/recommendationReasoner';
import { FeedbackLearningResult } from '../ai/schemas';
import { DailyNotificationCard } from './DailyNotificationCard';
import { RejectReasonModal } from './RejectReasonModal';
import { MakeItEasierModal } from './MakeItEasierModal';
import { ExplanationDrawer } from './ExplanationDrawer';
import { PreferenceExtractorModal } from './PreferenceExtractorModal';
import { AskEcoPilotDrawer } from './AskEcoPilotDrawer';
import { ProfileCustomizerModal } from './ProfileCustomizerModal';
import { DataFreshnessBadge } from './DataFreshnessBadge';
import { WeeklyAiReflectionCard } from './WeeklyAiReflectionCard';
import { ContextualWhatIfButton } from './ContextualWhatIfButton';
import { ContextualWhatIfModal } from './ContextualWhatIfModal';
import { ReceiptScannerModal } from './ReceiptScannerModal';
import { SavedGoal } from '../types/user';

interface TodayDashboardViewProps {
  userProfile: EcoPilotUserProfile;
  isFinnish: boolean;
  onUpdateProfile: (updated: EcoPilotUserProfile) => void;
  onOpenDataSources?: () => void;
  onOpenCalculationEngine?: () => void;
  onOpenAskEcoPilot?: () => void;
  onOpenProgress?: () => void;
  onOpenRewards?: () => void;
  onSaveGoal?: (goal: SavedGoal) => void;
  onOpenReceiptScanner?: () => void;
  onOpenAskAssistant?: (query?: string, title?: string) => void;
}

type DailyContext = 'normal' | 'wfh' | 'travelling' | 'busy';

export const TodayDashboardView: React.FC<TodayDashboardViewProps> = ({
  userProfile,
  isFinnish,
  onUpdateProfile,
  onOpenDataSources,
  onOpenCalculationEngine,
  onOpenAskEcoPilot,
  onOpenProgress,
  onOpenRewards,
  onSaveGoal,
  onOpenAskAssistant,
}) => {
  const [observation, setObservation] = useState<ObservationSnapshot>(
    getCurrentObservationSnapshot('winter', 21)
  );

  // Daily Context Chip state
  const [dailyContext, setDailyContext] = useState<DailyContext>('normal');

  // Active Opportunity State
  const [currentOpportunity, setCurrentOpportunity] = useState<{
    actionId: string;
    icon: string;
    title: string;
    suggestedTime: string;
    savingEur: number;
    co2BenefitKg: number;
    effort: 'Low' | 'Medium' | 'High';
    confidence: 'High' | 'Medium' | 'Optimal';
    reason: string;
    userFriendlyExplanation: string;
  }>({
    actionId: 'action-ev-night-charge',
    icon: '🚗',
    title: 'EV charging',
    suggestedTime: 'Charge after 22:00',
    savingEur: 0.65,
    co2BenefitKg: 0.9,
    effort: 'Low',
    confidence: 'High',
    reason: 'Spot rates drop significantly after 22:00 and clean wind generation peaks in the Finnish grid.',
    userFriendlyExplanation: 'Charging your EV overnight captures clean wind energy at lowest spot pricing.',
  });

  const [isAccepted, setIsAccepted] = useState<boolean>(false);
  const [acceptedToast, setAcceptedToast] = useState<{
    message: string;
    credits: number;
    co2Kg: number;
    creditsUntilNext: number;
  } | null>(null);
  const [temporaryBlocks, setTemporaryBlocks] = useState<string[]>([]);
  const [isLoadingDaily, setIsLoadingDaily] = useState<boolean>(false);
  const [learnedBanner, setLearnedBanner] = useState<string | null>(null);
  const [negotiatedCompromise, setNegotiatedCompromise] = useState<string | null>(null);

  // Modals
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [isMakeItEasierOpen, setIsMakeItEasierOpen] = useState<boolean>(false);
  const [isExplanationOpen, setIsExplanationOpen] = useState<boolean>(false);
  const [isPreferenceExtractorOpen, setIsPreferenceExtractorOpen] = useState<boolean>(false);
  const [isAskAssistantOpen, setIsAskAssistantOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isTodayWhatIfOpen, setIsTodayWhatIfOpen] = useState<boolean>(false);
  const [isGreenWindowWhatIfOpen, setIsGreenWindowWhatIfOpen] = useState<boolean>(false);
  const [isReceiptScannerOpen, setIsReceiptScannerOpen] = useState<boolean>(false);

  // Synchronize dynamic daily opportunity using Gemini Reasoner & Deterministic Fallbacks
  const loadDailyOpportunity = async (
    blocksToApply = temporaryBlocks,
    contextOverride = dailyContext
  ) => {
    setIsLoadingDaily(true);
    setIsAccepted(false);
    setNegotiatedCompromise(null);

    try {
      // Contextual pre-filtering
      let eligible = CANDIDATE_ACTIONS.filter((c) => {
        const titleLower = c.titleEn.toLowerCase();
        const domainLower = c.domain.toLowerCase();

        // 1. Temporary rejections/blocks
        const isBlocked = blocksToApply.some(
          (b) => titleLower.includes(b.toLowerCase()) || domainLower.includes(b.toLowerCase())
        );
        // 2. User hard constraints
        const violatesConstraint = c.excludedByConstraints.some((con) =>
          userProfile.cannotChange.includes(con)
        );

        // 3. Daily Context adjustments
        if (contextOverride === 'travelling') {
          // If travelling, skip EV home charging, dishwasher, sauna
          if (c.domain === 'energy_spot' && (titleLower.includes('dishwasher') || titleLower.includes('sauna') || titleLower.includes('ev'))) {
            return false;
          }
        } else if (contextOverride === 'busy') {
          // Only low effort
          if (c.baseDifficulty !== 'easy') return false;
        }

        return !isBlocked && !violatesConstraint;
      });

      if (eligible.length === 0) {
        eligible = CANDIDATE_ACTIONS;
      }

      // If user is travelling, prioritize transit / remote action
      if (contextOverride === 'travelling') {
        const transitAction = CANDIDATE_ACTIONS.find((a) => a.domain === 'transit_hsl') || eligible[0];
        setCurrentOpportunity({
          actionId: transitAction.id,
          icon: '🚊',
          title: isFinnish ? 'HSL Pikaratikka 15' : 'HSL Light Rail 15',
          suggestedTime: isFinnish ? 'Päivän matkat' : 'Day trips',
          savingEur: transitAction.calcParameters.baseEurSaved || 1.80,
          co2BenefitKg: transitAction.calcParameters.baseCo2KgSaved || 2.1,
          effort: 'Low',
          confidence: 'High',
          reason: isFinnish
            ? 'Huomioitu matkustuspäivä: kodin sähkölaitteiden sijaan EcoPilot ehdottaa HSL:n päästötöntä pikaraitiotietä.'
            : 'Travelling today context: EcoPilot shifted focus from home energy to zero-emission HSL light rail transit.',
          userFriendlyExplanation: isFinnish
            ? 'Matkusta sujuvasti ilman polttomoottoripäästöjä ja pysäköintikuluja.'
            : 'Smooth zero-emission travel with zero parking hassle.',
        });
        setIsLoadingDaily(false);
        return;
      }

      // Call Gemini Reasoner
      const reasoning = await reasonRecommendationWithAI({
        userProfile,
        candidateActions: eligible,
        observation,
      });

      const selectedAction =
        CANDIDATE_ACTIONS.find((a) => a.id === reasoning.selectedActionId) || eligible[0] || CANDIDATE_ACTIONS[0];

      let icon = '🚗';
      let title = 'EV charging';
      let suggestedTime = 'Charge after 22:00';
      let savingEur = selectedAction.calcParameters.baseEurSaved || 0.65;
      let co2Kg = selectedAction.calcParameters.baseCo2KgSaved || 0.9;
      let effort: 'Low' | 'Medium' | 'High' = 'Low';

      if (selectedAction.id === 'action-hsl-commute-shift' || selectedAction.id.includes('commute')) {
        icon = '🚆';
        title = isFinnish ? 'HSL-työmatka (Tapiola)' : 'HSL Commute (Tapiola)';
        suggestedTime = isFinnish ? 'Aamutyömatka (Pikaratikka 15 / Metro)' : 'Morning commute (Light Rail 15 / Metro)';
        savingEur = 4.20;
        co2Kg = 4.08;
        effort = 'Low';
      } else if (selectedAction.id.includes('dishwasher')) {
        icon = '🧺';
        title = isFinnish ? 'Tiskikoneen ajastus' : 'Dishwasher';
        suggestedTime = isFinnish ? 'Käynnistä klo 21:00 jälkeen' : 'Run after 21:00';
        effort = 'Low';
      } else if (selectedAction.id.includes('sauna')) {
        icon = '🧖';
        title = isFinnish ? 'Sähkösaunan lämmitys' : 'Electric Sauna';
        suggestedTime = isFinnish ? 'Lämmitä klo 21:30 jälkeen' : 'Heat after 21:30';
        effort = 'Low';
      } else if (selectedAction.id.includes('temp') || selectedAction.id.includes('heat')) {
        icon = '🌡️';
        title = isFinnish ? 'Huonelämpötila' : 'Room Heating';
        suggestedTime = isFinnish ? 'Milloin vain tänään' : 'Anytime today';
        effort = 'Low';
      } else if (selectedAction.id.includes('pikaratikka') || selectedAction.id.includes('transit')) {
        icon = '🚊';
        title = isFinnish ? 'HSL Pikaratikka 15' : 'HSL Light Rail 15';
        suggestedTime = isFinnish ? 'Aamutyömatka' : 'Morning commute';
        effort = 'Medium';
      } else if (selectedAction.id.includes('waste') || selectedAction.id.includes('plastic')) {
        icon = '♻️';
        title = isFinnish ? 'Muovi- ja biojätteen lajittelu' : '100% Bio & Plastic Sorting';
        suggestedTime = isFinnish ? 'Iltarutiini' : 'Evening routine';
        effort = 'Low';
      }

      setCurrentOpportunity({
        actionId: selectedAction.id,
        icon,
        title,
        suggestedTime,
        savingEur,
        co2BenefitKg: co2Kg,
        effort,
        confidence: reasoning.confidence > 0.85 ? 'High' : 'Optimal',
        reason: reasoning.reason,
        userFriendlyExplanation: reasoning.userFriendlyExplanation,
      });
    } catch (err) {
      console.error('Failed to load daily opportunity:', err);
    } finally {
      setIsLoadingDaily(false);
    }
  };

  useEffect(() => {
    loadDailyOpportunity(temporaryBlocks, dailyContext);
  }, [userProfile.id, dailyContext]);

  // Handle Accept
  const handleAccept = () => {
    setIsAccepted(true);
    const calcResult = calculateEcoCreditsForImpact({
      actionId: currentOpportunity.actionId,
      actionTitle: currentOpportunity.title,
      avoidedCo2Kg: currentOpportunity.co2BenefitKg,
      confidence: 'HIGH',
      savedEur: currentOpportunity.savingEur,
      streakDays: userProfile.streakDays + 1,
    });
    const creditsEarned = calcResult.finalCreditsAwarded || 12;
    const newTotalCredits = userProfile.ecoCredits + creditsEarned;
    const creditsUntilNext = Math.max(0, 200 - newTotalCredits);

    const newTx = {
      id: `tx-${Date.now()}`,
      title: currentOpportunity.title,
      titleFi: currentOpportunity.title,
      amount: creditsEarned,
      dateLabel: 'Today',
      timestamp: new Date().toISOString(),
      category: currentOpportunity.title,
      type: 'earned' as const,
      co2SavedKg: currentOpportunity.co2BenefitKg,
    };

    const updated: EcoPilotUserProfile = {
      ...userProfile,
      ecoCredits: newTotalCredits,
      savedCo2Kg: Number((userProfile.savedCo2Kg + currentOpportunity.co2BenefitKg).toFixed(1)),
      savedEurTotal: Number((userProfile.savedEurTotal + currentOpportunity.savingEur).toFixed(2)),
      streakDays: userProfile.streakDays + 1,
      acceptedActionsHistory: Array.from(new Set([...userProfile.acceptedActionsHistory, currentOpportunity.actionId])),
      ecoCreditTransactions: [newTx, ...(userProfile.ecoCreditTransactions || [])],
      categoryStats: {
        ...userProfile.categoryStats,
        [currentOpportunity.title]: {
          accepted: (userProfile.categoryStats?.[currentOpportunity.title]?.accepted || 0) + 1,
          rejected: userProfile.categoryStats?.[currentOpportunity.title]?.rejected || 0,
        },
      },
    };

    onUpdateProfile(updated);
    setAcceptedToast({
      message: isFinnish ? '✓ Hieno valinta!' : '✓ Nice choice!',
      credits: creditsEarned,
      co2Kg: currentOpportunity.co2BenefitKg,
      creditsUntilNext,
    });
  };

  // Handle Negotiated Easier Option
  const handleSelectEasierOption = (option: {
    title: string;
    suggestedTime: string;
    savingEur: number;
    co2BenefitKg: number;
    effort: 'Low' | 'Medium';
    compromiseNote: string;
  }) => {
    setCurrentOpportunity((prev) => ({
      ...prev,
      title: option.title,
      suggestedTime: option.suggestedTime,
      savingEur: option.savingEur,
      co2BenefitKg: option.co2BenefitKg,
      effort: option.effort,
      reason: option.compromiseNote,
      userFriendlyExplanation: option.compromiseNote,
    }));
    setNegotiatedCompromise(option.suggestedTime);
  };

  // Handle Reject & Feedback Learning
  const handleFeedbackLearned = (learning: FeedbackLearningResult) => {
    const affected = learning.affectedCategory || currentOpportunity.title;
    const newBlocks = [...temporaryBlocks, affected, currentOpportunity.actionId];
    setTemporaryBlocks(newBlocks);

    const updated: EcoPilotUserProfile = {
      ...userProfile,
      rejectedActionsHistory: Array.from(new Set([...userProfile.rejectedActionsHistory, currentOpportunity.actionId])),
      categoryStats: {
        ...userProfile.categoryStats,
        [currentOpportunity.title]: {
          accepted: userProfile.categoryStats[currentOpportunity.title]?.accepted || 0,
          rejected: (userProfile.categoryStats[currentOpportunity.title]?.rejected || 0) + 1,
        },
      },
      feedbackLog: [
        {
          actionId: currentOpportunity.actionId,
          category: affected,
          accepted: false,
          timestamp: new Date().toISOString(),
          userNote: `[${learning.feedbackType}] ${learning.learning}`,
        },
        ...userProfile.feedbackLog,
      ],
    };

    if (learning.feedbackType === 'permanent_constraint') {
      const constraintKey = `no_${affected.toLowerCase().replace(/\s+/g, '_')}` as any;
      if (!updated.cannotChange.includes(constraintKey)) {
        updated.cannotChange.push(constraintKey);
      }
    }

    onUpdateProfile(updated);
    setLearnedBanner(learning.learning);
    loadDailyOpportunity(newBlocks, dailyContext);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-7 animate-fadeIn text-slate-800">
      {/* 1. Header Greeting & Ambient Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              TODAY
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {new Date().toLocaleDateString(isFinnish ? 'fi-FI' : 'en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <DataFreshnessBadge freshness="live" source="Fingrid & Spot FI" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isFinnish ? `Hyvää huomenta, ${userProfile.name}` : `Good morning, ${userProfile.name}`}
          </h2>
          <p className="text-xs text-slate-500">
            {isFinnish
              ? `Espoo: ${observation.outdoorTempCelsius}°C (${observation.currentSeason}) • Pörssisähkö: ${observation.currentSpotPriceCents} c/kWh`
              : `Espoo: ${observation.outdoorTempCelsius}°C (${observation.currentSeason}) • Spot electricity: ${observation.currentSpotPriceCents} c/kWh`}
          </p>
        </div>

        {/* Action quick trigger buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAskAssistantOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
          >
            <Brain className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isFinnish ? 'Kysy EcoPilotilta' : 'Ask EcoPilot'}</span>
          </button>
          <button
            onClick={() => setIsPreferenceExtractorOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5 text-teal-600" />
            <span>{isFinnish ? 'Arjen tulkitsin' : 'AI Routine NLU'}</span>
          </button>
        </div>
      </div>

      {/* 2. "What's different today?" Contextual Quick Chips */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isFinnish ? 'Onko päivässäsi jotain poikkeavaa?' : "What's different today?"}</span>
          </span>
          <span className="text-[10px] text-slate-400">
            {isFinnish ? 'Pikapäivitys' : 'Instant context switch'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setDailyContext('normal');
              loadDailyOpportunity(temporaryBlocks, 'normal');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              dailyContext === 'normal'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>{isFinnish ? 'Normaali päivä' : 'Normal day'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDailyContext('wfh');
              loadDailyOpportunity(temporaryBlocks, 'wfh');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              dailyContext === 'wfh'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>{isFinnish ? 'Etätyöpäivä' : 'Working from home'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDailyContext('travelling');
              loadDailyOpportunity(temporaryBlocks, 'travelling');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              dailyContext === 'travelling'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>{isFinnish ? 'Matkoilla / Poissa kotoa' : 'Travelling'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDailyContext('busy');
              loadDailyOpportunity(temporaryBlocks, 'busy');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              dailyContext === 'busy'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>{isFinnish ? 'Kiireinen aikataulu' : 'Busy day'}</span>
          </button>
        </div>
      </div>

      {/* Learned Banner if feedback was applied */}
      {learnedBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start justify-between gap-3 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-800 uppercase tracking-wider block text-[10px]">
                {isFinnish ? 'EcoPilot oppi uuden säännön:' : 'EcoPilot learned:'}
              </span>
              <p className="font-medium text-emerald-950 mt-0.5">&ldquo;{learnedBanner}&rdquo;</p>
            </div>
          </div>
          <button
            onClick={() => setLearnedBanner(null)}
            className="text-emerald-500 hover:text-emerald-800 p-1 rounded-lg hover:bg-emerald-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. CORE CENTERPIECE: "🌱 YOUR BEST ACTION TODAY" */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden text-slate-800 relative">
        {/* Sleek top banner */}
        <div className="bg-emerald-600 px-6 py-2.5 flex items-center justify-between text-white text-[11px] font-bold tracking-wide">
          <span className="flex items-center gap-1.5">
            <span>🌱</span>
            <span>{isFinnish ? 'PÄIVÄN PARAS ILMASTOTEKOSI' : 'YOUR BEST ACTION TODAY'}</span>
          </span>
          <span className="flex items-center gap-1 opacity-90">
            <Clock className="w-3.5 h-3.5" />
            {currentOpportunity.suggestedTime}
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Main Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl shrink-0">
                {currentOpportunity.icon}
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {currentOpportunity.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {currentOpportunity.confidence} CONFIDENCE
                  </span>
                  <span className="text-xs text-slate-500">
                    {isFinnish ? 'Vaivannäkö:' : 'Effort:'} <strong className="text-slate-700">{currentOpportunity.effort}</strong>
                  </span>
                  {negotiatedCompromise && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      Compromise: {negotiatedCompromise}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3 Core Stats (Deterministic values from application data) */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                {isFinnish ? 'Arvioitu säästö' : 'Est. Saving'}
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-700">
                ~€{currentOpportunity.savingEur.toFixed(2)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                {isFinnish ? 'CO₂-vähennys' : 'CO₂ Reduction'}
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-700">
                ↓ ~{currentOpportunity.co2BenefitKg.toFixed(1)} kg
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                {isFinnish ? 'Vaivannäkö' : 'Effort Level'}
              </div>
              <div className="text-lg sm:text-xl font-bold text-slate-800 mt-0.5">
                {currentOpportunity.effort === 'Low' ? (isFinnish ? 'Helppo' : 'Easy') : (isFinnish ? 'Kohtalainen' : 'Moderate')}
              </div>
            </div>
          </div>

          {/* Explanation Quote & Why This Trigger */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-blue-700" />
                <span>{isFinnish ? 'Miksi EcoPilot valitsi tämän?' : 'Why this recommendation?'}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsExplanationOpen(true)}
                className="text-emerald-700 hover:text-emerald-900 font-semibold underline underline-offset-2 flex items-center gap-1 transition"
              >
                <HelpCircle className="w-3 h-3" />
                <span>{isFinnish ? '[Miksi tämä?]' : '[WHY THIS?]'}</span>
              </button>
            </div>
            <p className="text-blue-800 leading-relaxed">
              &ldquo;{currentOpportunity.reason}&rdquo;
            </p>
          </div>

          {/* Accept State or Action Buttons ([DO IT], [NOT TODAY], [WHY THIS?], [MAKE IT EASIER]) */}
          {isAccepted ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-in zoom-in-95 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-base font-bold text-emerald-950 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>{acceptedToast?.message || (isFinnish ? '✓ Hieno valinta!' : '✓ Nice choice!')}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-800 font-medium">
                    <span className="font-bold text-amber-900 bg-amber-100/90 px-2.5 py-0.5 rounded-full">
                      +{acceptedToast?.credits || 12} EcoCredits
                    </span>
                    <span>•</span>
                    <span>{isFinnish ? `Arvioitu vaikutus: ${acceptedToast?.co2Kg || 0.9} kg CO₂` : `Estimated impact: ${acceptedToast?.co2Kg || 0.9} kg CO₂`}</span>
                    <span>•</span>
                    <span>{isFinnish ? `${acceptedToast?.creditsUntilNext || 42} pistettä seuraavaan etuun` : `${acceptedToast?.creditsUntilNext || 42} more EcoCredits until your next reward.`}</span>
                  </div>
                </div>

                {onOpenRewards && (
                  <button
                    type="button"
                    onClick={onOpenRewards}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs shrink-0"
                  >
                    <span>{isFinnish ? '[Katso palkinnot]' : '[View Rewards]'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* [DO IT] Button */}
                <button
                  type="button"
                  onClick={handleAccept}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{isFinnish ? '[TEE TÄMÄ] (DO IT)' : '[DO IT]'}</span>
                </button>

                {/* [NOT TODAY] Button */}
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(true)}
                  className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isFinnish ? '[EI TÄNÄÄN]' : '[NOT TODAY]'}</span>
                </button>

                {/* [MAKE IT EASIER] Button */}
                <button
                  type="button"
                  onClick={() => setIsMakeItEasierOpen(true)}
                  className="px-4 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-xs transition flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-700" />
                  <span>{isFinnish ? '[TEE HELPOMMAKSI]' : '[MAKE IT EASIER]'}</span>
                </button>

                {/* [🔮 What if?] Button (Section 1) */}
                <ContextualWhatIfButton
                  onClick={() => setIsTodayWhatIfOpen(true)}
                  isFinnish={isFinnish}
                  variant="secondary"
                  size="sm"
                />
              </div>

              {/* [WHY THIS?] Button */}
              <button
                type="button"
                onClick={() => setIsExplanationOpen(true)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 underline underline-offset-4 self-start sm:self-auto"
              >
                <span>{isFinnish ? '[MIKSI TÄMÄ?]' : '[WHY THIS?]'}</span>
              </button>
            </div>
          )}

          {/* "Based on" Transparency Footer */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-600">{isFinnish ? 'Perustuu:' : 'Based on:'}</span>
              <span className="flex items-center gap-1 text-emerald-700">✓ Your preferences</span>
              <span className="flex items-center gap-1 text-emerald-700">✓ Public open data</span>
              <span className="flex items-center gap-1 text-emerald-700">✓ Today&apos;s conditions</span>
            </div>
            <span className="text-slate-400 font-mono text-[10px]">
              Fingrid 88% Clean • Spot {observation.currentSpotPriceCents} c/kWh
            </span>
          </div>
        </div>
      </div>

      {/* 3b. DEDICATED GREEN WINDOW CARD (Section 2) */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-6 shadow-sm space-y-4 border border-emerald-800/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                🌱 {isFinnish ? 'VIHREÄ SÄHKÖIKKUNA' : 'GREEN WINDOW TODAY'}
              </span>
              <span className="text-xs text-emerald-300 font-mono font-bold">22:00 - 06:00</span>
            </div>
            <h3 className="text-lg font-black text-white">
              {isFinnish ? 'Yön Puhtaat Tuulitunnit (3.8 c/kWh)' : 'Cleanest Grid Hours Tonight (3.8 c/kWh)'}
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              {isFinnish
                ? 'Suomen tuulivoimatuotanto kiihtyy ja kantaverkon päästöt laskevat 18 g/kWh tasolle. Paras aika EV-lataukselle ja tiskikoneelle.'
                : 'Wind power peaks overnight and grid emission intensity drops to 18 g CO₂/kWh. Ideal for EV charging, dishwashers, and laundry.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <ContextualWhatIfButton
              onClick={() => setIsGreenWindowWhatIfOpen(true)}
              isFinnish={isFinnish}
              variant="pill"
              size="sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center pt-2">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Clean Power Share</span>
            <span className="text-base font-black text-emerald-400">88% Clean</span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Overnight Spot</span>
            <span className="text-base font-black text-amber-300">3.8 c/kWh</span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Grid CO₂</span>
            <span className="text-base font-black text-teal-300">18 g/kWh</span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Convenience</span>
            <span className="text-base font-black text-purple-300">⭐⭐⭐</span>
          </div>
        </div>
      </div>

      {/* 3c. COMPACT ECOCREDITS PROGRESS CARD (Section 6) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm">🌱</span>
            <h3 className="font-extrabold text-sm text-slate-900">
              {isFinnish ? 'EcoCredits' : 'EcoCredits'}
            </h3>
            <span className="font-mono text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              {userProfile.ecoCredits} / 200
            </span>
          </div>
          <p className="text-xs text-slate-600">
            {isFinnish
              ? `${Math.max(0, 200 - userProfile.ecoCredits)} pistettä seuraavaan palkintoon`
              : `${Math.max(0, 200 - userProfile.ecoCredits)} credits until your next reward`}
          </p>
        </div>

        {onOpenRewards && (
          <button
            type="button"
            onClick={onOpenRewards}
            className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs transition flex items-center justify-center gap-1.5 self-start sm:self-auto shadow-xs"
          >
            <span>{isFinnish ? '[Katso palkinnot]' : '[View Rewards]'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
          </button>
        )}
      </div>

      {/* 3d. GROCERY RECEIPT QUICK ESTIMATOR CALLOUT (Demo Step 4) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm">🛒</span>
            <h3 className="font-extrabold text-sm text-slate-900">
              {isFinnish ? 'Ruokakorin Ilmastolaskuri & Kuitit' : 'Grocery Receipt Climate Estimator'}
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            {isFinnish
              ? 'Analysoi ruokaostosten hiilijalanjälki ja kokeile helppoja kasvipohjaisia vaihtoehtoja What-If-kysymyksillä.'
              : 'Estimate grocery category footprints and explore simple plant-based swaps with contextual What-If.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsReceiptScannerOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 self-start sm:self-auto shadow-xs shrink-0"
        >
          <span>{isFinnish ? '[Avaa Kuitin Laskuri]' : '[Open Receipt Estimator]'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3e. USER-SAVED GOALS (Section 14) */}
      {userProfile.savedGoals && userProfile.savedGoals.length > 0 && (
        <div className="rounded-2xl bg-white border border-purple-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-sm text-slate-900">
                {isFinnish ? 'Tallentamasi What-If -tavoitteet' : 'Your Saved What-If Goals'}
              </h3>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
              {userProfile.savedGoals.length} {isFinnish ? 'tavoitetta' : 'active goals'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {userProfile.savedGoals.map((goal) => (
              <div key={goal.id} className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 space-y-1 text-xs">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>{isFinnish && goal.titleFi ? goal.titleFi : goal.title}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ↓ {goal.estimatedCo2KgMonth.toFixed(1)} kg CO₂/mo
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{goal.category} • ~€{goal.estimatedEurMonth.toFixed(1)}/mo saved</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. "EcoPilot is learning" Section */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-sm text-slate-900">
              {isFinnish ? 'EcoPilot oppii arjestasi' : 'EcoPilot is learning'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
          >
            {isFinnish ? 'Muokkaa sääntöjä' : '[Edit preferences]'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
            <span className="font-semibold text-emerald-900">✓ EV charging</span>
            <span className="text-[11px] font-bold text-emerald-800">flexible</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
            <span className="font-semibold text-emerald-900">✓ Dishwasher</span>
            <span className="text-[11px] font-bold text-emerald-800">flexible</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between">
            <span className="font-semibold text-rose-900">✕ Heating</span>
            <span className="text-[11px] font-bold text-rose-800">protected</span>
          </div>
        </div>
      </div>

      {/* 5. Compact Weekly AI Reflection Card */}
      <WeeklyAiReflectionCard
        userProfile={userProfile}
        isFinnish={isFinnish}
        onOpenPreferences={() => setIsProfileModalOpen(true)}
      />

      {/* Modals and Drawers */}
      {/* 1. Reject Reason Modal */}
      <RejectReasonModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        actionId={currentOpportunity.actionId}
        actionTitle={currentOpportunity.title}
        userProfile={userProfile}
        onFeedbackLearnedAndRegenerate={handleFeedbackLearned}
        onOpenMakeItEasier={() => setIsMakeItEasierOpen(true)}
        isFinnish={isFinnish}
      />

      {/* 2. Make It Easier Negotiation Modal */}
      <MakeItEasierModal
        isOpen={isMakeItEasierOpen}
        onClose={() => setIsMakeItEasierOpen(false)}
        actionId={currentOpportunity.actionId}
        actionTitle={currentOpportunity.title}
        originalTime={currentOpportunity.suggestedTime}
        originalEur={currentOpportunity.savingEur}
        originalCo2Kg={currentOpportunity.co2BenefitKg}
        userProfile={userProfile}
        observation={observation}
        onSelectEasierOption={handleSelectEasierOption}
        isFinnish={isFinnish}
      />

      {/* 3. "Why am I seeing this?" Explanation Drawer */}
      <ExplanationDrawer
        isOpen={isExplanationOpen}
        onClose={() => setIsExplanationOpen(false)}
        actionId={currentOpportunity.actionId}
        actionTitle={`${currentOpportunity.icon} ${currentOpportunity.title}`}
        userProfile={userProfile}
        observation={observation}
        onOpenDataSources={onOpenDataSources}
        onOpenCalculationEngine={onOpenCalculationEngine}
        isFinnish={isFinnish}
      />

      {/* 4. Natural Language Preference Extractor Modal */}
      <PreferenceExtractorModal
        isOpen={isPreferenceExtractorOpen}
        onClose={() => setIsPreferenceExtractorOpen(false)}
        userProfile={userProfile}
        onApplyPreferences={onUpdateProfile}
        isFinnish={isFinnish}
      />

      {/* 5. Grounded Natural Language Assistant ("Ask EcoPilot") */}
      <AskEcoPilotDrawer
        isOpen={isAskAssistantOpen}
        onClose={() => setIsAskAssistantOpen(false)}
        userProfile={userProfile}
        observation={observation}
        isFinnish={isFinnish}
      />

      {/* 6. Profile Customizer Modal */}
      <ProfileCustomizerModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={userProfile}
        onSaveProfile={onUpdateProfile}
        isFinnish={isFinnish}
      />

      {/* 7. Today What-If Modal */}
      <ContextualWhatIfModal
        isOpen={isTodayWhatIfOpen}
        onClose={() => setIsTodayWhatIfOpen(false)}
        context="today"
        userProfile={userProfile}
        observation={observation}
        onSaveGoal={onSaveGoal}
        onOpenAskAssistant={(query, title) => {
          setIsAskAssistantOpen(true);
        }}
        isFinnish={isFinnish}
      />

      {/* 8. Green Window What-If Modal */}
      <ContextualWhatIfModal
        isOpen={isGreenWindowWhatIfOpen}
        onClose={() => setIsGreenWindowWhatIfOpen(false)}
        context="green-window"
        userProfile={userProfile}
        observation={observation}
        onSaveGoal={onSaveGoal}
        onOpenAskAssistant={(query, title) => {
          setIsAskAssistantOpen(true);
        }}
        isFinnish={isFinnish}
      />

      {/* 9. Receipt / Grocery Scanner Modal */}
      <ReceiptScannerModal
        isOpen={isReceiptScannerOpen}
        onClose={() => setIsReceiptScannerOpen(false)}
        userProfile={userProfile}
        observation={observation}
        onSaveGoal={onSaveGoal}
        onOpenAskAssistant={(query, title) => {
          setIsAskAssistantOpen(true);
        }}
        isFinnish={isFinnish}
      />
    </div>
  );
};
