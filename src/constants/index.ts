export const MIN_ACCURACY_METERS = 30;
export const MIN_SPEED_KMH = 0.5;
export const GPS_UPDATE_INTERVAL_MS = 2000;
export const GPS_DISTANCE_INTERVAL_M = 5;

// CARTO tiles: gratuito, sem API key, baseado em dados OSM, sem bloqueio por User-Agent
export const OSM_TILE_URL = 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';

export const ROUTE_COLOR = '#FF4500';
export const ROUTE_WIDTH = 4;

export const TRANSPORT_LABELS: Record<string, string> = {
  car: 'Carro',
  motorcycle: 'Moto',
  bike: 'Bike',
  walk: 'A Pé',
};

export const TRANSPORT_ICONS: Record<string, string> = {
  car: '🚗',
  motorcycle: '🏍️',
  bike: '🚲',
  walk: '🚶',
};
