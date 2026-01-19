import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Trophy, Target, Flame, Award, RefreshCw, Globe, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LeaderboardEntry, TeamLeaderboardEntry, UserTeam } from '@/types/supabase';
import {
  fetchLeaderboard,
  getUserRank,
  LeaderboardSortField,
} from '@/services/leaderboardService';
import { getUserTeams, getTeamLeaderboard } from '@/services/teamService';

type TabValue = 'accuracy' | 'streaks' | 'mastered';
type ViewMode = 'global' | 'teams';

const TAB_TO_SORT: Record<TabValue, LeaderboardSortField> = {
  accuracy: 'accuracy_pct',
  streaks: 'best_streak',
  mastered: 'scenarios_mastered',
};

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('global');
  const [activeTab, setActiveTab] = useState<TabValue>('accuracy');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [teamEntries, setTeamEntries] = useState<TeamLeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<{ rank: number; entry: LeaderboardEntry } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Team state
  const [userTeams, setUserTeams] = useState<UserTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [teamsLoading, setTeamsLoading] = useState(false);

  // Load user teams on mount
  useEffect(() => {
    const loadTeams = async () => {
      if (!user) return;
      setTeamsLoading(true);
      const teams = await getUserTeams(user.id);
      setUserTeams(teams);
      if (teams.length > 0 && !selectedTeamId && teams[0]) {
        setSelectedTeamId(teams[0].team_id);
      }
      setTeamsLoading(false);
    };
    loadTeams();
  }, [user]);

  const loadGlobalLeaderboard = async (sortField: LeaderboardSortField, pageNum: number, refresh: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchLeaderboard(sortField, pageNum, refresh);

      if (pageNum === 0) {
        setEntries(result.entries);
      } else {
        setEntries((prev) => [...prev, ...result.entries]);
      }
      setHasMore(result.hasMore);

      // Get current user's rank
      if (user) {
        const rank = await getUserRank(user.id, sortField);
        setUserRank(rank);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamLeaderboard = async (teamId: string) => {
    if (!teamId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getTeamLeaderboard(teamId);

      // Sort by the active tab field
      const sorted = [...data].sort((a, b) => {
        switch (activeTab) {
          case 'accuracy':
            return b.accuracy_pct - a.accuracy_pct;
          case 'streaks':
            return b.best_streak - a.best_streak;
          case 'mastered':
            return b.scenarios_mastered - a.scenarios_mastered;
          default:
            return 0;
        }
      });

      setTeamEntries(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Load appropriate leaderboard when view/team/tab changes
  useEffect(() => {
    setPage(0);
    if (viewMode === 'global') {
      loadGlobalLeaderboard(TAB_TO_SORT[activeTab], 0);
    } else if (selectedTeamId) {
      loadTeamLeaderboard(selectedTeamId);
    }
  }, [viewMode, activeTab, selectedTeamId, user]);

  const handleViewModeChange = (_: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
    if (newMode) {
      setViewMode(newMode);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadGlobalLeaderboard(TAB_TO_SORT[activeTab], nextPage);
  };

  const handleRefresh = () => {
    setPage(0);
    if (viewMode === 'global') {
      loadGlobalLeaderboard(TAB_TO_SORT[activeTab], 0, true);
    } else if (selectedTeamId) {
      loadTeamLeaderboard(selectedTeamId);
    }
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <Trophy size={20} color="#FFD700" />;
    if (rank === 2) return <Trophy size={20} color="#C0C0C0" />;
    if (rank === 3) return <Trophy size={20} color="#CD7F32" />;
    return rank;
  };

  const getStatValue = (entry: LeaderboardEntry | TeamLeaderboardEntry): string | number => {
    switch (activeTab) {
      case 'accuracy':
        return `${entry.accuracy_pct}%`;
      case 'streaks':
        return entry.best_streak;
      case 'mastered':
        return entry.scenarios_mastered;
      default:
        return '';
    }
  };

  const getStatLabel = (): string => {
    switch (activeTab) {
      case 'accuracy':
        return 'Accuracy';
      case 'streaks':
        return 'Best Streak';
      case 'mastered':
        return 'Mastered';
      default:
        return '';
    }
  };

  const currentEntries = viewMode === 'global' ? entries : teamEntries;
  const selectedTeam = userTeams.find((t) => t.team_id === selectedTeamId);

  return (
    <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Leaderboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {viewMode === 'global'
              ? 'See how you rank against all players.'
              : `Compete with your ${selectedTeam?.team_name || 'team'} members.`}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
          >
            <ToggleButton value="global" aria-label="global leaderboard">
              <Globe size={16} style={{ marginRight: 6 }} />
              Global
            </ToggleButton>
            <ToggleButton value="teams" aria-label="team leaderboards" disabled={userTeams.length === 0}>
              <Users size={16} style={{ marginRight: 6 }} />
              Teams
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshCw size={16} />}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Team Selector (when in teams mode) */}
      {viewMode === 'teams' && (
        <Paper sx={{ p: 2, mb: 3 }}>
          {teamsLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="textSecondary">
                Loading your teams...
              </Typography>
            </Box>
          ) : userTeams.length === 0 ? (
            <Alert severity="info">
              You are not a member of any teams yet. Join a team to see team leaderboards!
            </Alert>
          ) : (
            <FormControl fullWidth size="small">
              <InputLabel>Select Team</InputLabel>
              <Select
                value={selectedTeamId}
                label="Select Team"
                onChange={(e) => setSelectedTeamId(e.target.value)}
              >
                {userTeams.map((team) => (
                  <MenuItem key={team.team_id} value={team.team_id}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Users size={16} />
                      <span>{team.team_name}</span>
                      <Chip
                        label={`${team.member_count} members`}
                        size="small"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                      {team.user_role === 'owner' && (
                        <Chip label="Owner" size="small" color="primary" />
                      )}
                      {team.user_role === 'admin' && (
                        <Chip label="Admin" size="small" color="secondary" />
                      )}
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Paper>
      )}

      {/* Current User Rank Card (global only) */}
      {viewMode === 'global' && userRank && (
        <Card sx={{ mb: 3, bgcolor: 'primary.50', border: 1, borderColor: 'primary.200' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  #{userRank.rank}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Your Rank
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {userRank.entry.display_name || 'You'}
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1 }} flexWrap="wrap">
                  <Chip
                    icon={<Target size={14} />}
                    label={`${userRank.entry.accuracy_pct}% Accuracy`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={<Flame size={14} />}
                    label={`${userRank.entry.best_streak} Streak`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={<Award size={14} />}
                    label={`${userRank.entry.scenarios_mastered} Mastered`}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab
            icon={<Target size={18} />}
            iconPosition="start"
            label="Accuracy"
            value="accuracy"
          />
          <Tab
            icon={<Flame size={18} />}
            iconPosition="start"
            label="Streaks"
            value="streaks"
          />
          <Tab
            icon={<Award size={18} />}
            iconPosition="start"
            label="Mastered"
            value="mastered"
          />
        </Tabs>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Leaderboard Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: 80 }}>Rank</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Player</TableCell>
                {viewMode === 'teams' && (
                  <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                )}
                <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>{getStatLabel()}</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Attempts</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && currentEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={viewMode === 'teams' ? 5 : 4} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : currentEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={viewMode === 'teams' ? 5 : 4} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography color="textSecondary">
                      {viewMode === 'global'
                        ? 'No leaderboard entries yet. Complete at least 10 attempts to appear!'
                        : 'No team members have completed enough drills yet. Team members need at least 5 attempts.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                currentEntries.map((entry, index) => {
                  const rank = viewMode === 'global' ? page * 50 + index + 1 : index + 1;
                  const isCurrentUser = user?.id === entry.user_id;
                  const teamEntry = viewMode === 'teams' ? (entry as TeamLeaderboardEntry) : null;

                  return (
                    <TableRow
                      key={entry.user_id}
                      sx={{
                        bgcolor: isCurrentUser ? 'primary.50' : rank <= 3 ? 'action.hover' : 'inherit',
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', fontWeight: rank <= 3 ? 700 : 400 }}>
                          {getRankDisplay(rank)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                            {(entry.display_name ?? '?')[0]?.toUpperCase() ?? '?'}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: isCurrentUser ? 700 : 500 }}
                            >
                              {entry.display_name || 'Anonymous'}
                              {isCurrentUser && (
                                <Chip label="You" size="small" sx={{ ml: 1 }} color="primary" />
                              )}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      {viewMode === 'teams' && teamEntry && (
                        <TableCell>
                          <Chip
                            label={teamEntry.role}
                            size="small"
                            color={
                              teamEntry.role === 'owner'
                                ? 'primary'
                                : teamEntry.role === 'admin'
                                ? 'secondary'
                                : 'default'
                            }
                            variant={teamEntry.role === 'member' ? 'outlined' : 'filled'}
                          />
                        </TableCell>
                      )}
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color:
                              activeTab === 'accuracy'
                                ? entry.accuracy_pct >= 80
                                  ? 'success.main'
                                  : entry.accuracy_pct < 50
                                  ? 'error.main'
                                  : 'warning.main'
                                : 'text.primary',
                          }}
                        >
                          {getStatValue(entry)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" color="textSecondary">
                          {entry.total_attempts}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Load More (global only) */}
        {viewMode === 'global' && hasMore && (
          <Box sx={{ p: 2, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
            <Button onClick={handleLoadMore} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Load More'}
            </Button>
          </Box>
        )}
      </Paper>

      {/* Minimum Attempts Notice */}
      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
        {viewMode === 'global'
          ? 'Players need at least 10 attempts to appear on the global leaderboard.'
          : 'Team members need at least 5 attempts to appear on team leaderboards.'}
      </Typography>
    </Box>
  );
};
