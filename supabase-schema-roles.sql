-- Diamond IQ User Roles Schema Update
-- Run this AFTER the base schema (supabase-schema.sql)
-- This adds user role and profile completion tracking

-- ============================================
-- 1. USER ROLE ENUM
-- ============================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('player', 'coach', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. ADD ROLE AND ONBOARDING FIELDS TO PROFILES
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role user_role DEFAULT NULL,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS organization TEXT;

-- ============================================
-- 3. UPDATE PROFILE RLS TO ALLOW PROFILE COMPLETION
-- ============================================
-- Users need to be able to update their own profile during onboarding
-- (This should already exist from base schema, but ensure it's there)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 4. FUNCTION: Check if profile is complete
-- ============================================
CREATE OR REPLACE FUNCTION public.is_profile_complete(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id
    AND role IS NOT NULL
    AND display_name IS NOT NULL
    AND onboarding_completed = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. COACH-SPECIFIC VIEWS (for future analytics)
-- ============================================
-- Coaches can view their team members' progress
-- This is handled by team membership, but we add a helper function

CREATE OR REPLACE FUNCTION public.get_coached_players(p_coach_id UUID)
RETURNS TABLE (
  player_id UUID,
  display_name TEXT,
  team_name TEXT,
  accuracy_pct NUMERIC,
  total_attempts INTEGER,
  scenarios_mastered INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    tm.user_id as player_id,
    p.display_name,
    t.name as team_name,
    CASE
      WHEN ds.total_attempts > 0
      THEN ROUND((ds.total_correct::NUMERIC / ds.total_attempts) * 100, 1)
      ELSE 0
    END AS accuracy_pct,
    ds.total_attempts,
    ds.scenarios_mastered
  FROM public.team_members tm
  JOIN public.teams t ON tm.team_id = t.id
  JOIN public.profiles p ON tm.user_id = p.id
  LEFT JOIN public.drill_sessions ds ON tm.user_id = ds.user_id
  WHERE EXISTS (
    -- Coach must be owner or admin of a team the player belongs to
    SELECT 1 FROM public.team_members coach_tm
    WHERE coach_tm.team_id = tm.team_id
    AND coach_tm.user_id = p_coach_id
    AND coach_tm.role IN ('owner', 'admin')
  )
  AND tm.user_id != p_coach_id
  ORDER BY p.display_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
