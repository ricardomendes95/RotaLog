import * as SQLite from 'expo-sqlite';
import { Coordinate, Trip, TransportType, TripMetrics } from '@/types';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('approtas.db');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = await getDb();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS trips (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      transport_type  TEXT NOT NULL,
      started_at      TEXT NOT NULL,
      finished_at     TEXT,
      distance_km     REAL DEFAULT 0,
      duration_total  INTEGER DEFAULT 0,
      duration_moving INTEGER DEFAULT 0,
      speed_avg       REAL DEFAULT 0,
      speed_max       REAL DEFAULT 0,
      speed_min       REAL DEFAULT 0,
      start_lat       REAL,
      start_lng       REAL,
      end_lat         REAL,
      end_lng         REAL
    );

    CREATE TABLE IF NOT EXISTS coordinates (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id     INTEGER NOT NULL,
      latitude    REAL NOT NULL,
      longitude   REAL NOT NULL,
      speed       REAL,
      accuracy    REAL,
      recorded_at TEXT NOT NULL,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_coords_trip ON coordinates(trip_id);
    CREATE INDEX IF NOT EXISTS idx_trips_date  ON trips(started_at);
  `);
}

export async function createTrip(
  transportType: TransportType,
  startedAt: string,
  startLat: number,
  startLng: number,
): Promise<number> {
  const database = await getDb();
  const result = await database.runAsync(
    `INSERT INTO trips (transport_type, started_at, start_lat, start_lng)
     VALUES (?, ?, ?, ?)`,
    [transportType, startedAt, startLat, startLng],
  );
  return result.lastInsertRowId;
}

export async function addCoordinate(
  tripId: number,
  coord: Coordinate,
): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO coordinates (trip_id, latitude, longitude, speed, accuracy, recorded_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [tripId, coord.latitude, coord.longitude, coord.speed, coord.accuracy, coord.recordedAt],
  );
}

export async function finalizeTrip(
  tripId: number,
  metrics: TripMetrics,
  finishedAt: string,
  endLat: number,
  endLng: number,
): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `UPDATE trips SET
      finished_at     = ?,
      distance_km     = ?,
      duration_total  = ?,
      duration_moving = ?,
      speed_avg       = ?,
      speed_max       = ?,
      speed_min       = ?,
      end_lat         = ?,
      end_lng         = ?
     WHERE id = ?`,
    [
      finishedAt,
      metrics.distanceKm,
      metrics.durationTotal,
      metrics.durationMoving,
      metrics.speedAvg,
      metrics.speedMax,
      metrics.speedMin,
      endLat,
      endLng,
      tripId,
    ],
  );
}

export async function getAllTrips(): Promise<Trip[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM trips WHERE finished_at IS NOT NULL ORDER BY started_at DESC',
  );
  return rows.map(rowToTrip);
}

export async function getTripById(tripId: number): Promise<Trip | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM trips WHERE id = ?',
    [tripId],
  );
  return row ? rowToTrip(row) : null;
}

export async function getCoordinatesByTripId(tripId: number): Promise<Coordinate[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM coordinates WHERE trip_id = ? ORDER BY recorded_at ASC',
    [tripId],
  );
  return rows.map((r) => ({
    latitude: r.latitude as number,
    longitude: r.longitude as number,
    speed: r.speed as number | null,
    accuracy: r.accuracy as number | null,
    recordedAt: r.recorded_at as string,
  }));
}

export async function deleteTrip(tripId: number): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM trips WHERE id = ?', [tripId]);
}

function rowToTrip(r: Record<string, unknown>): Trip {
  return {
    id: r.id as number,
    transportType: r.transport_type as TransportType,
    startedAt: r.started_at as string,
    finishedAt: r.finished_at as string | null,
    distanceKm: r.distance_km as number,
    durationTotal: r.duration_total as number,
    durationMoving: r.duration_moving as number,
    speedAvg: r.speed_avg as number,
    speedMax: r.speed_max as number,
    speedMin: r.speed_min as number,
    startLat: r.start_lat as number | null,
    startLng: r.start_lng as number | null,
    endLat: r.end_lat as number | null,
    endLng: r.end_lng as number | null,
  };
}
