// ─────────────────────────────────────────────────────────
// Metztli — Core Type Definitions
// ─────────────────────────────────────────────────────────

/** Modos de etapa de vida disponibles */
export type LifeStageMode = 'cycle' | 'pregnancy' | 'menopause';

/** Niveles de flujo menstrual */
export type FlowLevel = 'none' | 'spotting' | 'medium' | 'heavy';

/** Estados de ánimo */
export type MoodType = 'calm' | 'sensitive' | 'energetic' | 'low';

/** Síntomas de embarazo */
export type PregnancySymptom =
  | 'nausea'
  | 'fatigue'
  | 'swelling'
  | 'kicks'
  | 'backPain'
  | 'headache'
  | 'cramps'
  | 'dizziness';

/** Síntomas de ciclo menstrual */
export type CycleSymptom =
  | 'cramps'
  | 'headache'
  | 'bloating'
  | 'breastTenderness'
  | 'acne'
  | 'fatigue'
  | 'backPain'
  | 'insomnia';

/** Fases del ciclo menstrual */
export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

/** Tipos de contacto de emergencia */
export type DirectoryContactType = 'casa_materna' | 'hospital_minsa' | 'ambulancia';

/** Categorías del foro comunitario */
export type ForumCategory =
  | 'ciclo_salud'
  | 'embarazo_parto'
  | 'saberes_ancestrales'
  | 'menopausia';

/** Idiomas soportados */
export type SupportedLanguage = 'es' | 'miskitu' | 'creole';

// ─────────────────────────────────────────────────────────
// Modelos de Base de Datos
// ─────────────────────────────────────────────────────────

export interface UserProfile {
  id: 1;
  current_mode: LifeStageMode;
  lmp_date: string | null;
  due_date: string | null;
}

export interface Cycle {
  id: number;
  start_date: string;
  end_date: string | null;
  cycle_length: number;
  period_length: number;
}

/** Embarazo (la fecha probable de parto se deriva: FUM + 280 días) */
export interface Pregnancy {
  id: number;
  lmp_date: string;
  lmp_estimated: 0 | 1;
  status: 'active' | 'ended';
  ended_on: string | null;
  created_at: string;
}

export type CheckupKind = 'control' | 'ecografia' | 'laboratorio' | 'otro';

/** Control prenatal (cita planeada o realizada) */
export interface PrenatalCheckup {
  id: number;
  local_uuid: string;
  pregnancy_id: number;
  checkup_date: string;
  kind: CheckupKind;
  place: string | null;
  weight_kg: number | null;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  notes: string | null;
  done: 0 | 1;
}

/**
 * Registro diario (normalizado, 2FN). Los síntomas y hábitos viven en tablas
 * hijas (daily_log_symptoms / daily_log_habits) y aquí llegan ya como listas.
 */
export interface DailyLog {
  id: number;
  log_date: string;
  mode: LifeStageMode;
  flow_level: FlowLevel | null;
  flow_color: string | null;
  flow_intensity: string | null;
  mucus: string | null;
  pain_level: number | null;
  mood: string | null;
  vitality: number | null;
  discomfort: number | null;
  weather: string | null;
  sleep_hours: number | null;
  movement_min: number | null;
  water_glasses: number | null;
  notes: string | null;
  symptoms: string[];
  habits: string[];
}

export interface KickCounterLog {
  id: number;
  pregnancy_id?: number | null;
  local_uuid?: string | null;
  session_date: string;
  kick_count: number;
  duration_minutes: number;
}

export interface DirectoryContact {
  id: number;
  municipality: string;
  institution_name: string;
  phone_number: string;
  type: DirectoryContactType;
}

export interface ForumPost {
  id: number;
  local_uuid: string;
  alias: string;
  category: ForumCategory;
  question: string;
  created_at: string;
  is_synced: number;
}

export interface OfflineFAQ {
  id: number;
  category: string;
  title_key: string;
  content_key: string;
  audio_key: string;
}

export interface Myth {
  id: string;
  category: 'ciclo' | 'embarazo' | 'menopausia';
  myth: string;
  reality: string;
}


// ─────────────────────────────────────────────────────────
// Datos de Embarazo Semana a Semana
// ─────────────────────────────────────────────────────────

export interface PregnancyWeekData {
  week: number;
  trimester: 1 | 2 | 3;
  baby_size_cm: number;
  baby_weight_g: number;
  size_comparison_key: string;
  development_key: string;
  maternal_tips_key: string;
  recommended_exams_key: string;
}

// ─────────────────────────────────────────────────────────
// Resultados de Cálculos
// ─────────────────────────────────────────────────────────

export interface CycleCalculation {
  currentDay: number;
  currentPhase: CyclePhase;
  nextPeriodDate: string;
  ovulationDate: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  cycleLength: number;
  periodLength: number;
}

export interface PregnancyCalculation {
  gestationalWeeks: number;
  gestationalDays: number;
  trimester: 1 | 2 | 3;
  dueDate: string;
  daysRemaining: number;
  progressPercent: number;
  weekData: PregnancyWeekData | null;
}

// ─────────────────────────────────────────────────────────
// Props de Componentes
// ─────────────────────────────────────────────────────────

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'carmin' | 'bosque' | 'alarm';
}

export interface AudioGuideButtonProps {
  audioKey: string;
  size?: number;
  label?: string;
}

export interface ModeSwitcherProps {
  currentMode: LifeStageMode;
  onModeChange: (mode: LifeStageMode) => void;
}

export interface MascotCompanionProps {
  stage: LifeStageMode;
  weekNumber?: number;
}

export interface SymptomGridProps {
  mode: LifeStageMode;
  selectedSymptoms: string[];
  onToggleSymptom: (symptomId: string) => void;
}

export interface KickCounterProps {
  onSessionComplete: (kickCount: number, durationMinutes: number) => void;
}

export interface AlarmCardProps {
  municipality?: string;
}

// ─────────────────────────────────────────────────────────
// BRÚJULA LUNAR (CYCLE TRACKER)
// ─────────────────────────────────────────────────────────

export type CycleFlowIntensity = 'light' | 'medium' | 'heavy' | null;

export type CycleMoodTag =
  | 'calm'
  | 'sensitive'
  | 'energetic'
  | 'low'
  | 'anxious'
  | 'focused'
  | 'irritated'
  | 'happy'
  | null;

export interface UserCycleLog {
  log_id: number;
  local_uuid: string; // Para offline-first
  date_logged: string; // YYYY-MM-DD
  flow_intensity: CycleFlowIntensity;
  cramps_level: number; // 0-5
  stress_level: number; // 0-5
  mood_tag: CycleMoodTag;
  is_synced?: number; // 0 = no, 1 = yes
}

