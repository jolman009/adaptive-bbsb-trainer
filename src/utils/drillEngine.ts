import { ScenarioV2 } from '@types/scenario';
import { DrillSession, AnswerQuality, ensureScenarioProgress } from '@types/drillSession';
import { updateLeitnerInterval } from '@utils/leitnerAlgorithm';

/**
 * Drill Engine
 * Core logic for selecting scenarios and applying results.
 * No UI assumptions, fully deterministic.
 */

/**
 * Picks the next scenario to show.
 * Strategy:
 * 1. Filter scenarios that are due (nextDue <= now)
 * 2. Prioritize scenarios with lower correctness (need practice)
 * 3. If none are due, pick the one due soonest
 * @param scenarios - Available scenarios
 * @param session - Current drill session
 * @returns The next scenario to show, or null if no scenarios exist
 */
export function pickNextScenario(
  scenarios: ScenarioV2[],
  session: DrillSession
): ScenarioV2 | null {
  if (scenarios.length === 0) return null;

  const now = Date.now();

  // Separate due and not-yet-due scenarios
  const due: ScenarioV2[] = [];
  const notYetDue: ScenarioV2[] = [];

  for (const scenario of scenarios) {
    const progress = ensureScenarioProgress(session, scenario.id);
    if (progress.nextDue <= now) {
      due.push(scenario);
    } else {
      notYetDue.push(scenario);
    }
  }

  // If scenarios are due, pick from them (prioritize by correctness rate)
  if (due.length > 0) {
    return pickByCorrectness(due, session);
  }

  // If none are due, pick the one due soonest
  if (notYetDue.length > 0) {
    return notYetDue.reduce((best, current) => {
      const bestProgress = ensureScenarioProgress(session, best.id);
      const currentProgress = ensureScenarioProgress(session, current.id);
      return currentProgress.nextDue < bestProgress.nextDue ? current : best;
    });
  }

  return null;
}

/**
 * Picks a scenario by correctness rate (lower rate = prioritized).
 * Tiebreak: fewest repetitions (newer scenarios get a chance).
 */
function pickByCorrectness(scenarios: ScenarioV2[], session: DrillSession): ScenarioV2 {
  return scenarios.reduce((best, current) => {
    const bestProgress = ensureScenarioProgress(session, best.id);
    const currentProgress = ensureScenarioProgress(session, current.id);

    // Calculate correctness rates
    const bestTotal = bestProgress.correct + bestProgress.partial + bestProgress.incorrect;
    const currentTotal =
      currentProgress.correct + currentProgress.partial + currentProgress.incorrect;

    const bestRate = bestTotal === 0 ? 1 : bestProgress.correct / bestTotal;
    const currentRate = currentTotal === 0 ? 1 : currentProgress.correct / currentTotal;

    // Pick lower correctness rate (more practice needed)
    if (currentRate !== bestRate) {
      return currentRate < bestRate ? current : best;
    }

    // Tiebreak: fewest repetitions
    return currentProgress.repetitions < bestProgress.repetitions ? current : best;
  });
}

/**
 * Applies the user's answer and updates the session.
 * @param session - Current drill session
 * @param scenarioId - The scenario that was answered
 * @param quality - The quality of the answer (best/ok/bad/timeout)
 */
export function applyResult(
  session: DrillSession,
  scenarioId: string,
  quality: AnswerQuality
): void {
  const progress = ensureScenarioProgress(session, scenarioId);

  // Update answer counts
  switch (quality) {
    case 'best':
      progress.correct += 1;
      break;
    case 'ok':
      progress.partial += 1;
      break;
    case 'bad':
      progress.incorrect += 1;
      break;
    case 'timeout':
      progress.timeouts += 1;
      progress.incorrect += 1; // Treat timeout as incorrect
      break;
  }

  // Record the last answer
  progress.lastAnswer = quality;
  progress.lastShown = Date.now();

  // Update Leitner interval and ease factor
  updateLeitnerInterval(progress, quality);

  // Update session timestamp
  session.updatedAt = Date.now();
}

/**
 * Gets session statistics.
 */
export interface DrillStats {
  totalScenarios: number;
  scenariosSeen: number;
  totalAttempts: number;
  correctRate: number;
  averageEase: number;
  averageInterval: number;
}

export function getDrillStats(scenarios: ScenarioV2[], session: DrillSession): DrillStats {
  let seen = 0;
  let totalAttempts = 0;
  let totalCorrect = 0;
  let totalEase = 0;
  let totalInterval = 0;

  for (const scenario of scenarios) {
    const progress = ensureScenarioProgress(session, scenario.id);
    if (progress.repetitions > 0) {
      seen += 1;
      totalAttempts += progress.repetitions;
      totalCorrect += progress.correct;
      totalEase += progress.ease;
      totalInterval += progress.interval;
    }
  }

  return {
    totalScenarios: scenarios.length,
    scenariosSeen: seen,
    totalAttempts,
    correctRate: totalAttempts === 0 ? 0 : totalCorrect / totalAttempts,
    averageEase: seen === 0 ? 2.5 : totalEase / seen,
    averageInterval: seen === 0 ? 1 : totalInterval / seen,
  };
}
