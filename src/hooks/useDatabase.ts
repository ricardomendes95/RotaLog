import { useState, useCallback } from 'react';
import { Trip, Coordinate } from '@/types';
import {
  getAllTrips,
  getTripById,
  getCoordinatesByTripId,
  deleteTrip,
  renameTrip,
} from '@/services/DatabaseService';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllTrips();
      setTrips(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeTrip = useCallback(async (tripId: number) => {
    await deleteTrip(tripId);
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
  }, []);

  const rename = useCallback(async (tripId: number, name: string) => {
    await renameTrip(tripId, name);
    setTrips((prev) => prev.map((t) => t.id === tripId ? { ...t, name } : t));
  }, []);

  return { trips, loading, loadTrips, removeTrip, renameTrip: rename };
}

export function useTripDetail(tripId: number) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const [t, coords] = await Promise.all([
        getTripById(tripId),
        getCoordinatesByTripId(tripId),
      ]);
      setTrip(t);
      setCoordinates(coords);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  return { trip, coordinates, loading, loadDetail };
}
