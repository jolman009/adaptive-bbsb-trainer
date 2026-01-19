/**
 * Supabase Database Types
 *
 * These types match the database schema defined in supabase-schema.sql.
 * Update this file when the schema changes.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TeamRole = 'owner' | 'admin' | 'member';
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'player' | 'coach' | 'admin';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          is_premium: boolean;
          role: UserRole | null;
          onboarding_completed: boolean;
          organization: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          is_premium?: boolean;
          role?: UserRole | null;
          onboarding_completed?: boolean;
          organization?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          is_premium?: boolean;
          role?: UserRole | null;
          onboarding_completed?: boolean;
          organization?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      drill_sessions: {
        Row: {
          id: string;
          user_id: string;
          total_attempts: number;
          total_correct: number;
          best_streak: number;
          scenarios_mastered: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_attempts?: number;
          total_correct?: number;
          best_streak?: number;
          scenarios_mastered?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          total_attempts?: number;
          total_correct?: number;
          best_streak?: number;
          scenarios_mastered?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'drill_sessions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      scenario_progress: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          scenario_id: string;
          correct: number;
          incorrect: number;
          partial: number;
          timeouts: number;
          repetitions: number;
          interval_days: number;
          ease: number;
          next_due: string;
          last_shown: string | null;
          last_answer: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          scenario_id: string;
          correct?: number;
          incorrect?: number;
          partial?: number;
          timeouts?: number;
          repetitions?: number;
          interval_days?: number;
          ease?: number;
          next_due?: string;
          last_shown?: string | null;
          last_answer?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          correct?: number;
          incorrect?: number;
          partial?: number;
          timeouts?: number;
          repetitions?: number;
          interval_days?: number;
          ease?: number;
          next_due?: string;
          last_shown?: string | null;
          last_answer?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'scenario_progress_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scenario_progress_session_id_fkey';
            columns: ['session_id'];
            referencedRelation: 'drill_sessions';
            referencedColumns: ['id'];
          }
        ];
      };
      teams: {
        Row: {
          id: string;
          name: string;
          code: string;
          description: string | null;
          owner_id: string;
          max_members: number;
          require_approval: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code?: string;
          description?: string | null;
          owner_id: string;
          max_members?: number;
          require_approval?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          code?: string;
          description?: string | null;
          max_members?: number;
          require_approval?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'teams_owner_id_fkey';
            columns: ['owner_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: TeamRole;
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role?: TeamRole;
          joined_at?: string;
        };
        Update: {
          role?: TeamRole;
        };
        Relationships: [
          {
            foreignKeyName: 'team_members_team_id_fkey';
            columns: ['team_id'];
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_members_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      team_join_requests: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          status: JoinRequestStatus;
          requested_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          status?: JoinRequestStatus;
          requested_at?: string;
          responded_at?: string | null;
        };
        Update: {
          status?: JoinRequestStatus;
          responded_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'team_join_requests_team_id_fkey';
            columns: ['team_id'];
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_join_requests_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      leaderboard_stats: {
        Row: {
          user_id: string;
          display_name: string | null;
          accuracy_pct: number;
          best_streak: number;
          scenarios_mastered: number;
          total_attempts: number;
        };
        Relationships: [];
      };
      team_leaderboard_stats: {
        Row: {
          team_id: string;
          user_id: string;
          display_name: string | null;
          accuracy_pct: number;
          best_streak: number;
          scenarios_mastered: number;
          total_attempts: number;
          role: TeamRole;
          joined_at: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      update_session_aggregates: {
        Args: { p_session_id: string };
        Returns: void;
      };
      refresh_leaderboard: {
        Args: Record<string, never>;
        Returns: void;
      };
      refresh_team_leaderboard: {
        Args: Record<string, never>;
        Returns: void;
      };
      generate_team_code: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_user_teams: {
        Args: { p_user_id: string };
        Returns: {
          team_id: string;
          team_name: string;
          team_code: string;
          user_role: TeamRole;
          member_count: number;
          owner_name: string;
        }[];
      };
      is_team_member: {
        Args: { p_team_id: string; p_user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      answer_quality: 'best' | 'ok' | 'bad' | 'timeout';
      team_role: TeamRole;
      user_role: UserRole;
    };
  };
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type DrillSessionRow = Database['public']['Tables']['drill_sessions']['Row'];
export type DrillSessionInsert = Database['public']['Tables']['drill_sessions']['Insert'];
export type DrillSessionUpdate = Database['public']['Tables']['drill_sessions']['Update'];

export type ScenarioProgressRow = Database['public']['Tables']['scenario_progress']['Row'];
export type ScenarioProgressInsert = Database['public']['Tables']['scenario_progress']['Insert'];
export type ScenarioProgressUpdate = Database['public']['Tables']['scenario_progress']['Update'];

export type LeaderboardEntry = Database['public']['Views']['leaderboard_stats']['Row'];
export type TeamLeaderboardEntry = Database['public']['Views']['team_leaderboard_stats']['Row'];

export type Team = Database['public']['Tables']['teams']['Row'];
export type TeamInsert = Database['public']['Tables']['teams']['Insert'];
export type TeamUpdate = Database['public']['Tables']['teams']['Update'];

export type TeamMember = Database['public']['Tables']['team_members']['Row'];
export type TeamMemberInsert = Database['public']['Tables']['team_members']['Insert'];
export type TeamMemberUpdate = Database['public']['Tables']['team_members']['Update'];

export type TeamJoinRequest = Database['public']['Tables']['team_join_requests']['Row'];
export type TeamJoinRequestInsert = Database['public']['Tables']['team_join_requests']['Insert'];
export type TeamJoinRequestUpdate = Database['public']['Tables']['team_join_requests']['Update'];

// Composite types for UI
export interface UserTeam {
  team_id: string;
  team_name: string;
  team_code: string;
  user_role: TeamRole;
  member_count: number;
  owner_name: string;
}

export interface TeamWithMembers extends Team {
  members: (TeamMember & { profile: Profile })[];
}
