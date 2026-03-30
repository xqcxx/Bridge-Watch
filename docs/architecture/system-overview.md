# System Overview

High-level architecture of Stellar Bridge Watch, describing the major components and their interactions.

## Architecture Pattern

Bridge Watch follows a **multi-tier architecture** with event-driven processing:

- **Presentation Tier** — React 18 SPA served by Nginx
- **Application Tier** — Fastify REST API + WebSocket server + BullMQ workers
- **Data Tier** — PostgreSQL with TimescaleDB + Redis cache
- **Blockchain Tier** — Soroban smart contracts on Stellar

## Component Descriptions

### Backend (Node.js + Fastify)

The backend is the core of Bridge Watch, providing:

| Component | Responsibility |
|-----------|---------------|
| **REST API** (port 3001) | Synchronous query endpoints for assets, bridges, health, analytics |
| **WebSocket Server** (port 3002) | Real-time push updates to connected clients |
| **Background Workers** (BullMQ) | Scheduled data collection, health calculation, alert evaluation |
| **Services Layer** | Business logic for health scoring, price aggregation, bridge monitoring |
| **Middleware** | Authentication, rate limiting, request tracing, validation |

**Key design decisions:**
- Fastify chosen over Express for performance (JSON serialization, schema validation)
- BullMQ handles all background processing with Redis as the queue broker
- Pino provides structured JSON logging for observability
- Knex manages database migrations with full up/down support

### Frontend (React 18 + Vite)

The frontend is a single-page application providing an interactive monitoring dashboard:

| Component | Responsibility |
|-----------|---------------|
| **Pages** | Dashboard, Asset Detail, Bridges, Analytics, Reports, Settings |
| **Components** | Reusable UI elements (charts, cards, tables, navigation) |
| **Hooks** | Data fetching, WebSocket connection, local state management |
| **Stores** (Zustand) | Client-side state: theme, cache, notifications, WebSocket, UI |
| **Services** | HTTP client (`api.ts`) and WebSocket client (`websocket.ts`) |

**Key design decisions:**
- Vite for fast development builds and optimized production bundles
- Zustand over Redux for simpler state management with less boilerplate
- React Query (`@tanstack/react-query`) for server state with automatic caching and refetching
- TailwindCSS for utility-first styling without CSS-in-JS overhead

### Smart Contracts (Soroban / Rust)

On-chain components deployed to Stellar's Soroban platform:

| Contract | Responsibility |
|----------|---------------|
| **Bridge Watch Core** | Asset registry, health scoring, deviation alerts, circuit breaker |
| **Transfer State Machine** | Bridge transfer lifecycle management with full audit trail |

**Key design decisions:**
- On-chain health scoring for trustless verification
- State machine pattern for transfer lifecycle with 12 defined states
- Gas-bounded audit trail (max 48 entries per transfer)
- Support for multiple bridge types: LockMint, BurnRelease, NativeWrapped, CCTP, Custom

### PostgreSQL + TimescaleDB

The primary data store handles both relational and time-series data:

| Data Category | Storage Type | Examples |
|---------------|-------------|---------|
| Configuration | Regular tables | Assets, bridges, alert rules, circuit breaker configs |
| Time-series | Hypertables | Prices, health scores, liquidity snapshots, alert events |

**Key design decisions:**
- TimescaleDB for efficient time-series queries without a separate time-series database
- 90-day automatic retention on hypertables to manage storage growth
- Connection pooling (min: 2, max: 20) with idle connection cleanup

### Redis

In-memory data store serving multiple purposes:

| Purpose | Usage |
|---------|-------|
| **Caching** | Price data (30s TTL), aggregated queries |
| **Job Queue** | BullMQ queue broker for background workers |
| **Rate Limiting** | Sliding-window counters per IP/API key |
| **Pub/Sub** | Real-time event propagation to WebSocket server |

**Key design decisions:**
- Single Redis instance for dev; Redis Cluster supported for production
- Exponential backoff retry strategy (max 3s)
- Read replicas for scaling read-heavy workloads in cluster mode

## Service Communication

```
┌──────────┐     HTTP/REST     ┌──────────┐
│ Frontend │──────────────────►│ Backend  │
│          │◄──────────────────│ API      │
│          │     WebSocket     │          │
│          │◄═════════════════►│ WS:3002  │
└──────────┘                   └────┬─────┘
                                    │
                          ┌─────────┼─────────┐
                          │         │         │
                   ┌──────▼──┐ ┌────▼───┐ ┌───▼──────────┐
                   │PostgreSQL│ │ Redis  │ │External APIs │
                   └─────────┘ └────────┘ │(Horizon, RPC)│
                                          └──────────────┘
```

- **Frontend → Backend:** REST API calls via `fetch` + React Query; WebSocket for real-time updates
- **Backend → Database:** Knex query builder over PostgreSQL connection pool
- **Backend → Redis:** Direct client connection for caching; BullMQ for job queues
- **Backend → External APIs:** HTTP clients to Stellar Horizon, Soroban RPC, Circle, exchanges
- **Workers → Services:** Background workers invoke the same service layer as the API

## Deployment Topology

See [Deployment Documentation](../deployment/README.md) for detailed deployment guides.

| Environment | Frontend | Backend | Database | Redis |
|-------------|----------|---------|----------|-------|
| Development | Vite dev server (:5173) | tsx watch (:3001) | Docker (:5432) | Docker (:6379) |
| Production (Docker) | Nginx (:80) | Node.js (:3001, :3002) | Docker (:5432) | Docker (:6379) |
| Production (K8s) | Nginx pods | Backend pods (3+ replicas) | StatefulSet / Managed | Deployment / Managed |
