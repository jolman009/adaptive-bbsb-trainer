import { ScenarioPackSchema, ScenarioV2 } from '@types/scenario';

/**
 * Validates a scenario pack against the ScenarioV2 schema.
 * Throws with detailed error messages if validation fails.
 * @param data - The data to validate
 * @returns The validated ScenarioPack
 * @throws ZodError with detailed validation errors
 */
export function validateScenarioPack(data: unknown): ReturnType<typeof ScenarioPackSchema.parse> {
  return ScenarioPackSchema.parse(data);
}

/**
 * Safely validates a scenario pack and returns result + errors.
 * @param data - The data to validate
 * @returns Object with success flag, data (if valid), and errors (if invalid)
 */
export function validateScenarioPackSafe(
  data: unknown
): { success: boolean; data?: ReturnType<typeof ScenarioPackSchema.parse>; errors?: string[] } {
  const result = ScenarioPackSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map(
      (err) => `${err.path.join('.')}: ${err.message}`
    );
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

/**
 * Validates a single scenario.
 * @param scenario - The scenario to validate
 * @returns The validated scenario
 * @throws ZodError if validation fails
 */
export function validateScenario(scenario: unknown): ScenarioV2 {
  return ScenarioPackSchema.pick({ scenarios: true }).parse({ scenarios: [scenario] })
    .scenarios[0];
}

/**
 * Checks for common issues in a scenario pack (beyond schema validation).
 * @param pack - The validated scenario pack
 * @returns Array of warning messages
 */
export function checkScenarioPackQuality(pack: ReturnType<typeof ScenarioPackSchema.parse>): string[] {
  const warnings: string[] = [];

  // Check for duplicate IDs
  const ids = new Set<string>();
  for (const scenario of pack.scenarios) {
    if (ids.has(scenario.id)) {
      warnings.push(`Duplicate scenario ID: ${scenario.id}`);
    }
    ids.add(scenario.id);
  }

  // Check that answer options are distinguishable
  for (const scenario of pack.scenarios) {
    if (scenario.best.label === scenario.ok.label) {
      warnings.push(`Scenario ${scenario.id}: BEST and OK have identical labels`);
    }
    if (scenario.ok.label === scenario.bad.label) {
      warnings.push(`Scenario ${scenario.id}: OK and BAD have identical labels`);
    }
    if (scenario.best.label === scenario.bad.label) {
      warnings.push(`Scenario ${scenario.id}: BEST and BAD have identical labels`);
    }
  }

  // Warn if dataset is heavy on one sport
  const baseball = pack.scenarios.filter((s) => s.sport === 'baseball').length;
  const softball = pack.scenarios.filter((s) => s.sport === 'softball').length;
  const total = pack.scenarios.length;

  if (baseball === total) {
    warnings.push('Dataset is 100% baseball (no softball)');
  }
  if (softball === total) {
    warnings.push('Dataset is 100% softball (no baseball)');
  }

  return warnings;
}
