import { MIN_ACCURACY_METERS, MIN_SPEED_KMH } from '@/constants';

export function isAccuracyValid(accuracyMeters: number | null): boolean {
  if (accuracyMeters === null) return false;
  return accuracyMeters <= MIN_ACCURACY_METERS;
}

export function isMoving(speedMs: number | null): boolean {
  if (speedMs === null) return false;
  return speedMs * 3.6 >= MIN_SPEED_KMH;
}
