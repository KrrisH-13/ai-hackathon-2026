import type { Role } from "@/lib/constants";
import type {
  EspooDistrict,
  HousingType,
  HeatingSystem,
  ElectricityContract,
  CommuteHabit,
  CarType,
  WasteManagementSystem,
  SaunaType,
  Co2LogCategory,
} from "@/lib/ecopilot/types";

/**
 * Hand-maintained mirror of the Supabase schema (see
 * supabase/migrations/v001_initial_schema.sql). Regenerate/update this
 * whenever a migration changes table shape. If you have the Supabase CLI
 * set up, prefer `supabase gen types typescript` and paste the output
 * into the `Database` type below.
 */

export type Profile = {
  id: string;
  role: Role;
  district_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileUpdate = Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;

export type JobStatus = "pending" | "processing" | "completed" | "failed";

/**
 * Background job queue (see lib/jobs/). Only ever accessed with the
 * service-role client (lib/supabase/admin.ts) from trusted server code —
 * there's no RLS policy for anon/authenticated on this table.
 */
export type Job = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  run_after: string;
  created_at: string;
  updated_at: string;
};

export type JobInsert = {
  type: string;
  payload?: Record<string, unknown>;
  max_attempts?: number;
  run_after?: string;
};

export type JobUpdate = Partial<Pick<Job, "status" | "last_error">>;

/**
 * One row per user (see supabase/migrations/20260822090000_*.sql), auto-created
 * on signup by the handle_new_user() trigger. Powers the ecopilot feature's
 * personalized profile — mapped to the camelCase UserProfile shape (see
 * lib/ecopilot/queries.ts) that the ported UI components already expect.
 */
export type EcopilotProfile = {
  user_id: string;
  district: EspooDistrict;
  housing_type: HousingType;
  living_area_sq_m: number;
  household_size: number;
  heating_system: HeatingSystem;
  electricity_contract: ElectricityContract;
  sauna_type: SaunaType;
  sauna_times_per_week: number;
  commute_habit: CommuteHabit;
  /** Only meaningful when commute_habit involves driving. */
  car_type: CarType | null;
  car_co2_grams_per_km: number | null;
  waste_management_system: WasteManagementSystem;
  energy_saving_measures: string[];
  estimated_footprint_tonnes: number;
  target_footprint_tonnes: number;
  created_at: string;
  updated_at: string;
};

export type EcopilotProfileUpdate = Partial<Omit<EcopilotProfile, "user_id" | "created_at" | "updated_at">>;

export type Co2LogSource =
  | "manual"
  | "energy-optimizer"
  | "commute-comparator"
  | "waste-classifier"
  | "roadmap-sprint"
  | "activity-logger";

/**
 * Append-only CO2 activity ledger (see lib/ecopilot/queries.ts for the daily
 * aggregation query). co2_kg is signed: positive = emitted, negative =
 * saved/avoided.
 */
export type Co2Log = {
  id: string;
  user_id: string;
  occurred_on: string;
  category: Co2LogCategory;
  description: string;
  co2_kg: number;
  source: Co2LogSource;
  created_at: string;
};

export type Co2LogInsert = {
  occurred_on?: string;
  category: Co2LogCategory;
  description: string;
  co2_kg: number;
  source?: Co2LogSource;
};

/**
 * EcoCredits ledger (see supabase/migrations/20260823130000_*.sql). Balance
 * is sum(amount), computed on read — never stored — same pattern as
 * ecopilot_profiles.saved_co2_kg. Only service_role can write; all earning
 * happens via POST /api/ecopilot/co2-logs, all spending via the
 * redeem_ecopilot_reward() Postgres function.
 */
export type CreditTransaction = {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  co2_log_id: string | null;
  created_at: string;
};

export type CreditTransactionInsert = {
  amount: number;
  reason: string;
  co2_log_id?: string | null;
};

export type RewardRedemption = {
  id: string;
  user_id: string;
  reward_id: string;
  credits_cost: number;
  voucher_code: string;
  redeemed_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, "id">;
        Update: ProfileUpdate;
        Relationships: [];
      };
      jobs: {
        Row: Job;
        Insert: JobInsert;
        Update: JobUpdate;
        Relationships: [];
      };
      ecopilot_profiles: {
        Row: EcopilotProfile;
        Insert: Partial<EcopilotProfile> & Pick<EcopilotProfile, "user_id">;
        Update: EcopilotProfileUpdate;
        Relationships: [];
      };
      ecopilot_co2_logs: {
        Row: Co2Log;
        Insert: Co2LogInsert & { user_id: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      ecopilot_credit_transactions: {
        Row: CreditTransaction;
        Insert: CreditTransactionInsert & { user_id: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      ecopilot_reward_redemptions: {
        Row: RewardRedemption;
        Insert: never;
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      claim_jobs: {
        Args: { job_limit: number };
        Returns: Job[];
      };
      redeem_ecopilot_reward: {
        Args: { p_user_id: string; p_reward_id: string; p_credits_cost: number; p_voucher_code: string };
        Returns: RewardRedemption;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
