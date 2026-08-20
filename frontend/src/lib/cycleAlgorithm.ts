import { UserCycleLog } from '@/types';

/**
 * Representa una predicción de ciclo.
 */
export interface CyclePrediction {
  averageCycleLength: number;
  averagePeriodLength: number;
  nextPeriodStart: Date;
  nextPeriodEnd: Date;
  fertileWindowStart: Date;
  fertileWindowEnd: Date;
}

/**
 * Calcula la diferencia en días entre dos fechas
 */
function diffDays(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Añade días a una fecha
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Convierte un log date string a objeto Date
 */
export function parseLogDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formatea un objeto Date a YYYY-MM-DD
 */
export function formatLogDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Algoritmo base para el Cycle Tracker.
 * Calcula la duración promedio del ciclo y la proyección de las siguientes fases.
 * @param logs Lista de logs del ciclo del usuario
 */
export function calculateCyclePredictions(logs: UserCycleLog[]): CyclePrediction | null {
  // Filtrar logs que representan días de periodo (flow_intensity activo)
  const periodLogs = logs
    .filter((log) => log.flow_intensity === 'light' || log.flow_intensity === 'medium' || log.flow_intensity === 'heavy')
    .map((log) => parseLogDate(log.date_logged))
    .sort((a, b) => a.getTime() - b.getTime());

  if (periodLogs.length === 0) {
    return null;
  }

  // Agrupar días contiguos en "Periodos"
  const periods: { start: Date; end: Date; length: number }[] = [];
  let currentPeriodStart = periodLogs[0];
  let currentPeriodEnd = periodLogs[0];

  for (let i = 1; i < periodLogs.length; i++) {
    const currentDay = periodLogs[i];
    if (diffDays(currentPeriodEnd, currentDay) <= 1) {
      currentPeriodEnd = currentDay;
    } else {
      periods.push({
        start: currentPeriodStart,
        end: currentPeriodEnd,
        length: diffDays(currentPeriodStart, currentPeriodEnd) + 1,
      });
      currentPeriodStart = currentDay;
      currentPeriodEnd = currentDay;
    }
  }
  periods.push({
    start: currentPeriodStart,
    end: currentPeriodEnd,
    length: diffDays(currentPeriodStart, currentPeriodEnd) + 1,
  });

  // Tomar los últimos 3 periodos para el promedio
  const lastPeriods = periods.slice(-4);

  let totalCycleLength = 0;
  let cycleCount = 0;
  let totalPeriodLength = 0;

  for (let i = 0; i < lastPeriods.length; i++) {
    totalPeriodLength += lastPeriods[i].length;
    if (i > 0) {
      const cycleLength = diffDays(lastPeriods[i - 1].start, lastPeriods[i].start);
      totalCycleLength += cycleLength;
      cycleCount++;
    }
  }

  const averagePeriodLength = Math.round(totalPeriodLength / lastPeriods.length) || 5;
  const averageCycleLength = cycleCount > 0 ? Math.round(totalCycleLength / cycleCount) : 28;

  const lastPeriod = periods[periods.length - 1];

  // Proyecciones
  const nextPeriodStart = addDays(lastPeriod.start, averageCycleLength);
  const nextPeriodEnd = addDays(nextPeriodStart, averagePeriodLength - 1);

  // La ventana fértil suele estimarse 14 días antes del próximo periodo (fase lútea típica)
  const estimatedOvulation = addDays(nextPeriodStart, -14);
  const fertileWindowStart = addDays(estimatedOvulation, -4);
  const fertileWindowEnd = addDays(estimatedOvulation, 1);

  return {
    averageCycleLength,
    averagePeriodLength,
    nextPeriodStart,
    nextPeriodEnd,
    fertileWindowStart,
    fertileWindowEnd,
  };
}

export function getDayState(
  date: Date,
  prediction: CyclePrediction | null,
  logs: UserCycleLog[]
): 'menstrual' | 'fertile' | 'base' {
  const dateStr = formatLogDate(date);
  
  const logForDay = logs.find((l) => l.date_logged === dateStr);
  if (logForDay && logForDay.flow_intensity !== null) {
    return 'menstrual';
  }

  if (!prediction) {
    return 'base';
  }

  const dateTime = date.getTime();
  const isMenstrual = dateTime >= prediction.nextPeriodStart.getTime() && dateTime <= prediction.nextPeriodEnd.getTime();
  const isFertile = dateTime >= prediction.fertileWindowStart.getTime() && dateTime <= prediction.fertileWindowEnd.getTime();

  if (isMenstrual) return 'menstrual';
  if (isFertile) return 'fertile';

  return 'base';
}
