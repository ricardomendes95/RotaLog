import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Alert, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import TripCard from '@/components/Trip/TripCard';
import { useTrips } from '@/hooks/useDatabase';
import { exportHistory, importHistory } from '@/services/DatabaseService';
import { RootStackParamList } from '@/types';

type HistoryNavProp = StackNavigationProp<RootStackParamList, 'Main'>;

export default function HistoryScreen() {
  const navigation = useNavigation<HistoryNavProp>();
  const { trips, loading, loadTrips, removeTrip, renameTrip } = useTrips();
  const [renameTarget, setRenameTarget] = useState<{ id: number; current: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips]),
  );

  function handleDelete(tripId: number) {
    Alert.alert('Excluir trajeto?', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => removeTrip(tripId) },
    ]);
  }

  function openRenameModal(tripId: number, currentName: string) {
    setRenameValue(currentName);
    setRenameTarget({ id: tripId, current: currentName });
  }

  async function confirmRename() {
    if (!renameTarget) return;
    await renameTrip(renameTarget.id, renameValue);
    setRenameTarget(null);
  }

  async function handleExport() {
    try {
      const path = await exportHistory();
      await Sharing.shareAsync(path, { mimeType: 'application/json' });
    } catch (e) {
      Alert.alert('Erro ao exportar', String(e));
    }
  }

  async function handleImport() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const count = await importHistory(result.assets[0].uri);
      await loadTrips();
      Alert.alert('Importação concluída', `${count} trajeto(s) importado(s).`);
    } catch (e) {
      Alert.alert('Erro ao importar', String(e));
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Histórico</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleImport}>
            <Text style={styles.headerBtnText}>📥</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={handleExport}>
            <Text style={styles.headerBtnText}>📤</Text>
          </TouchableOpacity>
        </View>
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
              onRename={() => openRenameModal(item.id, item.name ?? '')}
            />
          )}
          onRefresh={loadTrips}
          refreshing={loading}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal visible={!!renameTarget} transparent animationType="fade" onRequestClose={() => setRenameTarget(null)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Renomear trajeto</Text>
            <TextInput
              style={styles.modalInput}
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="Nome do trajeto"
              placeholderTextColor="#666"
              autoFocus
              maxLength={60}
              returnKeyType="done"
              onSubmitEditing={confirmRename}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setRenameTarget(null)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={confirmRename}>
                <Text style={styles.modalSaveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerBtn: { padding: 8 },
  headerBtnText: { fontSize: 22 },
  list: { paddingVertical: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: '#888', fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalBox: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 16 },
  modalInput: {
    backgroundColor: '#0f3460',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2a2a4e',
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  modalCancelText: { color: '#888', fontSize: 15 },
  modalSaveBtn: { backgroundColor: '#FF4500', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  modalSaveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
