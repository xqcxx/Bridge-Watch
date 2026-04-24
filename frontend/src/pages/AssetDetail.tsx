import { useParams } from "react-router-dom";
import { usePrices } from "../hooks/usePrices";
import { useLiquidity } from "../hooks/useLiquidity";
import HealthScoreCard from "../components/HealthScoreCard";
import PriceChart from "../components/PriceChart";
import LiquidityDepthChart from "../components/LiquidityDepthChart";
import { TimeRangeSelector } from "../components/TimeRangeSelector";
import AddToWatchlistButton from "../components/watchlist/AddToWatchlistButton";

export default function AssetDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const { data: priceData, isLoading: priceLoading } = usePrices(symbol ?? "");
  const { data: liquidityData, isLoading: liquidityLoading } = useLiquidity(
    symbol ?? ""
  );

  if (!symbol) {
    return (
      <div className="text-stellar-text-secondary">
        No asset symbol provided.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-white">{symbol}</h1>
          <AddToWatchlistButton symbol={symbol} className="text-sm" />
        </div>
        <p className="mt-2 text-stellar-text-secondary">
          Detailed monitoring for {symbol} on the Stellar network
        </p>
      </div>

      {/* Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <HealthScoreCard
          symbol={symbol}
          overallScore={null}
          factors={null}
          trend={null}
        />
        <div className="lg:col-span-2">
          <TimeRangeSelector chartId={`price-${symbol}`} title="Price chart range" />
          <PriceChart
            symbol={symbol}
            data={priceData?.history ?? []}
            isLoading={priceLoading}
            chartId={`price-${symbol}`}
          />
        </div>
      </div>

      {/* Liquidity Depth */}
      <div className="space-y-3">
        <TimeRangeSelector
          chartId={`liquidity-${symbol}`}
          title="Liquidity chart range"
          showApplyGlobally={false}
        />
        <LiquidityDepthChart
          symbol={symbol}
          data={liquidityData?.sources ?? []}
          isLoading={liquidityLoading}
          chartId={`liquidity-${symbol}`}
        />
      </div>

      {/* Price Sources Table */}
      <div className="bg-stellar-card border border-stellar-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Price Sources
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-stellar-text-secondary border-b border-stellar-border">
                <th className="pb-3 pr-4">Source</th>
                <th className="pb-3 pr-4">Price</th>
                <th className="pb-3 pr-4">Last Updated</th>
                <th className="pb-3">Deviation</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {priceData?.sources && priceData.sources.length > 0 ? (
                priceData.sources.map(
                  (source: {
                    source: string;
                    price: number;
                    timestamp: string;
                  }) => (
                    <tr
                      key={source.source}
                      className="border-b border-stellar-border"
                    >
                      <td className="py-3 pr-4">{source.source}</td>
                      <td className="py-3 pr-4">
                        ${source.price.toFixed(4)}
                      </td>
                      <td className="py-3 pr-4 text-stellar-text-secondary">
                        {source.timestamp}
                      </td>
                      <td className="py-3">--</td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="py-6 text-center text-stellar-text-secondary"
                  >
                    No price source data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PriceImpactCalculatorWrapper({ symbol }: { symbol: string }) {
  // Most assets are traded against XLM in this app
  const pair: TradingPair = symbol === "XLM" ? "USDC/XLM" : (`${symbol}/XLM` as any);
  const { depth, isLoading } = useLiquidity(pair);

  if (isLoading && !depth) return <LoadingSpinner message="Loading liquidity data..." />;

  return <PriceImpactCalculator depth={depth} />;
}
