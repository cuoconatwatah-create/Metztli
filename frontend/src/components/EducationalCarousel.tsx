import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { BookOpen } from 'lucide-react-native';

const CARDS = [
  {
    id: '1',
    myth: 'Mito: La regla es sucia y te tenés que aguantar el dolor.',
    reality: 'Realidad: Tus ovarios son como una granada llena de semillas. La regla es la cunita de tu útero renovándose. Es tu signo vital; si duele mucho, tu cuerpo te pide cambiar hábitos. ¡Conocé tu poder! (Dra. Jiménez)'
  },
  {
    id: '2',
    myth: 'Mito: Estar en tus días significa que estás enferma.',
    reality: 'Realidad: Es un periodo fisiológico de retiro y renovación. Tu cuerpo usa mucha energía para este proceso, por eso necesitas descansar más, pero no es una enfermedad.'
  },
];

interface EducationalCarouselProps {
  isRetreatMode: boolean;
}

export default function EducationalCarousel({ isRetreatMode }: EducationalCarouselProps) {
  const { width } = Dimensions.get('window');
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BookOpen size={20} color={isRetreatMode ? '#F4F1EA' : '#2C3D30'} />
        <Text style={[styles.title, isRetreatMode && styles.textDark]}>
          El Desmitificador
        </Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        snapToInterval={width * 0.8 + 16}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
      >
        {CARDS.map(card => (
          <View 
            key={card.id} 
            style={[
              styles.card, 
              { width: width * 0.8 },
              isRetreatMode && styles.cardDark
            ]}
          >
            <View style={styles.mythBadge}>
              <Text style={styles.mythBadgeText}>Mito vs Realidad</Text>
            </View>
            <Text style={[styles.mythText, isRetreatMode && styles.textDark]}>{card.myth}</Text>
            <View style={styles.divider} />
            <Text style={[styles.realityText, isRetreatMode && styles.textDark]}>{card.reality}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    marginBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1A1A1A',
    marginLeft: 8,
  },
  textDark: {
    color: '#F4F1EA',
  },
  scrollContent: {
    paddingRight: 32, // Padding at the end of the scroll
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginRight: 16,
    shadowColor: '#2C3D30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: '#1A211C', // Dark mode card
    shadowOpacity: 0,
  },
  mythBadge: {
    backgroundColor: '#8B2C3B',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  mythBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  mythText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: '#4A5568',
    marginBottom: 16,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(44, 61, 48, 0.1)',
    marginBottom: 16,
  },
  realityText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: '#2C3D30',
    lineHeight: 24,
  }
});
