"use client";

import { useState, useEffect } from "react";
import { Zap, RotateCw, Sparkles, Clock, ShieldCheck } from "lucide-react";
import type { UserProfile, DailyEnergyPlan, SpotPricePoint } from "@/lib/ecopilot/types";
import { calculateDeterministicHeatingAdjustment, calculateDeterministicSaunaImpact } from "@/lib/ecopilot/calculations";
import { optimizeDailyEnergyAPI } from "@/lib/ecopilot/client";
import { InfoHint } from "@/components/ecopilot/InfoHint";
import { ViewHero } from "@/components/ecopilot/ViewHero";

/** Finland's grid runs on nuclear + hydro + wind, so its typical CO2 range sits far below a generic European grid — these bands replace the old EU-generic 45/85 g thresholds. */
const CO2_CLEAN_MAX_G = 20;
const CO2_MODERATE_MAX_G = 40;

/** Cheapest hour within a practical waking-hours window — a 03:00 price dip is the AI's cheapest slot, but nobody saunas at 3am. */
function cheapestHourInRange(points: SpotPricePoint[], minHour: number, maxHour: number): SpotPricePoint | null {
  const inRange = points.filter((p) => p.hour >= minHour && p.hour <= maxHour);
  if (inRange.length === 0) return null;
  return inRange.reduce((best, p) => (p.priceCentsKwh < best.priceCentsKwh ? p : best));
}

interface NordPoolEnergyOptimizerViewProps {
  userProfile: UserProfile;
  /** Real current outdoor temperature (or a fallback) — see EcopilotApp. */
  outdoorTempCelsius: number;
  /** Today's 24h spot price curve — live prices (porssisahko.net) merged onto the mock curve where available. */
  spotPrices: SpotPricePoint[];
  /** Whether the live spot-price fetch actually succeeded this page load. */
  isLiveSpotPrices: boolean;
  /** Whether the live Fingrid grid CO2 intensity fetch actually succeeded this page load. */
  isLiveCo2Intensity: boolean;
  isFinnish: boolean;
}

export function NordPoolEnergyOptimizerView({
  userProfile,
  outdoorTempCelsius,
  spotPrices,
  isLiveCo2Intensity,
  isFinnish,
}: NordPoolEnergyOptimizerViewProps) {
  const [selectedHour, setSelectedHour] = useState<number>(21);
  const [aiEnergyPlan, setAiEnergyPlan] = useState<DailyEnergyPlan | null>(null);
  const [isComputingPlan, setIsComputingPlan] = useState<boolean>(false);
  const [chartMode, setChartMode] = useState<"co2" | "price" | "dual">("dual");
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const fetchDailyPlan = async () => {
    setIsComputingPlan(true);
    try {
      const plan = await optimizeDailyEnergyAPI(userProfile, outdoorTempCelsius, spotPrices);
      setAiEnergyPlan(plan);
    } catch (err) {
      console.error(err);
    } finally {
      setIsComputingPlan(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on profile/weather change
    fetchDailyPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile.id, outdoorTempCelsius, spotPrices]);

  const chosenHourPoint = spotPrices.find((p) => p.hour === selectedHour) || spotPrices[21] || spotPrices[0];
  const activeHoverPoint = hoveredHour !== null ? spotPrices.find((p) => p.hour === hoveredHour) : null;
  const activePoint = activeHoverPoint || chosenHourPoint;

  // Every 1°C of thermostat reduction, computed deterministically from the profile's living area & current outdoor temperature.
  const heatingAdjustment = calculateDeterministicHeatingAdjustment(userProfile.livingAreaSqM, 1, outdoorTempCelsius);

  // Best realistic sauna slot — cheapest/cleanest hour between 08:00-22:00, not just the cheapest hour of the whole day.
  const bestSaunaSlot = cheapestHourInRange(spotPrices, 8, 22);
  const saunaImpact = bestSaunaSlot
    ? calculateDeterministicSaunaImpact(6.8, 75, bestSaunaSlot.priceCentsKwh, bestSaunaSlot.gridCo2IntensityGramsKwh)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <ViewHero
        accent="amber"
        isFinnish={isFinnish}
        storageKey="energy"
        badge={`⚡ ${isFinnish ? "Nord Pool Pörssisähkö & Lämpö" : "Nord Pool Spot Electricity & Heat"}`}
        title={isFinnish ? "Älykäs Sähkön ja Lämmityksen Arkioptimoija" : "Smart Energy & Heating Daily Optimizer"}
        description={
          isFinnish
            ? "Yhdistää Nord Pool -tuntihinnat ja suomalaisen asunnon lämmitysjärjestelmän optimaaliseen arkeen."
            : "Syncs hourly Nord Pool spot rates with your Finnish home's heating system for peak savings."
        }
        actions={
          <span className="text-xs text-slate-500 font-medium px-2.5 py-1.5 rounded-xl bg-white/70 border border-slate-200 shrink-0">
            {isFinnish ? `Espoo: ${outdoorTempCelsius}°C ulkona` : `Espoo: ${outdoorTempCelsius}°C outside`}
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 24-hour CO2 Intensity & Spot Price Interactive Graph */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>{isFinnish ? "24h Sähkön Hinta & Päästökäyrä" : "24h Spot Price & CO₂ Curve"}</span>
                <InfoHint
                  isFinnish={isFinnish}
                  label={isFinnish ? "Tunnin valinta" : "Hour selector"}
                  instruction={
                    isFinnish
                      ? "Klikkaa mitä tahansa tunnin palkkia valitaksesi sen laskuriin. Vihreä = puhdas ja edullinen tunti isoille kuormille (sauna, pyykki, auton lataus), punainen = huippukuorma."
                      : "Click any hour bar to select it for the calculator. Green = a clean, cheap hour for heavy loads (sauna, laundry, EV charging); red = peak load."
                  }
                  example={
                    isFinnish
                      ? "Valitse klo 02:00 nähdäksesi yösähkön hinnan ja päästöt"
                      : "Pick 02:00 to see overnight price and emissions"
                  }
                />
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isLiveCo2Intensity
                  ? isFinnish
                    ? "Hinta on Suomen pörssisähkön päivähinta. Päästökerroin on Fingridin todellista dataa: kuluneilta tunneilta tämän päivän oma lukema, loppupäivälle eilisen toteuma samalta kellonajalta (Fingrid ei ennusta tulevaa)."
                    : "Price is the real Finnish day-ahead spot rate. CO₂ intensity is real Fingrid data: today's own reading for hours already passed, yesterday's actual reading at that same hour for the rest of today (Fingrid's feed can't forecast)."
                  : isFinnish
                    ? "Hinta on Suomen pörssisähkön päivähinta. Päästökerroin on arvio, ei Fingridin dataa (aseta FINGRID_API_KEY ottaaksesi Fingridin datan käyttöön)."
                    : "Price is the real Finnish day-ahead spot rate. CO₂ intensity is a reference estimate, not Fingrid data (set FINGRID_API_KEY to enable it)."}
              </p>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200 shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setChartMode("co2")}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  chartMode === "co2" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>🌱 {isFinnish ? "CO₂-Päästöt" : "CO₂ Intensity"}</span>
              </button>
              <button
                onClick={() => setChartMode("price")}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  chartMode === "price" ? "bg-amber-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>⚡ {isFinnish ? "Hinta (c/kWh)" : "Spot Price"}</span>
              </button>
              <button
                onClick={() => setChartMode("dual")}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  chartMode === "dual" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>📊 {isFinnish ? "Kaksoisgraafi" : "Dual View"}</span>
              </button>
            </div>
          </div>

          <p className="text-[12px] text-slate-500 italic bg-slate-50 px-2.5 py-2 rounded-xl border border-slate-200/80">
            {isFinnish ? "💡 Klikkaa tuntia vaihtaaksesi laskurin aikaa" : "💡 Click any hour on the graph to select it"}
          </p>

          {/* Interactive SVG chart */}
          <div className="relative pt-2 pb-1">
            {spotPrices.length > 0 &&
              (() => {
                // Auto-scaled to today's actual data (with a little headroom) instead of a
                // fixed ceiling — a genuinely clean day (single-digit g/kWh) shouldn't get
                // squashed into a sliver at the bottom of a chart sized for a 140g worst case.
                const co2DataMax = Math.max(...spotPrices.map((p) => p.gridCo2IntensityGramsKwh));
                const maxCo2 = co2DataMax + Math.max(co2DataMax * 0.2, 5);
                const co2Ticks = Array.from(
                  new Set([0, Math.round(maxCo2 * 0.25), Math.round(maxCo2 * 0.5), Math.round(maxCo2 * 0.75), Math.round(maxCo2)])
                );

                const priceDataMax = Math.max(...spotPrices.map((p) => p.priceCentsKwh));
                const maxPrice = priceDataMax + Math.max(priceDataMax * 0.15, 1);

                const svgW = 680;
                const svgH = 190;
                const padLeft = 46;
                const padRight = 20;
                const padTop = 20;
                const padBottom = 30;
                const plotW = svgW - padLeft - padRight;
                const plotH = svgH - padTop - padBottom;

                const getX = (hour: number) => padLeft + (hour / 23) * plotW;
                const getYCo2 = (val: number) => padTop + (1 - Math.max(0, val) / maxCo2) * plotH;
                const getYPrice = (val: number) => padTop + (1 - Math.max(0, val) / maxPrice) * plotH;

                const points = spotPrices.map((p) => ({ x: getX(p.hour), y: getYCo2(p.gridCo2IntensityGramsKwh), p }));

                let co2PathD = `M ${points[0].x} ${points[0].y}`;
                for (let i = 0; i < points.length - 1; i++) {
                  const p0 = points[i];
                  const p1 = points[i + 1];
                  const mx = (p0.x + p1.x) / 2;
                  co2PathD += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
                }
                const co2AreaD = `${co2PathD} L ${points[points.length - 1].x} ${padTop + plotH} L ${points[0].x} ${padTop + plotH} Z`;

                return (
                  <div className="relative">
                    <svg
                      viewBox={`0 0 ${svgW} ${svgH}`}
                      preserveAspectRatio="none"
                      className="w-full h-48 sm:h-56 overflow-visible select-none"
                    >
                      <defs>
                        <linearGradient id="co2AreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                          <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                        </linearGradient>
                        <linearGradient id="co2LineGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#059669" />
                          <stop offset="50%" stopColor="#0284c7" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                      </defs>

                      {co2Ticks.map((tickVal) => {
                        const yPos = getYCo2(tickVal);
                        if (yPos < padTop || yPos > padTop + plotH) return null;
                        return (
                          <g key={tickVal}>
                            <line x1={padLeft} y1={yPos} x2={padLeft + plotW} y2={yPos} stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
                            <text x={padLeft - 6} y={yPos + 3} textAnchor="end" fontSize="9" fontWeight="bold" fill="#64748b">
                              {tickVal} g
                            </text>
                          </g>
                        );
                      })}

                      {(chartMode === "price" || chartMode === "dual") && (
                        <g opacity={chartMode === "dual" ? "0.45" : "1.0"}>
                          {spotPrices.map((p) => {
                            const barX = getX(p.hour) - plotW / 23 / 2 + 2;
                            const barW = Math.max(4, plotW / 23 - 4);
                            const barY = getYPrice(p.priceCentsKwh);
                            const barH = Math.max(4, padTop + plotH - barY);
                            const isSelected = selectedHour === p.hour;
                            const fillColor = p.priceCentsKwh < 5 ? "#10b981" : p.priceCentsKwh < 10 ? "#f59e0b" : "#ef4444";

                            return (
                              <rect
                                key={`bar-${p.hour}`}
                                x={barX}
                                y={barY}
                                width={barW}
                                height={barH}
                                rx="3"
                                fill={fillColor}
                                className="cursor-pointer transition hover:opacity-80"
                                onClick={() => setSelectedHour(p.hour)}
                                onMouseEnter={() => setHoveredHour(p.hour)}
                                onMouseLeave={() => setHoveredHour(null)}
                                stroke={isSelected ? "#0f172a" : "none"}
                                strokeWidth={isSelected ? "2" : "0"}
                              />
                            );
                          })}
                        </g>
                      )}

                      {(chartMode === "co2" || chartMode === "dual") && (
                        <>
                          <path d={co2AreaD} fill="url(#co2AreaGradient)" />
                          <path d={co2PathD} fill="none" stroke="url(#co2LineGradient)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                        </>
                      )}

                      <line
                        x1={getX(selectedHour)}
                        y1={padTop}
                        x2={getX(selectedHour)}
                        y2={padTop + plotH}
                        stroke="#0f172a"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                      />

                      {spotPrices.map((p) => {
                        const cx = getX(p.hour);
                        const cy = getYCo2(p.gridCo2IntensityGramsKwh);
                        const isSelected = selectedHour === p.hour;
                        const isHovered = hoveredHour === p.hour;

                        return (
                          <g
                            key={`point-${p.hour}`}
                            className="cursor-pointer group"
                            onClick={() => setSelectedHour(p.hour)}
                            onMouseEnter={() => setHoveredHour(p.hour)}
                            onMouseLeave={() => setHoveredHour(null)}
                          >
                            <rect x={cx - plotW / 46} y={padTop} width={plotW / 23} height={plotH} fill="transparent" />

                            {(chartMode === "co2" || chartMode === "dual") && (
                              <circle
                                cx={cx}
                                cy={cy}
                                r={isSelected ? 6.5 : isHovered ? 5.5 : 3.5}
                                fill={
                                  p.gridCo2IntensityGramsKwh < CO2_CLEAN_MAX_G
                                    ? "#10b981"
                                    : p.gridCo2IntensityGramsKwh < CO2_MODERATE_MAX_G
                                      ? "#f59e0b"
                                      : "#ef4444"
                                }
                                stroke="#ffffff"
                                strokeWidth={isSelected || isHovered ? "2.5" : "1.5"}
                                className="transition-all duration-150"
                              />
                            )}

                            {p.hour % 3 === 0 && (
                              <text
                                x={cx}
                                y={padTop + plotH + 16}
                                textAnchor="middle"
                                fontSize="10"
                                fontWeight={isSelected ? "bold" : "500"}
                                fill={isSelected ? "#0f172a" : "#64748b"}
                              >
                                {p.hour < 10 ? `0${p.hour}` : p.hour}:00
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>

                    {activePoint && (
                      <div className="mt-2 p-3 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-sm">
                            {activePoint.hour}:00
                          </div>
                          <div>
                            <div className="text-xs font-extrabold flex items-center gap-2">
                              <span>{activePoint.timeLabel}</span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[12px] font-bold ${
                                  activePoint.gridCo2IntensityGramsKwh < CO2_CLEAN_MAX_G
                                    ? "bg-emerald-500 text-slate-950"
                                    : activePoint.gridCo2IntensityGramsKwh < CO2_MODERATE_MAX_G
                                      ? "bg-amber-400 text-slate-950"
                                      : "bg-rose-500 text-white"
                                }`}
                              >
                                {activePoint.gridCo2IntensityGramsKwh < CO2_CLEAN_MAX_G
                                  ? isFinnish
                                    ? "🌱 Puhdas"
                                    : "🌱 Clean"
                                  : activePoint.gridCo2IntensityGramsKwh < CO2_MODERATE_MAX_G
                                    ? isFinnish
                                      ? "⚖️ Kohtalainen"
                                      : "⚖️ Moderate"
                                    : isFinnish
                                      ? "⚠️ Huippukuorma"
                                      : "⚠️ High Carbon Peak"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 truncate max-w-md">{activePoint.recommendation}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800 shrink-0">
                          <div>
                            <div className="text-[12px] text-slate-400 font-bold uppercase">{isFinnish ? "Päästöt" : "Carbon"}</div>
                            <div className="text-sm font-black text-emerald-400">
                              {activePoint.gridCo2IntensityGramsKwh} <span className="text-[12px] font-normal text-slate-300">g/kWh</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-[12px] text-slate-400 font-bold uppercase">{isFinnish ? "Spot-hinta" : "Spot Price"}</div>
                            <div className="text-sm font-black text-amber-400">
                              {activePoint.priceCentsKwh} <span className="text-[12px] font-normal text-slate-300">c/kWh</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
          </div>

          {/* Grid Analytics Summary Strip */}
          {spotPrices.length > 0 &&
            (() => {
              const avgCo2 = Math.round(spotPrices.reduce((acc, curr) => acc + curr.gridCo2IntensityGramsKwh, 0) / spotPrices.length);
              const cleanestHour = [...spotPrices].sort((a, b) => a.gridCo2IntensityGramsKwh - b.gridCo2IntensityGramsKwh)[0];

              return (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{isFinnish ? `Vuorokauden keskimääräinen CO₂: ${avgCo2} g/kWh` : `24h average grid CO₂: ${avgCo2} g/kWh`}</span>
                    </div>
                    <p className="text-xs text-emerald-800">
                      {isFinnish
                        ? `Puhtain aika ajoittaa suuria kuormia: klo ${cleanestHour.timeLabel} (${cleanestHour.gridCo2IntensityGramsKwh} g CO₂/kWh).`
                        : `Cleanest window for high energy loads: ${cleanestHour.timeLabel} (${cleanestHour.gridCo2IntensityGramsKwh} g CO₂/kWh).`}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedHour(cleanestHour.hour)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition shadow-xs shrink-0 self-start sm:self-auto"
                  >
                    ⚡ {isFinnish ? "Valitse Puhtain Tunti" : "Snap to Cleanest Hour"}
                  </button>
                </div>
              );
            })()}
        </div>

        {/* Right: Today's Recommended Time Windows */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {isFinnish ? "Päivän Parhaat Ajankohdat" : "Today's Optimal Time Windows"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isFinnish ? "Pörssisähkön hinnan ja sään perusteella" : "Based on today's spot price & weather"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchDailyPlan}
              disabled={isComputingPlan}
              title={isFinnish ? "Päivitä AI-suositukset" : "Refresh AI plan"}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-[12px] font-bold transition shrink-0"
            >
              {isComputingPlan ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span>{isFinnish ? "Päivitä" : "Refresh"}</span>
            </button>
          </div>

          {/* EV charging window — mobility, not housing, kept separate from the section below */}
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/80 space-y-1.5">
            <span className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
              <span>🚗</span>
              <span>{isFinnish ? "Sähköauton lataus" : "EV Charging"}</span>
            </span>
            <p className="text-xs text-blue-900 leading-relaxed">
              {aiEnergyPlan?.evChargingWindow ||
                (isFinnish ? "01:00 - 05:00 (halvin yöikkuna)" : "01:00 - 05:00 (cheapest overnight window)")}
            </p>
          </div>

          {/* Housing, sauna & heating advice — one section for every home-related recommendation */}
          <div className="p-4 rounded-2xl bg-white border-2 border-amber-200 space-y-4">
            <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>🏠</span>
              <span>{isFinnish ? "Asumisen, saunan & lämmityksen vinkit" : "Housing, Sauna & Heating Advice"}</span>
            </span>

            {/* Sauna window — cheapest/cleanest hour within realistic waking hours, not just the day's cheapest hour */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                  <span>🔥</span>
                  <span>{isFinnish ? "Sauna (klo 08–22)" : "Sauna (08:00–22:00)"}</span>
                </span>
                {bestSaunaSlot && (
                  <span className="text-sm font-black text-amber-900 text-right">
                    {String(bestSaunaSlot.hour).padStart(2, "0")}:00
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                {bestSaunaSlot
                  ? isFinnish
                    ? `Halvin ja puhtain realistinen sauna-aika normaalien heräämisaikojen sisällä: ${bestSaunaSlot.priceCentsKwh} c/kWh, ${bestSaunaSlot.gridCo2IntensityGramsKwh} g CO₂/kWh.`
                    : `The cheapest, cleanest realistic sauna slot within normal waking hours: ${bestSaunaSlot.priceCentsKwh} c/kWh, ${bestSaunaSlot.gridCo2IntensityGramsKwh} g CO₂/kWh.`
                  : aiEnergyPlan?.peakSaunaWindow.reason ||
                    (isFinnish
                      ? "Sähkö on tyypillisesti halvempaa ja puhtaampaa illalla klo 21 jälkeen."
                      : "Electricity is typically cheaper and cleaner after 21:00.")}
              </p>
              {saunaImpact && (
                <p className="text-[12px] text-amber-700 font-bold">
                  {isFinnish ? "Säästö iltahuippuun verrattuna" : "Savings vs. evening peak"}: +
                  {saunaImpact.shiftComparison.costDifferenceEur} € · -{saunaImpact.shiftComparison.co2DifferenceKg} kg CO₂
                </p>
              )}
            </div>

            {/* Thermostat optimization — deterministic, not AI-dependent */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 space-y-2">
              <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                <span>🌡️</span>
                <span>{isFinnish ? "Termostaatin optimointi (-1°C)" : "Thermostat Optimization (-1°C)"}</span>
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white border border-emerald-200">
                  <div className="text-sm font-black text-emerald-700">-{heatingAdjustment.heatingKwhSavedPerDay}</div>
                  <div className="text-[12px] text-slate-500 font-bold">kWh / {isFinnish ? "vrk" : "day"}</div>
                </div>
                <div className="p-2 rounded-xl bg-white border border-emerald-200">
                  <div className="text-sm font-black text-emerald-700">-{heatingAdjustment.co2SavedKgPerDay}</div>
                  <div className="text-[12px] text-slate-500 font-bold">kg CO₂ / {isFinnish ? "vrk" : "day"}</div>
                </div>
                <div className="p-2 rounded-xl bg-white border border-emerald-200">
                  <div className="text-sm font-black text-emerald-700">+{heatingAdjustment.costSavedEurPerDay}</div>
                  <div className="text-[12px] text-slate-500 font-bold">€ / {isFinnish ? "vrk" : "day"}</div>
                </div>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                {isFinnish
                  ? `Yhden asteen pudotus juuri nyt (${outdoorTempCelsius}°C ulkona) säästää tämän verran arjessa.`
                  : `Dropping the thermostat by 1°C right now (${outdoorTempCelsius}°C outside) saves this much in daily use.`}
              </p>
            </div>

            {/* Heat pump + ventilation tips */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <p className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900">🌡️ {isFinnish ? "Lämpöpumppu: " : "Heat pump: "}</span>
                {aiEnergyPlan?.heatPumpTip ||
                  (isFinnish
                    ? "Pidä ilmalämpöpumppu jatkuvalla HEAT-tilalla kiinteällä puhallusnopeudella."
                    : "Keep the heat pump on continuous HEAT mode (never AUTO) with a fixed fan speed.")}
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900">💨 {isFinnish ? "Ilmanvaihto: " : "Ventilation: "}</span>
                {aiEnergyPlan?.ventilationAdjustment ||
                  (isFinnish ? "Sulje LTO-laitteen kesäohitus pakkasella." : "Close the HRV summer bypass in freezing weather.")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
