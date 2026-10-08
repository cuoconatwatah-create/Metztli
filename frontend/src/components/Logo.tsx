// ─────────────────────────────────────────────────────────
// Metztli — Logo vectorial (mismo emblema que el icono del APK)
// ─────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '@/theme';
import { LOGO_ASPECT, LOGO_PATH, LOGO_VIEWBOX } from './logoPath';

/** `size` es el ancho visible del emblema. Al ser SVG se ve nítido a cualquier tamaño. */
export function Emblem({ size = 150, color = colors.carmin }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size / LOGO_ASPECT}
      viewBox={LOGO_VIEWBOX}
      accessibilityLabel="Logo de Metztli"
    >
      <Path d={LOGO_PATH} fill={color} fillRule="evenodd" />
    </Svg>
  );
}

export default function Logo({ size = 150, color = colors.carmin }: { size?: number; color?: string }) {
  return (
    <View style={styles.wrap}>
      <Emblem size={size} color={color} />
      <Text style={[styles.word, { color, fontSize: size * 0.2 }]}>METZTLI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 14 },
  word: { fontFamily: fonts.display, letterSpacing: 8 },
});
