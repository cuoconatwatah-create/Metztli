// ─────────────────────────────────────────────────────────
// Metztli 2.0 — Seed Data (Pre-populated Offline Content)
// ─────────────────────────────────────────────────────────

import { openDatabase } from './database';
import type { PregnancyWeekData } from '@/types';

/**
 * Seeds the database with emergency directory, FAQs, and pregnancy data.
 * Safe to call multiple times — checks for existing data before inserting.
 */
export async function seedDatabase(): Promise<void> {
  const db = await openDatabase();

  // Check if table has rows
  const result = (await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM directory_contacts'
  )) as { count: number };

  if (result.count > 0) return;

  // ── Emergency Directory ──────────────────────────────
  await db.execAsync(`
    INSERT INTO directory_contacts (municipality, institution_name, phone_number, type) VALUES
    ('Bilwi', 'Hospital Nuevo Amanecer', '+505-2792-2241', 'hospital_minsa'),
    ('Bilwi', 'Casa Materna Bilwi', '+505-2792-2300', 'casa_materna'),
    ('Bilwi', 'Ambulancia MINSA Bilwi', '+505-2792-2911', 'ambulancia'),
    ('Waspam', 'Centro de Salud Waspam', '+505-2792-3010', 'hospital_minsa'),
    ('Waspam', 'Casa Materna Waspam', '+505-2792-3015', 'casa_materna'),
    ('Bluefields', 'Hospital Ernesto Sequeira', '+505-2572-2391', 'hospital_minsa'),
    ('Bluefields', 'Casa Materna Bluefields', '+505-2572-2400', 'casa_materna'),
    ('Bluefields', 'Ambulancia MINSA Bluefields', '+505-2572-2911', 'ambulancia'),
    ('Laguna de Perlas', 'Centro de Salud Laguna de Perlas', '+505-2572-0100', 'hospital_minsa'),
    ('Laguna de Perlas', 'Casa Materna Laguna de Perlas', '+505-2572-0105', 'casa_materna'),
    ('Siuna', 'Hospital Carlos Centeno', '+505-2763-2031', 'hospital_minsa'),
    ('Siuna', 'Casa Materna Siuna', '+505-2763-2040', 'casa_materna'),
    ('Siuna', 'Ambulancia MINSA Siuna', '+505-2763-2911', 'ambulancia'),
    ('Rosita', 'Centro de Salud Rosita', '+505-2763-3020', 'hospital_minsa'),
    ('Rosita', 'Casa Materna Rosita', '+505-2763-3025', 'casa_materna'),
    ('Bonanza', 'Centro de Salud Bonanza', '+505-2763-4010', 'hospital_minsa'),
    ('Bonanza', 'Casa Materna Bonanza', '+505-2763-4015', 'casa_materna'),
    ('Puerto Cabezas', 'Centro de Salud Puerto Cabezas', '+505-2792-2500', 'hospital_minsa'),
    ('Puerto Cabezas', 'Casa Materna Puerto Cabezas', '+505-2792-2505', 'casa_materna'),
    ('Kukra Hill', 'Centro de Salud Kukra Hill', '+505-2572-1100', 'hospital_minsa'),
    ('Corn Island', 'Centro de Salud Corn Island', '+505-2575-5010', 'hospital_minsa'),
    ('Prinzapolka', 'Centro de Salud Prinzapolka', '+505-2792-4100', 'hospital_minsa');
  `);

  // ── Offline FAQs ─────────────────────────────────────
  await db.execAsync(`
    INSERT INTO offline_faqs (category, title_key, content_key, audio_key) VALUES
    ('ciclo', 'faq_cycle_what_is', 'faq_cycle_what_is_content', 'audio_faq_cycle_what'),
    ('ciclo', 'faq_cycle_irregular', 'faq_cycle_irregular_content', 'audio_faq_cycle_irregular'),
    ('ciclo', 'faq_cycle_pain', 'faq_cycle_pain_content', 'audio_faq_cycle_pain'),
    ('ciclo', 'faq_cycle_fertile', 'faq_cycle_fertile_content', 'audio_faq_cycle_fertile'),
    ('embarazo', 'faq_pregnancy_signs', 'faq_pregnancy_signs_content', 'audio_faq_preg_signs'),
    ('embarazo', 'faq_pregnancy_prenatal', 'faq_pregnancy_prenatal_content', 'audio_faq_preg_prenatal'),
    ('embarazo', 'faq_pregnancy_danger', 'faq_pregnancy_danger_content', 'audio_faq_preg_danger'),
    ('embarazo', 'faq_pregnancy_nutrition', 'faq_pregnancy_nutrition_content', 'audio_faq_preg_nutrition'),
    ('embarazo', 'faq_pregnancy_kicks', 'faq_pregnancy_kicks_content', 'audio_faq_preg_kicks'),
    ('menopausia', 'faq_menopause_what_is', 'faq_menopause_what_is_content', 'audio_faq_meno_what'),
    ('menopausia', 'faq_menopause_hotflash', 'faq_menopause_hotflash_content', 'audio_faq_meno_hotflash'),
    ('menopausia', 'faq_menopause_bones', 'faq_menopause_bones_content', 'audio_faq_meno_bones'),
    ('plantas', 'faq_plants_chamomile', 'faq_plants_chamomile_content', 'audio_faq_plant_chamomile'),
    ('plantas', 'faq_plants_ginger', 'faq_plants_ginger_content', 'audio_faq_plant_ginger'),
    ('plantas', 'faq_plants_cinnamon', 'faq_plants_cinnamon_content', 'audio_faq_plant_cinnamon');
  `);
}

// ─────────────────────────────────────────────────────────
// Pregnancy Week-by-Week Data (Static, Used In-Memory)
// ─────────────────────────────────────────────────────────

export const PREGNANCY_WEEKS: PregnancyWeekData[] = [
  { week: 1, trimester: 1, baby_size_cm: 0, baby_weight_g: 0, size_comparison_key: 'week1_size', development_key: 'week1_dev', maternal_tips_key: 'week1_tips', recommended_exams_key: 'week1_exams' },
  { week: 2, trimester: 1, baby_size_cm: 0, baby_weight_g: 0, size_comparison_key: 'week2_size', development_key: 'week2_dev', maternal_tips_key: 'week2_tips', recommended_exams_key: 'week2_exams' },
  { week: 3, trimester: 1, baby_size_cm: 0.01, baby_weight_g: 0, size_comparison_key: 'week3_size', development_key: 'week3_dev', maternal_tips_key: 'week3_tips', recommended_exams_key: 'week3_exams' },
  { week: 4, trimester: 1, baby_size_cm: 0.1, baby_weight_g: 0.1, size_comparison_key: 'week4_size', development_key: 'week4_dev', maternal_tips_key: 'week4_tips', recommended_exams_key: 'week4_exams' },
  { week: 5, trimester: 1, baby_size_cm: 0.2, baby_weight_g: 0.5, size_comparison_key: 'week5_size', development_key: 'week5_dev', maternal_tips_key: 'week5_tips', recommended_exams_key: 'week5_exams' },
  { week: 6, trimester: 1, baby_size_cm: 0.6, baby_weight_g: 1, size_comparison_key: 'week6_size', development_key: 'week6_dev', maternal_tips_key: 'week6_tips', recommended_exams_key: 'week6_exams' },
  { week: 7, trimester: 1, baby_size_cm: 1.3, baby_weight_g: 1, size_comparison_key: 'week7_size', development_key: 'week7_dev', maternal_tips_key: 'week7_tips', recommended_exams_key: 'week7_exams' },
  { week: 8, trimester: 1, baby_size_cm: 1.6, baby_weight_g: 1, size_comparison_key: 'week8_size', development_key: 'week8_dev', maternal_tips_key: 'week8_tips', recommended_exams_key: 'week8_exams' },
  { week: 9, trimester: 1, baby_size_cm: 2.3, baby_weight_g: 2, size_comparison_key: 'week9_size', development_key: 'week9_dev', maternal_tips_key: 'week9_tips', recommended_exams_key: 'week9_exams' },
  { week: 10, trimester: 1, baby_size_cm: 3.1, baby_weight_g: 4, size_comparison_key: 'week10_size', development_key: 'week10_dev', maternal_tips_key: 'week10_tips', recommended_exams_key: 'week10_exams' },
  { week: 11, trimester: 1, baby_size_cm: 4.1, baby_weight_g: 7, size_comparison_key: 'week11_size', development_key: 'week11_dev', maternal_tips_key: 'week11_tips', recommended_exams_key: 'week11_exams' },
  { week: 12, trimester: 1, baby_size_cm: 5.4, baby_weight_g: 14, size_comparison_key: 'week12_size', development_key: 'week12_dev', maternal_tips_key: 'week12_tips', recommended_exams_key: 'week12_exams' },
  { week: 13, trimester: 1, baby_size_cm: 7.4, baby_weight_g: 23, size_comparison_key: 'week13_size', development_key: 'week13_dev', maternal_tips_key: 'week13_tips', recommended_exams_key: 'week13_exams' },
  { week: 14, trimester: 2, baby_size_cm: 8.7, baby_weight_g: 43, size_comparison_key: 'week14_size', development_key: 'week14_dev', maternal_tips_key: 'week14_tips', recommended_exams_key: 'week14_exams' },
  { week: 15, trimester: 2, baby_size_cm: 10.1, baby_weight_g: 70, size_comparison_key: 'week15_size', development_key: 'week15_dev', maternal_tips_key: 'week15_tips', recommended_exams_key: 'week15_exams' },
  { week: 16, trimester: 2, baby_size_cm: 11.6, baby_weight_g: 100, size_comparison_key: 'week16_size', development_key: 'week16_dev', maternal_tips_key: 'week16_tips', recommended_exams_key: 'week16_exams' },
  { week: 17, trimester: 2, baby_size_cm: 13.0, baby_weight_g: 140, size_comparison_key: 'week17_size', development_key: 'week17_dev', maternal_tips_key: 'week17_tips', recommended_exams_key: 'week17_exams' },
  { week: 18, trimester: 2, baby_size_cm: 14.2, baby_weight_g: 190, size_comparison_key: 'week18_size', development_key: 'week18_dev', maternal_tips_key: 'week18_tips', recommended_exams_key: 'week18_exams' },
  { week: 19, trimester: 2, baby_size_cm: 15.3, baby_weight_g: 240, size_comparison_key: 'week19_size', development_key: 'week19_dev', maternal_tips_key: 'week19_tips', recommended_exams_key: 'week19_exams' },
  { week: 20, trimester: 2, baby_size_cm: 16.4, baby_weight_g: 300, size_comparison_key: 'week20_size', development_key: 'week20_dev', maternal_tips_key: 'week20_tips', recommended_exams_key: 'week20_exams' },
  { week: 21, trimester: 2, baby_size_cm: 26.7, baby_weight_g: 360, size_comparison_key: 'week21_size', development_key: 'week21_dev', maternal_tips_key: 'week21_tips', recommended_exams_key: 'week21_exams' },
  { week: 22, trimester: 2, baby_size_cm: 27.8, baby_weight_g: 430, size_comparison_key: 'week22_size', development_key: 'week22_dev', maternal_tips_key: 'week22_tips', recommended_exams_key: 'week22_exams' },
  { week: 23, trimester: 2, baby_size_cm: 28.9, baby_weight_g: 501, size_comparison_key: 'week23_size', development_key: 'week23_dev', maternal_tips_key: 'week23_tips', recommended_exams_key: 'week23_exams' },
  { week: 24, trimester: 2, baby_size_cm: 30.0, baby_weight_g: 600, size_comparison_key: 'week24_size', development_key: 'week24_dev', maternal_tips_key: 'week24_tips', recommended_exams_key: 'week24_exams' },
  { week: 25, trimester: 2, baby_size_cm: 34.6, baby_weight_g: 660, size_comparison_key: 'week25_size', development_key: 'week25_dev', maternal_tips_key: 'week25_tips', recommended_exams_key: 'week25_exams' },
  { week: 26, trimester: 2, baby_size_cm: 35.6, baby_weight_g: 760, size_comparison_key: 'week26_size', development_key: 'week26_dev', maternal_tips_key: 'week26_tips', recommended_exams_key: 'week26_exams' },
  { week: 27, trimester: 2, baby_size_cm: 36.6, baby_weight_g: 875, size_comparison_key: 'week27_size', development_key: 'week27_dev', maternal_tips_key: 'week27_tips', recommended_exams_key: 'week27_exams' },
  { week: 28, trimester: 3, baby_size_cm: 37.6, baby_weight_g: 1005, size_comparison_key: 'week28_size', development_key: 'week28_dev', maternal_tips_key: 'week28_tips', recommended_exams_key: 'week28_exams' },
  { week: 29, trimester: 3, baby_size_cm: 38.6, baby_weight_g: 1153, size_comparison_key: 'week29_size', development_key: 'week29_dev', maternal_tips_key: 'week29_tips', recommended_exams_key: 'week29_exams' },
  { week: 30, trimester: 3, baby_size_cm: 39.9, baby_weight_g: 1319, size_comparison_key: 'week30_size', development_key: 'week30_dev', maternal_tips_key: 'week30_tips', recommended_exams_key: 'week30_exams' },
  { week: 31, trimester: 3, baby_size_cm: 41.1, baby_weight_g: 1502, size_comparison_key: 'week31_size', development_key: 'week31_dev', maternal_tips_key: 'week31_tips', recommended_exams_key: 'week31_exams' },
  { week: 32, trimester: 3, baby_size_cm: 42.4, baby_weight_g: 1702, size_comparison_key: 'week32_size', development_key: 'week32_dev', maternal_tips_key: 'week32_tips', recommended_exams_key: 'week32_exams' },
  { week: 33, trimester: 3, baby_size_cm: 43.7, baby_weight_g: 1918, size_comparison_key: 'week33_size', development_key: 'week33_dev', maternal_tips_key: 'week33_tips', recommended_exams_key: 'week33_exams' },
  { week: 34, trimester: 3, baby_size_cm: 45.0, baby_weight_g: 2146, size_comparison_key: 'week34_size', development_key: 'week34_dev', maternal_tips_key: 'week34_tips', recommended_exams_key: 'week34_exams' },
  { week: 35, trimester: 3, baby_size_cm: 46.2, baby_weight_g: 2383, size_comparison_key: 'week35_size', development_key: 'week35_dev', maternal_tips_key: 'week35_tips', recommended_exams_key: 'week35_exams' },
  { week: 36, trimester: 3, baby_size_cm: 47.4, baby_weight_g: 2622, size_comparison_key: 'week36_size', development_key: 'week36_dev', maternal_tips_key: 'week36_tips', recommended_exams_key: 'week36_exams' },
  { week: 37, trimester: 3, baby_size_cm: 48.6, baby_weight_g: 2859, size_comparison_key: 'week37_size', development_key: 'week37_dev', maternal_tips_key: 'week37_tips', recommended_exams_key: 'week37_exams' },
  { week: 38, trimester: 3, baby_size_cm: 49.8, baby_weight_g: 3083, size_comparison_key: 'week38_size', development_key: 'week38_dev', maternal_tips_key: 'week38_tips', recommended_exams_key: 'week38_exams' },
  { week: 39, trimester: 3, baby_size_cm: 50.7, baby_weight_g: 3288, size_comparison_key: 'week39_size', development_key: 'week39_dev', maternal_tips_key: 'week39_tips', recommended_exams_key: 'week39_exams' },
  { week: 40, trimester: 3, baby_size_cm: 51.2, baby_weight_g: 3462, size_comparison_key: 'week40_size', development_key: 'week40_dev', maternal_tips_key: 'week40_tips', recommended_exams_key: 'week40_exams' },
];

/**
 * Returns pregnancy week data for a given week number (1-40).
 */
export function getPregnancyWeekData(week: number): PregnancyWeekData | null {
  if (week < 1 || week > 40) return null;
  return PREGNANCY_WEEKS[week - 1] ?? null;
}
