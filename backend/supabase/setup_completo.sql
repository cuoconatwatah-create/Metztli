-- Metztli — Instalación completa del backend (para pegar en Supabase → SQL Editor).
-- Generado a partir de supabase/migrations/*. Ejecutar UNA sola vez en un proyecto vacío.

-- ===== migrations/20240101000000_init.sql =====
﻿-- ─────────────────────────────────────────────────────────
-- Metztli — Supabase PostgreSQL Schema
-- ─────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Directorio comunitario de emergencias
CREATE TABLE IF NOT EXISTS directory_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  municipality TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Foro anónimo
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  local_uuid TEXT UNIQUE NOT NULL, -- To prevent duplicate syncs
  alias TEXT NOT NULL,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) -- Optional: if using anonymous auth
);

-- Setup Row Level Security (RLS)
ALTER TABLE directory_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

-- Everyone can read the directory
CREATE POLICY "Public Directory Read" ON directory_contacts FOR SELECT USING (true);

-- Everyone can read forum posts
CREATE POLICY "Public Forum Read" ON forum_posts FOR SELECT USING (true);

-- Authenticated (even anonymous) users can insert forum posts
CREATE POLICY "Insert Forum Posts" ON forum_posts FOR INSERT WITH CHECK (true);

-- Registro de ciclo de la usuaria (Brújula Lunar)
CREATE TABLE IF NOT EXISTS user_cycle_logs (
  log_id SERIAL PRIMARY KEY,
  local_uuid TEXT UNIQUE NOT NULL, -- Para sincronización offline-first
  date_logged DATE NOT NULL,
  flow_intensity TEXT CHECK (flow_intensity IN ('light', 'medium', 'heavy')),
  cramps_level INTEGER CHECK (cramps_level >= 0 AND cramps_level <= 5),
  stress_level INTEGER CHECK (stress_level >= 0 AND stress_level <= 5),
  mood_tag TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) -- Optional: if using auth
);

-- RLS for user_cycle_logs
ALTER TABLE user_cycle_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own cycle logs" ON user_cycle_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cycle logs" ON user_cycle_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cycle logs" ON user_cycle_logs FOR UPDATE USING (auth.uid() = user_id);
-- ===== migrations/20240101000001_myths.sql =====
-- Tabla para los Mitos y Realidades
CREATE TABLE IF NOT EXISTS myths (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('ciclo', 'embarazo', 'menopausia')),
  myth TEXT NOT NULL,
  reality TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE myths ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer los mitos
CREATE POLICY "Public Myths Read" ON myths FOR SELECT USING (true);

-- Insertar los mitos iniciales (Seed data)
INSERT INTO myths (id, category, myth, reality) VALUES
-- CICLO MENSTRUAL
('c1', 'ciclo', 'No te puedes bañar ni lavar el cabello cuando andas con la regla.', '¡Falso! Bañarse es muy importante para la higiene y comodidad. El agua no "corta" la menstruación ni causa daño.'),
('c2', 'ciclo', 'Si comes cosas ácidas como limón se te corta el periodo.', 'No hay alimentos que puedan detener tu flujo menstrual. Puedes mantener tu dieta habitual sin problemas.'),
('c3', 'ciclo', 'La sangre menstrual es sucia o tóxica.', 'La sangre menstrual es completamente natural, está compuesta de sangre, tejido del útero y agua. No es tóxica de ninguna manera.'),
('c4', 'ciclo', 'No puedes hacer ejercicio mientras estás menstruando.', 'El ejercicio leve o moderado puede incluso ayudar a reducir los cólicos menstruales al liberar endorfinas.'),

-- EMBARAZO
('e1', 'embarazo', 'Las agruras o acidez significan que el bebé nacerá con mucho cabello.', 'La acidez es causada por los cambios hormonales que relajan una válvula del estómago y por la presión que ejerce el bebé al crecer, no por su cabello.'),
('e2', 'embarazo', 'La forma de la panza (alta o baja, redonda o puntiaguda) indica el sexo del bebé.', 'La forma de la panza depende de la estructura física de la madre, el tono muscular y la posición del bebé, no de si es niño o niña.'),
('e3', 'embarazo', 'No debes tejer ni enrollar hilos, porque el cordón se le puede enredar al bebé.', 'El enredo del cordón ocurre por los movimientos del bebé dentro de la panza, ninguna actividad que hagas con tus manos puede causarlo.'),
('e4', 'embarazo', 'Cargar cosas pesadas o levantar los brazos al inicio del embarazo causa abortos.', 'El útero protege muy bien al embrión. Sin embargo, para cuidar tu espalda, es recomendable no excederse en el esfuerzo físico.'),

-- MENOPAUSIA
('m1', 'menopausia', 'Con la menopausia desaparece el deseo sexual.', 'El deseo sexual puede cambiar debido a la sequedad o a las hormonas, pero muchas mujeres disfrutan de una vida sexual plena y sin la preocupación de un embarazo.'),
('m2', 'menopausia', 'La menopausia te hace ganar peso de forma inevitable.', 'El metabolismo se vuelve más lento con la edad. El aumento de peso se previene manteniendo una alimentación saludable y ejercicio regular.'),
('m3', 'menopausia', 'La menopausia es una enfermedad que requiere tratamiento médico siempre.', 'Es una etapa natural de la vida, no una enfermedad. Solo requiere tratamiento si los síntomas (como los bochornos) afectan severamente tu calidad de vida.')
ON CONFLICT (id) DO NOTHING;

-- ===== migrations/20240101000002_daily_logs_normalized.sql =====
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

-- ===== migrations/20240101000003_forum_hardening.sql =====
-- ─────────────────────────────────────────────────────────
-- Metztli — Endurece el foro anónimo
--
-- El foro permite publicar sin cuenta (rol anon), por eso se limita lo que
-- puede insertarse: categorías válidas, textos acotados y que nadie pueda
-- publicar a nombre de otra usuaria (user_id solo puede ser NULL o el propio).
-- ─────────────────────────────────────────────────────────

ALTER TABLE forum_posts DROP CONSTRAINT IF EXISTS forum_posts_alias_len;
ALTER TABLE forum_posts ADD CONSTRAINT forum_posts_alias_len
  CHECK (char_length(alias) BETWEEN 1 AND 40);

ALTER TABLE forum_posts DROP CONSTRAINT IF EXISTS forum_posts_question_len;
ALTER TABLE forum_posts ADD CONSTRAINT forum_posts_question_len
  CHECK (char_length(question) BETWEEN 1 AND 1000);

ALTER TABLE forum_posts DROP CONSTRAINT IF EXISTS forum_posts_category_valid;
ALTER TABLE forum_posts ADD CONSTRAINT forum_posts_category_valid
  CHECK (category IN ('ciclo_salud', 'embarazo_parto', 'saberes_ancestrales', 'menopausia'));

DROP POLICY IF EXISTS "Insert Forum Posts" ON forum_posts;
CREATE POLICY "Insert Forum Posts" ON forum_posts
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts (created_at DESC);

