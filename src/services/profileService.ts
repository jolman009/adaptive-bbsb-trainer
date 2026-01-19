/**
 * Profile Service
 *
 * Handles profile data operations with Supabase.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { ProfileUpdate } from '@/types/supabase';
import type { UserRole } from '@/types/auth';

export interface ProfileData {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole | null;
  onboardingCompleted: boolean;
  organization: string | null;
  isPremium: boolean;
}

/**
 * Fetch user profile from Supabase
 */
export async function getProfile(userId: string): Promise<ProfileData | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    role: data.role as UserRole | null,
    onboardingCompleted: data.onboarding_completed ?? false,
    organization: data.organization,
    isPremium: data.is_premium ?? false,
  };
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: {
    displayName?: string;
    role?: UserRole;
    organization?: string;
    onboardingCompleted?: boolean;
  }
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  const profileUpdate: ProfileUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (updates.displayName !== undefined) {
    profileUpdate.display_name = updates.displayName;
  }
  if (updates.role !== undefined) {
    profileUpdate.role = updates.role;
  }
  if (updates.organization !== undefined) {
    profileUpdate.organization = updates.organization;
  }
  if (updates.onboardingCompleted !== undefined) {
    profileUpdate.onboarding_completed = updates.onboardingCompleted;
  }

  const { error } = await supabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Complete onboarding with all required fields
 */
export async function completeOnboarding(
  userId: string,
  data: {
    displayName: string;
    role: UserRole;
    organization?: string;
  }
): Promise<{ success: boolean; error: string | null }> {
  return updateProfile(userId, {
    displayName: data.displayName,
    role: data.role,
    organization: data.organization,
    onboardingCompleted: true,
  });
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const profile = await getProfile(userId);
  return profile?.onboardingCompleted ?? false;
}
