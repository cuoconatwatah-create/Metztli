#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Metztli — Paso 7: ver la base de datos del servidor (solo lectura)
#
# Se ejecuta DENTRO de la VM, o desde Azure Cloud Shell SIN abrir el SSH:
#
#   az vm run-command invoke -g metztli-rg -n metztli-vm --command-id RunShellScript \
#     --scripts "bash /opt/metztli-src/infra/azure/7-ver-base.sh" --query "value[0].message" -o tsv
#
# Muestra qué hay guardado sin exponer datos de salud: de las tablas de salud solo cuenta filas;
# los correos salen enmascarados.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

psql_ro() { sudo docker exec -i supabase-db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -P pager=off "$@"; }

echo "═══ PostgreSQL ═══"
psql_ro -tAc "select split_part(version(), ' on ', 1)"
echo
echo "═══ Tablas y filas ═══"
psql_ro -c "
SELECT table_name AS tabla,
       (xpath('/row/c/text()', query_to_xml('select count(*) as c from public.'||table_name, false, true, '')))[1]::text::int AS filas
FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY 1;"

echo "═══ Cuentas (correo enmascarado) ═══"
psql_ro -c "
SELECT left(u.email, 2) || '***@' || split_part(u.email, '@', 2) AS cuenta,
       r.role AS rol,
       CASE WHEN u.email_confirmed_at IS NULL THEN 'no' ELSE 'sí' END AS confirmada,
       to_char(u.created_at, 'DD/MM HH24:MI') AS creada
FROM auth.users u LEFT JOIN public.user_roles r ON r.user_id = u.id ORDER BY u.created_at;"

echo "═══ Versiones de la app publicadas ═══"
psql_ro -c "
SELECT platform AS plataforma, version, round(file_size/1048576.0, 1) AS mb, is_current AS actual,
       to_char(created_at, 'DD/MM HH24:MI') AS publicada
FROM public.app_releases ORDER BY created_at DESC;"

echo "═══ Solicitudes de demo (sin datos personales) ═══"
psql_ro -c "
SELECT status AS estado, count(*) AS solicitudes, max(to_char(created_at, 'DD/MM HH24:MI')) AS ultima
FROM public.demo_requests GROUP BY status ORDER BY 1;"

echo "═══ Bitácora: últimas 5 acciones del personal ═══"
psql_ro -c "
SELECT to_char(created_at, 'DD/MM HH24:MI') AS cuando, actor_role AS rol, action AS accion, target_table AS tabla
FROM public.audit_log ORDER BY id DESC LIMIT 5;"
