import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Zap,
  Receipt,
  Train,
  Recycle,
  Home,
  Layers,
  Brain,
  Info,
  ShieldCheck,
  Search,
  ExternalLink,
} from 'lucide-react';
import { EcoPilotToolDefinition, ECO_TOOLS_REGISTRY, ToolCategory } from '../tools/toolsRegistry';
import { EcoPilotUserProfile, SavedGoal } from '../types/user';
import { Season } from '../types/climate';

interface ToolsCatalogViewProps {
  userProfile: EcoPilotUserProfile;
  currentSeason: Season;
  isFinnish: boolean;
  onOpenTool: (toolId: string) => void;
  onOpenAskAssistant?: (query?: string, title?: string) => void;
  onOpenDataSources?: () => void;
  onOpenCalculationEngine?: () => void;
}

export const ToolsCatalogView: React.FC<ToolsCatalogViewProps> = ({
  userProfile,
  currentSeason,
  isFinnish,
  onOpenTool,
  onOpenAskAssistant,
  onOpenDataSources,
  onOpenCalculationEngine,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'all', label: isFinnish ? 'Kaikki Työkalut' : 'All Tools' },
    { id: 'energy', label: isFinnish ? '⚡ Sähkö & Energia' : '⚡ Energy & Spot' },
    { id: 'transport', label: isFinnish ? '🚆 Liikenne & HSL' : '🚆 Transport & HSL' },
    { id: 'waste', label: isFinnish ? '♻️ Kierrätys & Jäte' : '♻️ Recycling & Waste' },
    { id: 'grocery', label: isFinnish ? '📷 Ruoka & Ostokset' : '📷 Food & Groceries' },
    { id: 'simulation', label: isFinnish ? '🔮 Simulaatiot' : '🔮 What-If Scenarios' },
  ];

  const filteredTools = ECO_TOOLS_REGISTRY.filter((tool) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;
    const name = isFinnish ? tool.nameFi.toLowerCase() : tool.name.toLowerCase();
    const desc = isFinnish ? tool.descriptionFi.toLowerCase() : tool.description.toLowerCase();
    return matchesCategory && (name.includes(q) || desc.includes(q));
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn text-slate-800">
      {/* 1. Header: Approachable & Friendly */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-50 text-emerald-800 border border-emerald-200">
              {isFinnish ? 'ARJEN PALVELUT & TYÖKALUT' : 'EVERYDAY SERVICES & TOOLS'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isFinnish ? 'Mihin EcoPilot voi auttaa?' : 'Things EcoPilot can help me with'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl">
            {isFinnish
              ? 'Käytännölliset työkalut pohjoismaiseen arkeen: spot-sähkön optimointi, ruokakuitit, HSL-matkat ja HSY-kierrätys.'
              : 'Practical tools for Nordic living: spot electricity timing, grocery footprints, HSL commute planning, and circular waste guidance.'}
          </p>
        </div>

        {/* Ask AI quick jump */}
        <button
          type="button"
          onClick={() => onOpenAskAssistant?.('Which tool should I use to optimize my home electricity and transit?', 'Tools')}
          className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{isFinnish ? 'Kysy tekoälyltä neuvoa' : 'Ask AI for advice'}</span>
        </button>
      </div>

      {/* 2. Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                selectedCategory === c.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isFinnish ? 'Etsi työkalua...' : 'Search tools...'}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-xs"
          />
        </div>
      </div>

      {/* 3. Tools Grid (Cards Layout - Action oriented, approachable) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            onClick={() => onOpenTool(tool.id)}
            className="group rounded-3xl bg-white border border-slate-200 hover:border-emerald-300 p-6 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-5"
          >
            {/* Card Header: Icon + Badge */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 group-hover:bg-emerald-50 border border-slate-100 group-hover:border-emerald-200 flex items-center justify-center text-2xl transition shadow-2xs">
                  {tool.icon}
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    tool.status === 'live'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : tool.status === 'public_data'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {isFinnish ? tool.badgeFi || tool.badge : tool.badge}
                </span>
              </div>

              {/* Title & Tagline */}
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-950 transition">
                  {isFinnish ? tool.nameFi : tool.name}
                </h3>
                <p className="text-xs font-semibold text-emerald-700">
                  {isFinnish ? tool.taglineFi : tool.tagline}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed pt-1">
                  {isFinnish ? tool.descriptionFi : tool.description}
                </p>
              </div>
            </div>

            {/* Card Footer: Data provider + Action Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <span className="text-[11px] text-slate-400 truncate max-w-[150px]" title={tool.dataSource.providerName}>
                {tool.dataSource.providerName.split('(')[0]}
              </span>

              <div className="flex items-center gap-1 font-bold text-slate-900 group-hover:text-emerald-700 transition">
                <span>{isFinnish ? tool.highlightActionFi || 'Avaa' : tool.highlightAction || 'Open'}</span>
                <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Transparency & Partnership Disclaimer Footer */}
      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-2 text-xs text-slate-600">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{isFinnish ? 'Vastuullisuus & Avoimet Rajapinnat' : 'Responsible Civic Data & Open Transparency'}</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          {isFinnish
            ? 'EcoPilot hyödyntää suomalaisten viranomaisten ja julkisten toimijoiden avointa dataa (Fingrid, HSL Digitransit, HSY, Luke, Motiva). EcoPilot on itsenäinen sovellus eikä väitä virallisia kaupallisia kumppanuuksia ilman todennettua sopimusta.'
            : 'EcoPilot uses open public datasets from Finnish authorities and operators (Fingrid, HSL Digitransit, HSY, Luke, Motiva). EcoPilot is an independent civic utility and makes no unverified claims of official commercial partnership.'}
        </p>
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onOpenDataSources}
            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline underline-offset-2"
          >
            {isFinnish ? 'Tarkista rajapintojen tila' : 'Audit Data Source Status'}
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={onOpenCalculationEngine}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
          >
            {isFinnish ? 'Tarkastele laskentakaavoja' : 'View Calculation Formulas'}
          </button>
        </div>
      </div>
    </div>
  );
};
