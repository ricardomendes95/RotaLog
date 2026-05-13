import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { RootStackParamList, BottomTabParamList } from '@/types';

import HomeScreen from '@/screens/HomeScreen';
import ActiveTripScreen from '@/screens/ActiveTripScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import TripDetailScreen from '@/screens/TripDetailScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#1a1a2e' },
        tabBarActiveTintColor: '#FF4500',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Mapa',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🗺️</Text>,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Histórico',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📋</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} />
        <Stack.Screen name="TripDetail" component={TripDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
