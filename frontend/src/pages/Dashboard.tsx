import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAssets } from "../hooks/useAssets";
import { useBridges } from "../hooks/useBridges";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import HealthScoreCard from "../components/HealthScoreCard";
import BridgeStatusCard from "../components/BridgeStatusCard";
import AddToWatchlistButton from "../components/watchlist/AddToWatchlistButton";
import WatchlistWidget from "../components/watchlist/WatchlistWidget";
import ExternalDependencyPanel from "../components/dashboard/ExternalDependencyPanel";
import PullToRefresh from "../components/PullToRefresh";
import ComparativeSparklineGrid from "../components/analytics/ComparativeSparklineGrid";

type DashboardView = "overview" | "assets" | "bridges";
type BridgeStatusFilter = "all" | "healthy" | "degraded" | "down" | "unknown";

const VIEW_PARAM = "dashboard_view";
const BRIDGE_STATUS_PARAM = "dashboard_bridge_status";

const dashboardViews: Array<{ id: DashboardView; label: string; description: string }> = [
  { id: "overview", label: "Overview", description: "Assets and bridges together" },
  { id: "assets", label: "Assets", description: "Asset health and watchlist focus" },
  { id: "bridges", label: "Bridges", description: "Bridge health focus" },
];

const bridgeStatusOptions: Array<{ id: BridgeStatusFilter; label: string }> = [
  { id: "all", label: "All statuses" },
  { id: "healthy", label: "Healthy" },
  { id: "degraded", label: "Degraded" },
  { id: "down", label: "Down" },
  { id: "unknown", label: "Unknown" },
];

function parseDashboardView(value: string | null): DashboardView {
  if (value === "assets" || value === "bridges") {
    return value;
  }
  return "overview";
}

function parseBridgeStatus(value: string | null): BridgeStatusFilter {
  if (
    value === "healthy" ||
    value === "degraded" ||
    value === "down" ||
    value === "unknown"
  ) {
    return value;
  }
  return "all";
}

function useDashboardUrlState() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      view: parseDashboardView(params.get(VIEW_PARAM)),
      bridgeStatus: parseBridgeStatus(params.get(BRIDGE_STATUS_PARAM)),
    };
  }, [location.search]);

  function updateState(next: Partial<{ view: DashboardView; bridgeStatus: BridgeStatusFilter }>) {
    const params = new URLSearchParams(location.search);
    const nextView = next.view ?? state.view;
    const nextBridgeStatus = next.bridgeStatus ?? state.bridgeStatus;

    params.set(VIEW_PARAM, nextView);
    params.set(BRIDGE_STATUS_PARAM, nextBridgeStatus);

    navigate({ search: params.toString() }, { replace: true });
  }

  return {
    state,
    setView: (view: DashboardView) => updateState({ view }),
    setBridgeStatus: (bridgeStatus: BridgeStatusFilter) => updateState({ bridgeStatus }),
  };
}

export default function Dashboard() {
  const {
    data: assetsData,
    isLoading: assetsLoading,
    refetch: refetchAssets,
  } = useAssets();
  const {
    data: bridgesData,
    isLoading: bridgesLoading,
    refetch: refetchBridges,
  } = useBridges();
  const dashboard = useDashboardUrlState();
  const pullToRefresh = usePullToRefresh({
    enabled: true,
    onRefresh: async () => {
      await Promise.all([refetchAssets(), refetchBridges()]);
    },
  });

  const filteredBridges = useMemo(() => {
    const bridges = bridgesData?.bridges ?? [];
    if (dashboard.state.bridgeStatus === "all") {
      return bridges;
    }

    return bridges.filter((bridge) => bridge.status === dashboard.state.bridgeStatus);
  }, [bridgesData?.bridges, dashboard.state.bridgeStatus]);

  const showAssets = dashboard.state.view !== "bridges";
  const showBridges = dashboard.state.view !== "assets";
  const sparklineItems = useMemo(
    () =>
      (assetsData?.assets ?? []).slice(0, 6).map((asset: { symbol: string; name?: string }) => ({
        symbol: asset.symbol,
        name: asset.name ?? asset.symbol,
        period: "7d" as const,
      })),
    [assetsData?.assets]
  );

  return (
    <div className="space-y-8">
      <PullToRefresh
        isPulling={pullToRefresh.isPulling}
        pullDistance={pullToRefresh.pullDistance}
        progress={pullToRefresh.progress}
        isRefreshing={pullToRefresh.isRefreshing}
      />

      <div className="space-y-4 rounded-2xl border border-stellar-border bg-gradient-to-br from-stellar-card via-stellar-card to-stellar-dark/40 p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-stellar-text-secondary">
              Real-time monitoring of bridged assets on the Stellar network, with shareable
              views for assets, bridges, and the combined overview.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void pullToRefresh.refresh();
              }}
              className="rounded-full border border-stellar-border px-4 py-2 text-sm text-white transition-colors hover:bg-stellar-border"
            >
              Refresh data
            </button>
            {dashboardViews.map((view) => (
              <button
                key={view.id}
                type="button"
                onClick={() => dashboard.setView(view.id)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  dashboard.state.view === view.id
                    ? "border-stellar-blue bg-stellar-blue/15 text-white"
                    : "border-stellar-border text-stellar-text-secondary hover:border-stellar-blue hover:text-white"
                }`}
                aria-pressed={dashboard.state.view === view.id}
                title={view.description}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-stellar-border/80 bg-stellar-dark/30 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-stellar-text-primary">Bridge status filter</p>
            <p className="text-xs text-stellar-text-secondary">
              The selected filter is encoded in the URL and survives reloads and shared links.
            </p>
          </div>

          <select
            value={dashboard.state.bridgeStatus}
            onChange={(e) => dashboard.setBridgeStatus(e.target.value as BridgeStatusFilter)}
            className="min-w-44 rounded-md border border-stellar-border bg-stellar-card px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-stellar-blue"
            aria-label="Filter bridges by status"
          >
            {bridgeStatusOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showAssets ? <ComparativeSparklineGrid items={sparklineItems} /> : null}

      {showAssets ? (
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
      ) : null}

      {showAssets ? <WatchlistWidget /> : null}

      {showAssets ? <ExternalDependencyPanel /> : null}

      {showBridges ? (
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
          ) : filteredBridges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBridges.map(
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
                {dashboard.state.bridgeStatus === "all"
                  ? "No bridge data available yet."
                  : `No bridges match the ${dashboard.state.bridgeStatus} filter.`}
              </p>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
