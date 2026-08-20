import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { PREGNANCY_WEEKS } from '@/db/seedData';
import { Baby, Stethoscope, Calendar } from 'lucide-react-native';
import { usePregnancyCalculator } from '@/hooks/usePregnancyCalculator';

const { width } = Dimensions.get('window');

export default function PregnancyTimelineScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { calculation } = usePregnancyCalculator();
  
  const currentWeek = calculation?.gestationalWeeks || 1;
  const flatListRef = useRef<FlatList>(null);
  
  // State to track the currently visible week
  const [activeWeek, setActiveWeek] = useState(currentWeek);

  // Scroll to current week on mount
  useEffect(() => {
    if (flatListRef.current && currentWeek > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: currentWeek - 1, animated: false });
      }, 100);
    }
  }, [currentWeek]);

  const handleScrollEnd = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveWeek(roundIndex + 1);
  };

  const renderItem = ({ item }: { item: typeof PREGNANCY_WEEKS[0] }) => {
    return (
      <View style={{ width, paddingHorizontal: 20 }}>
        
        {/* Header de la semana */}
        <View style={styles.weekHeader}>
          <Text style={styles.weekNumberTitle}>Semana {item.week}</Text>
          <View style={styles.trimesterBadge}>
            <Text style={styles.trimesterText}>Trimestre {item.trimester}</Text>
          </View>
        </View>

        {/* Tarjeta principal (Desarrollo) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Baby size={24} color="#8B2635" />
            <Text style={styles.cardTitle}>Tu Bebé</Text>
          </View>
          <Text style={styles.highlightText}>{t(item.size_comparison_key)}</Text>
          <Text style={styles.subText}>Mide aprox. {item.baby_size_cm} cm</Text>
          
          <View style={styles.divider} />
          <Text style={styles.bodyText}>{t(item.development_key)}</Text>
        </View>

        {/* Tarjeta Tips */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Calendar size={24} color="#2C3D30" />
            <Text style={[styles.cardTitle, { color: '#2C3D30' }]}>Tips Maternos</Text>
          </View>
          <Text style={styles.bodyText}>{t(item.maternal_tips_key)}</Text>
        </View>

        {/* Tarjeta Exámenes */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Stethoscope size={24} color="#2C3D30" />
            <Text style={[styles.cardTitle, { color: '#2C3D30' }]}>Control Prenatal</Text>
          </View>
          <Text style={styles.bodyText}>{t(item.recommended_exams_key)}</Text>
        </View>

      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#8B2635" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Semana a Semana</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={PREGNANCY_WEEKS}
        keyExtractor={(item) => item.week.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={renderItem}
        getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
        initialScrollIndex={currentWeek - 1}
      />

      <View style={styles.paginationContainer}>
        <Text style={styles.paginationText}>Desliza para explorar otras semanas</Text>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B2635',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  weekNumberTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  trimesterBadge: {
    backgroundColor: 'rgba(44, 61, 48, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  trimesterText: {
    color: '#2C3D30',
    fontWeight: '700',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B2635',
  },
  highlightText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F4F1EA',
    marginVertical: 12,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4A4A4A',
  },
  paginationContainer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E0D8',
  },
  paginationText: {
    color: '#A0AEC0',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  }
});
