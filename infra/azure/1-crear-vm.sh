#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Metztli — Paso 1: crear la máquina virtual en Azure
#
# Se ejecuta en Azure Cloud Shell (Bash), que ya trae el comando `az` y no pide
# instalar nada:  https://shell.azure.com
#
#   bash 1-crear-vm.sh
#
# Variables opcionales (con su valor por defecto):
#   RG=metztli-rg  LOCATION=eastus  VM=metztli-vm  SIZE=Standard_B2s  ADMIN=azureuser
#   MY_IP=1.2.3.4   Si la pones, el puerto SSH (22) solo se abre para esa IP.
#
# Tamaño: Supabase completo pide al menos 4 GB de memoria. Standard_B2s tiene
# 2 vCPU y 4 GB. Cuando termines de usarla, apágala para no gastar crédito:
#   az vm deallocate -g metztli-rg -n metztli-vm
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

RG="${RG:-metztli-rg}"
LOCATION="${LOCATION:-eastus}"
VM="${VM:-metztli-vm}"
SIZE="${SIZE:-Standard_B2s}"
ADMIN="${ADMIN:-azureuser}"
MY_IP="${MY_IP:-}"

echo "▶ Grupo de recursos: $RG ($LOCATION)"
az group create --name "$RG" --location "$LOCATION" --output table

echo "▶ Creando la VM Ubuntu 22.04 ($SIZE). Puede tardar 1–3 minutos…"
az vm create \
  --resource-group "$RG" \
  --name "$VM" \
  --image Ubuntu2204 \
  --size "$SIZE" \
  --admin-username "$ADMIN" \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --os-disk-size-gb 64 \
  --output table

echo "▶ Abriendo los puertos 80 y 443 (web segura de la API)…"
az vm open-port --resource-group "$RG" --name "$VM" --port 80  --priority 1010 --output none
az vm open-port --resource-group "$RG" --name "$VM" --port 443 --priority 1020 --output none

if [ -n "$MY_IP" ]; then
  echo "▶ Limitando SSH (puerto 22) a tu IP: $MY_IP"
  NSG="$(az network nsg list --resource-group "$RG" --query '[0].name' --output tsv)"
  az network nsg rule update --resource-group "$RG" --nsg-name "$NSG" \
    --name default-allow-ssh --source-address-prefixes "$MY_IP/32" --output none
fi

IP="$(az vm show --show-details --resource-group "$RG" --name "$VM" --query publicIps --output tsv)"

echo
echo "════════════════════════════════════════════════════════════"
echo " VM creada"
echo "   IP pública : $IP"
echo "   Usuario    : $ADMIN"
echo "   Conectarte : ssh $ADMIN@$IP"
echo
echo " Reglas de red (puertos abiertos):"
az network nsg rule list --resource-group "$RG" \
  --nsg-name "$(az network nsg list --resource-group "$RG" --query '[0].name' --output tsv)" \
  --query '[].{Regla:name, Puerto:destinationPortRange, Acceso:access, Origen:sourceAddressPrefix}' \
  --output table
echo
echo " Siguiente paso: entra por SSH y ejecuta 2-instalar-servidor.sh"
echo "════════════════════════════════════════════════════════════"
