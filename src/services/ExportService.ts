import { RefObject } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

export async function captureView(ref: RefObject<View | null>): Promise<string> {
  const uri = await captureRef(ref as RefObject<View>, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
    useRenderInContext: true,
  });
  return uri;
}

export async function saveToGallery(uri: string): Promise<boolean> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') return false;
  await MediaLibrary.saveToLibraryAsync(uri);
  return true;
}

export async function shareImage(uri: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('Compartilhamento não disponível neste dispositivo.');
  await Sharing.shareAsync(uri, { mimeType: 'image/png' });
}
