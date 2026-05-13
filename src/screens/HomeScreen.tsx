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

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { currentLocation, permissionGranted, loading, requestPermission } = useLocation();
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
        [{ text: 'Conceder', onPress: requestPermission }, { text: 'Cancelar' }],
      );
      return;
    }
    if (!currentLocation) {
      Alert.alert('Aguarde', 'Obtendo sua localização...');
      return;
    }

    setStarting(true);
    try {
      const tripId = await createTrip(
        transport,
        new Date().toISOString(),
        currentLocation.latitude,
        currentLocation.longitude,
      );
      navigation.navigate('ActiveTrip', { tripId, transportType: transport });
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível iniciar o trajeto.');
    } finally {
      setStarting(false);
    }
  }

  return (
    <View style={styles.container}>
      <TripMap ref={mapRef} initialRegion={DEFAULT_REGION} style={styles.map}>
        {currentLocation && (
          <Marker coordinate={currentLocation} title="Você está aqui" pinColor="#FF4500" />
        )}
      </TripMap>

      <View style={styles.panel}>
        <TransportSelector selected={transport} onSelect={setTransport} />
        <TouchableOpacity
          style={[styles.startBtn, (starting || loading) && styles.startBtnDisabled]}
          onPress={handleStart}
          disabled={starting || loading}
          activeOpacity={0.8}
        >
          <Text style={styles.startBtnText}>
            {loading ? 'Obtendo localização...' : starting ? 'Iniciando...' : '▶  Iniciar Trajeto'}
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
  startBtn: {
    backgroundColor: '#FF4500',
    marginHorizontal: 16,
    marginTop: 12,
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
