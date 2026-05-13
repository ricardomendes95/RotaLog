import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Trip } from '@/types';
import { TRANSPORT_ICONS, TRANSPORT_LABELS } from '@/constants';
import { formatDate, formatDistance, formatDuration } from '@/utils/formatters';

interface TripCardProps {
  trip: Trip;
  onPress: () => void;
  onDelete: () => void;
}

export default function TripCard({ trip, onPress, onDelete }: TripCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.left}>
        <Text style={styles.icon}>{TRANSPORT_ICONS[trip.transportType]}</Text>
      </View>
      <View style={styles.middle}>
        <Text style={styles.type}>{TRANSPORT_LABELS[trip.transportType]}</Text>
        <Text style={styles.date}>{formatDate(trip.startedAt)}</Text>
        <View style={styles.stats}>
          <Text style={styles.stat}>📍 {formatDistance(trip.distanceKm)}</Text>
          <Text style={styles.stat}>⏱ {formatDuration(trip.durationTotal)}</Text>
          <Text style={styles.stat}>⚡ {trip.speedAvg.toFixed(1)} km/h</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.deleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    elevation: 2,
  },
  left: {
    marginRight: 12,
  },
  icon: {
    fontSize: 32,
  },
  middle: {
    flex: 1,
  },
  type: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  date: {
    color: '#888',
    fontSize: 12,
    marginBottom: 6,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  stat: {
    color: '#ccc',
    fontSize: 12,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 20,
  },
});
