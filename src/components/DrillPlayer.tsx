import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Typography,
  Stack,
  LinearProgress,
  Chip,
  Container,
} from '@mui/material';
import { ScenarioV2 } from '@/types/scenario';
import { AnswerQuality } from '@/types/drillSession';

interface DrillPlayerProps {
  scenario: ScenarioV2;
  onAnswer: (quality: AnswerQuality) => void;
  isLoading?: boolean;
}

/**
 * DrillPlayer Component
 *
 * Core rep loop UI that displays:
 * 1. Scenario question with context (runners, outs, level)
 * 2. Timer with pressure element (countdown optional)
 * 3. Three answer buttons (BEST, OK, BAD)
 * 4. Reveal phase showing correct answer + coaching cue
 * 5. Auto-advances to next scenario on answer
 *
 * States:
 * - ANSWERING: User can click BEST/OK/BAD buttons
 * - REVEALING: Shows selected answer + correct answer + coaching cue
 * - NEXT: Can proceed to next scenario
 */
export const DrillPlayer: React.FC<DrillPlayerProps> = ({
  scenario,
  onAnswer,
  isLoading = false,
}) => {
  const [phase, setPhase] = useState<'answering' | 'revealing'>('answering');
  const [selectedQuality, setSelectedQuality] = useState<AnswerQuality | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const maxTime = 30; // seconds for pressure element

  // Timer logic
  useEffect(() => {
    if (phase !== 'answering') return;

    const interval = setInterval(() => {
      setTimeElapsed((prev) => {
        if (prev >= maxTime) {
          handleTimeout();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  const handleAnswerClick = (quality: AnswerQuality) => {
    setSelectedQuality(quality);
    setPhase('revealing');
  };

  const handleTimeout = () => {
    setSelectedQuality('timeout');
    setPhase('revealing');
  };

  const handleNextScenario = () => {
    if (!selectedQuality) return;
    onAnswer(selectedQuality);
  };

  // Get answer option based on quality
  const getAnswerOption = (quality: AnswerQuality) => {
    switch (quality) {
      case 'best':
        return scenario.best;
      case 'ok':
        return scenario.ok;
      case 'bad':
        return scenario.bad;
      case 'timeout':
        return null; // No answer selected on timeout
    }
  };

  const selectedAnswer = selectedQuality ? getAnswerOption(selectedQuality) : null;
  const timeProgress = (timeElapsed / maxTime) * 100;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Scenario Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={scenario.title}
          subheader={`${scenario.sport.toUpperCase()} • ${scenario.level.toUpperCase()} • ${scenario.category.replace(/-/g, ' ').toUpperCase()}`}
          sx={{ pb: 1 }}
        />
        <CardContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {scenario.description}
          </Typography>

          {/* Game State Chips */}
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip
              label={`Outs: ${scenario.outs}`}
              variant="outlined"
              size="small"
            />
            {scenario.runners.length > 0 && (
              <Chip
                label={`Runners: ${scenario.runners.join(', ')}`}
                variant="outlined"
                size="small"
              />
            )}
          </Stack>

          {/* The Question */}
          <Card variant="outlined" sx={{ bgcolor: 'action.hover', p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {scenario.question}
            </Typography>
          </Card>
        </CardContent>
      </Card>

      {/* Timer Progress Bar */}
      {phase === 'answering' && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" color="textSecondary">
              Time Elapsed
            </Typography>
            <Typography
              variant="caption"
              color={timeProgress > 80 ? 'error' : 'textSecondary'}
            >
              {timeElapsed}s / {maxTime}s
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={timeProgress}
            sx={{
              height: 8,
              borderRadius: 1,
              backgroundColor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                backgroundColor: timeProgress > 80 ? 'error.main' : 'primary.main',
              },
            }}
          />
        </Box>
      )}

      {/* Answer Phase */}
      {phase === 'answering' && (
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, textAlign: 'center' }}>
            What's the best play?
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              color="success"
              size="large"
              fullWidth
              onClick={() => handleAnswerClick('best')}
              disabled={isLoading}
              sx={{
                py: 2,
                fontWeight: 600,
                fontSize: '1.1rem',
              }}
            >
              {scenario.best.label}
            </Button>
            <Button
              variant="contained"
              color="warning"
              size="large"
              fullWidth
              onClick={() => handleAnswerClick('ok')}
              disabled={isLoading}
              sx={{
                py: 2,
                fontWeight: 600,
                fontSize: '1.1rem',
              }}
            >
              {scenario.ok.label}
            </Button>
            <Button
              variant="contained"
              color="error"
              size="large"
              fullWidth
              onClick={() => handleAnswerClick('bad')}
              disabled={isLoading}
              sx={{
                py: 2,
                fontWeight: 600,
                fontSize: '1.1rem',
              }}
            >
              {scenario.bad.label}
            </Button>
          </Stack>
        </Stack>
      )}

      {/* Reveal Phase */}
      {phase === 'revealing' && (
        <Stack spacing={3} sx={{ mb: 3 }}>
          {/* User's Answer Display */}
          {selectedAnswer && (
            <Card variant="outlined" sx={{ bgcolor: 'info.lighter', border: '2px solid', borderColor: 'info.main' }}>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                  You Selected:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {selectedAnswer.label}
                </Typography>
                <Typography variant="body2">{selectedAnswer.description}</Typography>
              </CardContent>
            </Card>
          )}

          {selectedQuality === 'timeout' && (
            <Card variant="outlined" sx={{ bgcolor: 'error.lighter', border: '2px solid', borderColor: 'error.main' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                  Time's Up!
                </Typography>
                <Typography variant="body2">You didn't answer in time.</Typography>
              </CardContent>
            </Card>
          )}

          {/* Correct Answer Display */}
          <Card
            variant="outlined"
            sx={{
              bgcolor: 'success.lighter',
              border: '2px solid',
              borderColor: 'success.main',
            }}
          >
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                Best Play:
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'success.main' }}>
                {scenario.best.label}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {scenario.best.description}
              </Typography>

              {/* Coaching Cue */}
              <Box
                sx={{
                  bgcolor: 'success.main',
                  color: 'success.contrastText',
                  p: 1.5,
                  borderRadius: 1,
                  mt: 2,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Coaching Insight:
                </Typography>
                <Typography variant="body2">{scenario.best.coaching_cue}</Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Next Button */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleNextScenario}
            disabled={isLoading}
            sx={{
              py: 1.5,
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            Next Scenario
          </Button>
        </Stack>
      )}
    </Container>
  );
};
