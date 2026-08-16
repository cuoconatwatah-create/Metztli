// ─────────────────────────────────────────────────────────
// Metztli 2.0 — Pregnancy Calculator Hook (Offline)
// Uses Naegele's Rule: EDD = LMP + 280 days
// ─────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import type { PregnancyCalculation } from '@/types';
import { getUserProfile } from '@/db/database';
import { getPregnancyWeekData } from '@/db/seedData';

/**
 * Calculates gestational age from LMP (Last Menstrual Period).
 * Naegele's Rule: Due Date = LMP + 280 days (40 weeks).
 */
function calculateFromLMP(lmpDateStr: string): PregnancyCalculation {
  const lmpDate = new Date(lmpDateStr);
  const today = new Date();

  // Days since LMP
  const diffMs = today.getTime() - lmpDate.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const gestationalWeeks = Math.floor(totalDays / 7);
  const gestationalDays = totalDays % 7;

  // Naegele's Rule: EDD = LMP + 280 days
  const dueDate = new Date(lmpDate);
  dueDate.setDate(dueDate.getDate() + 280);
  const dueDateStr = dueDate.toISOString().split('T')[0];

  // Days remaining
  const daysRemaining = Math.max(
    0,
    Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Progress (0 to 100)
  const progressPercent = Math.min(
    100,
    Math.round((totalDays / 280) * 100)
  );

  // Trimester
  let trimester: 1 | 2 | 3;
  if (gestationalWeeks < 14) trimester = 1;
  else if (gestationalWeeks < 28) trimester = 2;
  else trimester = 3;

  // Week data
  const weekNumber = Math.min(40, Math.max(1, gestationalWeeks + 1));
  const weekData = getPregnancyWeekData(weekNumber);

  return {
    gestationalWeeks,
    gestationalDays,
    trimester,
    dueDate: dueDateStr,
    daysRemaining,
    progressPercent,
    weekData,
  };
}

/**
 * Calculates gestational age from Due Date (reverse Naegele).
 * LMP = Due Date - 280 days
 */
function calculateFromDueDate(dueDateStr: string): PregnancyCalculation {
  const dueDate = new Date(dueDateStr);

  // Reverse Naegele: LMP = EDD - 280 days
  const lmpDate = new Date(dueDate);
  lmpDate.setDate(lmpDate.getDate() - 280);
  const lmpDateStr = lmpDate.toISOString().split('T')[0];

  return calculateFromLMP(lmpDateStr);
}

export function usePregnancyCalculator() {
  const [calculation, setCalculation] =
    useState<PregnancyCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const calculate = useCallback(async () => {
    setIsLoading(true);
    try {
      const profile = await getUserProfile();

      if (!profile) {
        setCalculation(null);
        return;
      }

      if (profile.lmp_date) {
        setCalculation(calculateFromLMP(profile.lmp_date));
      } else if (profile.due_date) {
        setCalculation(calculateFromDueDate(profile.due_date));
      } else {
        setCalculation(null);
      }
    } catch (error) {
      console.error('Error calculating pregnancy:', error);
      setCalculation(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Manually calculate from a given LMP date string (YYYY-MM-DD).
   */
  const calculateManualLMP = useCallback((lmpDate: string) => {
    setCalculation(calculateFromLMP(lmpDate));
  }, []);

  /**
   * Manually calculate from a given due date string (YYYY-MM-DD).
   */
  const calculateManualDueDate = useCallback((dueDate: string) => {
    setCalculation(calculateFromDueDate(dueDate));
  }, []);

  useEffect(() => {
    calculate();
  }, [calculate]);

  return {
    calculation,
    isLoading,
    recalculate: calculate,
    calculateManualLMP,
    calculateManualDueDate,
  };
}
