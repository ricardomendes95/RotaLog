import { RefObject } from 'react';
import { View } from 'react-native';
import MapView from 'react-native-maps';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

export async function captureView(ref: RefObject<View | null>): Promise<string> {
  // useRenderInContext é necessário para capturar views nativas como MapView
  const uri = await captureRef(ref as RefObject<View>, {
    format: 'jpg',
    quality: 0.95,
    result: 'tmpfile',
    useRenderInContext: true,
  });
  return uri;
}

export async function captureWithFit(
  reportRef: RefObject<View | null>,
  mapRef: RefObject<MapView | null>,
  coords: { latitude: number; longitude: number }[],
): Promise<string> {
  if (mapRef.current && coords.length > 1) {
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
      animated: false,
    });
    await new Promise((r) => setTimeout(r, 350));
  }
  return captureView(reportRef);
}

export async function saveToGallery(uri: string): Promise<boolean> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') return false;
  // createAssetAsync funciona tanto no Expo Go quanto em builds standalone
  await MediaLibrary.createAssetAsync(uri);
  return true;
}

export async function shareImage(uri: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('Compartilhamento não disponível neste dispositivo.');
  await Sharing.shareAsync(uri, { mimeType: 'image/jpeg' });
}
