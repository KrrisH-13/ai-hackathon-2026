"use client";

import { useState, useEffect } from "react";
import { Zap, RotateCw, Sparkles, Clock, ShieldCheck } from "lucide-react";
import type { UserProfile, Season, DailyEnergyPlan, SpotPricePoint } from "@/lib/ecopilot/types";
import { SEASONAL_PRESETS } from "@/lib/ecopilot/data";
import { calculateDeterministicHeatingAdjustment } from "@/lib/ecopilot/calculations";
import { optimizeDailyEnergyAPI } from "@/lib/ecopilot/client";
import { DataFreshnessBadge } from "@/components/ecopilot/DataFreshnessBadge";

interface NordPoolEnergyOptimizerViewProps {
  userProfile: UserProfile;
  currentSeason: Season;
  /** Real current outdoor temperature (or a seasonal mock fallback) — see EcopilotApp. */
  outdoorTempCelsius: number;
  /** Today's 24h spot price curve — live prices (porssisahko.net) merged onto the mock curve where available. */
  spotPrices: SpotPricePoint[];
  /** Whether the live spot-price fetch actually succeeded this page load. */
  isLiveSpotPrices: boolean;
  isFinnish: boolean;
}

export function NordPoolEnergyOptimizerView({
  userProfile,
  currentSeason,
  outdoorTempCelsius,
  spotPrices,
  isLiveSpotPrices,
  isFinnish,
}: NordPoolEnergyOptimizerViewProps) {
  const [selectedHour, setSelectedHour] = useState<number>(21);
  const [aiEnergyPlan, setAiEnergyPlan] = useState<DailyEnergyPlan | null>(null);
  const [isComputingPlan, setIsComputingPlan] = useState<boolean>(false);
  const [chartMode, setChartMode] = useState<"co2" | "price" | "dual">("co2");
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const seasonInfo = SEASONAL_PRESETS[currentSeason];

  const fetchDailyPlan = async () => {
    setIsComputingPlan(true);
    try {
      const plan = await optimizeDailyEnergyAPI(userProfile, currentSeason, outdoorTempCelsius, spotPrices);
      setAiEnergyPlan(plan);
    } catch (err) {
      console.error(err);
    } finally {
      setIsComputingPlan(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on profile/season change
    fetchDailyPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile.id, currentSeason, outdoorTempCelsius, spotPrices]);

  const chosenHourPoint = spotPrices.find((p) => p.hour === selectedHour) || spotPrices[21] || spotPrices[0];
  const activeHoverPoint = hoveredHour !== null ? spotPrices.find((p) => p.hour === hoveredHour) : null;
  const activePoint = activeHoverPoint || chosenHourPoint;

  // Every 1°C of thermostat reduction, computed deterministically from the profile's living area & season.
  const heatingAdjustment = calculateDeterministicHeatingAdjustment(userProfile.livingAreaSqM, 1, currentSeason);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-50/80 via-white to-emerald-50/60 border border-amber-200/80 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
              ⚡ {isFinnish ? "Nord Pool Pörssisähkö & Lämpö" : "Nord Pool Spot Electricity & Heat"}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {isFinnish ? `Espoo: ${seasonInfo.nameFi}` : `Espoo: ${seasonInfo.nameEn}`}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isFinnish ? "Älykäs Sähkön ja Lämmityksen Arkioptimoija" : "Smart Energy & Heating Daily Optimizer"}
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            {isFinnish
              ? "Yhdistää Nord Pool -tuntihinnat ja suomalaisen asunnon lämmitysjärjestelmän optimaaliseen arkeen."
              : "Syncs hourly Nord Pool spot rates with your Finnish home's heating system for peak savings."}
          </p>
        </div>

        <button
          onClick={fetchDailyPlan}
          disabled={isComputingPlan}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition shadow-sm shrink-0"
        >
          {isComputingPlan ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" />
              <span>{isFinnish ? "Lasketaan..." : "Computing..."}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{isFinnish ? "Päivitä AI-Suositukset" : "Refresh AI Plan"}</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 24-hour CO2 Intensity & Spot Price Interactive Graph */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>{isFinnish ? "24h Sähkön Hinta & Päästökäyrä" : "24h Spot Price & CO₂ Curve"}</span>
                <DataFreshnessBadge
                  freshness={isLiveSpotPrices ? "live" : "reference"}
                  sourceName="porssisahko.net (Finnish day-ahead spot price)"
                  isFinnish={isFinnish}
                />
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isFinnish
                  ? "Hinta on Suomen pörssisähkön päivähinta. Päästökerroin on arvio, ei reaaliaikainen mittaus."
                  : "Price is the real Finnish day-ahead spot rate. CO₂ intensity is a reference estimate, not a live grid measurement."}
              </p>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-[11px] font-bold border border-slate-200 shrink-0 self-start sm:self-auto">
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

          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-slate-500 font-bold">{isFinnish ? "Päästötasot:" : "Grid Zones:"}</span>
              <span className="flex items-center gap-1 text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                &lt; 45 g {isFinnish ? "(Puhdas)" : "(Clean)"}
              </span>
              <span className="flex items-center gap-1 text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                45 - 85 g {isFinnish ? "(Kohtalainen)" : "(Moderate)"}
              </span>
              <span className="flex items-center gap-1 text-rose-800 bg-rose-100/80 px-2 py-0.5 rounded-md">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                &gt; 85 g {isFinnish ? "(Huippukuorma)" : "(Peak)"}
              </span>
            </div>
            <div className="text-slate-500 italic text-[9px]">
              {isFinnish ? "💡 Klikkaa tuntia vaihtaaksesi laskurin aikaa" : "💡 Click any hour on the graph to select it"}
            </div>
          </div>

          {/* Interactive SVG chart */}
          <div className="relative pt-2 pb-1">
            {spotPrices.length > 0 &&
              (() => {
                const maxCo2 = Math.max(160, ...spotPrices.map((p) => p.gridCo2IntensityGramsKwh)) + 15;

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
                const getYPrice = (val: number) => {
                  const maxPrice = Math.max(22, ...spotPrices.map((p) => p.priceCentsKwh)) + 2;
                  return padTop + (1 - Math.max(0, val) / maxPrice) * plotH;
                };

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
                    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-48 sm:h-56 overflow-visible select-none">
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

                      {(chartMode === "co2" || chartMode === "dual") && (
                        <>
                          <rect
                            x={padLeft}
                            y={padTop}
                            width={plotW}
                            height={Math.max(0, getYCo2(85) - padTop)}
                            fill="#fee2e2"
                            fillOpacity="0.35"
                          />
                          <rect
                            x={padLeft}
                            y={getYCo2(85)}
                            width={plotW}
                            height={Math.max(0, getYCo2(45) - getYCo2(85))}
                            fill="#fef3c7"
                            fillOpacity="0.35"
                          />
                          <rect
                            x={padLeft}
                            y={getYCo2(45)}
                            width={plotW}
                            height={Math.max(0, padTop + plotH - getYCo2(45))}
                            fill="#d1fae5"
                            fillOpacity="0.45"
                          />
                        </>
                      )}

                      {[0, 45, 85, 130, Math.round(maxCo2 - 15)].map((tickVal) => {
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
                                fill={p.gridCo2IntensityGramsKwh < 45 ? "#10b981" : p.gridCo2IntensityGramsKwh < 85 ? "#f59e0b" : "#ef4444"}
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
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  activePoint.gridCo2IntensityGramsKwh < 45
                                    ? "bg-emerald-500 text-slate-950"
                                    : activePoint.gridCo2IntensityGramsKwh < 85
                                      ? "bg-amber-400 text-slate-950"
                                      : "bg-rose-500 text-white"
                                }`}
                              >
                                {activePoint.gridCo2IntensityGramsKwh < 45
                                  ? isFinnish
                                    ? "🌱 Puhdas"
                                    : "🌱 Clean"
                                  : activePoint.gridCo2IntensityGramsKwh < 85
                                    ? isFinnish
                                      ? "⚖️ Kohtalainen"
                                      : "⚖️ Moderate"
                                    : isFinnish
                                      ? "⚠️ Huippukuorma"
                                      : "⚠️ High Carbon Peak"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 truncate max-w-md">{activePoint.recommendation}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800 shrink-0">
                          <div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">{isFinnish ? "Päästöt" : "Carbon"}</div>
                            <div className="text-sm font-black text-emerald-400">
                              {activePoint.gridCo2IntensityGramsKwh} <span className="text-[10px] font-normal text-slate-300">g/kWh</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">{isFinnish ? "Spot-hinta" : "Spot Price"}</div>
                            <div className="text-sm font-black text-amber-400">
                              {activePoint.priceCentsKwh} <span className="text-[10px] font-normal text-slate-300">c/kWh</span>
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
                    <p className="text-[11px] text-emerald-800">
                      {isFinnish
                        ? `Puhtain aika ajoittaa suuria kuormia: klo ${cleanestHour.timeLabel} (${cleanestHour.gridCo2IntensityGramsKwh} g CO₂/kWh).`
                        : `Cleanest window for high energy loads: ${cleanestHour.timeLabel} (${cleanestHour.gridCo2IntensityGramsKwh} g CO₂/kWh).`}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedHour(cleanestHour.hour)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] transition shadow-xs shrink-0 self-start sm:self-auto"
                  >
                    ⚡ {isFinnish ? "Valitse Puhtain Tunti" : "Snap to Cleanest Hour"}
                  </button>
                </div>
              );
            })()}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs space-y-1">
              <div className="font-bold text-emerald-950 flex items-center gap-1">
                <span>🧺 Pyykinpesu & Tiskari</span>
              </div>
              <p className="text-[11px] text-emerald-800">{aiEnergyPlan?.laundryWindow || "13:00 - 15:00 (Aurinkotuotannon huippu)"}</p>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs space-y-1">
              <div className="font-bold text-blue-950 flex items-center gap-1">
                <span>🚗 Sähköauton Lataus</span>
              </div>
              <p className="text-[11px] text-blue-800">{aiEnergyPlan?.evChargingWindow || "01:00 - 05:00 (Hinta vain 1.2 c/kWh)"}</p>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs space-y-1">
              <div className="font-bold text-indigo-950 flex items-center gap-1">
                <span>💨 LTO-Ilmanvaihto</span>
              </div>
              <p className="text-[11px] text-indigo-800">{aiEnergyPlan?.ventilationAdjustment || "Sulje kesäohitus pakkasella"}</p>
            </div>
          </div>
        </div>

        {/* Right: Today's Recommended Time Windows */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
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
              {isComputingPlan && <RotateCw className="w-4 h-4 text-slate-400 animate-spin shrink-0" />}
            </div>

            {/* Sauna window */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                  <span>🔥</span>
                  <span>{isFinnish ? "Sauna" : "Sauna"}</span>
                </span>
                <span className="text-sm font-black text-amber-900 text-right">
                  {aiEnergyPlan?.peakSaunaWindow.recommendedTime || (isFinnish ? "klo 21:00 - 22:00" : "21:00 - 22:00")}
                </span>
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                {aiEnergyPlan?.peakSaunaWindow.reason ||
                  (isFinnish
                    ? "Sähkö on tyypillisesti halvempaa ja puhtaampaa illalla klo 21 jälkeen."
                    : "Electricity is typically cheaper and cleaner after 21:00.")}
              </p>
              {aiEnergyPlan?.peakSaunaWindow.savingsEur && (
                <p className="text-[10px] text-amber-700 font-bold">
                  {isFinnish ? "Säästö" : "Savings"}: {aiEnergyPlan.peakSaunaWindow.savingsEur}
                  {aiEnergyPlan.peakSaunaWindow.co2ReductionPercent ? ` · -${aiEnergyPlan.peakSaunaWindow.co2ReductionPercent} CO₂` : ""}
                </p>
              )}
            </div>

            {/* EV charging window */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/80 space-y-1.5">
              <span className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                <span>🚗</span>
                <span>{isFinnish ? "Sähköauton lataus" : "EV Charging"}</span>
              </span>
              <p className="text-[11px] text-blue-900 leading-relaxed">
                {aiEnergyPlan?.evChargingWindow ||
                  (isFinnish ? "01:00 - 05:00 (halvin yöikkuna)" : "01:00 - 05:00 (cheapest overnight window)")}
              </p>
            </div>

            {/* Thermostat optimization — deterministic, not AI-dependent */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 space-y-2">
              <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                <span>🌡️</span>
                <span>{isFinnish ? "Termostaatin optimointi (-1°C)" : "Thermostat Optimization (-1°C)"}</span>
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white border border-emerald-200">
                  <div className="text-sm font-black text-emerald-700">-{heatingAdjustment.heatingKwhSavedPerDay}</div>
                  <div className="text-[9px] text-slate-500 font-bold">kWh / {isFinnish ? "vrk" : "day"}</div>
                </div>
                <div className="p-2 rounded-xl bg-white border border-emerald-200">
                  <div className="text-sm font-black text-emerald-700">-{heatingAdjustment.co2SavedKgPerDay}</div>
                  <div className="text-[9px] text-slate-500 font-bold">kg CO₂ / {isFinnish ? "vrk" : "day"}</div>
                </div>
                <div className="p-2 rounded-xl bg-white border border-emerald-200">
                  <div className="text-sm font-black text-emerald-700">+{heatingAdjustment.costSavedEurPerDay}</div>
                  <div className="text-[9px] text-slate-500 font-bold">€ / {isFinnish ? "vrk" : "day"}</div>
                </div>
              </div>
              <p className="text-[11px] text-emerald-900 leading-relaxed">
                {isFinnish
                  ? `Yhden asteen pudotus juuri nyt (${outdoorTempCelsius}°C ulkona, ${seasonInfo.nameFi.toLowerCase()}) säästää tämän verran arjessa.`
                  : `Dropping the thermostat by 1°C right now (${outdoorTempCelsius}°C outside, ${seasonInfo.nameEn.toLowerCase()}) saves this much in daily use.`}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs space-y-1">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isFinnish ? "Lämmityksen AI-Vinkki:" : "Heating System AI Advice:"}</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">{aiEnergyPlan?.heatPumpTip || seasonInfo.heatPumpSetting}</p>
          </div>
        </div>
      </div>

      {/* Espoo Clean Heating Transition & Fortum Clean Heat Info */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Fortum Espoo Clean Heat
              </span>
              <span className="text-xs text-slate-500 font-medium">Microsoft Datacenter Heat Reuse in Hepokorpi & Kolabacka</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mt-1">
              {isFinnish ? "Miten Espoon Kaukolämpö Muuttuu Hiilineutraaliksi 2030?" : "How Espoo District Heating Achieves Net-Zero by 2030"}
            </h3>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-100 text-center shrink-0">
            <div className="text-xl font-black text-emerald-800">-85%</div>
            <div className="text-[10px] text-emerald-900 font-bold">{isFinnish ? "Kaukolämmön päästöt 2030" : "District Heat Emissions 2030"}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>{isFinnish ? "🖥️ Microsoft Datakeskusten Hukkalämpö" : "🖥️ Microsoft Data Center Waste Heat"}</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {isFinnish
                ? "Espoon Hepokorven ja Kolabackan konesalien tuottama lämpö ohjataan suoraan kaukolämpöverkkoon, kattaen jopa 40% Espoon, Kauniaisten ja Kirkkonummen lämmitystarpeesta."
                : "Excess heat from Microsoft's mega data centers in Hepokorpi & Kolabacka is fed directly into Fortum's district network, covering up to 40% of the entire metropolitan heating demand."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>{isFinnish ? "🌡️ Suomenojan ja Otaniemen Lämpöpumput" : "🌡️ Suomenoja & Otaniemi Heat Pumps"}</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {isFinnish
                ? "Suomenojan jätevedenpuhdistamon ja meriveden lämmöntalteenotto hyödyntää teollisuusmittakaavan lämpöpumppuja korvaten kivihiilen lopullisesti."
                : "Industrial seawater and wastewater heat pumps at Suomenoja and Otaniemi capture low-grade thermal energy to fully phase out fossil coal."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>{isFinnish ? "📉 Asukkaan 1°C Lämpötilasääntö" : "📉 Resident 1°C Temperature Rule"}</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {isFinnish
                ? "Huonelämpötilan laskeminen 21°C:sta 20°C:een säästää 5% koko asunnon lämmitysenergiasta, vähentää pölyisyyttä ja parantaa unen laatua."
                : "Dropping indoor room temperature from 21°C to 20°C (and bedrooms to 18°C) cuts total heating energy by 5%, reduces dust dryness, and improves sleep quality."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
