// ─────────────────────────────────────────────────────────
// Metztli — Aprendizaje integral (biblioteca para tu etapa)
// ─────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Volume2, Download, BookOpen, ChevronRight, Send } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { addForumPost, fallbackMyths, getLocalMyths } from '@/db/database';
import { ARTICLES, ARTICLE_FILTERS, CATEGORY_LABELS, type ArticleCategory } from '@/data/learning';
import type { Myth } from '@/types';
import { Card, Chip, CurvedHeader, SectionTitle } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { useUi } from '@/i18n/ui';

export const TONE_BG = { carmin: colors.carmin, bosque: colors.bosque, mauve: colors.mauve } as const;

export default function AprendizajeScreen() {
  const u = useUi();
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<'todos' | ArticleCategory>('todos');
  const [myths, setMyths] = useState<Myth[]>(fallbackMyths);
  const [story, setStory] = useState('');
  const [showStory, setShowStory] = useState(false);

  useEffect(() => {
    getLocalMyths().then((m) => m.length && setMyths(m));
  }, []);

  // Un mito distinto por día.
  const myth = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return myths[dayOfYear % myths.length];
  }, [myths]);

  const articles = ARTICLES.filter((a) => filter === 'todos' || a.category === filter);

  const speak = () => {
    Speech.stop();
    Speech.speak(`${myth.myth} ${myth.reality}`, { language: 'es-ES', rate: 0.9 });
  };

  const sendStory = async () => {
    const text = story.trim();
    if (!text) return;
    const uuid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    await addForumPost(uuid, 'Anónima', 'saberes_ancestrales', text);
    setStory('');
    setShowStory(false);
    Alert.alert(u('¡Gracias!'), u('Tu mito se compartió de forma anónima en la Tribu y se sincronizará cuando haya conexión.'));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <CurvedHeader eyebrow={u('BIBLIOTECA PARA TU ETAPA')} title={u('Aprendizaje integral')} tone="bosque" />

        <View style={styles.body}>
          <View style={styles.rowHead}>
            <SectionTitle>{u('El Desmitificador')}</SectionTitle>
            <TouchableOpacity onPress={() => navigation.navigate('Desmitificador')} accessibilityRole="button">
              <Text style={styles.link}>{u('Ver todos')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mythCard}>
            <TouchableOpacity style={styles.mythAudio} onPress={speak} accessibilityLabel={u('Escuchar')} accessibilityRole="button">
              <Volume2 size={16} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.mythEyebrow}>{u('REALIDAD MÉDICA')}</Text>
            <Text style={styles.mythMyth}>{u('Mito:')} {myth.myth}</Text>
            <Text style={styles.mythReality}>{myth.reality}</Text>
          </View>

          <View style={{ gap: 4 }}>
            <SectionTitle>{u('Botiquín de Saberes')}</SectionTitle>
            <Text style={styles.muted}>{u('Aprende a tu ritmo, aunque no tengas conexión.')}</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {ARTICLE_FILTERS.map((f) => (
              <Chip key={f.value} label={u(f.label)} active={filter === f.value} onPress={() => setFilter(f.value)} />
            ))}
          </ScrollView>

          {articles.length === 0 ? (
            <Text style={styles.muted}>{u('Pronto habrá más contenido en esta categoría.')}</Text>
          ) : (
            <View style={styles.grid}>
              {articles.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  activeOpacity={0.9}
                  style={[styles.articleCard, { backgroundColor: TONE_BG[a.tone] }]}
                  onPress={() => navigation.navigate('Articulo', { id: a.id })}
                  accessibilityRole="button"
                  accessibilityLabel={`${u(a.title)}. ${u(a.summary)}`}
                >
                  <Text style={styles.articleTag}>{u(CATEGORY_LABELS[a.category]).toUpperCase()}</Text>
                  <View style={{ flex: 1 }} />
                  <Text style={styles.articleTitle}>{u(a.title)}</Text>
                  <Text style={styles.articleSummary}>{u(a.summary)}</Text>
                  <View style={styles.offline}>
                    <Download size={12} color={colors.white} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Card style={{ backgroundColor: '#EFE2D6', gap: 12 }}>
            <TouchableOpacity style={styles.storyHead} onPress={() => setShowStory(!showStory)} accessibilityRole="button">
              <View style={styles.storyIcon}>
                <BookOpen size={16} color={colors.carmin} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mythEyebrow2}>{u('EL FOGÓN')}</Text>
                <Text style={styles.storyTitle}>{u('Historias que no sostienen')}</Text>
                <Text style={styles.muted}>{u('¿Escuchaste un mito? Cuéntalo de forma anónima.')}</Text>
              </View>
              <ChevronRight size={18} color={colors.carmin} style={{ transform: [{ rotate: showStory ? '90deg' : '0deg' }] }} />
            </TouchableOpacity>
            {showStory && (
              <View style={{ gap: 10 }}>
                <TextInput
                  style={styles.storyInput}
                  placeholder={u('Escribe aquí lo que te dijeron...')}
                  placeholderTextColor={colors.placeholder}
                  multiline
                  value={story}
                  onChangeText={setStory}
                />
                <TouchableOpacity style={[styles.sendBtn, !story.trim() && { opacity: 0.5 }]} onPress={sendStory} disabled={!story.trim()} accessibilityRole="button">
                  <Send size={14} color={colors.white} />
                  <Text style={styles.sendText}>{u('Enviar de forma anónima')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.avena },
  body: { padding: 16, gap: 16 },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { fontFamily: fonts.semibold, fontSize: 12, color: colors.carmin },
  muted: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  mythCard: { backgroundColor: colors.bosque, borderRadius: radius.lg, padding: 18, gap: 8 },
  mythAudio: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mythEyebrow: { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 1.4, color: 'rgba(244,241,234,0.7)' },
  mythMyth: { fontFamily: fonts.bold, fontSize: 14, color: colors.white, lineHeight: 20, paddingRight: 28 },
  mythReality: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(244,241,234,0.9)', lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  articleCard: { width: '47.5%', aspectRatio: 0.9, borderRadius: radius.lg, padding: 14 },
  articleTag: { fontFamily: fonts.semibold, fontSize: 8, letterSpacing: 1.2, color: 'rgba(255,255,255,0.75)' },
  articleTitle: { fontFamily: fonts.display, fontSize: 17, lineHeight: 20, color: colors.white },
  articleSummary: { fontFamily: fonts.regular, fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 4, marginRight: 24 },
  offline: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  storyIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  mythEyebrow2: { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 1.2, color: colors.carmin },
  storyTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.carbon },
  storyInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 12,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.carbon,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.bosque,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  sendText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.white },
});
