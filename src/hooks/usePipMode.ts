import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { PipAndroid } from 'pip-android';

export function usePipMode(active: boolean) {
  const [isInPip, setIsInPip] = useState(false);

  useEffect(() => {
    if (!active || Platform.OS !== 'android') return;
    if (!PipAndroid.isSupported()) return;

    PipAndroid.setup();

    const interval = setInterval(() => {
      setIsInPip(PipAndroid.isInPip());
    }, 300);

    return () => {
      clearInterval(interval);
      setIsInPip(false);
    };
  }, [active]);

  return { isInPip, enterPip: PipAndroid.enter };
}
