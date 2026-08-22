"use client";

import { useState } from "react";
import { Compass, Train, Bike, Car, Zap, RotateCw, Sparkles } from "lucide-react";
import type { CommuteComparison } from "@/lib/ecopilot/types";
import { compareCommuteAPI } from "@/lib/ecopilot/client";

interface HslTransitCommuteViewProps {
  isFinnish: boolean;
}

export function HslTransitCommuteView({ isFinnish }: HslTransitCommuteViewProps) {
  const [origin, setOrigin] = useState<string>("Espoon Matinkylä (Iso Omena)");
  const [destination, setDestination] = useState<string>("Otaniemi / Aalto-yliopisto");
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [comparison, setComparison] = useState<CommuteComparison | null>({
    origin: "Matinkylä (Iso Omena)",
    destination: "Otaniemi / Aalto University",
    distanceKm: 8.4,
    modes: [
      {
        name: isFinnish ? "HSL Länsimetro & Pikaratikka 15" : "HSL Metro & Pikaratikka 15",
        icon: "Train",
        durationMins: 14,
        co2Grams: 0,
        costEur: 3.1,
        convenienceScore: 10,
        routeDetails: isFinnish
          ? "Länsimetro Matinkylästä Keilaniemeen -> Pikaratikka 15 Aalto-yliopistolle. 100% uusiutuvaa sähköä."
          : "Länsimetro from Matinkylä to Keilaniemi -> Pikaratikka 15 to Aalto University. 100% renewable power.",
      },
      {
        name: isFinnish ? "Sähköpyörä / Länsibaana" : "E-Bike / Länsibaana Route",
        icon: "Bike",
        durationMins: 22,
        co2Grams: 8,
        costEur: 0.1,
        caloriesBurned: 160,
        convenienceScore: 9,
        routeDetails: isFinnish
          ? "Espoon pääpyöräreitti / Baana merimaisemissa ilman liikenneruuhkia."
          : "Espoo main all-weather Baana bike highway along the coast without traffic jams.",
      },
      {
        name: isFinnish ? "Sähköauto (EV)" : "Electric Vehicle (EV)",
        icon: "Zap",
        durationMins: 16,
        co2Grams: 160,
        costEur: 1.2,
        convenienceScore: 8,
        routeDetails: isFinnish ? "Länsiväylää pitkin Otaniemen liittymään + pysäköinti." : "Via Länsiväylä to Otaniemi exit + campus parking.",
      },
      {
        name: isFinnish ? "Bensiiniauto (ICE)" : "Petrol Car (ICE)",
        icon: "Car",
        durationMins: 18,
        co2Grams: 1420,
        costEur: 3.8,
        convenienceScore: 6,
        routeDetails: isFinnish
          ? "Länsiväylä aamuruuhkassa + maksullinen pysäköinti."
          : "Länsiväylä morning traffic congestion + paid parking ticket.",
      },
    ],
    yearlySavingIfSwitchingToTransit: {
      co2Kg: 624,
      moneyEur: 920,
      treesEquivalent: 31,
    },
  });

  const handleCalculate = async () => {
    if (!origin.trim() || !destination.trim() || isCalculating) return;
    setIsCalculating(true);
    try {
      const res = await compareCommuteAPI(origin, destination);
      setComparison(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalculating(false);
    }
  };

  const PRESET_ROUTES = [
    { from: "Matinkylä (Iso Omena)", to: isFinnish ? "Otaniemi (Aalto-yliopisto)" : "Otaniemi (Aalto University)" },
    { from: "Leppävaara (Sello)", to: "Keilaniemi (Pikaratikka 15)" },
    { from: isFinnish ? "Espoon keskus" : "Espoo Centre", to: isFinnish ? "Helsingin päärautatieasema (E/U-juna)" : "Helsinki Central (E/U Train)" },
    { from: "Tapiola", to: "Ruoholahti / Kamppi (Länsimetro)" },
    { from: "Kivenlahti", to: "Tapiola (Länsimetro)" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 animate-fadeIn">
      <div className="rounded-3xl bg-gradient-to-r from-blue-50/80 via-white to-emerald-50/60 border border-blue-200/80 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
              🚆 {isFinnish ? "HSL & Kestävä Liikkuminen" : "HSL Transit & Green Mobility"}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {isFinnish ? "Pikaratikka 15, Länsimetro & Pyöräbaanat" : "Pikaratikka 15, Länsimetro & Baana"}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isFinnish ? "Työmatkan Hiilijalanjälki- & Kustannusvertailija" : "Commute Carbon & Cost Footprint Comparator"}
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            {isFinnish
              ? "Laske tarkan reitin päästöt ja rahalliset säästöt. Katso miten Pikaratikka 15 ja Länsimetro leikkaavat arjen ruuhkia ja auttavat Espoon 2030 liikenteen päästötavoitetta."
              : "Calculate real journey emissions and financial savings across HSL zero-emission light rail, metro, active cycling, and private car."}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-900 text-white text-center shadow-xs shrink-0">
          <div className="text-xl font-black text-blue-300">-70 000 t</div>
          <div className="text-[10px] font-bold text-slate-300">
            {isFinnish ? "Espoon liikenteen CO2-leikkaus 2030" : "Espoo Transport CO2 Cut Target"}
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Compass className="w-4 h-4 text-blue-600" />
          <span>{isFinnish ? "Määritä työ- tai vapaa-ajan matkasi Espoossa:" : "Enter Your Espoo Journey Route:"}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-5 space-y-1">
            <label className="text-xs font-bold text-slate-700">{isFinnish ? "Lähtöpaikka (Osoite / Kaupunginosa):" : "Origin:"}</label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
              placeholder="esim. Matinkylä, Tapiola, Leppävaara..."
            />
          </div>

          <div className="md:col-span-5 space-y-1">
            <label className="text-xs font-bold text-slate-700">{isFinnish ? "Määränpää:" : "Destination:"}</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
              placeholder="esim. Otaniemi, Keilaniemi, Kamppi..."
            />
          </div>

          <div className="md:col-span-2">
            <button
              onClick={handleCalculate}
              disabled={isCalculating || !origin.trim() || !destination.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm shadow-blue-600/20"
            >
              {isCalculating ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{isFinnish ? "Lasketaan..." : "Analyzing..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  <span>{isFinnish ? "Vertaa" : "Compare"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {isFinnish ? "Suosittuja esimerkkireittejä:" : "Popular Espoo commuter routes:"}
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_ROUTES.map((r, i) => (
              <button
                key={i}
                onClick={() => {
                  setOrigin(r.from);
                  setDestination(r.to);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-900 text-slate-700 text-xs font-medium border border-slate-200 transition"
              >
                {r.from} ➔ {r.to}
              </button>
            ))}
          </div>
        </div>
      </div>

      {comparison && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                {isFinnish ? "Vuotuinen säästöpotentiaali (220 työpäivää):" : "Annual Commuter Savings (220 workdays):"}
              </span>
              <h4 className="text-xl font-black">
                {isFinnish
                  ? `Valitsemalla HSL-joukkoliikenteen auton sijaan reitillä ${comparison.origin} ➔ ${comparison.destination}`
                  : `By choosing HSL transit over private car on ${comparison.origin} ➔ ${comparison.destination}`}
              </h4>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[110px]">
                <div className="text-2xl font-black text-emerald-300">-{comparison.yearlySavingIfSwitchingToTransit.co2Kg} kg</div>
                <div className="text-[10px] text-slate-200 font-bold">CO2e / vuosi</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[110px]">
                <div className="text-2xl font-black text-amber-300">+{comparison.yearlySavingIfSwitchingToTransit.moneyEur} €</div>
                <div className="text-[10px] text-slate-200 font-bold">{isFinnish ? "Rahasäästö" : "Money Saved"}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[110px] hidden sm:block">
                <div className="text-2xl font-black text-white">🌲 {comparison.yearlySavingIfSwitchingToTransit.treesEquivalent}</div>
                <div className="text-[10px] text-slate-200 font-bold">{isFinnish ? "Puuta vastaava" : "Trees equivalent"}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {comparison.modes.map((m, idx) => {
              const isZeroEmission = m.co2Grams === 0;

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-3xl border transition shadow-xs flex flex-col justify-between space-y-4 ${
                    isZeroEmission ? "bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/20" : "bg-white border-slate-200"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-sm ${
                            isZeroEmission ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {m.name.includes("Metro") || m.name.includes("Ratikka") ? (
                            <Train className="w-4 h-4" />
                          ) : m.name.includes("Pyörä") ? (
                            <Bike className="w-4 h-4" />
                          ) : m.name.includes("Sähköauto") ? (
                            <Zap className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Car className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs">{m.name}</h4>
                          <span className="text-[10px] text-slate-500">{m.durationMins} min</span>
                        </div>
                      </div>

                      {isZeroEmission && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-bold">100% Puhdas</span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">{m.routeDetails}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{isFinnish ? "Päästöt / matka:" : "CO2 / trip:"}</span>
                      <span className={`font-black ${isZeroEmission ? "text-emerald-600" : "text-slate-900"}`}>
                        {m.co2Grams} g CO2
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{isFinnish ? "Kustannus / matka:" : "Cost / trip:"}</span>
                      <span className="font-bold text-slate-900">{m.costEur.toFixed(2)} €</span>
                    </div>

                    {m.caloriesBurned && (
                      <div className="flex items-center justify-between text-emerald-700">
                        <span>{isFinnish ? "Kulutus:" : "Calories:"}</span>
                        <span className="font-bold">+{m.caloriesBurned} kcal</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Bike className="w-4 h-4 text-emerald-600" />
          <span>{isFinnish ? "Ympärivuotinen Pyöräily Espoon Baanaverkostolla:" : "Year-Round Cycling on Espoo Baana Network:"}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-900 block">🚲 Nastarenkaat (Studded Tires)</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Nastarenkaat (esim. Suomi Tyres tai Schwalbe) mahdollistavat turvallisen ja liukastumattoman työmatkapyöräilyn peilijäälläkin läpi marras-maaliskuun.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-900 block">🛣️ Harjasuolatut Pääreitit</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Espoo harjasuolaa Länsiväylän rinnakkaisbaanaa ja Tapiola-Otaniemi-Leppävaara -pääyhteyksiä talvisin pitäen ne lumettomina ja sulina.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-900 block">💡 Valot & Heijastimet</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Kaamoksessa valkoinen etuvalo, punainen takavalo ja heijastinliivi tekevät pyöräilijästä näkyvän autoilijoille jopa 300 metrin päästä.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
