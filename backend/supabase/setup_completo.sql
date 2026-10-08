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

-- ===== migrations/20240101000004_stages_pregnancy.sql =====
-- ─────────────────────────────────────────────────────────
-- Metztli — Etapas separadas: perfil, embarazo, controles y pataditas
--
-- Espeja el esquema v3 de SQLite (frontend/src/db/pregnancySchema.ts).
--   profiles ──< (1:1 con auth.users) etapa activa e idioma
--   pregnancies ──< prenatal_checkups
--   pregnancies ──< kick_sessions
-- 2FN: todas las tablas tienen clave simple (uuid) y ningún atributo depende
-- de media clave. La fecha probable de parto no se guarda: es FUM + 280 días.
-- Los datos son opcionales: solo se suben si la usuaria activa el respaldo.
-- ─────────────────────────────────────────────────────────

-- ── Perfil (etapa activa e idioma, creado automáticamente al registrarse) ──
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT CHECK (display_name IS NULL OR char_length(display_name) <= 80),
  current_stage TEXT NOT NULL DEFAULT 'cycle' CHECK (current_stage IN ('cycle', 'pregnancy', 'menopause')),
  language TEXT NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'miskitu', 'creole')),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, LEFT(NEW.raw_user_meta_data ->> 'display_name', 80))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Usuarias que ya existían antes de este trigger
INSERT INTO profiles (user_id, display_name)
SELECT id, LEFT(raw_user_meta_data ->> 'display_name', 80) FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ── Embarazos ──
CREATE TABLE IF NOT EXISTS pregnancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lmp_date DATE NOT NULL,
  lmp_estimated BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  ended_on DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, lmp_date),
  CHECK (status = 'ended' OR ended_on IS NULL)
);
-- Un solo embarazo activo por usuaria
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_pregnancy ON pregnancies (user_id) WHERE status = 'active';

-- ── Controles prenatales ──
CREATE TABLE IF NOT EXISTS prenatal_checkups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pregnancy_id UUID NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
  local_uuid TEXT NOT NULL,
  checkup_date DATE NOT NULL,
  kind TEXT NOT NULL DEFAULT 'control' CHECK (kind IN ('control', 'ecografia', 'laboratorio', 'otro')),
  place TEXT CHECK (place IS NULL OR char_length(place) <= 120),
  weight_kg NUMERIC(5, 1) CHECK (weight_kg IS NULL OR weight_kg BETWEEN 20 AND 300),
  bp_systolic INTEGER CHECK (bp_systolic IS NULL OR bp_systolic BETWEEN 50 AND 260),
  bp_diastolic INTEGER CHECK (bp_diastolic IS NULL OR bp_diastolic BETWEEN 30 AND 160),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 1000),
  done BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (pregnancy_id, local_uuid)
);
CREATE INDEX IF NOT EXISTS idx_checkups_pregnancy_date ON prenatal_checkups (pregnancy_id, checkup_date);

-- ── Sesiones del contador de pataditas ──
CREATE TABLE IF NOT EXISTS kick_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pregnancy_id UUID NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
  local_uuid TEXT NOT NULL,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  kick_count INTEGER NOT NULL CHECK (kick_count >= 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 0),
  UNIQUE (pregnancy_id, local_uuid)
);
CREATE INDEX IF NOT EXISTS idx_kick_sessions_pregnancy ON kick_sessions (pregnancy_id, session_date DESC);

-- ── Row Level Security: solo la dueña ve y modifica sus datos ──
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregnancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE prenatal_checkups ENABLE ROW LEVEL SECURITY;
ALTER TABLE kick_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own profile" ON profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Own pregnancies" ON pregnancies
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Own prenatal checkups" ON prenatal_checkups
  FOR ALL
  USING (EXISTS (SELECT 1 FROM pregnancies p WHERE p.id = pregnancy_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM pregnancies p WHERE p.id = pregnancy_id AND p.user_id = auth.uid()));

CREATE POLICY "Own kick sessions" ON kick_sessions
  FOR ALL
  USING (EXISTS (SELECT 1 FROM pregnancies p WHERE p.id = pregnancy_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM pregnancies p WHERE p.id = pregnancy_id AND p.user_id = auth.uid()));

-- ===== migrations/20240101000005_myth_c5.sql =====
-- Nuevo mito del Desmitificador (con audios en Mískitu dentro de la app: assets/audio/miskitu/c5_*.ogg)
INSERT INTO myths (id, category, myth, reality) VALUES
('c5', 'ciclo',
 'Las mujeres que están menstruando no deben cocinar ni preparar alimentos porque pueden dañarlos o hacer que se descompongan.',
 'La menstruación es un proceso biológico natural del cuerpo femenino y no afecta la calidad de los alimentos ni la capacidad de una mujer para cocinar, trabajar, estudiar o participar en actividades comunitarias. No existe ninguna evidencia científica que demuestre que una mujer menstruando pueda dañar los alimentos o alterar su preparación. Estas creencias forman parte de mitos y tradiciones culturales transmitidas de generación en generación.')
ON CONFLICT (id) DO NOTHING;

-- ===== migrations/20240101000006_roles_audit.sql =====
-- ─────────────────────────────────────────────────────────
-- Metztli — Roles (Administradora, Usuaria, Auditora) y bitácora de auditoría
--
--   user_roles : 1 fila por cuenta con su rol (por defecto 'user').
--   audit_log  : bitácora de solo escritura de las acciones del personal.
--
-- Principios:
--  · El rol se aplica en la base (RLS + funciones), no solo en la app.
--  · Nadie cambia roles con UPDATE directo: solo la función set_user_role(),
--    que exige ser administradora y deja rastro en audit_log.
--  · Ningún rol puede leer datos íntimos de otras usuarias (ciclos, embarazo,
--    registros diarios): esas tablas siguen siendo "solo la dueña".
--  · La auditora es de solo lectura; ve la bitácora y estadísticas agregadas.
-- ─────────────────────────────────────────────────────────

-- ── Roles ──
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'auditor')),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Rol de quien hace la consulta ('anon' si no hay sesión)
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN 'anon'
    ELSE COALESCE((SELECT role FROM public.user_roles WHERE user_id = auth.uid()), 'user')
  END;
$$;
REVOKE ALL ON FUNCTION public.my_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_role() TO anon, authenticated;

-- Cuentas nuevas: perfil + rol 'user' (reemplaza la función de la migración 004)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, LEFT(NEW.raw_user_meta_data ->> 'display_name', 80))
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Cuentas que ya existían
INSERT INTO user_roles (user_id, role) SELECT id, 'user' FROM auth.users ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Cada quien ve su propio rol; el personal (admin y auditoría) ve todos
CREATE POLICY "Read own role, staff reads all" ON user_roles
  FOR SELECT USING (user_id = auth.uid() OR public.my_role() IN ('admin', 'auditor'));

-- Sin políticas de escritura: solo set_user_role() (SECURITY DEFINER) puede cambiar roles
REVOKE INSERT, UPDATE, DELETE ON user_roles FROM anon, authenticated;

-- ── Bitácora de auditoría (solo se agrega; no se edita ni se borra) ──
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID,
  actor_role TEXT,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log (created_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff reads audit log" ON audit_log
  FOR SELECT USING (public.my_role() IN ('admin', 'auditor'));
REVOKE INSERT, UPDATE, DELETE ON audit_log FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.audit_log_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log es de solo escritura' USING ERRCODE = '42501';
END;
$$;
DROP TRIGGER IF EXISTS audit_log_no_change ON audit_log;
CREATE TRIGGER audit_log_no_change
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_immutable();

-- Registra quién hizo qué (sin copiar datos personales)
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN rec := to_jsonb(OLD); ELSE rec := to_jsonb(NEW); END IF;
  INSERT INTO public.audit_log (actor_id, actor_role, action, target_table, target_id, details)
  VALUES (
    auth.uid(),
    public.my_role(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(rec ->> 'id', rec ->> 'user_id'),
    CASE TG_TABLE_NAME
      WHEN 'forum_posts' THEN jsonb_build_object('alias', rec ->> 'alias', 'category', rec ->> 'category')
      WHEN 'user_roles' THEN jsonb_build_object('role', rec ->> 'role')
      WHEN 'myths' THEN jsonb_build_object('category', rec ->> 'category', 'myth', LEFT(rec ->> 'myth', 80))
      ELSE jsonb_build_object('name', rec ->> 'institution_name', 'municipality', rec ->> 'municipality')
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;
REVOKE ALL ON FUNCTION public.log_audit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS audit_forum_moderation ON forum_posts;
CREATE TRIGGER audit_forum_moderation AFTER DELETE ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();
DROP TRIGGER IF EXISTS audit_role_changes ON user_roles;
CREATE TRIGGER audit_role_changes AFTER UPDATE OR DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();
DROP TRIGGER IF EXISTS audit_myths ON myths;
CREATE TRIGGER audit_myths AFTER INSERT OR UPDATE OR DELETE ON myths
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();
DROP TRIGGER IF EXISTS audit_directory ON directory_contacts;
CREATE TRIGGER audit_directory AFTER INSERT OR UPDATE OR DELETE ON directory_contacts
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- ── Permisos de la administradora sobre el contenido comunitario ──
CREATE POLICY "Admin moderates forum" ON forum_posts
  FOR DELETE USING (public.my_role() = 'admin');
CREATE POLICY "Admin manages myths" ON myths
  FOR ALL USING (public.my_role() = 'admin') WITH CHECK (public.my_role() = 'admin');
CREATE POLICY "Admin manages directory" ON directory_contacts
  FOR ALL USING (public.my_role() = 'admin') WITH CHECK (public.my_role() = 'admin');

-- ── Funciones del panel ──

-- Cambiar el rol de una cuenta (solo administradora)
CREATE OR REPLACE FUNCTION public.set_user_role(target UUID, new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.my_role() <> 'admin' THEN
    RAISE EXCEPTION 'Solo una administradora puede cambiar roles' USING ERRCODE = '42501';
  END IF;
  IF new_role NOT IN ('admin', 'user', 'auditor') THEN
    RAISE EXCEPTION 'Rol inválido: %', new_role USING ERRCODE = '22023';
  END IF;
  IF target = auth.uid() AND new_role <> 'admin' THEN
    RAISE EXCEPTION 'No puedes quitarte a ti misma el rol de administradora' USING ERRCODE = '42501';
  END IF;

  UPDATE public.user_roles
     SET role = new_role, assigned_by = auth.uid(), assigned_at = timezone('utc'::text, now())
   WHERE user_id = target;
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, role, assigned_by) VALUES (target, new_role, auth.uid());
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.set_user_role(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, TEXT) TO authenticated;

-- Lista de cuentas para asignar roles (correo enmascarado; sin datos de salud)
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (uid UUID, name TEXT, email_masked TEXT, user_role TEXT, joined_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.my_role() <> 'admin' THEN
    RAISE EXCEPTION 'Solo una administradora puede ver las cuentas' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT u.id,
           p.display_name,
           regexp_replace(COALESCE(u.email, ''), '^(.).*(@.*)$', '\1***\2'),
           COALESCE(r.role, 'user'),
           u.created_at
      FROM auth.users u
      LEFT JOIN public.profiles p ON p.user_id = u.id
      LEFT JOIN public.user_roles r ON r.user_id = u.id
     ORDER BY u.created_at DESC
     LIMIT 200;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- Estadísticas agregadas para auditoría (solo conteos; nunca datos por persona)
CREATE OR REPLACE FUNCTION public.audit_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.my_role() NOT IN ('admin', 'auditor') THEN
    RAISE EXCEPTION 'Solo el personal de auditoría puede ver estas estadísticas' USING ERRCODE = '42501';
  END IF;
  RETURN jsonb_build_object(
    'users_total', (SELECT count(*) FROM auth.users),
    'by_role', (SELECT COALESCE(jsonb_object_agg(role, n), '{}'::jsonb) FROM (SELECT role, count(*) AS n FROM public.user_roles GROUP BY role) t),
    'forum_posts', (SELECT count(*) FROM public.forum_posts),
    'myths', (SELECT count(*) FROM public.myths),
    'daily_logs', (SELECT count(*) FROM public.daily_logs),
    'pregnancies_active', (SELECT count(*) FROM public.pregnancies WHERE status = 'active'),
    'audit_events', (SELECT count(*) FROM public.audit_log),
    'generated_at', timezone('utc'::text, now())
  );
END;
$$;
REVOKE ALL ON FUNCTION public.audit_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.audit_stats() TO authenticated;

