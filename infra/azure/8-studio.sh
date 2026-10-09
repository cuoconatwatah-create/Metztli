#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Metztli — Paso 8: ver la base de datos con Supabase Studio (la misma web de supabase.com)
#
# Studio ya está instalado en el servidor, pero NO se expone a internet. Este script lo enciende
# o apaga en una dirección aparte, protegida con usuario y contraseña:
#
#   bash /opt/metztli-src/infra/azure/8-studio.sh on       # enciende:  https://studio.<IP>.sslip.io
#   bash /opt/metztli-src/infra/azure/8-studio.sh off      # apaga (déjalo apagado cuando no lo uses)
#   bash /opt/metztli-src/infra/azure/8-studio.sh estado
#
# Sin SSH, desde Azure Cloud Shell:
#   az vm run-command invoke -g metztli-rg -n metztli-vm --command-id RunShellScript \
#     --scripts "bash /opt/metztli-src/infra/azure/8-studio.sh on" --query "value[0].message" -o tsv
#
# Usuario y contraseña: están en /opt/metztli-supabase/.env (DASHBOARD_USERNAME y DASHBOARD_PASSWORD).
#   Para verlas:  MOSTRAR=1 bash /opt/metztli-src/infra/azure/8-studio.sh on
# Seguridad: al encender, el script comprueba que la dirección PIDE contraseña (HTTP 401). Si no la
# pidiera, se apaga solo. Studio puede modificar y borrar datos: apágalo al terminar.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE=/opt/metztli-supabase
CF="$BASE/Caddyfile"
BEGIN="# >>> studio"
END="# <<< studio"
DOCKER="sudo docker"

getenv() { grep "^$1=" "$BASE/.env" | head -1 | cut -d= -f2-; }
HOST="$(getenv API_EXTERNAL_URL | sed 's#https://##')"
STUDIO="studio.$HOST"

quitar_bloque() { sed -i "/$BEGIN/,/$END/d" "$CF"; }
reiniciar_caddy() {
  $DOCKER run --rm -v "$CF:/etc/caddy/Caddyfile:ro" caddy:2 caddy validate --config /etc/caddy/Caddyfile >/dev/null
  $DOCKER restart caddy >/dev/null
}

case "${1:-estado}" in
  on)
    quitar_bloque
    cat >> "$CF" <<EOF
$BEGIN
$STUDIO {
  reverse_proxy 127.0.0.1:8000 {
    flush_interval -1
  }
}
$END
EOF
    touch "$BASE/studio.on"
    reiniciar_caddy
    echo "▶ Esperando el certificado HTTPS de $STUDIO …"
    CODE=000
    for i in $(seq 1 20); do
      CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "https://$STUDIO/" || true)"
      [ "$CODE" != "000" ] && break
      sleep 3
    done
    if [ "$CODE" = "401" ]; then
      echo "✓ Studio encendido y protegido con contraseña (HTTP 401 sin credenciales)."
      echo "  Dirección: https://$STUDIO"
      echo "  Usuario  : $(getenv DASHBOARD_USERNAME)"
      if [ "${MOSTRAR:-0}" = "1" ]; then
        echo "  Contraseña: $(getenv DASHBOARD_PASSWORD)"
      else
        echo "  Contraseña: está en $BASE/.env (para verla: MOSTRAR=1 bash $0 on)"
      fi
      echo "  ⚠ Apágalo al terminar:  bash $0 off"
    elif [ "$CODE" = "000" ]; then
      echo "⚠ El certificado aún no está listo; vuelve a probar en un minuto: https://$STUDIO"
    else
      echo "✗ La dirección respondió HTTP $CODE en vez de pedir contraseña (401). Se apaga por seguridad."
      quitar_bloque; rm -f "$BASE/studio.on"; reiniciar_caddy
      exit 1
    fi
    ;;
  off)
    quitar_bloque
    rm -f "$BASE/studio.on"
    reiniciar_caddy
    echo "✓ Studio apagado. https://$STUDIO ya no responde."
    ;;
  estado)
    if grep -q "$BEGIN" "$CF" 2>/dev/null; then echo "Studio: ENCENDIDO  → https://$STUDIO"; else echo "Studio: apagado"; fi
    ;;
  *) echo "Uso: bash 8-studio.sh on|off|estado"; exit 1 ;;
esac
