import { Trip } from '@/types';

export interface VehicleConfig {
  baseConsumptionL100km: number;
  fuelPricePerLiter: number;
}

export interface TripComparison {
  trip: Trip;
  fuelLiters: number | null;
  fuelCost: number | null;
  co2Kg: number | null;
  stopRatioPct: number;
}

export interface ComparisonResult {
  a: TripComparison;
  b: TripComparison;
  fuelWinner: 'A' | 'B' | 'tie' | 'na';
  timeWinner: 'A' | 'B' | 'tie';
  distanceWinner: 'A' | 'B' | 'tie';
  overallWinner: 'A' | 'B' | 'tie';
}

// Curva U de consumo por velocidade — baseada em dados EPA/DOE e literatura automotiva.
// Consumo mínimo ocorre entre 70–80 km/h; aumenta em ambos os extremos.
function speedFactor(avgSpeedKmh: number): number {
  if (avgSpeedKmh <= 10) return 2.00;
  if (avgSpeedKmh <= 25) return 1.50;
  if (avgSpeedKmh <= 40) return 1.25;
  if (avgSpeedKmh <= 60) return 1.10;
  if (avgSpeedKmh <= 80) return 1.00;
  if (avgSpeedKmh <= 100) return 1.10;
  if (avgSpeedKmh <= 120) return 1.25;
  return 1.40;
}

function isFuelBased(trip: Trip): boolean {
  return trip.transportType === 'car' || trip.transportType === 'motorcycle';
}

export function estimateFuelLiters(trip: Trip, config: VehicleConfig): number | null {
  if (!isFuelBased(trip)) return null;

  // Consumo em movimento ajustado pela velocidade média
  const fuelMoving =
    (trip.distanceKm * config.baseConsumptionL100km * speedFactor(trip.speedAvg)) / 100;

  // Consumo em idle: tempo parado × taxa de idle
  // Taxa = 7% do consumo nominal/hora → ~0,7 L/h para veículo de 10 L/100km (compatível com EPA)
  const stoppedHours = Math.max(0, trip.durationTotal - trip.durationMoving) / 3600;
  const fuelIdle = stoppedHours * config.baseConsumptionL100km * 0.07;

  return fuelMoving + fuelIdle;
}

function buildTripComparison(trip: Trip, config: VehicleConfig): TripComparison {
  const fuelLiters = estimateFuelLiters(trip, config);
  const fuelCost = fuelLiters !== null ? fuelLiters * config.fuelPricePerLiter : null;
  const co2Kg = fuelLiters !== null ? fuelLiters * 2.31 : null; // 2,31 kg CO₂/L gasolina
  const stopRatioPct =
    trip.durationTotal > 0
      ? (Math.max(0, trip.durationTotal - trip.durationMoving) / trip.durationTotal) * 100
      : 0;

  return { trip, fuelLiters, fuelCost, co2Kg, stopRatioPct };
}

function winner<T>(
  a: T | null,
  b: T | null,
  lowerIsBetter = true,
): 'A' | 'B' | 'tie' | 'na' {
  if (a === null && b === null) return 'na';
  if (a === null) return 'B';
  if (b === null) return 'A';
  const diff = (a as number) - (b as number);
  if (Math.abs(diff) < 1e-9) return 'tie';
  return (lowerIsBetter ? diff < 0 : diff > 0) ? 'A' : 'B';
}

export function compareTrips(
  tripA: Trip,
  tripB: Trip,
  config: VehicleConfig,
): ComparisonResult {
  const a = buildTripComparison(tripA, config);
  const b = buildTripComparison(tripB, config);

  const fuelWinner = winner(a.fuelCost, b.fuelCost) as 'A' | 'B' | 'tie' | 'na';
  const timeWinner = winner(tripA.durationTotal, tripB.durationTotal) as 'A' | 'B' | 'tie';
  const distanceWinner = winner(tripA.distanceKm, tripB.distanceKm) as 'A' | 'B' | 'tie';

  const points = (label: 'A' | 'B') =>
    [fuelWinner, timeWinner, distanceWinner].filter((w) => w === label).length;

  const pA = points('A');
  const pB = points('B');
  const overallWinner: 'A' | 'B' | 'tie' = pA > pB ? 'A' : pB > pA ? 'B' : 'tie';

  return { a, b, fuelWinner, timeWinner, distanceWinner, overallWinner };
}
