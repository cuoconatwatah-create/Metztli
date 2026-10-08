// ─────────────────────────────────────────────────────────
// Metztli — Mi Ciclo (Registro / Fases / Plantas)
// ─────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { addCycle } from '@/db/database';
import { localISODate, saveDay } from '@/lib/dailyLog';
import { PHASE_COLORS, PHASE_COPY } from '@/components/CycleRing';
import { Button, Card, CurvedHeader, SegmentedTabs, Stepper } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import type { CyclePhase, FlowLevel } from '@/types';
import { useUi } from '@/i18n/ui';

type Tab = 'registro' | 'fases' | 'plantas';

const COLORS = [
  { id: 'rosado', label: 'Rosado', desc: 'Leve, inicio o fin del período', color: '#F2A6B3' },
  { id: 'rojo_brillante', label: 'Rojo brillante', desc: 'Flujo normal en días de mayor intensidad', color: '#E5384F' },
  { id: 'rojo_oscuro', label: 'Rojo oscuro/café', desc: 'Inicio o fin, sangre más vieja', color: '#7A1F2D' },
  { id: 'cafe', label: 'Café', desc: 'Sangre vieja, típico al final del período', color: '#6B3F2A' },
];

const INTENSITY: { id: string; label: string; level: FlowLevel }[] = [
  { id: 'leve', label: 'Leve', level: 'spotting' },
  { id: 'moderado', label: 'Moderado', level: 'medium' },
  { id: 'abundante', label: 'Abundante', level: 'heavy' },
  { id: 'muy_abundante', label: 'Muy abundante', level: 'heavy' },
];

const MUCUS = [
  { id: 'seca', label: 'Seca / sin flujo' },
  { id: 'cremosa', label: 'Cremosa' },
  { id: 'acuosa', label: 'Acuosa' },
  { id: 'elastica', label: 'Elástica (clara de huevo)' },
];

const PHASE_INFO: Record<CyclePhase, string> = {
  menstrual: 'Sangrado de 3 a 7 días. Es normal sentir cansancio o cólicos; el calor suave y el descanso ayudan.',
  follicular: 'La energía sube y el cuerpo se prepara para ovular. Buen momento para moverte y planear.',
  ovulation: 'Se libera un óvulo. Son los días de mayor fertilidad; puedes notar moco claro y elástico.',
  luteal: 'El cuerpo se prepara para el siguiente ciclo. Puede haber hinchazón, sensibilidad y cambios de ánimo.',
};

const PLANTS = [
  { name: 'Manzanilla', use: 'Infusión tibia para relajar y aliviar molestias del vientre.' },
  { name: 'Jengibre', use: 'En infusión puede ayudar con las náuseas y la inflamación leve.' },
  { name: 'Canela', use: 'Té tibio; apoya la digestión y da sensación de calor.' },
  { name: 'Cacao', use: 'Bebida sin exceso de azúcar; aporta magnesio y bienestar.' },
];

export default function MiCicloScreen() {
  const u = useUi();
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<Tab>('registro');
  const [startDay, setStartDay] = useState(1);
  const [endDay, setEndDay] = useState(5);
  const [flowColor, setFlowColor] = useState('rojo_brillante');
  const [intensity, setIntensity] = useState('moderado');
  const [mucus, setMucus] = useState('seca');
  const [done, setDone] = useState(false);

  const duration = Math.max(endDay, startDay);
  const normal = duration >= 3 && duration <= 7;

  const register = async () => {
    try {
      const start = new Date();
      start.setDate(start.getDate() - (startDay - 1));
      await addCycle(localISODate(start), null, 28, duration);
      const level = INTENSITY.find((i) => i.id === intensity)?.level ?? 'medium';
      await saveDay({ flow_color: flowColor, flow_intensity: intensity, mucus, flow_level: level });
      setDone(true);
    } catch (e: any) {
      Alert.alert(u('No se pudo guardar'), e?.message ?? u('Inténtalo de nuevo.'));
    }
  };

  const label = (list: { id: string; label: string }[], id: string) => u(list.find((x) => x.id === id)?.label ?? '');

  const renderRegistro = () => {
    if (done) {
      return (
        <View style={styles.doneWrap}>
          <Text style={{ fontSize: 56 }}>🌸</Text>
          <Text style={styles.doneTitle}>{u('Período registrado')}</Text>
          <Text style={styles.muted}>{u('Tu calendario y predicciones se actualizaron automáticamente.')}</Text>
          <Card style={styles.summary}>
            <Text style={styles.summaryEyebrow}>{u('DATOS REGISTRADOS')}</Text>
            {[
              [u('Duración'), u('Día {{a}} al {{b}} ({{b}} días)', { a: startDay, b: duration })],
              [u('Color'), label(COLORS, flowColor)],
              [u('Intensidad'), label(INTENSITY, intensity)],
              [u('Mucosidad'), label(MUCUS, mucus)],
            ].map(([k, v]) => (
              <View key={k} style={styles.summaryRow}>
                <Text style={styles.muted}>{k}</Text>
                <Text style={styles.summaryValue}>{v}</Text>
              </View>
            ))}
          </Card>
          <TouchableOpacity onPress={() => setDone(false)} accessibilityRole="button">
            <Text style={styles.link}>{u('Editar registro')}</Text>
          </TouchableOpacity>
          <Button label={u('Volver al calendario')} onPress={() => navigation.goBack()} style={{ alignSelf: 'stretch' }} />
        </View>
      );
    }

    return (
      <>
        <Card style={{ gap: 14 }}>
          <Text style={styles.cardTitle}>{u('Días del período')}</Text>
          <View style={styles.stepRow}>
            <View style={{ gap: 6, alignItems: 'center' }}>
              <Text style={styles.muted}>{u('Día de inicio')}</Text>
              <Stepper value={startDay} min={1} max={10} onChange={(v) => { setStartDay(v); if (endDay < v) setEndDay(v); }} />
            </View>
            <View style={{ gap: 6, alignItems: 'center' }}>
              <Text style={styles.muted}>{u('Día de fin')}</Text>
              <Stepper value={endDay} min={startDay} max={14} onChange={setEndDay} />
            </View>
          </View>
          <View style={styles.durationPill}>
            <Text style={styles.durationText}>
              {u('Duración: {{n}} días', { n: duration })} {normal ? u('✓ Normal') : u('· consulta si dura más de 7 días')}
            </Text>
          </View>
          <Text style={[styles.muted, { textAlign: 'center' }]}>Hoy es el día {startDay} de tu sangrado.</Text>
        </Card>

        <Card style={{ gap: 10 }}>
          <Text style={styles.cardTitle}>{u('Color del flujo')}</Text>
          {COLORS.map((c) => {
            const active = flowColor === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => setFlowColor(c.id)}
                style={[styles.option, active && styles.optionActive]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <View style={[styles.dot, { backgroundColor: c.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>{u(c.label)}</Text>
                  <Text style={styles.small}>{u(c.desc)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </Card>

        <Card style={{ gap: 10 }}>
          <Text style={styles.cardTitle}>{u('Intensidad del flujo')}</Text>
          <View style={styles.intensityRow}>
            {INTENSITY.map((i, idx) => {
              const active = intensity === i.id;
              return (
                <TouchableOpacity
                  key={i.id}
                  onPress={() => setIntensity(i.id)}
                  style={[styles.intensity, active && styles.optionActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={{ fontSize: 16, color: colors.carmin }}>{'💧'.repeat(Math.min(idx + 1, 3))}</Text>
                  <Text style={[styles.intensityText, active && { color: colors.carmin }]}>{u(i.label)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card style={{ gap: 10 }}>
          <Text style={styles.cardTitle}>{u('Mucosidad cervical')}</Text>
          <Text style={styles.small}>{u('Indicador clave de tu fase del ciclo')}</Text>
          <View style={styles.mucusGrid}>
            {MUCUS.map((m) => {
              const active = mucus === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setMucus(m.id)}
                  style={[styles.mucus, active && styles.mucusActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.mucusText, active && { color: colors.bosque, fontFamily: fonts.bold }]}>{u(m.label)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Button label={u('Registrar período')} onPress={register} />
      </>
    );
  };

  const renderFases = () =>
    (['menstrual', 'follicular', 'ovulation', 'luteal'] as CyclePhase[]).map((p) => (
      <Card key={p} style={{ gap: 6, borderLeftWidth: 6, borderLeftColor: PHASE_COLORS[p] }}>
        <Text style={styles.cardTitle}>{u(PHASE_COPY[p].label)}</Text>
        <Text style={styles.body}>{u(PHASE_INFO[p])}</Text>
      </Card>
    ));

  const renderPlantas = () => (
    <>
      <Text style={styles.muted}>{u('Saberes tradicionales de apoyo. No sustituyen la atención médica.')}</Text>
      {PLANTS.map((p) => (
        <Card key={p.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 26 }}>🌿</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{u(p.name)}</Text>
            <Text style={styles.body}>{u(p.use)}</Text>
          </View>
        </Card>
      ))}
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <CurvedHeader title={u('Mi Ciclo')} subtitle={u('Conoce tu cuerpo y tu ritmo')} onBack={() => navigation.goBack()}>
          <SegmentedTabs
            tabs={[
              { value: 'registro', label: u('Registro') },
              { value: 'fases', label: u('Fases') },
              { value: 'plantas', label: u('Plantas 🌿') },
            ]}
            active={tab}
            onChange={setTab}
          />
        </CurvedHeader>
        <View style={styles.content}>{tab === 'registro' ? renderRegistro() : tab === 'fases' ? renderFases() : renderPlantas()}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.avena },
  content: { padding: 16, gap: 14 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.carbon },
  muted: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  small: { fontFamily: fonts.regular, fontSize: 10, color: colors.mutedSoft },
  body: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.muted },
  link: { fontFamily: fonts.semibold, fontSize: 12, color: colors.carmin },
  stepRow: { flexDirection: 'row', justifyContent: 'space-around' },
  durationPill: { backgroundColor: colors.avena, borderRadius: radius.pill, paddingVertical: 8, alignItems: 'center' },
  durationText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.bosque },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  optionActive: { borderColor: colors.carmin, backgroundColor: colors.blush },
  optionTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.carbon },
  dot: { width: 24, height: 24, borderRadius: 12 },
  intensityRow: { flexDirection: 'row', gap: 8 },
  intensity: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  intensityText: { fontFamily: fonts.medium, fontSize: 9, color: colors.muted, textAlign: 'center' },
  mucusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mucus: {
    width: '48%',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  mucusActive: { borderColor: colors.bosque, backgroundColor: '#EAF0EB' },
  mucusText: { fontFamily: fonts.medium, fontSize: 11, color: colors.muted, textAlign: 'center' },
  doneWrap: { alignItems: 'center', gap: 12, paddingTop: 12 },
  doneTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.carbon },
  summary: { alignSelf: 'stretch', gap: 10, backgroundColor: colors.blush },
  summaryEyebrow: { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 1.2, color: colors.carmin },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryValue: { fontFamily: fonts.semibold, fontSize: 12, color: colors.carbon },
});
