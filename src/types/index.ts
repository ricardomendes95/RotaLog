export type TransportType = 'car' | 'motorcycle' | 'bike' | 'walk';

export interface Coordinate {
  latitude: number;
  longitude: number;
  speed: number | null;
  accuracy: number | null;
  recordedAt: string;
}

export interface Trip {
  id: number;
  name?: string;
  transportType: TransportType;
  startedAt: string;
  finishedAt: string | null;
  distanceKm: number;
  durationTotal: number;
  durationMoving: number;
  speedAvg: number;
  speedMax: number;
  speedMin: number;
  startLat: number | null;
  startLng: number | null;
  endLat: number | null;
  endLng: number | null;
}

export interface TripMetrics {
  distanceKm: number;
  durationTotal: number;
  durationMoving: number;
  speedCurrent: number;
  speedAvg: number;
  speedMax: number;
  speedMin: number;
}

export type RootStackParamList = {
  Main: undefined;
  ActiveTrip: { tripId: number; transportType: TransportType };
  TripDetail: { tripId: number };
};

export type BottomTabParamList = {
  Home: undefined;
  History: undefined;
};
