export type TimeRangeId = "1h" | "24h" | "7d" | "30d" | "custom";

export interface ChartControlsProps {
  rangeId: TimeRangeId;
  onRangeIdChange: (range: TimeRangeId) => void;
  customStartIso: string;
  customEndIso: string;
  onCustomStartIsoChange: (value: string) => void;
  onCustomEndIsoChange: (value: string) => void;
  deviationThresholdPct: number;
  onDeviationThresholdPctChange: (value: number) => void;
  showVwap: boolean;
  onShowVwapChange: (value: boolean) => void;
  onExportPng: () => void;
}

function RangeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-md border px-2.5 py-1 text-xs transition " +
        (active
          ? "border-stellar-border bg-stellar-card text-stellar-text-primary"
          : "border-stellar-border/60 bg-transparent text-stellar-text-secondary")
      }
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

export default function ChartControls({
  rangeId,
  onRangeIdChange,
  customStartIso,
  customEndIso,
  onCustomStartIsoChange,
  onCustomEndIsoChange,
  deviationThresholdPct,
  onDeviationThresholdPctChange,
  showVwap,
  onShowVwapChange,
  onExportPng,
}: ChartControlsProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <RangeButton
            active={rangeId === "1h"}
            label="1H"
            onClick={() => onRangeIdChange("1h")}
          />
          <RangeButton
            active={rangeId === "24h"}
            label="24H"
            onClick={() => onRangeIdChange("24h")}
          />
          <RangeButton
            active={rangeId === "7d"}
            label="7D"
            onClick={() => onRangeIdChange("7d")}
          />
          <RangeButton
            active={rangeId === "30d"}
            label="30D"
            onClick={() => onRangeIdChange("30d")}
          />
          <RangeButton
            active={rangeId === "custom"}
            label="Custom"
            onClick={() => onRangeIdChange("custom")}
          />
        </div>

        {rangeId === "custom" ? (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-stellar-text-secondary">
              <span>From</span>
              <input
                type="datetime-local"
                value={customStartIso}
                onChange={(e) => onCustomStartIsoChange(e.target.value)}
                className="rounded-md border border-stellar-border bg-transparent px-2 py-1 text-xs text-stellar-text-primary"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-stellar-text-secondary">
              <span>To</span>
              <input
                type="datetime-local"
                value={customEndIso}
                onChange={(e) => onCustomEndIsoChange(e.target.value)}
                className="rounded-md border border-stellar-border bg-transparent px-2 py-1 text-xs text-stellar-text-primary"
              />
            </label>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-stellar-text-secondary">
          <span>Deviation</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={deviationThresholdPct}
            onChange={(e) => onDeviationThresholdPctChange(Number(e.target.value))}
            className="w-20 rounded-md border border-stellar-border bg-transparent px-2 py-1 text-xs text-stellar-text-primary"
          />
          <span>%</span>
        </label>

        <label className="flex items-center gap-2 text-xs text-stellar-text-secondary">
          <input
            type="checkbox"
            checked={showVwap}
            onChange={(e) => onShowVwapChange(e.target.checked)}
            className="h-4 w-4"
          />
          <span>VWAP</span>
        </label>

        <button
          type="button"
          onClick={onExportPng}
          className="rounded-md border border-stellar-border bg-stellar-card px-3 py-1.5 text-xs text-stellar-text-primary"
        >
          Export PNG
        </button>
      </div>
    </div>
  );
}
