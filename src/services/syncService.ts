import { DrillSession, ScenarioProgress } from '@/types/drillSession';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  batchSaveProgress,
  updateBestStreak,
  loadOrCreateSession,
  resetSession,
} from './sessionService';
import { refreshLeaderboardView } from './leaderboardService';
import { refreshTeamLeaderboard } from './teamService';

const SYNC_DEBOUNCE_MS = 2000; // 2 second debounce
const LOCAL_STORAGE_KEY = 'adaptive-trainer-session';

/**
 * Sync Service
 *
 * Manages debounced synchronization between local state and Supabase.
 * Keeps localStorage as offline fallback.
 */

interface PendingChanges {
  progress: Record<string, ScenarioProgress>;
  bestStreak?: number;
}

class SyncService {
  private pendingChanges: PendingChanges = { progress: {} };
  private syncTimeout: ReturnType<typeof setTimeout> | null = null;
  private userId: string | null = null;
  private sessionId: string | null = null;
  private isSyncing = false;
  private listeners: Set<(syncing: boolean) => void> = new Set();

  /**
   * Initialize sync service with user credentials
   */
  async initialize(userId: string): Promise<DrillSession> {
    this.userId = userId;
    const session = await loadOrCreateSession(userId);
    this.sessionId = session.id;
    return session;
  }

  /**
   * Queue a scenario progress update for sync
   */
  queueProgressUpdate(scenarioId: string, progress: ScenarioProgress): void {
    this.pendingChanges.progress[scenarioId] = progress;
    this.scheduleSyncDebounced();
  }

  /**
   * Queue a best streak update
   */
  queueBestStreakUpdate(bestStreak: number): void {
    this.pendingChanges.bestStreak = bestStreak;
    this.scheduleSyncDebounced();
  }

  /**
   * Save session to localStorage (immediate, for offline support)
   */
  saveToLocalStorage(session: DrillSession): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  /**
   * Load session from localStorage
   */
  loadFromLocalStorage(): DrillSession | null {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as DrillSession;
    } catch {
      return null;
    }
  }

  /**
   * Clear localStorage session
   */
  clearLocalStorage(): void {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }

  /**
   * Schedule a debounced sync
   */
  private scheduleSyncDebounced(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(() => {
      this.performSync();
    }, SYNC_DEBOUNCE_MS);
  }

  /**
   * Perform the actual sync to Supabase
   */
  private async performSync(): Promise<void> {
    if (!isSupabaseConfigured || !this.userId || !this.sessionId) {
      return;
    }

    if (this.isSyncing) {
      // Reschedule if already syncing
      this.scheduleSyncDebounced();
      return;
    }

    this.isSyncing = true;
    this.notifyListeners(true);

    try {
      const changes = { ...this.pendingChanges };
      this.pendingChanges = { progress: {} };

      // Batch save progress updates
      if (Object.keys(changes.progress).length > 0) {
        await batchSaveProgress(this.userId, this.sessionId, changes.progress);
      }

      // Update best streak if changed
      if (changes.bestStreak !== undefined) {
        await updateBestStreak(this.sessionId, changes.bestStreak);
      }

      // Refresh leaderboard views so changes appear immediately
      // Run in background - don't block sync completion
      refreshLeaderboardView().catch(console.error);
      refreshTeamLeaderboard().catch(console.error);
    } catch (error) {
      console.error('Sync failed:', error);
      // Re-queue failed changes
      this.pendingChanges.progress = {
        ...this.pendingChanges.progress,
        ...this.pendingChanges.progress,
      };
    } finally {
      this.isSyncing = false;
      this.notifyListeners(false);
    }
  }

  /**
   * Force immediate sync (e.g., before logout)
   */
  async forceSync(): Promise<void> {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
    await this.performSync();
  }

  /**
   * Reset session data
   */
  async reset(): Promise<void> {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }

    this.pendingChanges = { progress: {} };

    if (this.userId && this.sessionId) {
      await resetSession(this.userId, this.sessionId);
    }

    this.clearLocalStorage();
  }

  /**
   * Subscribe to sync status changes
   */
  onSyncStatusChange(listener: (syncing: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(syncing: boolean): void {
    this.listeners.forEach((listener) => listener(syncing));
  }

  /**
   * Check if there are pending changes
   */
  hasPendingChanges(): boolean {
    return (
      Object.keys(this.pendingChanges.progress).length > 0 ||
      this.pendingChanges.bestStreak !== undefined
    );
  }

  /**
   * Get current sync status
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

// Export singleton instance
export const syncService = new SyncService();
