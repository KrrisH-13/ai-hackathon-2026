"use client";

import { useState } from "react";
import { ShieldCheck, ExternalLink } from "lucide-react";
import type { EspooRoadmapMeasure } from "@/lib/ecopilot/types";
import { ESPOO_2030_ROADMAP_MEASURES } from "@/lib/ecopilot/data";

interface EspooClimateWatch2030ViewProps {
  isFinnish: boolean;
}

const DISTRICT_HIGHLIGHTS = (isFinnish: boolean) => [
  {
    name: "Suur-Tapiola & Otaniemi",
    flagship: "Aalto University & VTT CleanTech Hub",
    description: isFinnish
      ? "Syvämaalämmön testikentät, Otaniemen innovaatioklusteri ja Länsimetron + Pikaratikan solmukohta."
      : "Deep geothermal test wells, Otaniemi clean-tech innovation cluster, and Länsimetro + Pikaratikka light rail transit nexus.",
    emissionsCut: "-72%",
  },
  {
    name: "Suur-Leppävaara & Kera",
    flagship: "Kera Zero-Emission Circular District",
    description: isFinnish
      ? "Entisen logistiikka-alueen muutos 14 000 asukkaan kiertotalouskaupunginosaksi puurakentamisella."
      : "Transformation of former logistics halls into a 14,000-resident circular wooden neighborhood with shared microgrids.",
    emissionsCut: "-66%",
  },
  {
    name: "Suur-Matinkylä & Olari",
    flagship: "Iso Omena Thermal Loop & Metro",
    description: isFinnish
      ? "Kauppakeskuksen lauhdelämmön kierrätys ja tiivis joukkoliikennekaupunki."
      : "Shopping mall condensation heat recycling into district grid and transit-oriented dense community living.",
    emissionsCut: "-69%",
  },
  {
    name: "Pohjois-Espoo & Nuuksio",
    flagship: isFinnish ? "Nuuksion Soidensuojelu & Hiilinielut" : "Nuuksio Peatland Restoration & Carbon Sinks",
    description: isFinnish
      ? "Ojitettujen soiden ennallistaminen ja jatkuvan kasvatuksen metsänhoito hiilensidontaan."
      : "Rewetting historic drained peatlands and continuous-cover forestry for long-term biological carbon sequestration.",
    emissionsCut: isFinnish ? "-80% (Nielut)" : "-80% (Sinks)",
  },
];

export function EspooClimateWatch2030View({ isFinnish }: EspooClimateWatch2030ViewProps) {
  const [selectedSector, setSelectedSector] = useState<string>("All");
  const [activeMeasure, setActiveMeasure] = useState<EspooRoadmapMeasure | null>(ESPOO_2030_ROADMAP_MEASURES[0]);

  const sectors = ["All", "District Heating", "Transport & Mobility", "Electricity & Energy", "Circular Economy", "Carbon Sinks & Nature"];

  const filteredMeasures =
    selectedSector === "All"
      ? ESPOO_2030_ROADMAP_MEASURES
      : ESPOO_2030_ROADMAP_MEASURES.filter((m) => m.sector === selectedSector);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 animate-fadeIn">
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 space-y-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                🌱 {isFinnish ? "Hiilineutraali Espoo 2030 -tiekartta" : "Carbon-Neutral Espoo 2030 Roadmap"}
              </span>
              <span className="text-xs text-slate-400">
                {isFinnish ? "Espoon kaupungin valtuuston hyväksymä tavoite" : "City of Espoo Strategic Mandate"}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isFinnish ? "Espoon Ilmastovahti & Päästövähennysseuraaja" : "Espoo Climate Watch & 2030 Progress Tracker"}
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {isFinnish
                ? "Espoo etenee kohti hiilineutraaliutta vuoteen 2030 mennessä. Ilmastovahti mahdollistaa toimenpiteiden, päästövähennysskenaarioiden ja asukkaiden arjen ilmastovalintojen reaaliaikaisen seurannan."
                : "Espoo is advancing towards carbon neutrality by 2030. The Climate Watch service allows residents, decision-makers, and industry partners to monitor decarbonization measures and emissions trajectories."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
              <div className="text-2xl font-black text-emerald-400">-68%</div>
              <div className="text-[10px] text-slate-400 font-bold">{isFinnish ? "Päästöt nyt vs 1990" : "Emissions vs 1990"}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
              <div className="text-2xl font-black text-blue-400">2.5 t</div>
              <div className="text-[10px] text-slate-400 font-bold">{isFinnish ? "Tavoite / asukas 2030" : "2030 Target / Resident"}</div>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">
              {isFinnish ? "Kokonaispäästöjen vähennyspolku (1990 ➔ 2030):" : "City-wide Emissions Reduction Path (1990 ➔ 2030):"}
            </span>
            <span className="font-extrabold text-emerald-400">68% / 80% {isFinnish ? "tavoitteesta saavutettu" : "target achieved"}</span>
          </div>

          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-1000" style={{ width: "85%" }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {isFinnish ? "Tiekartan Avaintotetukset:" : "Strategic Roadmap Measures:"}
              </h3>
              <p className="text-xs text-slate-500">
                {isFinnish ? "Valitse hanke tarkastellaksesi sen asukasvaikutuksia" : "Select a measure to inspect resident impact"}
              </p>
            </div>

            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? (isFinnish ? "Kaikki sektorit" : "All sectors") : s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {filteredMeasures.map((m) => {
              const isSelected = activeMeasure?.id === m.id;

              return (
                <div
                  key={m.id}
                  onClick={() => setActiveMeasure(m)}
                  className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                    isSelected ? "bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20" : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase text-emerald-800">{m.sector}</span>
                      <h4 className="text-xs font-extrabold text-slate-900 leading-snug">{m.title}</h4>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                        m.status === "accelerated" ? "bg-emerald-600 text-white" : m.status === "achieved" ? "bg-blue-600 text-white" : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                    <span>Kumppani: {m.leadPartner.split("&")[0]}</span>
                    <span className="font-bold text-slate-900">
                      -{m.currentEmissionsReductionKtons}k / {m.targetEmissionsReductionKtons}k t CO2
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
          {activeMeasure ? (
            <div className="space-y-5">
              <div className="space-y-2 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                    {activeMeasure.sector}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">
                    Päästövähennys: -{activeMeasure.targetEmissionsReductionKtons} 000 tonnia CO2e
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">{activeMeasure.title}</h3>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-900">{isFinnish ? "Hankkeen Kuvaus & Ratkaisu:" : "Measure Description:"}</div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{activeMeasure.description}</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{isFinnish ? "Mitä tämä tarkoittaa espoolaiselle asukkaalle?" : "Resident Practical Impact:"}</span>
                  </div>
                  <p className="text-emerald-900 leading-relaxed text-[11px]">{activeMeasure.residentImpact}</p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
                  <div className="font-bold text-blue-950">{isFinnish ? "Yhteistyökumppanit & Johtovastuu:" : "Lead Partners:"}</div>
                  <p className="text-blue-900 text-[11px]">{activeMeasure.leadPartner}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-12">{isFinnish ? "Valitse toimenpide listasta" : "Select a measure to view details"}</div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              {isFinnish ? "Lähde: Espoon kaupungin Ilmastovahti 2026" : "Source: City of Espoo Climate Watch 2026"}
            </span>
            <a
              href="https://ilmastovahti.espoo.fi"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 font-bold flex items-center gap-1 hover:underline"
            >
              <span>ilmastovahti.espoo.fi</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="space-y-1 pb-4 border-b border-slate-100">
          <h3 className="text-lg font-extrabold text-slate-900">
            {isFinnish ? "Espoon Suuralueiden Ilmastolippulaivat:" : "Espoo District Climate Flagships:"}
          </h3>
          <p className="text-xs text-slate-500">
            {isFinnish ? "Miten oma kotikaupunginosasi leikkaa päästöjä kohti vuotta 2030?" : "How your local neighborhood drives climate neutrality by 2030"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {DISTRICT_HIGHLIGHTS(isFinnish).map((d, i) => (
            <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-emerald-300 transition shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-xs">{d.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">{d.emissionsCut}</span>
              </div>
              <div className="text-xs font-bold text-emerald-800">{d.flagship}</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{d.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
