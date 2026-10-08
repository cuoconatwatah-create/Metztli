// ─────────────────────────────────────────────────────────
// Metztli — Cuerpo y Mente (Mi registro / Ejercicios)
// ─────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Droplets, Play, Square, Moon as MoonIcon, Footprints } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { loadDay, saveDay } from '@/lib/dailyLog';
import { Button, Card, CurvedHeader, SegmentedTabs, Stepper } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { useUi } from '@/i18n/ui';

const MOODS = [
  { id: 'feliz', emoji: '😊', label: 'Feliz' },
  { id: 'bien', emoji: '🙂', label: 'Bien' },
  { id: 'triste', emoji: '😔', label: 'Triste' },
  { id: 'irritada', emoji: '😠', label: 'Irritada' },
  { id: 'cansada', emoji: '😴', label: 'Cansada' },
];

const EXERCISES = [
  {
    id: 'meditacion',
    tag: 'Mente',
    minutes: 5,
    title: 'Meditación consciente',
    desc: 'Conectate con tu cuerpo y tu bebé',
    script:
      'Siéntate cómoda y cierra los ojos. Respira profundo por la nariz y suelta el aire despacio. Lleva tu atención a tu cuerpo, de la cabeza a los pies. Si llegan pensamientos, déjalos pasar y vuelve a tu respiración.',
  },
  {
    id: 'respiracion',
    tag: 'Calma',
    minutes: 3,
    title: 'Respiración 4-7-8',
    desc: 'Reduce el cansancio y la ansiedad',
    script:
      'Inhala por la nariz contando hasta cuatro. Sostén el aire contando hasta siete. Exhala despacio por la boca contando hasta ocho. Repite este ciclo cuatro veces, con calma.',
  },
  {
    id: 'estiramiento',
    tag: 'Cuerpo',
    minutes: 10,
    title: 'Estiramiento suave',
    desc: 'Alivia la tensión en espalda y caderas',
    script:
      'De rodillas, siéntate sobre tus talones y estira los brazos al frente apoyando la frente en el piso, como la posición del niño. Respira lento durante un minuto. Luego gira suavemente las caderas en círculos amplios.',
  },
];

const MAX_SLEEP = 12;
const GLASSES = 8;

export default function CuerpoMenteScreen() {
  const u = useUi();
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<'registro' | 'ejercicios'>('registro');
  const [mood, setMood] = useState<string | null>(null);
  const [sleep, setSleep] = useState(7);
  const [move, setMove] = useState(30);
  const [water, setWater] = useState(0);
  const [saved, setSaved] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadDay().then((day) => {
        setMood(day.mood);
        setSleep(day.sleep_hours ?? 7);
        setMove(day.movement_min ?? 30);
        setWater(day.water_glasses ?? 0);
      });
      return () => {
        Speech.stop();
        setPlaying(null);
      };
    }, [])
  );

  useEffect(() => () => { Speech.stop(); }, []);

  const save = async () => {
    await saveDay({ mood, sleep_hours: sleep, movement_min: move, water_glasses: water });
    setSaved(true);
    Alert.alert(u('Registro guardado'), u('Tu bienestar de hoy quedó guardado en tu historial.'));
  };

  const sleepNote =
    sleep >= 7 ? '✦ Descanso suficiente' : sleep >= 5 ? '✦ Aceptable, intenta llegar a 8 h' : '✦ Poco descanso: hoy cuida tu energía';

  const togglePlay = (id: string, script: string) => {
    Speech.stop();
    if (playing === id) {
      setPlaying(null);
      return;
    }
    setPlaying(id);
    Speech.speak(script, {
      language: 'es-ES',
      rate: 0.88,
      onDone: () => setPlaying(null),
      onStopped: () => setPlaying((p) => (p === id ? null : p)),
      onError: () => setPlaying(null),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <CurvedHeader title={u('Cuerpo & Mente')} subtitle={u('Tu bienestar integral de hoy')}>
          <SegmentedTabs
            tabs={[
              { value: 'registro', label: u('Mi Registro') },
              { value: 'ejercicios', label: u('Ejercicios') },
            ]}
            active={tab}
            onChange={setTab}
          />
        </CurvedHeader>

        <View style={styles.body}>
          {tab === 'registro' ? (
            <>
              <Card style={{ gap: 14 }}>
                <Text style={styles.cardTitle}>{u('¿Cómo te sientes hoy?')}</Text>
                <View style={styles.moods}>
                  {MOODS.map((m) => {
                    const active = mood === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={styles.moodItem}
                        onPress={() => { setMood(m.id); setSaved(false); }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={u(m.label)}
                      >
                        <View style={[styles.moodCircle, active && styles.moodActive]}>
                          <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
                        </View>
                        <Text style={[styles.moodLabel, active && { color: colors.carmin, fontFamily: fonts.bold }]}>{u(m.label)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card>

              <Card style={{ gap: 12 }}>
                <View style={styles.cardHead}>
                  <MoonIcon size={16} color={colors.carmin} />
                  <Text style={styles.cardTitle}>{u('Horas de sueño')}</Text>
                </View>
                <View style={styles.center}>
                  <Stepper value={sleep} onChange={(v) => { setSleep(v); setSaved(false); }} min={0} max={MAX_SLEEP} step={0.5} format={(v) => String(v)} />
                  <Text style={styles.unit}>{u('horas')}</Text>
                </View>
                <View style={styles.bars}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <View key={i} style={[styles.bar, i < Math.round(sleep) && { backgroundColor: colors.bosque }]} />
                  ))}
                </View>
                <Text style={styles.note}>{u(sleepNote)}</Text>
              </Card>

              <Card style={{ gap: 12 }}>
                <View style={styles.cardHead}>
                  <Footprints size={16} color={colors.carmin} />
                  <Text style={styles.cardTitle}>{u('Movimiento del día')}</Text>
                </View>
                <View style={styles.center}>
                  <Stepper value={move} onChange={(v) => { setMove(v); setSaved(false); }} min={0} max={180} step={5} />
                  <Text style={styles.unit}>{u('min')}</Text>
                </View>
                <Text style={styles.note}>{u('Meta recomendada: 30 min de movimiento suave, como una caminata.')}</Text>
              </Card>

              <Card style={{ gap: 12 }}>
                <View style={[styles.cardHead, { justifyContent: 'space-between' }]}>
                  <View style={styles.cardHead}>
                    <Droplets size={16} color="#3182CE" />
                    <Text style={styles.cardTitle}>{u('Hidratación')}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{water}/{GLASSES}</Text>
                </View>
                <View style={styles.glasses}>
                  {Array.from({ length: GLASSES }).map((_, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => { setWater(i + 1 === water ? i : i + 1); setSaved(false); }}
                      accessibilityLabel={u('Vaso {{n}}', { n: i + 1 })}
                      accessibilityRole="button"
                    >
                      <Droplets size={24} color={i < water ? '#3182CE' : colors.disabled} fill={i < water ? '#BEE3F8' : 'transparent'} />
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>

              <Button label={saved ? u('Registro guardado ✓') : u('Guardar registro')} onPress={save} />
              <TouchableOpacity onPress={() => navigation.navigate('ComoHabitas')} style={styles.linkRow} accessibilityRole="button">
                <Text style={styles.link}>{u('¿Cómo habitas tu día? Traduce lo que sientes →')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.reco}>
                <Text style={styles.recoEyebrow}>{u('RECOMENDADO HOY')}</Text>
                <Text style={styles.recoText}>
                  La respiración profunda y el estiramiento de caderas son especialmente beneficiosos.
                </Text>
              </View>
              {EXERCISES.map((ex) => (
                <Card key={ex.id} style={styles.exercise}>
                  <View style={styles.exIcon}>
                    <Text style={{ fontSize: 22 }}>{ex.id === 'meditacion' ? '🧘' : ex.id === 'respiracion' ? '🌬️' : '🤸'}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.exMeta}>{u(ex.tag)} · {ex.minutes} min</Text>
                    <Text style={styles.cardTitle}>{u(ex.title)}</Text>
                    <Text style={styles.note}>{u(ex.desc)}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.play, playing === ex.id && { backgroundColor: colors.carmin }]}
                    onPress={() => togglePlay(ex.id, u(ex.script))}
                    accessibilityRole="button"
                    accessibilityLabel={playing === ex.id ? u('Detener {{t}}', { t: u(ex.title) }) : u('Escuchar {{t}}', { t: u(ex.title) })}
                  >
                    {playing === ex.id ? <Square size={12} color={colors.white} fill={colors.white} /> : <Play size={14} color={colors.carmin} />}
                  </TouchableOpacity>
                </Card>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.avena },
  body: { padding: 16, gap: 14 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.carbon },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  center: { alignItems: 'center', gap: 2 },
  unit: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  note: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted, textAlign: 'center' },
  moods: { flexDirection: 'row', justifyContent: 'space-between' },
  moodItem: { alignItems: 'center', gap: 4 },
  moodCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.avena,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodActive: { borderColor: colors.carmin, backgroundColor: colors.blush },
  moodLabel: { fontFamily: fonts.regular, fontSize: 10, color: colors.muted },
  bars: { flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.line },
  glasses: { flexDirection: 'row', justifyContent: 'space-between' },
  linkRow: { alignItems: 'center', padding: 6 },
  link: { fontFamily: fonts.semibold, fontSize: 12, color: colors.carmin },
  reco: { backgroundColor: colors.bosque, borderRadius: radius.lg, padding: 16, gap: 6 },
  recoEyebrow: { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 1.2, color: 'rgba(244,241,234,0.7)' },
  recoText: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 20, color: colors.white },
  exercise: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exIcon: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.avena, alignItems: 'center', justifyContent: 'center' },
  exMeta: { fontFamily: fonts.semibold, fontSize: 10, color: colors.carmin },
  play: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.blush,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
