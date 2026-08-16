// ─────────────────────────────────────────────────────────
// Metztli 2.0 — Cycle Calculator Hook (Offline)
// ─────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import type { CycleCalculation, CyclePhase } from '@/types';
import { getLastCycle, getCycles } from '@/db/database';

/**
 * Adds days to a date string and returns ISO date string.
 */
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Calculates the difference in days between two date strings.
 */
function daysBetween(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffMs = d2.getTime() - d1.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determines the current phase of the menstrual cycle.
 */
function calculatePhase(
  currentDay: number,
  periodLength: number,
  cycleLength: number
): CyclePhase {
  if (currentDay <= periodLength) return 'menstrual';
  if (currentDay <= cycleLength - 16) return 'follicular';
  if (currentDay <= cycleLength - 12) return 'ovulation';
  return 'luteal';
}

export function useCycleCalculator() {
  const [calculation, setCalculation] = useState<CycleCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const calculate = useCallback(async () => {
    setIsLoading(true);
    try {
      const lastCycle = await getLastCycle();
      const cycles = await getCycles(6);

      if (!lastCycle) {
        setCalculation(null);
        return;
      }

      // Calculate average cycle length from history
      let avgCycleLength = 28;
      let avgPeriodLength = 5;

      if (cycles.length >= 2) {
        const lengths = cycles
          .filter((c) => c.cycle_length > 0)
          .map((c) => c.cycle_length);
        if (lengths.length > 0) {
          avgCycleLength = Math.round(
            lengths.reduce((a, b) => a + b, 0) / lengths.length
          );
        }
        const periodLengths = cycles
          .filter((c) => c.period_length > 0)
          .map((c) => c.period_length);
        if (periodLengths.length > 0) {
          avgPeriodLength = Math.round(
            periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length
          );
        }
      } else {
        avgCycleLength = lastCycle.cycle_length || 28;
        avgPeriodLength = lastCycle.period_length || 5;
      }

      const today = new Date().toISOString().split('T')[0];
      const currentDay = daysBetween(lastCycle.start_date, today) + 1;

      // Ovulation occurs ~14 days before the end of the cycle
      const ovulationDay = avgCycleLength - 14;
      const ovulationDate = addDays(lastCycle.start_date, ovulationDay - 1);

      // Fertile window: 5 days before ovulation to 1 day after
      const fertileWindowStart = addDays(ovulationDate, -5);
      const fertileWindowEnd = addDays(ovulationDate, 1);

      // Next period prediction
      const nextPeriodDate = addDays(
        lastCycle.start_date,
        avgCycleLength
      );

      const currentPhase = calculatePhase(
        currentDay > 0 ? currentDay : 1,
        avgPeriodLength,
        avgCycleLength
      );

      setCalculation({
        currentDay: currentDay > 0 ? currentDay : 1,
        currentPhase,
        nextPeriodDate,
        ovulationDate,
        fertileWindowStart,
        fertileWindowEnd,
        cycleLength: avgCycleLength,
        periodLength: avgPeriodLength,
      });
    } catch (error) {
      console.error('Error calculating cycle:', error);
      setCalculation(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    calculate();
  }, [calculate]);

  return { calculation, isLoading, recalculate: calculate };
}
