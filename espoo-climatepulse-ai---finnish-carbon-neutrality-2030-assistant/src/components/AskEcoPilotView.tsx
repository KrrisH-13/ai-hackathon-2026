import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  RefreshCw,
  Database,
  ShieldCheck,
  Zap,
  Train,
  Apple,
  Gift,
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { EcoPilotUserProfile } from '../types/user';
import { Season } from '../types/climate';
import { getCurrentObservationSnapshot } from '../services/ecoPilotService';
import { askEcoPilotAssistantWithAI } from '../ai/assistant';
import { AssistantResponseResult } from '../ai/schemas';
import { CANDIDATE_ACTIONS } from '../data/actions/candidateActions';

interface AskEcoPilotViewProps {
  userProfile: EcoPilotUserProfile;
  currentSeason: Season;
  isFinnish: boolean;
  initialQuery?: string;
}

interface PromptContextOption {
  contextName: string;
  contextNameFi: string;
  icon: string;
  question: string;
  questionFi: string;
}

const CONTEXTUAL_PROMPT_OPTIONS: PromptContextOption[] = [
  {
    contextName: 'Today',
    contextNameFi: 'Tänään',
    icon: '🌱',
    question: 'What is the easiest meaningful action I can do today?',
    questionFi: 'Mikä on helpoin ja vaikuttavin teko, jonka voin tehdä tänään?',
  },
  {
    contextName: 'Green Window',
    contextNameFi: 'Vihreä Ikkuna',
    icon: '⚡',
    question: 'What if I cannot use the best electricity window tonight?',
    questionFi: 'Mitä jos en voi käyttää yön parasta sähköikkunaa?',
  },
  {
    contextName: 'Transport',
    contextNameFi: 'Liikenne & HSL',
    icon: '🚆',
    question: 'What if I take HSL light rail 15 or metro twice a week?',
    questionFi: 'Mitä jos kuljen pikaratikalla 15 tai metrolla 2 krt viikossa?',
  },
  {
    contextName: 'Receipt & Food',
    contextNameFi: 'Ruoka & Kuitti',
    icon: '📷',
    question: 'What if I swap one meat dinner for Finnish oat protein?',
    questionFi: 'Mitä jos korvaan yhden liha-aterian kotimaisella kauraproteiinilla?',
  },
  {
    contextName: 'Rewards',
    contextNameFi: 'Palkinnot',
    icon: '🎁',
    question: 'What can I do to reach my next prototype reward tier?',
    questionFi: 'Mitä tekoja tarvitsen saavuttaakseni seuraavan palkintotason?',
  },
  {
    contextName: 'Home & Sauna',
    contextNameFi: 'Koti & Sauna',
    icon: '🧖',
    question: 'How do I optimize my electric sauna during wind peaks?',
    questionFi: 'Miten optimoin sähkösaunan tuulivoimahuipuille?',
  },
];

export const AskEcoPilotView: React.FC<AskEcoPilotViewProps> = ({
  userProfile,
  currentSeason,
  isFinnish,
  initialQuery,
}) => {
  const [messages, setMessages] = useState<
    Array<{
      sender: 'user' | 'ai';
      text: string;
      time: string;
      resultData?: AssistantResponseResult;
    }>
  >([
    {
      sender: 'ai',
      text: isFinnish
        ? `Hei ${userProfile.name}! Olen EcoPilot, Espoon arjen tekoälykumppanisi. Ymmärrän asumismuotosi (${userProfile.housingType}), lämmitysjärjestelmäsi (${userProfile.heatingSystem}) sekä Fingridin ja Nord Poolin reaaliaikaiset tilanteet. Mistä haluaisit kysyä tänään?`
        : `Hello ${userProfile.name}! I am EcoPilot, your personal Nordic lifestyle assistant. I understand your profile (${userProfile.housingType}, ${userProfile.district}), learned preferences, and real-time open data from Fingrid and Nord Pool. What would you like to explore today?`,
      time: new Date().toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const observation = getCurrentObservationSnapshot(currentSeason || 'winter', 21);

  const handleAsk = async (queryText: string) => {
    const q = queryText.trim();
    if (!q || isLoading) return;

    const time = new Date().toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { sender: 'user', text: q, time }]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await askEcoPilotAssistantWithAI({
        query: q,
        userProfile,
        observation,
        candidateActions: CANDIDATE_ACTIONS,
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: res.answer,
          time: new Date().toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),
          resultData: res,
        },
      ]);
    } catch (err) {
      console.error('AskEcoPilot error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: isFinnish
            ? 'Pahoittelut, vastausta ei voitu luoda juuri nyt. Kokeile uudelleen tai valitse jokin valmiista kysymyksistä.'
            : 'Sorry, unable to query the assistant right now. Please try one of the prompt suggestions.',
          time: new Date().toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleAsk(initialQuery);
    }
  }, [initialQuery]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn flex flex-col h-[calc(100vh-140px)] min-h-[600px] text-slate-800">
      {/* 1. Header with mental model subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 shrink-0">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-50 text-emerald-800 border border-emerald-200">
              {isFinnish ? 'HENKILÖKOHTAINEN ARJEN AVUSTAJA' : 'GROUNDED CIVIC ASSISTANT'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>💬 {isFinnish ? 'Kysy EcoPilotilta' : 'Ask EcoPilot'}</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {isFinnish
              ? '\"Kysy mitä tahansa arjen valinnoista\" — Perustuu todennettuun kantaverkko- ja avoimeen dataan.'
              : '\"Let me ask\" — Grounded in your lifestyle preferences, open transit data, and deterministic math.'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold border border-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isFinnish ? 'Profiilitietoinen' : 'Context-Aware'}</span>
          </span>
        </div>
      </div>

      {/* 2. Contextual Prompt Chips Banner */}
      <div className="space-y-2 shrink-0">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          {isFinnish ? 'Kokeile kysyä eri aihealueista:' : 'Contextual question suggestions:'}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {CONTEXTUAL_PROMPT_OPTIONS.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAsk(isFinnish ? opt.questionFi : opt.question)}
              className="p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-300 text-left transition flex items-start gap-2 shadow-2xs group"
            >
              <span className="text-base shrink-0">{opt.icon}</span>
              <div className="space-y-0.5 overflow-hidden">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                  {isFinnish ? opt.contextNameFi : opt.contextName}
                </span>
                <p className="text-xs font-semibold text-slate-800 group-hover:text-emerald-950 truncate">
                  {isFinnish ? opt.questionFi : opt.question}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
          >
            <div
              className={`p-4 rounded-3xl max-w-[90%] sm:max-w-[80%] space-y-2.5 ${
                m.sender === 'user'
                  ? 'bg-slate-900 text-white font-medium rounded-tr-xs shadow-xs'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-xs'
              }`}
            >
              {/* Header inside bubble */}
              <div className="flex items-center justify-between gap-4 text-[10px] pb-1 border-b border-slate-100">
                <span className={`font-bold flex items-center gap-1.5 ${m.sender === 'user' ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  <span>{m.sender === 'user' ? userProfile.name : '🌱 EcoPilot Assistant'}</span>
                </span>
                <span className={m.sender === 'user' ? 'text-slate-400' : 'text-slate-400'}>
                  {m.time}
                </span>
              </div>

              {/* Text */}
              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {m.text}
              </p>

              {/* Data Citations / Citations & Grounding metadata */}
              {m.resultData && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] text-slate-500 flex-wrap">
                  <span className="font-semibold text-slate-600">
                    {isFinnish ? 'Tietopohja:' : 'Grounded in:'}{' '}
                    {(m.resultData.dataSourcesUsed || m.resultData.dataSources || []).join(', ')}
                  </span>
                  {m.resultData.isUncertain && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold uppercase text-[9px]">
                      {isFinnish ? 'Epävarma' : 'Uncertain'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center gap-2.5 text-slate-600 text-xs shadow-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>{isFinnish ? 'EcoPilot tutkii tilannetta ja laskee suosituksia...' : 'EcoPilot querying Nordic feeds and reasoning...'}</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(inputQuery);
        }}
        className="flex items-center gap-2 pt-2 border-t border-slate-200 shrink-0"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={
            isFinnish
              ? 'Kysy energiasta, saunasta, liikenteestä tai ruokavalinnoista...'
              : 'Ask about spot rates, sauna timing, HSL commute, or food footprint...'
          }
          className="flex-1 px-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-xs"
        />
        <button
          type="submit"
          disabled={isLoading || !inputQuery.trim()}
          className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <Send className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">{isFinnish ? 'Lähetä' : 'Ask'}</span>
        </button>
      </form>
    </div>
  );
};
