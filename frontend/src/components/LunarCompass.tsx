import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { CycleCalculation } from '@/types';

interface LunarCompassProps {
  calculation: CycleCalculation | null;
  onOpenTranslator: () => void;
  isRetreatMode: boolean;
  onToggleRetreatMode: () => void;
}

export default function LunarCompass({ 
  calculation, 
  onOpenTranslator, 
  isRetreatMode,
  onToggleRetreatMode 
}: LunarCompassProps) {
  const { t } = useTranslation();
  const screenWidth = Dimensions.get('window').width;
  const ringSize = screenWidth * 0.65;

  // Flo-style phase text
  const getPhaseDescription = () => {
    if (!calculation) return "Cargando tu ciclo...";
    
    if (calculation.currentPhase === 'menstrual') {
      return "Periodo";
    } else if (calculation.currentPhase === 'follicular') {
      return "Baja prob. de embarazo";
    } else if (calculation.currentPhase === 'ovulation') {
      return "Alta prob. de embarazo";
    } else {
      return "Fase lútea";
    }
  };

  const getRingColor = () => {
    if (!calculation) return '#E2E8F0'; // Default gray
    if (calculation.currentPhase === 'menstrual') return '#8B2C3B'; // Carmín
    if (calculation.currentPhase === 'ovulation') return '#F6E05E'; // Yellow/Gold
    return '#2C3D30'; // Verde Bosque
  };

  return (
    <View style={styles.container}>
      {/* Retiro Toggle */}
      <View style={styles.header}>
        <Text style={[styles.retreatText, isRetreatMode && styles.textDark]}>
          Modo Retiro
        </Text>
        <TouchableOpacity 
          style={[styles.toggle, isRetreatMode && styles.toggleActive]}
          onPress={onToggleRetreatMode}
          activeOpacity={0.8}
        >
          <View style={[styles.toggleThumb, isRetreatMode && styles.thumbActive]} />
        </TouchableOpacity>
      </View>

      {/* The Flo Ring */}
      <View style={[styles.ringContainer, { width: ringSize, height: ringSize }]}>
        <View style={[
          styles.outerRing, 
          { 
            borderColor: getRingColor(), 
            opacity: isRetreatMode ? 0.5 : 1 
          }
        ]} />
        <View style={[
          styles.innerCircle, 
          isRetreatMode && styles.innerCircleDark
        ]}>
          <Text style={[styles.dayText, isRetreatMode && styles.textDark]}>
            Día {calculation?.currentDay || '--'}
          </Text>
          <Text style={[styles.phaseText, isRetreatMode && styles.textDark]}>
            {getPhaseDescription()}
          </Text>
        </View>
      </View>

      {/* Flo-style Insight Card Button */}
      <TouchableOpacity 
        style={[styles.insightCard, isRetreatMode && styles.insightCardDark]} 
        onPress={onOpenTranslator}
        activeOpacity={0.8}
      >
        <View style={styles.insightIconWrapper}>
          <Plus size={24} color="#FFFFFF" strokeWidth={3} />
        </View>
        <View style={styles.insightTextWrapper}>
          <Text style={[styles.insightTitle, isRetreatMode && styles.textDark]}>
            Registrar síntomas
          </Text>
          <Text style={styles.insightSub}>
            Descubre patrones y recibe consejos de la Farmacia Verde
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    alignSelf: 'flex-end',
  },
  retreatText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#4A5568',
    marginRight: 8,
  },
  textDark: {
    color: '#F4F1EA',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#8B2C3B',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbActive: {
    transform: [{ translateX: 22 }],
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
  },
  outerRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 12,
    borderTopColor: 'transparent', // Leaves a little gap like Flo's incomplete rings
    transform: [{ rotate: '45deg' }],
  },
  innerCircle: {
    width: '85%',
    height: '85%',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2C3D30',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
    padding: 20,
  },
  innerCircleDark: {
    backgroundColor: '#1A211C',
    shadowOpacity: 0,
  },
  dayText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 48,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  phaseText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    width: '100%',
    shadowColor: '#2C3D30',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
    marginBottom: 10,
  },
  insightCardDark: {
    backgroundColor: '#1A211C',
    shadowOpacity: 0,
  },
  insightIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B2C3B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  insightTextWrapper: {
    flex: 1,
  },
  insightTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  insightSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#718096',
    lineHeight: 18,
  }
});
