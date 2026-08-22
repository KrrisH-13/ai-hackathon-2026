import React, { useState } from 'react';
import { X, Send, Brain, Sparkles, RefreshCw, ShieldCheck, Database, HelpCircle } from 'lucide-react';
import { EcoPilotUserProfile } from '../types/user';
import { ObservationSnapshot } from '../types/recommendation';
import { askEcoPilotAssistantWithAI } from '../ai/assistant';
import { CANDIDATE_ACTIONS } from '../data/actions/candidateActions';
import { AssistantAnswerResult } from '../ai/schemas';

interface AskEcoPilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: EcoPilotUserProfile;
  observation: ObservationSnapshot;
  isFinnish?: boolean;
  initialQuery?: string;
}

const QUICK_QUESTIONS_EN = [
  'Should I run the dishwasher now or later tonight?',
  'Why was EV charging recommended for my home today?',
  'What is the cleanest hour to heat the electric sauna tonight?',
  'How much CO₂ do I save taking Pikaratikka 15 instead of driving?',
];

const QUICK_QUESTIONS_FI = [
  'Kannattaako astianpesukone laittaa päälle nyt vai myöhemmin?',
  'Miksi sähköauton latausta suositeltiin minulle tänään?',
  'Milloin on puhtain ja edullisin aika lämmittää sähkösauna?',
  'Paljonko säästän CO₂-päästöjä kulkemalla Pikaratikka 15:llä?',
];

export const AskEcoPilotDrawer: React.FC<AskEcoPilotDrawerProps> = ({
  isOpen,
  onClose,
  userProfile,
  observation,
  isFinnish = false,
  initialQuery,
}) => {
  const quickQuestions = isFinnish ? QUICK_QUESTIONS_FI : QUICK_QUESTIONS_EN;
  const [query, setQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [conversation, setConversation] = useState<
    Array<{ q: string; a: AssistantAnswerResult; timestamp: string }>
  >([]);

  React.useEffect(() => {
    if (isOpen && initialQuery && initialQuery.trim()) {
      handleAsk(initialQuery);
    }
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  const handleAsk = async (questionText: string) => {
    const q = questionText.trim();
    if (!q) return;

    setIsLoading(true);
    try {
      const result = await askEcoPilotAssistantWithAI({
        query: q,
        userProfile,
        observation,
        candidateActions: CANDIDATE_ACTIONS,
      });

      setConversation((prev) => [
        ...prev,
        {
          q,
          a: result,
          timestamp: new Date().toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setQuery('');
    } catch (err) {
      console.error('Ask EcoPilot error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white border-l border-slate-200 h-full p-6 shadow-2xl flex flex-col justify-between overflow-hidden text-slate-800 space-y-4"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {isFinnish ? 'Kysy EcoPilotilta' : 'Ask EcoPilot'}
              </h3>
              <p className="text-xs text-slate-500">
                {isFinnish
                  ? 'Grounded pohjoismainen ilmastotekoäly — perustuu todennettuun dataan'
                  : 'Data-grounded Nordic AI assistant — does not hallucinate beyond facts'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {conversation.length === 0 ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  {isFinnish ? 'Mitä haluaisit tietää tänään?' : 'What would you like to know today?'}
                </h4>
                <p className="text-slate-500 text-xs max-w-xs mx-auto">
                  {isFinnish
                    ? 'Kysy sähkön puhtaudesta, saunavuoron ajoituksesta tai arjen ilmastoteoista.'
                    : 'Ask about spot electricity rates, sauna timing, transit emissions, or daily actions.'}
                </p>
              </div>

              {/* Quick Questions */}
              <div className="space-y-2 pt-2 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block px-1">
                  {isFinnish ? 'Esimerkkikysymyksiä:' : 'Suggested questions:'}
                </span>
                <div className="space-y-1.5">
                  {quickQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAsk(question)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-slate-700 text-xs font-medium transition flex items-center justify-between group shadow-2xs"
                    >
                      <span>{question}</span>
                      <Send className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            conversation.map((item, idx) => (
              <div key={idx} className="space-y-2 animate-in fade-in-50 duration-200">
                {/* User query */}
                <div className="flex justify-end">
                  <div className="bg-slate-900 text-white p-3 rounded-2xl max-w-[85%] font-medium shadow-xs">
                    {item.q}
                  </div>
                </div>

                {/* Assistant Answer */}
                <div className="flex justify-start">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl max-w-[95%] space-y-3 shadow-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-200 pb-1.5">
                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <Sparkles className="w-3 h-3 text-emerald-600" /> EcoPilot Assistant
                      </span>
                      <span>{item.timestamp}</span>
                    </div>

                    <p className="text-slate-800 leading-relaxed font-normal text-xs whitespace-pre-wrap">
                      {item.a.answer}
                    </p>

                    {/* Sources & Constraints tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.a.dataSourcesUsed.map((src, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-600 flex items-center gap-1 font-mono"
                        >
                          <Database className="w-2.5 h-2.5 text-blue-600" />
                          {src}
                        </span>
                      ))}
                      {item.a.constraintsRespected.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[10px] text-rose-700 flex items-center gap-1 font-mono">
                          <ShieldCheck className="w-2.5 h-2.5 text-rose-600" />
                          Constraints checked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-slate-600">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
              <span className="text-xs">
                {isFinnish ? 'Tarkistetaan tietoja ja laskelmia...' : 'Consulting Nordic data and verified calculations...'}
              </span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-2 border-t border-slate-100 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(query);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isFinnish ? 'Kysy mitä vain arjen ilmastovalinnoista...' : 'Ask anything about your energy, sauna, or commute...'
              }
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 font-sans"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold transition flex items-center justify-center shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
