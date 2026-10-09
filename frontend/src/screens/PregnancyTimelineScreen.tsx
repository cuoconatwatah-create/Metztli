// ─────────────────────────────────────────────────────────
// Metztli — Desarrollo semana a semana
// Una página por semana: el bebé, consejos para la persona gestante y el control prenatal.
// Se pasa de semana deslizando o con las flechas (en la web no se puede deslizar).
// ─────────────────────────────────────────────────────────

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, ScrollView, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Baby, Stethoscope, Heart, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { PREGNANCY_WEEKS } from '@/db/seedData';
import { usePregnancyCalculator } from '@/hooks/usePregnancyCalculator';
import { Card, Chip, CurvedHeader } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { useUi } from '@/i18n/ui';

type WeekItem = (typeof PREGNANCY_WEEKS)[number];

export default function PregnancyTimelineScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const u = useUi();
  const { width } = useWindowDimensions();
  const { calculation } = usePregnancyCalculator();

  const total = PREGNANCY_WEEKS.length;
  const currentWeek = Math.min(Math.max(calculation?.gestationalWeeks || 1, 1), total);
  const listRef = useRef<FlatList<WeekItem>>(null);
  const [activeWeek, setActiveWeek] = useState(currentWeek);

  const goTo = useCallback((week: number, animated = true) => {
    const w = Math.min(Math.max(week, 1), total);
    setActiveWeek(w);
    listRef.current?.scrollToIndex({ index: w - 1, animated });
  }, [total]);

  // Al abrir (y si cambia la semana calculada) se muestra la semana actual
  useEffect(() => {
    const id = setTimeout(() => goTo(currentWeek, false), 100);
    return () => clearTimeout(id);
  }, [currentWeek, goTo]);

  const onScrollEnd = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
    setActiveWeek(Math.min(Math.max(index + 1, 1), total));
  };

  const renderItem = ({ item }: { item: WeekItem }) => (
    <ScrollView style={{ width }} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <View style={styles.weekHeader}>
        <Text style={styles.weekTitle}>{u('Semana {{n}}', { n: item.week })}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{u('Trimestre {{n}}', { n: item.trimester })}</Text>
        </View>
      </View>

      <Card style={{ gap: 6 }}>
        <View style={styles.cardHeader}>
          <Baby size={22} color={colors.carmin} />
          <Text style={styles.cardTitle}>{u('Tu bebé')}</Text>
        </View>
        <Text style={styles.highlight}>{t(item.size_comparison_key)}</Text>
        <Text style={styles.sub}>{u('Mide aprox. {{cm}} cm', { cm: item.baby_size_cm })}</Text>
        <View style={styles.rule} />
        <Text style={styles.body}>{t(item.development_key)}</Text>
      </Card>

      <Card style={{ gap: 8 }}>
        <View style={styles.cardHeader}>
          <Heart size={22} color={colors.bosque} />
          <Text style={[styles.cardTitle, { color: colors.bosque }]}>{u('Consejos para ti')}</Text>
        </View>
        <Text style={styles.body}>{t(item.maternal_tips_key)}</Text>
      </Card>

      <Card style={{ gap: 8 }}>
        <View style={styles.cardHeader}>
          <Stethoscope size={22} color={colors.bosque} />
          <Text style={[styles.cardTitle, { color: colors.bosque }]}>{u('Control prenatal')}</Text>
        </View>
        <Text style={styles.body}>{t(item.recommended_exams_key)}</Text>
      </Card>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <CurvedHeader title={u('Semana a semana')} onBack={() => navigation.goBack()} />

      <FlatList
        key={`w${Math.round(width)}`}
        ref={listRef}
        data={PREGNANCY_WEEKS}
        keyExtractor={(item) => String(item.week)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={renderItem}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        initialScrollIndex={currentWeek - 1}
        style={{ flex: 1 }}
      />

      <View style={styles.nav}>
        <TouchableOpacity
          style={[styles.arrow, activeWeek <= 1 && styles.arrowOff]}
          onPress={() => goTo(activeWeek - 1)}
          disabled={activeWeek <= 1}
          accessibilityRole="button"
          accessibilityLabel={u('Semana anterior')}
        >
          <ChevronLeft size={22} color={colors.carmin} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text style={styles.navText}>{u('Semana {{n}}', { n: activeWeek })} · {activeWeek}/{total}</Text>
          {activeWeek !== currentWeek && (
            <Chip label={u('Ir a mi semana')} active onPress={() => goTo(currentWeek)} />
          )}
        </View>

        <TouchableOpacity
          style={[styles.arrow, activeWeek >= total && styles.arrowOff]}
          onPress={() => goTo(activeWeek + 1)}
          disabled={activeWeek >= total}
          accessibilityRole="button"
          accessibilityLabel={u('Semana siguiente')}
        >
          <ChevronRight size={22} color={colors.carmin} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.avena },
  page: { padding: 16, gap: 14, paddingBottom: 24 },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weekTitle: { fontFamily: fonts.display, fontSize: 28, color: colors.carbon },
  badge: { backgroundColor: 'rgba(44,61,48,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  badgeText: { fontFamily: fonts.bold, fontSize: 12, color: colors.bosque },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.carmin },
  highlight: { fontFamily: fonts.semibold, fontSize: 16, color: colors.carbon },
  sub: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  rule: { height: 1, backgroundColor: colors.line, marginVertical: 6 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.muted },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.avena },
  arrow: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  arrowOff: { opacity: 0.35 },
  navText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.carbon },
});
