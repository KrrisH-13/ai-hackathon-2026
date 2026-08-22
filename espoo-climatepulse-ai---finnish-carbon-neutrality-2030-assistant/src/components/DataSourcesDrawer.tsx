import React from 'react';
import { X, Database, ExternalLink, ShieldCheck, CheckCircle2, Server, Wifi } from 'lucide-react';
import { DATA_SOURCES } from '../data/dataSourceRegistry';

interface DataSourcesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isFinnish?: boolean;
}

export const DataSourcesDrawer: React.FC<DataSourcesDrawerProps> = ({
  isOpen,
  onClose,
  isFinnish = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-slate-900 border-l border-slate-700 h-full p-6 sm:p-8 shadow-2xl flex flex-col justify-between overflow-y-auto text-slate-100 space-y-6"
        role="dialog"
        aria-modal="true"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  {isFinnish ? 'Julkiset & Avoimet Tietolähteet' : 'Public & Open Data Sources'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isFinnish ? 'Läpinäkyvä datan alkuperä ja päivityssyklit' : 'Transparent data lineage & refresh rates'}
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

          <p className="text-xs text-slate-300 leading-relaxed">
            {isFinnish
              ? 'EcoPilot hyödyntää aitoja pohjoismaisia ja espoolaisia avoimen datan rajapintoja. Tekoäly ei keksi omia lukuja, vaan nojaa näihin todennettuihin mittauksiin ja standardeihin.'
              : 'EcoPilot relies strictly on authentic Nordic and Espoo open data feeds. The AI never invents numerical facts, strictly citing verified sources below.'}
          </p>

          {/* List of Data Sources */}
          <div className="space-y-3">
            {DATA_SOURCES.map((source) => (
              <div
                key={source.id}
                className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-white text-xs">{source.name}</h4>
                    <span className="text-[11px] text-emerald-400 font-medium">{source.provider}</span>
                  </div>
                  <a
                    href={source.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white transition shrink-0"
                    title="Open official data portal"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <p className="text-slate-300 text-[11px] leading-relaxed">{source.statusMessage}</p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-700/60">
                  <span>Cycle: {source.lastUpdated}</span>
                  <span className="text-blue-300 uppercase font-bold">{source.freshness}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition mt-4"
        >
          {isFinnish ? 'Sulje' : 'Close'}
        </button>
      </div>
    </div>
  );
};
