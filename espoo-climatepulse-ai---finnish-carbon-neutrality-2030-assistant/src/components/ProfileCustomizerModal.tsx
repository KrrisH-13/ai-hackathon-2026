import React, { useState } from 'react';
import {
  X,
  Sliders,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Home,
  Car,
  Zap,
  Check,
  MapPin,
  Train,
  Clock,
  Heart,
  HelpCircle,
} from 'lucide-react';
import { EcoPilotUserProfile, UserConstraint, UserValuePriority } from '../types/user';
import { HousingType, HeatingSystem } from '../types/climate';

interface ProfileCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: EcoPilotUserProfile;
  onSaveProfile: (updated: EcoPilotUserProfile) => void;
  isFinnish?: boolean;
}

const ALL_CONSTRAINTS: { id: UserConstraint; labelEn: string; labelFi: string; desc: string }[] = [
  {
    id: 'renting_no_renovations',
    labelEn: 'Renting apartment (No renovations / drilling)',
    labelFi: 'Vuokra-asunto (Ei remontteja / porauksia)',
    desc: 'Excludes heat pump installations and taloyhtiö capital investments.',
  },
  {
    id: 'no_temperature_reduction',
    labelEn: 'Strict indoor heating (No room temperature setback)',
    labelFi: 'Ei huonelämmön pudotusta',
    desc: 'Protects indoor warmth setpoint (central apartment heating).',
  },
  {
    id: 'no_ev',
    labelEn: 'No Electric Vehicle (EV)',
    labelFi: 'Ei sähköautoa',
    desc: 'Hides EV night smart-charging schedules.',
  },
  {
    id: 'no_car',
    labelEn: 'Car-free household (Autoton)',
    labelFi: 'Autoton talous',
    desc: 'Focuses purely on HSL rail/bus and active mobility.',
  },
  {
    id: 'no_sauna',
    labelEn: 'No private electric sauna',
    labelFi: 'Ei omaa sähkösaunaa',
    desc: 'Hides sauna spot price optimization recommendations.',
  },
  {
    id: 'strict_schedule',
    labelEn: 'Strict work & morning family schedule',
    labelFi: 'Tarkka työ- ja aamuaikataulu',
    desc: 'Avoids morning routine disruptions before work.',
  },
  {
    id: 'cannot_cycle_winter',
    labelEn: 'Cannot cycle in sub-zero winter weather',
    labelFi: 'Ei talvipyöräilyä pakkasella',
    desc: 'Recommends HSL rail instead of cycling during winter months.',
  },
];

export const ProfileCustomizerModal: React.FC<ProfileCustomizerModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSaveProfile,
  isFinnish = false,
}) => {
  const [activeTab, setActiveTab] = useState<'lifestyle' | 'housing' | 'transport' | 'commute' | 'constraints'>('lifestyle');

  // 1. Lifestyle
  const [name, setName] = useState(userProfile.name || 'Alex');
  const [municipality, setMunicipality] = useState(userProfile.municipality || 'Espoo');
  const [neighborhood, setNeighborhood] = useState(userProfile.neighborhood || 'Tapiola');
  const [householdSize, setHouseholdSize] = useState(userProfile.householdSize || 2);
  const [dietPreference, setDietPreference] = useState(userProfile.dietPreference || 'flexitarian');

  // 2. Housing
  const [housingTypeCategory, setHousingTypeCategory] = useState(userProfile.housingTypeCategory || 'Apartment');
  const [livingAreaSqM, setLivingAreaSqM] = useState(userProfile.livingAreaSqM || 72);
  const [heatingTypeDetail, setHeatingTypeDetail] = useState(userProfile.heatingTypeDetail || 'District heating');
  const [controlsHeating, setControlsHeating] = useState(userProfile.controlsHeating || 'No');

  // 3. Transport
  const [primaryTransport, setPrimaryTransport] = useState(userProfile.primaryTransport || 'Mixed');
  const [carOwnership, setCarOwnership] = useState(userProfile.carOwnership || 'Petrol');
  const [publicTransportUsage, setPublicTransportUsage] = useState(userProfile.publicTransportUsage || '3–4 days/week');
  const [cyclingFrequency, setCyclingFrequency] = useState(userProfile.cyclingFrequency || 'Sometimes');

  // 4. Commute
  const [commuteOrigin, setCommuteOrigin] = useState(userProfile.commuteOrigin || 'Tapiola, Espoo');
  const [commuteDestination, setCommuteDestination] = useState(userProfile.commuteDestination || 'Otaniemi / Keilaniemi Innovation Hub, Espoo');
  const [commuteDistanceKm, setCommuteDistanceKm] = useState(userProfile.commuteDistanceKm || 12);
  const [commuteDaysPerWeek, setCommuteDaysPerWeek] = useState(userProfile.commuteDaysPerWeek || 4);
  const [carOccupancy, setCarOccupancy] = useState(userProfile.carOccupancy || 1);

  // 5. Constraints & Preferences
  const [cannotChange, setCannotChange] = useState<UserConstraint[]>(userProfile.cannotChange || []);
  const [avoidBefore07, setAvoidBefore07] = useState(userProfile.avoidBefore07 ?? true);
  const [avoidAfter22, setAvoidAfter22] = useState(userProfile.avoidAfter22 ?? false);
  const [maxInconvenienceMinutes, setMaxInconvenienceMinutes] = useState(userProfile.maxInconvenienceMinutes || 10);
  const [preferSavingMoney, setPreferSavingMoney] = useState(userProfile.preferSavingMoney ?? true);
  const [preferReducingCo2, setPreferReducingCo2] = useState(userProfile.preferReducingCo2 ?? true);
  const [preferConvenience, setPreferConvenience] = useState(userProfile.preferConvenience ?? true);

  if (!isOpen) return null;

  const toggleConstraint = (cId: UserConstraint) => {
    if (cannotChange.includes(cId)) {
      setCannotChange(cannotChange.filter((c) => c !== cId));
    } else {
      setCannotChange([...cannotChange, cId]);
    }
  };

  const handleSave = () => {
    const updated: EcoPilotUserProfile = {
      ...userProfile,
      name,
      municipality: municipality as any,
      neighborhood,
      householdSize: Number(householdSize) || 2,
      dietPreference: dietPreference as any,

      housingTypeCategory: housingTypeCategory as any,
      housingType: housingTypeCategory === 'Apartment' ? 'kerrostalo' : 'omakotitalo',
      livingAreaSqM: Number(livingAreaSqM) || 72,
      heatingTypeDetail: heatingTypeDetail as any,
      heatingSystem: heatingTypeDetail === 'District heating' ? 'Kaukolämpö (District Heating / Fortum Clean Heat)' : 'Sähkölämmitys',
      controlsHeating: controlsHeating as any,

      primaryTransport: primaryTransport as any,
      carOwnership: carOwnership as any,
      hasEv: carOwnership === 'Electric' || carOwnership === 'Plug-in hybrid',
      publicTransportUsage: publicTransportUsage as any,
      cyclingFrequency: cyclingFrequency as any,

      commuteOrigin,
      commuteDestination,
      commuteDistanceKm: Number(commuteDistanceKm) || 12,
      commuteDaysPerWeek: Number(commuteDaysPerWeek) || 4,
      carOccupancy: Number(carOccupancy) || 1,

      cannotChange,
      avoidBefore07,
      avoidAfter22,
      maxInconvenienceMinutes: Number(maxInconvenienceMinutes) || 10,
      preferSavingMoney,
      preferReducingCo2,
      preferConvenience,
    };

    onSaveProfile(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-xl text-slate-800 relative space-y-6 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-800 border border-blue-200 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {isFinnish ? 'Muokkaa Arkitietoja & Rajoitteita' : 'Customize Lifestyle Profile & Constraints'}
              </h3>
              <p className="text-xs text-slate-500">
                {isFinnish
                  ? 'EcoPilot räätälöi yhden toimen kerrallaan näiden tietojen pohjalta.'
                  : 'EcoPilot tailors one realistic action at a time based on where and how you live.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100">
          {[
            { id: 'lifestyle', label: isFinnish ? 'Elämäntapa' : 'Lifestyle', icon: Heart },
            { id: 'housing', label: isFinnish ? 'Asuminen' : 'Housing', icon: Home },
            { id: 'transport', label: isFinnish ? 'Liikkuminen' : 'Transport', icon: Car },
            { id: 'commute', label: isFinnish ? 'Työmatka' : 'Commute', icon: Train },
            { id: 'constraints', label: isFinnish ? 'Rajoitteet' : 'Constraints', icon: ShieldAlert },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Lifestyle */}
        {activeTab === 'lifestyle' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Name:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Municipality:</label>
                <select
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="Espoo">Espoo</option>
                  <option value="Helsinki">Helsinki</option>
                  <option value="Vantaa">Vantaa</option>
                  <option value="Kauniainen">Kauniainen</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Neighborhood / District:</label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Household size:</label>
                <select
                  value={householdSize}
                  onChange={(e) => setHouseholdSize(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value={1}>1 person</option>
                  <option value={2}>2 people (Alex demo)</option>
                  <option value={3}>3 people</option>
                  <option value={4}>4 people</option>
                  <option value={5}>5+ people</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Dietary preference:</label>
                <select
                  value={dietPreference}
                  onChange={(e) => setDietPreference(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="flexitarian">Flexitarian (Some meat / Nordic fava & oat protein)</option>
                  <option value="omnivore">Omnivore (Standard Finnish diet)</option>
                  <option value="vegetarian">Vegetarian (Kasvis)</option>
                  <option value="vegan">Vegan (Täysin vegaaninen)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Housing */}
        {activeTab === 'housing' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Housing type:</label>
                <select
                  value={housingTypeCategory}
                  onChange={(e) => setHousingTypeCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="Apartment">Apartment (Kerrostalo - Alex demo)</option>
                  <option value="Terraced house">Terraced / Row house (Rivitalo)</option>
                  <option value="Detached house">Detached house (Omakotitalo)</option>
                  <option value="Student housing">Student housing (HOAS / AYY)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Living area (m²):</label>
                <input
                  type="number"
                  value={livingAreaSqM}
                  onChange={(e) => setLivingAreaSqM(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Heating system:</label>
                <select
                  value={heatingTypeDetail}
                  onChange={(e) => setHeatingTypeDetail(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="District heating">District heating (Kaukolämpö - Fortum Clean Heat)</option>
                  <option value="Heat pump">Air / Ground source heat pump (Lämpöpumppu)</option>
                  <option value="Electric heating">Direct electric heating (Sähkölämmitys)</option>
                  <option value="Geothermal">Geothermal (Maalämpö)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Do you control the central thermostat?</label>
                <select
                  value={controlsHeating}
                  onChange={(e) => setControlsHeating(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="No">No (Building taloyhtiö automated - Protected)</option>
                  <option value="Yes">Yes (Individual thermostat adjustment)</option>
                  <option value="Not sure">Not sure</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Transport */}
        {activeTab === 'transport' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Primary transport mode:</label>
                <select
                  value={primaryTransport}
                  onChange={(e) => setPrimaryTransport(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="Mixed">Mixed (Car + HSL transit - Alex demo)</option>
                  <option value="Public transport">Public transport (HSL Rail & Bus)</option>
                  <option value="Car">Private car</option>
                  <option value="Bicycle">Bicycle / City bike</option>
                  <option value="Walking">Walking</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Car ownership:</label>
                <select
                  value={carOwnership}
                  onChange={(e) => setCarOwnership(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="Petrol">Petrol car (Bensiini - Alex demo)</option>
                  <option value="Diesel">Diesel car</option>
                  <option value="Hybrid">Non-plugin hybrid</option>
                  <option value="Electric">Full Electric Vehicle (EV)</option>
                  <option value="Plug-in hybrid">Plug-in hybrid (PHEV)</option>
                  <option value="None">None (Autoton talous)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Public transport frequency:</label>
                <select
                  value={publicTransportUsage}
                  onChange={(e) => setPublicTransportUsage(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="3–4 days/week">3–4 days/week (Alex demo)</option>
                  <option value="1–2 days/week">1–2 days/week</option>
                  <option value="Daily">Daily</option>
                  <option value="Rarely">Rarely</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cycling frequency:</label>
                <select
                  value={cyclingFrequency}
                  onChange={(e) => setCyclingFrequency(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="Sometimes">Sometimes</option>
                  <option value="Frequently">Frequently</option>
                  <option value="Rarely">Rarely</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Commute Profile */}
        {activeTab === 'commute' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Commute Origin:</label>
                <input
                  type="text"
                  value={commuteOrigin}
                  onChange={(e) => setCommuteOrigin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Commute Destination:</label>
                <input
                  type="text"
                  value={commuteDestination}
                  onChange={(e) => setCommuteDestination(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  One-way distance: <strong className="text-blue-700 font-mono">{commuteDistanceKm} km</strong>
                </label>
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={commuteDistanceKm}
                  onChange={(e) => setCommuteDistanceKm(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Commute days / week: <strong className="text-emerald-700 font-mono">{commuteDaysPerWeek} days</strong>
                </label>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={commuteDaysPerWeek}
                  onChange={(e) => setCommuteDaysPerWeek(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Car occupancy (if driving):</label>
                <select
                  value={carOccupancy}
                  onChange={(e) => setCarOccupancy(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value={1}>1 person (Solo drive - 170 g/km)</option>
                  <option value={2}>2 people (Carpool - 85 g/km)</option>
                  <option value={3}>3+ people</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Constraints & Necessity */}
        {activeTab === 'constraints' && (
          <div className="space-y-4 text-xs">
            <div className="space-y-2">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                User Boundaries & Inconvenience Limit:
              </span>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Maximum acceptable inconvenience:</span>
                  <span className="font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {maxInconvenienceMinutes} minutes
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={maxInconvenienceMinutes}
                  onChange={(e) => setMaxInconvenienceMinutes(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>5 min (Strict)</span>
                  <span>10 min (Alex)</span>
                  <span>30 min (Very flexible)</span>
                </div>
              </div>
            </div>

            {/* Hard Constraints Checkbox List */}
            <div className="space-y-2 pt-2">
              <span className="font-bold text-rose-800 uppercase tracking-wider text-[11px] block">
                Hard Boundary Constraints (Strictly Excluded):
              </span>
              <div className="space-y-2">
                {ALL_CONSTRAINTS.map((c) => {
                  const isSelected = cannotChange.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleConstraint(c.id)}
                      className={`w-full p-3 rounded-xl border text-left transition flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-rose-50 border-rose-400 text-rose-950'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">{isFinnish ? c.labelFi : c.labelEn}</div>
                        <div className="text-[11px] text-slate-500">{c.desc}</div>
                      </div>
                      <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-rose-600 bg-rose-600 text-white font-bold' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition"
          >
            {isFinnish ? 'Peruuta' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{isFinnish ? 'Tallenna profiili' : 'Save Profile'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
