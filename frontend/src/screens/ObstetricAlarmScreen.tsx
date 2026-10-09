// ─────────────────────────────────────────────────────────
// Metztli — Señales de alarma obstétrica
// Qué síntomas obligan a buscar ayuda ya, y tres formas de pedirla:
// llamar a la ambulancia, ver los centros cercanos o avisar por SMS a una persona de confianza.
// ─────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, PhoneCall, MessageSquareWarning, Building2 } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { Card, CurvedHeader } from '@/components/ui';
import { AMBULANCE_NUMBER, buildSmsUrl } from '@/data/emergency';
import { colors, fonts, radius, shadow } from '@/theme';
import { useUi } from '@/i18n/ui';

const SMS_TEXT = 'EMERGENCIA: Estoy embarazada y necesito asistencia médica urgente.';

export default function ObstetricAlarmScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const u = useUi();

  const handleCall = () => {
    Linking.openURL(`tel:${AMBULANCE_NUMBER}`).catch(() =>
      Alert.alert(u('No se pudo llamar'), u('Marca el {{n}} desde tu teléfono.', { n: AMBULANCE_NUMBER }))
    );
  };

  const handleSMS = () => {
    Linking.openURL(buildSmsUrl(SMS_TEXT)).catch(() =>
      Alert.alert(u('Mensaje preparado'), u('No se pudo abrir tus mensajes. Envía este texto a tu partera: {{text}}', { text: SMS_TEXT }))
    );
  };

  const dangerSigns = [
    t('alarm.bleeding'),
    t('alarm.severe_pain'),
    t('alarm.blurred_vision'),
    t('alarm.no_movement'),
    t('alarm.fever'),
    t('alarm.headache_severe'),
    t('alarm.swelling_face'),
    t('alarm.fluid_leak'),
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <CurvedHeader title={t('alarm.title')} onBack={() => navigation.goBack()} />

        <View style={styles.body}>
          <View style={styles.warning} accessibilityRole="alert">
            <AlertTriangle size={40} color={colors.carmin} />
            <Text style={styles.warningTitle}>{u('Busca ayuda inmediata')}</Text>
            <Text style={styles.warningText}>
              {u('Si presentas cualquiera de los siguientes síntomas, acude a la Casa Materna o Centro de Salud más cercano.')}
            </Text>
          </View>

          <Card style={{ gap: 12 }}>
            {dangerSigns.map((sign) => (
              <View key={sign} style={styles.row}>
                <View style={styles.bullet} />
                <Text style={styles.sign}>{sign}</Text>
              </View>
            ))}
          </Card>

          <TouchableOpacity style={styles.call} onPress={handleCall} activeOpacity={0.85} accessibilityRole="button"
            accessibilityLabel={u('Llamar a la ambulancia ({{n}})', { n: AMBULANCE_NUMBER })}>
            <PhoneCall size={24} color={colors.white} />
            <View style={{ flex: 1 }}>
              <Text style={styles.callTitle}>{u('Llamar a la ambulancia ({{n}})', { n: AMBULANCE_NUMBER })}</Text>
              <Text style={styles.callSub}>{u('Cruz Roja Nicaragüense')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('Directorio')} activeOpacity={0.85} accessibilityRole="button">
            <Building2 size={22} color={colors.bosque} />
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>{u('Casas Maternas y hospitales')}</Text>
              <Text style={styles.optionSub}>{u('Teléfonos del centro más cercano a tu municipio.')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={handleSMS} activeOpacity={0.85} accessibilityRole="button">
            <MessageSquareWarning size={22} color={colors.carmin} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionTitle, { color: colors.carmin }]}>{u('Enviar SMS de emergencia')}</Text>
              <Text style={styles.optionSub}>
                {u('Elige a tu partera o a alguien de confianza. Útil si no tienes saldo o buena señal.')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.avena },
  body: { padding: 16, gap: 14 },
  warning: { alignItems: 'center', gap: 8, backgroundColor: colors.blush, padding: 20, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.rose },
  warningTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.carmin, textAlign: 'center' },
  warningText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.muted, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  bullet: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.carmin, marginTop: 7 },
  sign: { flex: 1, fontFamily: fonts.medium, fontSize: 15, lineHeight: 22, color: colors.carbon },
  call: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.carmin, padding: 18, borderRadius: radius.lg, ...shadow.glow },
  callTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.white },
  callSub: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.white, padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, ...shadow.card },
  optionTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.bosque },
  optionSub: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.muted, marginTop: 2 },
});
