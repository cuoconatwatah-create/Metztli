// ─────────────────────────────────────────────────────────
// Metztli — Botones para escuchar un mito y su verdad en Mískitu
// ─────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Square } from 'lucide-react-native';
import { getMythAudio } from '@/data/mythAudio';
import { playMythAudio, stopMythAudio } from '@/lib/mythAudio';
import { useUi } from '@/i18n/ui';
import { colors, fonts, radius } from '@/theme';

type Part = 'myth' | 'reality';

export default function MythAudioButtons({ mythId }: { mythId: string }) {
  const u = useUi();
  const audio = getMythAudio(mythId, 'miskitu');
  const [playing, setPlaying] = useState<Part | null>(null);

  useEffect(() => () => { stopMythAudio(); }, []);

  if (!audio) return null;

  const toggle = async (part: Part) => {
    if (playing === part) {
      await stopMythAudio();
      setPlaying(null);
      return;
    }
    setPlaying(part);
    try {
      await playMythAudio([audio[part]], () => setPlaying(null));
    } catch (e) {
      console.warn('No se pudo reproducir el audio', e);
    } finally {
      setPlaying((p) => (p === part ? null : p));
    }
  };

  const button = (part: Part, label: string) => {
    const active = playing === part;
    return (
      <TouchableOpacity
        key={part}
        style={[styles.btn, active && styles.btnActive]}
        onPress={() => toggle(part)}
        accessibilityRole="button"
        accessibilityLabel={active ? u('Detener') : label}
      >
        {active ? <Square size={12} color={colors.white} fill={colors.white} /> : <Play size={14} color={colors.carmin} />}
        <Text style={[styles.btnText, active && { color: colors.white }]}>{active ? u('Detener') : label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.row}>
      {button('myth', u('Escuchar el mito en Mískitu'))}
      {button('reality', u('Escuchar la verdad en Mískitu'))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, marginTop: 12 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.blush,
    borderWidth: 1,
    borderColor: colors.line,
  },
  btnActive: { backgroundColor: colors.carmin, borderColor: colors.carmin },
  btnText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.carmin },
});
