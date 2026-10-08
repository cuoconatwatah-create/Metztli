// ─────────────────────────────────────────────────────────
// Metztli — Sincronización del foro comunitario con Supabase
//
// · Subida: las publicaciones hechas sin conexión (is_synced = 0) se insertan en
//   `forum_posts`. Se envía `local_uuid` para que el reintento sea idempotente.
//   No se envía user_id: el foro es anónimo.
// · Bajada: se traen las últimas publicaciones de la comunidad para leerlas offline.
// ─────────────────────────────────────────────────────────

import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';
import { getUnsyncedPosts, markPostAsSynced, saveRemoteForumPosts, pruneSyncedForumPosts } from '@/db/database';

export interface ForumSyncResult {
  pushed: number;
  pulled: number;
  error?: string;
}

const PULL_LIMIT = 100;

export async function syncForum(): Promise<ForumSyncResult> {
  const result: ForumSyncResult = { pushed: 0, pulled: 0 };

  const state = await NetInfo.fetch();
  if (!state.isConnected) return { ...result, error: 'offline' };

  // 1. Subir pendientes (uno a uno: un fallo no bloquea los demás)
  for (const post of await getUnsyncedPosts()) {
    try {
      const { error } = await supabase.from('forum_posts').insert({
        local_uuid: post.local_uuid,
        alias: post.alias,
        category: post.category,
        question: post.question,
        created_at: post.created_at,
      });
      if (!error || error.code === '23505') {
        // 23505 = ya existía en la nube (reintento): se da por sincronizado
        await markPostAsSynced(post.local_uuid);
        result.pushed += 1;
      } else {
        console.warn('No se pudo subir la publicación', post.local_uuid, error.message);
        result.error = error.message;
      }
    } catch (err) {
      console.warn('Excepción al subir la publicación', post.local_uuid, err);
      result.error = String(err);
    }
  }

  // 2. Bajar lo más reciente de la comunidad
  try {
    const { data, error } = await supabase
      .from('forum_posts')
      .select('local_uuid, alias, category, question, created_at')
      .order('created_at', { ascending: false })
      .limit(PULL_LIMIT);
    if (error) {
      result.error = error.message;
    } else if (data?.length) {
      await saveRemoteForumPosts(data);
      result.pulled = data.length;
      // Moderación: si se bajó todo el historial, o la ventana más reciente, se retira lo que ya no existe en la nube
      const oldest = data.length >= PULL_LIMIT ? data[data.length - 1].created_at : null;
      await pruneSyncedForumPosts(data.map((p) => p.local_uuid), oldest);
    }
  } catch (err) {
    result.error = String(err);
  }

  return result;
}

/** Nombre anterior, se conserva por compatibilidad. */
export const syncForumPosts = syncForum;
