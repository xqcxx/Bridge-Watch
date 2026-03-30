import { http, HttpResponse } from "msw";

export const handlers = [
  // Mock Assets
  http.get("/api/v1/assets", () => {
    return HttpResponse.json({
      assets: [
        { symbol: "XLM", name: "Stellar" },
        { symbol: "USDC", name: "USDC" },
      ],
      total: 2,
    });
  }),

  // Mock Asset Health
  http.get("/api/v1/assets/:symbol/health", ({ params }) => {
    return HttpResponse.json({
      symbol: params.symbol,
      overallScore: 85,
      factors: {
        liquidityDepth: 90,
        priceStability: 80,
        bridgeUptime: 100,
        reserveBacking: 85,
        volumeTrend: 70,
      },
      trend: "stable",
      lastUpdated: new Date().toISOString(),
    });
  }),

  // Mock Asset Price
  http.get("/api/v1/assets/:symbol/price", ({ params }) => {
    return HttpResponse.json({
      symbol: params.symbol,
      vwap: 0.1234,
      sources: [{ source: "Binance", price: 0.1235, timestamp: new Date().toISOString() }],
      deviation: 0.05,
      lastUpdated: new Date().toISOString(),
    });
  }),
];
