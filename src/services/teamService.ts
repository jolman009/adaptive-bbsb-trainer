/**
 * Team Service
 *
 * Handles all team-related CRUD operations for the premium teams feature.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  Team,
  TeamInsert,
  TeamUpdate,
  TeamMember,
  TeamMemberInsert,
  TeamJoinRequest,
  TeamJoinRequestInsert,
  TeamLeaderboardEntry,
  UserTeam,
  TeamRole,
} from '@/types/supabase';

// Cache for user teams (5 minute TTL)
let userTeamsCache: { data: UserTeam[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Check if user is premium
 */
export async function checkPremiumStatus(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('is_premium')
    .eq('id', userId)
    .single();

  if (error || !data) return false;
  return data.is_premium;
}

/**
 * Create a new team (premium users only)
 */
export async function createTeam(
  ownerId: string,
  name: string,
  description?: string,
  requireApproval = false
): Promise<{ team: Team | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { team: null, error: 'Supabase not configured' };
  }

  // Verify premium status
  const isPremium = await checkPremiumStatus(ownerId);
  if (!isPremium) {
    return { team: null, error: 'Only premium users can create teams' };
  }

  const teamData: TeamInsert = {
    name,
    owner_id: ownerId,
    description: description || null,
    require_approval: requireApproval,
  };

  const { data, error } = await supabase
    .from('teams')
    .insert(teamData)
    .select()
    .single();

  if (error) {
    console.error('Error creating team:', error);
    return { team: null, error: error.message };
  }

  // Invalidate cache
  userTeamsCache = null;

  return { team: data, error: null };
}

/**
 * Get team by join code
 */
export async function getTeamByCode(code: string): Promise<Team | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error) {
    console.error('Error fetching team by code:', error);
    return null;
  }

  return data;
}

/**
 * Get team by ID
 */
export async function getTeamById(teamId: string): Promise<Team | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single();

  if (error) {
    console.error('Error fetching team:', error);
    return null;
  }

  return data;
}

/**
 * Get all teams for a user
 */
export async function getUserTeams(userId: string, useCache = true): Promise<UserTeam[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  // Check cache
  if (useCache && userTeamsCache && Date.now() - userTeamsCache.timestamp < CACHE_TTL) {
    return userTeamsCache.data;
  }

  const { data, error } = await supabase.rpc('get_user_teams', { p_user_id: userId });

  if (error) {
    console.error('Error fetching user teams:', error);
    return [];
  }

  const teams = (data || []) as UserTeam[];

  // Update cache
  userTeamsCache = { data: teams, timestamp: Date.now() };

  return teams;
}

/**
 * Join a team by code
 */
export async function joinTeam(
  userId: string,
  teamCode: string
): Promise<{ success: boolean; error: string | null; requiresApproval?: boolean }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  // Find team by code
  const team = await getTeamByCode(teamCode);
  if (!team) {
    return { success: false, error: 'Team not found. Check the code and try again.' };
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', team.id)
    .eq('user_id', userId)
    .single();

  if (existingMember) {
    return { success: false, error: 'You are already a member of this team' };
  }

  // Check team capacity
  const { count } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', team.id);

  if (count !== null && count >= team.max_members) {
    return { success: false, error: 'This team is full' };
  }

  // If team requires approval, create a join request
  if (team.require_approval) {
    // Check for existing pending request
    const { data: existingRequest } = await supabase
      .from('team_join_requests')
      .select('id, status')
      .eq('team_id', team.id)
      .eq('user_id', userId)
      .single();

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return { success: false, error: 'You already have a pending request to join this team' };
      }
      if (existingRequest.status === 'rejected') {
        return { success: false, error: 'Your request to join this team was previously rejected' };
      }
    }

    const requestData: TeamJoinRequestInsert = {
      team_id: team.id,
      user_id: userId,
    };

    const { error } = await supabase.from('team_join_requests').insert(requestData);

    if (error) {
      console.error('Error creating join request:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null, requiresApproval: true };
  }

  // Direct join (no approval required)
  const memberData: TeamMemberInsert = {
    team_id: team.id,
    user_id: userId,
    role: 'member',
  };

  const { error } = await supabase.from('team_members').insert(memberData);

  if (error) {
    console.error('Error joining team:', error);
    return { success: false, error: error.message };
  }

  // Invalidate cache
  userTeamsCache = null;

  return { success: true, error: null };
}

/**
 * Leave a team
 */
export async function leaveTeam(
  userId: string,
  teamId: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  // Check if user is the owner
  const team = await getTeamById(teamId);
  if (team && team.owner_id === userId) {
    return { success: false, error: 'Team owners cannot leave. Transfer ownership or delete the team.' };
  }

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error leaving team:', error);
    return { success: false, error: error.message };
  }

  // Invalidate cache
  userTeamsCache = null;

  return { success: true, error: null };
}

/**
 * Update team details (owner/admin only)
 */
export async function updateTeam(
  teamId: string,
  updates: TeamUpdate
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  const { error } = await supabase
    .from('teams')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', teamId);

  if (error) {
    console.error('Error updating team:', error);
    return { success: false, error: error.message };
  }

  // Invalidate cache
  userTeamsCache = null;

  return { success: true, error: null };
}

/**
 * Delete a team (owner only)
 */
export async function deleteTeam(teamId: string): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  const { error } = await supabase.from('teams').delete().eq('id', teamId);

  if (error) {
    console.error('Error deleting team:', error);
    return { success: false, error: error.message };
  }

  // Invalidate cache
  userTeamsCache = null;

  return { success: true, error: null };
}

/**
 * Get team members
 */
export async function getTeamMembers(teamId: string): Promise<(TeamMember & { email?: string; display_name?: string })[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('team_members')
    .select(`
      *,
      profiles:user_id (
        email,
        display_name
      )
    `)
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true });

  if (error) {
    console.error('Error fetching team members:', error);
    return [];
  }

  // Flatten the profile data
  return (data || []).map((member) => ({
    ...member,
    email: (member.profiles as { email?: string })?.email,
    display_name: (member.profiles as { display_name?: string })?.display_name,
  }));
}

/**
 * Update member role (owner/admin only)
 */
export async function updateMemberRole(
  teamId: string,
  memberId: string,
  newRole: TeamRole
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  // Cannot change owner role
  if (newRole === 'owner') {
    return { success: false, error: 'Cannot assign owner role. Use transfer ownership instead.' };
  }

  const { error } = await supabase
    .from('team_members')
    .update({ role: newRole })
    .eq('team_id', teamId)
    .eq('user_id', memberId);

  if (error) {
    console.error('Error updating member role:', error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Remove a member from team (admin/owner only)
 */
export async function removeMember(
  teamId: string,
  memberId: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  // Check if trying to remove owner
  const team = await getTeamById(teamId);
  if (team && team.owner_id === memberId) {
    return { success: false, error: 'Cannot remove the team owner' };
  }

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', memberId);

  if (error) {
    console.error('Error removing member:', error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Get pending join requests for a team (admin/owner only)
 */
export async function getJoinRequests(teamId: string): Promise<(TeamJoinRequest & { email?: string; display_name?: string })[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('team_join_requests')
    .select(`
      *,
      profiles:user_id (
        email,
        display_name
      )
    `)
    .eq('team_id', teamId)
    .eq('status', 'pending')
    .order('requested_at', { ascending: true });

  if (error) {
    console.error('Error fetching join requests:', error);
    return [];
  }

  return (data || []).map((request) => ({
    ...request,
    email: (request.profiles as { email?: string })?.email,
    display_name: (request.profiles as { display_name?: string })?.display_name,
  }));
}

/**
 * Approve or reject a join request (admin/owner only)
 */
export async function respondToJoinRequest(
  requestId: string,
  teamId: string,
  userId: string,
  approve: boolean
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  const status = approve ? 'approved' : 'rejected';

  // Update request status
  const { error: updateError } = await supabase
    .from('team_join_requests')
    .update({ status, responded_at: new Date().toISOString() })
    .eq('id', requestId);

  if (updateError) {
    console.error('Error updating join request:', updateError);
    return { success: false, error: updateError.message };
  }

  // If approved, add member to team
  if (approve) {
    const memberData: TeamMemberInsert = {
      team_id: teamId,
      user_id: userId,
      role: 'member',
    };

    const { error: memberError } = await supabase.from('team_members').insert(memberData);

    if (memberError) {
      console.error('Error adding approved member:', memberError);
      return { success: false, error: memberError.message };
    }
  }

  return { success: true, error: null };
}

/**
 * Get team leaderboard
 */
export async function getTeamLeaderboard(teamId: string): Promise<TeamLeaderboardEntry[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('team_leaderboard_stats')
    .select('*')
    .eq('team_id', teamId)
    .order('accuracy_pct', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching team leaderboard:', error);
    return [];
  }

  return data || [];
}

/**
 * Refresh team leaderboard materialized view
 */
export async function refreshTeamLeaderboard(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase.rpc('refresh_team_leaderboard');

  if (error) {
    console.error('Error refreshing team leaderboard:', error);
  }
}

/**
 * Clear the teams cache
 */
export function clearTeamsCache(): void {
  userTeamsCache = null;
}
