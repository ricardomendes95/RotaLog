import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatBadgeProps {
  label: string;
  value: string;
  unit?: string;
}

export default function StatBadge({ label, value, unit }: StatBadgeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>
        {value}
        {unit ? <Text style={styles.unit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16213e',
    borderRadius: 10,
    margin: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    minWidth: 100,
  },
  label: {
    fontSize: 11,
    color: '#aaa',
    textTransform: 'uppercase',
    marginBottom: 4,
    textAlign: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  unit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#ccc',
  },
});
