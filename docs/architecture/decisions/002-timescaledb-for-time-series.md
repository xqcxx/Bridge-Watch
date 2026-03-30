# ADR-002: Use TimescaleDB for Time-Series Data

## Status

Accepted

## Context

Bridge Watch ingests high-frequency time-series data: price observations every 30 seconds, health scores every minute, and liquidity snapshots every minute. This data needs efficient storage, fast time-range queries, and automatic lifecycle management (retention, compression).

Options considered:
1. **Plain PostgreSQL** — Standard tables with time-based indexes
2. **TimescaleDB** — PostgreSQL extension optimized for time-series
3. **InfluxDB** — Purpose-built time-series database
4. **Separate PostgreSQL + InfluxDB** — Relational data in PostgreSQL, time-series in InfluxDB

## Decision

Use **PostgreSQL with the TimescaleDB extension** for both relational and time-series data in a single database.

## Consequences

### Positive

- **Single database:** No operational overhead of managing two separate databases.
- **Standard SQL:** Time-series data can be queried with familiar SQL, joined with relational tables.
- **Automatic partitioning:** Hypertables automatically partition data by time for query efficiency.
- **Retention policies:** Built-in retention policies automatically drop old data (configured for 90 days).
- **Compression:** Automatic compression of older chunks reduces storage by 10-20x.
- **Continuous aggregates:** Materialized views that auto-update for pre-computed hourly/daily rollups.
- **PostgreSQL ecosystem:** All PostgreSQL tools, extensions, and hosting providers work seamlessly.

### Negative

- **Extension dependency:** Requires TimescaleDB extension, limiting some managed PostgreSQL providers.
- **Resource overhead:** Slightly higher resource usage than plain PostgreSQL for the extension runtime.
- **Not a dedicated TSDB:** For extreme time-series volumes (millions of writes/second), a dedicated TSDB like InfluxDB may be more efficient.

### Neutral

- The 90-day retention policy bounds storage growth. At current ingestion rates, the database stays well under 1 GB compressed.
