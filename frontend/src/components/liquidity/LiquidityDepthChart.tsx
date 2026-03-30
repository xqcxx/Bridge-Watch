import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { DepthData } from "../../types/liquidity";
import { SkeletonChart } from "../Skeleton";

interface Props {
  data: DepthData | null;
  isLoading: boolean;
  pair: string;
}

interface TooltipPayload {
  value: number;
  name: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: number;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-stellar-dark border border-stellar-border rounded-lg p-3 text-xs shadow-lg">
      <p className="text-stellar-text-secondary mb-1">Price: {label?.toFixed(7)}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
};

/**
 * LiquidityDepthChart — AreaChart visualising aggregated bids and asks.
 * Uses stepAfter line type to accurately represent order book steps.
 * Supports zoom via a price range slider.
 */
const LiquidityDepthChart = React.memo(function LiquidityDepthChart({
  data,
  isLoading,
  pair,
}: Props) {
  const [zoomPct, setZoomPct] = useState(100);

  const chartData = useMemo(() => {
    if (!data) return [];

    const mid = data.midPrice;
    const range = mid * (zoomPct / 100) * 0.05; // ±5% of mid scaled by zoom

    const filteredBids = data.bids.filter(
      (b) => b.price >= mid - range && b.price <= mid
    );
    const filteredAsks = data.asks.filter(
      (a) => a.price >= mid && a.price <= mid + range
    );

    const bidPoints = filteredBids.map((b) => ({
      price: b.price,
      bidVolume: b.volume,
      askVolume: undefined as number | undefined,
    }));

    const askPoints = filteredAsks.map((a) => ({
      price: a.price,
      bidVolume: undefined as number | undefined,
      askVolume: a.volume,
    }));

    return [...bidPoints, ...askPoints].sort((a, b) => a.price - b.price);
  }, [data, zoomPct]);

  if (isLoading) {
    return <SkeletonChart height={320} ariaLabel={`${pair} depth chart loading`} />;
  }

  if (!data || chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-stellar-text-secondary text-sm">
        No depth data available for {pair}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-stellar-text-secondary">
          Mid price: <span className="text-white">{data.midPrice.toFixed(7)}</span>
        </p>
        <div className="flex items-center gap-2 text-xs text-stellar-text-secondary">
          <label htmlFor="depth-zoom">Zoom</label>
          <input
            id="depth-zoom"
            type="range"
            min={10}
            max={100}
            value={zoomPct}
            onChange={(e) => setZoomPct(Number(e.target.value))}
            className="w-24 accent-stellar-blue"
            aria-label="Zoom depth chart"
          />
          <span className="w-8 text-right">{zoomPct}%</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="bidGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="askGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF4D4D" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FF4D4D" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E2340" />
          <XAxis
            dataKey="price"
            stroke="#8A8FA8"
            tick={{ fontSize: 10 }}
            tickFormatter={(v: number) => v.toFixed(4)}
            type="number"
            domain={["dataMin", "dataMax"]}
          />
          <YAxis
            stroke="#8A8FA8"
            tick={{ fontSize: 10 }}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)
            }
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            x={data.midPrice}
            stroke="#8A8FA8"
            strokeDasharray="4 4"
            label={{ value: "Mid", fill: "#8A8FA8", fontSize: 10 }}
          />
          <Area
            type="stepAfter"
            dataKey="bidVolume"
            name="Bids"
            stroke="#00D4AA"
            fill="url(#bidGrad)"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
          <Area
            type="stepAfter"
            dataKey="askVolume"
            name="Asks"
            stroke="#FF4D4D"
            fill="url(#askGrad)"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

export default LiquidityDepthChart;
