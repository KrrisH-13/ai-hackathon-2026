import React, { useState } from 'react';
import { Send, Sparkles, Brain, MessageSquare, RefreshCw, Database, ShieldCheck } from 'lucide-react';
import { EcoPilotUserProfile } from '../types/user';
import { Season } from '../types/climate';
import { getCurrentObservationSnapshot } from '../services/ecoPilotService';
import { askEcoPilotAssistantWithAI } from '../ai/assistant';
import { CANDIDATE_ACTIONS } from '../data/actions/candidateActions';

interface AiClimateCopilotViewProps {
  userProfile: EcoPilotUserProfile;
  currentSeason: Season;
  isFinnish: boolean;
  onNavigateTab: (tab: any) => void;
}

export const AiClimateCopilotView: React.FC<AiClimateCopilotViewProps> = ({
  userProfile,
  currentSeason,
  isFinnish,
}) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: isFinnish
        ? `Tervehdys ${userProfile.name}! Olen EcoPilot, Espoon arjen ilmastokumppanisi. Voin neuvoa sinua sähkön spot-hinnoissa, saunavuorojen ajoituksessa, HSL-reiteissä ja HSY-lajittelussa. Miten voin auttaa tänään?`
        : `Hello ${userProfile.name}! I am EcoPilot, your grounded climate and energy companion in Espoo. I can answer questions about Nordic spot rates, sauna schedules, HSL zero-emission transit, and HSY recycling. How can I help you today?`,
      time: new Date().toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const observation = getCurrentObservationSnapshot(currentSeason, 21);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputText.trim();
    if (!q) return;

    const time = new Date().toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { sender: 'user', text: q, time }]);
    setInputText('');
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
        },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4 animate-fadeIn flex flex-col h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">
              {isFinnish ? 'EcoPilot Keskustelu' : 'Grounded Climate Copilot'}
            </h3>
            <p className="text-xs text-slate-400">
              {isFinnish ? 'Perustuu Fingridin, Nord Poolin ja HSY:n todennettuun dataan' : 'Grounded in authentic Nordic open data feeds'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in-50 duration-200`}
          >
            <div
              className={`p-4 rounded-2xl max-w-[85%] space-y-1.5 ${
                m.sender === 'user'
                  ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30 font-medium'
                  : 'bg-slate-900/90 text-slate-200 border border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 gap-4">
                <span className="font-bold flex items-center gap-1">
                  {m.sender === 'user' ? userProfile.name : '⚡ EcoPilot AI'}
                </span>
                <span>{m.time}</span>
              </div>
              <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 text-slate-400 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-pink-400" />
              <span>{isFinnish ? 'Tekoäly hakee tietoja...' : 'EcoPilot querying Nordic telemetry & calculations...'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 pt-2 border-t border-white/10">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isFinnish ? 'Kysy energiasta, saunasta tai liikenteestä...' : 'Ask about spot rates, sauna schedule, or transit...'}
          className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-400"
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="px-5 py-3 rounded-2xl bg-pink-500 hover:bg-pink-400 disabled:opacity-40 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-lg shadow-pink-500/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
