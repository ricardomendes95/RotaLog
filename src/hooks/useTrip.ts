import { useState, useEffect, useRef, useCallback } from 'react';
import { TripMetrics, Coordinate } from '@/types';
import {
  startTracking,
  stopTracking,
  onMetricsUpdate,
} from '@/services/LocationService';

const DEFAULT_METRICS: TripMetrics = {
  distanceKm: 0,
  durationTotal: 0,
  durationMoving: 0,
  speedCurrent: 0,
  speedAvg: 0,
  speedMax: 0,
  speedMin: 0,
};

export function useTrip(tripId: number) {
  const [metrics, setMetrics] = useState<TripMetrics>(DEFAULT_METRICS);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    onMetricsUpdate((m, coord) => {
      setMetrics({ ...m });
      setCoordinates((prev) => [...prev, coord]);
    });

    startTracking(tripId)
      .then(() => setIsTracking(true))
      .catch((e) => setError(String(e)));

    return () => {
      // Limpeza: não chamar stopTracking aqui para não finalizar ao trocar de tela
    };
  }, [tripId]);

  const finish = useCallback(async (): Promise<TripMetrics> => {
    setIsTracking(false);
    return stopTracking();
  }, []);

  return { metrics, coordinates, isTracking, error, finish };
}
