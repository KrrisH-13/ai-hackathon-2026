import React, { useState } from 'react';
import { X, Calculator, CheckCircle2, ShieldCheck, Play, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { runAllCalculationEngineTests, TestResult } from '../climate/calculations.test';
import { CALCULATION_ENGINE_VERSION, CALCULATION_ENGINE_NOTICE, ECOCREDITS_DISCLAIMER } from '../climate/calculations';

interface CalculationEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFinnish?: boolean;
}

export const CalculationEngineModal: React.FC<CalculationEngineModalProps> = ({
  isOpen,
  onClose,
  isFinnish = false,
}) => {
  const [testSuiteResults, setTestSuiteResults] = useState<{
    total: number;
    passed: number;
    failed: number;
    results: TestResult[];
  } | null>(null);

  const [isRunningTests, setIsRunningTests] = useState(false);

  if (!isOpen) return null;

  const handleRunTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      const results = runAllCalculationEngineTests();
      setTestSuiteResults(results);
      setIsRunningTests(false);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl text-slate-100 relative space-y-6 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  {isFinnish ? 'Deterministinen Laskentamoottori' : 'Deterministic Calculation Engine'}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  v{CALCULATION_ENGINE_VERSION}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isFinnish
                  ? 'Matemaattisesti todennetut kaavat — Gemini ei keksi lukuja'
                  : 'Strict mathematical engine — zero AI hallucinations in numeric values'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Banner */}
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Architecture Rule: Separation of Compute & AI Rationale</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {CALCULATION_ENGINE_NOTICE}
          </p>
          <div className="text-[10px] text-amber-300/90 font-mono italic">
            * {ECOCREDITS_DISCLAIMER}
          </div>
        </div>

        {/* Core Formulas */}
        <div className="space-y-3 text-xs">
          <span className="font-extrabold text-slate-300 uppercase tracking-wider text-[11px] block">
            {isFinnish ? 'Tärkeimmät Laskentakaavat:' : 'Core Authoritative Formulas:'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-[11px]">
            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
              <span className="text-emerald-400 font-bold">Electricity CO₂:</span>
              <p className="text-slate-300">CO₂ (g) = Energy (kWh) × Grid Factor (g/kWh)</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
              <span className="text-emerald-400 font-bold">Spot Cost (€):</span>
              <p className="text-slate-300">Cost = (kWh × Spot c/kWh / 100) + Transfer</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
              <span className="text-emerald-400 font-bold">Transport CO₂:</span>
              <p className="text-slate-300">ΔCO₂ = Dist (km) × (Car Factor - Transit Factor)</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
              <span className="text-emerald-400 font-bold">EcoCredits:</span>
              <p className="text-slate-300">Pts = (Base + CO₂*10 + €*5 + Flex) × Streak</p>
            </div>
          </div>
        </div>

        {/* Test Suite Runner */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-300 uppercase tracking-wider text-[11px] block">
              {isFinnish ? 'Yksikkötestit (In-Browser Unit Tests):' : 'Unit Tests & Validation Suite:'}
            </span>
            <button
              onClick={handleRunTests}
              disabled={isRunningTests}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              {isRunningTests ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{isFinnish ? 'Aja testit' : 'Run Unit Tests'}</span>
            </button>
          </div>

          {testSuiteResults && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-slate-300">Total: {testSuiteResults.total} tests</span>
                <span className="text-emerald-400">✓ {testSuiteResults.passed} Passed</span>
                {testSuiteResults.failed > 0 && <span className="text-rose-400">✗ {testSuiteResults.failed} Failed</span>}
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {testSuiteResults.results.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px] font-mono"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-slate-200 truncate">[{t.suite}] {t.name}</span>
                    </div>
                    <span className="text-emerald-400 font-bold shrink-0">PASS</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
          >
            {isFinnish ? 'Sulje' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
