import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { VenueLiquidity } from "../../types/liquidity";
import { VENUE_COLORS } from "./venueColors";
import { SkeletonChart } from "../Skeleton";

interface Props {
  venues: VenueLiquidity[];
  isLoading: boolean;
}

interface TooltipPayload {
  name: string;
  value: number;
  payload: { share: number };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: inner } = payload[0];
  return (
    <div className="bg-stellar-dark border border-stellar-border rounded-lg p-3 text-xs shadow-lg">
      <p className="text-white font-medium">{name}</p>
      <p className="text-stellar-text-secondary">
        ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </p>
      <p className="text-stellar-text-secondary">{inner.share.toFixed(1)}% share</p>
    </div>
  );
};

/**
 * LiquidityByVenue — Pie chart showing each DEX's share of total liquidity.
 * Color-coded by venue: SDEX (Blue), StellarX (Green), Phoenix (Purple).
 */
const LiquidityByVenue = React.memo(function LiquidityByVenue({
  venues,
  isLoading,
}: Props) {
  const chartData = useMemo(
    () =>
      venues.map((v) => ({
        name: v.venue,
        value: v.totalLiquidity,
        share: v.share,
      })),
    [venues]
  );

  if (isLoading) {
    return <SkeletonChart height={240} ariaLabel="Venue distribution loading" />;
  }

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-stellar-text-secondary text-sm">
        No venue data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
          aria-label="Liquidity distribution by venue"
        >
          {chartData.map((entry) => (
            <Cell
              key={entry.name}
              fill={VENUE_COLORS[entry.name as keyof typeof VENUE_COLORS] ?? "#8A8FA8"}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span className="text-xs text-stellar-text-secondary">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
});

export default LiquidityByVenue;
