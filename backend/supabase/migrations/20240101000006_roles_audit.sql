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
