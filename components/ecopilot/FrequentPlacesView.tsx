"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Plus, Save, X } from "lucide-react";
import type { FrequentPlace, FrequentPlaceTransportMode, UserProfile } from "@/lib/ecopilot/types";
import { FREQUENT_PLACE_TRANSPORT_MODES } from "@/lib/ecopilot/types";
import { PLACE_MODE_LABEL, defaultPlaceTransportMode } from "@/lib/ecopilot/frequentPlaces";
import { FREQUENT_PLACE_ICONS, FREQUENT_PLACE_ICON_META } from "@/components/ecopilot/frequentPlaceIcons";
import { AddressAutocomplete } from "@/components/ecopilot/AddressAutocomplete";
import { updateEcopilotProfileAPI } from "@/lib/ecopilot/profileClient";
import { EcopilotPageShell } from "@/components/ecopilot/EcopilotPageShell";
import { ViewHero } from "@/components/ecopilot/ViewHero";

const MAX_FREQUENT_PLACES = 12;

interface FrequentPlacesViewProps {
  userProfile: UserProfile;
  /** Seeded from the ?lang= query param the link here was opened with — see EcopilotSidebar. */
  initialIsFinnish: boolean;
  /** Where Cancel and a successful Save navigate back to, e.g. "/dashboard". */
  backHref: string;
  /** Link to the full profile editor — home address and preferred transport (both read here) live there. */
  profileHref: string;
  /** This page's own URL — passed through to the persistent sidebar (see EcopilotPageShell). */
  placesHref: string;
  /** Signed-in account's email, threaded to the persistent sidebar's logout control. */
  accountEmail?: string;
}

/**
 * Full-page editor for the profile's "Favourite Locations" — the places the
 * user travels to often, split out of ProfileEditView so this frequently-touched
 * list (added to, tweaked, reordered as routines change) doesn't cost a scroll
 * through the whole climate profile every time. Reads (but doesn't edit) home
 * address + preferred transport from the main profile, since quick trip
 * logging (ActivityLoggerView) needs both. Still named FrequentPlacesView /
 * FrequentPlace internally (DB column, types, API) — only the user-facing
 * label changed.
 */
export function FrequentPlacesView({
  userProfile,
  initialIsFinnish,
  backHref,
  profileHref,
  placesHref,
  accountEmail,
}: FrequentPlacesViewProps) {
  const router = useRouter();
  const [places, setPlaces] = useState<FrequentPlace[]>(userProfile.frequentPlaces);
  const [isFinnish, setIsFinnish] = useState(initialIsFinnish);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const hasHomeAddress = userProfile.homeAddress != null && userProfile.homeLat != null && userProfile.homeLon != null;

  const addPlace = () => {
    setPlaces((prev) => {
      if (prev.length >= MAX_FREQUENT_PLACES) return prev;
      const place: FrequentPlace = {
        id: crypto.randomUUID(),
        label: "",
        icon: "other",
        // Seeded from the profile's preferred transport so the common case
        // ("I drive everywhere") needs no extra clicks — still editable below.
        transportMode: defaultPlaceTransportMode(userProfile),
        address: null,
        lat: null,
        lon: null,
      };
      return [...prev, place];
    });
  };

  const updatePlace = (id: string, patch: Partial<FrequentPlace>) => {
    setPlaces((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const removePlace = (id: string) => {
    setPlaces((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setIsSaving(true);
    try {
      // Normalise blank addresses (and any stale coords) to null, and drop
      // half-added places with no name, before persisting.
      const frequentPlaces = places
        .map((p) => {
          const address = p.address?.trim() ? p.address.trim() : null;
          return { ...p, label: p.label.trim(), address, lat: address ? p.lat : null, lon: address ? p.lon : null };
        })
        .filter((p) => p.label.length > 0);
      await updateEcopilotProfileAPI({ frequentPlaces });
      router.push(backHref);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save your places");
      setIsSaving(false);
    }
  };

  const preferredMode = PLACE_MODE_LABEL[defaultPlaceTransportMode(userProfile)];

  return (
    <EcopilotPageShell
      currentTab="places"
      isFinnish={isFinnish}
      userProfile={userProfile}
      dashboardHref={backHref}
      profileHref={profileHref}
      placesHref={placesHref}
      accountEmail={accountEmail}
    >
      <div className="flex items-center justify-between gap-3 px-4 sm:px-8 py-4">
        <Link
          href={backHref}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isFinnish ? "Kojelautaan" : "Back to dashboard"}</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsFinnish((prev) => !prev)}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[12px] font-bold text-white transition shrink-0"
        >
          {isFinnish ? "FI / EN" : "EN / FI"}
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 pb-8 space-y-6 animate-fadeIn">
        <ViewHero
          accent="indigo"
          isFinnish={isFinnish}
          storageKey="favourite-locations"
          badge={`📍 ${isFinnish ? "Suosikkipaikat" : "Favourite Locations"}`}
          title={isFinnish ? "Tallenna paikat, joissa käyt usein" : "Save the places you travel to often"}
          description={
            isFinnish
              ? "Työ, ruokakauppa, lapsen päiväkoti, harrastus — lisää kuvake, hae osoite (Suomi) ja halutessasi tavallisin kulkutapa. Esimerkki: Työ · Piispansilta 11, Espoo · Bussi. Näitä käytetään matkojen nopeaan kirjaamiseen Päiväkirjassa."
              : "Work, the grocery store, a child's day care, a hobby class — pick an icon, look up the address (Finland), and optionally how you usually get there. Example: Work · Piispansilta 11, Espoo · Bus. These power one-click trip logging in the Activity Log."
          }
        />

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5 text-xs">
          {!hasHomeAddress && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {isFinnish
                  ? "Kotiosoitteesi puuttuu vielä — pikakirjaus mittaa matkat kotoa käsin. "
                  : "Your home address isn't set yet — quick trip logging measures every trip from there. "}
                <Link href={profileHref} className="font-bold underline hover:no-underline">
                  {isFinnish ? "Lisää se profiilissa" : "Add it in your profile"}
                </Link>
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                {isFinnish ? "Tallennetut paikat" : "Saved locations"}
              </h3>
              <span className="text-[12px] font-bold text-slate-400 shrink-0">
                {places.length}/{MAX_FREQUENT_PLACES}
              </span>
            </div>

            <p className="text-[12px] text-slate-500">
              {isFinnish
                ? `Uusi paikka saa oletukseksi ensisijaisen kulkutapasi (${preferredMode.fi}). `
                : `A new location starts with your preferred transport (${preferredMode.en}). `}
              <Link href={profileHref} className="font-bold text-emerald-700 hover:underline">
                {isFinnish ? "Muuta sitä profiilissa" : "Change it in your profile"}
              </Link>
            </p>

            {places.length === 0 && (
              <p className="text-[12px] text-slate-400 py-2">
                {isFinnish
                  ? "Ei suosikkipaikkoja vielä. Lisää ensimmäinen alta."
                  : "No favourite locations yet. Add your first one below."}
              </p>
            )}

            <div className="space-y-2.5">
              {places.map((place, index) => (
                <div key={place.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-[11px] font-black text-slate-400 flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {FREQUENT_PLACE_ICON_META.map(({ key, en, fi }) => {
                          const Icon = FREQUENT_PLACE_ICONS[key];
                          const selected = place.icon === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => updatePlace(place.id, { icon: key })}
                              title={isFinnish ? fi : en}
                              aria-label={isFinnish ? fi : en}
                              aria-pressed={selected}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition ${
                                selected
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "bg-white border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-700"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePlace(place.id)}
                      title={isFinnish ? "Poista" : "Remove"}
                      aria-label={isFinnish ? "Poista paikka" : "Remove location"}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={place.label}
                      onChange={(e) => updatePlace(place.id, { label: e.target.value })}
                      maxLength={60}
                      placeholder={isFinnish ? "esim. Työ, Ruokakauppa, Päiväkoti" : "e.g. Work, Grocery store, Day care"}
                      className="flex-1 min-w-0 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    />
                    <select
                      value={place.transportMode ?? ""}
                      onChange={(e) =>
                        updatePlace(place.id, {
                          transportMode: (e.target.value || null) as FrequentPlaceTransportMode | null,
                        })
                      }
                      className="sm:w-44 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">{isFinnish ? "Kulkutapa (valinn.)" : "Transport (optional)"}</option>
                      {FREQUENT_PLACE_TRANSPORT_MODES.map((m) => (
                        <option key={m} value={m}>
                          {isFinnish ? PLACE_MODE_LABEL[m].fi : PLACE_MODE_LABEL[m].en}
                        </option>
                      ))}
                    </select>
                  </div>

                  <AddressAutocomplete
                    isFinnish={isFinnish}
                    value={place.address ?? ""}
                    onChange={(address, coords) =>
                      updatePlace(place.id, {
                        address: address || null,
                        lat: coords?.lat ?? null,
                        lon: coords?.lon ?? null,
                      })
                    }
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addPlace}
              disabled={places.length >= MAX_FREQUENT_PLACES}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:text-slate-600 text-xs font-bold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {places.length >= MAX_FREQUENT_PLACES
                  ? isFinnish
                    ? `Enintään ${MAX_FREQUENT_PLACES} paikkaa`
                    : `Up to ${MAX_FREQUENT_PLACES} locations`
                  : isFinnish
                    ? "Lisää paikka"
                    : "Add a location"}
              </span>
            </button>
          </div>

          {saveError && (
            <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {saveError}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Link href={backHref} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition">
              {isFinnish ? "Peruuta" : "Cancel"}
            </Link>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? (isFinnish ? "Tallennetaan..." : "Saving...") : isFinnish ? "Tallenna paikat" : "Save locations"}</span>
            </button>
          </div>
        </form>
      </div>
    </EcopilotPageShell>
  );
}
