import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HeartHandshake, Moon, Droplet, Coffee, BellRing, Settings } from 'lucide-react-native';

type PartnerState = 'normal' | 'menstruation' | 'retreat';

export default function PartnerMainScreen() {
  const navigation = useNavigation<any>();
  // Este estado sería sincronizado por la base de datos en una app real
  const [partnerState, setPartnerState] = useState<PartnerState>('normal');

  const renderStateBanner = () => {
    switch (partnerState) {
      case 'retreat':
        return (
          <View style={[styles.banner, styles.bannerRetreat]}>
            <Moon size={32} color="#F4F1EA" />
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>Modo Retiro Activo</Text>
              <Text style={styles.bannerSubtitle}>Ana necesita descanso extra y un ambiente tranquilo hoy.</Text>
            </View>
          </View>
        );
      case 'menstruation':
        return (
          <View style={[styles.banner, styles.bannerMenstruation]}>
            <Droplet size={32} color="#F4F1EA" />
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>Día 2 de su ciclo</Text>
              <Text style={styles.bannerSubtitle}>Ana está en su fase menstrual. Puede tener cólicos o baja energía.</Text>
            </View>
          </View>
        );
      case 'normal':
      default:
        return (
          <View style={[styles.banner, styles.bannerNormal]}>
            <HeartHandshake size={32} color="#2C3D30" />
            <View style={styles.bannerTextContainer}>
              <Text style={[styles.bannerTitle, { color: '#2C3D30' }]}>Todo se ve bien</Text>
              <Text style={[styles.bannerSubtitle, { color: '#4A5568' }]}>Ana está en una fase de alta energía de su ciclo.</Text>
            </View>
          </View>
        );
    }
  };

  const renderTips = () => {
    switch (partnerState) {
      case 'retreat':
        return (
          <>
            <View style={styles.tipCard}>
              <Coffee size={24} color="#8B2635" />
              <Text style={styles.tipText}>Prepara una infusión tibia de manzanilla o canela para ayudarle a relajar el útero.</Text>
            </View>
            <View style={styles.tipCard}>
              <BellRing size={24} color="#8B2635" />
              <Text style={styles.tipText}>Asume las tareas de la casa. Evita hacer ruidos fuertes y pregúntale si necesita una cobija o bolsa de agua caliente.</Text>
            </View>
          </>
        );
      case 'menstruation':
        return (
          <>
            <View style={styles.tipCard}>
              <HeartHandshake size={24} color="#2C3D30" />
              <Text style={styles.tipText}>Un masaje suave en la espalda baja puede aliviar su dolor significativamente.</Text>
            </View>
            <View style={styles.tipCard}>
              <Coffee size={24} color="#2C3D30" />
              <Text style={styles.tipText}>Asegúrate de que tenga agua a la mano. La hidratación reduce la hinchazón.</Text>
            </View>
          </>
        );
      case 'normal':
      default:
        return (
          <>
            <View style={styles.tipCard}>
              <HeartHandshake size={24} color="#2C3D30" />
              <Text style={styles.tipText}>Es un gran día para salir a caminar o hacer actividades juntos.</Text>
            </View>
          </>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Tribu</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Welcome')}>
          <Settings size={24} color="#8B2635" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {renderStateBanner()}

        <Text style={styles.sectionTitle}>Sugerencias de Apoyo</Text>
        {renderTips()}

        {/* Herramienta de Desarrollo/Simulación Oculta en UI */}
        <View style={styles.devTools}>
          <Text style={styles.devToolsTitle}>Simulador de Estados (Solo Demo)</Text>
          <View style={styles.devButtons}>
            <TouchableOpacity style={styles.devBtn} onPress={() => setPartnerState('normal')}>
              <Text style={styles.devBtnText}>Normal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.devBtn} onPress={() => setPartnerState('menstruation')}>
              <Text style={styles.devBtnText}>Menstruación</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.devBtn, { backgroundColor: '#111512' }]} onPress={() => setPartnerState('retreat')}>
              <Text style={[styles.devBtnText, { color: 'white' }]}>Modo Retiro</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F4F1EA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E0D8',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter-SemiBold',
    color: '#8B2635',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerRetreat: {
    backgroundColor: '#111512',
  },
  bannerMenstruation: {
    backgroundColor: '#8B2635',
  },
  bannerNormal: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  bannerTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#F4F1EA',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E2E8F0',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8B2635',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tipText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#4A5568',
    lineHeight: 22,
  },
  devTools: {
    marginTop: 40,
    padding: 16,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#A0AEC0',
  },
  devToolsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A5568',
    marginBottom: 12,
    textAlign: 'center',
  },
  devButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  devBtn: {
    flex: 1,
    backgroundColor: '#CBD5E0',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  devBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D3748',
  }
});
