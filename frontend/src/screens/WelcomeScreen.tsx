import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();
  const scale = useSharedValue(1);

  useEffect(() => {
    // Anillo palpitante (animate-ping sutil)
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <View style={styles.logoContainer}>
          <Animated.View style={[styles.pulseRing, animatedStyle]}>
            <View style={styles.innerCircle}>
              {/* Usando texto en lugar de fuente externa por ahora, simulando 'Syncopate' */}
              <Text style={styles.logoText}>M</Text>
            </View>
          </Animated.View>
        </View>

        <Text style={styles.title}>Metztli</Text>
        <Text style={styles.subtitle}>TU SANTUARIO DE SALUD INTEGRAL</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.primaryBtnText}>Crear mi Santuario</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.glassBtn} 
            onPress={() => navigation.navigate('PartnerDashboard')}
          >
            <Text style={styles.glassBtnText}>Soy acompañante</Text>
          </TouchableOpacity>
        </View>
        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA', // Avena Cálida
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginBottom: 20,
  },
  pulseRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(139, 38, 53, 0.1)', // Carmín transparente
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#8B2635', // Carmín
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B2635',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 10,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontFamily: 'Inter-SemiBold', // Fallback for Syncopate
  },
  title: {
    fontSize: 36,
    color: '#1A1A1A', // Carbón Oscuro
    fontFamily: 'Inter-SemiBold', // Fallback for Clash Display
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#2C3D30', // Verde Bosque
    fontFamily: 'Inter-Medium',
    letterSpacing: 2,
    marginBottom: 60,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  primaryBtn: {
    backgroundColor: '#8B2635', // Carmín Profundo
    paddingVertical: 18,
    borderRadius: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#8B2635',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  glassBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // Glassmorphism
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    paddingVertical: 18,
    borderRadius: 32,
    width: '100%',
    alignItems: 'center',
  },
  glassBtnText: {
    color: '#1A1A1A',
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  }
});
