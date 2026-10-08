// ─────────────────────────────────────────────────────────
// Metztli — Pestañas por etapa
//
// Cada etapa tiene su propio conjunto de pantallas:
//   Menstruación → Calendario · Cuerpo Mente · + · Aprendizaje · Perfil
//   Embarazo     → Embarazo · Controles · + · Aprendizaje · Perfil
//   Menopausia   → Inicio · Cuerpo Mente · + · Aprendizaje · Perfil
// Al cambiar de etapa (useStage().setStage) se intercambia el navegador.
// ─────────────────────────────────────────────────────────

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, LayoutGrid, BookOpen, User, Plus, Baby, Flower2, ClipboardList } from 'lucide-react-native';
import { useStage } from '@/context/StageContext';
import { useUi } from '@/i18n/ui';
import { colors, fonts, shadow } from '@/theme';

import CycleHomeScreen from '@/screens/CycleHomeScreen';
import PregnancyHomeScreen from '@/screens/PregnancyHomeScreen';
import PrenatalScreen from '@/screens/PrenatalScreen';
import MenopauseHomeScreen from '@/screens/MenopauseHomeScreen';
import CuerpoMenteScreen from '@/screens/CuerpoMenteScreen';
import AprendizajeScreen from '@/screens/AprendizajeScreen';
import PerfilScreen from '@/screens/PerfilScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, typeof CalendarDays> = {
  CalendarioTab: CalendarDays,
  EmbarazoTab: Baby,
  MenopausiaTab: Flower2,
  CuerpoMenteTab: LayoutGrid,
  ControlesTab: ClipboardList,
  AprendizajeTab: BookOpen,
  PerfilTab: User,
};

/** Barra inferior del prototipo: 4 pestañas y un botón central de registro rápido. */
function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const u = useUi();

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = (options.title ?? route.name) as string;

        if (route.name === 'RegistrarTab') {
          return (
            <View key={route.key} style={styles.fabSlot}>
              <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.getParent()?.navigate('ComoHabitas')}
                accessibilityRole="button"
                accessibilityLabel={u('Registrar mi día')}
              >
                <Plus size={28} color={colors.white} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          );
        }

        const focused = state.index === index;
        const Icon = TAB_ICONS[route.name] ?? CalendarDays;
        const color = focused ? colors.carmin : colors.mutedSoft;

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
          >
            <Icon size={22} color={color} strokeWidth={focused ? 2.4 : 2} />
            <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const Placeholder = () => null;
const screenOptions = { headerShown: false } as const;

function CycleTabs() {
  const u = useUi();
  return (
    <Tab.Navigator tabBar={(props) => <AppTabBar {...props} />} screenOptions={screenOptions}>
      <Tab.Screen name="CalendarioTab" component={CycleHomeScreen} options={{ title: u('Calendario') }} />
      <Tab.Screen name="CuerpoMenteTab" component={CuerpoMenteScreen} options={{ title: u('Cuerpo Mente') }} />
      <Tab.Screen name="RegistrarTab" component={Placeholder} options={{ title: u('Registrar') }} />
      <Tab.Screen name="AprendizajeTab" component={AprendizajeScreen} options={{ title: u('Aprendizaje') }} />
      <Tab.Screen name="PerfilTab" component={PerfilScreen} options={{ title: u('Perfil') }} />
    </Tab.Navigator>
  );
}

function PregnancyTabs() {
  const u = useUi();
  return (
    <Tab.Navigator tabBar={(props) => <AppTabBar {...props} />} screenOptions={screenOptions}>
      <Tab.Screen name="EmbarazoTab" component={PregnancyHomeScreen} options={{ title: u('Embarazo') }} />
      <Tab.Screen name="ControlesTab" component={PrenatalScreen} options={{ title: u('Controles') }} />
      <Tab.Screen name="RegistrarTab" component={Placeholder} options={{ title: u('Registrar') }} />
      <Tab.Screen name="AprendizajeTab" component={AprendizajeScreen} options={{ title: u('Aprendizaje') }} />
      <Tab.Screen name="PerfilTab" component={PerfilScreen} options={{ title: u('Perfil') }} />
    </Tab.Navigator>
  );
}

function MenopauseTabs() {
  const u = useUi();
  return (
    <Tab.Navigator tabBar={(props) => <AppTabBar {...props} />} screenOptions={screenOptions}>
      <Tab.Screen name="MenopausiaTab" component={MenopauseHomeScreen} options={{ title: u('Inicio') }} />
      <Tab.Screen name="CuerpoMenteTab" component={CuerpoMenteScreen} options={{ title: u('Cuerpo Mente') }} />
      <Tab.Screen name="RegistrarTab" component={Placeholder} options={{ title: u('Registrar') }} />
      <Tab.Screen name="AprendizajeTab" component={AprendizajeScreen} options={{ title: u('Aprendizaje') }} />
      <Tab.Screen name="PerfilTab" component={PerfilScreen} options={{ title: u('Perfil') }} />
    </Tab.Navigator>
  );
}

/** Ruta "MainTabs" de la app: muestra las pestañas de la etapa activa. */
export default function MainTabs() {
  const { stage } = useStage();
  if (stage === 'pregnancy') return <PregnancyTabs key="pregnancy" />;
  if (stage === 'menopause') return <MenopauseTabs key="menopause" />;
  return <CycleTabs key="cycle" />;
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 8,
    ...shadow.card,
    shadowOffset: { width: 0, height: -4 },
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 3, paddingBottom: 2 },
  tabLabel: { fontFamily: fonts.semibold, fontSize: 9.5 },
  fabSlot: { flex: 1, alignItems: 'center' },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.carmin,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    borderWidth: 4,
    borderColor: colors.avena,
    ...shadow.glow,
  },
});
