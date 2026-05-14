import { useState, useEffect, useRef, useCallback } from 'react';
import { TripMetrics, Coordinate, TransportType } from '@/types';
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

export function useTrip(tripId: number, transportType: TransportType) {
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

    startTracking(tripId, transportType)
      .then(() => setIsTracking(true))
      .catch((e) => setError(String(e)));

    return () => {
      // Não finalizar aqui para não encerrar ao trocar de tela acidentalmente
    };
  }, [tripId, transportType]);

  const finish = useCallback(async (): Promise<TripMetrics> => {
    setIsTracking(false);
    return stopTracking();
  }, []);

  return { metrics, coordinates, isTracking, error, finish };
}
