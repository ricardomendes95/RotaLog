import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTrips } from '@/hooks/useDatabase';
import { compareTrips, VehicleConfig, ComparisonResult } from '@/utils/routeComparison';
import { formatDistance, formatDuration, formatDate } from '@/utils/formatters';
import { TRANSPORT_ICONS, TRANSPORT_LABELS } from '@/constants';
import { Trip } from '@/types';

type Step = 'select' | 'config' | 'result';

const BADGE_A = '#1565c0';
const BADGE_B = '#FF4500';
const WIN_COLOR = '#4caf50';

function needsFuelConfig(tripA: Trip | null, tripB: Trip | null): boolean {
  const motorized = (t: Trip | null) =>
    t?.transportType === 'car' || t?.transportType === 'motorcycle';
  return motorized(tripA) || motorized(tripB);
}

export default function CompareRoutesScreen() {
  const { trips, loading, loadTrips } = useTrips();

  const [step, setStep] = useState<Step>('select');
  const [tripA, setTripA] = useState<Trip | null>(null);
  const [tripB, setTripB] = useState<Trip | null>(null);
  const [consumption, setConsumption] = useState('10.0');
  const [price, setPrice] = useState('6.00');
  const [result, setResult] = useState<ComparisonResult | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips]),
  );

  function handleTripTap(trip: Trip) {
    if (tripA?.id === trip.id) {
      setTripA(null);
      return;
    }
    if (tripB?.id === trip.id) {
      setTripB(null);
      return;
    }
    if (!tripA) {
      setTripA(trip);
      return;
    }
    if (!tripB) {
      setTripB(trip);
      return;
    }
    // ambos já preenchidos → substitui B
    setTripB(trip);
  }

  function badgeOf(trip: Trip): 'A' | 'B' | null {
    if (tripA?.id === trip.id) return 'A';
    if (tripB?.id === trip.id) return 'B';
    return null;
  }

  function handleAdvance() {
    if (!tripA || !tripB) return;
    if (needsFuelConfig(tripA, tripB)) {
      setStep('config');
    } else {
      calculate('0', '0');
    }
  }

  function calculate(cons: string, pri: string) {
    if (!tripA || !tripB) return;
    const config: VehicleConfig = {
      baseConsumptionL100km: parseFloat(cons) || 0,
      fuelPricePerLiter: parseFloat(pri) || 0,
    };
    setResult(compareTrips(tripA, tripB, config));
    setStep('result');
  }

  function reset() {
    setStep('select');
    setTripA(null);
    setTripB(null);
    setConsumption('10.0');
    setPrice('6.00');
    setResult(null);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Comparar Rotas</Text>
      </View>

      {step === 'select' && (
        <SelectStep
          trips={trips}
          loading={loading}
          badgeOf={badgeOf}
          onTap={handleTripTap}
          tripA={tripA}
          tripB={tripB}
          onAdvance={handleAdvance}
        />
      )}

      {step === 'config' && tripA && tripB && (
        <ConfigStep
          tripA={tripA}
          tripB={tripB}
          consumption={consumption}
          price={price}
          onConsumptionChange={setConsumption}
          onPriceChange={setPrice}
          onCalculate={() => calculate(consumption, price)}
          onBack={() => setStep('select')}
        />
      )}

      {step === 'result' && result && tripA && tripB && (
        <ResultStep result={result} onReset={reset} />
      )}
    </View>
  );
}

// ─── Step 1: Selecionar trajetos ──────────────────────────────────────────────

function SelectStep({
  trips, loading, badgeOf, onTap, tripA, tripB, onAdvance,
}: {
  trips: Trip[];
  loading: boolean;
  badgeOf: (t: Trip) => 'A' | 'B' | null;
  onTap: (t: Trip) => void;
  tripA: Trip | null;
  tripB: Trip | null;
  onAdvance: () => void;
}) {
  const canAdvance = !!tripA && !!tripB;

  return (
    <View style={styles.flex}>
      <View style={styles.stepHint}>
        <BadgeChip label="A" color={BADGE_A} selected={!!tripA} name={tripA?.name ?? (tripA ? TRANSPORT_LABELS[tripA.transportType] : '—')} />
        <Text style={styles.vsText}>vs</Text>
        <BadgeChip label="B" color={BADGE_B} selected={!!tripB} name={tripB?.name ?? (tripB ? TRANSPORT_LABELS[tripB.transportType] : '—')} />
      </View>

      <Text style={styles.stepSub}>Toque nos trajetos para selecionar A e B</Text>

      {loading ? (
        <ActivityIndicator style={styles.loader} color="#FF4500" />
      ) : trips.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyText}>Nenhum trajeto salvo ainda.</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const badge = badgeOf(item);
            return (
              <TouchableOpacity
                style={[styles.tripRow, badge === 'A' && styles.tripRowA, badge === 'B' && styles.tripRowB]}
                onPress={() => onTap(item)}
                activeOpacity={0.7}
              >
                {badge && (
                  <View style={[styles.badgePill, { backgroundColor: badge === 'A' ? BADGE_A : BADGE_B }]}>
                    <Text style={styles.badgePillText}>{badge}</Text>
                  </View>
                )}
                <Text style={styles.tripIcon}>{TRANSPORT_ICONS[item.transportType]}</Text>
                <View style={styles.tripInfo}>
                  <Text style={styles.tripName} numberOfLines={1}>
                    {item.name ?? TRANSPORT_LABELS[item.transportType]}
                  </Text>
                  <Text style={styles.tripMeta}>
                    {formatDate(item.startedAt)} · {formatDistance(item.distanceKm)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <TouchableOpacity
        style={[styles.primaryBtn, !canAdvance && styles.primaryBtnDisabled]}
        onPress={onAdvance}
        disabled={!canAdvance}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryBtnText}>Avançar →</Text>
      </TouchableOpacity>
    </View>
  );
}

function BadgeChip({ label, color, selected, name }: { label: string; color: string; selected: boolean; name: string }) {
  return (
    <View style={styles.badgeChip}>
      <View style={[styles.badgeCircle, { backgroundColor: selected ? color : '#333' }]}>
        <Text style={styles.badgeCircleText}>{label}</Text>
      </View>
      <Text style={styles.badgeChipName} numberOfLines={1}>{name}</Text>
    </View>
  );
}

// ─── Step 2: Configurar veículo ───────────────────────────────────────────────

function ConfigStep({
  tripA, tripB, consumption, price, onConsumptionChange, onPriceChange, onCalculate, onBack,
}: {
  tripA: Trip; tripB: Trip;
  consumption: string; price: string;
  onConsumptionChange: (v: string) => void;
  onPriceChange: (v: string) => void;
  onCalculate: () => void;
  onBack: () => void;
}) {
  const defaultCons = tripA.transportType === 'motorcycle' || tripB.transportType === 'motorcycle'
    ? '5.0' : '10.0';

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.configScroll}>
        <Text style={styles.configTitle}>Dados do Veículo</Text>
        <Text style={styles.configSub}>
          Informe o consumo real do seu veículo e o preço atual do combustível para calcular o custo estimado de cada rota.
        </Text>

        <View style={styles.configCard}>
          <Text style={styles.configLabel}>⛽  Consumo do veículo</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.configInput}
              value={consumption}
              onChangeText={onConsumptionChange}
              keyboardType="decimal-pad"
              placeholder={defaultCons}
              placeholderTextColor="#555"
            />
            <Text style={styles.inputUnit}>L/100 km</Text>
          </View>
          <Text style={styles.configHint}>Referência: carro médio ≈ 10 · moto média ≈ 5</Text>
        </View>

        <View style={styles.configCard}>
          <Text style={styles.configLabel}>💰  Preço do combustível</Text>
          <View style={styles.inputRow}>
            <Text style={styles.inputPrefix}>R$</Text>
            <TextInput
              style={styles.configInput}
              value={price}
              onChangeText={onPriceChange}
              keyboardType="decimal-pad"
              placeholder="6.00"
              placeholderTextColor="#555"
            />
            <Text style={styles.inputUnit}>/ L</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={onCalculate} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>Calcular Comparativo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ghostBtn} onPress={onBack}>
          <Text style={styles.ghostBtnText}>← Voltar para seleção</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Step 3: Resultado ────────────────────────────────────────────────────────

function ResultStep({ result, onReset }: { result: ComparisonResult; onReset: () => void }) {
  const { a, b, fuelWinner, timeWinner, distanceWinner, overallWinner } = result;

  const labelA = a.trip.name ?? TRANSPORT_LABELS[a.trip.transportType];
  const labelB = b.trip.name ?? TRANSPORT_LABELS[b.trip.transportType];

  function winnerText() {
    if (overallWinner === 'tie') return 'Os trajetos são equivalentes no geral.';
    const winner = overallWinner === 'A' ? labelA : labelB;
    const cats = [
      fuelWinner === overallWinner && 'combustível',
      timeWinner === overallWinner && 'tempo',
      distanceWinner === overallWinner && 'distância',
    ].filter(Boolean).join(', ');
    return `${winner} é o mais vantajoso: melhor em ${cats}.`;
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.resultScroll}>
      {/* Cabeçalho dos dois trajetos */}
      <View style={styles.resultHeader}>
        <TripHeaderCard trip={a.trip} badge="A" color={BADGE_A} />
        <View style={styles.resultVsDivider} />
        <TripHeaderCard trip={b.trip} badge="B" color={BADGE_B} />
      </View>

      {/* ⛽ Combustível */}
      <CompareBlock
        icon="⛽"
        label="Combustível"
        winner={fuelWinner}
        rowA={
          a.fuelLiters !== null
            ? `${a.fuelLiters.toFixed(2)} L\nR$ ${a.fuelCost!.toFixed(2)}\n${a.co2Kg!.toFixed(2)} kg CO₂`
            : '—\n(não aplica)'
        }
        rowB={
          b.fuelLiters !== null
            ? `${b.fuelLiters.toFixed(2)} L\nR$ ${b.fuelCost!.toFixed(2)}\n${b.co2Kg!.toFixed(2)} kg CO₂`
            : '—\n(não aplica)'
        }
        subA={a.fuelLiters !== null ? 'litros · custo · CO₂' : undefined}
        subB={b.fuelLiters !== null ? 'litros · custo · CO₂' : undefined}
      />

      {/* ⏱ Tempo */}
      <CompareBlock
        icon="⏱"
        label="Tempo"
        winner={timeWinner}
        rowA={`${formatDuration(a.trip.durationTotal)}\n${formatDuration(a.trip.durationMoving)} em movimento\n${a.stopRatioPct.toFixed(0)}% parado`}
        rowB={`${formatDuration(b.trip.durationTotal)}\n${formatDuration(b.trip.durationMoving)} em movimento\n${b.stopRatioPct.toFixed(0)}% parado`}
        subA="total · movimento · trânsito"
        subB="total · movimento · trânsito"
      />

      {/* 📍 Distância */}
      <CompareBlock
        icon="📍"
        label="Distância"
        winner={distanceWinner}
        rowA={`${formatDistance(a.trip.distanceKm)}\nVel. média: ${a.trip.speedAvg.toFixed(1)} km/h`}
        rowB={`${formatDistance(b.trip.distanceKm)}\nVel. média: ${b.trip.speedAvg.toFixed(1)} km/h`}
        subA="percorrida · velocidade"
        subB="percorrida · velocidade"
      />

      {/* Resumo geral */}
      <View style={[styles.summaryCard, overallWinner !== 'tie' && { borderColor: WIN_COLOR }]}>
        <Text style={styles.summaryIcon}>📊</Text>
        <Text style={styles.summaryText}>{winnerText()}</Text>
      </View>

      <TouchableOpacity style={styles.ghostBtn} onPress={onReset}>
        <Text style={styles.ghostBtnText}>⇄ Nova comparação</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function TripHeaderCard({ trip, badge, color }: { trip: Trip; badge: string; color: string }) {
  const label = trip.name ?? TRANSPORT_LABELS[trip.transportType];
  return (
    <View style={styles.tripHeaderCard}>
      <View style={[styles.badgePill, { backgroundColor: color }]}>
        <Text style={styles.badgePillText}>{badge}</Text>
      </View>
      <Text style={styles.tripHeaderIcon}>{TRANSPORT_ICONS[trip.transportType]}</Text>
      <Text style={styles.tripHeaderName} numberOfLines={2}>{label}</Text>
      <Text style={styles.tripHeaderDate}>{formatDate(trip.startedAt)}</Text>
    </View>
  );
}

function CompareBlock({
  icon, label, winner, rowA, rowB, subA, subB,
}: {
  icon: string; label: string;
  winner: 'A' | 'B' | 'tie' | 'na';
  rowA: string; rowB: string;
  subA?: string; subB?: string;
}) {
  const aWins = winner === 'A';
  const bWins = winner === 'B';
  return (
    <View style={styles.compareBlock}>
      <Text style={styles.blockLabel}>{icon}  {label}</Text>
      <View style={styles.blockRow}>
        <View style={[styles.blockCell, aWins && styles.blockCellWin]}>
          {aWins && <Text style={styles.trophyIcon}>🏆</Text>}
          <Text style={[styles.blockValue, aWins && styles.blockValueWin]}>{rowA}</Text>
          {subA && <Text style={styles.blockSub}>{subA}</Text>}
        </View>
        <View style={styles.blockDivider} />
        <View style={[styles.blockCell, bWins && styles.blockCellWin]}>
          {bWins && <Text style={styles.trophyIcon}>🏆</Text>}
          <Text style={[styles.blockValue, bWins && styles.blockValueWin]}>{rowB}</Text>
          {subB && <Text style={styles.blockSub}>{subB}</Text>}
        </View>
      </View>
      {winner === 'tie' && <Text style={styles.tieText}>Empate nesta categoria</Text>}
      {winner === 'na' && <Text style={styles.tieText}>Não aplicável (sem motor a combustão)</Text>}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  flex: { flex: 1 },

  header: {
    backgroundColor: '#0f3460',
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },

  // Select step
  stepHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  vsText: { color: '#aaa', fontSize: 16, fontWeight: '700' },
  badgeChip: { alignItems: 'center', flex: 1, gap: 4 },
  badgeCircle: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeCircleText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  badgeChipName: { color: '#ccc', fontSize: 11, textAlign: 'center' },
  stepSub: { color: '#888', fontSize: 12, textAlign: 'center', marginTop: 6, marginBottom: 4, paddingHorizontal: 16 },

  loader: { marginTop: 48 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#fff', fontSize: 15 },
  list: { paddingVertical: 6, paddingHorizontal: 12 },

  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    marginVertical: 4,
    padding: 12,
    gap: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  tripRowA: { borderColor: BADGE_A },
  tripRowB: { borderColor: BADGE_B },
  badgePill: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  badgePillText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  tripIcon: { fontSize: 22 },
  tripInfo: { flex: 1 },
  tripName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  tripMeta: { color: '#888', fontSize: 12, marginTop: 2 },

  primaryBtn: {
    backgroundColor: '#FF4500',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnDisabled: { backgroundColor: '#663300' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ghostBtn: { alignItems: 'center', paddingVertical: 14, marginBottom: 16 },
  ghostBtnText: { color: '#FF4500', fontSize: 14, fontWeight: '600' },

  // Config step
  configScroll: { padding: 20, gap: 16 },
  configTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  configSub: { color: '#888', fontSize: 13, lineHeight: 18, marginBottom: 8 },
  configCard: {
    backgroundColor: '#16213e',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a4e',
    gap: 8,
  },
  configLabel: { color: '#ccc', fontSize: 14, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputPrefix: { color: '#aaa', fontSize: 15, fontWeight: '600' },
  configInput: {
    flex: 1,
    backgroundColor: '#0f3460',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 18,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  inputUnit: { color: '#aaa', fontSize: 13 },
  configHint: { color: '#666', fontSize: 11 },

  // Result step
  resultScroll: { padding: 14, gap: 12 },
  resultHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f3460',
    borderRadius: 14,
    overflow: 'hidden',
  },
  resultVsDivider: { width: 1, backgroundColor: '#1a3a60' },
  tripHeaderCard: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    gap: 4,
  },
  tripHeaderIcon: { fontSize: 28, marginTop: 4 },
  tripHeaderName: { color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  tripHeaderDate: { color: '#888', fontSize: 10, textAlign: 'center' },

  compareBlock: {
    backgroundColor: '#16213e',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a4e',
    gap: 10,
  },
  blockLabel: { color: '#ccc', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  blockRow: { flexDirection: 'row', gap: 0 },
  blockCell: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 2,
  },
  blockCellWin: { backgroundColor: 'rgba(76, 175, 80, 0.12)', borderWidth: 1, borderColor: WIN_COLOR },
  trophyIcon: { fontSize: 16, marginBottom: 2 },
  blockValue: { color: '#ccc', fontSize: 13, textAlign: 'center', lineHeight: 19 },
  blockValueWin: { color: '#fff', fontWeight: '700' },
  blockSub: { color: '#555', fontSize: 10, textAlign: 'center', marginTop: 2 },
  blockDivider: { width: 1, backgroundColor: '#2a2a4e', marginVertical: 8 },
  tieText: { color: '#888', fontSize: 12, textAlign: 'center', fontStyle: 'italic' },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#16213e',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#2a2a4e',
  },
  summaryIcon: { fontSize: 22 },
  summaryText: { flex: 1, color: '#fff', fontSize: 14, lineHeight: 20 },
});
