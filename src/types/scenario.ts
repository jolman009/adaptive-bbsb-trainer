import { z } from 'zod';

/**
 * ScenarioV2 Schema
 * The complete definition of a baseball/softball training scenario.
 * Versioned to support future migrations without breaking existing data.
 */

export const SportEnum = z.enum(['baseball', 'softball']);
export type Sport = z.infer<typeof SportEnum>;

export const LevelEnum = z.enum(['8u', '10u', '12u', 'high-school', 'college']);
export type Level = z.infer<typeof LevelEnum>;

export const PositionEnum = z.enum([
  'c',  // catcher
  '1b', // first base
  '2b', // second base
  '3b', // third base
  'ss', // shortstop
  'lf', // left field
  'cf', // center field
  'rf', // right field
  'p',  // pitcher
  'dh', // designated hitter
]);
export type Position = z.infer<typeof PositionEnum>;

export const CategoryEnum = z.enum([
  'bases-empty',
  'runner-1b',
  'runner-2b',
  'runner-3b',
  'runners-1b-2b',
  'runners-1b-3b',
  'runners-2b-3b',
  'bases-loaded',
  'double-play-ball',
  'cutoff-relay',
  'throwing-accuracy',
  'bunt-defense',
  'pop-up-priority',
  'situational-awareness',
]);
export type Category = z.infer<typeof CategoryEnum>;

/**
 * Answer option for a scenario.
 * Each scenario has 3 prescribed outcomes: BEST, OK, BAD.
 */
export const AnswerOptionSchema = z.object({
  id: z.string().min(1, 'Answer ID required'),
  label: z.string().min(1, 'Answer label required').max(100),
  description: z.string().min(1, 'Description required'),
  // Why this is correct or incorrect - the teaching moment
  coaching_cue: z.string().min(1, 'Coaching cue required'),
});

export type AnswerOption = z.infer<typeof AnswerOptionSchema>;

/**
 * A complete scenario with all context and answers.
 */
export const ScenarioV2Schema = z.object({
  // Identity
  id: z.string().min(1, 'Scenario ID required').max(50),
  version: z.literal(2).describe('Schema version'),

  // Classification
  sport: SportEnum,
  level: LevelEnum,
  position: PositionEnum.optional(),
  category: CategoryEnum,

  // The situation
  title: z.string().min(5, 'Title too short').max(150),
  description: z.string().min(20, 'Description too short').max(500),
  
  // Outs and runners (to describe the situation)
  outs: z.number().min(0).max(2),
  runners: z.array(z.enum(['1b', '2b', '3b'])),

  // The decision/question to answer
  question: z.string().min(10, 'Question too short').max(300),

  // Three prescribed answers: BEST, OK, BAD
  best: AnswerOptionSchema,
  ok: AnswerOptionSchema,
  bad: AnswerOptionSchema,

  // Metadata
  tags: z.array(z.string()).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type ScenarioV2 = z.infer<typeof ScenarioV2Schema>;

/**
 * A pack of scenarios (dataset).
 */
export const ScenarioPackSchema = z.object({
  version: z.literal(2),
  scenarios: z.array(ScenarioV2Schema).min(1, 'At least one scenario required'),
  metadata: z.object({
    name: z.string(),
    description: z.string().optional(),
    created_at: z.string().datetime().optional(),
    sport: SportEnum.optional(),
    levels: z.array(LevelEnum).optional(),
  }).optional(),
});

export type ScenarioPack = z.infer<typeof ScenarioPackSchema>;
