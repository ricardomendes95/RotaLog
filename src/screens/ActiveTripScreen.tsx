import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import TripMap from '@/components/Map/TripMap';
import RoutePolyline from '@/components/Map/RoutePolyline';
import MetricsPanel from '@/components/Trip/MetricsPanel';
import { useTrip } from '@/hooks/useTrip';
import { RootStackParamList } from '@/types';
import { TRANSPORT_ICONS, TRANSPORT_LABELS, TRANSPORT_GPS_CONFIG } from '@/constants';

type ActiveTripRouteProp = RouteProp<RootStackParamList, 'ActiveTrip'>;
type ActiveTripNavProp = StackNavigationProp<RootStackParamList, 'ActiveTrip'>;

const DEFAULT_REGION = {
  latitude: -23.5505,
  longitude: -46.6333,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

export default function ActiveTripScreen() {
  const route = useRoute<ActiveTripRouteProp>();
  const navigation = useNavigation<ActiveTripNavProp>();
  const { tripId, transportType } = route.params;
  const { metrics, coordinates, isTracking, error, finish } = useTrip(tripId, transportType);
  const mapRef = useRef<MapView>(null);

  const currentPos = coordinates.length > 0 ? coordinates[coordinates.length - 1] : null;
  const zoomDelta = TRANSPORT_GPS_CONFIG[transportType].mapZoomDelta;

  // Anima o mapa para a posição atual a cada novo ponto GPS recebido
  useEffect(() => {
    if (!currentPos || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: currentPos.latitude,
        longitude: currentPos.longitude,
        latitudeDelta: zoomDelta,
        longitudeDelta: zoomDelta,
      },
      300,
    );
  }, [currentPos, zoomDelta]);

  async function handleFinish() {
    Alert.alert('Finalizar trajeto?', 'Deseja encerrar e salvar o percurso?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Finalizar',
        style: 'destructive',
        onPress: async () => {
          await finish();
          navigation.replace('TripDetail', { tripId });
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>{TRANSPORT_ICONS[transportType]}</Text>
        <Text style={styles.headerLabel}>{TRANSPORT_LABELS[transportType]}</Text>
        {isTracking && <View style={styles.recordingDot} />}
      </View>

      <TripMap
        ref={mapRef}
        style={styles.map}
        initialRegion={
          currentPos
            ? { latitude: currentPos.latitude, longitude: currentPos.longitude, latitudeDelta: zoomDelta, longitudeDelta: zoomDelta }
            : DEFAULT_REGION
        }
      >
        <RoutePolyline coordinates={coordinates} showStartMarker />
        {currentPos && (
          <Marker
            coordinate={{ latitude: currentPos.latitude, longitude: currentPos.longitude }}
            title="Você"
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges
          >
            <View style={styles.marker}>
              <Text style={styles.markerIcon}>{TRANSPORT_ICONS[transportType]}</Text>
            </View>
          </Marker>
        )}
      </TripMap>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <MetricsPanel metrics={metrics} />

      <TouchableOpacity style={styles.finishBtn} onPress={handleFinish} activeOpacity={0.8}>
        <Text style={styles.finishBtnText}>⏹  Finalizar Trajeto</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f3460',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    gap: 8,
  },
  headerIcon: { fontSize: 24 },
  headerLabel: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4500',
  },
  map: { flex: 1 },
  errorText: { color: '#ff4444', textAlign: 'center', padding: 8 },
  finishBtn: {
    backgroundColor: '#cc2200',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  finishBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  marker: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#FF4500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerIcon: { fontSize: 24 },
});
