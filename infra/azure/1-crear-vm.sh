#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Metztli — Paso 1: crear la máquina virtual en Azure
#
# Se ejecuta en Azure Cloud Shell (Bash), que ya trae el comando `az` y no pide
# instalar nada:  https://shell.azure.com
#
#   bash 1-crear-vm.sh
#
# Las cuentas nuevas (sobre todo las de estudiante) restringen algunas regiones y
# tamaños de VM. Este script prueba varias combinaciones hasta que una funciona.
#
# Variables opcionales (con su valor por defecto):
#   RG=metztli-rg  VM=metztli-vm  ADMIN=azureuser
#   LOCATIONS="eastus2 westus3 centralus westus2 eastus brazilsouth southcentralus canadacentral"
#   SIZES="Standard_B2s Standard_B2ls_v2 Standard_B2as_v2 Standard_B2s_v2 Standard_D2s_v3"
#   MY_IP=1.2.3.4   Si la pones, el puerto SSH (22) solo se abre para esa IP.
#
# Supabase completo pide al menos 4 GB de memoria: todos los tamaños de la lista
# la tienen. Cuando termines, apaga la VM para no gastar crédito:
#   az vm deallocate -g metztli-rg -n metztli-vm
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail

RG="${RG:-metztli-rg}"
VM="${VM:-metztli-vm}"
ADMIN="${ADMIN:-azureuser}"
MY_IP="${MY_IP:-}"
LOCATIONS="${LOCATIONS:-${LOCATION:-eastus2 westus3 centralus westus2 eastus brazilsouth southcentralus canadacentral}}"
SIZES="${SIZES:-${SIZE:-Standard_B2s Standard_B2ls_v2 Standard_B2as_v2 Standard_B2s_v2 Standard_D2s_v3}}"

echo "▶ Cuenta de Azure en uso:"
az account show --query '{Suscripcion:name, Estado:state}' --output table || {
  echo "✗ No hay sesión de Azure. En Cloud Shell ya la tienes; en otra terminal ejecuta: az login"; exit 1; }

CREATED=0
for L in $LOCATIONS; do
  echo
  echo "▶ Región: $L — buscando tamaños disponibles para tu suscripción…"
  AVAILABLE="$(az vm list-skus --location "$L" --resource-type virtualMachines \
    --query "[?length(restrictions)==\`0\`].name" --output tsv 2>/dev/null || true)"
  for S in $SIZES; do
    if ! printf '%s\n' "$AVAILABLE" | grep -qx "$S"; then
      echo "   · $S no está disponible en $L"; continue
    fi
    echo "▶ Creando la VM Ubuntu 22.04 ($S) en $L. Puede tardar 1–3 minutos…"
    az group create --name "$RG" --location "$L" --output none
    if az vm create \
        --resource-group "$RG" --name "$VM" \
        --image Ubuntu2204 --size "$S" \
        --admin-username "$ADMIN" --generate-ssh-keys \
        --public-ip-sku Standard --os-disk-size-gb 64 \
        --output table; then
      CREATED=1; LOCATION="$L"; SIZE="$S"; break 2
    fi
    echo "   ✗ No se pudo con $S en $L. Limpiando y probando otra combinación…"
    az group delete --name "$RG" --yes --output none 2>/dev/null || true
  done
done

if [ "$CREATED" != "1" ]; then
  echo
  echo "✗ No se pudo crear la VM en ninguna combinación. Lo más probable es que tu suscripción"
  echo "  restrinja las regiones. Mira cuáles permite y pásalas así:"
  echo "    az policy assignment list --query \"[].parameters.listOfAllowedLocations.value\" -o tsv"
  echo "    LOCATIONS=\"region1 region2\" bash 1-crear-vm.sh"
  exit 1
fi

echo "▶ Abriendo los puertos 80 y 443 (web segura de la API)…"
az vm open-port --resource-group "$RG" --name "$VM" --port 80  --priority 1010 --output none
az vm open-port --resource-group "$RG" --name "$VM" --port 443 --priority 1020 --output none

NSG="$(az network nsg list --resource-group "$RG" --query '[0].name' --output tsv)"
if [ -n "$MY_IP" ]; then
  echo "▶ Limitando SSH (puerto 22) a tu IP: $MY_IP"
  az network nsg rule update --resource-group "$RG" --nsg-name "$NSG" \
    --name default-allow-ssh --source-address-prefixes "$MY_IP/32" --output none
fi

IP="$(az vm show --show-details --resource-group "$RG" --name "$VM" --query publicIps --output tsv)"

echo
echo "════════════════════════════════════════════════════════════"
echo " VM creada"
echo "   Región     : $LOCATION"
echo "   Tamaño     : $SIZE"
echo "   IP pública : $IP"
echo "   Usuario    : $ADMIN"
echo "   Conectarte : ssh $ADMIN@$IP"
echo
echo " Reglas de red (puertos abiertos):"
az network nsg rule list --resource-group "$RG" --nsg-name "$NSG" \
  --query '[].{Regla:name, Puerto:destinationPortRange, Acceso:access, Origen:sourceAddressPrefix}' \
  --output table
echo
echo " Siguiente paso: entra por SSH y ejecuta 2-instalar-servidor.sh"
echo "════════════════════════════════════════════════════════════"
