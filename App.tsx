import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from '@/services/DatabaseService';
import AppNavigator from '@/navigation/AppNavigator';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => setReady(true))
      .catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Erro ao inicializar banco: {error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e' },
  loadingText: { color: '#fff', fontSize: 16 },
  errorText: { color: '#ff4444', fontSize: 14, padding: 20, textAlign: 'center' },
});
