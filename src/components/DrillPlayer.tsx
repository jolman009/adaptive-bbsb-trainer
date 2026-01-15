import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Stack,
  LinearProgress,
  Chip,
  Grid,
  Paper,
  Alert,
  IconButton,
} from '@mui/material';
import { RotateCcw, Play, Pause } from 'lucide-react';
import { ScenarioV2, Position } from '@/types/scenario';
import { AnswerQuality } from '@/types/drillSession';
import { BaseballField, FieldAnimation } from './BaseballField';

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
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const maxTime = 30; // seconds for pressure element

  // Timer logic
  useEffect(() => {
    if (phase !== 'answering' || isPaused) return;

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
  }, [phase, isPaused]);

  // Reset state when scenario changes
  useEffect(() => {
    setPhase('answering');
    setSelectedQuality(null);
    setTimeElapsed(0);
    setIsAnimating(false);
    setIsPaused(false);
  }, [scenario.id]);

  const handleAnswerClick = (quality: AnswerQuality) => {
    setSelectedQuality(quality);
    setPhase('revealing');
    setIsAnimating(true);
  };

  const handleTimeout = () => {
    setSelectedQuality('timeout');
    setPhase('revealing');
    setIsAnimating(true);
  };

  const handleNextScenario = () => {
    if (!selectedQuality) return;
    onAnswer(selectedQuality);
  };

  const handleReplay = () => {
    setIsAnimating(false);
    setTimeout(() => setIsAnimating(true), 100);
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

  // Helper to infer ball location from scenario text
  const inferBallLocation = (s: ScenarioV2): Position => {
    const text = (s.title + ' ' + s.description).toLowerCase();
    
    if (text.includes('left field') || text.includes('to left')) return 'lf';
    if (text.includes('center field') || text.includes('to center')) return 'cf';
    if (text.includes('right field') || text.includes('to right')) return 'rf';
    if (text.includes('shortstop') || text.includes('to short')) return 'ss';
    if (text.includes('to second') || text.includes('at second base')) return '2b';
    if (text.includes('to third') || text.includes('at third base')) return '3b';
    if (text.includes('to first') || text.includes('at first base')) return '1b';
    if (text.includes('pitcher') || text.includes('mound')) return 'p';
    if (text.includes('catcher') || text.includes('home plate')) return 'c';
    
    return s.position || 'p'; // Fallback to player position or pitcher
  };

  // Define specific animations for scenarios
  const getAnimationConfig = (): FieldAnimation | undefined => {
    if (!selectedAnswer) return undefined;

    // 1. Specific Scenario Overrides
    if (scenario.id === 'baseball-003' && selectedAnswer?.id === 'baseball-003-best') {
      return {
        ballStart: 'ss',
        ballEnd: '2base',
        playerMovements: [
          { position: '2b', target: '2base' }
        ]
      };
    }

    // 2. Generic Animation based on Answer Text
    // Try to determine target from the answer label
    const text = selectedAnswer.label.toLowerCase();
    let target: 'home' | '1base' | '2base' | '3base' | undefined;
    
    if (text.includes('to first') || text.includes('at first')) target = '1base';
    else if (text.includes('to second') || text.includes('at second')) target = '2base';
    else if (text.includes('to third') || text.includes('at third')) target = '3base';
    else if (text.includes('to home') || text.includes('at home') || text.includes('plate')) target = 'home';

    if (target && scenario.position) {
      const movements: { position: Position; target: 'home' | '1base' | '2base' | '3base' | Position }[] = [];
      
      // Simple heuristic for who covers the base
      if (target === '2base') {
        if (scenario.position === 'ss') movements.push({ position: '2b', target: '2base' });
        else if (scenario.position === '2b') movements.push({ position: 'ss', target: '2base' });
      } else if (target === '1base' && scenario.position !== '1b') {
        movements.push({ position: '1b', target: '1base' });
      } else if (target === '3base' && scenario.position !== '3b') {
        movements.push({ position: '3b', target: '3base' });
      }

      return {
        ballStart: scenario.position,
        ballEnd: target,
        playerMovements: movements
      };
    }
    return undefined;
  };

  return (
    <Box sx={{ py: 2 }}>
      <Grid container spacing={3}>
        {/* Left/Top Panel: Emphasized Field Visualization */}
        <Grid item xs={12} md={7} lg={8}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              bgcolor: '#f0f4f8', // Light grey-blue background for contrast
              borderRadius: 3,
              minHeight: { xs: 300, md: 500 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ width: '100%', maxWidth: '100%', aspectRatio: '1/1' }}>
              <BaseballField
                sport={scenario.sport}
                runners={scenario.runners}
                highlightPosition={scenario.position}
                animate={isAnimating}
                ballLocation={inferBallLocation(scenario)}
                animationConfig={getAnimationConfig()}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Right/Bottom Panel: Scenario Controls */}
        <Grid item xs={12} md={5} lg={4}>
          <Stack spacing={3} sx={{ height: '100%' }}>
            {/* Scenario Info */}
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Chip label={scenario.level.toUpperCase()} size="small" color="primary" variant="outlined" />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {scenario.category.replace(/-/g, ' ').toUpperCase()}
                  </Typography>
                </Stack>
                
                <Typography variant="h5" fontWeight="800" gutterBottom sx={{ lineHeight: 1.2 }}>
                  {scenario.title}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                  <Chip label={`Outs: ${scenario.outs}`} size="small" />
                  {scenario.runners.length > 0 && (
                    <Chip label={`Runners: ${scenario.runners.join(', ')}`} size="small" color="error" variant="outlined" />
                  )}
                  {scenario.position && (
                    <Chip label={`You: ${scenario.position.toUpperCase()}`} size="small" color="secondary" />
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Description & Question */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" paragraph sx={{ fontSize: '1.05rem', color: 'text.primary' }}>
                {scenario.description}
              </Typography>

              <Paper 
                elevation={0} 
                sx={{ p: 2.5, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2, mt: 1 }}
              >
                <Typography variant="h6" fontWeight="600" sx={{ lineHeight: 1.3 }}>
                  {scenario.question}
                </Typography>
              </Paper>
            </Box>

            {/* Timer Progress Bar */}
            {phase === 'answering' && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="textSecondary">Time</Typography>
                    <IconButton size="small" onClick={() => setIsPaused(!isPaused)} sx={{ p: 0.5 }}>
                      {isPaused ? <Play size={14} /> : <Pause size={14} />}
                    </IconButton>
                  </Stack>
                  <Typography variant="caption" color={timeProgress > 80 ? 'error' : 'textSecondary'}>
                    {timeElapsed}s
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={timeProgress}
                  sx={{
                    height: 6,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                    '& .MuiLinearProgress-bar': { bgcolor: timeProgress > 80 ? 'error.main' : 'primary.main' },
                  }}
                />
              </Box>
            )}

            {/* Answer Phase */}
            {phase === 'answering' && (
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  fullWidth
                  onClick={() => handleAnswerClick('best')}
                  disabled={isLoading || isPaused}
                  sx={{ py: 1.5, fontWeight: 600 }}
                >
                  {scenario.best.label}
                </Button>
                <Button
                  variant="contained"
                  color="warning"
                  size="large"
                  fullWidth
                  onClick={() => handleAnswerClick('ok')}
                  disabled={isLoading || isPaused}
                  sx={{ py: 1.5, fontWeight: 600 }}
                >
                  {scenario.ok.label}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  fullWidth
                  onClick={() => handleAnswerClick('bad')}
                  disabled={isLoading || isPaused}
                  sx={{ py: 1.5, fontWeight: 600 }}
                >
                  {scenario.bad.label}
                </Button>
              </Stack>
            )}

            {/* Reveal Phase */}
            {phase === 'revealing' && (
              <Stack spacing={2}>
                {/* User's Answer Display */}
                {selectedAnswer && (
                  <Card variant="outlined" sx={{ bgcolor: 'info.lighter', borderColor: 'info.main' }}>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>YOU SELECTED</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{selectedAnswer.label}</Typography>
                      <Typography variant="body2">{selectedAnswer.description}</Typography>
                    </CardContent>
                  </Card>
                )}

                {selectedQuality === 'timeout' && (
                   <Alert severity="error">Time's Up! You didn't answer in time.</Alert>
                )}

                {/* Correct Answer Display */}
                <Card variant="outlined" sx={{ bgcolor: 'success.lighter', borderColor: 'success.main' }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>BEST PLAY</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'success.main' }}>{scenario.best.label}</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>{scenario.best.description}</Typography>
                    
                    <Box sx={{ bgcolor: 'success.main', color: 'success.contrastText', p: 1, borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>COACHING CUE:</Typography>
                      <Typography variant="body2">{scenario.best.coaching_cue}</Typography>
                    </Box>
                  </CardContent>
                </Card>

                {/* Replay Animation Button */}
                <Button
                  variant="outlined"
                  startIcon={<RotateCcw size={18} />}
                  onClick={handleReplay}
                  fullWidth
                >
                  Replay Action
                </Button>

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleNextScenario}
                  disabled={isLoading}
                  sx={{ py: 1.5, fontWeight: 600 }}
                >
                  Next Scenario
                </Button>
              </Stack>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};
