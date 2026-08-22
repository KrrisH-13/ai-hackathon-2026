"use client";

import { Receipt, Upload, Camera } from "lucide-react";

interface ReceiptScannerViewProps {
  isFinnish: boolean;
}

interface ReceiptItem {
  name: string;
  category: "dairy" | "meat" | "produce" | "other";
  co2Kg: number;
}

/** Layout only — SAMPLE_ITEMS stands in for Gemini Vision's extracted line items. */
const SAMPLE_ITEMS: ReceiptItem[] = [
  { name: "Valio maito 1L", category: "dairy", co2Kg: 1.2 },
  { name: "Jauheliha 400g", category: "meat", co2Kg: 4.8 },
  { name: "Kotimaiset porkkanat", category: "produce", co2Kg: 0.2 },
  { name: "Näkkileipä", category: "other", co2Kg: 0.3 },
];

const CATEGORY_STYLES: Record<ReceiptItem["category"], string> = {
  dairy: "bg-blue-100 text-blue-800 border-blue-200",
  meat: "bg-rose-100 text-rose-800 border-rose-200",
  produce: "bg-emerald-100 text-emerald-800 border-emerald-200",
  other: "bg-slate-100 text-slate-700 border-slate-200",
};

const CATEGORY_LABEL: Record<ReceiptItem["category"], { fi: string; en: string }> = {
  dairy: { fi: "Maitotuotteet", en: "Dairy" },
  meat: { fi: "Liha", en: "Meat" },
  produce: { fi: "Tuoretuotteet", en: "Produce" },
  other: { fi: "Muu", en: "Other" },
};

export function ReceiptScannerView({ isFinnish }: ReceiptScannerViewProps) {
  const total = SAMPLE_ITEMS.reduce((sum, item) => sum + item.co2Kg, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 animate-fadeIn">
      <div className="rounded-3xl bg-gradient-to-r from-orange-50/80 via-white to-emerald-50/60 border border-orange-200/80 p-6 sm:p-8 space-y-2 shadow-xs">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-900 border border-orange-200">
          🧾 {isFinnish ? "Kuitin hiilijalanjälkiarvio" : "Receipt Carbon Estimator"}
        </span>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {isFinnish ? "Kuvaa kuitti, saat karkean päästöarvion" : "Snap a receipt, get a rough footprint estimate"}
        </h2>
        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
          {isFinnish
            ? "Gemini Vision lukee ostoskuitin rivit ja arvioi hiilijalanjäljen tuoteryhmittäin (maitotuotteet, liha, tuoretuotteet)."
            : "Gemini Vision reads the grocery receipt's line items and estimates a rough footprint per category (dairy, meat, produce)."}
        </p>
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-10 px-6 flex flex-col items-center justify-center gap-3 text-center hover:border-orange-400 hover:bg-orange-50/40 transition cursor-pointer">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
            <Upload className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-xs font-bold text-slate-700">
            {isFinnish ? "Raahaa kuittikuva tähän tai klikkaa ladataksesi" : "Drag a receipt photo here or click to upload"}
          </p>
          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" />
            {isFinnish ? "tai ota kuva suoraan puhelimella" : "or take a photo directly on mobile"}
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-orange-600" />
          <span>{isFinnish ? "Tunnistetut tuotteet" : "Extracted items"}</span>
        </h3>

        <div className="space-y-2">
          {SAMPLE_ITEMS.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold border ${CATEGORY_STYLES[item.category]}`}
                >
                  {isFinnish ? CATEGORY_LABEL[item.category].fi : CATEGORY_LABEL[item.category].en}
                </span>
                <span className="text-xs font-bold text-slate-900 truncate">{item.name}</span>
              </div>
              <span className="shrink-0 text-xs font-black text-slate-700">{item.co2Kg} kg CO2e</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md flex items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-100">
            {isFinnish ? "Kuitin kokonaisjalanjälki" : "Receipt total footprint"}
          </span>
          <h4 className="text-xl font-black">{isFinnish ? "Tämän ostoskorin arvioitu jalanjälki" : "Estimated footprint for this basket"}</h4>
        </div>
        <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[110px] shrink-0">
          <div className="text-2xl font-black">{total.toFixed(1)} kg</div>
          <div className="text-[10px] text-orange-100 font-bold">CO2e</div>
        </div>
      </div>
    </div>
  );
}
