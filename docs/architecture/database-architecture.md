# Database Architecture

Schema design, data model, and TimescaleDB strategy for Stellar Bridge Watch.

## Overview

Bridge Watch uses **PostgreSQL 15+** with the **TimescaleDB** extension. The schema separates data into two categories:

- **Regular tables** — Configuration, metadata, and state (standard PostgreSQL)
- **Hypertables** — Time-series data with automatic partitioning and retention (TimescaleDB)

## Entity-Relationship Diagram

```
┌──────────────┐     1:N     ┌──────────────────┐
│   assets     │────────────►│    prices         │  (hypertable)
│              │             │    (time-series)  │
│ symbol (PK)  │             └──────────────────┘
│ name         │
│ asset_type   │     1:N     ┌──────────────────┐
│ issuer       │────────────►│  health_scores    │  (hypertable)
│ status       │             │  (time-series)    │
└──────┬───────┘             └──────────────────┘
       │
       │ N:M     ┌──────────────────┐
       ├────────►│  bridges          │
       │         │                   │     1:N     ┌──────────────────────┐
       │         │ bridge_id (PK)    │────────────►│  bridge_volume_stats │
       │         │ name              │             └──────────────────────┘
       │         │ type              │
       │         │ status            │     1:N     ┌──────────────────────┐
       │         └───────────────────┘────────────►│  bridge_operators    │
       │                                           └──────────────────────┘
       │
       │ 1:N     ┌──────────────────┐
       ├────────►│ liquidity_snaps   │  (hypertable)
       │         │ (time-series)     │
       │         └──────────────────┘
       │
       │ 1:N     ┌──────────────────┐
       └────────►│ verification_     │  (hypertable)
                 │ results           │
                 └──────────────────┘

┌──────────────┐     1:N     ┌──────────────────┐
│ alert_rules  │────────────►│  alert_events     │  (hypertable)
│              │             │  (time-series)    │
│ rule_id (PK) │             └──────────────────┘
│ asset_symbol │
│ condition    │
│ threshold    │
└──────────────┘

┌────────────────────────┐     1:N     ┌──────────────────────┐
│ circuit_breaker_configs│────────────►│ circuit_breaker_      │
│                        │             │ triggers              │
└────────────────────────┘             └──────────────────────┘
                                 1:N
                         ┌─────────────►┌──────────────────────┐
                                        │ circuit_breaker_      │
                                        │ pauses                │
                                        └──────────────────────┘
                                 1:N
                         ┌─────────────►┌──────────────────────┐
                                        │ circuit_breaker_      │
                                        │ whitelist             │
                                        └──────────────────────┘
```

## Regular Tables

### `assets`

The central table storing all monitored asset metadata.

| Column | Type | Description |
|--------|------|-------------|
| `symbol` | `VARCHAR` (PK) | Asset symbol (e.g., USDC, PYUSD) |
| `name` | `VARCHAR` | Full asset name |
| `asset_type` | `VARCHAR` | Type (native, credit, soroban) |
| `issuer` | `VARCHAR` | Stellar issuer address |
| `status` | `VARCHAR` | active, inactive, paused |
| `created_at` | `TIMESTAMPTZ` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | Last update timestamp |

### `bridges`

Bridge configurations and current status.

| Column | Type | Description |
|--------|------|-------------|
| `bridge_id` | `VARCHAR` (PK) | Unique bridge identifier |
| `name` | `VARCHAR` | Bridge display name |
| `type` | `VARCHAR` | Bridge type (lock-mint, burn-release, etc.) |
| `status` | `VARCHAR` | online, degraded, offline |
| `source_chain` | `VARCHAR` | Source blockchain |
| `dest_chain` | `VARCHAR` | Destination blockchain |
| `contract_address` | `VARCHAR` | Bridge contract address |

### `alert_rules`

User-defined alert conditions.

| Column | Type | Description |
|--------|------|-------------|
| `rule_id` | `UUID` (PK) | Unique rule identifier |
| `asset_symbol` | `VARCHAR` (FK) | Target asset |
| `condition` | `VARCHAR` | Alert condition type |
| `threshold` | `DECIMAL` | Threshold value |
| `enabled` | `BOOLEAN` | Rule active flag |
| `created_at` | `TIMESTAMPTZ` | Creation timestamp |

### `circuit_breaker_configs`

Circuit breaker threshold configuration per asset.

### `reserve_commitments`

Guard-rail data for reserve verification.

## TimescaleDB Hypertables

### `prices`

Time-series price data from all aggregation sources.

| Column | Type | Description |
|--------|------|-------------|
| `time` | `TIMESTAMPTZ` | Price observation timestamp |
| `asset_symbol` | `VARCHAR` | Asset identifier |
| `source` | `VARCHAR` | Price source (stellar_dex, circle, coinbase) |
| `price` | `DECIMAL(20,8)` | Price value |
| `volume_24h` | `DECIMAL(30,8)` | 24-hour volume |

**Retention:** 90 days

### `health_scores`

Computed health scores over time.

| Column | Type | Description |
|--------|------|-------------|
| `time` | `TIMESTAMPTZ` | Score calculation timestamp |
| `asset_symbol` | `VARCHAR` | Asset identifier |
| `composite_score` | `INTEGER` | Overall health (0–100) |
| `liquidity_score` | `INTEGER` | Liquidity component |
| `price_score` | `INTEGER` | Price stability component |
| `bridge_score` | `INTEGER` | Bridge health component |
| `reserve_score` | `INTEGER` | Reserve backing component |
| `volume_score` | `INTEGER` | Volume trend component |

**Retention:** 90 days

### `liquidity_snapshots`

Periodic liquidity depth snapshots across DEXes.

| Column | Type | Description |
|--------|------|-------------|
| `time` | `TIMESTAMPTZ` | Snapshot timestamp |
| `asset_symbol` | `VARCHAR` | Asset identifier |
| `dex_source` | `VARCHAR` | DEX name |
| `total_liquidity` | `DECIMAL(30,8)` | Total liquidity |
| `bid_depth` | `DECIMAL(30,8)` | Buy-side depth |
| `ask_depth` | `DECIMAL(30,8)` | Sell-side depth |

**Retention:** 90 days

### `alert_events`

Fired alert records.

| Column | Type | Description |
|--------|------|-------------|
| `time` | `TIMESTAMPTZ` | Alert timestamp |
| `rule_id` | `UUID` | Triggering rule |
| `asset_symbol` | `VARCHAR` | Affected asset |
| `severity` | `VARCHAR` | low, medium, high, critical |
| `message` | `TEXT` | Alert description |
| `value` | `DECIMAL` | Trigger value |

**Retention:** 90 days

### `verification_results`

Reserve verification audit trail.

| Column | Type | Description |
|--------|------|-------------|
| `time` | `TIMESTAMPTZ` | Verification timestamp |
| `asset_symbol` | `VARCHAR` | Verified asset |
| `bridge_id` | `VARCHAR` | Bridge verified |
| `result` | `VARCHAR` | pass, fail, inconclusive |
| `circulating_supply` | `DECIMAL(30,8)` | Reported supply |
| `verified_reserves` | `DECIMAL(30,8)` | Verified reserves |

**Retention:** 90 days

## Migration Strategy

Migrations are managed with **Knex** and follow sequential numbering:

```
backend/src/database/migrations/
├── 001_initial_schema.ts        # Core tables + hypertables
├── 002_reserve_verification.ts  # Reserve verification system
├── 003_alert_system.ts          # Alert infrastructure
├── 004_circuit_breaker.ts       # Circuit breaker state
├── 005_liquidity_snapshots.ts   # Liquidity tracking
└── 006_retention_policies.ts    # TimescaleDB retention
```

Every migration exports both `up()` and `down()` functions for reversibility.

See [Database Setup](../deployment/database-setup.md) for migration commands and [Migration Guide](../MIGRATION_GUIDE.md) for writing new migrations.

## Performance Considerations

### Indexing

- All hypertables are automatically indexed on the `time` column by TimescaleDB
- `asset_symbol` is indexed on all time-series tables for filtered queries
- Composite indexes on `(asset_symbol, time)` for asset-specific time-range queries

### TimescaleDB Optimizations

- **Automatic chunking** — Data is partitioned into time-based chunks for query efficiency
- **Compression** — Older chunks are compressed to reduce storage
- **Retention policies** — 90-day automatic data expiry

### Connection Pooling

| Setting | Value | Purpose |
|---------|-------|---------|
| `pool.min` | 2 | Minimum idle connections |
| `pool.max` | 20 | Maximum concurrent connections |
| Connection timeout | 10s | Acquire connection timeout |
| Idle timeout | 30s | Close idle connections |

### Decimal Precision

| Data Type | Precision | Used For |
|-----------|-----------|----------|
| `DECIMAL(20,8)` | 20 digits, 8 decimal | Prices |
| `DECIMAL(30,8)` | 30 digits, 8 decimal | TVL, volumes, supply |
