import type { PriceSourceId } from "../hooks/usePriceComparison";

const SOURCE_LABELS: Record<PriceSourceId, string> = {
  stellar_dex: "Stellar DEX",
  stellar_amm: "Stellar AMM",
  circle: "Circle",
  coinbase: "Coinbase",
};

export interface PriceSourceLegendProps {
  sources: PriceSourceId[];
  enabled: Record<PriceSourceId, boolean>;
  colors: Record<PriceSourceId, string>;
  onToggle: (source: PriceSourceId) => void;
}

export default function PriceSourceLegend({
  sources,
  enabled,
  colors,
  onToggle,
}: PriceSourceLegendProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {sources.map((s) => {
        const isOn = enabled[s];
        return (
          <button
            key={s}
            type="button"
            onClick={() => onToggle(s)}
            className={
              "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition " +
              (isOn
                ? "border-stellar-border bg-stellar-card text-stellar-text-primary"
                : "border-stellar-border/60 bg-transparent text-stellar-text-secondary")
            }
            aria-pressed={isOn}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colors[s] }}
              aria-hidden="true"
            />
            <span>{SOURCE_LABELS[s]}</span>
          </button>
        );
      })}
    </div>
  );
}
