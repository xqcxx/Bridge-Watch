# feat: build liquidity aggregation visualization components

Closes #33

## Summary

Implements a high-performance Liquidity Aggregation and Depth Visualization suite for Phase 1 pairs (USDC/XLM, EURC/XLM, PYUSD/XLM, FOBXX/USDC).

## What's changed

**New types** — `src/types/liquidity.ts`
- `TradingPair`, `LiquidityVenue`, `OrderBookLevel`, `DepthData`, `VenueLiquidity`, `LiquiditySnapshot`, `PriceImpactResult`, `LiquidityWsMessage`, `LiquidityState`
- Extends existing `src/types/index.ts` without redefining shared interfaces

**New hook** — `src/hooks/useLiquidity.ts`
- Bootstraps via React Query REST call (`getAssetLiquidity`)
- Subscribes to `liquidity:<pair>` WebSocket channel for real-time updates
- Normalises data from SDEX, StellarX AMM, and Phoenix
- Rounds all values to 7 decimal places (Stellar precision)
- Maintains a rolling 60-point history buffer
- Returns cleanup function via `useEffect` — no memory leaks on unmount

**New components** — `src/components/liquidity/`
| File | Description |
|---|---|
| `LiquidityDepthChart.tsx` | `AreaChart` with `stepAfter` for bids/asks, zoom slider, interactive tooltip |
| `LiquidityByVenue.tsx` | Donut `PieChart` with venue share table; SDEX=Blue, StellarX=Green, Phoenix=Purple |
| `PriceImpactCalculator.tsx` | Walks ask-side order book to compute expected fill price and slippage % |
| `LiquidityTrend.tsx` | `LineChart` of rolling liquidity history |
| `PairSelector.tsx` | Controlled `<select>` for Phase 1 pairs |
| `venueColors.ts` | Shared color map for consistent venue theming |
| `index.ts` | Barrel export |

**New page** — `src/pages/LiquidityDashboard.tsx`
- Composes all components with summary stat cards
- Pair selection persisted to localStorage
- Responsive grid layout (Tailwind breakpoints)

**Routing** — `src/App.tsx` + `src/components/Navbar.tsx`
- Added `/liquidity` route (lazy-loaded)
- Added "Liquidity" nav link

## Screenshots

<!-- Add screenshots here once the dev server is running -->
| View | Screenshot |
|---|---|
| Depth Chart | _placeholder_ |
| Venue Breakdown | _placeholder_ |
| Price Impact Calculator | _placeholder_ |
| Liquidity Trend | _placeholder_ |

## Testing

- `getDiagnostics` confirmed zero TypeScript errors across all 9 new files
- All components wrapped in `React.memo` to prevent unnecessary re-renders
- WebSocket cleanup verified via `useEffect` return function
