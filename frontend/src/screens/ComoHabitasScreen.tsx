// ─────────────────────────────────────────────────────────
// Metztli — ¿Cómo habitas tu día? (Traductor cuerpo-mente)
// ─────────────────────────────────────────────────────────

import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { CloudRain, Cloud, Sun, Ear, Sparkles, PhoneCall } from 'lucide-react-native';
import { useStage } from '@/context/StageContext';
import { loadDay, saveDay } from '@/lib/dailyLog';
import GreenPharmacyModal from '@/components/GreenPharmacyModal';
import { Button, Card, Chip, CurvedHeader, LevelBar } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import type { LifeStageMode } from '@/types';
import { useUi } from '@/i18n/ui';

// Los ids son códigos del catálogo "symptoms" (tabla daily_log_symptoms).
const NOTES_BY_STAGE: Record<LifeStageMode, { id: string; label: string }[]> = {
  cycle: [
    { id: 'cramps', label: 'Cólicos' },
    { id: 'low_energy', label: 'Fatiga extrema' },
    { id: 'sweet_cravings', label: 'Antojos dulces' },
    { id: 'body_image', label: 'Odio al espejo' },
    { id: 'mental_load', label: 'Carga mental' },
    { id: 'disabling_pain', label: 'Dolor incapacitante' },
    { id: 'heavy_flow', label: 'Sangrado denso' },
  ],
  pregnancy: [
    { id: 'nausea', label: 'Náuseas' },
    { id: 'fatigue', label: 'Cansancio' },
    { id: 'swelling', label: 'Hinchazón' },
    { id: 'backPain', label: 'Dolor de espalda' },
    { id: 'headache', label: 'Dolor de cabeza' },
    { id: 'dizziness', label: 'Mareos' },
    { id: 'kicks', label: 'Siento a mi bebé moverse' },
  ],
  menopause: [
    { id: 'hotFlashes', label: 'Bochornos' },
    { id: 'insomnia', label: 'Insomnio' },
    { id: 'fatigue', label: 'Cansancio' },
    { id: 'headache', label: 'Dolor de cabeza' },
    { id: 'mood_sensitive', label: 'Ánimo sensible' },
    { id: 'mood_low', label: 'Ánimo bajo' },
  ],
};

const WEATHER = [
  { id: 'lluvia', label: 'Lluvia', Icon: CloudRain },
  { id: 'nublado', label: 'Nublado', Icon: Cloud },
  { id: 'sol', label: 'Sol', Icon: Sun },
];

const STAGE_LABEL: Record<LifeStageMode, string> = {
  cycle: 'Menstruación',
  pregnancy: 'Embarazo',
  menopause: 'Menopausia',
};

interface DayTranslation {
  alert: boolean;
  eyebrow: string;
  title: string;
  habit: string;
}

function translateDay(stage: LifeStageMode, vitality: number, discomfort: number, notes: string[]): DayTranslation {
  if (stage === 'pregnancy') {
    if (discomfort >= 5 || (notes.includes('headache') && notes.includes('swelling')) || (notes.includes('headache') && notes.includes('dizziness'))) {
      return {
        alert: true,
        eyebrow: 'TU CUERPO PIDE ATENCIÓN',
        title: 'Estas señales juntas pueden ser peligrosas en el embarazo.',
        habit: 'Ve hoy mismo a tu centro de salud o avisa a tu partera. No esperes a que pasen solas.',
      };
    }
    if (vitality <= 2 || notes.includes('fatigue')) {
      return {
        alert: false,
        eyebrow: 'DESCANSO QUE ACOMPAÑA',
        title: 'Hoy tu cuerpo trabaja por dos: necesita pausa.',
        habit: 'Hábito de hoy: descansa con los pies en alto, toma agua y cuenta las pataditas de tu bebé.',
      };
    }
    return {
      alert: false,
      eyebrow: 'MOVIMIENTO QUE ACOMPAÑA',
      title: 'Hoy tu cuerpo puede moverse con suavidad.',
      habit: 'Hábito de hoy: una caminata corta, mucha agua y tu conteo de pataditas.',
    };
  }
  if (stage === 'menopause') {
    if (discomfort >= 5) {
      return {
        alert: true,
        eyebrow: 'TU CUERPO PIDE ATENCIÓN',
        title: 'Un malestar que te impide hacer tu día merece revisión médica.',
        habit: 'Acude a tu centro de salud. Si es muy intenso, no esperes.',
      };
    }
    if (notes.includes('hotFlashes')) {
      return {
        alert: false,
        eyebrow: 'ALIVIO QUE ACOMPAÑA',
        title: 'Los bochornos pasan: tu cuerpo se está adaptando.',
        habit: 'Hábito de hoy: ropa ligera por capas, agua fresca y evitar comidas muy picantes.',
      };
    }
    if (notes.includes('insomnia') || vitality <= 2) {
      return {
        alert: false,
        eyebrow: 'DESCANSO QUE ACOMPAÑA',
        title: 'Hoy tu cuerpo necesita pausa, no exigencia.',
        habit: 'Hábito de hoy: cena liviano y baja las luces una hora antes de dormir.',
      };
    }
    return {
      alert: false,
      eyebrow: 'MOVIMIENTO QUE ACOMPAÑA',
      title: 'Hoy tu cuerpo necesita espacio y movimiento sin exigencia.',
      habit: 'Hábito de hoy: 15 minutos de caminata al sol para cuidar tus huesos.',
    };
  }
  if (discomfort >= 5 || notes.includes('disabling_pain')) {
    return {
      alert: true,
      eyebrow: 'TU CUERPO PIDE ATENCIÓN',
      title: 'Un dolor que te impide hacer tu día merece revisión médica.',
      habit: 'Aplica calor suave en el vientre y acude a tu centro de salud. Si es muy intenso, no esperes.',
    };
  }
  if (vitality <= 2 || notes.includes('low_energy')) {
    return {
      alert: false,
      eyebrow: 'DESCANSO QUE ACOMPAÑA',
      title: 'Hoy tu cuerpo necesita pausa, no exigencia.',
      habit: 'Hábito de hoy: dormir 30 minutos más y tomar una infusión tibia.',
    };
  }
  return {
    alert: false,
    eyebrow: 'MOVIMIENTO QUE ACOMPAÑA',
    title: 'Hoy tu cuerpo necesita espacio y movimiento sin exigencia.',
    habit: 'Hábito de hoy: 10 min de yoga suave, posición del niño.',
  };
}

export default function ComoHabitasScreen() {
  const u = useUi();
  const navigation = useNavigation<any>();
  const { stage } = useStage();
  const notesList = NOTES_BY_STAGE[stage];
  const [vitality, setVitality] = useState(3);
  const [discomfort, setDiscomfort] = useState(1);
  const [weather, setWeather] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [result, setResult] = useState<DayTranslation | null>(null);
  const [showPharmacy, setShowPharmacy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const day = await loadDay();
        setVitality(day.vitality ?? 3);
        setDiscomfort(day.discomfort ?? 1);
        setWeather(day.weather);
        setNotes(day.symptoms.filter((id) => NOTES_BY_STAGE[stage].some((n) => n.id === id)));
      })();
    }, [stage])
  );

  const toggleNote = (id: string) => {
    setResult(null);
    setNotes((prev) => (prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]));
  };

  const translate = async () => {
    await saveDay({ vitality, discomfort, weather, symptoms: notes });
    setResult(translateDay(stage, vitality, discomfort, notes));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <CurvedHeader
          eyebrow={u('CUERPO · MENTE')}
          title={u('¿Cómo habitas tu día?')}
          onBack={() => navigation.goBack()}
          right={
            <View style={styles.stage}>
              <Text style={styles.stageText}>{u(STAGE_LABEL[stage])}</Text>
            </View>
          }
        />

        <View style={styles.body}>
          <Card style={{ gap: 18 }}>
            <View style={styles.listen}>
              <Ear size={22} color={colors.carmin} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{u('Escucha activa')}</Text>
                <Text style={styles.muted}>{u('Tu cuerpo te habla. Registra lo que sientes, sin juzgarte.')}</Text>
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <View style={styles.levelHead}>
                <Text style={styles.title}>{u('Vitalidad')}</Text>
                <View style={styles.badge}><Text style={styles.badgeText}>{vitality}</Text></View>
              </View>
              <LevelBar value={vitality} onChange={(v) => { setVitality(v); setResult(null); }} />
              <View style={styles.levelHead}>
                <Text style={styles.small}>{u('Bajo / agotada')}</Text>
                <Text style={styles.small}>{u('Máxima energía')}</Text>
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <View style={styles.levelHead}>
                <Text style={styles.title}>{u('Incomodidad')}</Text>
                <View style={styles.badge}><Text style={styles.badgeText}>{discomfort}</Text></View>
              </View>
              <LevelBar value={discomfort} onChange={(v) => { setDiscomfort(v); setResult(null); }} />
              <View style={styles.levelHead}>
                <Text style={styles.small}>{u('Cero dolor')}</Text>
                <Text style={styles.small}>{u('Dolor incapacitante')}</Text>
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={styles.title}>{u('Clima emocional')}</Text>
              <View style={styles.weatherRow}>
                {WEATHER.map(({ id, label, Icon }) => {
                  const active = weather === id;
                  return (
                    <TouchableOpacity
                      key={id}
                      onPress={() => { setWeather(id); setResult(null); }}
                      style={[styles.weather, active && { backgroundColor: colors.bosque }]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Icon size={20} color={active ? colors.white : colors.muted} />
                      <Text style={[styles.weatherText, active && { color: colors.white }]}>{u(label)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </Card>

          <View style={{ gap: 8 }}>
            <Text style={styles.title}>{u('¿Qué más notas?')}</Text>
            <Text style={styles.muted}>{u('Puedes elegir más de una opción')}</Text>
            <View style={styles.chips}>
              {notesList.map((n) => (
                <Chip key={n.id} label={u(n.label)} active={notes.includes(n.id)} onPress={() => toggleNote(n.id)} />
              ))}
            </View>
          </View>

          <Button
            label={u('Traducir mi día')}
            icon={<Sparkles size={16} color={colors.white} />}
            onPress={translate}
          />

          {result && (
            <View style={[styles.result, result.alert && { backgroundColor: colors.carmin }]}>
              <Text style={styles.resultEyebrow}>{u(result.eyebrow)}</Text>
              <Text style={styles.resultTitle}>{u(result.title)}</Text>
              <View style={styles.resultHabit}>
                <Text style={styles.resultHabitText}>{u(result.habit)}</Text>
              </View>
              {result.alert ? (
                <TouchableOpacity style={styles.callBtn} onPress={() => navigation.navigate('Directorio')} accessibilityRole="button">
                  <PhoneCall size={14} color={colors.carmin} />
                  <Text style={styles.callText}>{u('Ver centros de salud cercanos')}</Text>
                </TouchableOpacity>
              ) : stage === 'pregnancy' ? (
                <TouchableOpacity style={styles.callBtn} onPress={() => navigation.navigate('ObstetricAlarm')} accessibilityRole="button">
                  <Text style={styles.callText}>{u('Ver señales de alarma del embarazo')}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.callBtn} onPress={() => setShowPharmacy(true)} accessibilityRole="button">
                  <Text style={styles.callText}>{u('Ver consejo de la Farmacia Verde')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <GreenPharmacyModal visible={showPharmacy} onClose={() => setShowPharmacy(false)} symptoms={notes} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.avena },
  body: { padding: 16, gap: 16 },
  stage: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  stageText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.white },
  listen: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 14, color: colors.carbon },
  muted: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  small: { fontFamily: fonts.regular, fontSize: 9, color: colors.mutedSoft },
  levelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { minWidth: 24, height: 24, borderRadius: 12, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: fonts.bold, fontSize: 12, color: colors.carmin },
  weatherRow: { flexDirection: 'row', gap: 8 },
  weather: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.avena },
  weatherText: { fontFamily: fonts.medium, fontSize: 11, color: colors.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  result: { backgroundColor: colors.bosque, borderRadius: radius.lg, padding: 18, gap: 10 },
  resultEyebrow: { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.75)' },
  resultTitle: { fontFamily: fonts.display, fontSize: 18, lineHeight: 23, color: colors.white },
  resultHabit: { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: radius.md, padding: 12 },
  resultHabitText: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, color: colors.white },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.avena,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  callText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.carmin },
});
