#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Metztli — Paso 3: mostrar las evidencias en la terminal de la VM
#
# Se ejecuta DENTRO de la VM. Imprime, en orden, lo que piden los entregables
# 2, 3 y 4 (sistema operativo, IP y puertos, lenguajes y base de datos).
# Haz una captura de pantalla de cada bloque.
#
#   bash 3-evidencias.sh
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail

BASE=/opt/metztli-supabase
title() { printf '\n\033[1;35m══ %s ══\033[0m\n' "$*"; }

title "ENTREGABLE 2 · Servidor y acceso remoto (SSH)"
echo "Servidor : $(hostname)"
echo "Usuario  : $USER"
echo "Fecha    : $(date -u +%FT%TZ)"
lsb_release -ds 2>/dev/null || cat /etc/os-release | head -2
uname -srm
echo "Conexión SSH actual: ${SSH_CONNECTION:-no se ejecuta por SSH}"
echo "Servicio SSH:"; systemctl is-active ssh 2>/dev/null || systemctl is-active sshd 2>/dev/null || true

title "ENTREGABLE 3 · Red y puertos"
PUBLIC_IP="$(curl -fsS -H Metadata:true --max-time 5 \
  'http://169.254.169.254/metadata/instance/network/interface/0/ipv4/ipAddress/0/publicIpAddress?api-version=2021-02-01&format=text' 2>/dev/null || curl -fsS --max-time 8 https://ifconfig.me)"
echo "IP pública de Azure : $PUBLIC_IP"
echo "IP privada          : $(hostname -I | awk '{print $1}')"
echo
echo "Puertos escuchando en el servidor:"
sudo ss -tlnp | awk 'NR==1 || /:(22|80|443|8000|5432) /' | sed 's/users:.*//'
echo
echo "(Las reglas de entrada que abren 22, 80 y 443 están en Azure: ejecuta en Cloud Shell"
echo " az network nsg rule list -g metztli-rg --nsg-name <nombre> -o table)"

title "ENTREGABLE 4 · Lenguajes y base de datos instalados y funcionando"
echo "Node.js : $(node -v 2>/dev/null || echo 'no instalado')   npm: $(npm -v 2>/dev/null || echo '-')"
echo "Python  : $(python3 --version 2>/dev/null || echo 'no instalado')"
echo "Docker  : $(sudo docker --version 2>/dev/null)"
echo "Compose : $(sudo docker compose version 2>/dev/null)"
echo
echo "Contenedores de Supabase:"
sudo docker ps --format 'table {{.Names}}\t{{.Status}}' | sed -n '1,30p'
echo
echo "PostgreSQL:"
sudo docker exec supabase-db psql -U supabase_admin -d postgres -tAc "select version()" 2>/dev/null | cut -c1-70
echo
echo "Tablas de Metztli en la base de datos:"
sudo docker exec supabase-db psql -U supabase_admin -d postgres -c \
  "select table_name as tabla from information_schema.tables where table_schema='public' order by 1" 2>/dev/null
echo "Filas de ejemplo (mitos sembrados):"
sudo docker exec supabase-db psql -U supabase_admin -d postgres -tAc "select count(*) || ' mitos' from public.myths" 2>/dev/null

title "ENTREGABLE 5 · La API responde en la IP pública (no en localhost)"
HOST="$(grep '^API_EXTERNAL_URL=' "$BASE/.env" 2>/dev/null | cut -d= -f2- | sed 's#https://##')"
ANON="$(grep '^ANON_KEY=' "$BASE/.env" 2>/dev/null | cut -d= -f2-)"
echo "Dirección pública de la API: https://$HOST  (resuelve a $PUBLIC_IP)"
echo "Resuelve a: $(getent hosts "$HOST" | awk '{print $1}')"
echo
echo "Respuesta de Auth desde internet:"
curl -fsS "https://$HOST/auth/v1/settings" -H "apikey: $ANON" | head -c 300; echo
echo
echo "Tabla de mitos leída por la API pública (primera fila):"
curl -fsS "https://$HOST/rest/v1/myths?select=id&limit=1" -H "apikey: $ANON" | head -c 200; echo

echo
echo "Listo. Haz una captura de cada bloque."
