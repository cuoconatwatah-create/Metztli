// ─────────────────────────────────────────────────────────
// Metztli — Selector de etapa (botón + hoja inferior)
// ─────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { Moon, Baby, Flower2, ChevronDown, Check } from 'lucide-react-native';
import { useStage, STAGES } from '@/context/StageContext';
import { useUi } from '@/i18n/ui';
import { colors, fonts, radius } from '@/theme';
import type { LifeStageMode } from '@/types';

export const STAGE_INFO: Record<LifeStageMode, { title: string; desc: string; Icon: typeof Moon }> = {
  cycle: { title: 'Menstruación', desc: 'Ciclo, flujo y bienestar diario', Icon: Moon },
  pregnancy: { title: 'Embarazo', desc: 'Semanas, controles y pataditas', Icon: Baby },
  menopause: { title: 'Menopausia', desc: 'Síntomas y cuidado en esta etapa', Icon: Flower2 },
};

interface Props {
  /** `light` para usar sobre el encabezado de color; `dark` sobre fondo claro. */
  tone?: 'light' | 'dark';
}

export default function StageSwitcher({ tone = 'light' }: Props) {
  const u = useUi();
  const { stage, setStage } = useStage();
  const [open, setOpen] = useState(false);
  const current = STAGE_INFO[stage];
  const onColor = tone === 'light';

  const choose = async (next: LifeStageMode) => {
    setOpen(false);
    if (next !== stage) await setStage(next);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.pill, onColor ? styles.pillLight : styles.pillDark]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={u('Etapa actual: {{stage}}. Toca para cambiar de etapa', { stage: u(current.title) })}
      >
        <current.Icon size={14} color={onColor ? colors.white : colors.carmin} />
        <Text style={[styles.pillText, { color: onColor ? colors.white : colors.carmin }]}>{u(current.title)}</Text>
        <ChevronDown size={14} color={onColor ? colors.white : colors.carmin} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)} accessibilityLabel={u('Cerrar')}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.grabber} />
            <Text style={styles.title}>{u('¿En qué etapa estás?')}</Text>
            <Text style={styles.subtitle}>{u('Cada etapa tiene sus propias pantallas. Tus datos de las otras etapas se conservan.')}</Text>

            {STAGES.map((s) => {
              const info = STAGE_INFO[s];
              const active = s === stage;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => choose(s)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <View style={[styles.optionIcon, active && { backgroundColor: colors.carmin }]}>
                    <info.Icon size={20} color={active ? colors.white : colors.mutedSoft} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionTitle, active && { color: colors.carmin }]}>{u(info.title)}</Text>
                    <Text style={styles.optionDesc}>{u(info.desc)}</Text>
                  </View>
                  {active && <Check size={18} color={colors.carmin} />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  pillLight: { backgroundColor: 'rgba(255,255,255,0.2)' },
  pillDark: { backgroundColor: colors.blush, borderWidth: 1, borderColor: colors.line },
  pillText: { fontFamily: fonts.semibold, fontSize: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(26,26,26,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.avena,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 32,
    gap: 12,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.disabled, marginBottom: 4 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.carbon },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, lineHeight: 18, marginBottom: 4 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.disabled,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  optionActive: { borderColor: colors.carmin, backgroundColor: colors.blush },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: colors.avena,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.carbon },
  optionDesc: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 2 },
});
