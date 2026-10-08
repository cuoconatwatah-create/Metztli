// ─────────────────────────────────────────────────────────
// Metztli — Sync Queue Hook (Offline-First Forum)
// ─────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { getUnsyncedPosts } from '@/db/database';
import { syncForum } from '@/db/sync';

interface SyncQueueState {
  isConnected: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
}

export function useSyncQueue() {
  const [state, setState] = useState<SyncQueueState>({
    isConnected: false,
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
  });

  const isSyncingRef = useRef(false);

  /**
   * Counts unsynced posts in the database.
   */
  const refreshPendingCount = useCallback(async () => {
    try {
      const posts = await getUnsyncedPosts();
      setState((prev) => ({ ...prev, pendingCount: posts.length }));
    } catch {
      // Silently ignore
    }
  }, []);

  /**
   * Attempts to sync all pending posts when connectivity is available.
   */
  const syncPendingPosts = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setState((prev) => ({ ...prev, isSyncing: true }));

    try {
      // Sube lo pendiente y baja lo nuevo de la comunidad (Supabase)
      await syncForum();

      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date().toISOString(),
      }));

      await refreshPendingCount();
    } catch (error) {
      console.error('Sync error:', error);
      setState((prev) => ({ ...prev, isSyncing: false }));
    } finally {
      isSyncingRef.current = false;
    }
  }, [refreshPendingCount]);

  /**
   * Handles connectivity changes.
   * Automatically triggers sync when internet becomes available.
   */
  const handleConnectivityChange = useCallback(
    (netInfoState: NetInfoState) => {
      const connected = netInfoState.isConnected ?? false;
      setState((prev) => ({ ...prev, isConnected: connected }));

      // Auto-sync when connection is restored
      if (connected && !isSyncingRef.current) {
        syncPendingPosts();
      }
    },
    [syncPendingPosts]
  );

  // Subscribe to network state changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(handleConnectivityChange);

    // Initial check
    NetInfo.fetch().then(handleConnectivityChange);
    refreshPendingCount();

    return () => {
      unsubscribe();
    };
  }, [handleConnectivityChange, refreshPendingCount]);

  return {
    ...state,
    syncPendingPosts,
    refreshPendingCount,
  };
}
