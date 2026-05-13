import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { TripMetrics, Coordinate } from '@/types';
import { haversineKm } from '@/utils/haversine';
import { isAccuracyValid, isMoving } from '@/utils/filters';
import { addCoordinate, finalizeTrip } from '@/services/DatabaseService';
import { GPS_UPDATE_INTERVAL_MS, GPS_DISTANCE_INTERVAL_M } from '@/constants';

export const BACKGROUND_LOCATION_TASK = 'background-location-task';

interface TrackingState {
  tripId: number;
  startTime: number;
  lastLat: number | null;
  lastLng: number | null;
  lastUpdateTime: number | null;
  totalDistanceKm: number;
  movingSeconds: number;
  speedHistory: number[];
  speedCurrent: number;
  isTracking: boolean;
}

let state: TrackingState | null = null;
let subscription: Location.LocationSubscription | null = null;
let metricsCallback: ((metrics: TripMetrics, coord: Coordinate) => void) | null = null;

export function onMetricsUpdate(cb: (metrics: TripMetrics, coord: Coordinate) => void) {
  metricsCallback = cb;
}

export async function startTracking(tripId: number): Promise<void> {
  await Location.requestForegroundPermissionsAsync();

  state = {
    tripId,
    startTime: Date.now(),
    lastLat: null,
    lastLng: null,
    lastUpdateTime: null,
    totalDistanceKm: 0,
    movingSeconds: 0,
    speedHistory: [],
    speedCurrent: 0,
    isTracking: true,
  };

  subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: GPS_UPDATE_INTERVAL_MS,
      distanceInterval: GPS_DISTANCE_INTERVAL_M,
    },
    handleLocationUpdate,
  );
}

async function handleLocationUpdate(loc: Location.LocationObject): Promise<void> {
  if (!state) return;

  const { latitude, longitude, speed, accuracy } = loc.coords;

  if (!isAccuracyValid(accuracy)) return;

  const now = Date.now();
  const coord: Coordinate = {
    latitude,
    longitude,
    speed,
    accuracy,
    recordedAt: new Date(now).toISOString(),
  };

  await addCoordinate(state.tripId, coord);

  if (state.lastLat !== null && state.lastLng !== null) {
    const delta = haversineKm(state.lastLat, state.lastLng, latitude, longitude);
    if (isMoving(speed)) {
      state.totalDistanceKm += delta;
    }
  }

  if (state.lastUpdateTime !== null) {
    const elapsed = (now - state.lastUpdateTime) / 1000;
    if (isMoving(speed)) {
      state.movingSeconds += elapsed;
    }
  }

  const speedKmh = speed !== null ? speed * 3.6 : 0;
  state.speedCurrent = speedKmh;

  if (isMoving(speed) && speedKmh > 0) {
    state.speedHistory.push(speedKmh);
  }

  state.lastLat = latitude;
  state.lastLng = longitude;
  state.lastUpdateTime = now;

  if (metricsCallback) {
    metricsCallback(buildMetrics(), coord);
  }
}

function buildMetrics(): TripMetrics {
  if (!state) {
    return { distanceKm: 0, durationTotal: 0, durationMoving: 0, speedCurrent: 0, speedAvg: 0, speedMax: 0, speedMin: 0 };
  }

  const durationTotal = Math.floor((Date.now() - state.startTime) / 1000);
  const speeds = state.speedHistory;
  const speedMax = speeds.length > 0 ? Math.max(...speeds) : 0;
  const speedMin = speeds.length > 0 ? Math.min(...speeds) : 0;
  const speedAvg = state.movingSeconds > 0
    ? (state.totalDistanceKm / (state.movingSeconds / 3600))
    : 0;

  return {
    distanceKm: state.totalDistanceKm,
    durationTotal,
    durationMoving: Math.floor(state.movingSeconds),
    speedCurrent: state.speedCurrent,
    speedAvg,
    speedMax,
    speedMin,
  };
}

export async function stopTracking(): Promise<TripMetrics> {
  const metrics = buildMetrics();

  if (subscription) {
    subscription.remove();
    subscription = null;
  }

  if (state) {
    const finishedAt = new Date().toISOString();
    await finalizeTrip(
      state.tripId,
      metrics,
      finishedAt,
      state.lastLat ?? 0,
      state.lastLng ?? 0,
    );
    state = null;
  }

  metricsCallback = null;
  return metrics;
}

// Registrar a task de background (deve ser chamado no nível do módulo, fora de componentes)
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: TaskManager.TaskManagerTaskBody) => {
  if (error) return;
  const { locations } = data as { locations: Location.LocationObject[] };
  if (locations?.length > 0) {
    await handleLocationUpdate(locations[locations.length - 1]);
  }
});
