// ─────────────────────────────────────────────────────────
// Metztli — App Entry Point
// ─────────────────────────────────────────────────────────

import './global.css'; // NativeWind CSS

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, LayoutGrid, BookOpen, User, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useUi } from '@/i18n/ui';
import { loadStoredLanguage } from '@/i18n/storage';
import i18n from '@/i18n';
import * as SecureStore from 'expo-secure-store';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_600SemiBold_Italic,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

// i18n initialization
import '@/i18n';

// DB Initialization
import { initializeDatabase } from '@/db/database';
import { seedDatabase } from '@/db/seedData';
import { supabase } from '@/lib/supabase';
import { pushHealthBackup } from '@/db/cloud';
import { isCloudBackupEnabled } from '@/lib/prefs';
import { colors, fonts, shadow } from '@/theme';

// Screens
import LanguageSelectionScreen from '@/screens/LanguageSelectionScreen';
import WelcomeScreen from '@/screens/WelcomeScreen';
import PartnerDashboardScreen from '@/screens/PartnerDashboardScreen';
import StageSelectionScreen from '@/screens/StageSelectionScreen';
import TribuCodeScreen from '@/screens/TribuCodeScreen';
import AuthScreen from '@/screens/AuthScreen';
import HomeScreen from '@/screens/HomeScreen';
import CuerpoMenteScreen from '@/screens/CuerpoMenteScreen';
import AprendizajeScreen from '@/screens/AprendizajeScreen';
import PerfilScreen from '@/screens/PerfilScreen';
import ArticleScreen from '@/screens/ArticleScreen';
import MiCicloScreen from '@/screens/MiCicloScreen';
import ComoHabitasScreen from '@/screens/ComoHabitasScreen';
import PregnancyScreen from '@/screens/PregnancyScreen';
import ForumScreen from '@/screens/ForumScreen';
import DirectoryScreen from '@/screens/DirectoryScreen';
import { BrujulaLunarScreen } from '@/screens/BrujulaLunarScreen';
import DesmitificadorScreen from '@/screens/DesmitificadorScreen';
import PartnerMainScreen from '@/screens/PartnerMainScreen';
import PregnancyTimelineScreen from '@/screens/PregnancyTimelineScreen';
import KickCounterScreen from '@/screens/KickCounterScreen';
import ObstetricAlarmScreen from '@/screens/ObstetricAlarmScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, typeof CalendarDays> = {
  CalendarioTab: CalendarDays,
  CuerpoMenteTab: LayoutGrid,
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
        const Icon = TAB_ICONS[route.name];
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

function MainTabs() {
  const u = useUi();

  return (
    <Tab.Navigator tabBar={(props) => <AppTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="CalendarioTab" component={HomeScreen} options={{ title: u('Calendario') }} />
      <Tab.Screen name="CuerpoMenteTab" component={CuerpoMenteScreen} options={{ title: u('Cuerpo Mente') }} />
      <Tab.Screen name="RegistrarTab" component={Placeholder} options={{ title: u('Registrar') }} />
      <Tab.Screen name="AprendizajeTab" component={AprendizajeScreen} options={{ title: u('Aprendizaje') }} />
      <Tab.Screen name="PerfilTab" component={PerfilScreen} options={{ title: u('Perfil') }} />
    </Tab.Navigator>
  );
}

const headerOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.avena },
  headerShadowVisible: false,
  headerTintColor: colors.carmin,
  headerTitleStyle: { fontFamily: fonts.bold, color: colors.carbon },
} as const;

export default function App() {
  const { t } = useTranslation();
  const u = useUi();
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-SemiBoldItalic': Inter_600SemiBold_Italic,
    'Inter-Bold': Inter_700Bold,
    'Inter-ExtraBold': Inter_800ExtraBold,
  });
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<'LanguageSelection' | 'Welcome' | 'Auth' | 'MainTabs'>('LanguageSelection');

  useEffect(() => {
    async function prepare() {
      try {
        // 0. Restaurar el idioma que la usuaria eligió la última vez
        const storedLang = await loadStoredLanguage();
        if (storedLang && storedLang !== i18n.language) await i18n.changeLanguage(storedLang);

        if (Platform.OS !== 'web') {
          // 1. Initialize SQLite Database
          await initializeDatabase();

          // 2. Pre-seed offline data
          await seedDatabase();

          // 3. Check auth state
          const { data: { session } } = await supabase.auth.getSession();

          // Respaldo opcional de datos de salud: solo con sesión y si la usuaria lo activó
          if (session && (await isCloudBackupEnabled())) {
            pushHealthBackup().catch((e) => console.warn('Respaldo en la nube no completado', e));
          }

          const hasLaunched = await SecureStore.getItemAsync('has_launched');
          if (!hasLaunched) {
            setInitialRoute('LanguageSelection');
            await SecureStore.setItemAsync('has_launched', 'true');
          } else if (session) {
            setInitialRoute('MainTabs');
          } else {
            setInitialRoute('Welcome');
          }
        } else {
          // Fallback for Web
          const { data: { session } } = await supabase.auth.getSession();
          const hasLaunched = localStorage.getItem('has_launched');

          if (!hasLaunched) {
            setInitialRoute('LanguageSelection');
            localStorage.setItem('has_launched', 'true');
          } else if (session) {
            setInitialRoute('MainTabs');
          } else {
            setInitialRoute('Welcome');
          }
        }

        // Setup Auth Listener
        supabase.auth.onAuthStateChange((_event, _session) => {
          // We don't automatically redirect mid-app to avoid jarring UX during offline mode
          // But this listener is active if needed.
        });
      } catch (e) {
        console.warn('Initialization error:', e);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  if (!isReady || !(fontsLoaded || fontError)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.carmin} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="PartnerDashboard" component={PartnerDashboardScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="StageSelection" component={StageSelectionScreen} />
        <Stack.Screen name="TribuCode" component={TribuCodeScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="MiCiclo" component={MiCicloScreen} />
        <Stack.Screen name="ComoHabitas" component={ComoHabitasScreen} />
        <Stack.Screen name="Articulo" component={ArticleScreen} />
        <Stack.Screen name="Foro" component={ForumScreen} options={{ ...headerOptions, title: t('nav.forum') }} />
        <Stack.Screen name="Directorio" component={DirectoryScreen} options={{ ...headerOptions, title: t('nav.directory') }} />
        <Stack.Screen name="Embarazo" component={PregnancyScreen} options={{ ...headerOptions, title: t('nav.pregnancy') }} />
        <Stack.Screen name="BrujulaLunar" component={BrujulaLunarScreen} options={{ ...headerOptions, title: u('Calendario') }} />
        <Stack.Screen name="Desmitificador" component={DesmitificadorScreen} />
        <Stack.Screen name="PartnerMain" component={PartnerMainScreen} />
        <Stack.Screen name="PregnancyTimeline" component={PregnancyTimelineScreen} />
        <Stack.Screen name="KickCounter" component={KickCounterScreen} />
        <Stack.Screen name="ObstetricAlarm" component={ObstetricAlarmScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.avena,
  },
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
