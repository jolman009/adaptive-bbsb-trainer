import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  CircularProgress,
} from '@mui/material';
import { User, Shield, Users, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { completeOnboarding } from '@/services/profileService';
import { DiamondIQLogo } from '@/components/DiamondIQLogo';
import type { UserRole } from '@/types/auth';

interface RoleOption {
  value: UserRole;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const roleOptions: RoleOption[] = [
  {
    value: 'player',
    label: 'Player',
    description: 'I want to improve my baseball/softball IQ through practice drills',
    icon: <User size={24} />,
  },
  {
    value: 'coach',
    label: 'Coach',
    description: 'I want to train my team and track their progress',
    icon: <Users size={24} />,
  },
  {
    value: 'admin',
    label: 'Administrator',
    description: 'I manage teams and oversee training programs',
    icon: <Shield size={24} />,
  },
];

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [role, setRole] = useState<UserRole | null>(null);
  const [organization, setOrganization] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = (
    _: React.MouseEvent<HTMLElement>,
    newRole: UserRole | null
  ) => {
    if (newRole) {
      setRole(newRole);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!role) {
      setError('Please select your role');
      return;
    }

    if (!user) {
      setError('Not authenticated');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await completeOnboarding(user.id, {
      displayName: displayName.trim(),
      role,
      organization: organization.trim() || undefined,
    });

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    // Redirect to main app
    navigate('/', { replace: true });
    // Force a page reload to refresh auth state with new profile data
    window.location.reload();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 600, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Stack alignItems="center" spacing={2} sx={{ mb: 4 }}>
            <DiamondIQLogo size="medium" showText={false} />
            <Box textAlign="center">
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Welcome to Diamond IQ
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Let's set up your profile to personalize your experience
              </Typography>
            </Box>
          </Stack>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              {/* Display Name */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  What should we call you?
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  inputProps={{ maxLength: 50 }}
                />
              </Box>

              {/* Role Selection */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  What's your role?
                </Typography>
                <ToggleButtonGroup
                  value={role}
                  exclusive
                  onChange={handleRoleChange}
                  sx={{ width: '100%', flexDirection: 'column', gap: 1 }}
                >
                  {roleOptions.map((option) => (
                    <ToggleButton
                      key={option.value}
                      value={option.value}
                      sx={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        p: 2,
                        border: 1,
                        borderColor: 'divider',
                        '&.Mui-selected': {
                          bgcolor: 'primary.50',
                          borderColor: 'primary.main',
                          '&:hover': {
                            bgcolor: 'primary.100',
                          },
                        },
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: role === option.value ? 'primary.main' : 'action.hover',
                            color: role === option.value ? 'white' : 'text.secondary',
                            display: 'flex',
                          }}
                        >
                          {option.icon}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600, textTransform: 'none' }}
                          >
                            {option.label}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{ textTransform: 'none' }}
                          >
                            {option.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              {/* Organization (optional) */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Team or Organization{' '}
                  <Typography component="span" color="textSecondary" sx={{ fontWeight: 400 }}>
                    (optional)
                  </Typography>
                </Typography>
                <TextField
                  fullWidth
                  placeholder="e.g., Lincoln High School, Tigers Travel Ball"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  inputProps={{ maxLength: 100 }}
                />
              </Box>

              {/* Error Alert */}
              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting || !displayName.trim() || !role}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <Sparkles size={20} />}
                sx={{ py: 1.5 }}
              >
                {isSubmitting ? 'Setting up...' : 'Get Started'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
