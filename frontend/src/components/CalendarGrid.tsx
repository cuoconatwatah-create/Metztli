import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { UserCycleLog } from '@/types';
import { CyclePrediction, getDayState } from '@/lib/cycleAlgorithm';

interface CalendarGridProps {
  year: number;
  month: number; // 1-indexed (1 = Jan, 12 = Dec)
  logs: UserCycleLog[];
  prediction: CyclePrediction | null;
  onDayPress: (date: Date) => void;
}

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  year,
  month,
  logs,
  prediction,
  onDayPress,
}) => {
  const daysInMonth = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  const firstDayOfMonth = useMemo(() => {
    return new Date(year, month - 1, 1).getDay();
  }, [year, month]);

  const renderDays = () => {
    const cells = [];
    // Espacios vacíos al principio del mes
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<View key={`empty-${i}`} className="w-10 h-10 m-1" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month - 1, day);
      const state = getDayState(currentDate, prediction, logs);

      let bgColor = 'bg-[#F4F1EA]'; // Avena Cálida / Base
      let textColor = 'text-slate-800';

      if (state === 'menstrual') {
        bgColor = 'bg-[#8B2635]'; // Carmín Profundo
        textColor = 'text-white';
      } else if (state === 'fertile') {
        bgColor = 'bg-[#2C3D30]'; // Verde Bosque
        textColor = 'text-white';
      }

      // Check if it's today
      const today = new Date();
      const isToday =
        today.getDate() === day &&
        today.getMonth() + 1 === month &&
        today.getFullYear() === year;

      cells.push(
        <TouchableOpacity
          key={`day-${day}`}
          onPress={() => onDayPress(currentDate)}
          className={`w-10 h-10 m-1 items-center justify-center rounded-full ${bgColor} ${
            isToday ? 'border-2 border-slate-400' : ''
          }`}
        >
          <Text className={`font-semibold ${textColor}`}>{day}</Text>
        </TouchableOpacity>
      );
    }

    return cells;
  };

  return (
    <View className="bg-white/80 rounded-3xl p-4 shadow-sm border border-slate-100">
      <View className="flex-row justify-between mb-4 px-2">
        {DAYS_OF_WEEK.map((dayName) => (
          <Text key={dayName} className="text-slate-500 text-xs font-bold w-10 text-center">
            {dayName}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap">{renderDays()}</View>

      {/* Leyenda */}
      <View className="flex-row justify-center mt-6 space-x-4">
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-[#8B2635] mr-2" />
          <Text className="text-xs text-slate-600 font-medium">Menstruación</Text>
        </View>
        <View className="flex-row items-center ml-4">
          <View className="w-3 h-3 rounded-full bg-[#2C3D30] mr-2" />
          <Text className="text-xs text-slate-600 font-medium">Ventana Fértil</Text>
        </View>
      </View>
    </View>
  );
};
