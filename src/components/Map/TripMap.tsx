import React, { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { UrlTile, MapViewProps, PROVIDER_DEFAULT } from 'react-native-maps';
import { OSM_TILE_URL } from '@/constants';

interface TripMapProps extends Omit<MapViewProps, 'provider'> {
  children?: React.ReactNode;
}

const TripMap = forwardRef<MapView, TripMapProps>(({ children, style, ...props }, ref) => {
  return (
    <MapView
      ref={ref}
      provider={PROVIDER_DEFAULT}
      style={[styles.map, style]}
      mapType="none"
      rotateEnabled={false}
      {...props}
    >
      <UrlTile
        urlTemplate={OSM_TILE_URL}
        maximumZ={19}
        flipY={false}
        tileSize={256}
      />
      {children}
    </MapView>
  );
});

TripMap.displayName = 'TripMap';

export default TripMap;

const styles = StyleSheet.create({
  map: { flex: 1 },
});
