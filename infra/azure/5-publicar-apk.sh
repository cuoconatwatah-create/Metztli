#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Metztli — Paso 5 (opcional): publicar un APK en el servidor desde la VM
#
# Descarga el APK de una dirección (por ejemplo, el Release de GitHub), lo sube al
# almacenamiento del servidor y lo marca como la versión actual: la landing page
# muestra de inmediato el botón de descarga. Sirve igual que el panel /admin.html,
# pero sin iniciar sesión (usa la clave interna del servidor, que nunca sale de la VM).
#
#   bash /opt/metztli-src/infra/azure/5-publicar-apk.sh 2.0.8 \
#     https://github.com/cuoconatwatah-create/Metztli/releases/download/v2.0.8/Metztli-2.0.8.apk \
#     "Notas de la versión (opcional)"
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE=/opt/metztli-supabase
VERSION="${1:-}"
URL="${2:-}"
NOTES="${3:-}"
if [ -z "$VERSION" ] || [ -z "$URL" ]; then
  echo "Uso: bash 5-publicar-apk.sh <versión> <url-del-apk> [notas]"; exit 1
fi

getenv() { grep "^$1=" "$BASE/.env" | head -1 | cut -d= -f2-; }
SERVICE_KEY="$(getenv SERVICE_ROLE_KEY)"
HOST="$(getenv API_EXTERNAL_URL | sed 's#https://##')"

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
echo "▶ Descargando $URL"
curl -fL --retry 3 --progress-bar -o "$TMP/app.apk" "$URL"
SIZE="$(stat -c %s "$TMP/app.apk")"
if ! head -c 2 "$TMP/app.apk" | grep -q '^PK'; then
  echo "✗ El archivo descargado no parece un APK (no es un zip)."; exit 1
fi
echo "   Tamaño: $SIZE bytes"

OBJECT="android/${VERSION}/Metztli-${VERSION}.apk"
echo "▶ Subiendo al almacenamiento del servidor ($OBJECT)"
curl -fsS -X POST "http://127.0.0.1:8000/storage/v1/object/app-releases/${OBJECT}" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "x-upsert: true" -H "Content-Type: application/vnd.android.package-archive" \
  --data-binary @"$TMP/app.apk" > "$TMP/upload.json"
echo "   $(cut -c1-120 "$TMP/upload.json")"

echo "▶ Registrando la versión y marcándola como la actual"
sudo docker exec -i supabase-db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 \
  -v ver="$VERSION" -v obj="$OBJECT" -v size="$SIZE" -v notes="$NOTES" <<'SQL'
DELETE FROM public.app_releases WHERE platform = 'android' AND file_path = :'obj';
UPDATE public.app_releases SET is_current = FALSE WHERE platform = 'android' AND is_current;
INSERT INTO public.app_releases (platform, version, file_path, file_size, notes, is_current)
VALUES ('android', :'ver', :'obj', :'size'::bigint, NULLIF(:'notes', ''), TRUE);
SELECT platform, version, file_size, is_current FROM public.app_releases ORDER BY created_at DESC LIMIT 3;
SQL

echo
echo "✓ Publicada. Descarga pública:"
echo "  https://$HOST/storage/v1/object/public/app-releases/${OBJECT}"
echo "  Landing: https://$HOST/"
