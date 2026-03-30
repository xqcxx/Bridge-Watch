# ADR-003: Use Zustand Over Redux for Frontend State

## Status

Accepted

## Context

Bridge Watch's frontend needs global state management for bridge data, user preferences, alert configurations, and real-time WebSocket data. The state management solution must handle frequent real-time updates without excessive re-renders.

Options considered:
1. **Redux Toolkit** — Mature, feature-rich, large ecosystem
2. **Zustand** — Lightweight, minimal boilerplate, hook-based API
3. **MobX** — Observable-based reactive state management
4. **Jotai / Recoil** — Atomic state management

## Decision

Use **Zustand** for global state management, combined with **React Query (TanStack Query)** for server state.

## Consequences

### Positive

- **Minimal boilerplate:** Store definitions are plain JavaScript functions — no actions, reducers, or dispatchers.
- **Small bundle size:** ~1 KB gzipped vs ~11 KB for Redux Toolkit, important for a monitoring dashboard.
- **Selective subscriptions:** Components subscribe to specific slices of state, preventing unnecessary re-renders from frequent real-time price/health updates.
- **No context provider required:** Stores work outside the React tree, simplifying testing and initialization.
- **TypeScript-native:** Excellent TypeScript inference without extra type scaffolding.
- **Separation of concerns:** Zustand handles UI/client state; React Query handles server state caching, revalidation, and deduplication.

### Negative

- **Smaller ecosystem:** Fewer middleware options and community extensions compared to Redux.
- **Less structure:** No enforced patterns — team must maintain consistency through conventions.
- **DevTools:** Redux DevTools integration exists but is less polished than native Redux tooling.

### Neutral

- Existing stores (`bridgeStore`, `alertsStore`, `preferencesStore`, `analyticsStore`) demonstrate the pattern of small, focused stores rather than one monolithic store.
- React Query handles all API data fetching with automatic refetch intervals, reducing the scope of what Zustand manages.
