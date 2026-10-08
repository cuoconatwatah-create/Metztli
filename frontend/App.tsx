// ─────────────────────────────────────────────────────────
// Metztli — App Entry Point
// ─────────────────────────────────────────────────────────

import './global.css'; // NativeWind CSS

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

// Avisos visibles también en la web
import '@/lib/webAlert';

// i18n initialization
import '@/i18n';

// DB Initialization
import { initializeDatabase } from '@/db/database';
import { seedDatabase } from '@/db/seedData';
import { supabase } from '@/lib/supabase';
import { pushHealthBackup } from '@/db/cloud';
import { isCloudBackupEnabled } from '@/lib/prefs';
import { colors, fonts } from '@/theme';
import { StageProvider, isStage } from '@/context/StageContext';
import { RoleProvider } from '@/context/RoleContext';
import { getUserProfile } from '@/db/database';
import { getStagePref } from '@/lib/prefs';
import type { LifeStageMode } from '@/types';

// Screens
import LanguageSelectionScreen from '@/screens/LanguageSelectionScreen';
import WelcomeScreen from '@/screens/WelcomeScreen';
import PartnerDashboardScreen from '@/screens/PartnerDashboardScreen';
import StageSelectionScreen from '@/screens/StageSelectionScreen';
import TribuCodeScreen from '@/screens/TribuCodeScreen';
import AuthScreen from '@/screens/AuthScreen';
import MainTabs from '@/navigation/StageTabs';
import ArticleScreen from '@/screens/ArticleScreen';
import MiCicloScreen from '@/screens/MiCicloScreen';
import ComoHabitasScreen from '@/screens/ComoHabitasScreen';
import PregnancyScreen from '@/screens/PregnancyScreen';
import ForumScreen from '@/screens/ForumScreen';
import DirectoryScreen from '@/screens/DirectoryScreen';
import { BrujulaLunarScreen } from '@/screens/BrujulaLunarScreen';
import DesmitificadorScreen from '@/screens/DesmitificadorScreen';
import PartnerMainScreen from '@/screens/PartnerMainScreen';
import AdminPanelScreen from '@/screens/AdminPanelScreen';
import AuditPanelScreen from '@/screens/AuditPanelScreen';
import PrivacyScreen from '@/screens/PrivacyScreen';
import PregnancyTimelineScreen from '@/screens/PregnancyTimelineScreen';
import KickCounterScreen from '@/screens/KickCounterScreen';
import ObstetricAlarmScreen from '@/screens/ObstetricAlarmScreen';

const Stack = createNativeStackNavigator();
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
  const [initialStage, setInitialStage] = useState<LifeStageMode>('cycle');
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

          // 2b. Etapa activa (menstruación, embarazo o menopausia)
          const profile = await getUserProfile();
          if (profile && isStage(profile.current_mode)) setInitialStage(profile.current_mode);

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
          const savedStage = await getStagePref();
          if (isStage(savedStage)) setInitialStage(savedStage);
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
    <StageProvider initial={initialStage}>
    <RoleProvider>
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
        <Stack.Screen name="AdminPanel" component={AdminPanelScreen} />
        <Stack.Screen name="AuditPanel" component={AuditPanelScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="PregnancyTimeline" component={PregnancyTimelineScreen} />
        <Stack.Screen name="KickCounter" component={KickCounterScreen} />
        <Stack.Screen name="ObstetricAlarm" component={ObstetricAlarmScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </RoleProvider>
    </StageProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.avena,
  },
});
