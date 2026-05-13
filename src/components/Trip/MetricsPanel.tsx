import React from 'react';
import { View, StyleSheet } from 'react-native';
import StatBadge from '@/components/UI/StatBadge';
import { TripMetrics } from '@/types';
import { formatDistance, formatDuration, formatSpeed } from '@/utils/formatters';

interface MetricsPanelProps {
  metrics: TripMetrics;
}

export default function MetricsPanel({ metrics }: MetricsPanelProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <StatBadge label="Distância" value={formatDistance(metrics.distanceKm)} />
        <StatBadge label="Tempo total" value={formatDuration(metrics.durationTotal)} />
        <StatBadge label="Em movimento" value={formatDuration(metrics.durationMoving)} />
      </View>
      <View style={styles.row}>
        <StatBadge label="Velocidade" value={formatSpeed(metrics.speedCurrent)} />
        <StatBadge label="Média" value={formatSpeed(metrics.speedAvg)} />
        <StatBadge label="Máxima" value={formatSpeed(metrics.speedMax)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
