import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
  ActivityIndicator, Linking, Share,
} from 'react-native';
import MapView from 'react-native-maps';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import TripMap from '@/components/Map/TripMap';
import RoutePolyline from '@/components/Map/RoutePolyline';
import { useTripDetail } from '@/hooks/useDatabase';
import { captureWithFit, saveToGallery, shareImage } from '@/services/ExportService';
import { RootStackParamList } from '@/types';
import { TRANSPORT_ICONS, TRANSPORT_LABELS } from '@/constants';
import { formatDate, formatDistance, formatDuration, formatSpeed } from '@/utils/formatters';

type DetailRouteProp = RouteProp<RootStackParamList, 'TripDetail'>;
type DetailNavProp = StackNavigationProp<RootStackParamList, 'TripDetail'>;

export default function TripDetailScreen() {
  const route = useRoute<DetailRouteProp>();
  const navigation = useNavigation<DetailNavProp>();
  const { tripId } = route.params;
  const { trip, coordinates, loading, loadDetail } = useTripDetail(tripId);
  const reportRef = useRef<View>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (coordinates.length > 1 && mapRef.current) {
      mapRef.current.fitToCoordinates(
        coordinates.map((c) => ({ latitude: c.latitude, longitude: c.longitude })),
        { edgePadding: { top: 40, right: 40, bottom: 40, left: 40 }, animated: true },
      );
    }
  }, [coordinates]);

  const coordPoints = coordinates.map((c) => ({ latitude: c.latitude, longitude: c.longitude }));

  async function handleSave() {
    try {
      const uri = await captureWithFit(reportRef, mapRef, coordPoints);
      const saved = await saveToGallery(uri);
      Alert.alert(saved ? 'Salvo!' : 'Erro', saved ? 'Imagem salva na galeria.' : 'Permissão negada.');
    } catch (e) {
      Alert.alert('Erro ao salvar', String(e));
    }
  }

  async function handleShare() {
    try {
      const uri = await captureWithFit(reportRef, mapRef, coordPoints);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Relatório do Trajeto</Text>
      </View>

      <ScrollView>
        {/* Container capturável como imagem */}
        <View ref={reportRef} collapsable={false} style={styles.report}>
          <View style={styles.reportHeader}>
            <Text style={styles.reportIcon}>{TRANSPORT_ICONS[trip.transportType]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.reportType} numberOfLines={1}>
                {trip.name ?? TRANSPORT_LABELS[trip.transportType]}
              </Text>
              {trip.name && (
                <Text style={styles.reportSubtype}>{TRANSPORT_LABELS[trip.transportType]}</Text>
              )}
              <Text style={styles.reportDate}>{formatDate(trip.startedAt)}</Text>
            </View>
          </View>

          <TripMap
            ref={mapRef}
            style={styles.map}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            initialRegion={
              trip.startLat && trip.startLng
                ? { latitude: trip.startLat, longitude: trip.startLng, latitudeDelta: 0.02, longitudeDelta: 0.02 }
                : { latitude: -23.5505, longitude: -46.6333, latitudeDelta: 0.02, longitudeDelta: 0.02 }
            }
          >
            <RoutePolyline coordinates={coordinates} showMarkers />
          </TripMap>

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
        </View>

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
  report: {
    backgroundColor: '#1a1a2e',
    margin: 12,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#0f3460',
  },
  reportIcon: { fontSize: 36 },
  reportType: { color: '#fff', fontSize: 17, fontWeight: '700' },
  reportSubtype: { color: '#FF4500', fontSize: 12, marginTop: 1 },
  reportDate: { color: '#aaa', fontSize: 13, marginTop: 2 },
  map: { height: 220 },
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
