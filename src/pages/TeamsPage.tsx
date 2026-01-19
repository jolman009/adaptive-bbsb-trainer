import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Users,
  Plus,
  LogOut,
  Copy,
  Check,
  Crown,
  Shield,
  User,
  MoreVertical,
  UserPlus,
  UserMinus,
  Trash2,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserTeam, TeamRole } from '@/types/supabase';
import {
  getUserTeams,
  createTeam,
  joinTeam,
  leaveTeam,
  getTeamMembers,
  getJoinRequests,
  respondToJoinRequest,
  updateMemberRole,
  removeMember,
  deleteTeam,
  checkPremiumStatus,
  clearTeamsCache,
} from '@/services/teamService';

interface TeamMemberWithProfile {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  email?: string;
  display_name?: string;
}

interface JoinRequestWithProfile {
  id: string;
  team_id: string;
  user_id: string;
  status: string;
  requested_at: string;
  email?: string;
  display_name?: string;
}

export const TeamsPage: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);

  // Form states
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [requireApproval, setRequireApproval] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Selected team for management
  const [selectedTeam, setSelectedTeam] = useState<UserTeam | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithProfile[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequestWithProfile[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [activeManageTab, setActiveManageTab] = useState(0);

  // Action menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuMember, setMenuMember] = useState<TeamMemberWithProfile | null>(null);

  const loadTeams = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const [teamsData, premium] = await Promise.all([
        getUserTeams(user.id, false),
        checkPremiumStatus(user.id),
      ]);
      setTeams(teamsData);
      setIsPremium(premium);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, [user]);

  const loadTeamDetails = async (team: UserTeam) => {
    setMembersLoading(true);
    try {
      const [members, requests] = await Promise.all([
        getTeamMembers(team.team_id),
        team.user_role === 'owner' || team.user_role === 'admin'
          ? getJoinRequests(team.team_id)
          : Promise.resolve([]),
      ]);
      setTeamMembers(members as TeamMemberWithProfile[]);
      setJoinRequests(requests as JoinRequestWithProfile[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team details');
    } finally {
      setMembersLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!user || !newTeamName.trim()) return;

    setError(null);
    const result = await createTeam(user.id, newTeamName.trim(), newTeamDescription.trim() || undefined, requireApproval);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess('Team created successfully!');
    setCreateDialogOpen(false);
    setNewTeamName('');
    setNewTeamDescription('');
    setRequireApproval(false);
    clearTeamsCache();
    loadTeams();
  };

  const handleJoinTeam = async () => {
    if (!user || !joinCode.trim()) return;

    setError(null);
    const result = await joinTeam(user.id, joinCode.trim().toUpperCase());

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.requiresApproval) {
      setSuccess('Join request sent! Waiting for team admin approval.');
    } else {
      setSuccess('Successfully joined the team!');
    }
    setJoinDialogOpen(false);
    setJoinCode('');
    clearTeamsCache();
    loadTeams();
  };

  const handleLeaveTeam = async (teamId: string) => {
    if (!user) return;

    const result = await leaveTeam(user.id, teamId);
    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess('You have left the team.');
    setManageDialogOpen(false);
    setSelectedTeam(null);
    clearTeamsCache();
    loadTeams();
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }

    const result = await deleteTeam(teamId);
    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess('Team deleted successfully.');
    setManageDialogOpen(false);
    setSelectedTeam(null);
    clearTeamsCache();
    loadTeams();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenManage = async (team: UserTeam) => {
    setSelectedTeam(team);
    setManageDialogOpen(true);
    await loadTeamDetails(team);
  };

  const handleRespondToRequest = async (request: JoinRequestWithProfile, approve: boolean) => {
    if (!selectedTeam) return;

    const result = await respondToJoinRequest(request.id, selectedTeam.team_id, request.user_id, approve);
    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(approve ? 'Member approved!' : 'Request rejected.');
    await loadTeamDetails(selectedTeam);
  };

  const handleUpdateRole = async (memberId: string, newRole: TeamRole) => {
    if (!selectedTeam) return;

    const result = await updateMemberRole(selectedTeam.team_id, memberId, newRole);
    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess('Member role updated.');
    await loadTeamDetails(selectedTeam);
    setMenuAnchor(null);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedTeam) return;
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    const result = await removeMember(selectedTeam.team_id, memberId);
    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess('Member removed.');
    await loadTeamDetails(selectedTeam);
    setMenuAnchor(null);
  };

  const getRoleIcon = (role: TeamRole) => {
    switch (role) {
      case 'owner':
        return <Crown size={16} />;
      case 'admin':
        return <Shield size={16} />;
      default:
        return <User size={16} />;
    }
  };

  const getRoleColor = (role: TeamRole): 'primary' | 'secondary' | 'default' => {
    switch (role) {
      case 'owner':
        return 'primary';
      case 'admin':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const canManageMembers = selectedTeam?.user_role === 'owner' || selectedTeam?.user_role === 'admin';

  return (
    <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            My Teams
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Create or join teams to compete with friends and teammates.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<UserPlus size={18} />}
            onClick={() => setJoinDialogOpen(true)}
          >
            Join Team
          </Button>
          <Tooltip title={isPremium ? '' : 'Premium feature - Upgrade to create teams'}>
            <span>
              <Button
                variant="contained"
                startIcon={<Plus size={18} />}
                onClick={() => setCreateDialogOpen(true)}
                disabled={!isPremium}
              >
                Create Team
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Premium Notice */}
      {!isPremium && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Want to create teams?</strong> Upgrade to premium to create and manage your own teams.
          You can still join teams created by premium users.
        </Alert>
      )}

      {/* Loading State */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : teams.length === 0 ? (
        /* Empty State */
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Users size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
            <Typography variant="h6" gutterBottom>
              No teams yet
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Join an existing team with a code, or create your own team to compete with friends.
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button variant="outlined" onClick={() => setJoinDialogOpen(true)}>
                Join a Team
              </Button>
              {isPremium && (
                <Button variant="contained" onClick={() => setCreateDialogOpen(true)}>
                  Create Team
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      ) : (
        /* Teams List */
        <Stack spacing={2}>
          {teams.map((team) => (
            <Card key={team.team_id}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {team.team_name}
                      </Typography>
                      <Chip
                        icon={getRoleIcon(team.user_role)}
                        label={team.user_role}
                        size="small"
                        color={getRoleColor(team.user_role)}
                        variant={team.user_role === 'member' ? 'outlined' : 'filled'}
                      />
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        <Users size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        {team.member_count} members
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Owner: {team.owner_name || 'Unknown'}
                      </Typography>
                    </Stack>
                  </Box>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Tooltip title="Copy join code">
                      <Chip
                        label={team.team_code}
                        onClick={() => handleCopyCode(team.team_code)}
                        icon={copiedCode === team.team_code ? <Check size={14} /> : <Copy size={14} />}
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', letterSpacing: 1 }}
                      />
                    </Tooltip>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpenManage(team)}
                    >
                      {canManageMembers ? 'Manage' : 'View'}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Create Team Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create a New Team</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Team Name"
              fullWidth
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="e.g., Tigers Baseball"
            />
            <TextField
              label="Description (optional)"
              fullWidth
              multiline
              rows={2}
              value={newTeamDescription}
              onChange={(e) => setNewTeamDescription(e.target.value)}
              placeholder="A brief description of your team"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={requireApproval}
                  onChange={(e) => setRequireApproval(e.target.checked)}
                />
              }
              label="Require approval for new members"
            />
            <Alert severity="info">
              A unique join code will be generated automatically. Share it with your team members to let them join.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateTeam}
            disabled={!newTeamName.trim()}
          >
            Create Team
          </Button>
        </DialogActions>
      </Dialog>

      {/* Join Team Dialog */}
      <Dialog open={joinDialogOpen} onClose={() => setJoinDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Join a Team</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Enter the 8-character join code provided by your team owner or admin.
            </Typography>
            <TextField
              label="Join Code"
              fullWidth
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g., TIGERS24"
              inputProps={{ maxLength: 8, style: { letterSpacing: 2, fontFamily: 'monospace' } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJoinDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleJoinTeam}
            disabled={joinCode.length < 8}
          >
            Join Team
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Team Dialog */}
      <Dialog open={manageDialogOpen} onClose={() => setManageDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              {selectedTeam?.team_name}
              <Typography variant="caption" display="block" color="textSecondary">
                Code: {selectedTeam?.team_code}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              {selectedTeam?.user_role !== 'owner' && (
                <Button
                  color="error"
                  size="small"
                  startIcon={<LogOut size={16} />}
                  onClick={() => selectedTeam && handleLeaveTeam(selectedTeam.team_id)}
                >
                  Leave
                </Button>
              )}
              {selectedTeam?.user_role === 'owner' && (
                <Button
                  color="error"
                  size="small"
                  startIcon={<Trash2 size={16} />}
                  onClick={() => selectedTeam && handleDeleteTeam(selectedTeam.team_id)}
                >
                  Delete
                </Button>
              )}
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {canManageMembers && (
            <Tabs value={activeManageTab} onChange={(_, v) => setActiveManageTab(v)} sx={{ mb: 2 }}>
              <Tab label={`Members (${teamMembers.length})`} />
              <Tab label={`Requests (${joinRequests.length})`} />
            </Tabs>
          )}

          {membersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : activeManageTab === 0 ? (
            /* Members Tab */
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Joined</TableCell>
                    {canManageMembers && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {member.display_name || member.email || 'Unknown'}
                        </Typography>
                        {member.display_name && member.email && (
                          <Typography variant="caption" color="textSecondary">
                            {member.email}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getRoleIcon(member.role)}
                          label={member.role}
                          size="small"
                          color={getRoleColor(member.role)}
                          variant={member.role === 'member' ? 'outlined' : 'filled'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {new Date(member.joined_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      {canManageMembers && (
                        <TableCell align="right">
                          {member.role !== 'owner' && member.user_id !== user?.id && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                setMenuAnchor(e.currentTarget);
                                setMenuMember(member);
                              }}
                            >
                              <MoreVertical size={16} />
                            </IconButton>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            /* Requests Tab */
            joinRequests.length === 0 ? (
              <Alert severity="info">No pending join requests.</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Requested</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {joinRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {request.display_name || request.email || 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Clock size={14} />
                            <Typography variant="body2" color="textSecondary">
                              {new Date(request.requested_at).toLocaleDateString()}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              color="success"
                              variant="contained"
                              onClick={() => handleRespondToRequest(request, true)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => handleRespondToRequest(request, false)}
                            >
                              Reject
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManageDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Member Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        {menuMember?.role === 'member' && (
          <MenuItem onClick={() => menuMember && handleUpdateRole(menuMember.user_id, 'admin')}>
            <ListItemIcon>
              <Shield size={16} />
            </ListItemIcon>
            <ListItemText>Make Admin</ListItemText>
          </MenuItem>
        )}
        {menuMember?.role === 'admin' && (
          <MenuItem onClick={() => menuMember && handleUpdateRole(menuMember.user_id, 'member')}>
            <ListItemIcon>
              <User size={16} />
            </ListItemIcon>
            <ListItemText>Remove Admin</ListItemText>
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => menuMember && handleRemoveMember(menuMember.user_id)} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <UserMinus size={16} color="inherit" />
          </ListItemIcon>
          <ListItemText>Remove from Team</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};
