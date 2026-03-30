import type { TradingPair } from "../../types/liquidity";

const PHASE1_PAIRS: TradingPair[] = [
  "USDC/XLM",
  "EURC/XLM",
  "PYUSD/XLM",
  "FOBXX/USDC",
];

interface PairSelectorProps {
  value: TradingPair;
  onChange: (pair: TradingPair) => void;
}

/** Dropdown to toggle between Phase 1 asset pairs. */
export default function PairSelector({ value, onChange }: PairSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="pair-selector"
        className="text-sm text-stellar-text-secondary whitespace-nowrap"
      >
        Trading Pair
      </label>
      <select
        id="pair-selector"
        value={value}
        onChange={(e) => onChange(e.target.value as TradingPair)}
        className="bg-stellar-dark border border-stellar-border rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-stellar-blue"
      >
        {PHASE1_PAIRS.map((pair) => (
          <option key={pair} value={pair}>
            {pair}
          </option>
        ))}
      </select>
    </div>
  );
}
