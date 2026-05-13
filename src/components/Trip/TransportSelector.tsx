import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TransportType } from '@/types';
import { TRANSPORT_LABELS, TRANSPORT_ICONS } from '@/constants';

const TYPES: TransportType[] = ['car', 'motorcycle', 'bike', 'walk'];

interface TransportSelectorProps {
  selected: TransportType;
  onSelect: (type: TransportType) => void;
}

export default function TransportSelector({ selected, onSelect }: TransportSelectorProps) {
  return (
    <View style={styles.container}>
      {TYPES.map((type) => (
        <TouchableOpacity
          key={type}
          style={[styles.button, selected === type && styles.selected]}
          onPress={() => onSelect(type)}
          activeOpacity={0.7}
        >
          <Text style={styles.icon}>{TRANSPORT_ICONS[type]}</Text>
          <Text style={[styles.label, selected === type && styles.labelSelected]}>
            {TRANSPORT_LABELS[type]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#1a1a2e',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#16213e',
    minWidth: 70,
  },
  selected: {
    borderColor: '#FF4500',
    backgroundColor: '#2a1a0e',
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: '#aaa',
    fontWeight: '600',
  },
  labelSelected: {
    color: '#FF4500',
  },
});
