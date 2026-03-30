# Frontend Architecture

Design and structure of the Stellar Bridge Watch React dashboard application.

## Overview

The frontend is a **React 18** single-page application built with:
- **Vite** for fast builds and hot module replacement
- **TypeScript** for type safety
- **TailwindCSS** for utility-first styling
- **Zustand** for client-side state management
- **React Query** (`@tanstack/react-query`) for server state
- **Recharts** for data visualization
- **React Router v6** for client-side routing

## Application Structure

```
frontend/src/
├── App.tsx                  # Root component, routing setup
├── main.tsx                 # Application entry point
├── index.css                # Global styles + Tailwind imports
├── components/              # Reusable UI components
│   ├── Layout.tsx           # Main layout wrapper
│   ├── Navbar.tsx           # Top navigation bar
│   ├── DataTable/           # Table with sorting, pagination
│   ├── MobileNav/           # Responsive mobile navigation
│   ├── Skeleton/            # Loading state placeholders
│   └── liquidity/           # Liquidity-specific components
├── pages/                   # Route-level page components
├── hooks/                   # Custom React hooks
├── stores/                  # Zustand state stores
├── contexts/                # React context providers
├── services/                # API and WebSocket clients
├── types/                   # TypeScript type definitions
└── theme/                   # Theme configuration
```

## Routing

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/` | `Landing.tsx` | Public landing page |
| `/dashboard` | `Dashboard.tsx` | Main monitoring dashboard |
| `/assets/:symbol` | `AssetDetail.tsx` | Individual asset deep-dive |
| `/bridges` | `Bridges.tsx` | Bridge listing and status |
| `/transactions` | `Transactions.tsx` | Cross-chain transaction history |
| `/analytics` | `Analytics.tsx` | Historical analytics and trends |
| `/reports` | `Reports.tsx` | Custom report generation |
| `/watchlist` | `Watchlist.tsx` | User watchlist management |
| `/settings` | `Settings.tsx` | Preferences and configuration |
| `/admin/api-keys` | `ApiKeys.tsx` | API key administration |

## State Management

### Zustand Stores (Client State)

| Store | Purpose | Persistence |
|-------|---------|-------------|
| `themeStore` | Light/dark mode preference | LocalStorage |
| `cacheStore` | Client-side data caching | Memory |
| `notificationStore` | Notification queue and read state | Memory |
| `uiStore` | UI state (modals, panels, sidebar) | Memory |
| `userPreferencesStore` | User settings | LocalStorage |
| `webSocketStore` | WebSocket connection state | Memory |

### React Query (Server State)

All server data fetching uses React Query for:
- Automatic caching and deduplication
- Background refetching on window focus
- Stale-while-revalidate strategy
- Error and loading state management

```
┌──────────────┐     React Query     ┌──────────────┐
│  Component   │◄───────────────────►│ Backend API  │
│  useAssets() │     cache + fetch   │ /api/v1/...  │
└──────────────┘                     └──────────────┘
```

## Data Fetching Hooks

| Hook | Endpoint | Description |
|------|----------|-------------|
| `useAssets` | `/api/v1/assets` | Fetch asset list |
| `useAssetsCached` | `/api/v1/assets` | Cached asset data |
| `useBridges` | `/api/v1/bridges` | Fetch bridge data |
| `useLiquidity` | `/api/v1/assets/:symbol/liquidity` | Liquidity snapshots |
| `usePrices` | `/api/v1/assets/:symbol/price` | Price data |
| `useTransactions` | `/api/v1/transactions` | Transaction history |
| `useWatchlist` | `/api/v1/watchlists` | User watchlist |
| `useNotifications` | `/api/v1/alerts/events` | Alert notifications |
| `usePreferences` | `/api/v1/preferences` | User preferences |

## Real-Time Updates

WebSocket integration provides real-time data updates:

```
┌──────────────┐     WebSocket      ┌──────────────┐
│  useWebSocket│◄══════════════════►│ Backend WS   │
│  Hook        │     events         │ :3002        │
└──────┬───────┘                    └──────────────┘
       │
       ▼
┌──────────────┐
│ webSocketStore│  Connection state, message queue
└──────┬───────┘
       │ dispatch
       ▼
┌──────────────┐
│  Components  │  Auto-update charts, cards, tables
└──────────────┘
```

- `useWebSocket.ts` — Basic WebSocket connection management
- `useWebSocketEnhanced.ts` — Reconnection, heartbeat, message queuing

## Component Architecture

### Layout Hierarchy

```
<App>
  <Router>
    <Layout>
      <Navbar />
      <MobileNav />        {/* Responsive */}
      <NotificationCenter />
      <main>
        <Page />           {/* Route-specific content */}
      </main>
    </Layout>
  </Router>
</App>
```

### Key Component Categories

**Dashboard Components:**
- `HealthScoreCard` — Displays composite health score (0–100) with color coding
- `PriceChart` — Interactive price history with multiple timeframes
- `LiquidityDepthChart` — Visualizes liquidity at various price impact levels
- `BridgeStatusCard` — Bridge health indicator with uptime metrics
- `Sparkline` — Mini inline trend charts

**Data Display:**
- `DataTable/` — Sortable, paginated data tables
- `TransactionHistory` — Transaction list with filtering
- `TransactionDetail` — Transaction detail modal

**Navigation and UX:**
- `Navbar` — Top navigation with route links
- `MobileNav/` — Responsive hamburger menu
- `ConnectionStatus` — WebSocket/API connection indicator
- `ThemeToggle` — Light/dark mode switch

**Utility:**
- `Skeleton/` — Loading state placeholder animations
- `InfiniteScrollContainer` — Infinite scroll wrapper for long lists
- `PrintButton` — Print-friendly view generation

## Styling Strategy

- **TailwindCSS** utility classes for all styling
- **Dark mode** support via `themeStore` and Tailwind's `dark:` variant
- **Responsive** design with Tailwind breakpoints (`sm:`, `md:`, `lg:`)
- **No inline styles** — all styling through Tailwind classes
- **No CSS modules** — utility-first approach eliminates the need

## Build and Development

```bash
# Development (with HMR)
cd frontend && npm run dev

# Production build
cd frontend && npm run build

# Type checking
cd frontend && npm run type-check

# Linting
cd frontend && npm run lint
```

**Production build output** is served by Nginx with:
- Gzip compression
- Content-addressed static asset caching (1 year)
- SPA fallback routing to `index.html`
