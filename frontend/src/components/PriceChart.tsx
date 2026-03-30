import { useCallback, useMemo, useRef, useState } from "react";
import {
  Brush,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartControls, { type TimeRangeId } from "./ChartControls";
import DeviationHighlightOverlay from "./DeviationHighlightOverlay";
import PriceSourceLegend from "./PriceSourceLegend";
import {
  type PriceSourceId,
  usePriceComparison,
} from "../hooks/usePriceComparison";
import { SkeletonChart } from "./Skeleton";

interface PriceChartProps {
  symbol: string;
}

const SOURCE_COLORS: Record<PriceSourceId, string> = {
  stellar_dex: "#0057FF",
  circle: "#00D4AA",
  coinbase: "#0052FF",
  stellar_amm: "#FF6B35",
};

const ALL_SOURCES: PriceSourceId[] = [
  "stellar_dex",
  "circle",
  "coinbase",
  "stellar_amm",
];

function stellarVarRgb(varName: string, fallbackRgb: string): string {
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    if (!raw) return fallbackRgb;
    return `rgb(${raw})`;
  } catch {
    return fallbackRgb;
  }
}

function msForRange(rangeId: TimeRangeId, customStartIso: string, customEndIso: string): number {
  if (rangeId === "1h") return 60 * 60 * 1000;
  if (rangeId === "24h") return 24 * 60 * 60 * 1000;
  if (rangeId === "7d") return 7 * 24 * 60 * 60 * 1000;
  if (rangeId === "30d") return 30 * 24 * 60 * 60 * 1000;

  const start = Date.parse(customStartIso);
  const end = Date.parse(customEndIso);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 60 * 60 * 1000;
  return end - start;
}

function formatPct(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "--";
  return `${(value * 100).toFixed(2)}%`;
}

function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "--";
  return `${value.toFixed(6)}`;
}

function tooltipLabelFromIso(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function PriceChart({ symbol }: PriceChartProps) {
  const titleId = `price-chart-title-${symbol}`;
  const descId = `price-chart-desc-${symbol}`;
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [rangeId, setRangeId] = useState<TimeRangeId>("24h");
  const [customStartIso, setCustomStartIso] = useState("");
  const [customEndIso, setCustomEndIso] = useState("");
  const [deviationThresholdPct, setDeviationThresholdPct] = useState(1);
  const [showVwap, setShowVwap] = useState(false);
  const [enabled, setEnabled] = useState<Record<PriceSourceId, boolean>>({
    stellar_dex: true,
    circle: true,
    coinbase: true,
    stellar_amm: true,
  });

  const enabledSources = useMemo(
    () => ALL_SOURCES.filter((s) => enabled[s]),
    [enabled]
  );

  const rangeMs = useMemo(
    () => msForRange(rangeId, customStartIso, customEndIso),
    [customEndIso, customStartIso, rangeId]
  );

  // All hooks must be called unconditionally before any early returns
  const comparison = usePriceComparison({
    symbol,
    enabledSources,
    rangeMs,
    refetchIntervalMs: 10_000,
  });

  const chartData = useMemo(() => {
    return comparison.points.map((p) => {
      const row: Record<string, unknown> = {
        t: p.t,
        iso: p.iso,
        vwap: p.vwap,
        deviationPct: p.deviationPct,
      };
      for (const s of ALL_SOURCES) {
        row[s] = p.prices[s] ?? null;
      }
      return row;
    });
  }, [comparison.points]);

  const deviationRanges = useMemo(() => {
    const threshold = deviationThresholdPct / 100;
    const ranges: Array<{ x1: number; x2: number }> = [];
    let start: number | null = null;

    for (const p of comparison.points) {
      const deviated = (p.deviationPct ?? 0) >= threshold;
      if (deviated) {
        if (start === null) start = p.t;
      } else if (start !== null) {
        ranges.push({ x1: start, x2: p.t });
        start = null;
      }
    }

    if (start !== null && comparison.points.length) {
      ranges.push({ x1: start, x2: comparison.points[comparison.points.length - 1].t });
    }

    return ranges;
  }, [comparison.points, deviationThresholdPct]);

  const onToggleSource = useCallback((source: PriceSourceId) => {
    setEnabled((prev) => ({ ...prev, [source]: !prev[source] }));
  }, []);

  const onExportPng = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;
    const svg = root.querySelector("svg");
    if (!svg) return;

    const svgText = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const width = img.width || 1200;
      const height = img.height || 600;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = stellarVarRgb("--stellar-bg", "rgb(11 14 26)");
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);

      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${symbol}-price-comparison.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }, "image/png");
    };

    img.src = url;
  }, [symbol]);

  const currentAttributed = useMemo(() => {
    for (const s of enabledSources) {
      const v = comparison.currentPrices[s];
      if (typeof v === "number" && Number.isFinite(v)) return { source: s, price: v };
    }
    return { source: enabledSources[0] ?? "stellar_dex", price: null as number | null };
  }, [comparison.currentPrices, enabledSources]);

  // Early returns AFTER all hooks
  if (comparison.isLoading && chartData.length === 0) {
    return <SkeletonChart height={340} ariaLabel={`${symbol} price chart loading`} />;
  }

  if (!comparison.isLoading && chartData.length === 0) {
    return (
      <div className="bg-stellar-card border border-stellar-border rounded-lg p-6">
        <h3 id={titleId} className="text-lg font-semibold text-white mb-4">
          {symbol} Price History
        </h3>
        <div className="h-64 flex items-center justify-center" role="status" aria-live="polite">
          <span className="text-stellar-text-secondary">No price data available</span>
        </div>
      </div>
    );
  }

  return (
    <figure
      className="bg-stellar-card border border-stellar-border rounded-lg p-6"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <figcaption className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 id={titleId} className="text-lg font-semibold text-stellar-text-primary">
              {symbol} Price Comparison
            </h3>
            <p id={descId} className="sr-only">
              Interactive line chart comparing {symbol} prices across multiple sources.
            </p>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div className="text-stellar-text-primary">
                <span className="text-stellar-text-secondary">Current</span>{" "}
                {formatPrice(currentAttributed.price)}
                <span className="ml-2 text-stellar-text-secondary">
                  ({currentAttributed.source.replace("_", " ")})
                </span>
              </div>
              <div className="text-stellar-text-primary">
                <span className="text-stellar-text-secondary">VWAP</span>{" "}
                {formatPrice(comparison.currentVwap)}
              </div>
              <div className="text-stellar-text-primary">
                <span className="text-stellar-text-secondary">Deviation</span>{" "}
                {formatPct(comparison.currentDeviationPct)}
              </div>
            </div>
          </div>

          <div className="md:min-w-[420px]">
            <ChartControls
              rangeId={rangeId}
              onRangeIdChange={setRangeId}
              customStartIso={customStartIso}
              customEndIso={customEndIso}
              onCustomStartIsoChange={setCustomStartIso}
              onCustomEndIsoChange={setCustomEndIso}
              deviationThresholdPct={deviationThresholdPct}
              onDeviationThresholdPctChange={setDeviationThresholdPct}
              showVwap={showVwap}
              onShowVwapChange={setShowVwap}
              onExportPng={onExportPng}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <PriceSourceLegend
            sources={ALL_SOURCES}
            enabled={enabled}
            colors={SOURCE_COLORS}
            onToggle={onToggleSource}
          />
        </div>
      </figcaption>

      <div
        ref={containerRef}
        role="img"
        aria-label={`${symbol} price comparison chart`}
        className="mt-4"
      >
        {comparison.isLoading ? (
          <div className="h-64 flex items-center justify-center" role="status" aria-live="polite">
            <span className="text-stellar-text-secondary">Loading chart data…</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={stellarVarRgb("--stellar-border", "rgb(30 35 64)")}
              />
              <XAxis
                dataKey="t"
                type="number"
                domain={["dataMin", "dataMax"]}
                scale="time"
                tick={{ fontSize: 12 }}
                stroke={stellarVarRgb("--stellar-text-secondary", "rgb(138 143 168)")}
                tickFormatter={(v: number) => {
                  const d = new Date(v);
                  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                }}
              />
              <YAxis
                stroke={stellarVarRgb("--stellar-text-secondary", "rgb(138 143 168)")}
                tick={{ fontSize: 12 }}
                domain={["auto", "auto"]}
                tickFormatter={(v: number) => `${Number(v).toFixed(4)}`}
              />

              <DeviationHighlightOverlay ranges={deviationRanges} />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const row = payload[0].payload as { iso?: string } & Record<string, unknown>;
                  const iso = row.iso;

                  return (
                    <div
                      className="rounded-lg border border-stellar-border bg-stellar-card px-3 py-2 text-sm text-stellar-text-primary"
                      style={{ minWidth: 240 }}
                    >
                      <div className="text-xs text-stellar-text-secondary">
                        {tooltipLabelFromIso(typeof iso === "string" ? iso : undefined)}
                      </div>
                      <div className="mt-2 space-y-1">
                        {enabledSources.map((s) => (
                          <div key={s} className="flex items-center justify-between gap-3">
                            <span className="text-stellar-text-secondary">{s.replace("_", " ")}</span>
                            <span>{formatPrice((row[s] as number | null) ?? null)}</span>
                          </div>
                        ))}
                        {showVwap ? (
                          <div className="flex items-center justify-between gap-3 border-t border-stellar-border/60 pt-1.5">
                            <span className="text-stellar-text-secondary">VWAP</span>
                            <span>{formatPrice((row.vwap as number | null) ?? null)}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                }}
              />

              <Legend />

              {enabledSources.map((s) => (
                <Line
                  key={s}
                  type="monotone"
                  dataKey={s}
                  name={s.replace("_", " ")}
                  stroke={SOURCE_COLORS[s]}
                  dot={false}
                  strokeWidth={2}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}

              {showVwap ? (
                <Line
                  type="monotone"
                  dataKey="vwap"
                  name="VWAP"
                  stroke={stellarVarRgb("--stellar-text-primary", "rgb(255 255 255)")}
                  strokeOpacity={0.7}
                  dot={false}
                  strokeWidth={1.5}
                  connectNulls
                  isAnimationActive={false}
                />
              ) : null}

              <Brush
                dataKey="t"
                height={24}
                stroke={stellarVarRgb("--stellar-border", "rgb(30 35 64)")}
                travellerWidth={10}
                tickFormatter={(v: number) => {
                  const d = new Date(v);
                  return d.toLocaleDateString();
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </figure>
  );
}
