import React from 'react';
import { Polyline, Marker } from 'react-native-maps';
import { Coordinate } from '@/types';
import { ROUTE_COLOR, ROUTE_WIDTH } from '@/constants';

interface RoutePolylineProps {
  coordinates: Coordinate[];
  showMarkers?: boolean;
  showStartMarker?: boolean;
}

export default function RoutePolyline({
  coordinates,
  showMarkers = false,
  showStartMarker = false,
}: RoutePolylineProps) {
  if (coordinates.length < 2) return null;

  const points = coordinates.map((c) => ({
    latitude: c.latitude,
    longitude: c.longitude,
  }));

  const first = points[0];
  const last = points[points.length - 1];

  return (
    <>
      <Polyline
        coordinates={points}
        strokeColor={ROUTE_COLOR}
        strokeWidth={ROUTE_WIDTH}
      />
      {(showMarkers || showStartMarker) && (
        <Marker coordinate={first} title="Início" pinColor="green" />
      )}
      {showMarkers && (
        <Marker coordinate={last} title="Fim" pinColor="red" />
      )}
    </>
  );
}
