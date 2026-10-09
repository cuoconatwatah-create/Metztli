#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Metztli — Paso 4: crear la cuenta de Administrador para el panel del equipo
#
# Se ejecuta DENTRO de la VM, después de 2-instalar-servidor.sh:
#
#   bash /opt/metztli-src/infra/azure/4-crear-admin.sh tu@correo.com
#
# Pide la contraseña sin mostrarla (mínimo 8 caracteres). Crea la cuenta ya
# confirmada y le da el rol "admin". Con ella entras a https://<tu-ip>.sslip.io/admin.html
# Es seguro repetirlo: si la cuenta ya existe, solo le asigna el rol.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE=/opt/metztli-supabase
EMAIL="${1:-}"
if [ -z "$EMAIL" ]; then echo "Uso: bash 4-crear-admin.sh correo@ejemplo.com"; exit 1; fi

getenv() { grep "^$1=" "$BASE/.env" | head -1 | cut -d= -f2-; }
SERVICE_KEY="$(getenv SERVICE_ROLE_KEY)"
HOST="$(getenv API_EXTERNAL_URL | sed 's#https://##')"

read -r -s -p "Contraseña para $EMAIL (mínimo 8 caracteres): " PASS; echo
if [ "${#PASS}" -lt 8 ]; then echo "La contraseña es demasiado corta."; exit 1; fi

# Crear la cuenta con la API de administración de Auth (la clave de servicio nunca sale de la VM)
BODY="$(ADM_EMAIL="$EMAIL" ADM_PASS="$PASS" python3 -c 'import json,os; print(json.dumps({"email": os.environ["ADM_EMAIL"], "password": os.environ["ADM_PASS"], "email_confirm": True}))')"
CODE="$(curl -s -o /tmp/crear-admin.json -w '%{http_code}' -X POST "http://127.0.0.1:8000/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" -H "Content-Type: application/json" -d "$BODY")"
unset PASS BODY

if [ "$CODE" = "200" ] || [ "$CODE" = "201" ]; then
  echo "✓ Cuenta creada"
elif grep -qi "already" /tmp/crear-admin.json 2>/dev/null; then
  echo "• La cuenta ya existía; solo se le asigna el rol."
else
  echo "✗ No se pudo crear la cuenta (HTTP $CODE):"; cat /tmp/crear-admin.json; echo; exit 1
fi
rm -f /tmp/crear-admin.json

# Rol de administrador (como dueño de la base, igual que seed_roles_demo.sql)
sudo docker exec -i supabase-db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -v email="$EMAIL" <<'SQL'
UPDATE public.user_roles
SET role = 'admin', assigned_at = now()
WHERE user_id = (SELECT id FROM auth.users WHERE lower(email) = lower(:'email'));
SELECT u.email, r.role FROM auth.users u JOIN public.user_roles r ON r.user_id = u.id WHERE lower(u.email) = lower(:'email');
SQL

echo
echo "Listo. Entra con ese correo en: https://$HOST/admin.html"
