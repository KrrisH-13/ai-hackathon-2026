"use client";

import { API_ROUTES } from "@/lib/constants";
import type { UserProfile, Co2LogEntry, Co2DailyTotal, Co2LogCategory } from "./types";

/**
 * Browser-side wrappers around app/api/ecopilot/** (the persisted profile +
 * CO2 ledger, as opposed to the Gemini proxy routes in lib/ecopilot/client.ts).
 * These throw on failure — callers decide how to surface that, there's no
 * offline fallback since this is the user's own real data.
 */

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export function fetchEcopilotProfileAPI(): Promise<UserProfile> {
  return request(API_ROUTES.ecopilotProfile);
}

export function updateEcopilotProfileAPI(patch: Partial<UserProfile>): Promise<UserProfile> {
  return request(API_ROUTES.ecopilotProfile, { method: "PATCH", body: JSON.stringify(patch) });
}

export function fetchCo2LogsAPI(days = 30): Promise<{ entries: Co2LogEntry[]; dailyTotals: Co2DailyTotal[] }> {
  return request(`${API_ROUTES.ecopilotCo2Logs}?days=${days}`);
}

export function addCo2LogAPI(entry: {
  category: Co2LogCategory;
  description: string;
  co2Kg: number;
  occurredOn?: string;
  /** Tags the entry for the CO2 tracker chart and any feature (e.g. rewards) that reads it later. Defaults server-side to "manual". */
  source?: "manual" | "activity-logger";
}) {
  return request(API_ROUTES.ecopilotCo2Logs, { method: "POST", body: JSON.stringify(entry) });
}

export function deleteCo2LogAPI(id: string): Promise<{ success: true }> {
  return request(API_ROUTES.ecopilotCo2Log(id), { method: "DELETE" });
}
