-- ─────────────────────────────────────────────────────────
-- Metztli — Registro diario normalizado (2FN) para Supabase
--
-- Espeja el esquema local de SQLite (frontend/src/db/schema.ts). Todavía no hay
-- conexión con Supabase: este archivo queda listo para aplicarse con
--   supabase db push
-- La clave natural (user_id, log_date) permite sincronizar sin local_uuid.
-- ─────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Historial de ciclos (alimenta las predicciones de la Brújula Lunar)
CREATE TABLE IF NOT EXISTS cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  cycle_length INTEGER NOT NULL DEFAULT 28 CHECK (cycle_length > 0),
  period_length INTEGER NOT NULL DEFAULT 5 CHECK (period_length > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, start_date)
);

-- Catálogo de síntomas (lectura pública, solo administradores escriben)
CREATE TABLE IF NOT EXISTS symptoms (
  code TEXT PRIMARY KEY,
  label_key TEXT NOT NULL
);

-- Registro diario: un renglón por usuaria y fecha, solo atributos atómicos
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('cycle', 'pregnancy', 'menopause')),
  flow_level TEXT CHECK (flow_level IN ('none', 'spotting', 'medium', 'heavy')),
  flow_color TEXT,
  flow_intensity TEXT,
  mucus TEXT,
  pain_level INTEGER CHECK (pain_level BETWEEN 0 AND 5),
  mood TEXT,
  vitality INTEGER CHECK (vitality BETWEEN 1 AND 5),
  discomfort INTEGER CHECK (discomfort BETWEEN 1 AND 5),
  weather TEXT,
  sleep_hours NUMERIC(4, 1) CHECK (sleep_hours BETWEEN 0 AND 24),
  movement_min INTEGER CHECK (movement_min >= 0),
  water_glasses INTEGER CHECK (water_glasses >= 0),
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, log_date)
);

-- Síntomas de cada registro (N:M, clave compuesta sin atributos extra → 2FN)
CREATE TABLE IF NOT EXISTS daily_log_symptoms (
  daily_log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  symptom_code TEXT NOT NULL REFERENCES symptoms(code),
  PRIMARY KEY (daily_log_id, symptom_code)
);
CREATE INDEX IF NOT EXISTS idx_daily_log_symptoms_code ON daily_log_symptoms(symptom_code);

-- Micro-hábitos cumplidos en el día
CREATE TABLE IF NOT EXISTS daily_log_habits (
  daily_log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  habit_code TEXT NOT NULL,
  PRIMARY KEY (daily_log_id, habit_code)
);

-- ── Row Level Security: los datos íntimos solo los ve su dueña ──
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_log_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_log_habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Symptoms Read" ON symptoms FOR SELECT USING (true);

CREATE POLICY "Own cycles" ON cycles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Own daily logs" ON daily_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Own daily log symptoms" ON daily_log_symptoms
  FOR ALL
  USING (EXISTS (SELECT 1 FROM daily_logs d WHERE d.id = daily_log_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM daily_logs d WHERE d.id = daily_log_id AND d.user_id = auth.uid()));

CREATE POLICY "Own daily log habits" ON daily_log_habits
  FOR ALL
  USING (EXISTS (SELECT 1 FROM daily_logs d WHERE d.id = daily_log_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM daily_logs d WHERE d.id = daily_log_id AND d.user_id = auth.uid()));

-- ── Catálogo inicial de síntomas (mismos códigos que SQLite) ──
INSERT INTO symptoms (code, label_key) VALUES
  ('nausea', 'symptoms.nausea'), ('fatigue', 'symptoms.fatigue'), ('swelling', 'symptoms.swelling'),
  ('kicks', 'symptoms.kicks'), ('backPain', 'symptoms.backPain'), ('headache', 'symptoms.headache'),
  ('cramps', 'symptoms.cramps'), ('dizziness', 'symptoms.dizziness'), ('bloating', 'symptoms.bloating'),
  ('breastTenderness', 'symptoms.breastTenderness'), ('acne', 'symptoms.acne'), ('insomnia', 'symptoms.insomnia'),
  ('hotFlashes', 'symptoms.hotFlashes'), ('mood_sensitive', 'symptoms.mood_sensitive'), ('mood_low', 'symptoms.mood_low'),
  ('sadness', 'symptoms.sadness'), ('low_energy', 'symptoms.low_energy'), ('heavy_flow', 'symptoms.heavy_flow'),
  ('tender_breasts', 'symptoms.tender_breasts'), ('sweet_cravings', 'symptoms.sweet_cravings'),
  ('body_image', 'symptoms.body_image'), ('mental_load', 'symptoms.mental_load'),
  ('disabling_pain', 'symptoms.disabling_pain')
ON CONFLICT (code) DO NOTHING;
