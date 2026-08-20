// ─────────────────────────────────────────────────────────
// Metztli 2.0 — App Entry Point
// ─────────────────────────────────────────────────────────

import './global.css'; // NativeWind CSS

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Baby, Users, PhoneCall } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// i18n initialization
import '@/i18n';

// DB Initialization
import { initializeDatabase } from '@/db/database';
import { seedDatabase } from '@/db/seedData';
import { supabase } from '@/lib/supabase';

// Screens
import LanguageSelectionScreen from '@/screens/LanguageSelectionScreen';
import WelcomeScreen from '@/screens/WelcomeScreen';
import PartnerDashboardScreen from '@/screens/PartnerDashboardScreen';
import StageSelectionScreen from '@/screens/StageSelectionScreen';
import TribuCodeScreen from '@/screens/TribuCodeScreen';
import AuthScreen from '@/screens/AuthScreen';
import HomeScreen from '@/screens/HomeScreen';
import PregnancyScreen from '@/screens/PregnancyScreen';
import ForumScreen from '@/screens/ForumScreen';
import DirectoryScreen from '@/screens/DirectoryScreen';
import { BrujulaLunarScreen } from '@/screens/BrujulaLunarScreen';
import DesmitificadorScreen from '@/screens/DesmitificadorScreen';
import PartnerMainScreen from '@/screens/PartnerMainScreen';
import PregnancyTimelineScreen from '@/screens/PregnancyTimelineScreen';
import KickCounterScreen from '@/screens/KickCounterScreen';
import ObstetricAlarmScreen from '@/screens/ObstetricAlarmScreen';

// Global UI Components
import LanguageSwitcher from '@/components/LanguageSwitcher';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#F4F1EA',
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: '#1A1A1A',
        },
        headerRight: () => (
          <View style={{ marginRight: 16 }}>
            <LanguageSwitcher />
          </View>
        ),
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopColor: 'rgba(44, 61, 48, 0.1)',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#8B2635',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ 
          title: t('nav.home'),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={2} />
        }} 
      />
      <Tab.Screen 
        name="PregnancyTab" 
        component={PregnancyScreen} 
        options={{ 
          title: t('nav.pregnancy'),
          tabBarIcon: ({ color, size }) => <Baby color={color} size={size} strokeWidth={2} />
        }} 
      />
      <Tab.Screen 
        name="ForumTab" 
        component={ForumScreen} 
        options={{ 
          title: t('nav.forum'),
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} strokeWidth={2} />
        }} 
      />
      <Tab.Screen 
        name="DirectoryTab" 
        component={DirectoryScreen} 
        options={{ 
          title: t('nav.directory'),
          tabBarIcon: ({ color, size }) => <PhoneCall color={color} size={size} strokeWidth={2} />
        }} 
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<'LanguageSelection' | 'Welcome' | 'Auth' | 'MainTabs'>('LanguageSelection');

  useEffect(() => {
    async function prepare() {
      try {
        if (Platform.OS !== 'web') {
          // 1. Initialize SQLite Database
          await initializeDatabase();
          
          // 2. Pre-seed offline data
          await seedDatabase();

          // 3. Check auth state
          const { data: { session } } = await supabase.auth.getSession();
          
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
        supabase.auth.onAuthStateChange((_event, session) => {
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

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B2635" />
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
        <Stack.Screen name="BrujulaLunar" component={BrujulaLunarScreen} options={{ headerShown: true, title: 'Brújula Lunar' }} />
        <Stack.Screen name="Desmitificador" component={DesmitificadorScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PartnerMain" component={PartnerMainScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PregnancyTimeline" component={PregnancyTimelineScreen} options={{ headerShown: false }} />
        <Stack.Screen name="KickCounter" component={KickCounterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ObstetricAlarm" component={ObstetricAlarmScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F1EA',
  }
});
