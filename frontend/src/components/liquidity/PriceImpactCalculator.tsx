import { useState, useMemo } from "react";
import type { DepthData, PriceImpactResult } from "../../types/liquidity";

interface Props {
  depth: DepthData | null;
}

/**
 * Walk the ask side of the order book to calculate expected fill price
 * and slippage for a given trade size (in quote asset units).
 */
function calcPriceImpact(depth: DepthData, tradeSize: number): PriceImpactResult {
  if (!depth.asks.length || tradeSize <= 0) {
    return { tradeSize, expectedPrice: depth.midPrice, slippagePct: 0, fillableLiquidity: 0 };
  }

  let remaining = tradeSize;
  let totalCost = 0;
  let prevVolume = 0;

  for (const level of depth.asks) {
    const levelVolume = level.volume - prevVolume; // incremental volume at this level
    const fillable = Math.min(remaining, levelVolume);
    totalCost += fillable * level.price;
    remaining -= fillable;
    prevVolume = level.volume;
    if (remaining <= 0) break;
  }

  const filled = tradeSize - remaining;
  const expectedPrice = filled > 0 ? totalCost / filled : depth.midPrice;
  const slippagePct = ((expectedPrice - depth.midPrice) / depth.midPrice) * 100;

  return {
    tradeSize,
    expectedPrice: parseFloat(expectedPrice.toFixed(7)),
    slippagePct: parseFloat(slippagePct.toFixed(4)),
    fillableLiquidity: parseFloat(filled.toFixed(7)),
  };
}

/**
 * PriceImpactCalculator — given a trade size, shows expected slippage
 * based on the aggregated order book depth.
 */
export default function PriceImpactCalculator({ depth }: Props) {
  const [tradeSize, setTradeSize] = useState<string>("");

  const result = useMemo<PriceImpactResult | null>(() => {
    const size = parseFloat(tradeSize);
    if (!depth || isNaN(size) || size <= 0) return null;
    return calcPriceImpact(depth, size);
  }, [depth, tradeSize]);

  const slippageColor =
    !result ? "text-white"
    : result.slippagePct < 0.1 ? "text-green-400"
    : result.slippagePct < 0.5 ? "text-yellow-400"
    : "text-red-400";

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="trade-size"
          className="block text-xs text-stellar-text-secondary mb-1"
        >
          Trade size (quote asset)
        </label>
        <input
          id="trade-size"
          type="number"
          min="0"
          step="any"
          placeholder="e.g. 10000"
          value={tradeSize}
          onChange={(e) => setTradeSize(e.target.value)}
          className="w-full bg-stellar-dark border border-stellar-border rounded-md px-3 py-2 text-sm text-white placeholder-stellar-text-secondary focus:outline-none focus:ring-2 focus:ring-stellar-blue"
        />
      </div>

      {result && (
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-stellar-text-secondary">Expected price</dt>
            <dd className="text-white font-mono">{result.expectedPrice.toFixed(7)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stellar-text-secondary">Slippage</dt>
            <dd className={`font-mono font-semibold ${slippageColor}`}>
              {result.slippagePct >= 0 ? "+" : ""}
              {result.slippagePct.toFixed(4)}%
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stellar-text-secondary">Fillable liquidity</dt>
            <dd className="text-white font-mono">
              {result.fillableLiquidity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </dd>
          </div>
        </dl>
      )}

      {!depth && (
        <p className="text-xs text-stellar-text-secondary">
          Waiting for depth data…
        </p>
      )}
    </div>
  );
}
