#!/bin/bash
set -e

if [ -f "$(dirname "$0")/../.env" ]; then
  export $(grep -v '^#' "$(dirname "$0")/../.env" | xargs)
fi

if [ -z "$GOOGLE_MAPS_API_KEY" ]; then
  echo "Erro: GOOGLE_MAPS_API_KEY não definida."
  echo "Crie um arquivo .env na raiz do projeto com:"
  echo "  GOOGLE_MAPS_API_KEY=sua-chave-aqui"
  exit 1
fi

MODE="${1:-release}"

if [ "$MODE" = "debug" ]; then
  GRADLE_TASK="assembleDebug"
else
  GRADLE_TASK="assembleRelease"
fi

echo "Buildando APK ($MODE) com GOOGLE_MAPS_API_KEY definida..."

docker run --rm \
  -v "$(pwd)":/project \
  -w /project \
  -e GOOGLE_MAPS_API_KEY="$GOOGLE_MAPS_API_KEY" \
  reactnativecommunity/react-native-android:latest \
  bash -c "npm ci && npx expo prebuild --platform android && cd android && ./gradlew $GRADLE_TASK"
