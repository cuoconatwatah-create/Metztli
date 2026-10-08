// ─────────────────────────────────────────────────────────
// Metztli — Etapa Menopausia: inicio ("Tu etapa")
// ─────────────────────────────────────────────────────────

import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Flower2, BookOpen, Ear } from 'lucide-react-native';
import { loadDay, saveDay } from '@/lib/dailyLog';
import MascotCompanion from '@/components/MascotCompanion';
import StageSwitcher from '@/components/StageSwitcher';
import { Card, Chip, CurvedHeader, HubRow, SectionTitle } from '@/components/ui';
import { colors, fonts } from '@/theme';
import { useUi } from '@/i18n/ui';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const SYMPTOMS = [
  { id: 'hotFlashes', label: 'Bochornos' },
  { id: 'insomnia', label: 'Insomnio' },
  { id: 'fatigue', label: 'Cansancio' },
  { id: 'headache', label: 'Dolor de cabeza' },
  { id: 'mood_sensitive', label: 'Ánimo sensible' },
  { id: 'mood_low', label: 'Ánimo bajo' },
];
const MENOPAUSE_IDS = SYMPTOMS.map((s) => s.id);

export default function MenopauseHomeScreen() {
  const u = useUi();
  const navigation = useNavigation<any>();
  const [symptoms, setSymptoms] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadDay().then((day) => active && setSymptoms(day.symptoms));
      return () => {
        active = false;
      };
    }, [])
  );

  const toggle = async (id: string) => {
    const next = symptoms.includes(id) ? symptoms.filter((s) => s !== id) : [...symptoms, id];
    setSymptoms(next);
    await saveDay({ symptoms: next });
  };

  const d = new Date();
  const dateLabel = `${u(DAYS[d.getDay()])}, ${d.getDate()} ${u('de')} ${u(MONTHS[d.getMonth()])}`;
  const today = symptoms.filter((s) => MENOPAUSE_IDS.includes(s)).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <CurvedHeader eyebrow={dateLabel} title={u('Tu etapa')} subtitle={u('Menopausia: una etapa natural de la vida')}>
          <StageSwitcher />
        </CurvedHeader>

        <View style={styles.body}>
          <MascotCompanion stage="menopause" />

          <Card style={{ gap: 12 }}>
            <Text style={styles.title}>{u('¿Qué sientes hoy?')}</Text>
            <Text style={styles.muted}>{u('Puedes elegir más de una opción')}</Text>
            <View style={styles.chips}>
              {SYMPTOMS.map((s) => (
                <Chip key={s.id} label={u(s.label)} active={symptoms.includes(s.id)} onPress={() => toggle(s.id)} />
              ))}
            </View>
            {today > 0 && <Text style={styles.saved}>{u('Guardado en tu historial de hoy')}</Text>}
          </Card>

          <SectionTitle>{u('Cuida esta etapa')}</SectionTitle>
          <HubRow
            icon={<Ear size={20} color={colors.carmin} />}
            title={u('¿Cómo habitas tu día?')}
            desc={u('Traduce lo que sientes en un consejo')}
            onPress={() => navigation.navigate('ComoHabitas')}
          />
          <HubRow
            icon={<BookOpen size={20} color={colors.bosque} />}
            title={u('Habitar el cambio')}
            desc={u('Climaterio y menopausia sin miedo')}
            onPress={() => navigation.navigate('Articulo', { id: 'habitar-cambio' })}
          />
          <HubRow
            icon={<Flower2 size={20} color={colors.bosque} />}
            title={u('Desmitificador')}
            desc={u('Mitos y realidades de la menopausia')}
            onPress={() => navigation.navigate('Desmitificador')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.avena },
  body: { padding: 16, gap: 14 },
  title: { fontFamily: fonts.bold, fontSize: 15, color: colors.carbon },
  muted: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  saved: { fontFamily: fonts.semibold, fontSize: 11, color: colors.bosque },
});
