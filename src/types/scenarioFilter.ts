import { Sport, Level, Category, Position } from '@/types/scenario';

/**
 * ScenarioFilter
 *
 * Represents user-selected filter criteria for drilling.
 * All filter fields are optional: null/undefined means "no filter" (include all).
 *
 * Usage:
 *  - User selects sport=baseball, level=12u
 *  - filterScenarios() returns only baseball scenarios at 12u level
 *  - Filter state persists to localStorage
 */
export interface ScenarioFilter {
  sports: Sport[];
  levels: Level[];
  categories: Category[];
  positions: Position[];
}

/**
 * Create a default (empty) filter — matches all scenarios
 */
export function createEmptyFilter(): ScenarioFilter {
  return {
    sports: [],
    levels: [],
    categories: [],
    positions: [],
  };
}

/**
 * Check if a filter is "active" (has any selections)
 */
export function isFilterActive(filter: ScenarioFilter): boolean {
  return (
    filter.sports.length > 0 ||
    filter.levels.length > 0 ||
    filter.categories.length > 0 ||
    filter.positions.length > 0
  );
}
