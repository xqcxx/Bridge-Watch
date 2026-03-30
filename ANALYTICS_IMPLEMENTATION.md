# Analytics Aggregation Service Implementation

## Overview

This implementation adds a comprehensive analytics aggregation service to Bridge Watch that computes and caches statistics across all monitored bridge and asset data for dashboard displays and reporting.

## Issue Reference

Closes #65

## Implementation Summary

### 1. Core Service (`backend/src/services/analytics.service.ts`)

The `AnalyticsService` class provides:

- **Protocol-wide statistics**: TVL, volume (24h/7d/30d), active bridges/assets, transaction counts, average health scores
- **Bridge comparison metrics**: TVL rankings, volume comparisons, market share, transaction analytics, trend analysis
- **Asset rankings**: Health score rankings, liquidity depth, volume rankings, price stability, bridge counts
- **Volume aggregations**: Time-series data (hourly/daily/weekly/monthly) with inflow/outflow tracking
- **Trend calculations**: Percentage changes, period-over-period comparisons, trend indicators
- **Top performers**: Configurable rankings for assets and bridges by various metrics
- **Custom metrics**: Extensible framework for user-defined analytics queries
- **Historical comparisons**: Time-series data for trending analysis
- **Cache management**: Redis-based caching with configurable TTLs

### 2. TimescaleDB Continuous Aggregates (`backend/src/database/migrations/007_analytics_continuous_aggregates.ts`)

Created materialized views with automatic refresh policies:

- **prices_hourly / prices_daily**: Price statistics with OHLC data, volatility metrics
- **health_scores_hourly / health_scores_daily**: Aggregated health scores across all components
- **liquidity_hourly / liquidity_daily**: Cross-DEX liquidity aggregations
- **alert_events_hourly**: Alert frequency and delivery success metrics
- **verification_results_hourly**: Verification success rates and proof depth statistics

All continuous aggregates include:

- Automatic refresh policies (hourly/daily)
- Optimized indexes for fast queries
- Retention aligned with base hypertables

### 3. Aggregation Worker (`backend/src/workers/analyticsAggregation.worker.ts`)

Background worker that pre-computes and caches analytics:

- Protocol stats (every 2 minutes)
- Bridge comparisons (every 3 minutes)
- Asset rankings (every 3 minutes)
- Volume aggregations (every 5 minutes)
- Top performers (every 5 minutes)
- Trend calculations (on-demand)
- Cache invalidation support

### 4. API Routes (`backend/src/api/routes/analytics.ts`)

RESTful API endpoints:

- `GET /api/v1/analytics/protocol` - Protocol-wide statistics
- `GET /api/v1/analytics/bridges/comparison` - Bridge comparison metrics
- `GET /api/v1/analytics/assets/rankings` - Asset rankings
- `GET /api/v1/analytics/volume` - Volume aggregations (with filters)
- `GET /api/v1/analytics/trends/:metric` - Trend calculations
- `GET /api/v1/analytics/top-performers` - Top performing assets/bridges
- `GET /api/v1/analytics/historical/:metric` - Historical comparison data
- `GET /api/v1/analytics/summary` - Comprehensive analytics summary
- `GET /api/v1/analytics/custom-metrics` - List custom metrics
- `GET /api/v1/analytics/custom-metrics/:metricId` - Execute custom metric
- `POST /api/v1/analytics/cache/invalidate` - Cache invalidation

### 5. Custom Metrics (`backend/src/config/customMetrics.ts`)

Pre-defined custom metrics:

1. **Bridge Reliability Score**: Verification success rate analysis
2. **Liquidity Concentration Index**: Herfindahl index for liquidity distribution
3. **Alert Effectiveness**: Alert delivery success and response times
4. **Cross-Chain Flow Analysis**: Net flow direction and magnitude
5. **Price Volatility Ranking**: Asset volatility over time periods
6. **Bridge Market Dominance Trends**: Market share stability analysis

### 6. Caching Layer

Redis-based caching strategy:

- Cache key pattern: `analytics:{category}:{subcategory}`
- Default TTL: 5 minutes (300 seconds)
- Custom metric TTLs: Configurable per metric
- Pattern-based cache invalidation
- Automatic cache warming via scheduled jobs

### 7. Tests (`backend/tests/services/analytics.service.test.ts`)

Comprehensive test coverage:

- Cache hit/miss scenarios
- Protocol statistics computation
- Bridge comparison calculations
- Asset ranking logic
- Volume aggregation with filters
- Trend calculation for multiple metrics
- Top performers selection
- Custom metric execution
- Cache invalidation
- Historical data retrieval
- Error handling

### 8. Documentation (`backend/docs/analytics-service.md`)

Complete documentation including:

- Feature overview
- Architecture details
- API endpoint specifications
- Custom metrics guide
- Performance considerations
- Monitoring recommendations
- Testing instructions
- Future enhancement ideas

## Key Features

### TimescaleDB Integration

- Leverages continuous aggregates for efficient pre-computation
- Automatic materialized view refresh policies
- Optimized indexes for fast time-series queries
- Retention policies aligned with data lifecycle

### Caching Strategy

- Multi-level caching with Redis
- Configurable TTLs per metric type
- Pattern-based cache invalidation
- Pre-warming via scheduled jobs
- Cache hit rate optimization

### Scheduled Aggregations

- Background workers for expensive computations
- Staggered job schedules to distribute load
- Automatic retry on failure
- Job monitoring and logging

### Custom Metrics Support

- Extensible framework for user-defined queries
- SQL-based metric definitions
- Independent caching per metric
- Parameter support for dynamic queries

### Real-time Updates

- Scheduled jobs ensure fresh data
- Configurable refresh intervals
- On-demand cache invalidation
- Support for real-time metric queries

## Performance Optimizations

1. **Query Optimization**
   - Use of continuous aggregates instead of raw hypertables
   - Indexed columns for fast lookups
   - Limited result sets with pagination support

2. **Caching**
   - Aggressive caching of expensive queries
   - Tiered TTLs based on data volatility
   - Pre-computation via background jobs

3. **Database**
   - TimescaleDB compression for historical data
   - Retention policies to manage data growth
   - Optimized indexes on time-series data

## Files Created/Modified

### Created Files

- `backend/src/services/analytics.service.ts` - Core analytics service
- `backend/src/workers/analyticsAggregation.worker.ts` - Background aggregation worker
- `backend/src/database/migrations/007_analytics_continuous_aggregates.ts` - TimescaleDB continuous aggregates
- `backend/src/api/routes/analytics.ts` - Analytics API endpoints
- `backend/src/config/customMetrics.ts` - Custom metric definitions
- `backend/tests/services/analytics.service.test.ts` - Service tests
- `backend/docs/analytics-service.md` - Complete documentation

### Modified Files

- `backend/src/api/routes/index.ts` - Registered analytics routes
- `backend/src/workers/index.ts` - Added analytics aggregation jobs

## Testing

Run the analytics service tests:

```bash
cd backend
npm test -- analytics.service.test.ts
```

Run the migration:

```bash
cd backend
npm run migrate
```

## Usage Examples

### Get Protocol Statistics

```bash
curl http://localhost:3001/api/v1/analytics/protocol
```

### Get Bridge Comparisons

```bash
curl http://localhost:3001/api/v1/analytics/bridges/comparison
```

### Get Asset Rankings

```bash
curl http://localhost:3001/api/v1/analytics/assets/rankings
```

### Get Volume Aggregation (Daily, for USDC)

```bash
curl "http://localhost:3001/api/v1/analytics/volume?period=daily&symbol=USDC"
```

### Calculate Health Score Trend

```bash
curl "http://localhost:3001/api/v1/analytics/trends/health_score?symbol=USDC"
```

### Get Top Performing Assets

```bash
curl "http://localhost:3001/api/v1/analytics/top-performers?type=assets&metric=health&limit=10"
```

### Execute Custom Metric

```bash
curl http://localhost:3001/api/v1/analytics/custom-metrics/bridge-reliability
```

### Invalidate Cache

```bash
curl -X POST http://localhost:3001/api/v1/analytics/cache/invalidate \
  -H "Content-Type: application/json" \
  -d '{"pattern": "protocol"}'
```

## Monitoring

Key metrics to monitor:

1. **Cache Hit Rate**: Should be >80%
2. **Query Execution Time**: Monitor slow queries
3. **Job Success Rate**: Ensure aggregation jobs complete
4. **Redis Memory Usage**: Monitor cache growth

## Future Enhancements

1. Real-time WebSocket updates for live analytics
2. ML-based predictive analytics and forecasting
3. Automated anomaly detection
4. CSV/JSON export capabilities
5. User-defined custom dashboards
6. Alert integration based on analytics thresholds

## Commit Message

```
feat: create analytics aggregation service

- Add AnalyticsService with protocol-wide statistics computation
- Implement TimescaleDB continuous aggregates for efficient queries
- Create time-series aggregations (hourly, daily, weekly, monthly)
- Add bridge comparison metrics with market share calculations
- Implement asset ranking by health score, volume, and TVL
- Add volume and TVL aggregation with trend calculations
- Create top performers identification system
- Implement scheduled aggregation jobs with BullMQ
- Add Redis caching layer with configurable TTLs
- Support historical comparison and trend analysis
- Implement custom metric framework with 6 pre-defined metrics
- Add comprehensive API endpoints for all analytics
- Include cache invalidation support
- Add comprehensive test coverage
- Create detailed documentation

Closes #65
```

## Notes

- All analytics queries are cached for optimal performance
- TimescaleDB continuous aggregates automatically maintain pre-aggregated data
- Background jobs ensure fresh data without impacting API response times
- Custom metrics can be easily extended by adding definitions to customMetrics.ts
- The service is designed to scale with data growth through TimescaleDB features
