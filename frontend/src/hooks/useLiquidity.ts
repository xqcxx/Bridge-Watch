import { useQuery } from "@tanstack/react-query";
import { getAssetLiquidity } from "../services/api";

export function useLiquidity(symbol: string) {
  return useQuery({
    queryKey: ["liquidity", symbol],
    queryFn: () => getAssetLiquidity(symbol),
    enabled: Boolean(symbol),
    select: (data) => ({
      ...data,
      sources: data?.sources ?? [],
    }),
  });
}
