import { TransportType } from '@/types';

export const MIN_ACCURACY_METERS = 15;

// CARTO tiles: gratuito, sem API key, baseado em dados OSM, sem bloqueio por User-Agent
export const OSM_TILE_URL = 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';

export const ROUTE_COLOR = '#FF4500';
export const ROUTE_WIDTH = 4;

export interface TransportGpsConfig {
  timeIntervalMs: number;
  distanceIntervalM: number;
  minDeltaKm: number;
  minSpeedKmh: number;
  mapZoomDelta: number;
}

export const TRANSPORT_GPS_CONFIG: Record<TransportType, TransportGpsConfig> = {
  car:        { timeIntervalMs: 2000, distanceIntervalM: 5, minDeltaKm: 0.003, minSpeedKmh: 2.0, mapZoomDelta: 0.005 },
  motorcycle: { timeIntervalMs: 2000, distanceIntervalM: 5, minDeltaKm: 0.003, minSpeedKmh: 2.0, mapZoomDelta: 0.005 },
  bike:       { timeIntervalMs: 1500, distanceIntervalM: 3, minDeltaKm: 0.002, minSpeedKmh: 1.0, mapZoomDelta: 0.003 },
  walk:       { timeIntervalMs: 1000, distanceIntervalM: 2, minDeltaKm: 0.001, minSpeedKmh: 0.5, mapZoomDelta: 0.002 },
};

export const TRANSPORT_LABELS: Record<TransportType, string> = {
  car: 'Carro',
  motorcycle: 'Moto',
  bike: 'Bike',
  walk: 'A Pé',
};

export const TRANSPORT_ICONS: Record<TransportType, string> = {
  car: '🚗',
  motorcycle: '🏍️',
  bike: '🚲',
  walk: '🚶',
};
