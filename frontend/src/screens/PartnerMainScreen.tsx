// ─────────────────────────────────────────────────────────
// Metztli — Vista del acompañante (red de apoyo)
// ─────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HeartHandshake, Moon, Droplet, Coffee, BellRing, LogOut } from 'lucide-react-native';
import { Card, SectionTitle } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { useUi } from '@/i18n/ui';

type PartnerState = 'normal' | 'menstruation' | 'retreat';

const BANNERS: Record<PartnerState, { eyebrow: string; title: string; text: string; icon: React.ReactNode; bg: string }> = {
  normal: {
    eyebrow: 'ESTADO DE HOY',
    title: 'Todo se ve bien',
    text: 'Ana está en una fase de alta energía de su ciclo.',
    icon: <HeartHandshake size={26} color={colors.white} />,
    bg: colors.bosque,
  },
  menstruation: {
    eyebrow: 'ESTADO DE HOY',
    title: 'Día 2 de su ciclo',
    text: 'Ana está en su fase menstrual. Puede tener cólicos o baja energía.',
    icon: <Droplet size={26} color={colors.white} />,
    bg: colors.carmin,
  },
  retreat: {
    eyebrow: 'MODO RETIRO ACTIVO',
    title: 'Necesita descanso',
    text: 'Ana necesita descanso extra y un ambiente tranquilo hoy.',
    icon: <Moon size={26} color={colors.white} />,
    bg: '#111512',
  },
};

const TIPS: Record<PartnerState, { icon: React.ReactNode; text: string }[]> = {
  normal: [{ icon: <HeartHandshake size={20} color={colors.bosque} />, text: 'Es un gran día para salir a caminar o hacer actividades juntos.' }],
  menstruation: [
    { icon: <HeartHandshake size={20} color={colors.bosque} />, text: 'Un masaje suave en la espalda baja puede aliviar su dolor.' },
    { icon: <Coffee size={20} color={colors.bosque} />, text: 'Asegúrate de que tenga agua a la mano. La hidratación reduce la hinchazón.' },
  ],
  retreat: [
    { icon: <Coffee size={20} color={colors.carmin} />, text: 'Prepara una infusión tibia de manzanilla o canela para ayudarle a relajarse.' },
    { icon: <BellRing size={20} color={colors.carmin} />, text: 'Asume las tareas de la casa, evita ruidos fuertes y pregúntale si necesita una cobija o agua caliente.' },
  ],
};

const STATE_LABELS: { value: PartnerState; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'menstruation', label: 'Menstruación' },
  { value: 'retreat', label: 'Modo retiro' },
];

export default function PartnerMainScreen() {
  const u = useUi();
  const navigation = useNavigation<any>();
  // En una app real este estado llegaría sincronizado desde la cuenta vinculada.
  const [state, setState] = useState<PartnerState>('normal');
  const banner = BANNERS[state];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>{u('METZTLI · ACOMPAÑANTE')}</Text>
            <Text style={styles.title}>{u('Bienvenido/a a la red de apoyo')}</Text>
            <Text style={styles.muted}>{u('Estás acompañando a Ana')}</Text>
          </View>
          <TouchableOpacity
            style={styles.exit}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}
            accessibilityLabel={u('Salir de la vista de acompañante')}
            accessibilityRole="button"
          >
            <LogOut size={16} color={colors.carmin} />
            <Text style={styles.exitText}>{u('Salir')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.banner, { backgroundColor: banner.bg }]}>
          <View style={styles.bannerIcon}>{banner.icon}</View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerEyebrow}>{banner.eyebrow}</Text>
            <Text style={styles.bannerTitle}>{banner.title}</Text>
            <Text style={styles.bannerText}>{banner.text}</Text>
          </View>
        </View>

        <SectionTitle>{u('Recomendaciones para ti esta semana')}</SectionTitle>
        {TIPS[state].map((tip) => (
          <Card key={tip.text} style={styles.tip}>
            <View style={styles.tipIcon}>{tip.icon}</View>
            <Text style={styles.tipText}>{tip.text}</Text>
          </Card>
        ))}

        <View style={styles.demo}>
          <Text style={styles.demoTitle}>{u('Simulador de estados (solo demo)')}</Text>
          <View style={styles.demoRow}>
            {STATE_LABELS.map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[styles.demoBtn, state === s.value && styles.demoBtnActive]}
                onPress={() => setState(s.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: state === s.value }}
              >
                <Text style={[styles.demoText, state === s.value && { color: colors.white }]}>{u(s.label)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  exit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  exitText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.carmin },
  safeArea: { flex: 1, backgroundColor: colors.avena },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 1.2, color: colors.carmin },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, color: colors.carbon, marginTop: 4 },
  muted: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 4 },
  banner: { flexDirection: 'row', gap: 14, alignItems: 'center', borderRadius: radius.xl, padding: 20 },
  bannerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  bannerEyebrow: { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.7)' },
  bannerTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.white, marginTop: 2 },
  bannerText: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4, lineHeight: 17 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tipIcon: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.avena, alignItems: 'center', justifyContent: 'center' },
  tipText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.carbon },
  demo: { gap: 8, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.disabled },
  demoTitle: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 0.8, color: colors.mutedSoft },
  demoRow: { flexDirection: 'row', gap: 8 },
  demoBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.white },
  demoBtnActive: { backgroundColor: colors.carmin },
  demoText: { fontFamily: fonts.medium, fontSize: 11, color: colors.carbon },
});
