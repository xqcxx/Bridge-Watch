export interface Asset {
  symbol: string;
  name: string;
}

export interface HealthFactors {
  liquidityDepth: number;
  priceStability: number;
  bridgeUptime: number;
  reserveBacking: number;
  volumeTrend: number;
}

export interface HealthScore {
  symbol: string;
  overallScore: number;
  factors: HealthFactors;
  trend: "improving" | "stable" | "deteriorating";
  lastUpdated: string;
}

export type HealthStatus = "healthy" | "warning" | "critical";

export interface AssetWithHealth extends Asset {
  health: HealthScore | null;
}

export type SortField = "symbol" | "score";
export type SortOrder = "asc" | "desc";
export type FilterStatus = "all" | HealthStatus;
