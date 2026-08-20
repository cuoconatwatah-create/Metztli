import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { CalendarGrid } from '@/components/CalendarGrid';
import { DailyLogModal } from '@/components/DailyLogModal';
import { UserCycleLog } from '@/types';
import { calculateCyclePredictions, CyclePrediction, formatLogDate } from '@/lib/cycleAlgorithm';
import { getUserCycleLogs, addUserCycleLog, getAllUserCycleLogs } from '@/db/database';
// Si se usa React Navigation, asegúrate de importar `useNavigation`
// import { useNavigation } from '@react-navigation/native';

export const BrujulaLunarScreen: React.FC = () => {
  // const navigation = useNavigation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<UserCycleLog[]>([]);
  const [prediction, setPrediction] = useState<CyclePrediction | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedLog, setSelectedLog] = useState<UserCycleLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const allLogs = await getAllUserCycleLogs();
      setLogs(allLogs);
      const newPrediction = calculateCyclePredictions(allLogs);
      setPrediction(newPrediction);
    } catch (error) {
      console.error('Error fetching cycle logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDayPress = (date: Date) => {
    const dateStr = formatLogDate(date);
    const existingLog = logs.find((l) => l.date_logged === dateStr) || null;
    setSelectedDate(date);
    setSelectedLog(existingLog);
    setModalVisible(true);
  };

  const handleSaveLog = async (logData: Omit<UserCycleLog, 'log_id' | 'local_uuid' | 'is_synced'>) => {
    try {
      await addUserCycleLog(logData);
      await fetchLogs(); // Refresh
    } catch (error) {
      console.error('Error saving log:', error);
    }
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
  const year = currentDate.getFullYear();

  return (
    <SafeAreaView className="flex-1 bg-[#F4F1EA]">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-[#8B2635] font-serif tracking-tight">
            Brújula Lunar
          </Text>
          <Text className="text-slate-600 text-base mt-2">
            Registra tu ciclo y escucha a tu cuerpo.
          </Text>
        </View>

        {/* Status Card */}
        {prediction && (
          <View className="bg-white rounded-3xl p-6 mb-8 shadow-sm border border-slate-100 flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Promedio de Ciclo
              </Text>
              <Text className="text-2xl font-bold text-slate-800">
                {prediction.averageCycleLength} <Text className="text-base font-normal">días</Text>
              </Text>
            </View>
            <View className="h-10 w-px bg-slate-200" />
            <View>
              <Text className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Próximo Periodo
              </Text>
              <Text className="text-lg font-bold text-[#8B2635]">
                {prediction.nextPeriodStart.getDate()}/{prediction.nextPeriodStart.getMonth() + 1}
              </Text>
            </View>
          </View>
        )}

        {/* Month Selector */}
        <View className="flex-row justify-between items-center mb-6 px-4">
          <TouchableOpacity onPress={() => changeMonth(-1)} className="p-2">
            <Text className="text-2xl font-bold text-slate-400">{'<'}</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-800 capitalize">
            {monthName} {year}
          </Text>
          <TouchableOpacity onPress={() => changeMonth(1)} className="p-2">
            <Text className="text-2xl font-bold text-slate-400">{'>'}</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Component */}
        {loading ? (
          <ActivityIndicator size="large" color="#8B2635" className="my-10" />
        ) : (
          <CalendarGrid
            year={year}
            month={currentDate.getMonth() + 1}
            logs={logs}
            prediction={prediction}
            onDayPress={handleDayPress}
          />
        )}
      </ScrollView>

      {/* Floating Action Button (Log Today) */}
      <View className="absolute bottom-6 left-0 right-0 items-center">
        <TouchableOpacity
          onPress={() => handleDayPress(new Date())}
          className="bg-[#2C3D30] px-8 py-4 rounded-full flex-row items-center shadow-lg shadow-black/20"
        >
          <Text className="text-white font-bold text-lg">Registrar Hoy</Text>
        </TouchableOpacity>
      </View>

      <DailyLogModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveLog}
        date={selectedDate}
        initialLog={selectedLog}
      />
    </SafeAreaView>
  );
};
