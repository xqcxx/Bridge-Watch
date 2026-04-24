import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useMemo } from "react";
import { useTimeRange } from "../hooks/useTimeRange";
import { filterSeriesByTimeRange } from "../utils/timeRange";
import {
  generateDynamicColor,
  getColorblindModePreference,
  getVisualizationTheme,
} from "../styles/colors";

interface PriceDataPoint {
  timestamp: string;
  price: number;
  source: string;
}

interface PriceChartProps {
  symbol: string;
  data: PriceDataPoint[];
  isLoading: boolean;
  chartId: string;
}

export default function PriceChart({
  symbol,
  data,
  isLoading,
  chartId,
}: PriceChartProps) {
  const { getEffectiveSelection } = useTimeRange();
  const selection = getEffectiveSelection(chartId);
  const theme = getVisualizationTheme({
    theme: "dark",
    colorblindMode: getColorblindModePreference(),
  });

  const filteredData = useMemo(
    () => filterSeriesByTimeRange(data, (item) => item.timestamp, selection),
    [data, selection]
  );

  const chartData = useMemo(() => {
    const grouped = new Map<string, { timestamp: string } & Record<string, number | string>>();

    filteredData.forEach((entry) => {
      const key = entry.timestamp;
      const base = grouped.get(key) ?? { timestamp: key };

      grouped.set(key, {
        ...base,
        [entry.source]: entry.price,
      });
    });

    return Array.from(grouped.values()).sort(
      (a, b) =>
        new Date(String(a.timestamp)).getTime() -
        new Date(String(b.timestamp)).getTime()
    );
  }, [filteredData]);

  const sources = useMemo(
    () => [...new Set(filteredData.map((entry) => entry.source))],
    [filteredData]
  );

  const sourceColors = useMemo(
    () =>
      sources.reduce<Record<string, string>>((acc, source, index) => {
        acc[source] =
          theme.categorical[index] ?? generateDynamicColor(source.toLowerCase());
        return acc;
      }, {}),
    [sources, theme.categorical]
  );

  if (isLoading) {
    return (
      <div className="bg-stellar-card border border-stellar-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          {symbol} Price History
        </h3>
        <div className="h-64 flex items-center justify-center">
          <span className="text-stellar-text-secondary">Loading chart data...</span>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-stellar-card border border-stellar-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          {symbol} Price History
        </h3>
        <div className="h-64 flex items-center justify-center">
          <span className="text-stellar-text-secondary">
            No price data available in selected range
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stellar-card border border-stellar-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        {symbol} Price History
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
          <XAxis dataKey="timestamp" stroke={theme.axis} tick={{ fontSize: 12 }} />
          <YAxis stroke={theme.axis} tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.tooltipBg,
              border: `1px solid ${theme.grid}`,
              borderRadius: "8px",
              color: theme.tooltipText,
            }}
            formatter={(value: number | string, name: string) => [
              typeof value === "number" ? `$${value.toFixed(4)}` : value,
              name,
            ]}
          />
          <Legend />
          {sources.map((source) => (
            <Line
              key={source}
              type="monotone"
              dataKey={source}
              name={source}
              stroke={sourceColors[source]}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
