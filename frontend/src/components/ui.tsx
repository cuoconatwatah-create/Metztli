// ─────────────────────────────────────────────────────────
// Metztli — UI Kit (componentes base del prototipo de Figma)
// ─────────────────────────────────────────────────────────

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { colors, fonts, radius, shadow } from '@/theme';
import { useUi } from '@/i18n/ui';

// ── Botones ──────────────────────────────────────────────

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'solid' | 'outline' | 'dark';
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = 'solid', disabled, icon, style }: ButtonProps) {
  const isOutline = variant === 'outline';
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        variant === 'solid' && styles.buttonSolid,
        variant === 'dark' && styles.buttonDark,
        isOutline && styles.buttonOutline,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      {icon}
      <Text style={[styles.buttonText, isOutline && { color: colors.carbon }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Navegación de pasos ──────────────────────────────────

export function StepDots({ total, active }: { total: number; active: number }) {
  return (
    <View style={styles.dots} accessibilityLabel={`Paso ${active + 1} de ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, i === active && styles.dotActive]} />
      ))}
    </View>
  );
}

export function BackLink({ label, onPress }: { label?: string; onPress: () => void }) {
  const u = useUi();
  return (
    <TouchableOpacity style={styles.backLink} onPress={onPress} accessibilityRole="button">
      <ArrowLeft size={16} color={colors.carmin} />
      <Text style={styles.backLinkText}>{label ?? u('Ir al paso anterior')}</Text>
    </TouchableOpacity>
  );
}

// ── Superficies ──────────────────────────────────────────

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Fila de acceso (icono, título, descripción y flecha) usada en los inicios de cada etapa. */
export function HubRow({
  icon,
  title,
  desc,
  onPress,
  danger,
}: {
  icon: React.ReactNode;
  title: string;
  desc?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} accessibilityRole="button" accessibilityLabel={desc ? `${title}. ${desc}` : title}>
      <Card style={styles.hub}>
        <View style={[styles.hubIcon, danger && { backgroundColor: colors.blush }]}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.hubTitle, danger && { color: colors.carmin }]}>{title}</Text>
          {desc ? <Text style={styles.hubDesc}>{desc}</Text> : null}
        </View>
        <ChevronRight size={18} color={colors.mutedSoft} />
      </Card>
    </TouchableOpacity>
  );
}

export function SectionTitle({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.sectionTitle, style]}>{children}</Text>;
}

export function Chip({
  label,
  active,
  onPress,
  tone = 'carmin',
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  tone?: 'carmin' | 'bosque';
}) {
  const activeBg = tone === 'carmin' ? colors.carmin : colors.bosque;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.chip, active && { backgroundColor: activeBg, borderColor: activeBg }]}
    >
      <Text style={[styles.chipText, active && { color: colors.white }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Encabezado curvo + pestañas ──────────────────────────

interface CurvedHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  tone?: 'carmin' | 'bosque';
  onBack?: () => void;
  right?: React.ReactNode;
  children?: React.ReactNode;
}

export function CurvedHeader({ title, subtitle, eyebrow, tone = 'carmin', onBack, right, children }: CurvedHeaderProps) {
  const u = useUi();
  return (
    <View style={[styles.header, { backgroundColor: tone === 'carmin' ? colors.carmin : colors.bosque }]}>
      <View style={styles.headerRow}>
        {onBack && (
          <TouchableOpacity style={styles.headerBack} onPress={onBack} accessibilityLabel={u('Volver')} accessibilityRole="button">
            <ArrowLeft size={18} color={colors.white} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          {eyebrow ? <Text style={styles.headerEyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

export function SegmentedTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { value: T; label: string }[];
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <TouchableOpacity
            key={tab.value}
            style={[styles.segment, isActive && styles.segmentActive]}
            onPress={() => onChange(tab.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.segmentText, isActive && { color: colors.carmin }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Controles de registro ────────────────────────────────

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  format,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
}) {
  const u = useUi();
  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        style={styles.stepperMinus}
        onPress={() => onChange(Math.max(min, +(value - step).toFixed(1)))}
        accessibilityLabel={u('Disminuir')}
        accessibilityRole="button"
      >
        <Text style={styles.stepperMinusText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.stepperValue}>{format ? format(value) : value}</Text>
      <TouchableOpacity
        style={styles.stepperPlus}
        onPress={() => onChange(Math.min(max, +(value + step).toFixed(1)))}
        accessibilityLabel={u('Aumentar')}
        accessibilityRole="button"
      >
        <Text style={styles.stepperPlusText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

/** Barra de 1 a `max` para valores como vitalidad o incomodidad. */
export function LevelBar({
  value,
  max = 5,
  onChange,
}: {
  value: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  const u = useUi();
  return (
    <View style={styles.levelBar}>
      {Array.from({ length: max }).map((_, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.levelSegment, i < value && { backgroundColor: colors.carmin }]}
          onPress={() => onChange(i + 1)}
          accessibilityLabel={u('Nivel {{n}}', { n: i + 1 })}
          accessibilityRole="button"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: radius.pill,
  },
  buttonSolid: { backgroundColor: colors.carmin, ...shadow.glow },
  buttonDark: { backgroundColor: colors.bosque },
  buttonOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.carbon },
  buttonDisabled: { backgroundColor: colors.disabled, shadowOpacity: 0, elevation: 0 },
  buttonText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.white, letterSpacing: 0.3 },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 4, borderRadius: 2, backgroundColor: colors.disabled },
  dotActive: { width: 24, backgroundColor: colors.carmin },

  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  backLinkText: { fontFamily: fonts.medium, fontSize: 12, color: colors.carmin },

  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, ...shadow.card },
  hub: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  hubIcon: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.avena, alignItems: 'center', justifyContent: 'center' },
  hubTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.carbon },
  hubDesc: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted, marginTop: 2 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.carbon },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipText: { fontFamily: fonts.medium, fontSize: 12, color: colors.carbon },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    gap: 16,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEyebrow: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 2,
  },
  headerTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.white, lineHeight: 28 },
  headerSubtitle: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  segmented: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.pill,
    padding: 4,
  },
  segment: { flex: 1, paddingVertical: 8, borderRadius: radius.pill, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.avena },
  segmentText: { fontFamily: fonts.semibold, fontSize: 12, color: 'rgba(255,255,255,0.85)' },

  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepperMinus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.avena,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperMinusText: { fontFamily: fonts.bold, fontSize: 18, color: colors.carbon, marginTop: -2 },
  stepperPlus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.carmin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperPlusText: { fontFamily: fonts.bold, fontSize: 18, color: colors.white, marginTop: -2 },
  stepperValue: { fontFamily: fonts.display, fontSize: 28, color: colors.carbon, minWidth: 40, textAlign: 'center' },

  levelBar: { flexDirection: 'row', gap: 4 },
  levelSegment: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.line },
});
