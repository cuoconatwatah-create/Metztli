// ─────────────────────────────────────────────────────────
// Metztli 2.0 — Sync Queue Hook (Offline-First Forum)
// ─────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { getUnsyncedPosts, markPostAsSynced } from '@/db/database';
import type { ForumPost } from '@/types';

interface SyncQueueState {
  isConnected: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
}

/**
 * Simulates sending a post to the server.
 * In production, replace with actual API call.
 */
async function sendPostToServer(post: ForumPost): Promise<boolean> {
  // TODO: Replace with actual API endpoint
  // const response = await fetch('https://api.metztli.app/forum/posts', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(post),
  // });
  // return response.ok;

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return true;
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
      const unsyncedPosts = await getUnsyncedPosts();

      for (const post of unsyncedPosts) {
        try {
          const success = await sendPostToServer(post);
          if (success) {
            await markPostAsSynced(post.local_uuid);
          }
        } catch {
          // If a single post fails, continue with the rest
          console.warn(`Failed to sync post: ${post.local_uuid}`);
        }
      }

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
