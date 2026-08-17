import type { Role, SubmissionStatus } from "@/lib/constants";

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

export type Submission = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  district_id: string | null;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
};

export type SubmissionInsert = Pick<
  Submission,
  "title" | "description" | "latitude" | "longitude"
> &
  Partial<Pick<Submission, "district_id">>;

export type SubmissionUpdate = Partial<
  Pick<Submission, "title" | "description" | "status" | "district_id">
>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, "id">;
        Update: ProfileUpdate;
        Relationships: [];
      };
      submissions: {
        Row: Submission;
        Insert: SubmissionInsert & { user_id: string };
        Update: SubmissionUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
