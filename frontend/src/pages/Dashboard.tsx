import { Link } from "react-router-dom";
import { useAssets } from "../hooks/useAssets";
import { useBridges } from "../hooks/useBridges";
import HealthScoreCard from "../components/HealthScoreCard";
import BridgeStatusCard from "../components/BridgeStatusCard";
import AddToWatchlistButton from "../components/watchlist/AddToWatchlistButton";
import WatchlistWidget from "../components/watchlist/WatchlistWidget";
import ExternalDependencyPanel from "../components/dashboard/ExternalDependencyPanel";

export default function Dashboard() {
  const { data: assetsData, isLoading: assetsLoading } = useAssets();
  const { data: bridgesData, isLoading: bridgesLoading } = useBridges();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-2 text-stellar-text-secondary">
          Real-time monitoring of bridged assets on the Stellar network
        </p>
      </div>

      {/* Asset Health Overview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Asset Health</h2>
        </div>
        {assetsLoading ? (
          <p className="text-stellar-text-secondary">Loading assets...</p>
        ) : assetsData && assetsData.assets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assetsData.assets.map((asset: { symbol: string }) => (
              <div key={asset.symbol} className="space-y-2">
                <div className="flex justify-end">
                  <AddToWatchlistButton symbol={asset.symbol} />
                </div>
                <Link to={`/assets/${asset.symbol}`}>
                  <HealthScoreCard
                    symbol={asset.symbol}
                    overallScore={null}
                    factors={null}
                    trend={null}
                  />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-stellar-card border border-stellar-border rounded-lg p-8 text-center">
            <p className="text-stellar-text-secondary">
              No monitored assets yet. Configure assets in the backend to get
              started.
            </p>
          </div>
        )}
      </section>

      <WatchlistWidget />

      <ExternalDependencyPanel />

      {/* Bridge Status Overview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Bridge Status</h2>
          <Link
            to="/bridges"
            className="text-sm text-stellar-blue hover:underline"
          >
            View all
          </Link>
        </div>
        {bridgesLoading ? (
          <p className="text-stellar-text-secondary">Loading bridges...</p>
        ) : bridgesData && bridgesData.bridges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bridgesData.bridges.map(
              (bridge: {
                name: string;
                status: "healthy" | "degraded" | "down" | "unknown";
                totalValueLocked: number;
                supplyOnStellar: number;
                supplyOnSource: number;
                mismatchPercentage: number;
              }) => (
                <BridgeStatusCard key={bridge.name} {...bridge} />
              )
            )}
          </div>
        ) : (
          <div className="bg-stellar-card border border-stellar-border rounded-lg p-8 text-center">
            <p className="text-stellar-text-secondary">
              No bridge data available yet.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
