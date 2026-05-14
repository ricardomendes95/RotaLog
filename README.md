# RotaLog

Odômetro digital para Android. Rastreia trajetos em tempo real com GPS, calcula distância, velocidade e tempo de movimento, e exporta relatórios como imagem.

## Funcionalidades

- Mapa com tiles CARTO (gratuito, sem necessidade de API key pública)
- Seleção de tipo de transporte: carro, moto, bike ou a pé
- Rastreamento GPS em tempo real com rastro no mapa
- Métricas por trajeto: distância, velocidade atual/média/máxima/mínima, tempo total e tempo em movimento
- Histórico de trajetos salvo localmente com SQLite
- Exportar relatório do trajeto como imagem (JPG) para a galeria ou compartilhar
- Rastreamento em background (app minimizado)
- Precisão GPS ajustada por tipo de transporte

## Stack

- [Expo](https://expo.dev) SDK 54 (managed workflow)
- React Native + TypeScript
- react-native-maps + CARTO tiles
- expo-location (foreground + background)
- expo-sqlite v16
- expo-task-manager
- React Navigation (Stack + Bottom Tabs)

## Pré-requisitos

- Node.js 20+
- [Expo Go](https://expo.dev/go) instalado no celular (para desenvolvimento)
- Conta na [Expo](https://expo.dev) (para builds via EAS)

## Instalação

```bash
git clone https://github.com/ricardomendes95/RotaLog.git
cd RotaLog
npm install
```

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
GOOGLE_MAPS_API_KEY=sua_chave_aqui
```

A chave é necessária para builds standalone. Em desenvolvimento com Expo Go não é preciso.

> Para gerar uma chave gratuita: [Google Cloud Console](https://console.cloud.google.com) → APIs e Serviços → Maps SDK for Android → Credenciais.

## Desenvolvimento

```bash
# Inicia o servidor detectando automaticamente o IP do Windows (WSL2)
npm run dev:android
```

Abra o Expo Go no celular e escaneie o QR Code.

## Build (APK)

```bash
npm run build:android
```

Requer [EAS CLI](https://docs.expo.dev/eas/) instalado e conta Expo configurada. O APK gerado pode ser instalado diretamente no Android.

## Estrutura

```
src/
├── components/
│   ├── Map/          # TripMap, RoutePolyline
│   └── Trip/         # MetricsPanel
├── constants/        # Configs GPS por transporte, cores, URLs
├── hooks/            # useTrip (rastreamento + métricas)
├── navigation/       # AppNavigator
├── screens/          # Home, ActiveTrip, TripDetail, History
├── services/         # DatabaseService, LocationService, ExportService
├── types/            # Tipos TypeScript globais
└── utils/            # Haversine, filtros de velocidade/precisão
scripts/
└── generate-icons.js # Gera os assets de ícone (requer canvas)
```

## Licença

Uso pessoal.
