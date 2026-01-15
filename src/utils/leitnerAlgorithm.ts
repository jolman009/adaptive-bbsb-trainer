import { ScenarioProgress, AnswerQuality } from '@types/drillSession';

/**
 * Leitner Box Spacing Algorithm
 * Implements SM-2 (SuperMemo 2) for spaced repetition.
 * 
 * The algorithm adjusts the interval and ease factor based on performance:
 * - BEST (confident correct) → increase interval, increase ease
 * - OK (partial/uncertain) → reset interval, decrease ease
 * - BAD (incorrect) → reset interval, decrease ease significantly
 * - TIMEOUT (no answer) → reset interval, penalize ease
 * 
 * Reference: https://en.wikipedia.org/wiki/Spaced_repetition#SM-2
 */

const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Applies the SM-2 algorithm to update interval and ease factor.
 * @param progress - Current progress record
 * @param quality - The quality of the answer (0-5, where 4-5 is passing)
 */
export function updateLeitnerInterval(progress: ScenarioProgress, quality: AnswerQuality): void {
  // Map answer quality to SM-2 quality score (0-5)
  const qualityScore = mapAnswerQualityToScore(quality);

  // Update repetitions
  progress.repetitions += 1;

  // SM-2 algorithm
  if (qualityScore < 3) {
    // Failed or partial: reset interval and penalize ease
    progress.interval = 1;
    progress.ease = Math.max(1.3, progress.ease - 0.2);
  } else {
    // Passed: increase interval based on repetitions
    if (progress.repetitions === 1) {
      progress.interval = 1; // First correct: 1 day
    } else if (progress.repetitions === 2) {
      progress.interval = 3; // Second correct: 3 days
    } else {
      // Third and beyond: multiply by ease factor
      progress.interval = Math.ceil(progress.interval * progress.ease);
    }

    // Update ease factor (bonus for correct answers)
    if (qualityScore === 5) {
      // Perfect answer: increase ease
      progress.ease = Math.min(2.5, progress.ease + 0.1);
    } else if (qualityScore === 4) {
      // Good answer: slight increase
      progress.ease = Math.min(2.5, progress.ease + 0.05);
    }
  }

  // Calculate next due date
  progress.nextDue = Date.now() + progress.interval * DAY_IN_MS;
}

/**
 * Maps answer quality to SM-2 quality score (0-5).
 * 0-2: Failed (reset)
 * 3: Partial (marginal)
 * 4-5: Correct (advance)
 */
function mapAnswerQualityToScore(quality: AnswerQuality): number {
  switch (quality) {
    case 'best':
      return 5; // Perfect
    case 'ok':
      return 3; // Marginal/partial
    case 'bad':
      return 1; // Failed
    case 'timeout':
      return 0; // Worst case
    default:
      return 2; // Default to failure
  }
}

/**
 * Gets the next due date in human-readable format.
 */
export function getNextDueLabel(nextDueMs: number): string {
  const now = Date.now();
  const diffMs = nextDueMs - now;

  if (diffMs < 0) {
    return 'Due now';
  }

  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours < 1) {
    return 'Due in a few minutes';
  }
  if (hours < 24) {
    return `Due in ${hours}h`;
  }

  const days = Math.floor(diffMs / DAY_IN_MS);
  return `Due in ${days}d`;
}

/**
 * Debug function: logs the Leitner state for a scenario.
 */
export function debugLeitnerState(progress: ScenarioProgress): void {
  console.log(`[Leitner] ${progress.scenarioId}`);
  console.log(`  Repetitions: ${progress.repetitions}`);
  console.log(`  Interval: ${progress.interval} days`);
  console.log(`  Ease: ${progress.ease.toFixed(2)}`);
  console.log(`  Next due: ${getNextDueLabel(progress.nextDue)}`);
  console.log(`  Stats: ${progress.correct}✓ ${progress.partial}~ ${progress.incorrect}✗`);
}
