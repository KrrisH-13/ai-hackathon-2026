"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import type { UserProfile, HousingType, EspooDistrict, HeatingSystem, ElectricityContract, CommuteHabit, CarType, WasteManagementSystem } from "@/lib/ecopilot/types";
import { ESPOO_DISTRICTS, HEATING_SYSTEMS, ELECTRICITY_CONTRACTS, COMMUTE_HABITS } from "@/lib/ecopilot/types";
import { CAR_TYPE_OPTIONS, CAR_TYPE_DEFAULT_CO2_G_PER_KM, WASTE_MANAGEMENT_OPTIONS } from "@/lib/ecopilot/data";
import { updateEcopilotProfileAPI } from "@/lib/ecopilot/profileClient";
import { InfoHint } from "@/components/ecopilot/InfoHint";
import { NumberStepperInput } from "@/components/ecopilot/NumberStepperInput";

// Display-only labels for the Electricity Contract dropdown — the stored
// ElectricityContract values stay unchanged (used elsewhere in AI prompts and
// persisted profile data), only how they're shown here is simplified.
const ELECTRICITY_CONTRACT_LABELS: Record<ElectricityContract, string> = {
  "Nord Pool Hourly Spot Price": "Hourly Spot Price",
  "Fixed-Price Contract": "Fixed-Price Contract",
  "Renewable / Certified Green (100%)": "Renewable / Certified Green (100%)",
};

interface ProfileEditViewProps {
  userProfile: UserProfile;
  /** Seeded from the ?lang= query param the profile link was opened with — see EcopilotTopBar. */
  initialIsFinnish: boolean;
  /** Where Cancel and a successful Save navigate back to, e.g. "/dashboard". */
  backHref: string;
}

/** Full-page climate profile editor at /[roleSlug]/profile — replaces the old ProfileCustomizerModal overlay. */
export function ProfileEditView({ userProfile, initialIsFinnish, backHref }: ProfileEditViewProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<UserProfile>({ ...userProfile });
  const [isFinnish, setIsFinnish] = useState(initialIsFinnish);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isDrivingCommute = formData.commuteHabit === "Car";

  const toggleHeatingSystem = (system: HeatingSystem) => {
    setFormData((prev) => {
      const isSelected = prev.heatingSystems.includes(system);
      // At least one heating system must stay selected.
      if (isSelected && prev.heatingSystems.length === 1) return prev;
      return {
        ...prev,
        heatingSystems: isSelected
          ? prev.heatingSystems.filter((s) => s !== system)
          : [...prev.heatingSystems, system],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setIsSaving(true);
    try {
      await updateEcopilotProfileAPI(formData);
      router.push(backHref);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save profile");
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={backHref}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
            title={isFinnish ? "Takaisin" : "Back"}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl">🏡</span>
            <div className="min-w-0">
              <h1 className="text-base font-extrabold text-slate-900 truncate">
                {isFinnish ? "Muokkaa Asuntosi Ilmastoprofiilia" : "Customize Finnish Home Profile"}
              </h1>
              <p className="text-xs text-slate-500 truncate">
                {isFinnish
                  ? "Tarkat tiedot parantavat AI-suositusten laskentatarkkuutta"
                  : "Accurate details refine energy and carbon calculations"}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsFinnish((prev) => !prev)}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-white transition shrink-0"
        >
          {isFinnish ? "FI / EN" : "EN / FI"}
        </button>
      </header>

      <div className="max-w-3xl mx-auto p-4 sm:p-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs animate-fadeIn"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? "Nimi (Googlesta):" : "Name (from Google):"}</label>
              <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
                {formData.name}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                {isFinnish ? "Espoon Suuralue:" : "Espoo District:"}
                <InfoHint
                  isFinnish={isFinnish}
                  align="right"
                  label={isFinnish ? "Espoon Suuralue" : "Espoo District"}
                  instruction={
                    isFinnish
                      ? "Espoon suuralue, jolla asut. Käytetään paikallisiin sähköverkko-, joukkoliikenne- ja Sortti-asemavinkkeihin."
                      : "The Espoo major district (suuralue) you live in. Used for local grid, transit, and Sortti-station tips."
                  }
                  example={
                    isFinnish
                      ? "Suur-Matinkylä (Matinkylä, Olari, Henttaa)"
                      : "Suur-Matinkylä (Matinkylä, Olari, Henttaa)"
                  }
                />
              </label>
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
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                {isFinnish ? "Pinta-ala (m²):" : "Area (m²):"}
                <InfoHint
                  isFinnish={isFinnish}
                  label={isFinnish ? "Pinta-ala" : "Area"}
                  instruction={
                    isFinnish
                      ? "Kodin lämmitetty asuinpinta-ala neliömetreinä. Löytyy vuokrasopimuksesta tai asunnon myynti-ilmoituksesta."
                      : "Your home's heated living area in square metres. Check your rental contract or apartment listing if unsure."
                  }
                  example={isFinnish ? "72" : "72"}
                />
              </label>
              <NumberStepperInput
                value={formData.livingAreaSqM}
                onChange={(v) => setFormData({ ...formData, livingAreaSqM: v })}
                min={15}
                max={500}
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? "Henkilömäärä:" : "Persons:"}</label>
              <NumberStepperInput
                value={formData.householdSize}
                onChange={(v) => setFormData({ ...formData, householdSize: v })}
                min={1}
                max={12}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              {isFinnish ? "Lämmitysjärjestelmät:" : "Heating Systems:"}
              <InfoHint
                isFinnish={isFinnish}
                label={isFinnish ? "Lämmitys" : "Heating Systems"}
                instruction={
                  isFinnish
                    ? "Kodin lämmitystavat — valitse kaikki käytössä olevat. Espoon kerrostaloissa kaukolämpö on yleisin."
                    : "How your home is heated — select all that apply. District heating is the norm in Espoo apartments."
                }
                example={isFinnish ? "District Heating" : "District Heating"}
              />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {HEATING_SYSTEMS.map((h) => (
                <label
                  key={h}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100"
                >
                  <input
                    type="checkbox"
                    checked={formData.heatingSystems.includes(h)}
                    onChange={() => toggleHeatingSystem(h)}
                    className="accent-emerald-600"
                  />
                  <span className="text-slate-700 font-medium">{h}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              {isFinnish ? "Sähkösopimus:" : "Electricity Contract:"}
              <InfoHint
                isFinnish={isFinnish}
                label={isFinnish ? "Sähkösopimus" : "Electricity Contract"}
                instruction={
                  isFinnish
                    ? "Sähkön hinnoittelutapasi. ”Tuntihinta” tarkoittaa, että hinta muuttuu joka tunti — silloin ajoituksesta on eniten hyötyä."
                    : "How your electricity is priced. 'Hourly Spot Price' means your price changes every hour — that's when timing loads pays off most."
                }
                example={isFinnish ? "Tuntihinta" : "Hourly Spot Price"}
              />
            </label>
            <select
              value={formData.electricityContract}
              onChange={(e) => setFormData({ ...formData, electricityContract: e.target.value as ElectricityContract })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
            >
              {ELECTRICITY_CONTRACTS.map((c) => (
                <option key={c} value={c}>
                  {ELECTRICITY_CONTRACT_LABELS[c]}
                </option>
              ))}
            </select>
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
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                {isFinnish ? "Saunakerrat / vko:" : "Saunas / week:"}
                <InfoHint
                  isFinnish={isFinnish}
                  align="right"
                  label={isFinnish ? "Saunakerrat" : "Saunas per week"}
                  instruction={
                    isFinnish
                      ? "Kuinka monta kertaa viikossa sauna lämmitetään koko taloudessa yhteensä. Laita 0, jos saunaa ei ole."
                      : "How many times a week the sauna is heated across the whole household. Enter 0 if you have none."
                  }
                  example={isFinnish ? "2" : "2"}
                />
              </label>
              <NumberStepperInput
                value={formData.saunaTimesPerWeek}
                onChange={(v) => setFormData({ ...formData, saunaTimesPerWeek: v })}
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
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  {isFinnish ? "Auton CO2-päästöt (g/km):" : "Car CO2 Emissions (g/km):"}
                  <InfoHint
                    isFinnish={isFinnish}
                    align="right"
                    label={isFinnish ? "Auton CO2-päästöt" : "Car CO2 emissions"}
                    instruction={
                      isFinnish
                        ? "Auton pakokaasujen CO2 rekisteriotteesta tai valmistajan tiedoista. Jätä automaattinen arvio, jos et tiedä tarkkaa lukua."
                        : "Tailpipe CO2 from your car's registration papers or the maker's spec. Leave the auto-filled estimate if you don't know."
                    }
                    example={isFinnish ? "118" : "118"}
                  />
                </label>
                <NumberStepperInput
                  value={formData.carCo2GramsPerKm ?? 0}
                  onChange={(v) => setFormData({ ...formData, carCo2GramsPerKm: v })}
                  min={0}
                  max={1000}
                />
              </div>
            </div>
          )}

          {saveError && (
            <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {saveError}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Link
              href={backHref}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition"
            >
              {isFinnish ? "Peruuta" : "Cancel"}
            </Link>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {isSaving ? (isFinnish ? "Tallennetaan..." : "Saving...") : isFinnish ? "Tallenna Profiili" : "Save Profile"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
