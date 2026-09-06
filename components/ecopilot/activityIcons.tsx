import { Car, Zap, Train, Bus, Bike, Footprints, Plane, Ship, Utensils, Flame, Trash2, Globe2 } from "lucide-react";
import type { ActivityMode, Co2LogCategory } from "@/lib/ecopilot/types";

/**
 * Shared lucide icon maps for the CO2 ledger's two axes — how you travelled
 * (ActivityMode) and which ledger bucket an entry lands in (Co2LogCategory).
 * Kept here so the activity logger and the quick-trip panel render the same
 * icon for the same mode.
 */
export const ACTIVITY_MODE_ICONS: Record<ActivityMode, typeof Car> = {
  car: Car,
  ev: Zap,
  train: Train,
  bus: Bus,
  bike: Bike,
  walk: Footprints,
  plane: Plane,
  ferry: Ship,
};

export const CO2_CATEGORY_ICONS: Record<Co2LogCategory, typeof Car> = {
  transport: Car,
  food: Utensils,
  energy: Zap,
  heating: Flame,
  waste: Trash2,
  other: Globe2,
};
