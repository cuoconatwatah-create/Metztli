// ─────────────────────────────────────────────────────────
// Metztli 2.0 — Forum Screen (Offline-First Community)
// ─────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Send, CloudOff, Cloud, ShieldAlert } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { getForumPosts, addForumPost } from '@/db/database';
import { useSyncQueue } from '@/hooks/useSyncQueue';
import type { ForumPost, ForumCategory } from '@/types';
import GlassCard from '@/components/GlassCard';

// Random alias generator components
const ADJECTIVES = ['Brisa', 'Flor', 'Estrella', 'Luna', 'Sol', 'Mar', 'Río', 'Palma'];
const LOCATIONS = ['Caribe', 'Waspam', 'Bilwi', 'Bluefields', 'Siuna', 'Rosita'];

export default function ForumScreen() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [question, setQuestion] = useState('');
  const [alias, setAlias] = useState('Anónimo');
  const [activeCategory, setActiveCategory] = useState<ForumCategory>('ciclo_salud');
  
  const { isConnected, pendingCount, syncPendingPosts } = useSyncQueue();

  // Load alias and posts on mount
  useEffect(() => {
    const initializeForum = async () => {
      // 1. Load or create anonymous alias
      let storedAlias = await SecureStore.getItemAsync('forum_alias');
      if (!storedAlias) {
        const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
        const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
        const num = Math.floor(Math.random() * 99) + 1;
        storedAlias = `${adj}_${loc}_${num}`;
        await SecureStore.setItemAsync('forum_alias', storedAlias);
      }
      setAlias(storedAlias);

      // 2. Load posts from local DB
      await loadPosts(activeCategory);
    };
    initializeForum();
  }, [activeCategory]);

  const loadPosts = async (cat: ForumCategory) => {
    const loadedPosts = await getForumPosts(cat);
    setPosts(loadedPosts);
  };

  const handlePost = async () => {
    if (!question.trim()) return;

    const localUuid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    await addForumPost(localUuid, alias, activeCategory, question.trim());
    setQuestion('');
    
    // Refresh list and trigger sync
    await loadPosts(activeCategory);
    syncPendingPosts();
  };

  const CATEGORIES: { id: ForumCategory; labelKey: string }[] = [
    { id: 'ciclo_salud', labelKey: 'forum.category_cycle' },
    { id: 'embarazo_parto', labelKey: 'forum.category_pregnancy' },
    { id: 'saberes_ancestrales', labelKey: 'forum.category_ancestral' },
    { id: 'menopausia', labelKey: 'forum.category_menopause' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
         <Text style={styles.headerTitle}>{t('forum.title')}</Text>
         <View style={styles.networkStatus}>
            {isConnected ? (
               <Cloud size={20} color="#2C3D30" />
            ) : (
               <CloudOff size={20} color="#666" />
            )}
            {pendingCount > 0 && (
               <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingCount}</Text>
               </View>
            )}
         </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat.id}
              style={[styles.tab, activeCategory === cat.id && styles.tabActive]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Text style={[styles.tabText, activeCategory === cat.id && styles.tabTextActive]}>
                 {t(cat.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Post Input */}
        <GlassCard variant="default" className="mb-6">
           <View style={styles.anonNote}>
              <ShieldAlert size={16} color="#8B2635" />
              <Text style={styles.anonText}>{t('forum.anonymous_note')} ({alias})</Text>
           </View>
           
           <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder={t('forum.write_question')}
                placeholderTextColor="#999"
                value={question}
                onChangeText={setQuestion}
                multiline
                maxLength={300}
              />
              <TouchableOpacity 
                 style={[styles.sendBtn, !question.trim() && styles.sendBtnDisabled]} 
                 onPress={handlePost}
                 disabled={!question.trim()}
              >
                 <Send size={20} color="#FFF" />
              </TouchableOpacity>
           </View>
        </GlassCard>

        {/* Posts List */}
        {posts.length === 0 ? (
           <Text style={styles.emptyText}>{t('forum.no_posts')}</Text>
        ) : (
           posts.map(post => (
             <GlassCard key={post.id} variant="default" className="mb-3">
                <View style={styles.postHeader}>
                   <Text style={styles.postAlias}>{post.alias}</Text>
                   <Text style={styles.postDate}>
                      {new Date(post.created_at).toLocaleDateString()}
                   </Text>
                </View>
                <Text style={styles.postText}>{post.question}</Text>
                
                <View style={styles.postFooter}>
                   {post.is_synced === 1 ? (
                      <Text style={styles.syncedText}>{t('forum.synced')}</Text>
                   ) : (
                      <Text style={styles.pendingText}>{t('forum.pending_sync')}</Text>
                   )}
                </View>
             </GlassCard>
           ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  networkStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#8B2635',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
    marginTop: -8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabsContainer: {
    marginBottom: 12,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(44, 61, 48, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: 'rgba(44, 61, 48, 0.1)',
    borderColor: 'rgba(44, 61, 48, 0.2)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#2C3D30',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  anonNote: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 6,
     marginBottom: 12,
  },
  anonText: {
     fontSize: 12,
     color: '#8B2635',
     fontWeight: '600',
  },
  inputRow: {
     flexDirection: 'row',
     alignItems: 'flex-end',
     gap: 12,
  },
  input: {
     flex: 1,
     minHeight: 50,
     maxHeight: 120,
     backgroundColor: '#FFF',
     borderWidth: 1,
     borderColor: 'rgba(44, 61, 48, 0.15)',
     borderRadius: 16,
     paddingHorizontal: 16,
     paddingTop: 14,
     paddingBottom: 14,
     fontSize: 15,
     color: '#1A1A1A',
     textAlignVertical: 'top',
  },
  sendBtn: {
     width: 48,
     height: 48,
     borderRadius: 24,
     backgroundColor: '#2C3D30',
     justifyContent: 'center',
     alignItems: 'center',
  },
  sendBtnDisabled: {
     backgroundColor: '#A0AAB2',
  },
  emptyText: {
     textAlign: 'center',
     color: '#666',
     marginTop: 40,
  },
  postHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     marginBottom: 8,
  },
  postAlias: {
     fontWeight: '700',
     color: '#2C3D30',
  },
  postDate: {
     fontSize: 12,
     color: '#999',
  },
  postText: {
     fontSize: 15,
     color: '#1A1A1A',
     lineHeight: 22,
     marginBottom: 12,
  },
  postFooter: {
     flexDirection: 'row',
     justifyContent: 'flex-end',
  },
  syncedText: {
     fontSize: 11,
     color: '#2C3D30',
     fontWeight: '500',
  },
  pendingText: {
     fontSize: 11,
     color: '#8B2635',
     fontWeight: '500',
  }
});
