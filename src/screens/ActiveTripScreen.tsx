import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import TripMap from '@/components/Map/TripMap';
import RoutePolyline from '@/components/Map/RoutePolyline';
import MetricsPanel from '@/components/Trip/MetricsPanel';
import { useTrip } from '@/hooks/useTrip';
import { usePipMode } from '@/hooks/usePipMode';
import { RootStackParamList } from '@/types';
import { TRANSPORT_ICONS, TRANSPORT_LABELS, TRANSPORT_GPS_CONFIG } from '@/constants';
import { formatDistance, formatDuration } from '@/utils/formatters';

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
  const { isInPip, enterPip } = usePipMode(isTracking);
  const [isFollowing, setIsFollowing] = useState(true);

  const currentPos = coordinates.length > 0 ? coordinates[coordinates.length - 1] : null;
  const zoomDelta = TRANSPORT_GPS_CONFIG[transportType].mapZoomDelta;

  // Mantém a tela acesa enquanto o rastreamento está ativo
  useEffect(() => {
    if (isTracking) {
      activateKeepAwakeAsync('trip-active');
    } else {
      deactivateKeepAwake('trip-active');
    }
    return () => { deactivateKeepAwake('trip-active'); };
  }, [isTracking]);

  // Anima o mapa normal a cada novo ponto GPS (só se seguindo posição)
  useEffect(() => {
    if (!currentPos || !mapRef.current || isInPip || !isFollowing) return;
    mapRef.current.animateToRegion(
      { latitude: currentPos.latitude, longitude: currentPos.longitude, latitudeDelta: zoomDelta, longitudeDelta: zoomDelta },
      800,
    );
  }, [currentPos, zoomDelta, isInPip, isFollowing]);

  // Centraliza o mapa PiP na posição atual (zoom mais fechado)
  useEffect(() => {
    if (!currentPos || !mapRef.current || !isInPip) return;
    mapRef.current.animateToRegion(
      { latitude: currentPos.latitude, longitude: currentPos.longitude, latitudeDelta: 0.003, longitudeDelta: 0.003 },
      150,
    );
  }, [currentPos, isInPip]);

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
      {/* Layout normal */}
      {!isInPip && (
        <>
          <View style={styles.header}>
            <Text style={styles.headerIcon}>{TRANSPORT_ICONS[transportType]}</Text>
            <Text style={styles.headerLabel}>{TRANSPORT_LABELS[transportType]}</Text>
            {isTracking && <View style={styles.recordingDot} />}
            {Platform.OS === 'android' && isTracking && (
              <TouchableOpacity onPress={enterPip} style={styles.pipBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.pipBtnText}>⧉</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.mapWrapper}>
            <TripMap
              ref={mapRef}
              style={styles.map}
              onPanDrag={() => setIsFollowing(false)}
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
            {!isFollowing && isTracking && (
              <TouchableOpacity
                style={styles.recenterBtn}
                onPress={() => setIsFollowing(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.recenterIcon}>📍</Text>
              </TouchableOpacity>
            )}
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <MetricsPanel metrics={metrics} />

          <TouchableOpacity style={styles.finishBtn} onPress={handleFinish} activeOpacity={0.8}>
            <Text style={styles.finishBtnText}>⏹  Finalizar Trajeto</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Overlay PiP: mapa + métricas resumidas */}
      {isInPip && (
        <View style={StyleSheet.absoluteFillObject}>
          <TripMap
            ref={mapRef}
            style={styles.pipMap}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            initialRegion={
              currentPos
                ? { latitude: currentPos.latitude, longitude: currentPos.longitude, latitudeDelta: 0.003, longitudeDelta: 0.003 }
                : DEFAULT_REGION
            }
          >
            <RoutePolyline coordinates={coordinates} showStartMarker />
            {currentPos && (
              <Marker
                coordinate={{ latitude: currentPos.latitude, longitude: currentPos.longitude }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges
              >
                <View style={styles.pipMarker}>
                  <Text style={styles.pipMarkerIcon}>{TRANSPORT_ICONS[transportType]}</Text>
                </View>
              </Marker>
            )}
          </TripMap>

          <View style={styles.pipMetrics}>
            <Text style={styles.pipSpeed}>{metrics.speedCurrent.toFixed(0)}</Text>
            <Text style={styles.pipSpeedUnit}>km/h</Text>
            <View style={styles.pipRow}>
              <Text style={styles.pipStat}>📍 {formatDistance(metrics.distanceKm)}</Text>
              <Text style={styles.pipStat}>⏱ {formatDuration(metrics.durationTotal)}</Text>
            </View>
          </View>
        </View>
      )}
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
  recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF4500' },
  pipBtn: { padding: 4 },
  pipBtnText: { color: '#fff', fontSize: 22 },
  mapWrapper: { flex: 1 },
  map: { flex: 1 },
  recenterBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0f3460',
    borderWidth: 1,
    borderColor: '#FF4500',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  recenterIcon: { fontSize: 22 },
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
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#ffffff', borderWidth: 3, borderColor: '#FF4500',
    alignItems: 'center', justifyContent: 'center',
  },
  markerIcon: { fontSize: 24 },
  pipMap: { flex: 6 },
  pipMetrics: {
    flex: 4,
    backgroundColor: '#0f3460',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  pipSpeed: { color: '#FF4500', fontSize: 42, fontWeight: '800', lineHeight: 46 },
  pipSpeedUnit: { color: '#aaa', fontSize: 14, marginBottom: 6 },
  pipRow: { flexDirection: 'row', gap: 12 },
  pipStat: { color: '#fff', fontSize: 13, fontWeight: '600' },
  pipMarker: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#FF4500',
    alignItems: 'center', justifyContent: 'center',
  },
  pipMarkerIcon: { fontSize: 14 },
});
