import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';

interface CurrentLocation {
  latitude: number;
  longitude: number;
}

export function useLocation() {
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const subRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    startWatching();
    return () => { subRef.current?.remove(); };
  }, []);

  async function startWatching() {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLoading(false);
      return;
    }
    setPermissionGranted(true);
    subRef.current?.remove();
    subRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 2000, distanceInterval: 0 },
      (loc) => {
        setCurrentLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        setAccuracy(loc.coords.accuracy ?? null);
        setLoading(false);
      },
    );
  }

  return { currentLocation, accuracy, permissionGranted, loading, refreshLocation: startWatching };
}
