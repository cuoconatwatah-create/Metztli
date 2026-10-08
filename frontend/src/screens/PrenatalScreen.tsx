// ─────────────────────────────────────────────────────────
// Metztli — Etapa Embarazo: controles prenatales
// ─────────────────────────────────────────────────────────

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Plus, Check, Trash2, MapPin } from 'lucide-react-native';
import {
  addPrenatalCheckup,
  getActivePregnancy,
  getPrenatalCheckups,
  removePrenatalCheckup,
  updatePrenatalCheckup,
} from '@/db/database';
import { localISODate } from '@/lib/dailyLog';
import type { CheckupKind, Pregnancy, PrenatalCheckup } from '@/types';
import StageSwitcher from '@/components/StageSwitcher';
import DateStepper from '@/components/DateStepper';
import { Button, Card, Chip, CurvedHeader, SectionTitle } from '@/components/ui';
import { formatDate } from '@/screens/PregnancyHomeScreen';
import { colors, fonts, radius } from '@/theme';
import { useUi } from '@/i18n/ui';

const KINDS: { id: CheckupKind; label: string }[] = [
  { id: 'control', label: 'Control prenatal' },
  { id: 'ecografia', label: 'Ecografía' },
  { id: 'laboratorio', label: 'Laboratorio' },
  { id: 'otro', label: 'Otro' },
];

/** Números con coma o punto → número, o null si está vacío o es inválido. */
function num(text: string): number | null {
  const n = Number(text.replace(',', '.').trim());
  return text.trim() !== '' && Number.isFinite(n) ? n : null;
}

export default function PrenatalScreen() {
  const u = useUi();
  const navigation = useNavigation<any>();
  const [pregnancy, setPregnancy] = useState<Pregnancy | null>(null);
  const [checkups, setCheckups] = useState<PrenatalCheckup[]>([]);
  const [adding, setAdding] = useState(false);

  const [date, setDate] = useState(localISODate());
  const [kind, setKind] = useState<CheckupKind>('control');
  const [place, setPlace] = useState('');
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [weight, setWeight] = useState('');
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');

  const load = useCallback(async () => {
    const p = await getActivePregnancy();
    setPregnancy(p);
    setCheckups(p ? await getPrenatalCheckups() : []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const year = new Date().getFullYear();
  const today = localISODate();
  const upcoming = checkups.filter((c) => !c.done);
  const done = checkups.filter((c) => c.done).reverse();

  const reset = () => {
    setDate(localISODate());
    setKind('control');
    setPlace('');
    setAlreadyDone(false);
    setWeight('');
    setSys('');
    setDia('');
  };

  const warnIfHighPressure = (s: number | null, d: number | null) => {
    if ((s !== null && s >= 140) || (d !== null && d >= 90)) {
      Alert.alert(
        u('Presión alta'),
        u('Una presión de 140/90 o más durante el embarazo necesita revisión médica pronto. Si además tienes dolor de cabeza fuerte, visión borrosa o hinchazón repentina, ve hoy mismo a tu centro de salud.')
      );
    }
  };

  const save = async () => {
    const w = num(weight);
    const s = num(sys);
    const d = num(dia);
    if ((weight && w === null) || (sys && s === null) || (dia && d === null)) {
      Alert.alert(u('Revisa los datos'), u('El peso y la presión deben ser números.'));
      return;
    }
    try {
      await addPrenatalCheckup({
        checkup_date: date,
        kind,
        place: place.trim() || null,
        done: alreadyDone,
        weight_kg: alreadyDone ? w : null,
        bp_systolic: alreadyDone && s !== null ? Math.round(s) : null,
        bp_diastolic: alreadyDone && d !== null ? Math.round(d) : null,
      });
      if (alreadyDone) warnIfHighPressure(s, d);
      setAdding(false);
      reset();
      await load();
    } catch (e: any) {
      // Los CHECK de la base rechazan pesos o presiones imposibles
      Alert.alert(u('No se pudo guardar'), u('Revisa que el peso y la presión sean valores reales.'));
    }
  };

  const markDone = async (c: PrenatalCheckup) => {
    await updatePrenatalCheckup(c.id, { done: true });
    await load();
  };

  const remove = (c: PrenatalCheckup) => {
    Alert.alert(u('¿Borrar este control?'), formatDate(c.checkup_date, u), [
      { text: u('Cancelar'), style: 'cancel' },
      {
        text: u('Borrar'),
        style: 'destructive',
        onPress: async () => {
          await removePrenatalCheckup(c.id);
          await load();
        },
      },
    ]);
  };

  const kindLabel = (k: CheckupKind) => u(KINDS.find((x) => x.id === k)?.label ?? 'Otro');

  const renderItem = (c: PrenatalCheckup) => {
    const overdue = !c.done && c.checkup_date < today;
    const measures = [
      c.weight_kg !== null ? `${c.weight_kg} kg` : null,
      c.bp_systolic !== null && c.bp_diastolic !== null ? `${c.bp_systolic}/${c.bp_diastolic}` : null,
    ].filter(Boolean);
    return (
      <Card key={c.id} style={{ gap: 6 }}>
        <View style={styles.itemHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemDate}>{formatDate(c.checkup_date, u)}</Text>
            <Text style={styles.itemKind}>
              {kindLabel(c.kind)}
              {overdue ? ` · ${u('pendiente')}` : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={() => remove(c)} accessibilityLabel={u('Borrar')} accessibilityRole="button">
            <Trash2 size={18} color={colors.mutedSoft} />
          </TouchableOpacity>
        </View>
        {c.place ? (
          <View style={styles.place}>
            <MapPin size={12} color={colors.mutedSoft} />
            <Text style={styles.muted}>{c.place}</Text>
          </View>
        ) : null}
        {measures.length > 0 && <Text style={styles.muted}>{measures.join(' · ')}</Text>}
        {!c.done && (
          <TouchableOpacity style={styles.doneBtn} onPress={() => markDone(c)} accessibilityRole="button">
            <Check size={14} color={colors.bosque} />
            <Text style={styles.doneText}>{u('Ya lo hice')}</Text>
          </TouchableOpacity>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <CurvedHeader title={u('Controles prenatales')} subtitle={u('Tus citas y seguimiento')}>
          <StageSwitcher />
        </CurvedHeader>

        <View style={styles.body}>
          {!pregnancy ? (
            <Card style={{ gap: 12 }}>
              <Text style={styles.muted}>{u('Para llevar tus controles primero cuéntanos de tu embarazo.')}</Text>
              <Button label={u('Configurar mi embarazo')} onPress={() => navigation.navigate('EmbarazoTab')} />
            </Card>
          ) : (
            <>
              {!adding && <Button label={u('Agendar o registrar un control')} icon={<Plus size={16} color={colors.white} />} onPress={() => setAdding(true)} />}

              {adding && (
                <Card style={{ gap: 14 }}>
                  <Text style={styles.cardTitle}>{u('Nuevo control')}</Text>
                  <View style={styles.chips}>
                    {KINDS.map((k) => (
                      <Chip key={k.id} label={u(k.label)} active={kind === k.id} onPress={() => setKind(k.id)} />
                    ))}
                  </View>
                  <DateStepper value={date} onChange={setDate} minYear={year - 1} maxYear={year + 1} />
                  <TextInput
                    style={styles.input}
                    placeholder={u('Lugar (opcional)')}
                    placeholderTextColor={colors.placeholder}
                    value={place}
                    onChangeText={setPlace}
                    maxLength={120}
                  />
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>{u('Ya se realizó')}</Text>
                    <Switch value={alreadyDone} onValueChange={setAlreadyDone} trackColor={{ true: colors.carmin, false: colors.disabled }} />
                  </View>
                  {alreadyDone && (
                    <View style={{ gap: 10 }}>
                      <TextInput
                        style={styles.input}
                        placeholder={u('Peso en kg (opcional)')}
                        placeholderTextColor={colors.placeholder}
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="decimal-pad"
                      />
                      <View style={styles.pressureRow}>
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          placeholder={u('Presión alta (ej. 110)')}
                          placeholderTextColor={colors.placeholder}
                          value={sys}
                          onChangeText={setSys}
                          keyboardType="number-pad"
                        />
                        <Text style={styles.slash}>/</Text>
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          placeholder={u('Baja (ej. 70)')}
                          placeholderTextColor={colors.placeholder}
                          value={dia}
                          onChangeText={setDia}
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>
                  )}
                  <Button label={u('Guardar control')} onPress={save} />
                  <TouchableOpacity
                    style={styles.cancel}
                    onPress={() => {
                      setAdding(false);
                      reset();
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={styles.cancelText}>{u('Cancelar')}</Text>
                  </TouchableOpacity>
                </Card>
              )}

              <SectionTitle>{u('Próximos')}</SectionTitle>
              {upcoming.length === 0 ? (
                <Text style={styles.muted}>{u('No tienes controles agendados. Ir a tus controles a tiempo protege a tu bebé y a ti.')}</Text>
              ) : (
                upcoming.map(renderItem)
              )}

              {done.length > 0 && (
                <>
                  <SectionTitle>{u('Realizados')}</SectionTitle>
                  {done.map(renderItem)}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.avena },
  body: { padding: 16, gap: 14 },
  muted: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, lineHeight: 18 },
  cardTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.carbon },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.carbon,
    backgroundColor: colors.avena,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.carbon },
  pressureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slash: { fontFamily: fonts.bold, fontSize: 20, color: colors.mutedSoft },
  cancel: { alignItems: 'center', padding: 6 },
  cancelText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.mutedSoft },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemDate: { fontFamily: fonts.bold, fontSize: 14, color: colors.carbon },
  itemKind: { fontFamily: fonts.semibold, fontSize: 11, color: colors.carmin, marginTop: 2 },
  place: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#EAF0EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    marginTop: 4,
  },
  doneText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.bosque },
});
