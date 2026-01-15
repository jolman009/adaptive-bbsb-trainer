import { DrillSession } from '@/types/drillSession';

const STORAGE_KEY = 'adaptive-trainer-session';

/**
 * Save a DrillSession to localStorage
 * @param session The session to persist
 */
export function saveSessionToLocalStorage(session: DrillSession): void {
  try {
    const serialized = JSON.stringify(session);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save session to localStorage:', error);
  }
}

/**
 * Load a DrillSession from localStorage
 * @returns The saved session, or null if not found or corrupted
 */
export function loadSessionFromLocalStorage(): DrillSession | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const session = JSON.parse(stored) as DrillSession;

    // Validate that it has the expected structure
    if (
      !session.id ||
      !session.createdAt ||
      !session.updatedAt ||
      typeof session.progress !== 'object'
    ) {
      console.warn('Stored session has invalid structure, discarding');
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to load session from localStorage:', error);
    return null;
  }
}

/**
 * Clear the persisted session from localStorage
 */
export function clearSessionFromLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear session from localStorage:', error);
  }
}
