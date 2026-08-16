// ─────────────────────────────────────────────────────────
// Metztli 2.0 — Core Type Definitions
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

export interface DailyLog {
  id: number;
  log_date: string;
  mode: LifeStageMode;
  flow_level: FlowLevel | null;
  pain_level: number | null;
  pregnancy_symptoms: PregnancySymptom[] | null;
  mood: MoodType | null;
  symptoms_json: string[] | null;
  notes: string | null;
}

export interface KickCounterLog {
  id: number;
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
