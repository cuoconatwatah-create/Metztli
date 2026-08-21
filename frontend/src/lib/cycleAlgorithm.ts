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
  futurePeriods: { start: Date; end: Date }[];
  futureFertileWindows: { start: Date; end: Date }[];
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

  const nextPeriodStart = addDays(lastPeriod.start, averageCycleLength);
  const nextPeriodEnd = addDays(nextPeriodStart, averagePeriodLength - 1);

  const estimatedOvulation = addDays(nextPeriodStart, -14);
  const fertileWindowStart = addDays(estimatedOvulation, -5);
  const fertileWindowEnd = addDays(estimatedOvulation, 1);

  // Proyectar 6 ciclos hacia el futuro
  const futurePeriods: { start: Date; end: Date }[] = [];
  const futureFertileWindows: { start: Date; end: Date }[] = [];
  
  let currentProjStart = nextPeriodStart;
  for (let i = 0; i < 6; i++) {
    const currentProjEnd = addDays(currentProjStart, averagePeriodLength - 1);
    futurePeriods.push({ start: currentProjStart, end: currentProjEnd });
    
    // Para ser exactos, calculamos la ovulación basada en el periodo ACTUAL de esta iteración.
    // La ovulación de un ciclo ocurre 14 días ANTES del final de ese ciclo (inicio del siguiente).
    const ovul = addDays(addDays(currentProjStart, averageCycleLength), -14);
    futureFertileWindows.push({
      start: addDays(ovul, -5),
      end: addDays(ovul, 1)
    });

    currentProjStart = addDays(currentProjStart, averageCycleLength);
  }

  return {
    averageCycleLength,
    averagePeriodLength,
    nextPeriodStart,
    nextPeriodEnd,
    fertileWindowStart: futureFertileWindows[0].start,
    fertileWindowEnd: futureFertileWindows[0].end,
    futurePeriods,
    futureFertileWindows,
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

  // Buscar en todos los periodos futuros proyectados
  for (const period of prediction.futurePeriods) {
    if (dateTime >= period.start.getTime() && dateTime <= period.end.getTime()) {
      return 'menstrual';
    }
  }

  // Buscar en todas las ventanas fértiles futuras proyectadas
  for (const window of prediction.futureFertileWindows) {
    if (dateTime >= window.start.getTime() && dateTime <= window.end.getTime()) {
      return 'fertile';
    }
  }

  return 'base';
}
