import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { getAssets, getAssetsWithHealth, getAssetHealth } from "../services/api";
import type { AssetWithHealth, HealthScore } from "../types";

export function useAssets() {
  return useQuery({
    queryKey: ["assets"],
    queryFn: getAssets,
  });
}

export function useAssetsWithHealth() {
  return useQuery({
    queryKey: ["assets-with-health"],
    queryFn: getAssetsWithHealth,
    refetchInterval: 30000,
  });
}

export function useAssetHealth(symbol: string) {
  return useQuery({
    queryKey: ["asset-health", symbol],
    queryFn: () => getAssetHealth(symbol),
    enabled: !!symbol,
  });
}

export function useHealthUpdater() {
  const queryClient = useQueryClient();

  const updateHealth = useCallback(
    (data: HealthScore) => {
      queryClient.setQueryData<AssetWithHealth[]>(
        ["assets-with-health"],
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.map((asset) =>
            asset.symbol === data.symbol ? { ...asset, health: data } : asset
          );
        }
      );
    },
    [queryClient]
  );

  return { updateHealth };
}
