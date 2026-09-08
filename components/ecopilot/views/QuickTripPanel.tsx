"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Flame, MapPinOff, RotateCw as Spinner, Undo2, Zap } from "lucide-react";
import type { UserProfile } from "@/lib/ecopilot/types";
import type { QuickTrip } from "@/lib/ecopilot/frequentPlaces";
import {
  buildQuickTrips,
  countPlacesWithoutCoordinates,
  tripCo2Kg,
  PLACE_MODE_LABEL,
} from "@/lib/ecopilot/frequentPlaces";
import { DEFAULT_COUNTRY } from "@/lib/ecopilot/emissionFactors";
import { NORDIC_EMISSION_FACTORS } from "@/lib/ecopilot/calculations";
import { addCo2LogAPI, deleteCo2LogAPI } from "@/lib/ecopilot/profileClient";
import { FREQUENT_PLACE_ICONS } from "@/components/ecopilot/frequentPlaceIcons";
import { ACTIVITY_MODE_ICONS } from "@/components/ecopilot/activityIcons";
import { InfoHint } from "@/components/ecopilot/InfoHint";

interface QuickTripPanelProps {
  isFinnish: boolean;
  /** Supplies the home coordinates, the saved places and the car emission figure. */
  userProfile: UserProfile;
  /** Link to the profile editor, for the "no home address yet" prompt. */
  profileHref: string;
  /** Link to the frequently-visited-places editor, for the "no places saved" / "no address" prompts. */
  placesHref: string;
  /** Source tag written to the CO2 ledger — matches the rest of the Activity Log page. */
  source: "manual" | "activity-logger" | "what-if";
  /** Called after a trip is logged or undone so the parent can refresh its recent-entries list. */
  onLogged?: () => void;
}

/** The just-logged trip, kept so a misclick can be undone without leaving the page. */
interface LastLog {
  id: string;
  summary: string;
}

/** Mirrors ActivityLoggerView's description format so quick and typed entries read alike in the ledger. */
function buildTripDescription(trip: QuickTrip, distanceKm: number, isFinnish: boolean): string {
  const home = isFinnish ? "Koti" : "Home";
  const modeLabel = PLACE_MODE_LABEL[trip.mode];
  const mode = isFinnish ? modeLabel.fi : modeLabel.en;
  const route = `${home} → ${trip.place.label} · ${mode}`;
  return `${route} (${distanceKm} km, ${DEFAULT_COUNTRY})`.slice(0, 200);
}

/** 6.8kW kiuas run for 1h, priced with the direct-electric (or wood) grid factor — a rough, illustrative figure, matching calculateDeterministicSaunaImpact's default kiuas power. */
const SAUNA_SESSION_KWH = 6.8;

function saunaSessionCo2Kg(saunaType: UserProfile["saunaType"]): number {
  const factor = saunaType === "wood" ? NORDIC_EMISSION_FACTORS.WOOD_NET : NORDIC_EMISSION_FACTORS.DIRECT_ELECTRIC;
  return Math.round(((SAUNA_SESSION_KWH * factor) / 1000) * 100) / 100;
}

/**
 * One-click trip logging for the places saved on the profile: the distance is
 * estimated from the home ↔ place coordinates and the mode + emission factor
 * come from the profile, so a routine commute takes a single tap instead of a
 * typed sentence and an AI round trip. Rendered inside ActivityLoggerView, so
 * it has no page shell of its own.
 */
export function QuickTripPanel({ isFinnish, userProfile, profileHref, placesHref, source, onLogged }: QuickTripPanelProps) {
  const [pendingPlaceId, setPendingPlaceId] = useState<string | null>(null);
  const [isSaunaPending, setIsSaunaPending] = useState(false);
  const [lastLog, setLastLog] = useState<LastLog | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const trips = useMemo(() => buildQuickTrips(userProfile), [userProfile]);
  const placesMissingAddress = countPlacesWithoutCoordinates(userProfile);
  const hasHomeCoords = userProfile.homeLat != null && userProfile.homeLon != null;
  const showSaunaQuick = userProfile.saunaTimesPerWeek > 0;
  const isAnyPending = pendingPlaceId !== null || isSaunaPending;

  /** One-way distance, rounded the way the estimator rounds. */
  const legDistanceKm = (trip: QuickTrip) => Math.round(trip.distanceKm * 10) / 10;

  const handleQuickLog = async (trip: QuickTrip) => {
    if (isAnyPending) return;
    setPendingPlaceId(trip.place.id);
    setErrorMessage(null);
    setLastLog(null);
    try {
      const distanceKm = legDistanceKm(trip);
      const description = buildTripDescription(trip, distanceKm, isFinnish);
      const log = await addCo2LogAPI({
        category: "transport",
        description,
        co2Kg: tripCo2Kg(trip.gramsPerKm, distanceKm),
        source,
      });
      setLastLog({ id: log.id, summary: description });
      onLogged?.();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to log that trip");
    } finally {
      setPendingPlaceId(null);
    }
  };

  const handleQuickLogSauna = async () => {
    if (isAnyPending) return;
    setIsSaunaPending(true);
    setErrorMessage(null);
    setLastLog(null);
    try {
      const description = isFinnish ? "Saunominen (1 h)" : "Sauna session (1h)";
      const log = await addCo2LogAPI({
        category: "energy",
        description,
        co2Kg: saunaSessionCo2Kg(userProfile.saunaType),
        source,
      });
      setLastLog({ id: log.id, summary: description });
      onLogged?.();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to log that sauna session");
    } finally {
      setIsSaunaPending(false);
    }
  };

  const handleUndo = async () => {
    if (!lastLog || isUndoing) return;
    setIsUndoing(true);
    setErrorMessage(null);
    try {
      await deleteCo2LogAPI(lastLog.id);
      setLastLog(null);
      onLogged?.();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to undo that entry");
    } finally {
      setIsUndoing(false);
    }
  };

  // Which of the three "nothing to show yet" cases the user is in, and where
  // its call to action should go — places live on their own page, home
  // address is still edited on the main profile.
  const emptyState = (() => {
    if (userProfile.frequentPlaces.length === 0) {
      return {
        message: isFinnish
          ? "Tallenna suosikkipaikkasi (työ, päiväkoti, kuntosali), niin kirjaat ne matkat yhdellä napautuksella."
          : "Save your favourite locations (work, day care, the gym) and those trips become one tap each.",
        href: placesHref,
        cta: isFinnish ? "Lisää suosikkipaikkoja" : "Add favourite locations",
      };
    }
    if (!hasHomeCoords) {
      return {
        message: isFinnish
          ? "Hae kotiosoitteesi profiilissa osoitehaulla — pikakirjaus mittaa matkat kotoa käsin."
          : "Look up your home address in your profile — quick logging measures every trip from there.",
        href: profileHref,
        cta: isFinnish ? "Avaa profiili" : "Open profile",
      };
    }
    return {
      message: isFinnish
        ? "Hae tallennetuille suosikkipaikoillesi osoite, niin saamme matkan pituuden laskettua."
        : "Look up an address for your favourite locations so we can work out the distance.",
      href: placesHref,
      cta: isFinnish ? "Muokkaa suosikkipaikkoja" : "Edit favourite locations",
    };
  })();

  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Zap className="w-4 h-4 text-fuchsia-600" />
          {isFinnish ? "Pikakirjaus" : "Quick log"}
          <InfoHint
            isFinnish={isFinnish}
            label={isFinnish ? "Pikakirjaus" : "Quick log"}
            instruction={
              isFinnish
                ? "Napauta suosikkipaikkaa kirjataksesi matkan kotoa sinne. Matka arvioidaan kotisi ja paikan koordinaateista (linnuntie + kiertovara), kulkutapa tulee paikan profiiliasetuksesta ja auton päästökerroin omasta autostasi."
                : "Tap a favourite location to log the trip from home to it. The distance is estimated from your home and the location's coordinates (crow-flies plus a detour allowance), the mode comes from that location's profile setting, and a car trip is priced with your own car's g/km."
            }
            example={isFinnish ? "Koti → Työ · Bussi · 8,4 km" : "Home → Work · Bus · 8.4 km"}
          />
        </h3>
      </div>

      {trips.length === 0 && !showSaunaQuick ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300">
          <MapPinOff className="w-4 h-4 text-slate-400 shrink-0" />
          <p className="text-xs text-slate-600 flex-1">{emptyState.message}</p>
          <Link
            href={emptyState.href}
            className="shrink-0 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition text-center"
          >
            {emptyState.cta}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {showSaunaQuick && (
              <button
                type="button"
                onClick={handleQuickLogSauna}
                disabled={isAnyPending}
                title={isFinnish ? "Perustuu profiilin saunatyyppiin, 1h istunto" : "Based on your profile's sauna type, 1h session"}
                className="group flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-fuchsia-300 hover:bg-fuchsia-50/60 disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:bg-slate-50 transition text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 group-hover:border-fuchsia-200 flex items-center justify-center shrink-0">
                  {isSaunaPending ? (
                    <Spinner className="w-4 h-4 text-fuchsia-600 animate-spin" />
                  ) : (
                    <Flame className="w-4 h-4 text-slate-600 group-hover:text-fuchsia-700" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {isFinnish ? "Saunominen" : "Sauna session"}
                  </p>
                  <span className="flex items-center gap-1 text-[12px] text-slate-500">
                    <span className="truncate">1h · {saunaSessionCo2Kg(userProfile.saunaType)} kg CO2e</span>
                  </span>
                </div>
              </button>
            )}
            {trips.map((trip) => {
              const PlaceIcon = FREQUENT_PLACE_ICONS[trip.place.icon];
              const ModeIcon = ACTIVITY_MODE_ICONS[trip.mode];
              const distanceKm = legDistanceKm(trip);
              const co2Kg = tripCo2Kg(trip.gramsPerKm, distanceKm);
              const isPending = pendingPlaceId === trip.place.id;
              return (
                <button
                  key={trip.place.id}
                  type="button"
                  onClick={() => handleQuickLog(trip)}
                  disabled={isAnyPending}
                  title={
                    [
                      trip.place.address,
                      // A place with no mode of its own is priced with the profile's
                      // preferred transport — say so rather than silently guessing.
                      trip.modeSource === "profile"
                        ? isFinnish
                          ? "Kulkutapa: profiilin ensisijainen"
                          : "Mode: your preferred transport"
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || undefined
                  }
                  className="group flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-fuchsia-300 hover:bg-fuchsia-50/60 disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:bg-slate-50 transition text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 group-hover:border-fuchsia-200 flex items-center justify-center shrink-0">
                    {isPending ? (
                      <Spinner className="w-4 h-4 text-fuchsia-600 animate-spin" />
                    ) : (
                      <PlaceIcon className="w-4 h-4 text-slate-600 group-hover:text-fuchsia-700" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {isFinnish ? "Koti" : "Home"} → {trip.place.label}
                    </p>
                    <span className="flex items-center gap-1 text-[12px] text-slate-500">
                      <ModeIcon className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {distanceKm} km ·{" "}
                        {co2Kg === 0 ? (isFinnish ? "päästötön" : "zero-emission") : `${co2Kg} kg CO2e`}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {trips.length > 0 && (
            <p className="text-[12px] text-slate-400">
              {isFinnish
                ? "Arvio perustuu tallennettuihin koordinaatteihin ja paikan kulkutapaan — vaihda paikan kulkutapa profiilissa, jos matkustat toisin."
                : "Estimated from the saved coordinates and each place's transport mode — change a place's mode in your profile if you travel differently."}
            </p>
          )}
        </>
      )}

      {placesMissingAddress > 0 && trips.length > 0 && (
        <p className="text-[12px] text-slate-500">
          {isFinnish
            ? `${placesMissingAddress} tallennettua suosikkipaikkaa ilman osoitetta — `
            : `${placesMissingAddress} favourite ${placesMissingAddress === 1 ? "location has" : "locations have"} no looked-up address — `}
          <Link href={placesHref} className="font-bold text-fuchsia-700 hover:underline">
            {isFinnish ? "lisää osoite" : "add one"}
          </Link>
          {isFinnish ? " saadaksesi ne mukaan." : " to get them here too."}
        </p>
      )}

      {errorMessage && <p className="text-xs text-rose-600 font-medium">{errorMessage}</p>}

      {lastLog && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
          <p className="text-xs font-bold text-emerald-900 min-w-0">
            {isFinnish ? "Kirjattu:" : "Logged:"} <span className="font-semibold">{lastLog.summary}</span>
          </p>
          <button
            type="button"
            onClick={handleUndo}
            disabled={isUndoing}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 text-[12px] font-bold transition"
          >
            {isUndoing ? <Spinner className="w-3 h-3 animate-spin" /> : <Undo2 className="w-3 h-3" />}
            <span>{isFinnish ? "Kumoa" : "Undo"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
