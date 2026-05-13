import React, { useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import TripCard from '@/components/Trip/TripCard';
import { useTrips } from '@/hooks/useDatabase';
import { RootStackParamList } from '@/types';

type HistoryNavProp = StackNavigationProp<RootStackParamList, 'Main'>;

export default function HistoryScreen() {
  const navigation = useNavigation<HistoryNavProp>();
  const { trips, loading, loadTrips, removeTrip } = useTrips();

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips]),
  );

  function handleDelete(tripId: number) {
    Alert.alert('Excluir trajeto?', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => removeTrip(tripId),
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Histórico</Text>
      </View>

      {trips.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyText}>Nenhum trajeto salvo ainda.</Text>
          <Text style={styles.emptySubtext}>Inicie um novo trajeto na aba Mapa.</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TripCard
              trip={item}
              onPress={() => navigation.navigate('TripDetail', { tripId: item.id })}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          onRefresh={loadTrips}
          refreshing={loading}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#0f3460',
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  list: { paddingVertical: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: '#888', fontSize: 13 },
});
