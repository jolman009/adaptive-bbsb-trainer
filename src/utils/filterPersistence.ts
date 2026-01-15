import { ScenarioFilter, createEmptyFilter } from '@/types/scenarioFilter';

const FILTER_STORAGE_KEY = 'adaptive-trainer-filters';

/**
 * Save filter preferences to localStorage
 * @param filter The filter to persist
 */
export function saveFilterToLocalStorage(filter: ScenarioFilter): void {
  try {
    const serialized = JSON.stringify(filter);
    localStorage.setItem(FILTER_STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save filter to localStorage:', error);
  }
}

/**
 * Load filter preferences from localStorage
 * @returns The saved filter, or empty filter if not found
 */
export function loadFilterFromLocalStorage(): ScenarioFilter {
  try {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!stored) return createEmptyFilter();

    const filter = JSON.parse(stored) as ScenarioFilter;

    // Validate that it has expected structure
    if (
      !Array.isArray(filter.sports) ||
      !Array.isArray(filter.levels) ||
      !Array.isArray(filter.categories) ||
      !Array.isArray(filter.positions)
    ) {
      console.warn('Stored filter has invalid structure, using default');
      return createEmptyFilter();
    }

    return filter;
  } catch (error) {
    console.error('Failed to load filter from localStorage:', error);
    return createEmptyFilter();
  }
}

/**
 * Clear filter preferences from localStorage
 */
export function clearFilterFromLocalStorage(): void {
  try {
    localStorage.removeItem(FILTER_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear filter from localStorage:', error);
  }
}
