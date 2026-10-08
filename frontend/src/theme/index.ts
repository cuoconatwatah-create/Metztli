// ─────────────────────────────────────────────────────────
// Metztli — Design Tokens (alineados al prototipo de Figma)
// ─────────────────────────────────────────────────────────

export const colors = {
  avena: '#F4F1EA', // Brand/Avena-Fondo
  carmin: '#8B2635', // Brand/Carmin-Primario
  carminDark: '#6E1D2A',
  bosque: '#2C3D30',
  bosqueSoft: '#3F5444',
  carbon: '#1A1A1A',
  white: '#FFFFFF',
  blush: '#FDF2F4',
  rose: '#E8B4BD',
  mauve: '#7A6076',
  ocre: '#D4A373',
  gold: '#D9A93A',
  line: 'rgba(44, 61, 48, 0.12)',
  muted: '#4A5568',
  mutedSoft: '#8A8A8A',
  placeholder: '#A0AEC0',
  disabled: '#C9C3B6',
} as const;

/**
 * Familias tipográficas. Se cargan en App.tsx con @expo-google-fonts/inter.
 * `display` es la fuente de títulos: el Figma usa Clash Display Bold; mientras
 * esa fuente no se incluya en /assets/fonts se usa Inter ExtraBold.
 */
export const fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  display: 'Inter-ExtraBold',
  italic: 'Inter-SemiBoldItalic',
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

export const shadow = {
  card: {
    shadowColor: colors.bosque,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  glow: {
    shadowColor: colors.carmin,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
