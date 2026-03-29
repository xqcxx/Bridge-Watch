# Scalability

Scaling strategies, performance considerations, and capacity planning for Stellar Bridge Watch.

## Current Architecture Scalability

### Horizontal Scaling

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
       ┌──────▼──────┐ ┌────▼──────┐ ┌────▼──────┐
       │ Backend #1  │ │Backend #2 │ │Backend #3 │
       │ API + WS    │ │API + WS   │ │API + WS   │
       └──────┬──────┘ └────┬──────┘ └────┬──────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼────────┐
                    │  Redis Cluster  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ PostgreSQL +    │
                    │ Read Replicas   │
                    └─────────────────┘
```

### Scaling by Component

| Component | Scaling Strategy | Notes |
|-----------|-----------------|-------|
| **Backend API** | Horizontal (add replicas) | Stateless — scale freely behind load balancer |
| **WebSocket** | Horizontal with Redis Pub/Sub | Redis Pub/Sub ensures all instances receive events |
| **Background Workers** | Horizontal (BullMQ worker pool) | BullMQ distributes jobs across workers automatically |
| **PostgreSQL** | Vertical + read replicas | TimescaleDB handles time-series scale efficiently |
| **Redis** | Redis Cluster | Built-in cluster support in the codebase |
| **Frontend** | Horizontal (Nginx replicas) | Static assets — trivially scalable |

## Backend Scaling

### Stateless API Design

The backend API is fully stateless:
- No server-side sessions
- Authentication via API keys (validated per request)
- All state stored in PostgreSQL or Redis
- Any instance can handle any request

### BullMQ Worker Scaling

Background workers can be scaled independently:

```bash
# Kubernetes: scale workers separately
kubectl scale deployment bridge-watch-workers --replicas=5

# Docker Compose: run additional worker containers
docker compose up -d --scale backend=3
```

BullMQ automatically distributes jobs across available workers. Each worker processes jobs from shared Redis queues with guaranteed at-least-once delivery.

### WebSocket Scaling

Multi-instance WebSocket requires Redis Pub/Sub for event broadcasting:

```
Client A ──► Backend #1 ──► Redis Pub/Sub ──► Backend #2 ──► Client B
                                          └──► Backend #3 ──► Client C
```

When a worker produces new data, it publishes to a Redis channel. All WebSocket server instances subscribe to this channel and broadcast to their connected clients.

## Database Scaling

### TimescaleDB Advantages

TimescaleDB is purpose-built for time-series workloads:

| Feature | Benefit |
|---------|---------|
| **Automatic chunking** | Queries only scan relevant time partitions |
| **Compression** | 10-20x storage reduction on older data |
| **Retention policies** | 90-day auto-cleanup prevents unbounded growth |
| **Continuous aggregates** | Pre-computed rollups for dashboard queries |

### Read Replicas

For read-heavy workloads:
- Deploy PostgreSQL read replicas for query scaling
- Route `SELECT` queries to replicas
- Keep writes on the primary

### Connection Pooling

- **Application level:** Knex pool (min: 2, max: 20)
- **External pooling:** PgBouncer for managing connections across multiple backend instances

```
Backend #1 ──┐
Backend #2 ──├──► PgBouncer ──► PostgreSQL
Backend #3 ──┘    (pool)
```

### Capacity Estimates

| Data Type | Records/Day | 90-Day Total | Storage (Compressed) |
|-----------|-------------|--------------|---------------------|
| Prices | ~288K (5 assets × 3 sources × 2/min × 1440 min) | ~26M | ~500 MB |
| Health scores | ~7.2K (5 assets × 1/min × 1440) | ~650K | ~50 MB |
| Liquidity | ~7.2K | ~650K | ~50 MB |
| Alert events | Variable (low volume) | ~10K | ~5 MB |
| Verification | ~1.4K (5 assets × every 5 min) | ~130K | ~10 MB |

## Redis Scaling

### Single Instance → Cluster

The codebase supports both modes:
- **Development:** Single Redis instance
- **Production:** Redis Cluster with read replicas

Redis Cluster configuration is detected automatically and provides:
- Automatic sharding across nodes
- Read scaling to replicas
- Failover handling with Sentinel

### Memory Optimization

| Configuration | Purpose |
|---------------|---------|
| Short TTLs (30s for prices) | Prevent stale cache buildup |
| Key expiration | Automatic cleanup of expired entries |
| Memory limits | `maxmemory` with `allkeys-lru` eviction |

## Kubernetes Autoscaling

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: bridge-watch-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Resource Requests and Limits

| Component | CPU Request | CPU Limit | Memory Request | Memory Limit |
|-----------|-----------|---------|--------------|------------|
| Backend | 250m | 500m | 256Mi | 512Mi |
| Frontend | 50m | 100m | 64Mi | 128Mi |
| PostgreSQL | 250m | 500m | 512Mi | 1Gi |
| Redis | 100m | 200m | 128Mi | 256Mi |

## Performance Optimizations

### Caching Strategy

```
Request → Redis Cache → Hit? → Return cached
                     → Miss? → Query DB → Cache result → Return
```

| Data | Cache TTL | Justification |
|------|-----------|---------------|
| Prices | 30s | Balance freshness with API load |
| Asset metadata | 5 min | Changes infrequently |
| Health scores | 60s | Computed periodically |
| Liquidity depth | 60s | Updated per polling cycle |

### Query Optimization

- TimescaleDB hypertable indexes on `(asset_symbol, time)` for efficient time-range queries
- Continuous aggregates for pre-computed hourly/daily rollups
- `EXPLAIN ANALYZE` for query plan verification in CI

### Frontend Performance

- Vite code splitting for route-based lazy loading
- Content-addressed static assets cached for 1 year
- Gzip compression via Nginx
- React Query deduplication prevents redundant API calls

## Bottleneck Analysis

| Potential Bottleneck | Mitigation |
|---------------------|------------|
| Database write throughput | TimescaleDB batch inserts, async writes |
| External API rate limits | Request throttling, caching, circuit breakers |
| WebSocket connections | Horizontal scaling with Redis Pub/Sub |
| Redis memory | TTL-based expiration, LRU eviction |
| Background job backlog | Scale BullMQ workers horizontally |

## Future Scaling Considerations

- **Event sourcing** for audit-critical data flows
- **Read-through cache** with Redis for frequently accessed aggregations
- **Dedicated worker deployment** separating API and background processing
- **Multi-region deployment** for geographic redundancy
- **CDN** for static frontend assets
