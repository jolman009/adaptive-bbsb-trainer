/**
 * DrillSession
 * Tracks the user's progress and performance across all scenarios.
 * Persisted to localStorage for continuity between sessions.
 */

export type AnswerQuality = 'best' | 'ok' | 'bad' | 'timeout';

export interface ScenarioProgress {
  scenarioId: string;
  lastShown: number; // timestamp
  lastAnswer: AnswerQuality | null;
  correct: number; // count of BEST answers
  incorrect: number; // count of BAD answers
  partial: number; // count of OK answers
  timeouts: number; // count of timeouts (treated as BAD)
  interval: number; // Leitner interval (in milliseconds)
  ease: number; // ease factor (1.3 to 2.5)
  nextDue: number; // timestamp when this scenario should be shown next
  repetitions: number; // total times shown
}

export interface DrillSession {
  id: string; // session ID (could be based on date or user)
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  progress: Record<string, ScenarioProgress>; // scenarioId -> progress
}

/**
 * Creates a new DrillSession with empty progress.
 */
export function createDrillSession(sessionId: string): DrillSession {
  const now = Date.now();
  return {
    id: sessionId,
    createdAt: now,
    updatedAt: now,
    progress: {},
  };
}

/**
 * Initializes progress for a scenario (first time seeing it).
 */
export function initializeScenarioProgress(scenarioId: string): ScenarioProgress {
  const now = Date.now();
  return {
    scenarioId,
    lastShown: null as unknown as number,
    lastAnswer: null,
    correct: 0,
    incorrect: 0,
    partial: 0,
    timeouts: 0,
    interval: 1, // Start at 1 day
    ease: 2.5, // Start at max ease
    nextDue: now, // Ready immediately
    repetitions: 0,
  };
}

/**
 * Ensures a scenario has progress tracking.
 * If it doesn't exist, initialize it.
 */
export function ensureScenarioProgress(
  session: DrillSession,
  scenarioId: string
): ScenarioProgress {
  if (!session.progress[scenarioId]) {
    session.progress[scenarioId] = initializeScenarioProgress(scenarioId);
  }
  return session.progress[scenarioId];
}
