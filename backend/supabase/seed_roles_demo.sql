-- ─────────────────────────────────────────────────────────
-- Metztli — Asignar los primeros roles (Administradora y Auditora)
--
-- Todas las cuentas nuevas nacen como "user". La PRIMERA administradora no puede
-- nombrarse desde la app (nadie tendría permiso), así que se hace una vez aquí,
-- como dueña del proyecto. Después, ella asigna el resto desde el Panel de
-- administración de la app.
--
-- 1) En la app crea las cuentas (por ejemplo admin@..., auditora@..., usuaria@...)
--    y confirma sus correos.
-- 2) Cambia los correos de abajo y ejecuta este archivo en Supabase → SQL Editor.
-- ─────────────────────────────────────────────────────────

UPDATE user_roles
   SET role = 'admin', assigned_at = timezone('utc'::text, now())
 WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@tu-dominio.com');

UPDATE user_roles
   SET role = 'auditor', assigned_at = timezone('utc'::text, now())
 WHERE user_id = (SELECT id FROM auth.users WHERE email = 'auditora@tu-dominio.com');

-- Comprobar el resultado
SELECT u.email, r.role, r.assigned_at
  FROM auth.users u
  JOIN user_roles r ON r.user_id = u.id
 ORDER BY r.role, u.email;
