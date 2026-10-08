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
