#!/bin/bash
# Detecta o IP LAN do Windows (usado pelo celular para alcançar o Metro)
HOST=$(powershell.exe -c "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { \$_.PrefixOrigin -eq 'Dhcp' -and \$_.IPAddress -notlike '172.*' } | Select-Object -First 1 -ExpandProperty IPAddress" 2>/dev/null | tr -d '\r')

if [ -z "$HOST" ]; then
  echo "Aviso: IP do Windows não detectado, usando hostname padrão"
  npx expo start --lan
else
  echo "Host detectado: $HOST"
  REACT_NATIVE_PACKAGER_HOSTNAME="$HOST" npx expo start --lan
fi
