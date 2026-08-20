import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Myth } from '@/types';
import { getLocalMyths, syncMythsFromSupabase, fallbackMyths } from '@/db/database';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

type FilterCategory = 'todos' | 'ciclo' | 'embarazo' | 'menopausia';

export default function DesmitificadorScreen() {
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mythsData, setMythsData] = useState<Myth[]>(fallbackMyths);

  useEffect(() => {
    const loadAndSyncMyths = async () => {
      // 1. Cargar mitos locales rápidamente
      const localMyths = await getLocalMyths();
      if (localMyths.length > 0) {
        setMythsData(localMyths);
      }

      // 2. Sincronizar con Supabase silenciosamente en segundo plano
      await syncMythsFromSupabase();

      // 3. Volver a cargar si hubo cambios
      const updatedMyths = await getLocalMyths();
      setMythsData(updatedMyths);
    };

    loadAndSyncMyths();
  }, []);

  const filteredMyths = mythsData.filter(m => activeFilter === 'todos' || m.category === activeFilter);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const renderFilterButton = (label: string, value: FilterCategory) => {
    const isActive = activeFilter === value;
    return (
      <TouchableOpacity 
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => {
          setActiveFilter(value);
          setExpandedId(null);
        }}
      >
        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#8B2635" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Desmitificador</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {renderFilterButton('Todos', 'todos')}
          {renderFilterButton('Ciclo', 'ciclo')}
          {renderFilterButton('Embarazo', 'embarazo')}
          {renderFilterButton('Menopausia', 'menopausia')}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Conoce la realidad detrás de las creencias populares sobre la salud femenina. Toca un mito para descubrir la verdad.
        </Text>

        {filteredMyths.map((myth) => {
          const isExpanded = expandedId === myth.id;
          return (
            <TouchableOpacity 
              key={myth.id} 
              style={[styles.card, isExpanded && styles.cardExpanded]}
              activeOpacity={0.8}
              onPress={() => toggleExpand(myth.id)}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="help-circle" size={24} color="#8B2635" />
                <Text style={styles.mythText}>{myth.myth}</Text>
                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#666" />
              </View>
              
              {isExpanded && (
                <View style={styles.realityContainer}>
                  <View style={styles.divider} />
                  <View style={styles.realityHeader}>
                    <Ionicons name="checkmark-circle" size={20} color="#2C3D30" />
                    <Text style={styles.realityTitle}>Realidad</Text>
                  </View>
                  <Text style={styles.realityText}>{myth.reality}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
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
  filtersContainer: {
    paddingVertical: 10,
  },
  filtersScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  filterButtonActive: {
    backgroundColor: '#8B2635',
    borderColor: '#8B2635',
  },
  filterText: {
    fontSize: 14,
    color: '#4A4A4A',
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
    gap: 16,
  },
  description: {
    fontSize: 16,
    color: '#4A4A4A',
    marginBottom: 8,
    lineHeight: 24,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardExpanded: {
    borderColor: '#8B2635',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mythText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111512',
    lineHeight: 22,
  },
  realityContainer: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F4F1EA',
    marginBottom: 12,
  },
  realityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  realityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3D30',
    textTransform: 'uppercase',
  },
  realityText: {
    fontSize: 15,
    color: '#2C3D30',
    lineHeight: 22,
  }
});
