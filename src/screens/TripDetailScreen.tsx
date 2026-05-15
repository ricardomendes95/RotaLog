import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
  ActivityIndicator, Linking, Share, Dimensions,
} from 'react-native';
import MapView from 'react-native-maps';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import TripMap from '@/components/Map/TripMap';
import RoutePolyline from '@/components/Map/RoutePolyline';
import { useTripDetail } from '@/hooks/useDatabase';
import { captureView, saveToGallery, shareImage } from '@/services/ExportService';
import { RootStackParamList } from '@/types';
import { TRANSPORT_ICONS, TRANSPORT_LABELS } from '@/constants';
import { formatDate, formatDistance, formatDuration, formatSpeed } from '@/utils/formatters';

type DetailRouteProp = RouteProp<RootStackParamList, 'TripDetail'>;
type DetailNavProp = StackNavigationProp<RootStackParamList, 'TripDetail'>;

const MAP_HEIGHT = Math.round(Dimensions.get('window').height * 0.38);

export default function TripDetailScreen() {
  const route = useRoute<DetailRouteProp>();
  const navigation = useNavigation<DetailNavProp>();
  const { tripId } = route.params;
  const { trip, coordinates, loading, loadDetail } = useTripDetail(tripId);
  const mapContainerRef = useRef<View>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (coordinates.length > 1 && mapRef.current) {
      mapRef.current.fitToCoordinates(
        coordinates.map((c) => ({ latitude: c.latitude, longitude: c.longitude })),
        { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true },
      );
    }
  }, [coordinates]);

  function fitToRoute() {
    if (coordinates.length > 1 && mapRef.current) {
      mapRef.current.fitToCoordinates(
        coordinates.map((c) => ({ latitude: c.latitude, longitude: c.longitude })),
        { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true },
      );
    }
  }

  async function handleSave() {
    try {
      const uri = await captureView(mapContainerRef);
      const saved = await saveToGallery(uri);
      Alert.alert(saved ? 'Salvo!' : 'Erro', saved ? 'Imagem salva na galeria.' : 'Permissão negada.');
    } catch (e) {
      Alert.alert('Erro ao salvar', String(e));
    }
  }

  async function handleShare() {
    try {
      const uri = await captureView(mapContainerRef);
      await shareImage(uri);
    } catch (e) {
      Alert.alert('Erro ao compartilhar', String(e));
    }
  }

  async function handleOpenMaps() {
    if (!trip?.endLat || !trip?.endLng) return;
    const url = `https://maps.google.com/?q=${trip.endLat},${trip.endLng}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Erro', 'Não foi possível abrir o Google Maps.');
    }
  }

  async function handleShareCoords() {
    if (!trip?.startLat || !trip?.endLat) return;
    await Share.share({
      message:
        `Trajeto RotaLog\n` +
        `Partida: ${trip.startLat.toFixed(6)}, ${trip.startLng!.toFixed(6)}\n` +
        `Chegada: ${trip.endLat.toFixed(6)}, ${trip.endLng!.toFixed(6)}\n\n` +
        `Ver partida: https://maps.google.com/?q=${trip.startLat},${trip.startLng}\n` +
        `Ver chegada: https://maps.google.com/?q=${trip.endLat},${trip.endLng}`,
    });
  }

  if (loading || !trip) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FF4500" />
      </View>
    );
  }

  const hasCoords = trip.startLat !== null && trip.endLat !== null;
  const tripLabel = trip.name ?? TRANSPORT_LABELS[trip.transportType];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Relatório do Trajeto</Text>
      </View>

      {/* Mapa interativo — capturável como imagem */}
      <View ref={mapContainerRef} collapsable={false} style={styles.mapContainer}>
        <TripMap
          ref={mapRef}
          style={styles.map}
          initialRegion={
            trip.startLat && trip.startLng
              ? { latitude: trip.startLat, longitude: trip.startLng, latitudeDelta: 0.02, longitudeDelta: 0.02 }
              : { latitude: -23.5505, longitude: -46.6333, latitudeDelta: 0.02, longitudeDelta: 0.02 }
          }
        >
          <RoutePolyline coordinates={coordinates} showMarkers />
        </TripMap>

        {/* Overlay: nome do trajeto (topo) */}
        <View style={styles.overlayTop} pointerEvents="none">
          <Text style={styles.overlayIcon}>{TRANSPORT_ICONS[trip.transportType]}</Text>
          <Text style={styles.overlayLabel} numberOfLines={1}>{tripLabel}</Text>
          <Text style={styles.overlayDate}>{formatDate(trip.startedAt)}</Text>
        </View>

        {/* Overlay: métricas principais (rodapé) */}
        <View style={styles.overlayBottom} pointerEvents="none">
          <Text style={styles.overlayStat}>📍 {formatDistance(trip.distanceKm)}</Text>
          <View style={styles.overlayDivider} />
          <Text style={styles.overlayStat}>⏱ {formatDuration(trip.durationTotal)}</Text>
          <View style={styles.overlayDivider} />
          <Text style={styles.overlayStat}>🏎 {formatSpeed(trip.speedMax)}</Text>
        </View>

        {/* Botão ajustar ao trajeto */}
        <TouchableOpacity
          style={styles.fitBtn}
          onPress={fitToRoute}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.fitBtnText}>⊡</Text>
        </TouchableOpacity>

        {/* Faixa de métricas — incluída na captura */}
        <View style={styles.metricsStrip}>
          <View style={styles.metricCell}>
            <Text style={styles.metricCellLabel}>Distância</Text>
            <Text style={styles.metricCellValue}>{formatDistance(trip.distanceKm)}</Text>
          </View>
          <View style={styles.metricCellDivider} />
          <View style={styles.metricCell}>
            <Text style={styles.metricCellLabel}>Tempo total</Text>
            <Text style={styles.metricCellValue}>{formatDuration(trip.durationTotal)}</Text>
          </View>
          <View style={styles.metricCellDivider} />
          <View style={styles.metricCell}>
            <Text style={styles.metricCellLabel}>Vel. média</Text>
            <Text style={styles.metricCellValue}>{formatSpeed(trip.speedAvg)}</Text>
          </View>
          <View style={styles.metricCellDivider} />
          <View style={styles.metricCell}>
            <Text style={styles.metricCellLabel}>Vel. máxima</Text>
            <Text style={styles.metricCellValue}>{formatSpeed(trip.speedMax)}</Text>
          </View>
        </View>
      </View>

      {/* Métricas detalhadas + ações */}
      <ScrollView style={styles.scroll}>
        <View style={styles.metricsGrid}>
          <MetricRow label="Distância" value={formatDistance(trip.distanceKm)} />
          <MetricRow label="Tempo total" value={formatDuration(trip.durationTotal)} />
          <MetricRow label="Em movimento" value={formatDuration(trip.durationMoving)} />
          <MetricRow label="Velocidade média" value={formatSpeed(trip.speedAvg)} />
          <MetricRow label="Velocidade máxima" value={formatSpeed(trip.speedMax)} />
          <MetricRow label="Velocidade mínima" value={formatSpeed(trip.speedMin)} />
        </View>

        {hasCoords && (
          <View style={styles.coordsSection}>
            <Text style={styles.coordsTitle}>Pontos do Trajeto</Text>
            <CoordRow label="Partida" lat={trip.startLat!} lng={trip.startLng!} />
            <CoordRow label="Chegada" lat={trip.endLat!} lng={trip.endLng!} />
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.actionText}>💾  Salvar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.btnSecondary]} onPress={handleShare} activeOpacity={0.8}>
            <Text style={styles.actionText}>📤  Compartilhar</Text>
          </TouchableOpacity>
        </View>

        {hasCoords && (
          <View style={[styles.actions, styles.actionsBottom]}>
            <TouchableOpacity style={[styles.actionBtn, styles.btnSecondary]} onPress={handleOpenMaps} activeOpacity={0.8}>
              <Text style={styles.actionText}>🗺️  Abrir no Maps</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.btnSecondary]} onPress={handleShareCoords} activeOpacity={0.8}>
              <Text style={styles.actionText}>📍  Coords</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={metricStyles.row}>
      <Text style={metricStyles.label}>{label}</Text>
      <Text style={metricStyles.value}>{value}</Text>
    </View>
  );
}

function CoordRow({ label, lat, lng }: { label: string; lat: number; lng: number }) {
  return (
    <View style={metricStyles.row}>
      <Text style={metricStyles.label}>{label}</Text>
      <Text style={metricStyles.coordValue}>
        {lat.toFixed(5)}, {lng.toFixed(5)}
      </Text>
    </View>
  );
}

const metricStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  label: { color: '#aaa', fontSize: 14 },
  value: { color: '#fff', fontSize: 15, fontWeight: '700' },
  coordValue: { color: '#FF4500', fontSize: 13, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f3460',
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  backBtn: { paddingRight: 8 },
  backText: { color: '#FF4500', fontSize: 15 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },

  mapContainer: {
    overflow: 'hidden',
    backgroundColor: '#0f3460',
  },
  map: { height: MAP_HEIGHT },

  metricsStrip: {
    flexDirection: 'row',
    backgroundColor: '#0f3460',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1a3a60',
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
  },
  metricCellLabel: { color: '#8899bb', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  metricCellValue: { color: '#fff', fontSize: 15, fontWeight: '800', marginTop: 2 },
  metricCellDivider: { width: 1, backgroundColor: '#1a3a60', marginVertical: 4 },

  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(15, 52, 96, 0.82)',
  },
  overlayIcon: { fontSize: 20 },
  overlayLabel: { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1 },
  overlayDate: { color: '#aaa', fontSize: 11 },

  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    paddingVertical: 10,
    backgroundColor: 'rgba(15, 52, 96, 0.82)',
  },
  overlayStat: { color: '#fff', fontSize: 13, fontWeight: '700', paddingHorizontal: 16 },
  overlayDivider: { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.2)' },

  fitBtn: {
    position: 'absolute',
    top: 52,
    right: 10,
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 52, 96, 0.9)',
    borderWidth: 1,
    borderColor: '#FF4500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fitBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  scroll: { flex: 1 },
  metricsGrid: { padding: 16 },
  coordsSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  coordsTitle: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  actionsBottom: { paddingBottom: 32 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#FF4500',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSecondary: { backgroundColor: '#0f3460', borderWidth: 1, borderColor: '#FF4500' },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
