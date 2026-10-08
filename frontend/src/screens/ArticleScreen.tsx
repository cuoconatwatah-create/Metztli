// ─────────────────────────────────────────────────────────
// Metztli — Detalle de artículo (Botiquín de saberes)
// ─────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Play, Pause, Volume2 } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { ARTICLES, CATEGORY_LABELS } from '@/data/learning';
import { colors, fonts, radius } from '@/theme';
import { useUi } from '@/i18n/ui';

const TONE_BG = { carmin: colors.carmin, bosque: colors.bosque, mauve: colors.mauve } as const;

export default function ArticleScreen() {
  const u = useUi();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const article = ARTICLES.find((a) => a.id === route.params?.id) ?? ARTICLES[0];
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => { Speech.stop(); }, []);

  const fullText = [article.title, article.intro, article.headingList, ...article.bullets, article.outro].map((x) => u(x)).join('. ');

  const toggleAudio = () => {
    if (playing) {
      Speech.stop();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    Speech.speak(fullText, {
      language: 'es-ES',
      rate: 0.9,
      onDone: () => setPlaying(false),
      onStopped: () => setPlaying(false),
      onError: () => setPlaying(false),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.hero, { backgroundColor: TONE_BG[article.tone] }]}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} accessibilityLabel={u('Volver')} accessibilityRole="button">
            <ArrowLeft size={18} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.eyebrow}>
            {u(CATEGORY_LABELS[article.category]).toUpperCase()} · {u(article.stage).toUpperCase()}
          </Text>
          <Text style={styles.title}>{u(article.title)}</Text>
          <Text style={styles.summary}>{u(article.summary)}</Text>
        </View>

        <TouchableOpacity style={styles.audio} onPress={toggleAudio} accessibilityRole="button" accessibilityLabel={u('Escuchar guía')}>
          <View style={styles.playBtn}>{playing ? <Pause size={14} color={colors.bosque} /> : <Play size={14} color={colors.bosque} />}</View>
          <View style={{ flex: 1 }}>
            <Text style={styles.audioTitle}>{u('Escuchar guía ({{n}} min)', { n: article.readMinutes })}</Text>
            <View style={styles.audioTrack}>
              <View style={[styles.audioFill, { width: playing ? '40%' : '0%' }]} />
            </View>
          </View>
          <Volume2 size={16} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.paragraph}>{u(article.intro)}</Text>
          <Text style={styles.heading}>{u(article.headingList)}</Text>
          {article.bullets.map((b) => (
            <View key={b} style={styles.bulletRow}>
              <View style={styles.bullet} />
              <Text style={[styles.paragraph, { flex: 1 }]}>{u(b)}</Text>
            </View>
          ))}
          <Text style={styles.paragraph}>{u(article.outro)}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.avena },
  hero: {
    margin: 16,
    borderRadius: radius.xl,
    padding: 20,
    paddingTop: 64,
    gap: 6,
    overflow: 'hidden',
  },
  back: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.75)' },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, color: colors.white },
  summary: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  audio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    backgroundColor: colors.bosque,
    borderRadius: radius.lg,
    padding: 12,
  },
  playBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.avena, alignItems: 'center', justifyContent: 'center' },
  audioTitle: { fontFamily: fonts.semibold, fontSize: 12, color: colors.white, marginBottom: 6 },
  audioTrack: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' },
  audioFill: { height: 3, borderRadius: 2, backgroundColor: colors.avena },
  content: { padding: 20, gap: 14 },
  paragraph: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: colors.carbon },
  heading: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, color: colors.bosque, marginTop: 4 },
  bulletRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.carmin, marginTop: 8 },
});
