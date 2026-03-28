import { useState, useMemo } from "react";
import { useBridges, useBridgeStats } from "../hooks/useBridges";
import BridgeCard from "../components/BridgeCard";
import BridgeFilterSort from "../components/BridgeFilterSort";
import type { Bridge } from "../types";


export default function Bridges() {
  const { data, isLoading } = useBridges();
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const bridges = data?.bridges || [];

  const bridgesWithStats = bridges.map((bridge: Bridge) => {
    const { data: stats } = useBridgeStats(bridge.name);
    return { bridge, stats: stats || null };
  });

  const filteredAndSortedBridges = useMemo(() => {
    let filtered = bridgesWithStats;

    if (statusFilter !== "all") {
      filtered = filtered.filter(({ bridge }) => bridge.status === statusFilter);
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "tvl":
          return b.bridge.totalValueLocked - a.bridge.totalValueLocked;
        case "volume":
          return (b.stats?.volume24h || 0) - (a.stats?.volume24h || 0);
        case "health": {
          const getScore = (bridge: Bridge) => {
            let score = 100;
            if (bridge.status === "down") score -= 50;
            else if (bridge.status === "degraded") score -= 25;
            else if (bridge.status === "unknown") score -= 15;
            if (bridge.mismatchPercentage > 1) score -= 30;
            else if (bridge.mismatchPercentage > 0.5) score -= 15;
            return Math.max(0, score);
          };
          return getScore(b.bridge) - getScore(a.bridge);
        }
        case "name":
        default:
          return a.bridge.name.localeCompare(b.bridge.name);
      }
    });

    return sorted;
  }, [bridgesWithStats, statusFilter, sortBy]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Bridges</h1>
        <p className="mt-2 text-stellar-text-secondary">
          Monitor cross-chain bridge status, supply consistency, and performance
        </p>
      </div>

      {isLoading ? (
        <p className="text-stellar-text-secondary">Loading bridge data...</p>
      ) : bridges.length > 0 ? (
        <>
          <BridgeFilterSort
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedBridges.map(({ bridge, stats }) => (
              <BridgeCard key={bridge.name} bridge={bridge} stats={stats} />
            ))}
          </div>
        </>
      ) : (
        <div className="bg-stellar-card border border-stellar-border rounded-lg px-8 py-8 md:py-16 text-center">
          <p className="text-stellar-text-secondary">
            No bridge data available. Bridge monitoring will populate this page
            once configured and running.
          </p>
        </div>
      )}
    </div>
  );
}
