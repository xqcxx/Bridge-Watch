/**
 * useLiquidity — custom hook for real-time liquidity aggregation.
 *
 * Manages WebSocket subscriptions for a given trading pair and normalises
 * data from three sources: SDEX, StellarX AMM, and Phoenix.
 *
 * @example
 * const { depth, venues, history, isLoading, error } = useLiquidity("USDC/XLM");
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { wsService } from "../services/websocket";
import { getAssetLiquidity } from "../services/api";
import type {
  TradingPair,
  LiquidityState,
  LiquidityWsMessage,
  VenueLiquidity,
  DepthData,
  LiquiditySnapshot,
  OrderBookLevel,
  LiquidityVenue,
} from "../types/liquidity";

/** Stellar uses 7 decimal places — round to avoid floating-point drift */
const STELLAR_PRECISION = 7;
function round7(n: number): number {
  return parseFloat(n.toFixed(STELLAR_PRECISION));
}

/**
 * Derive the base asset symbol from a pair string (e.g. "USDC/XLM" → "USDC").
 */
function baseSymbol(pair: TradingPair): string {
  return pair.split("/")[0];
}

/**
 * Normalise raw venue liquidity data from the REST API into VenueLiquidity[].
 * Handles missing or zero-total cases gracefully.
 */
function normaliseVenues(
  sources: Array<{ dex: string; bidDepth: number; askDepth: number; totalLiquidity: number }>
): VenueLiquidity[] {
  const total = sources.reduce((sum, s) => sum + s.totalLiquidity, 0);
  return sources.map((s) => ({
    venue: s.dex as LiquidityVenue,
    totalLiquidity: round7(s.totalLiquidity),
    bidDepth: round7(s.bidDepth),
    askDepth: round7(s.askDepth),
    share: total > 0 ? round7((s.totalLiquidity / total) * 100) : 0,
  }));
}

/**
 * Build a synthetic DepthData from venue data when no WebSocket message
 * has arrived yet (REST bootstrap).
 */
function buildSyntheticDepth(
  pair: TradingPair,
  venues: VenueLiquidity[]
): DepthData {
  const bids: OrderBookLevel[] = [];
  const asks: OrderBookLevel[] = [];
  let cumBid = 0;
  let cumAsk = 0;

  venues.forEach((v) => {
    // Spread synthetic levels across 5 price steps per venue
    const bidStep = v.bidDepth / 5;
    const askStep = v.askDepth / 5;
    for (let i = 1; i <= 5; i++) {
      cumBid += bidStep;
      bids.push({ price: round7(1 - i * 0.001), volume: round7(cumBid), venue: v.venue });
      cumAsk += askStep;
      asks.push({ price: round7(1 + i * 0.001), volume: round7(cumAsk), venue: v.venue });
    }
  });

  bids.sort((a, b) => b.price - a.price);
  asks.sort((a, b) => a.price - b.price);

  return { pair, bids, asks, midPrice: 1, timestamp: new Date().toISOString() };
}

/**
 * useLiquidity hook.
 *
 * @param pair - The Phase 1 trading pair to subscribe to.
 * @returns LiquidityState with depth, venues, history, loading, and error.
 */
export function useLiquidity(pair: TradingPair): LiquidityState {
  const symbol = baseSymbol(pair);
  const channel = `liquidity:${pair}`;

  const [state, setState] = useState<LiquidityState>({
    depth: null,
    venues: [],
    history: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  // Keep a rolling history buffer (max 60 snapshots)
  const historyRef = useRef<LiquiditySnapshot[]>([]);

  /** Append a snapshot to the rolling history buffer */
  const pushSnapshot = useCallback((totalLiquidity: number) => {
    const snapshot: LiquiditySnapshot = {
      timestamp: new Date().toISOString(),
      totalLiquidity: round7(totalLiquidity),
      pair,
    };
    historyRef.current = [...historyRef.current.slice(-59), snapshot];
    return historyRef.current;
  }, [pair]);

  // ── REST bootstrap via React Query ──────────────────────────────────────
  const { data: restData, isLoading: restLoading, error: restError } = useQuery({
    queryKey: ["liquidity", symbol],
    queryFn: () => getAssetLiquidity(symbol),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (restLoading) return;

    if (restError) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: restError instanceof Error ? restError.message : "Failed to load liquidity",
      }));
      return;
    }

    if (!restData) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    const venues = normaliseVenues(restData.sources);
    const depth = buildSyntheticDepth(pair, venues);
    const history = pushSnapshot(restData.totalLiquidity);

    setState((prev) => ({
      ...prev,
      depth,
      venues,
      history,
      isLoading: false,
      error: null,
      lastUpdated: new Date().toISOString(),
    }));
  }, [restData, restLoading, restError, pair, pushSnapshot]);

  // ── WebSocket real-time updates ──────────────────────────────────────────
  const handleWsMessage = useCallback(
    (raw: unknown) => {
      const msg = raw as LiquidityWsMessage;
      if (!msg?.depth || !msg?.venues) return;

      const venues = msg.venues.map((v) => ({
        ...v,
        totalLiquidity: round7(v.totalLiquidity),
        bidDepth: round7(v.bidDepth),
        askDepth: round7(v.askDepth),
        share: round7(v.share),
      }));

      const totalLiquidity = venues.reduce((s, v) => s + v.totalLiquidity, 0);
      const history = pushSnapshot(totalLiquidity);

      setState({
        depth: msg.depth,
        venues,
        history,
        isLoading: false,
        error: null,
        lastUpdated: new Date().toISOString(),
      });
    },
    [pushSnapshot]
  );

  useEffect(() => {
    // Subscribe and return cleanup to unsubscribe on unmount / pair change
    const unsubscribe = wsService.subscribe(channel, handleWsMessage);
    return () => {
      unsubscribe();
    };
  }, [channel, handleWsMessage]);

  return state;
}
