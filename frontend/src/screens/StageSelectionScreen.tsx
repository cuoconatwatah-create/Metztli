// ─────────────────────────────────────────────────────────
// Metztli — Elección de etapa (onboarding 2 del prototipo)
// ─────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Moon, Sun, Leaf } from 'lucide-react-native';
import { updateUserMode } from '@/db/database';
import type { LifeStageMode } from '@/types';
import { Button, BackLink, StepDots } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { useUi } from '@/i18n/ui';

const STAGES: { mode: LifeStageMode; title: string; desc: string; Icon: typeof Moon }[] = [
  { mode: 'cycle', title: 'Menstruación', desc: 'Conociendo mi cuerpo y mi ciclo', Icon: Moon },
  { mode: 'pregnancy', title: 'Embarazo', desc: 'Gestación y plenitud', Icon: Sun },
  { mode: 'menopause', title: 'Menopausia', desc: 'La mujer sabia', Icon: Leaf },
];

export default function StageSelectionScreen() {
  const u = useUi();
  const navigation = useNavigation<any>();
  const [selected, setSelected] = useState<LifeStageMode | null>(null);

  const handleContinue = async () => {
    if (!selected) {
      Alert.alert(u('Selecciona una etapa'), u('Por favor elige la etapa en la que te encuentras para personalizar tu espacio.'));
      return;
    }
    try {
      await updateUserMode(selected);
    } catch (e) {
      // No bloqueamos el onboarding: la etapa se puede cambiar luego en Perfil.
      console.warn('No se pudo guardar la etapa', e);
    }
    navigation.navigate('TribuCode');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <BackLink onPress={() => navigation.goBack()} />

        <View style={{ gap: 6 }}>
          <Text style={styles.eyebrow}>{u('ETAPA')}</Text>
          <Text style={styles.title}>{u('Elige tu etapa actual')}</Text>
        </View>

        <View style={styles.options}>
          {STAGES.map(({ mode, title, desc, Icon }) => {
            const isSelected = selected === mode;
            return (
              <TouchableOpacity
                key={mode}
                activeOpacity={0.9}
                onPress={() => setSelected(mode)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                style={[styles.card, isSelected && styles.cardSelected]}
              >
                <View style={[styles.iconBox, isSelected && { backgroundColor: colors.carmin }]}>
                  <Icon size={22} color={isSelected ? colors.white : colors.mutedSoft} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, isSelected && { color: colors.carmin }]}>{u(title)}</Text>
                  <Text style={styles.cardDesc}>{u(desc)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />
        <StepDots total={5} active={1} />
        <Button label={u('COMENZAR (Usuaria)')} onPress={handleContinue} disabled={!selected} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.avena },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24, gap: 24 },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.2, color: colors.mutedSoft },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.carmin },
  options: { gap: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.disabled,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  cardSelected: { borderColor: colors.carmin, backgroundColor: colors.blush },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.avena,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.carbon },
  cardDesc: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 2 },
});
