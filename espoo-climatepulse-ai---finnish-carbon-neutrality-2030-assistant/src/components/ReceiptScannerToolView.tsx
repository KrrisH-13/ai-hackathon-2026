import React, { useState } from 'react';
import {
  ArrowLeft,
  Receipt,
  Sparkles,
  RefreshCw,
  Info,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
  UploadCloud,
  FileText,
  Plus,
} from 'lucide-react';
import { EcoPilotUserProfile, SavedGoal } from '../types/user';
import { Season } from '../types/climate';
import { getCurrentObservationSnapshot } from '../services/ecoPilotService';
import { ContextualWhatIfModal } from './ContextualWhatIfModal';
import { ECO_TOOLS_REGISTRY } from '../tools/toolsRegistry';

interface ReceiptScannerToolViewProps {
  userProfile: EcoPilotUserProfile;
  currentSeason: Season;
  isFinnish: boolean;
  onBackToTools: () => void;
  onSaveGoal?: (goal: SavedGoal) => void;
  onOpenAskAssistant?: (query?: string, title?: string) => void;
}

interface GroceryItem {
  id: string;
  name: string;
  nameFi: string;
  quantity: string;
  category: string;
  co2Kg: number;
  priceEur: number;
  impactLevel: 'low' | 'medium' | 'high';
}

const DEFAULT_SAMPLE_RECEIPT: GroceryItem[] = [
  {
    id: 'item-1',
    name: 'Chicken Breast Fillet',
    nameFi: 'Kotimainen broilerin fileesuikale',
    quantity: '500 g',
    category: 'Poultry',
    co2Kg: 1.9,
    priceEur: 4.5,
    impactLevel: 'high',
  },
  {
    id: 'item-2',
    name: 'Fresh Dairy Milk (Kevytmaito)',
    nameFi: 'Kevytmaito 1L',
    quantity: '1 L',
    category: 'Dairy',
    co2Kg: 1.2,
    priceEur: 1.15,
    impactLevel: 'medium',
  },
  {
    id: 'item-3',
    name: 'Jasmine Rice',
    nameFi: 'Jasmiiniriisi 500g',
    quantity: '500 g',
    category: 'Grains',
    co2Kg: 1.35,
    priceEur: 1.2,
    impactLevel: 'medium',
  },
  {
    id: 'item-4',
    name: 'Fairtrade Bananas',
    nameFi: 'Reilun kaupan banaanit',
    quantity: '1.0 kg',
    category: 'Produce',
    co2Kg: 0.8,
    priceEur: 1.8,
    impactLevel: 'low',
  },
  {
    id: 'item-5',
    name: 'Rye Bread (Ruispalat)',
    nameFi: 'Oululainen Ruispalat',
    quantity: '660 g',
    category: 'Bakery',
    co2Kg: 0.45,
    priceEur: 2.1,
    impactLevel: 'low',
  },
];

export const ReceiptScannerToolView: React.FC<ReceiptScannerToolViewProps> = ({
  userProfile,
  currentSeason,
  isFinnish,
  onBackToTools,
  onSaveGoal,
  onOpenAskAssistant,
}) => {
  const [items, setItems] = useState<GroceryItem[]>(DEFAULT_SAMPLE_RECEIPT);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false);
  const [isSimulatingUpload, setIsSimulatingUpload] = useState<boolean>(false);

  const toolMeta = ECO_TOOLS_REGISTRY.find((t) => t.id === 'receipt-scanner')!;
  const observation = getCurrentObservationSnapshot(currentSeason || 'winter', 21);

  const totalCo2 = Number(items.reduce((acc, it) => acc + it.co2Kg, 0).toFixed(2));
  const totalPrice = Number(items.reduce((acc, it) => acc + it.priceEur, 0).toFixed(2));

  const handleSimulateScan = () => {
    setIsSimulatingUpload(true);
    setTimeout(() => {
      setIsSimulatingUpload(false);
      setItems(DEFAULT_SAMPLE_RECEIPT);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn text-slate-800">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <button
          type="button"
          onClick={onBackToTools}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isFinnish ? '← Takaisin Työkaluihin' : '← Back to Tools'}</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            {toolMeta.dataSource.type}
          </span>
          <span className="text-slate-400 text-[11px]">
            {toolMeta.dataSource.providerName}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-lg">
            📷
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isFinnish ? toolMeta.nameFi : toolMeta.name}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {isFinnish ? toolMeta.taglineFi : toolMeta.tagline}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
            {isFinnish ? 'Arvioitu CO₂e' : 'Estimated CO₂e'}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono">
            {totalCo2} kg
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">
            {items.length} {isFinnish ? 'tuotetta analysoitu' : 'items parsed'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            {isFinnish ? 'Ostoskorin Hinta' : 'Basket Cost'}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            €{totalPrice.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {isFinnish ? 'Keskim. K-Citymarket / S-Market' : 'Avg Helsinki/Espoo retail'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 col-span-2 sm:col-span-1 flex flex-col justify-center space-y-2">
          <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">
            {isFinnish ? 'Mitä jos -vaihtoehto' : 'Explore Swaps'}
          </span>
          <button
            type="button"
            onClick={() => setIsWhatIfOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isFinnish ? '[🔮 Mitä jos?]' : '[🔮 What if?]'}</span>
          </button>
        </div>
      </div>

      {/* Upload/Scanner Area */}
      <div className="p-6 rounded-3xl bg-white border border-dashed border-slate-300 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto">
          <UploadCloud className="w-6 h-6 text-slate-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {isFinnish ? 'Lataa kauppakuitti tai valitse esimerkkikori' : 'Upload grocery receipt or test sample basket'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isFinnish
              ? 'Tukee yleisiä suomalaisia ruokakauppoja. Tunnistaa tuotteet kategorioittain ilman henkilötietojen tallennusta.'
              : 'Supports standard Finnish supermarket receipts. Categorizes items locally without storing private data.'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSimulateScan}
          disabled={isSimulatingUpload}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-2 mx-auto shadow-xs"
        >
          {isSimulatingUpload ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{isFinnish ? 'Luetaan kuittia...' : 'Analyzing receipt...'}</span>
            </>
          ) : (
            <>
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isFinnish ? 'Lataa Esimerkkikuitti' : 'Load Sample Receipt'}</span>
            </>
          )}
        </button>
      </div>

      {/* Parsed Items List */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {isFinnish ? 'Analysoidut Tuotteet' : 'Parsed Grocery Items'}
          </span>
          <button
            type="button"
            onClick={() => onOpenAskAssistant?.('What is a simple plant-based swap for chicken?', 'Grocery Receipt')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isFinnish ? 'Kysy tekoälyltä vaihtoehtoja' : 'Ask AI for swaps'}</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>{isFinnish ? item.nameFi : item.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono">({item.quantity})</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {item.category} • €{item.priceEur.toFixed(2)}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs sm:text-sm font-black text-slate-800 font-mono">
                  ~{item.co2Kg.toFixed(2)} kg CO₂
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                    item.impactLevel === 'high'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : item.impactLevel === 'medium'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {item.impactLevel === 'high' ? 'High Impact' : item.impactLevel === 'medium' ? 'Moderate' : 'Low Impact'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contextual What-If Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-sm text-purple-950">
              {isFinnish ? 'Mitä jos korvaan kanan kauraproteiinilla?' : 'What if I swap chicken for Nyhtökaura / oats?'}
            </h3>
          </div>
          <p className="text-xs text-purple-800">
            {isFinnish
              ? 'Yhden tuotteen vaihtaminen säästää noin ~1.5 kg CO₂ ilman jyrkkää dieettimuutosta.'
              : 'Swapping a single ingredient saves ~1.5 kg CO₂ per meal with zero lifestyle disruption.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsWhatIfOpen(true)}
          className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs shrink-0"
        >
          <span>[🔮 What if?]</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Methodology note */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>{isFinnish ? 'Laskentaperusteet ja tietolähteet:' : 'Calculation Basis & Notice:'}</span>
        </div>
        <p className="leading-relaxed">
          {toolMeta.dataSource.disclaimer} {toolMeta.dataSource.partnershipDisclaimer}
        </p>
      </div>

      {/* Embedded What-If Modal */}
      <ContextualWhatIfModal
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
        context="grocery"
        userProfile={userProfile}
        observation={observation}
        contextData={{ receiptItems: items }}
        onSaveGoal={onSaveGoal}
        onOpenAskAssistant={onOpenAskAssistant}
        isFinnish={isFinnish}
      />
    </div>
  );
};
