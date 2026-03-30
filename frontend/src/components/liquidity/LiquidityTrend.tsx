import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { LiquiditySnapshot } from "../../types/liquidity";
import { SkeletonChart } from "../Skeleton";

interface Props {
  history: LiquiditySnapshot[];
  isLoading: boolean;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * LiquidityTrend — LineChart showing historical total liquidity over time.
 * Populated by the rolling snapshot buffer in useLiquidity.
 */
const LiquidityTrend = React.memo(function LiquidityTrend({
  history,
  isLoading,
}: Props) {
  if (isLoading) {
    return <SkeletonChart height={200} ariaLabel="Liquidity trend loading" />;
  }

  if (history.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-stellar-text-secondary text-sm">
        Collecting trend data…
      </div>
    );
  }

  const chartData = history.map((s) => ({
    time: formatTime(s.timestamp),
    liquidity: s.totalLiquidity,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E2340" />
        <XAxis
          dataKey="time"
          stroke="#8A8FA8"
          tick={{ fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="#8A8FA8"
          tick={{ fontSize: 10 }}
          tickFormatter={(v: number) =>
            v >= 1_000_000
              ? `$${(v / 1_000_000).toFixed(1)}M`
              : v >= 1000
              ? `$${(v / 1000).toFixed(0)}k`
              : `$${v}`
          }
          width={56}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#141829",
            border: "1px solid #1E2340",
            borderRadius: "8px",
            color: "#FFFFFF",
            fontSize: "12px",
          }}
          formatter={(v: number) => [
            `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
            "Total Liquidity",
          ]}
        />
        <Line
          type="monotone"
          dataKey="liquidity"
          stroke="#0057FF"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

export default LiquidityTrend;
