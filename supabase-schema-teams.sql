-- Diamond IQ Teams Feature Schema
-- Run this AFTER the base schema (supabase-schema.sql)
-- This adds team functionality for premium users

-- ============================================
-- 1. ADD PREMIUM FIELD TO PROFILES
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE NOT NULL;

-- ============================================
-- 2. TEAM ROLES ENUM
-- ============================================
DO $$ BEGIN
  CREATE TYPE team_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 3. TEAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,  -- 8-char join code like "TIGERS24"
  description TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  max_members INTEGER DEFAULT 30 NOT NULL,
  require_approval BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- 4. TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role team_role DEFAULT 'member' NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_team_member UNIQUE (team_id, user_id)
);

-- ============================================
-- 5. TEAM JOIN REQUESTS TABLE (for approval mode)
-- ============================================
CREATE TABLE IF NOT EXISTS public.team_join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  responded_at TIMESTAMPTZ,

  CONSTRAINT unique_join_request UNIQUE (team_id, user_id)
);

-- ============================================
-- 6. FUNCTION: Generate unique team code
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_team_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- No I, O, 0, 1 to avoid confusion
  code TEXT := '';
  i INTEGER;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    -- Check if code already exists
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.teams WHERE teams.code = code);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. TRIGGER: Auto-generate team code on insert
-- ============================================
CREATE OR REPLACE FUNCTION public.set_team_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := public.generate_team_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_team_insert_set_code ON public.teams;
CREATE TRIGGER on_team_insert_set_code
  BEFORE INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.set_team_code();

-- ============================================
-- 8. TRIGGER: Add owner as team member on create
-- ============================================
CREATE OR REPLACE FUNCTION public.add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_team_created_add_owner ON public.teams;
CREATE TRIGGER on_team_created_add_owner
  AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.add_owner_as_member();

-- ============================================
-- 9. TEAM LEADERBOARD VIEW (Materialized)
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.team_leaderboard_stats AS
SELECT
  tm.team_id,
  ds.user_id,
  p.display_name,
  CASE
    WHEN ds.total_attempts > 0
    THEN ROUND((ds.total_correct::NUMERIC / ds.total_attempts) * 100, 1)
    ELSE 0
  END AS accuracy_pct,
  ds.best_streak,
  ds.scenarios_mastered,
  ds.total_attempts,
  tm.role,
  tm.joined_at
FROM public.team_members tm
JOIN public.drill_sessions ds ON tm.user_id = ds.user_id
JOIN public.profiles p ON tm.user_id = p.id
WHERE ds.total_attempts >= 5  -- Lower threshold for team leaderboards
ORDER BY accuracy_pct DESC, ds.best_streak DESC;

-- Indexes for team leaderboard
CREATE INDEX IF NOT EXISTS idx_team_leaderboard_team ON public.team_leaderboard_stats(team_id);
CREATE INDEX IF NOT EXISTS idx_team_leaderboard_user ON public.team_leaderboard_stats(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_leaderboard_team_user ON public.team_leaderboard_stats(team_id, user_id);

-- Function to refresh team leaderboard
CREATE OR REPLACE FUNCTION public.refresh_team_leaderboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.team_leaderboard_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. ROW LEVEL SECURITY FOR TEAMS
-- ============================================

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

-- Teams: Anyone can view teams they're a member of
CREATE POLICY "Users can view teams they belong to" ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
    )
  );

-- Teams: Premium users can create teams
CREATE POLICY "Premium users can create teams" ON public.teams
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_premium = TRUE
    )
  );

-- Teams: Owners can update their teams
CREATE POLICY "Owners can update their teams" ON public.teams
  FOR UPDATE USING (auth.uid() = owner_id);

-- Teams: Owners can delete their teams
CREATE POLICY "Owners can delete their teams" ON public.teams
  FOR DELETE USING (auth.uid() = owner_id);

-- Team Members: Users can view members of teams they belong to
CREATE POLICY "Users can view team members" ON public.team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
    )
  );

-- Team Members: Admins/owners can add members
CREATE POLICY "Admins can add team members" ON public.team_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
    OR
    -- Or user is joining themselves (for direct join without approval)
    (
      auth.uid() = user_id AND
      EXISTS (
        SELECT 1 FROM public.teams t
        WHERE t.id = team_members.team_id
        AND t.require_approval = FALSE
      )
    )
  );

-- Team Members: Admins/owners can update roles
CREATE POLICY "Admins can update team members" ON public.team_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- Team Members: Admins can remove members, or users can remove themselves
CREATE POLICY "Admins can remove members or self-remove" ON public.team_members
  FOR DELETE USING (
    auth.uid() = user_id  -- Can always leave
    OR
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- Join Requests: Users can view their own requests
CREATE POLICY "Users can view own join requests" ON public.team_join_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Join Requests: Admins can view team requests
CREATE POLICY "Admins can view team join requests" ON public.team_join_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_join_requests.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- Join Requests: Users can create requests
CREATE POLICY "Users can create join requests" ON public.team_join_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Join Requests: Admins can update (approve/reject)
CREATE POLICY "Admins can update join requests" ON public.team_join_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_join_requests.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- 11. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_teams_owner ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_code ON public.teams(code);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_team ON public.team_join_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_user ON public.team_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_status ON public.team_join_requests(status);

-- ============================================
-- 12. HELPER FUNCTION: Get user's teams
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_teams(p_user_id UUID)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  team_code TEXT,
  user_role team_role,
  member_count BIGINT,
  owner_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id as team_id,
    t.name as team_name,
    t.code as team_code,
    tm.role as user_role,
    (SELECT COUNT(*) FROM public.team_members WHERE team_members.team_id = t.id) as member_count,
    p.display_name as owner_name
  FROM public.teams t
  JOIN public.team_members tm ON t.id = tm.team_id
  JOIN public.profiles p ON t.owner_id = p.id
  WHERE tm.user_id = p_user_id
  ORDER BY tm.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 13. HELPER FUNCTION: Check team membership
-- ============================================
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 14. POLICY: Allow viewing teams by code (for joining)
-- ============================================
CREATE POLICY "Anyone can view team by code" ON public.teams
  FOR SELECT USING (TRUE);
-- Note: This allows viewing basic team info for joining.
-- Sensitive data should not be in the teams table.
