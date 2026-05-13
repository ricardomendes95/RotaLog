import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface CurrentLocation {
  latitude: number;
  longitude: number;
}

export function useLocation() {
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestPermission();
  }, []);

  async function requestPermission() {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setPermissionGranted(true);
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch {
        // Falha ao obter posição inicial — mapa usará região padrão
      }
    }
    setLoading(false);
  }

  return { currentLocation, permissionGranted, loading, requestPermission };
}
