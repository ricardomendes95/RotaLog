import { MIN_ACCURACY_METERS } from '@/constants';

export function isAccuracyValid(accuracyMeters: number | null): boolean {
  if (accuracyMeters === null) return false;
  return accuracyMeters <= MIN_ACCURACY_METERS;
}

export function isMoving(speedMs: number | null, minSpeedKmh: number): boolean {
  if (speedMs === null) return false;
  return speedMs * 3.6 >= minSpeedKmh;
}
