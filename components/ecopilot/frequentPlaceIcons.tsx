import { Briefcase, ShoppingCart, Baby, GraduationCap, Dumbbell, HeartPulse, Users, TrainFront, TreePine, MapPin } from "lucide-react";
import type { FrequentPlaceIconKey } from "@/lib/ecopilot/types";

/**
 * String key → lucide icon for a frequently-visited place. Kept out of
 * lib/ecopilot/types.ts so that file stays UI-free; shared here so the
 * profile editor and any later trip-logging UI render the same icons.
 */
export const FREQUENT_PLACE_ICONS: Record<FrequentPlaceIconKey, typeof MapPin> = {
  work: Briefcase,
  grocery: ShoppingCart,
  daycare: Baby,
  school: GraduationCap,
  gym: Dumbbell,
  health: HeartPulse,
  family: Users,
  transit: TrainFront,
  home: TreePine,
  other: MapPin,
};

/** Icon keys in quick-select order, with bilingual hint labels (tooltip / a11y). */
export const FREQUENT_PLACE_ICON_META: { key: FrequentPlaceIconKey; en: string; fi: string }[] = [
  { key: "work", en: "Work", fi: "Työ" },
  { key: "grocery", en: "Groceries", fi: "Ruokakauppa" },
  { key: "daycare", en: "Day care", fi: "Päiväkoti" },
  { key: "school", en: "School", fi: "Koulu" },
  { key: "gym", en: "Sports / hobby", fi: "Liikunta / harrastus" },
  { key: "health", en: "Health", fi: "Terveys" },
  { key: "family", en: "Family / friends", fi: "Perhe / ystävät" },
  { key: "transit", en: "Station / stop", fi: "Asema / pysäkki" },
  { key: "home", en: "Cabin / second home", fi: "Mökki / toinen koti" },
  { key: "other", en: "Other", fi: "Muu" },
];
