import { ScenarioV2 } from '@/types/scenario';
import { ScenarioFilter } from '@/types/scenarioFilter';

/**
 * filterScenarios
 *
 * Applies filter criteria to a scenario list.
 * Returns only scenarios that match ALL selected criteria.
 *
 * @param scenarios The full scenario list
 * @param filter The filter criteria
 * @returns Filtered scenario list
 *
 * Example:
 *  filter = { sports: ['baseball'], levels: [], categories: [], positions: [] }
 *  Returns all baseball scenarios (level/category/position unrestricted)
 */
export function filterScenarios(scenarios: ScenarioV2[], filter: ScenarioFilter): ScenarioV2[] {
  return scenarios.filter((scenario) => {
    // If a filter dimension has selections, scenario must match at least one
    if (filter.sports.length > 0 && !filter.sports.includes(scenario.sport)) {
      return false;
    }
    if (filter.levels.length > 0 && !filter.levels.includes(scenario.level)) {
      return false;
    }
    if (filter.categories.length > 0 && !filter.categories.includes(scenario.category)) {
      return false;
    }
    if (filter.positions.length > 0 && scenario.position && !filter.positions.includes(scenario.position)) {
      return false;
    }
    return true;
  });
}

/**
 * getUniqueValues
 *
 * Extract unique values from scenarios for a given dimension.
 * Useful for populating filter dropdowns.
 *
 * @param scenarios The scenario list
 * @param dimension Which dimension to extract ('sport', 'level', 'category', 'position')
 * @returns Sorted array of unique values
 */
export function getUniqueValues(
  scenarios: ScenarioV2[],
  dimension: 'sport' | 'level' | 'category' | 'position',
): string[] {
  const values = new Set<string>();
  scenarios.forEach((scenario) => {
    const value = scenario[dimension];
    if (value) {
      values.add(value);
    }
  });
  return Array.from(values).sort();
}
