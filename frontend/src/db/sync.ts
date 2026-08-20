import { supabase } from '@/lib/supabase';
import { getUnsyncedPosts, markPostAsSynced } from '@/db/database';
import NetInfo from '@react-native-community/netinfo';

export async function syncForumPosts() {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    console.log('No internet connection. Skipping sync.');
    return;
  }

  const unsyncedPosts = await getUnsyncedPosts();
  if (unsyncedPosts.length === 0) {
    console.log('No posts to sync.');
    return;
  }

  console.log(`Syncing ${unsyncedPosts.length} posts to Supabase...`);

  for (const post of unsyncedPosts) {
    try {
      const { error } = await supabase.from('forum_posts').insert([
        {
          local_uuid: post.local_uuid,
          alias: post.alias,
          category: post.category,
          question: post.question,
          created_at: post.created_at,
        },
      ]);

      if (error) {
        // If the error is a duplicate key constraint, it means it's already synced
        if (error.code === '23505') {
          await markPostAsSynced(post.local_uuid);
        } else {
          console.error('Failed to sync post', post.local_uuid, error);
        }
      } else {
        await markPostAsSynced(post.local_uuid);
        console.log('Successfully synced post', post.local_uuid);
      }
    } catch (err) {
      console.error('Exception while syncing post', post.local_uuid, err);
    }
  }
}
