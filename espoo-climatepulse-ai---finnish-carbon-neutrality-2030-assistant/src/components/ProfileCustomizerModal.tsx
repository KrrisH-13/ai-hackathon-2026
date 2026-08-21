import React, { useState } from 'react';
import { X, Save, Sparkles, Building2 } from 'lucide-react';
import {
  UserProfile,
  HousingType,
  EspooDistrict,
  HeatingSystem,
  ElectricityContract,
  CommuteHabit,
} from '../types/climate';

interface ProfileCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSaveProfile: (updated: UserProfile) => void;
  isFinnish: boolean;
}

export const ProfileCustomizerModal: React.FC<ProfileCustomizerModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSaveProfile,
  isFinnish,
}) => {
  const [formData, setFormData] = useState<UserProfile>({ ...userProfile });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    onClose();
  };

  const DISTRICTS: EspooDistrict[] = [
    'Suur-Tapiola (Tapiola, Otaniemi, Keilaniemi)',
    'Suur-Leppävaara (Leppävaara, Kera, Karakallio)',
    'Suur-Matinkylä (Matinkylä, Olari, Henttaa)',
    'Suur-Espoonlahti (Espoonlahti, Kivenlahti, Soukka)',
    'Vanha-Espoo (Espoon keskus, Tuomarila, Kauklahti)',
    'Pohjois-Espoo (Nuuksio, Kalajärvi, Järvenperä)',
  ];

  const HEATING_SYSTEMS: HeatingSystem[] = [
    'Kaukolämpö (District Heating / Fortum Clean Heat)',
    'Maalämpö (Geothermal Heat Pump)',
    'Ilmalämpöpumppu + Suora sähkö (Air Heat Pump + Electric)',
    'Suora sähkölämmitys (Direct Electric)',
    'Puulämmitys / Varaava takka (Wood / Masonry Heater)',
    'Öljylämmitys / Poistuva (Oil / Transitioning)',
  ];

  const ELECTRICITY_CONTRACTS: ElectricityContract[] = [
    'Pörssisähkö (Nord Pool Hourly Spot)',
    'Kiinteähintainen (Fixed-Price Contract)',
    'Uusiutuva / EKOenergia (100% Certified Green)',
  ];

  const COMMUTE_HABITS: CommuteHabit[] = [
    'Pääosin HSL (Metro, Pikaratikka 15, Juna, Bussi)',
    'Kävellen ja Pyörällä (Cycling & Walking / Baana)',
    'Sähköauto (Electric Vehicle)',
    'Ladattava hybridi (PHEV)',
    'Polttomoottoriauto (Bensiini / Diesel)',
    'Etätyö / Hybridityö (Remote First)',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏡</span>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {isFinnish ? 'Muokkaa Asuntosi Ilmastoprofiilia' : 'Customize Finnish Home Profile'}
              </h3>
              <p className="text-xs text-slate-500">
                {isFinnish ? 'Tarkat tiedot parantavat AI-suositusten laskentatarkkuutta' : 'Accurate details refine energy and carbon calculations'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Name & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? 'Nimi / Kotitalous:' : 'Name:'}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? 'Espoon Suuralue:' : 'Espoo District:'}</label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value as EspooDistrict })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Housing Type & Size */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? 'Talotyyppi:' : 'Housing Type:'}</label>
              <select
                value={formData.housingType}
                onChange={(e) => setFormData({ ...formData, housingType: e.target.value as HousingType })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 capitalize"
              >
                <option value="kerrostalo">Kerrostalo (Apartment)</option>
                <option value="rivitalo">Rivitalo (Terraced)</option>
                <option value="omakotitalo">Omakotitalo (Detached)</option>
                <option value="paritalo">Paritalo (Semi-detached)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? 'Pinta-ala (m²):' : 'Area (m²):'}</label>
              <input
                type="number"
                value={formData.livingAreaSqM}
                onChange={(e) => setFormData({ ...formData, livingAreaSqM: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                min={15}
                max={500}
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? 'Henkilömäärä:' : 'Persons:'}</label>
              <input
                type="number"
                value={formData.householdSize}
                onChange={(e) => setFormData({ ...formData, householdSize: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                min={1}
                max={12}
              />
            </div>
          </div>

          {/* Heating & Electricity Contract */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? 'Pääasiallinen Lämmitys:' : 'Heating System:'}</label>
              <select
                value={formData.heatingSystem}
                onChange={(e) => setFormData({ ...formData, heatingSystem: e.target.value as HeatingSystem })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                {HEATING_SYSTEMS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? 'Sähkösopimus:' : 'Electricity Contract:'}</label>
              <select
                value={formData.electricityContract}
                onChange={(e) => setFormData({ ...formData, electricityContract: e.target.value as ElectricityContract })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                {ELECTRICITY_CONTRACTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sauna & Commute */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? 'Saunatyyppi:' : 'Sauna Type:'}</label>
              <select
                value={formData.saunaType}
                onChange={(e) => setFormData({ ...formData, saunaType: e.target.value as 'electric' | 'wood' | 'none' })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="electric">Sähkökiuas (Electric)</option>
                <option value="wood">Puukiuas (Wood-burning)</option>
                <option value="none">Ei omaa saunaa (None)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? 'Saunakerrat / vko:' : 'Saunas / week:'}</label>
              <input
                type="number"
                value={formData.saunaTimesPerWeek}
                onChange={(e) => setFormData({ ...formData, saunaTimesPerWeek: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                min={0}
                max={7}
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? 'Ruokavalio:' : 'Diet:'}</label>
              <select
                value={formData.dietPreference}
                onChange={(e) => setFormData({ ...formData, dietPreference: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 capitalize"
              >
                <option value="omnivore">Sekaruoka (Omnivore)</option>
                <option value="flexitarian">Kasvispainotteinen (Flexitarian)</option>
                <option value="vegetarian">Kasvisruoka (Vegetarian)</option>
                <option value="vegan">Vegaani (Vegan)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">{isFinnish ? 'Tyypillinen Työmatkatapa:' : 'Commute Mode:'}</label>
            <select
              value={formData.commuteHabit}
              onChange={(e) => setFormData({ ...formData, commuteHabit: e.target.value as CommuteHabit })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
            >
              {COMMUTE_HABITS.map((cm) => (
                <option key={cm} value={cm}>
                  {cm}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition"
            >
              {isFinnish ? 'Peruuta' : 'Cancel'}
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isFinnish ? 'Tallenna Profiili' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
