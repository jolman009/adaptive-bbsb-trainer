/**
 * Unit Tests for Drill Engine
 * 
 * Run with: npm test drillEngine.test.ts
 * 
 * Test the core logic without UI dependencies:
 * - pickNextScenario selects correctly based on due date and correctness
 * - applyResult updates progress and applies Leitner spacing
 * - BAD answers reset interval
 * - BEST + CERTAIN answers increase interval
 * - Timeouts are penalized
 */

import { ScenarioV2 } from '@types/scenario';
import { DrillSession, createDrillSession, ensureScenarioProgress } from '@types/drillSession';
import { pickNextScenario, applyResult, getDrillStats } from '@utils/drillEngine';

// Mock scenarios for testing
const mockScenario = (id: string): ScenarioV2 => ({
  id,
  version: 2,
  sport: 'baseball',
  level: 'high-school',
  category: 'bases-empty',
  title: `Test Scenario ${id}`,
  description: 'Test description',
  outs: 0,
  runners: [],
  question: 'Test question?',
  best: {
    id: `${id}-best`,
    label: 'Correct',
    description: 'Correct answer',
    coaching_cue: 'This is correct',
  },
  ok: {
    id: `${id}-ok`,
    label: 'Partial',
    description: 'Partial answer',
    coaching_cue: 'This is okay',
  },
  bad: {
    id: `${id}-bad`,
    label: 'Wrong',
    description: 'Wrong answer',
    coaching_cue: 'This is wrong',
  },
});

describe('Drill Engine', () => {
  describe('pickNextScenario', () => {
    it('should return null if no scenarios', () => {
      const session = createDrillSession('test');
      const result = pickNextScenario([], session);
      expect(result).toBeNull();
    });

    it('should pick a scenario that is due', () => {
      const scenarios = [mockScenario('s1'), mockScenario('s2')];
      const session = createDrillSession('test');
      const progress = ensureScenarioProgress(session, 's1');
      progress.nextDue = Date.now() - 1000; // Due in the past

      const result = pickNextScenario(scenarios, session);
      expect(result?.id).toBe('s1');
    });

    it('should prioritize scenarios with lower correctness rate', () => {
      const scenarios = [mockScenario('s1'), mockScenario('s2')];
      const session = createDrillSession('test');

      // s1: 1 correct out of 2 (50%)
      const progress1 = ensureScenarioProgress(session, 's1');
      progress1.correct = 1;
      progress1.partial = 1;
      progress1.nextDue = Date.now() - 1000;

      // s2: 2 correct out of 2 (100%)
      const progress2 = ensureScenarioProgress(session, 's2');
      progress2.correct = 2;
      progress2.nextDue = Date.now() - 1000;

      const result = pickNextScenario(scenarios, session);
      expect(result?.id).toBe('s1'); // Lower rate
    });

    it('should pick the soonest scenario if none are due', () => {
      const scenarios = [mockScenario('s1'), mockScenario('s2')];
      const session = createDrillSession('test');

      const progress1 = ensureScenarioProgress(session, 's1');
      progress1.nextDue = Date.now() + 10000; // 10 seconds

      const progress2 = ensureScenarioProgress(session, 's2');
      progress2.nextDue = Date.now() + 5000; // 5 seconds (sooner)

      const result = pickNextScenario(scenarios, session);
      expect(result?.id).toBe('s2');
    });
  });

  describe('applyResult', () => {
    it('should increment correct count on BEST', () => {
      const session = createDrillSession('test');
      applyResult(session, 's1', 'best');

      const progress = ensureScenarioProgress(session, 's1');
      expect(progress.correct).toBe(1);
      expect(progress.partial).toBe(0);
      expect(progress.incorrect).toBe(0);
    });

    it('should increment partial count on OK', () => {
      const session = createDrillSession('test');
      applyResult(session, 's1', 'ok');

      const progress = ensureScenarioProgress(session, 's1');
      expect(progress.correct).toBe(0);
      expect(progress.partial).toBe(1);
      expect(progress.incorrect).toBe(0);
    });

    it('should increment incorrect count on BAD', () => {
      const session = createDrillSession('test');
      applyResult(session, 's1', 'bad');

      const progress = ensureScenarioProgress(session, 's1');
      expect(progress.incorrect).toBe(1);
    });

    it('should treat TIMEOUT as incorrect', () => {
      const session = createDrillSession('test');
      applyResult(session, 's1', 'timeout');

      const progress = ensureScenarioProgress(session, 's1');
      expect(progress.timeouts).toBe(1);
      expect(progress.incorrect).toBe(1);
    });

    it('should reset interval on BAD', () => {
      const session = createDrillSession('test');
      const progress = ensureScenarioProgress(session, 's1');
      progress.interval = 10;
      progress.ease = 2.0;
      progress.repetitions = 1;

      applyResult(session, 's1', 'bad');

      expect(progress.interval).toBe(1); // Reset
      expect(progress.ease).toBeLessThan(2.0); // Penalized
    });

    it('should increase interval on BEST', () => {
      const session = createDrillSession('test');
      const progress = ensureScenarioProgress(session, 's1');

      // First BEST: should set interval to 1
      applyResult(session, 's1', 'best');
      expect(progress.interval).toBe(1);

      // Second BEST: should set interval to 3
      applyResult(session, 's1', 'best');
      expect(progress.interval).toBe(3);

      // Third BEST: should multiply by ease factor
      const prevInterval = progress.interval;
      applyResult(session, 's1', 'best');
      expect(progress.interval).toBeGreaterThan(prevInterval);
    });

    it('should increase ease factor on BEST', () => {
      const session = createDrillSession('test');
      const progress = ensureScenarioProgress(session, 's1');
      const initialEase = progress.ease;

      applyResult(session, 's1', 'best');

      expect(progress.ease).toBeGreaterThan(initialEase);
    });

    it('should cap ease factor at 2.5', () => {
      const session = createDrillSession('test');
      const progress = ensureScenarioProgress(session, 's1');

      // Repeatedly answer BEST
      for (let i = 0; i < 10; i++) {
        applyResult(session, 's1', 'best');
      }

      expect(progress.ease).toBeLessThanOrEqual(2.5);
    });

    it('should update nextDue timestamp', () => {
      const session = createDrillSession('test');
      const before = Date.now();

      applyResult(session, 's1', 'best');

      const progress = ensureScenarioProgress(session, 's1');
      expect(progress.nextDue).toBeGreaterThan(before);
    });
  });

  describe('getDrillStats', () => {
    it('should calculate correct rate', () => {
      const scenarios = [mockScenario('s1')];
      const session = createDrillSession('test');

      applyResult(session, 's1', 'best');
      applyResult(session, 's1', 'best');
      applyResult(session, 's1', 'bad');

      const stats = getDrillStats(scenarios, session);
      expect(stats.correctRate).toBe(2 / 3);
    });

    it('should count scenarios seen', () => {
      const scenarios = [mockScenario('s1'), mockScenario('s2'), mockScenario('s3')];
      const session = createDrillSession('test');

      applyResult(session, 's1', 'best');
      applyResult(session, 's2', 'bad');

      const stats = getDrillStats(scenarios, session);
      expect(stats.scenariosSeen).toBe(2);
    });

    it('should return 0 stats for empty session', () => {
      const scenarios = [mockScenario('s1')];
      const session = createDrillSession('test');

      const stats = getDrillStats(scenarios, session);
      expect(stats.totalAttempts).toBe(0);
      expect(stats.scenariosSeen).toBe(0);
      expect(stats.correctRate).toBe(0);
    });
  });
});

// Export tests for runner
export const tests = [
  'pickNextScenario',
  'applyResult',
  'getDrillStats',
];
