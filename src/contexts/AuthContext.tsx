import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User, LoginCredentials, SignupCredentials } from '@/types/auth';
import { getProfile } from '@/services/profileService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsOnboarding: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Convert Supabase user to app User type (basic info from auth)
 */
function mapSupabaseUserBasic(supabaseUser: SupabaseUser): User {
  const metadata = supabaseUser.user_metadata || {};
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name:
      (metadata['display_name'] as string) ||
      supabaseUser.email?.split('@')[0] ||
      'User',
    avatarUrl: metadata['avatar_url'] as string | undefined,
  };
}

/**
 * AuthProvider
 *
 * Manages authentication state with Supabase Auth.
 * Falls back to demo mode when Supabase is not configured.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load full profile data from Supabase and merge with user
   */
  const loadUserProfile = async (supabaseUser: SupabaseUser): Promise<User> => {
    const basicUser = mapSupabaseUserBasic(supabaseUser);

    if (!isSupabaseConfigured) {
      return basicUser;
    }

    const profile = await getProfile(supabaseUser.id);

    if (profile) {
      setNeedsOnboarding(!profile.onboardingCompleted);
      return {
        ...basicUser,
        name: profile.displayName || basicUser.name,
        avatarUrl: profile.avatarUrl || basicUser.avatarUrl,
        role: profile.role,
        onboardingCompleted: profile.onboardingCompleted,
        organization: profile.organization,
        isPremium: profile.isPremium,
      };
    }

    // New user without profile data - needs onboarding
    setNeedsOnboarding(true);
    return basicUser;
  };

  /**
   * Refresh profile data (called after onboarding completion)
   */
  const refreshProfile = async () => {
    if (!isSupabaseConfigured) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const updatedUser = await loadUserProfile(session.user);
      setUser(updatedUser);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Demo mode: load from localStorage
      const savedUser = localStorage.getItem('adaptive-trainer-user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser) as User;
          setUser(parsed);
          setNeedsOnboarding(!parsed.onboardingCompleted);
        } catch {
          localStorage.removeItem('adaptive-trainer-user');
        }
      }
      setIsLoading(false);
      return;
    }

    // Get initial session and load profile
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const userWithProfile = await loadUserProfile(session.user);
        setUser(userWithProfile);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        if (session?.user) {
          const userWithProfile = await loadUserProfile(session.user);
          setUser(userWithProfile);
        } else {
          setUser(null);
          setNeedsOnboarding(false);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      if (!isSupabaseConfigured) {
        // Demo mode
        await new Promise((resolve) => setTimeout(resolve, 500));
        const demoUser: User = {
          id: `demo-${Date.now()}`,
          email: credentials.email,
          name: credentials.email.split('@')[0] || 'User',
        };
        setUser(demoUser);
        localStorage.setItem('adaptive-trainer-user', JSON.stringify(demoUser));
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (data.user) {
        const userWithProfile = await loadUserProfile(data.user);
        setUser(userWithProfile);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (credentials: SignupCredentials): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      if (credentials.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      if (!isSupabaseConfigured) {
        // Demo mode: treat signup as login
        await new Promise((resolve) => setTimeout(resolve, 500));
        const demoUser: User = {
          id: `demo-${Date.now()}`,
          email: credentials.email,
          name: credentials.displayName || credentials.email.split('@')[0] || 'User',
        };
        setUser(demoUser);
        localStorage.setItem('adaptive-trainer-user', JSON.stringify(demoUser));
        return;
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            display_name: credentials.displayName || credentials.email.split('@')[0],
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        throw new Error(
          'Check your email for a confirmation link to complete signup.'
        );
      }

      if (data.user) {
        const userWithProfile = await loadUserProfile(data.user);
        setUser(userWithProfile);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setError(null);

    if (!isSupabaseConfigured) {
      // Demo mode
      setUser(null);
      localStorage.removeItem('adaptive-trainer-user');
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error('Logout error:', signOutError);
    }
    setUser(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        needsOnboarding,
        error,
        login,
        signup,
        logout,
        clearError,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 *
 * Access auth state and methods from anywhere in the app.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
