import { validateScenarioPack, checkScenarioPackQuality } from '@utils/validateScenarioPack';
import { STARTER_DATASET } from '@data/starterDataset';

/**
 * Validates the starter dataset on app load.
 * Throws loudly if the dataset is invalid.
 */
export function initializeScenarioData(): void {
  try {
    // Validate the schema
    const validated = validateScenarioPack(STARTER_DATASET);
    console.log(`✓ Loaded ${validated.scenarios.length} scenarios`);

    // Check for quality issues
    const warnings = checkScenarioPackQuality(validated);
    if (warnings.length > 0) {
      console.warn('⚠ Dataset quality warnings:');
      warnings.forEach((w) => console.warn(`  - ${w}`));
    }

    // Summary
    const baseball = validated.scenarios.filter((s) => s.sport === 'baseball').length;
    const softball = validated.scenarios.filter((s) => s.sport === 'softball').length;
    console.log(`  Baseball: ${baseball}, Softball: ${softball}`);
  } catch (error) {
    console.error('❌ Failed to load scenario dataset:', error);
    throw new Error('Scenario dataset is invalid. Fix the data before proceeding.');
  }
}
