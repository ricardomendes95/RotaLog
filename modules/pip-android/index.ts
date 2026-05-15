import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

const Native = Platform.OS === 'android'
  ? requireOptionalNativeModule('PipAndroid')
  : null;

export const PipAndroid = {
  isSupported: (): boolean => Native?.isSupported() ?? false,
  setup: (): void => { Native?.setup(); },
  enter: (): void => { Native?.enter(); },
  isInPip: (): boolean => Native?.isInPip() ?? false,
};
