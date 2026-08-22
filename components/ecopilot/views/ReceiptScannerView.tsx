"use client";

import { useRef, useState } from "react";
import { Receipt, Upload, RotateCw, Plus, Sparkles } from "lucide-react";
import type { GroceryReceiptItem } from "@/lib/ecopilot/types";
import { scanReceiptAPI } from "@/lib/ecopilot/client";
import { addCo2LogAPI } from "@/lib/ecopilot/profileClient";

interface ReceiptScannerViewProps {
  isFinnish: boolean;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Real Gemini vision call (lib/ecopilot/gemini.ts classifyGroceryReceipt) — no sample data. */
export function ReceiptScannerView({ isFinnish }: ReceiptScannerViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [items, setItems] = useState<GroceryReceiptItem[]>([]);
  const [swapSuggestions, setSwapSuggestions] = useState<string[]>([]);
  const [loggedNames, setLoggedNames] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setErrorMessage(null);
    setIsScanning(true);
    try {
      const base64 = await fileToBase64(file);
      setPreviewUrl(base64);
      const result = await scanReceiptAPI(base64);
      setItems(result.items);
      setSwapSuggestions(result.swapSuggestions);
      setLoggedNames(new Set());
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to scan receipt");
    } finally {
      setIsScanning(false);
    }
  };

  const handleLogItem = async (item: GroceryReceiptItem) => {
    try {
      await addCo2LogAPI({ category: "food", description: item.name, co2Kg: item.estimatedCo2Kg });
      setLoggedNames((prev) => new Set(prev).add(item.name));
    } catch (err) {
      console.error(err);
    }
  };

  const total = items.reduce((sum, item) => sum + item.estimatedCo2Kg, 0);

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
            ? "Gemini Vision lukee ostoskuitin rivit ja arvioi hiilijalanjäljen tuotteittain."
            : "Gemini Vision reads the grocery receipt's line items and estimates a rough footprint per item."}
        </p>
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFileSelect(file);
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-10 px-6 flex flex-col items-center justify-center gap-3 text-center hover:border-orange-400 hover:bg-orange-50/40 transition"
        >
          {previewUrl && (
            /* eslint-disable-next-line @next/next/no-img-element -- user-uploaded data: URI preview, not an optimizable static asset */
            <img src={previewUrl} alt="Receipt preview" className="max-h-40 rounded-xl border border-slate-200 mb-2" />
          )}
          <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
            {isScanning ? <RotateCw className="w-5 h-5 text-orange-600 animate-spin" /> : <Upload className="w-5 h-5 text-orange-600" />}
          </div>
          <p className="text-xs font-bold text-slate-700">
            {isScanning
              ? isFinnish
                ? "Luetaan kuittia..."
                : "Reading receipt..."
              : isFinnish
                ? "Klikkaa latautaksesi kuittikuva"
                : "Click to upload a receipt photo"}
          </p>
        </button>

        {errorMessage && <p className="mt-3 text-xs text-rose-600 font-medium">{errorMessage}</p>}
      </div>

      {items.length > 0 && (
        <>
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-orange-600" />
              <span>{isFinnish ? "Tunnistetut tuotteet" : "Extracted items"}</span>
            </h3>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold border bg-slate-100 text-slate-700 border-slate-200">
                      {item.category}
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-black text-slate-700">{item.estimatedCo2Kg.toFixed(1)} kg CO2e</span>
                    <button
                      onClick={() => handleLogItem(item)}
                      disabled={loggedNames.has(item.name)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 disabled:opacity-40 transition"
                      title={isFinnish ? "Kirjaa Päästöseurantaan" : "Log to CO2 Tracker"}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {swapSuggestions.length > 0 && (
            <div className="rounded-3xl bg-emerald-50 border border-emerald-200 p-6 sm:p-8 space-y-3">
              <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                {isFinnish ? "Vähäpäästöisemmät vaihdot" : "Lower-carbon swaps"}
              </h3>
              <ul className="space-y-1.5">
                {swapSuggestions.map((s, i) => (
                  <li key={i} className="text-xs text-emerald-900 leading-relaxed">
                    • {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-6 rounded-3xl bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md flex items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-100">
                {isFinnish ? "Kuitin kokonaisjalanjälki" : "Receipt total footprint"}
              </span>
              <h4 className="text-xl font-black">
                {isFinnish ? "Tämän ostoskorin arvioitu jalanjälki" : "Estimated footprint for this basket"}
              </h4>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[110px] shrink-0">
              <div className="text-2xl font-black">{total.toFixed(1)} kg</div>
              <div className="text-[10px] text-orange-100 font-bold">CO2e</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
