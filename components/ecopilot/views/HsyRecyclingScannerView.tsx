"use client";

import { useState } from "react";
import { RotateCw, Search, Sparkles, MapPin, CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import type { WasteClassificationResult } from "@/lib/ecopilot/types";
import { HSY_RECYCLING_GUIDE_QUICK_SAMPLES } from "@/lib/ecopilot/data";
import { classifyWasteAPI } from "@/lib/ecopilot/client";

interface HsyRecyclingScannerViewProps {
  isFinnish: boolean;
}

const ESPOO_SORTTI_FACILITIES = [
  {
    name: "Mankkaan Sortti-asema",
    address: "Sinimäentie 29, 02630 Espoo",
    hours: "Ma-Pe 07:00-21:00, La-Su 09:00-17:00",
    accepts: ["Poistotekstiilit", "Vaarallinen jäte", "SER-sähkölaitteet", "Puu", "Metalli", "Kartonki"],
    district: "Suur-Tapiola / Leppävaara",
  },
  {
    name: "Ämmässuon Ekoteollisuuskeskus",
    address: "Ämmässuontie 8, 02820 Espoo",
    hours: "Ma-Pe 07:00-21:00, La-Su 09:00-17:00",
    accepts: ["Suuret erät", "Kaikki jätejakeet", "Kierrätyspuisto", "Biojätteen biokaasutus"],
    district: "Pohjois-Espoo / Vanha-Espoo",
  },
  {
    name: "Kauppakeskus Sello Rinki- ja Poistotekstiilipiste",
    address: "Leppävaarankatu 3-9 (Pysäköintitaso P1), 02600 Espoo",
    hours: "Kauppakeskuksen aukioloaikoina (06:00-24:00)",
    accepts: ["Kartonki", "Muovipakkaukset", "Lasi", "Pienmetalli", "Palpa Pantti", "Poistotekstiilit"],
    district: "Suur-Leppävaara",
  },
  {
    name: "Kauppakeskus Iso Omena Rinki-ekopiste",
    address: "Piispansilta 11 (P-taso), 02230 Espoo",
    hours: "Ma-La 07:00-22:00, Su 09:00-22:00",
    accepts: ["Muovi", "Kartonki", "Lasi", "Metalli", "Vaatekeräys UFF/HSY", "Palpa Panttipiste"],
    district: "Suur-Matinkylä",
  },
];

export function HsyRecyclingScannerView({ isFinnish }: HsyRecyclingScannerViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isClassifying, setIsClassifying] = useState<boolean>(false);
  const [classificationResult, setClassificationResult] = useState<WasteClassificationResult | null>(null);
  const [selectedSorttiDistrict, setSelectedSorttiDistrict] = useState<string>("Kaikki");

  const handleClassify = async (queryToSearch?: string) => {
    const text = queryToSearch || searchQuery;
    if (!text.trim() || isClassifying) return;

    setIsClassifying(true);
    try {
      const result = await classifyWasteAPI(text);
      setClassificationResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsClassifying(false);
    }
  };

  const filteredFacilities =
    selectedSorttiDistrict === "Kaikki"
      ? ESPOO_SORTTI_FACILITIES
      : ESPOO_SORTTI_FACILITIES.filter((f) => f.district.includes(selectedSorttiDistrict));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 animate-fadeIn">
      <div className="rounded-3xl bg-gradient-to-r from-teal-50/80 via-white to-emerald-50/60 border border-teal-200/80 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-200">
              ♻️ {isFinnish ? "HSY Kiertotalous & Lajitteluopas" : "HSY Circular & Waste Classifier"}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {isFinnish ? "Viralliset pääkaupunkiseudun HSY-säännöt" : "Official Helsinki Metropolitan HSY Rules"}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isFinnish ? "AI-Lajittelu & Espoon Sortti-Asemat" : "AI Waste Classifier & Sortti Station Guide"}
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            {isFinnish
              ? "Tarkista sekunneissa mihin jäteastiaan esine kuuluu, miten se puhdistetaan kylmällä vedellä ja miten se kiertää raaka-aineeksi Vantaan jätevoimalan tai Fortumin muovijalostamon kautta."
              : "Instantly identify the exact HSY sorting bin, washing requirements, avoided carbon emissions, and nearest Espoo drop-off station."}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-teal-800 bg-teal-50 px-4 py-3 rounded-2xl border border-teal-200 shrink-0">
          <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
          <span>{isFinnish ? "HSY 2030 Kierrätystavoite: 60%+" : "HSY 2030 Target: 60%+ Circularity"}</span>
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>{isFinnish ? "Tunnista ja lajittele mikä tahansa kodin esine:" : "Identify & Classify Any Household Item:"}</span>
        </h3>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleClassify();
              }}
              placeholder={
                isFinnish
                  ? "Kirjoita esine (esim. maitotölkki muovikorkilla, rasvainen pizzalaatikko, rikkinäinen LED-lamppu)..."
                  : "Type item (e.g. oat milk carton with plastic spout, greasy pizza box, broken LED bulb)..."
              }
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-teal-500 shadow-xs"
            />
          </div>

          <button
            onClick={() => handleClassify()}
            disabled={isClassifying || !searchQuery.trim()}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-40 transition flex items-center justify-center gap-2 shadow-sm shadow-teal-600/20 shrink-0"
          >
            {isClassifying ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>{isFinnish ? "Tunnistetaan..." : "Analyzing..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-teal-200" />
                <span>{isFinnish ? "Lajittele AI:lla" : "Classify with AI"}</span>
              </>
            )}
          </button>
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {isFinnish ? "Yleisiä kysyttyjä esineitä:" : "Common query examples:"}
          </span>
          <div className="flex flex-wrap gap-2">
            {HSY_RECYCLING_GUIDE_QUICK_SAMPLES.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  setSearchQuery(s.item.split("(")[0].trim());
                  handleClassify(s.item);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-700 text-xs font-medium border border-slate-200 transition"
              >
                {s.item.split("(")[0]}
              </button>
            ))}
          </div>
        </div>

        {classificationResult && (
          <div className="p-6 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-teal-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-600 text-white shadow-2xs">
                    {classificationResult.category}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Astia: {classificationResult.binColor}</span>
                </div>
                <h4 className="text-lg font-extrabold text-slate-900 mt-1">{classificationResult.itemName}</h4>
              </div>

              <div className="p-3 rounded-xl bg-white border border-teal-200 text-center shadow-2xs">
                <div className="text-lg font-black text-teal-700">+{classificationResult.co2SavingsEstimateGrams} g</div>
                <div className="text-[10px] text-slate-500 font-bold">
                  {isFinnish ? "CO2-säästö vs poltto" : "CO2 saved vs incineration"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white border border-teal-100 space-y-1.5 shadow-2xs">
                <div className="font-bold text-teal-950 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-teal-600" />
                  <span>{isFinnish ? "Lajitteluohje & Valmistelu:" : "Sorting Instructions:"}</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-[11px]">{classificationResult.sortingInstructions}</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-teal-100 space-y-1.5 shadow-2xs">
                <div className="font-bold text-teal-950 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  <span>{isFinnish ? "Lähin Keräyspiste Espoossa:" : "Nearest Espoo Drop-off:"}</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-[11px]">{classificationResult.nearestEspooFacility}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
              <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>{isFinnish ? "Kiertotalouspolku & Sisäpiirivinkki:" : "Circular Journey & Pro Tip:"}</span>
              </div>
              <p className="text-emerald-900 text-[11px] leading-relaxed">
                <strong>{isFinnish ? "Minne materiaali päätyy?" : "Where does it go?"}</strong> {classificationResult.whyItMatters}
              </p>
              <p className="text-emerald-800 text-[11px] italic">
                💡 <strong>Vinkki:</strong> {classificationResult.proTip}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              {isFinnish ? "Espoon Sortti-Asemat ja Rinki-Ekopisteet" : "Espoo Sortti Stations & Eco-Points"}
            </h3>
            <p className="text-xs text-slate-500">
              {isFinnish ? "Aukioloajat, vastaanotettavat jätejakeet ja saapumisohjeet" : "Opening hours, accepted materials, and drop-off guidance"}
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: "Kaikki", label: isFinnish ? "Kaikki" : "All Districts" },
              { id: "Suur-Tapiola", label: "Suur-Tapiola" },
              { id: "Suur-Leppävaara", label: "Suur-Leppävaara" },
              { id: "Suur-Matinkylä", label: "Suur-Matinkylä" },
              { id: "Pohjois-Espoo", label: isFinnish ? "Pohjois-Espoo" : "North Espoo" },
            ].map((dist) => (
              <button
                key={dist.id}
                onClick={() => setSelectedSorttiDistrict(dist.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedSorttiDistrict === dist.id ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {dist.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFacilities.map((f, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition space-y-3 shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{f.name}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {f.address}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                  {f.district}
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <div>
                  <strong className="text-slate-800">{isFinnish ? "Aukiolo:" : "Hours:"}</strong> {f.hours}
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {f.accepts.map((acc, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-white text-slate-700 text-[10px] font-medium border border-slate-200 shadow-2xs">
                      {acc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 space-y-4 shadow-sm">
        <h4 className="text-sm font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-emerald-400" />
          <span>{isFinnish ? "Tiesitkö? 3 Yleisintä Lajitteluvirhettä Espoossa:" : "Did You Know? 3 Common Finnish Sorting Myths:"}</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-1.5">
            <span className="font-bold text-amber-400 block">{isFinnish ? "🍕 Rasvainen Pizzalaatikko" : "🍕 Greasy Pizza Boxes"}</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {isFinnish
                ? "Täysin öljystä ja juustosta tahriintunut pahvilaatikko kuuluu sekajätteeseen tai silputtuna biojätteeseen, ei kartonkiin."
                : "Heavily grease-soaked pizza boxes belong in mixed waste (sekajäte) or shredded in bio-waste, not in cardboard recycling."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-1.5">
            <span className="font-bold text-amber-400 block">{isFinnish ? "🥛 Maitotölkin Huuhtelu" : "🥛 Rinsing Milk Cartons"}</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {isFinnish
                ? "Käytä vain tilkka kylmää vettä tai pyyhkäisy. Älä tuhlaa kuumaa vettä, jotta pesun energiankulutus ei ylitä kierrätyshyötyä."
                : "Rinse with just a splash of cold water and flatten. Never use hot water, as heating the water consumes more energy than recycling saves."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-1.5">
            <span className="font-bold text-amber-400 block">{isFinnish ? "☕ Kahvinporot & Suodatin" : "☕ Coffee Grounds & Paper Filter"}</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {isFinnish
                ? "Kahvinporot ja suodatinpussi kuuluvat aina biojätteeseen. Ne tuottavat arvokasta biokaasua HSY:n Ämmässuon laitoksella."
                : "Coffee grounds and unbleached filters always go into bio-waste (biojäte). They produce renewable biogas at HSY Ämmässuo!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
