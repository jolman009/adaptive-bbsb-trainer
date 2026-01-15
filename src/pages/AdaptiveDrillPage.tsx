import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  LinearProgress,
  Button,
  Alert,
} from '@mui/material';
import { DrillPlayer } from '@/components/DrillPlayer';
import { ScenarioV2 } from '@/types/scenario';
import { DrillSession, createDrillSession } from '@/types/drillSession';
import { pickNextScenario, applyResult, getDrillStats } from '@/utils/drillEngine';
import { STARTER_DATASET } from '@/data/starterDataset';
import {
  saveSessionToLocalStorage,
  loadSessionFromLocalStorage,
  clearSessionFromLocalStorage,
} from '@/utils/sessionPersistence';

/**
 * AdaptiveDrillPage Container
 *
 * Manages:
 * 1. DrillSession state (progress, stats)
 * 2. Current scenario selection via pickNextScenario()
 * 3. Answer processing via applyResult()
 * 4. Stats display (correctRate, averageInterval, scenariosSeen)
 * 5. Session reset
 *
 * In M4, this will persist to localStorage.
 * In M7, this will use Supabase backend.
 */
export const AdaptiveDrillPage: React.FC = () => {
  const [session, setSession] = useState<DrillSession | null>(null);
  const [currentScenario, setCurrentScenario] = useState<ScenarioV2 | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [noScenariosAvailable, setNoScenariosAvailable] = useState(false);

  // Load session from localStorage on mount
  useEffect(() => {
    const saved = loadSessionFromLocalStorage();
    const activeSession = saved || createDrillSession('adaptive-session');
    setSession(activeSession);

    // Pick first scenario
    const next = pickNextScenario(STARTER_DATASET.scenarios, activeSession);
    if (next) {
      setCurrentScenario(next);
      setNoScenariosAvailable(false);
    } else {
      setNoScenariosAvailable(true);
    }
  }, []);

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (session) {
      saveSessionToLocalStorage(session);
    }
  }, [session]);

  const handleAnswer = (quality: 'best' | 'ok' | 'bad' | 'timeout') => {
    if (!currentScenario || !session) return;

    setIsLoading(true);

    // Simulate network latency for reveal animation
    setTimeout(() => {
      // Apply result and update session
      applyResult(session, currentScenario.id, quality);

      // Update session state (this triggers save via useEffect)
      setSession({ ...session });

      // Pick next scenario
      const next = pickNextScenario(STARTER_DATASET.scenarios, session);
      if (next) {
        setCurrentScenario(next);
        setNoScenariosAvailable(false);
      } else {
        setNoScenariosAvailable(true);
      }

      setIsLoading(false);
    }, 300);
  };

  const handleResetSession = () => {
    clearSessionFromLocalStorage();
    const newSession = createDrillSession('adaptive-session');
    setSession(newSession);
    const next = pickNextScenario(STARTER_DATASET.scenarios, newSession);
    if (next) {
      setCurrentScenario(next);
      setNoScenariosAvailable(false);
    }
  };

  const stats = session ? getDrillStats(STARTER_DATASET.scenarios, session) : { correctRate: 0, scenariosSeen: 0, totalAttempts: 0, averageEase: 1.3, averageInterval: 0 };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Adaptive Decision Trainer
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Improve your in-game decision-making with spaced repetition drills.
          </Typography>
        </Box>

        {/* Session Stats Card */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              {/* Correct Rate */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                  ACCURACY
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={stats.correctRate * 100}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, minWidth: '60px' }}>
                    {(stats.correctRate * 100).toFixed(0)}%
                  </Typography>
                </Box>
              </Box>

              {/* Scenarios Seen */}
              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                  SCENARIOS SEEN
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {stats.scenariosSeen}
                </Typography>
              </Box>

              {/* Total Attempts */}
              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                  TOTAL ATTEMPTS
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {stats.totalAttempts}
                </Typography>
              </Box>

              {/* Average Ease */}
              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                  AVG DIFFICULTY
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {stats.averageEase.toFixed(2)}x
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* No Scenarios Alert */}
        {noScenariosAvailable && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              All scenarios are rested. Come back later to keep drilling!
            </Typography>
            <Button variant="outlined" size="small" onClick={handleResetSession} sx={{ mt: 1 }}>
              Start New Session
            </Button>
          </Alert>
        )}

        {/* Drill Player */}
        {currentScenario && !noScenariosAvailable && (
          <DrillPlayer
            scenario={currentScenario}
            onAnswer={handleAnswer}
            isLoading={isLoading}
          />
        )}

        {/* Reset Session Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="text"
            color="inherit"
            onClick={handleResetSession}
            sx={{ fontWeight: 600, textDecoration: 'underline' }}
          >
            Reset Session
          </Button>
        </Box>
      </Container>
    </Box>
  );
};
