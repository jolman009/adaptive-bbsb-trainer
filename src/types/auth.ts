/**
 * Auth Types
 *
 * Represents user authentication state with Supabase.
 */

export type UserRole = 'player' | 'coach' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role?: UserRole | null;
  onboardingCompleted?: boolean;
  organization?: string | null;
  isPremium?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  displayName?: string;
}
