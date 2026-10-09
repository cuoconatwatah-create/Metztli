-- ─────────────────────────────────────────────────────────────────────────────
-- Metztli — Landing page, solicitudes de demo y versiones instalables (APK)
--
--   demo_requests : cualquiera puede ENVIAR una solicitud; solo el Administrador
--                   las ve y gestiona.
--   app_releases  : las versiones de la app (APK, etc.). Cualquiera puede LEER cuál
--                   es la actual (para el botón de descarga); solo el Administrador
--                   las agrega o cambia.
--   storage       : bucket público "app-releases" para los archivos; solo el
--                   Administrador sube o borra.
--
-- Usa my_role() y la bitácora de la migración 006. Es seguro ejecutarla dos veces.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Solicitudes de demo ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  email TEXT NOT NULL CHECK (char_length(email) <= 200 AND email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  organization TEXT CHECK (char_length(organization) <= 160),
  message TEXT CHECK (char_length(message) <= 1000),
  accepted_privacy BOOLEAN NOT NULL DEFAULT FALSE CHECK (accepted_privacy),
  status TEXT NOT NULL DEFAULT 'nueva' CHECK (status IN ('nueva', 'contactada', 'demo_realizada', 'descartada')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS demo_requests_status_idx ON demo_requests (status, created_at DESC);

ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can request a demo" ON demo_requests;
CREATE POLICY "Anyone can request a demo" ON demo_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'nueva' AND accepted_privacy);

DROP POLICY IF EXISTS "Admin reads demo requests" ON demo_requests;
CREATE POLICY "Admin reads demo requests" ON demo_requests
  FOR SELECT TO authenticated USING (public.my_role() = 'admin');

DROP POLICY IF EXISTS "Admin updates demo requests" ON demo_requests;
CREATE POLICY "Admin updates demo requests" ON demo_requests
  FOR UPDATE TO authenticated USING (public.my_role() = 'admin') WITH CHECK (public.my_role() = 'admin');

DROP POLICY IF EXISTS "Admin deletes demo requests" ON demo_requests;
CREATE POLICY "Admin deletes demo requests" ON demo_requests
  FOR DELETE TO authenticated USING (public.my_role() = 'admin');

-- Nadie anónimo lee ni cambia solicitudes; solo puede crearlas
REVOKE SELECT, UPDATE, DELETE ON demo_requests FROM anon;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS demo_requests_touch ON demo_requests;
CREATE TRIGGER demo_requests_touch BEFORE UPDATE ON demo_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── Versiones de la app ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('android', 'windows', 'macos', 'ios')),
  version TEXT NOT NULL CHECK (char_length(version) BETWEEN 1 AND 30),
  file_path TEXT CHECK (char_length(file_path) <= 300),   -- ruta dentro del bucket (si se subió el archivo)
  download_url TEXT CHECK (char_length(download_url) <= 500),
  file_size BIGINT CHECK (file_size >= 0),
  notes TEXT CHECK (char_length(notes) <= 1000),
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CHECK (file_path IS NOT NULL OR download_url IS NOT NULL)
);
-- Solo una versión actual por plataforma
CREATE UNIQUE INDEX IF NOT EXISTS app_releases_one_current ON app_releases (platform) WHERE is_current;

ALTER TABLE app_releases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads releases" ON app_releases;
CREATE POLICY "Anyone reads releases" ON app_releases
  FOR SELECT TO anon, authenticated USING (TRUE);

DROP POLICY IF EXISTS "Admin writes releases" ON app_releases;
CREATE POLICY "Admin writes releases" ON app_releases
  FOR ALL TO authenticated USING (public.my_role() = 'admin') WITH CHECK (public.my_role() = 'admin');

REVOKE INSERT, UPDATE, DELETE ON app_releases FROM anon;

-- Marca una versión como la actual (y quita la marca a la anterior) en una sola operación
CREATE OR REPLACE FUNCTION public.set_current_release(rel UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plat TEXT;
BEGIN
  IF public.my_role() <> 'admin' THEN
    RAISE EXCEPTION 'Solo una administradora puede publicar versiones' USING ERRCODE = '42501';
  END IF;
  SELECT platform INTO plat FROM app_releases WHERE id = rel;
  IF plat IS NULL THEN
    RAISE EXCEPTION 'La versión no existe' USING ERRCODE = 'P0002';
  END IF;
  UPDATE app_releases SET is_current = FALSE WHERE platform = plat AND is_current;
  UPDATE app_releases SET is_current = TRUE WHERE id = rel;
END;
$$;
REVOKE ALL ON FUNCTION public.set_current_release(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_current_release(UUID) TO authenticated;

-- ── Bitácora (sin datos personales: nunca se copian nombre, correo ni mensaje) ──
CREATE OR REPLACE FUNCTION public.log_audit_landing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN rec := to_jsonb(OLD); ELSE rec := to_jsonb(NEW); END IF;
  -- Enviar una solicitud la hace cualquiera: no se registra, solo el trabajo del personal
  IF TG_TABLE_NAME = 'demo_requests' AND TG_OP = 'INSERT' THEN RETURN NEW; END IF;
  INSERT INTO public.audit_log (actor_id, actor_role, action, target_table, target_id, details)
  VALUES (
    auth.uid(),
    public.my_role(),
    TG_OP,
    TG_TABLE_NAME,
    rec ->> 'id',
    CASE TG_TABLE_NAME
      WHEN 'demo_requests' THEN jsonb_build_object('status', rec ->> 'status')
      ELSE jsonb_build_object('platform', rec ->> 'platform', 'version', rec ->> 'version', 'current', rec ->> 'is_current')
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;
REVOKE ALL ON FUNCTION public.log_audit_landing() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS audit_demo_requests ON demo_requests;
CREATE TRIGGER audit_demo_requests AFTER UPDATE OR DELETE ON demo_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_landing();
DROP TRIGGER IF EXISTS audit_app_releases ON app_releases;
CREATE TRIGGER audit_app_releases AFTER INSERT OR UPDATE OR DELETE ON app_releases
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_landing();

-- ── Almacenamiento de los instalables ────────────────────────────────────────
-- Solo si existe el servicio de almacenamiento (Supabase lo trae; la base de pruebas no).
DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit)
    VALUES ('app-releases', 'app-releases', TRUE, 314572800)
    ON CONFLICT (id) DO UPDATE SET public = TRUE, file_size_limit = 314572800;

    EXECUTE 'DROP POLICY IF EXISTS "Admin manages release files" ON storage.objects';
    EXECUTE $p$
      CREATE POLICY "Admin manages release files" ON storage.objects
        FOR ALL TO authenticated
        USING (bucket_id = 'app-releases' AND public.my_role() = 'admin')
        WITH CHECK (bucket_id = 'app-releases' AND public.my_role() = 'admin')
    $p$;
  END IF;
END
$$;
