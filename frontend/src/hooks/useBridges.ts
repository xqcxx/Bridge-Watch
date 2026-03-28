import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getBridges, getBridgeStats } from "../services/api";
import { wsService } from "../services/websocket";
import type { Bridge } from "../types";

export function useBridges() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000/ws";
    wsService.connect(WS_URL);

    const unsubscribe = wsService.subscribe("bridges", (data: unknown) => {
      const bridgeData = data as { bridges: Bridge[] };
      if (bridgeData.bridges) {
        queryClient.setQueryData(["bridges"], bridgeData);
      }
    });

    return () => {
      unsubscribe();
      wsService.disconnect();
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["bridges"],
    queryFn: getBridges,
  });
}

export function useBridgeStats(bridgeName: string) {
  return useQuery({
    queryKey: ["bridge-stats", bridgeName],
    queryFn: () => getBridgeStats(bridgeName),
    enabled: !!bridgeName,
  });
}
