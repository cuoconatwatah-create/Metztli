import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { CycleFlowIntensity, CycleMoodTag, UserCycleLog } from '@/types';

interface DailyLogModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (log: Omit<UserCycleLog, 'log_id' | 'local_uuid' | 'is_synced'>) => void;
  date: Date;
  initialLog?: UserCycleLog | null;
}

const FLOW_INTENSITIES: { value: CycleFlowIntensity; label: string }[] = [
  { value: 'light', label: 'Ligero' },
  { value: 'medium', label: 'Medio' },
  { value: 'heavy', label: 'Abundante' },
];

const MOODS: { value: CycleMoodTag; label: string; emoji: string }[] = [
  { value: 'calm', label: 'En Calma', emoji: '😌' },
  { value: 'sensitive', label: 'Sensible', emoji: '🥺' },
  { value: 'energetic', label: 'Energética', emoji: '⚡' },
  { value: 'low', label: 'Baja', emoji: '😔' },
  { value: 'anxious', label: 'Ansiosa', emoji: '😰' },
  { value: 'irritated', label: 'Irritada', emoji: '😠' },
];

export const DailyLogModal: React.FC<DailyLogModalProps> = ({
  visible,
  onClose,
  onSave,
  date,
  initialLog,
}) => {
  const [flow, setFlow] = useState<CycleFlowIntensity>(initialLog?.flow_intensity ?? null);
  const [cramps, setCramps] = useState<number>(initialLog?.cramps_level ?? 0);
  const [stress, setStress] = useState<number>(initialLog?.stress_level ?? 0);
  const [mood, setMood] = useState<CycleMoodTag>(initialLog?.mood_tag ?? null);

  const handleSave = () => {
    onSave({
      date_logged: date.toISOString().split('T')[0],
      flow_intensity: flow,
      cramps_level: cramps,
      stress_level: stress,
      mood_tag: mood,
    });
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl p-6 min-h-[70%]">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-slate-800">
              Registro del {date.getDate()}/{date.getMonth() + 1}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Text className="text-slate-500 font-bold">X</Text>
            </TouchableOpacity>
          </View>

          {/* Flujo Menstrual */}
          <Text className="text-base font-semibold text-slate-700 mb-3">Flujo Menstrual</Text>
          <View className="flex-row space-x-2 mb-6">
            <TouchableOpacity
              onPress={() => setFlow(null)}
              className={`flex-1 py-2 rounded-xl items-center border ${
                flow === null ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200'
              }`}
            >
              <Text className="text-slate-600 font-medium">Ninguno</Text>
            </TouchableOpacity>
            {FLOW_INTENSITIES.map((item) => (
              <TouchableOpacity
                key={item.value}
                onPress={() => setFlow(item.value)}
                className={`flex-1 py-2 rounded-xl items-center border ${
                  flow === item.value
                    ? 'bg-[#8B2635] border-[#8B2635]'
                    : 'bg-white border-slate-200'
                }`}
              >
                <Text
                  className={`font-medium ${
                    flow === item.value ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cólicos (Cramps) */}
          <Text className="text-base font-semibold text-slate-700 mb-3">Nivel de Cólicos (0-5)</Text>
          <View className="flex-row justify-between items-center mb-6 px-2">
            {[0, 1, 2, 3, 4, 5].map((level) => (
              <TouchableOpacity
                key={`cramps-${level}`}
                onPress={() => setCramps(level)}
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  cramps === level ? 'bg-slate-800' : 'bg-slate-100'
                }`}
              >
                <Text className={`font-bold ${cramps === level ? 'text-white' : 'text-slate-600'}`}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Estrés */}
          <Text className="text-base font-semibold text-slate-700 mb-3">Nivel de Estrés (0-5)</Text>
          <View className="flex-row justify-between items-center mb-6 px-2">
            {[0, 1, 2, 3, 4, 5].map((level) => (
              <TouchableOpacity
                key={`stress-${level}`}
                onPress={() => setStress(level)}
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  stress === level ? 'bg-slate-800' : 'bg-slate-100'
                }`}
              >
                <Text className={`font-bold ${stress === level ? 'text-white' : 'text-slate-600'}`}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Estado de Ánimo */}
          <Text className="text-base font-semibold text-slate-700 mb-3">Estado de Ánimo</Text>
          <View className="flex-row flex-wrap mb-8">
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m.value}
                onPress={() => setMood(mood === m.value ? null : m.value)}
                className={`flex-row items-center px-4 py-2 rounded-full border m-1 ${
                  mood === m.value ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'
                }`}
              >
                <Text className="text-lg mr-2">{m.emoji}</Text>
                <Text
                  className={`font-medium ${
                    mood === m.value ? 'text-indigo-700' : 'text-slate-600'
                  }`}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleSave}
            className="w-full bg-[#8B2635] py-4 rounded-2xl items-center"
          >
            <Text className="text-white font-bold text-lg">Guardar Registro</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
