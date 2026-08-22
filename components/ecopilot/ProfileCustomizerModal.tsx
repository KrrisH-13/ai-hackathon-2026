"use client";

import { useEffect, useState } from "react";
import { X, Save } from "lucide-react";
import type { UserProfile, HousingType, EspooDistrict, HeatingSystem, ElectricityContract, CommuteHabit, CarType, WasteManagementSystem } from "@/lib/ecopilot/types";
import { ESPOO_DISTRICTS, HEATING_SYSTEMS, ELECTRICITY_CONTRACTS, COMMUTE_HABITS } from "@/lib/ecopilot/types";
import { CAR_TYPE_OPTIONS, CAR_TYPE_DEFAULT_CO2_G_PER_KM, WASTE_MANAGEMENT_OPTIONS, COMMON_ENERGY_SAVING_MEASURES } from "@/lib/ecopilot/data";

interface ProfileCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSaveProfile: (updated: UserProfile) => void;
  isFinnish: boolean;
}

export function ProfileCustomizerModal({
  isOpen,
  onClose,
  userProfile,
  onSaveProfile,
  isFinnish,
}: ProfileCustomizerModalProps) {
  const [formData, setFormData] = useState<UserProfile>({ ...userProfile });

  // This component never unmounts (it just returns null while closed), so
  // formData needs an explicit re-sync on open — otherwise it stays frozen
  // at whatever userProfile looked like on first mount and a later save can
  // submit stale/renamed enum values that no longer pass validation.
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- re-sync form with the latest profile whenever the modal opens
      setFormData({ ...userProfile });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    onClose();
  };

  const isDrivingCommute = formData.commuteHabit === "Car";

  const toggleEnergyMeasure = (measure: string) => {
    setFormData((prev) => ({
      ...prev,
      energySavingMeasures: prev.energySavingMeasures.includes(measure)
        ? prev.energySavingMeasures.filter((m) => m !== measure)
        : [...prev.energySavingMeasures, measure],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏡</span>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {isFinnish ? "Muokkaa Asuntosi Ilmastoprofiilia" : "Customize Finnish Home Profile"}
              </h3>
              <p className="text-xs text-slate-500">
                {isFinnish
                  ? "Tarkat tiedot parantavat AI-suositusten laskentatarkkuutta"
                  : "Accurate details refine energy and carbon calculations"}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? "Nimi (Googlesta):" : "Name (from Google):"}</label>
              <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
                {formData.name}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? "Espoon Suuralue:" : "Espoo District:"}</label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value as EspooDistrict })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                {ESPOO_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? "Talotyyppi:" : "Housing Type:"}</label>
              <select
                value={formData.housingType}
                onChange={(e) => setFormData({ ...formData, housingType: e.target.value as HousingType })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 capitalize"
              >
                <option value="kerrostalo">Apartment</option>
                <option value="rivitalo">Terraced House</option>
                <option value="omakotitalo">Detached House</option>
                <option value="paritalo">Semi-detached House</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? "Pinta-ala (m²):" : "Area (m²):"}</label>
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
              <label className="font-bold text-slate-700">{isFinnish ? "Henkilömäärä:" : "Persons:"}</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? "Pääasiallinen Lämmitys:" : "Heating System:"}</label>
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
              <label className="font-bold text-slate-700">{isFinnish ? "Sähkösopimus:" : "Electricity Contract:"}</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? "Saunatyyppi:" : "Sauna Type:"}</label>
              <select
                value={formData.saunaType}
                onChange={(e) => setFormData({ ...formData, saunaType: e.target.value as "electric" | "wood" | "none" })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="electric">Electric</option>
                <option value="wood">Wood-burning</option>
                <option value="none">No sauna</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? "Saunakerrat / vko:" : "Saunas / week:"}</label>
              <input
                type="number"
                value={formData.saunaTimesPerWeek}
                onChange={(e) => setFormData({ ...formData, saunaTimesPerWeek: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                min={0}
                max={7}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? "Ensisijainen kulkutapa:" : "Preferred Transport:"}</label>
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

            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? "Jätehuolto:" : "Waste Management:"}</label>
              <select
                value={formData.wasteManagementSystem}
                onChange={(e) => setFormData({ ...formData, wasteManagementSystem: e.target.value as WasteManagementSystem })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                {WASTE_MANAGEMENT_OPTIONS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isDrivingCommute && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">{isFinnish ? "Auton tyyppi:" : "Car Type:"}</label>
                <select
                  value={formData.carType ?? "none"}
                  onChange={(e) => {
                    const carType = e.target.value as CarType;
                    setFormData({
                      ...formData,
                      carType,
                      carCo2GramsPerKm: CAR_TYPE_DEFAULT_CO2_G_PER_KM[carType],
                    });
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                  {CAR_TYPE_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  {isFinnish ? "Auton CO2-päästöt (g/km):" : "Car CO2 Emissions (g/km):"}
                </label>
                <input
                  type="number"
                  value={formData.carCo2GramsPerKm ?? 0}
                  onChange={(e) => setFormData({ ...formData, carCo2GramsPerKm: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  min={0}
                  max={1000}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">
              {isFinnish ? "Käytössä olevat säästötoimet:" : "Other Energy-Saving Measures:"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {COMMON_ENERGY_SAVING_MEASURES.map((measure) => (
                <label
                  key={measure}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100"
                >
                  <input
                    type="checkbox"
                    checked={formData.energySavingMeasures.includes(measure)}
                    onChange={() => toggleEnergyMeasure(measure)}
                    className="accent-emerald-600"
                  />
                  <span className="text-slate-700 font-medium">{measure}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition"
            >
              {isFinnish ? "Peruuta" : "Cancel"}
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isFinnish ? "Tallenna Profiili" : "Save Profile"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
