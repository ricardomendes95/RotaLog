import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import TripMap from '@/components/Map/TripMap';
import TransportSelector from '@/components/Trip/TransportSelector';
import { useLocation } from '@/hooks/useLocation';
import { createTrip } from '@/services/DatabaseService';
import { RootStackParamList, TransportType } from '@/types';

type HomeNavProp = StackNavigationProp<RootStackParamList, 'Main'>;

const DEFAULT_REGION = {
  latitude: -23.5505,
  longitude: -46.6333,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

function gpsColor(accuracy: number | null): string {
  if (accuracy === null) return '#ff4444';
  if (accuracy <= 15) return '#4caf50';
  if (accuracy <= 50) return '#ff9800';
  return '#ff4444';
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { currentLocation, accuracy, permissionGranted, loading, refreshLocation } = useLocation();
  const [transport, setTransport] = useState<TransportType>('car');
  const [starting, setStarting] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        { ...currentLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        800,
      );
    }
  }, [currentLocation]);

  async function handleStart() {
    if (!permissionGranted) {
      Alert.alert(
        'Permissão necessária',
        'O app precisa de acesso à localização para rastrear o trajeto.',
        [{ text: 'Conceder', onPress: refreshLocation }, { text: 'Cancelar' }],
      );
      return;
    }
    if (!currentLocation) {
      Alert.alert('Aguarde', 'Obtendo sua localização...');
      return;
    }

    if (accuracy !== null && accuracy > 50) {
      Alert.alert(
        'GPS impreciso',
        `Sinal fraco (${Math.round(accuracy)} m). O trajeto pode ter menos precisão. Deseja iniciar mesmo assim?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar mesmo assim', onPress: doStart },
        ],
      );
      return;
    }

    await doStart();
  }

  async function doStart() {
    setStarting(true);
    try {
      const tripId = await createTrip(
        transport,
        new Date().toISOString(),
        currentLocation!.latitude,
        currentLocation!.longitude,
      );
      navigation.navigate('ActiveTrip', { tripId, transportType: transport });
    } catch {
      Alert.alert('Erro', 'Não foi possível iniciar o trajeto.');
    } finally {
      setStarting(false);
    }
  }

  const color = gpsColor(loading ? null : accuracy);
  const gpsLabel = loading
    ? 'GPS: aguardando...'
    : accuracy !== null
    ? `GPS: ${Math.round(accuracy)} m`
    : 'GPS: sem sinal';

  return (
    <View style={styles.container}>
      <TripMap ref={mapRef} initialRegion={DEFAULT_REGION} style={styles.map}>
        {currentLocation && (
          <Marker coordinate={currentLocation} title="Você está aqui" pinColor="#FF4500" />
        )}
      </TripMap>

      <View style={styles.panel}>
        <TransportSelector selected={transport} onSelect={setTransport} />

        <View style={styles.gpsRow}>
          <View style={[styles.gpsDot, { backgroundColor: color }]} />
          <Text style={[styles.gpsText, { color }]}>{gpsLabel}</Text>
          <TouchableOpacity
            onPress={refreshLocation}
            style={styles.refreshBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.refreshIcon}>🔄</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.startBtn, (starting || loading || !currentLocation) && styles.startBtnDisabled]}
          onPress={handleStart}
          disabled={starting || loading || !currentLocation}
          activeOpacity={0.8}
        >
          <Text style={styles.startBtnText}>
            {loading ? 'Aguardando GPS...' : starting ? 'Iniciando...' : '▶  Iniciar Trajeto'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  map: { flex: 1 },
  panel: {
    backgroundColor: '#1a1a2e',
    paddingBottom: 20,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 2,
  },
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gpsText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  refreshBtn: {
    padding: 4,
  },
  refreshIcon: { fontSize: 16 },
  startBtn: {
    backgroundColor: '#FF4500',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  startBtnDisabled: {
    backgroundColor: '#663300',
  },
  startBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
