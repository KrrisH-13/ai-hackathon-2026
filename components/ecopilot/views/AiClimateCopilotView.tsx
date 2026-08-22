"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Zap, RotateCw, Copy, CheckCircle, Building2, Compass, ArrowRight, Target, Plus } from "lucide-react";
import type { UserProfile, Season, ChatMessage, EcopilotTab, TodaysActionResult } from "@/lib/ecopilot/types";
import { CO2_LOG_CATEGORIES } from "@/lib/ecopilot/types";
import { chatWithClimateAssistantAPI, getTodaysActionAPI } from "@/lib/ecopilot/client";
import { addCo2LogAPI } from "@/lib/ecopilot/profileClient";
import { SEASONAL_PRESETS } from "@/lib/ecopilot/data";

interface AiClimateCopilotViewProps {
  userProfile: UserProfile;
  currentSeason: Season;
  /** Real current outdoor temperature (or a seasonal mock fallback) — see EcopilotApp. */
  outdoorTempCelsius: number;
  isFinnish: boolean;
  onNavigateTab: (tab: EcopilotTab) => void;
}

export function AiClimateCopilotView({ userProfile, currentSeason, outdoorTempCelsius, isFinnish, onNavigateTab }: AiClimateCopilotViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: isFinnish
        ? `Tervehdys, ${userProfile.name}! Olen **eCopilot**, tekoälypohjainen arjen ilmastoapurisi Espoossa.

Olen räätälöity suomalaiseen asumiseen ja Espoon **Hiilineutraali 2030** -tiekarttaan. Autan sinua optimoimaan:
- ⚡ **Pörssisähkön ja saunan** ajoituksen edullisimmille ja puhtaimmille tunneille
- ❄️ **Lämmitysratkaisut** (${userProfile.heatingSystem}) kaamospakkasista kesähelteisiin
- ♻️ **HSY:n lajitteluohjeet** ja Mankkaan/Ämmässuon Sortti-asemien säännöt
- 🚆 **HSL-joukkoliikenteen** (Pikaratikka 15, Länsimetro) ja pyöräbaanojen päästönsäästöt
- 🏢 **Taloyhtiöiden energiaremontit** (ARA-tuet, aurinkovoimalat, poistoilman LTO)

Mitä haluaisit tietää tai ratkaista tänään?`
        : `Hello, ${userProfile.name}! I am **eCopilot**, your AI assistant for sustainable living in Finland and the **Carbon-Neutral Espoo 2030** roadmap.

I translate Finnish daily routines into practical, high-impact climate choices for your home in **${userProfile.district.split(" ")[0]}**:
- ⚡ **Nord Pool Spot Electricity & Sauna scheduling** (6-9 kW kiuas optimization)
- ❄️ **Seasonal heating & heat pumps** (${userProfile.heatingSystem})
- ♻️ **HSY regional recycling rules** and Sortti station material cycles
- 🚆 **HSL transit (Pikaratikka 15, Länsimetro)** vs private vehicle commute footprint
- 🏢 **Housing company (taloyhtiö)** solar communities and ARA grants

How can I help power your climate choices today?`,
      timestamp: "Nyt",
      suggestedPrompts: isFinnish
        ? [
            "Milloin kannattaa lämmittää sähkösauna tänään?",
            "Miten lajittelen rasvaiset pizzalaatikot ja maitotölkit?",
            "Miten Microsoftin datakeskusten hukkalämpö leikkaa Espoon päästöjä?",
            "Paljonko säästän jos vaihdan auton Pikaratikkaan 15?",
          ]
        : [
            "When is the cheapest time to heat my sauna tonight?",
            "How do I sort greasy pizza boxes and milk cartons in HSY?",
            "How does Microsoft data center waste heat decarbonize Espoo?",
            "How much CO2 & € do I save switching to Pikaratikka 15?",
          ],
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [todaysAction, setTodaysAction] = useState<TodaysActionResult | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState<boolean>(true);
  const [actionLogged, setActionLogged] = useState<boolean>(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const fetchTodaysAction = async () => {
    setIsLoadingAction(true);
    setActionLogged(false);
    try {
      const result = await getTodaysActionAPI(userProfile, currentSeason, outdoorTempCelsius);
      setTodaysAction(result);
    } finally {
      setIsLoadingAction(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on profile/season change
    fetchTodaysAction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile.id, currentSeason, outdoorTempCelsius]);

  const handleLogTodaysAction = async () => {
    if (!todaysAction) return;
    try {
      const category = CO2_LOG_CATEGORIES.includes(todaysAction.category) ? todaysAction.category : "other";
      await addCo2LogAPI({
        category,
        description: todaysAction.headline,
        co2Kg: -Math.abs(todaysAction.estimatedCo2KgSaved),
      });
      setActionLogged(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || inputPrompt;
    if (!messageText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${messages.length}`,
      role: "user",
      content: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await chatWithClimateAssistantAPI(history, messageText, userProfile, currentSeason);

      const aiMsg: ChatMessage = {
        id: `ai-${messages.length}`,
        role: "assistant",
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedPrompts: response.suggestedFollowUps,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `error-${messages.length}`,
        role: "assistant",
        content: isFinnish
          ? "Pahoittelut, yhteys tekoälypalveluun koki häiriön. Tarkista yhteys ja yritä uudelleen."
          : "Sorry, there was a temporary issue generating a response. Please try again.",
        timestamp: "Error",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const seasonInfo = SEASONAL_PRESETS[currentSeason];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0 border border-emerald-100">
            🏡
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">
              {userProfile.name} • {userProfile.housingType}
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {userProfile.district.split("(")[0]} • {userProfile.heatingSystem.split("(")[0]} • {userProfile.commuteHabit}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/60 to-teal-50/60 border border-emerald-100 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              {isFinnish ? "Nykyinen Kausi" : "Current Season"}
            </span>
            <div className="text-xs font-bold text-emerald-950">{isFinnish ? seasonInfo.nameFi : seasonInfo.nameEn}</div>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-white text-xs font-mono font-bold text-emerald-800 border border-emerald-200 shadow-2xs">
            {outdoorTempCelsius > 0 ? `+${outdoorTempCelsius}°C` : `${outdoorTempCelsius}°C`}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              {isFinnish ? "Espoon 2030 Tiekartta" : "Espoo 2030 Roadmap"}
            </div>
            <div className="text-xs font-bold text-slate-200">
              {isFinnish ? "Tavoite: 2.5 t CO2e / asukas" : "Target: 2.5 t CO2e / resident"}
            </div>
          </div>
          <button
            onClick={() => onNavigateTab("roadmap")}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-white transition flex items-center gap-1"
          >
            <span>{isFinnish ? "Ilmastovahti" : "Climate Watch"}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Today's Best Action — one Gemini-grounded suggestion, real profile + weather + recent CO2 history */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
            <Target className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
              {isFinnish ? "Päivän parhain teko" : "Today's Best Action"}
            </span>
            {isLoadingAction ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-100 mt-0.5">
                <RotateCw className="w-3 h-3 animate-spin" />
                {isFinnish ? "Lasketaan..." : "Thinking..."}
              </div>
            ) : todaysAction ? (
              <>
                <h4 className="text-sm font-black">{todaysAction.headline}</h4>
                <p className="text-[11px] text-emerald-100 leading-relaxed mt-0.5">{todaysAction.reason}</p>
              </>
            ) : (
              <p className="text-xs text-emerald-100 mt-0.5">
                {isFinnish ? "Ei saatavilla juuri nyt." : "Not available right now."}
              </p>
            )}
          </div>
        </div>

        {todaysAction && !isLoadingAction && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-sm font-black">-{todaysAction.estimatedCo2KgSaved.toFixed(1)} kg CO2</div>
              <div className="text-[10px] text-emerald-200">+{todaysAction.estimatedEurSaved.toFixed(2)} €</div>
            </div>
            <button
              onClick={handleLogTodaysAction}
              disabled={actionLogged}
              className="px-3 py-2 rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 disabled:opacity-60 text-xs font-bold transition flex items-center gap-1.5"
            >
              {actionLogged ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>{actionLogged ? (isFinnish ? "Kirjattu!" : "Logged!") : isFinnish ? "Kirjaa" : "Log it"}</span>
            </button>
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((msg) => {
            const isUser = msg.role === "user";

            return (
              <div key={msg.id} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 space-y-2.5 text-xs shadow-xs ${
                    isUser
                      ? "bg-slate-900 text-white rounded-tr-xs"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] opacity-70">
                    <span className="font-bold">{isUser ? userProfile.name : "eCopilot AI"}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div className="leading-relaxed whitespace-pre-line text-xs font-normal">{msg.content}</div>

                  {!isUser && msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 block">
                        {isFinnish ? "Jatka keskustelua:" : "Suggested follow-ups:"}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestedPrompts.map((sp, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(sp)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-medium border border-emerald-100 transition text-left"
                          >
                            {sp}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isUser && (
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(msg.content);
                          setCopiedId(msg.id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>{isFinnish ? "Kopioitu!" : "Copied!"}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>{isFinnish ? "Kopioi vastaus" : "Copy response"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center text-xs text-slate-500 animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <RotateCw className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                {isFinnish
                  ? "eCopilot laskee arjen energiansäästöjä ja Espoon ilmastovaikutuksia..."
                  : "eCopilot is computing daily energy savings and Espoo climate impacts..."}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">
              {isFinnish ? "Pikavalinnat:" : "Shortcuts:"}
            </span>
            <button
              onClick={() => onNavigateTab("energy")}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] whitespace-nowrap flex items-center gap-1 transition"
            >
              <Zap className="w-3 h-3 text-amber-500" />
              <span>{isFinnish ? "Saunan pörssisähkö" : "Sauna Optimizer"}</span>
            </button>
            <button
              onClick={() => onNavigateTab("recycling")}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] whitespace-nowrap flex items-center gap-1 transition"
            >
              <RotateCw className="w-3 h-3 text-teal-600" />
              <span>{isFinnish ? "HSY Jätehaku" : "HSY Waste Guide"}</span>
            </button>
            <button
              onClick={() => onNavigateTab("transit")}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] whitespace-nowrap flex items-center gap-1 transition"
            >
              <Compass className="w-3 h-3 text-blue-600" />
              <span>{isFinnish ? "Pikaratikka 15 vs Auto" : "Pikaratikka vs Car"}</span>
            </button>
            <button
              onClick={() => onNavigateTab("roadmap")}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] whitespace-nowrap flex items-center gap-1 transition"
            >
              <Building2 className="w-3 h-3 text-indigo-600" />
              <span>{isFinnish ? "Espoo 2030 Tiekartta" : "Espoo 2030 Sinks"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <textarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                isFinnish
                  ? "Kysy saunan ajoituksesta, lajittelusta, HSL-matkoista tai taloyhtiön energiaremonteista..."
                  : "Ask about sauna electricity windows, HSY waste rules, HSL transit savings, or housing grants..."
              }
              rows={1}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 resize-none shadow-xs"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputPrompt.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 shrink-0"
            >
              <span>{isFinnish ? "Lähetä" : "Send"}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
