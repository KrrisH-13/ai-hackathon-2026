/**
 * Central place to rebrand the app once the hackathon topic is set.
 * Update APP_NAME/APP_DESCRIPTION here and in `app/manifest.ts` +
 * `public/manifest.json`.
 */
export const APP_NAME = "eCopilot";
export const APP_DESCRIPTION = "AI climate copilot for Espoo residents working toward Carbon-Neutral Espoo 2030.";

export const ROLES = ["citizen", "staff", "admin"] as const;
export type Role = (typeof ROLES)[number];

/**
 * `(auth)` and `(dashboard)` are Next.js route groups — the parentheses
 * don't appear in the URL, so `app/(auth)/login/page.tsx` is served at
 * `/login`, not `/auth/login`.
 */
export const ROUTES = {
  home: "/",
  login: "/login",
  callback: "/callback",
  unauthorized: "/unauthorized",
  offline: "/offline",
  dashboard: (role: Role) => `/${role}`,
} as const;

export const API_ROUTES = {
  currentUser: "/api/auth/user",
  upload: "/api/upload",
  jobsProcess: "/api/jobs/process",
  aiChat: "/api/ai/chat",
  aiClassifyWaste: "/api/ai/classify-waste",
  aiOptimizeEnergy: "/api/ai/optimize-energy",
  aiCompareCommute: "/api/ai/compare-commute",
  aiGenerateRoadmapPlan: "/api/ai/generate-roadmap-plan",
  aiWhatIf: "/api/ai/what-if",
  ecopilotProfile: "/api/ecopilot/profile",
  ecopilotCo2Logs: "/api/ecopilot/co2-logs",
  ecopilotCo2Log: (id: string) => `/api/ecopilot/co2-logs/${id}`,
  ecopilotRewards: "/api/ecopilot/rewards",
  ecopilotRewardsRedeem: "/api/ecopilot/rewards/redeem",
  aiScanReceipt: "/api/ai/scan-receipt",
  aiTodaysAction: "/api/ai/todays-action",
} as const;

/** Enforced in app/api/upload/route.ts. Empty array = no MIME restriction. */
export const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
export const ALLOWED_UPLOAD_MIME_TYPES: string[] = [];
