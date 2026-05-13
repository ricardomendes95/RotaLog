# Plano de Implementação — App Rotas

## Stack Tecnológica

| Categoria | Tecnologia | Motivo |
|---|---|---|
| Framework | Expo SDK (managed workflow) | Sem precisar de Android Studio para começar |
| Linguagem | TypeScript | Tipos em tempo de desenvolvimento |
| Mapa | react-native-maps + UrlTile OSM | Gratuito, sem API key, tiles OpenStreetMap |
| GPS | expo-location | Nativo Expo, suporte a background location |
| Banco local | expo-sqlite | SQLite no dispositivo, sem servidor |
| Captura de tela | react-native-view-shot | Captura a View como arquivo PNG |
| Salvar/Compartilhar | expo-media-library + expo-sharing | Salvar na galeria e compartilhar |
| Navegação | @react-navigation/native + stack + bottom-tabs | Padrão da comunidade React Native |

---

## Estrutura de Pastas

```
app-rotas/
├── docs/
├── assets/
│   └── icons/               # car.png, motorcycle.png, bike.png, walk.png
├── src/
│   ├── types/
│   │   └── index.ts          # TransportType, Trip, Coordinate, TripMetrics
│   ├── constants/
│   │   └── index.ts          # MIN_ACCURACY_METERS, MIN_SPEED_KMH, OSM_TILE_URL
│   ├── utils/
│   │   ├── haversine.ts      # Fórmula de Haversine
│   │   ├── formatters.ts     # formatDuration, formatDistance, formatSpeed
│   │   └── filters.ts        # Regras de descarte de leitura GPS
│   ├── services/
│   │   ├── DatabaseService.ts  # CRUD SQLite
│   │   ├── LocationService.ts  # GPS tracking + métricas em tempo real
│   │   └── ExportService.ts    # Captura + salvar + compartilhar
│   ├── hooks/
│   │   ├── useLocation.ts    # Permissões + posição atual
│   │   ├── useTrip.ts        # Estado do trajeto ativo
│   │   └── useDatabase.ts    # Operações de leitura do histórico
│   ├── components/
│   │   ├── Map/
│   │   │   ├── TripMap.tsx         # MapView + UrlTile OSM
│   │   │   └── RoutePolyline.tsx   # Polilinha do trajeto
│   │   ├── Trip/
│   │   │   ├── TransportSelector.tsx  # 4 botões de tipo de transporte
│   │   │   ├── MetricsPanel.tsx       # Grade 2×3 de métricas
│   │   │   └── TripCard.tsx           # Card do histórico
│   │   └── UI/
│   │       └── StatBadge.tsx     # label + valor + unidade
│   ├── screens/
│   │   ├── HomeScreen.tsx         # Mapa + seletor + botão Iniciar
│   │   ├── ActiveTripScreen.tsx   # Mapa ao vivo + contador + botão Finalizar
│   │   ├── HistoryScreen.tsx      # Lista de trajetos salvos
│   │   └── TripDetailScreen.tsx   # Relatório + exportar
│   └── navigation/
│       └── AppNavigator.tsx       # Stack + BottomTabs
├── App.tsx
├── app.json
├── eas.json
├── tsconfig.json
└── babel.config.js
```

---

## Schema do Banco de Dados

### Tabela `trips`

```sql
CREATE TABLE IF NOT EXISTS trips (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  transport_type  TEXT NOT NULL,       -- 'car' | 'motorcycle' | 'bike' | 'walk'
  started_at      TEXT NOT NULL,       -- ISO 8601
  finished_at     TEXT,                -- NULL enquanto ativo
  distance_km     REAL DEFAULT 0,
  duration_total  INTEGER DEFAULT 0,   -- segundos totais
  duration_moving INTEGER DEFAULT 0,   -- segundos apenas em movimento
  speed_avg       REAL DEFAULT 0,      -- km/h
  speed_max       REAL DEFAULT 0,      -- km/h
  speed_min       REAL DEFAULT 0,      -- km/h
  start_lat       REAL,
  start_lng       REAL,
  end_lat         REAL,
  end_lng         REAL
);
```

### Tabela `coordinates`

```sql
CREATE TABLE IF NOT EXISTS coordinates (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id     INTEGER NOT NULL,
  latitude    REAL NOT NULL,
  longitude   REAL NOT NULL,
  speed       REAL,           -- m/s
  accuracy    REAL,           -- metros
  recorded_at TEXT NOT NULL,  -- ISO 8601
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_coords_trip ON coordinates(trip_id);
CREATE INDEX IF NOT EXISTS idx_trips_date  ON trips(started_at DESC);
```

---

## Fases de Implementação

### Fase 1 — Docs + Scaffolding (você faz isso manualmente — ver guia-manual.md)

1. Criar pasta `docs/` e arquivos de documentação
2. Executar `npx create-expo-app . --template expo-template-blank-typescript`
3. Instalar dependências com `npx expo install`
4. Criar estrutura de pastas em `src/`

### Fase 2 — Fundações

| Arquivo | Responsabilidade |
|---|---|
| `src/types/index.ts` | Tipos compartilhados: TransportType, Trip, Coordinate, TripMetrics |
| `src/constants/index.ts` | Constantes configuráveis: limiares de filtro, URL do OSM |
| `src/utils/haversine.ts` | Cálculo de distância entre dois pontos GPS |
| `src/utils/filters.ts` | Decidir se um ponto GPS é válido ou deve ser descartado |
| `src/utils/formatters.ts` | Converter números brutos em strings exibíveis |
| `src/services/DatabaseService.ts` | CRUD completo sobre SQLite |

**Checkpoint:** chamar `initDatabase()` no App.tsx e rodar sem erros.

### Fase 3 — Navegação base

| Arquivo | Responsabilidade |
|---|---|
| `src/navigation/AppNavigator.tsx` | Stack Navigator com 4 telas + BottomTabs |
| `App.tsx` | Inicializa banco + monta o navigator |

**Checkpoint:** app navega entre as 4 telas sem erros.

### Fase 4 — Mapa e HomeScreen

| Arquivo | Responsabilidade |
|---|---|
| `src/components/Map/TripMap.tsx` | MapView com tiles OpenStreetMap (sem API key) |
| `src/components/Trip/TransportSelector.tsx` | 4 botões: carro, moto, bike, a pé |
| `src/hooks/useLocation.ts` | Solicitar permissão + retornar posição atual |
| `src/screens/HomeScreen.tsx` | Mapa + seletor de transporte + botão Iniciar |

**Checkpoint:** mapa OSM aparece com posição do usuário marcada.

### Fase 5 — Rastreamento ativo

| Arquivo | Responsabilidade |
|---|---|
| `src/services/LocationService.ts` | GPS watchPosition + cálculo de métricas em tempo real |
| `src/hooks/useTrip.ts` | Estado do trajeto ativo conectado ao LocationService |
| `src/components/Map/RoutePolyline.tsx` | Polilinha do percurso sobre o mapa |
| `src/components/Trip/MetricsPanel.tsx` | Grade de 6 métricas atualizadas em tempo real |
| `src/components/UI/StatBadge.tsx` | Componente atômico: label + valor + unidade |
| `src/screens/ActiveTripScreen.tsx` | Tela principal de uso: mapa + métricas + Finalizar |

**Checkpoint:** iniciar trajeto → ver linha no mapa + métricas atualizando → finalizar → trip salva no banco.

### Fase 6 — Histórico

| Arquivo | Responsabilidade |
|---|---|
| `src/hooks/useDatabase.ts` | Carregar lista de trips e detalhes do banco |
| `src/components/Trip/TripCard.tsx` | Card do histórico com data, transporte, distância, duração |
| `src/screens/HistoryScreen.tsx` | FlatList com pull-to-refresh + deleção |

**Checkpoint:** trips finalizadas aparecem na lista; deleção remove do banco.

### Fase 7 — Detalhes e Exportação

| Arquivo | Responsabilidade |
|---|---|
| `src/screens/TripDetailScreen.tsx` | Mapa do percurso + métricas salvas + botões exportar |
| `src/services/ExportService.ts` | Capturar View como PNG, salvar na galeria, compartilhar |

**Checkpoint:** capturar imagem → salvar na galeria → compartilhar via sheet do Android.

### Fase 8 — Background + Build

| Ação | Descrição |
|---|---|
| Background task | Adicionar `defineTask` no LocationService para rastrear com app minimizado |
| `app.json` | Configurar permissões Android e plugins |
| `eas.json` | Perfil "preview" com `buildType: "apk"` |
| Build | `eas build -p android --profile preview` |

---

## Armadilhas Conhecidas

| Problema | Solução |
|---|---|
| WSL2 + Expo Go não conecta via LAN | Usar `npx expo start --tunnel` |
| `react-native-view-shot` captura mapa em branco | Usar `{ useRenderInContext: true }` no `captureRef` |
| `speed` do expo-location vem em m/s | Multiplicar por 3,6 para converter para km/h |
| Android 11+ exige "Permitir sempre" para background GPS | Instruir o usuário a habilitar manualmente nas configurações |
| `expo-sqlite` v14 usa API assíncrona | Usar `openDatabaseAsync`, não `openDatabase` |
| `react-native-maps` precisa de configuração no `app.json` | Adicionar plugin `react-native-maps` se necessário |
