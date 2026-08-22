import React, { useState } from 'react';
import {
  ShoppingBag,
  X,
  Sparkles,
  Receipt,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  Info,
  Apple,
  RefreshCw,
  Scale,
} from 'lucide-react';
import { EcoPilotUserProfile, SavedGoal } from '../types/user';
import { ObservationSnapshot } from '../types/recommendation';
import { ContextualWhatIfButton } from './ContextualWhatIfButton';
import { ContextualWhatIfModal } from './ContextualWhatIfModal';

export interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: EcoPilotUserProfile;
  observation: ObservationSnapshot;
  onSaveGoal?: (goal: SavedGoal) => void;
  onOpenAskAssistant?: (initialQuery?: string, contextTitle?: string) => void;
  isFinnish?: boolean;
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
];

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  observation,
  onSaveGoal,
  onOpenAskAssistant,
  isFinnish = false,
}) => {
  const [items, setItems] = useState<GroceryItem[]>(DEFAULT_SAMPLE_RECEIPT);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'sample' | 'custom'>('sample');

  if (!isOpen) return null;

  const totalCo2 = Number(items.reduce((acc, it) => acc + it.co2Kg, 0).toFixed(2));
  const totalPrice = Number(items.reduce((acc, it) => acc + it.priceEur, 0).toFixed(2));

  return (
    <div
      id="receipt-scanner-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-emerald-100 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Receipt className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-200 block">
                {isFinnish ? 'Ruoka & Ostoskori' : 'Food & Grocery Footprint'}
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {isFinnish ? 'Kuitin & Ruokakorin Ilmastolaskuri' : 'Grocery Receipt Climate Estimator'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Summary Box */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-0.5">
              <span className="text-[10px] text-emerald-700 font-bold uppercase block">
                {isFinnish ? 'Arvioitu CO₂e' : 'Total CO₂e'}
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-950">
                {totalCo2} kg
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                {isFinnish ? 'Yhteishinta' : 'Basket Cost'}
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                €{totalPrice.toFixed(2)}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 col-span-2 sm:col-span-1 flex flex-col items-center justify-center gap-1">
              <span className="text-[10px] text-purple-700 font-bold uppercase">
                {isFinnish ? 'Kokeile vaihtoehtoja' : 'Explore swaps'}
              </span>
              <button
                type="button"
                onClick={() => setIsWhatIfOpen(true)}
                className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition flex items-center gap-1 shadow-xs"
              >
                <Sparkles className="w-3 h-3" />
                <span>[🔮 What if?]</span>
              </button>
            </div>
          </div>

          {/* Itemized Receipt List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                {isFinnish ? 'Kuitin tuote-erittely (K-Citymarket / S-Market):' : 'Analyzed Items (Sample Supermarket Receipt):'}
              </span>
              <button
                type="button"
                onClick={() => setItems(DEFAULT_SAMPLE_RECEIPT)}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{isFinnish ? 'Palauta oletus' : 'Reset sample'}</span>
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white">
              {items.map((item) => (
                <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="space-y-0.5">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>{isFinnish ? item.nameFi : item.name}</span>
                      <span className="text-[11px] font-normal text-slate-400 font-mono">({item.quantity})</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {item.category} • €{item.priceEur.toFixed(2)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-black text-slate-800">
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

          {/* Contextual What-If Callout Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-extrabold text-purple-950 text-xs sm:text-sm">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>{isFinnish ? 'Mitä jos vaihdan vain yhden tuotteen?' : 'What if I change just one item?'}</span>
              </div>
              <p className="text-xs text-purple-800">
                {isFinnish
                  ? 'Kanan korvaaminen kotimaisella kasviproteiinilla (Nyhtökaura) vähentää ostoskorisi jalanjälkeä arviolta ~1.5 kg CO₂e.'
                  : 'Replacing chicken with Finnish oat protein reduces your basket footprint by ~1.5 kg CO₂e with no drastic diet overhaul.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsWhatIfOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs shrink-0"
            >
              <span>[🔮 What if?]</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Responsible Food AI Disclaimer */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>{isFinnish ? 'Laskennan perusteet ja vastuullisuus:' : 'Calculation Basis & Guidance:'}</span>
            </div>
            <p className="leading-relaxed">
              {isFinnish
                ? 'Elintarvikkeiden hiilijalanjälkikertoimet perustuvat Luonnonvarakeskuksen (Luke) ja SYKE:n tutkimuskeskiarvoihin. EcoPilot ehdottaa vaihtoehtoja ("Yksi vaihtoehto on...") ilman moralisointia.'
                : 'Food footprint values are approximate category-level estimates based on Luke and SYKE research averages, not verified product-level emissions.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end text-xs shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs transition"
          >
            {isFinnish ? 'Sulje' : 'Close'}
          </button>
        </div>
      </div>

      {/* Embedded What If Modal */}
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
