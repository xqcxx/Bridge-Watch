# Database Setup

This guide covers PostgreSQL with TimescaleDB setup, migrations, seeding, and maintenance for Stellar Bridge Watch.

## Overview

Bridge Watch uses **PostgreSQL 15+** with the **TimescaleDB** extension for efficient time-series data storage. The database stores both relational data (assets, bridges, configurations) and high-frequency time-series data (prices, health scores, liquidity snapshots).

## Database Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    PostgreSQL 15 + TimescaleDB             │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Regular Tables                                     │  │
│  │  ┌─────────┐ ┌─────────┐ ┌───────────────────┐     │  │
│  │  │ assets  │ │ bridges │ │ bridge_operators   │     │  │
│  │  └─────────┘ └─────────┘ └───────────────────┘     │  │
│  │  ┌─────────────┐ ┌─────────────────────────┐       │  │
│  │  │ alert_rules │ │ circuit_breaker_configs  │       │  │
│  │  └─────────────┘ └─────────────────────────┘       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  TimescaleDB Hypertables (time-series)              │  │
│  │  ┌────────┐ ┌───────────────┐ ┌──────────────────┐ │  │
│  │  │ prices │ │ health_scores │ │ liquidity_snaps  │ │  │
│  │  └────────┘ └───────────────┘ └──────────────────┘ │  │
│  │  ┌──────────────┐ ┌──────────────────────────┐     │  │
│  │  │ alert_events │ │ verification_results     │     │  │
│  │  └──────────────┘ └──────────────────────────┘     │  │
│  │                                                     │  │
│  │  Retention Policy: 90 days (automatic compression)  │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

## Initial Setup

### Using Docker (Recommended)

The database is automatically provisioned when using Docker Compose:

```bash
# Start PostgreSQL with TimescaleDB
docker compose -f docker-compose.dev.yml up -d postgres

# Verify it's healthy
docker compose ps postgres
```

The `scripts/init-db.sql` script runs automatically on first container start, creating the database and enabling required extensions.

### Manual Setup

If running PostgreSQL outside Docker:

```bash
# Install TimescaleDB (Ubuntu)
sudo apt install timescaledb-2-postgresql-15

# Enable the extension
sudo timescaledb-tune

# Restart PostgreSQL
sudo systemctl restart postgresql

# Create database and user
sudo -u postgres psql -c "CREATE USER bridge_watch WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "CREATE DATABASE bridge_watch OWNER bridge_watch;"
sudo -u postgres psql -d bridge_watch -c "CREATE EXTENSION IF NOT EXISTS timescaledb;"
```

## Running Migrations

Migrations are managed using Knex and located in `backend/src/database/migrations/`.

### Migration Commands

```bash
# Run all pending migrations
make migrate

# Or via npm
cd backend && npm run migrate

# Check migration status
make migrate-status

# Preview migrations without applying (dry run)
make migrate-dry-run

# Create a new migration
make migrate-make NAME=add_new_table

# Rollback the last migration batch
make migrate-rollback

# Rollback all migrations (DESTRUCTIVE)
make migrate-rollback-all
```

### Migration Order

| Migration | Description |
|-----------|-------------|
| `001_initial_schema.ts` | Core tables (assets, bridges, prices) + hypertables |
| `002_reserve_verification.ts` | Reserve verification system |
| `003_alert_system.ts` | Alert rules and events infrastructure |
| `004_circuit_breaker.ts` | Circuit breaker state management |
| `005_liquidity_snapshots.ts` | Liquidity tracking hypertable |
| `006_retention_policies.ts` | TimescaleDB 90-day retention policies |

### Migration in Production

```bash
# Docker Compose
docker compose exec backend npm run migrate

# Kubernetes
kubectl exec -it deploy/bridge-watch-backend -n bridge-watch -- npm run migrate
```

## Seeding Data

Seed files populate the database with reference data (monitored assets, bridge configurations):

```bash
# Run all seeds
make seed

# Or via npm
cd backend && npm run seed

# Run a specific seed file
make seed-specific FILE=001_assets
```

## Connection Configuration

### Connection Pool Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `pool.min` | 2 | Minimum connections |
| `pool.max` | 20 | Maximum connections |
| Connection timeout | 10s | Time to acquire a connection |
| Idle timeout | 30s | Close idle connections after |

### Production Tuning

For production workloads, tune PostgreSQL settings:

```sql
-- postgresql.conf recommendations
shared_buffers = '256MB'          -- 25% of available RAM
effective_cache_size = '768MB'    -- 75% of available RAM
work_mem = '4MB'
maintenance_work_mem = '128MB'
max_connections = 100

-- TimescaleDB specific
timescaledb.max_background_workers = 8
```

## Database Management

### Access Database Shell

```bash
# Via Make
make psql

# Via Docker
docker compose exec postgres psql -U bridge_watch -d bridge_watch

# Kubernetes
kubectl exec -it statefulset/bridge-watch-postgres -n bridge-watch -- \
  psql -U bridge_watch -d bridge_watch
```

### PgAdmin Access

In development, PgAdmin is available at http://localhost:5050:

- **Email:** `admin@bridgewatch.dev`
- **Password:** `admin`

The server configuration is automatically loaded from `scripts/pgadmin-servers.json`.

### Useful Queries

```sql
-- Check TimescaleDB hypertables
SELECT * FROM timescaledb_information.hypertables;

-- Check data retention policies
SELECT * FROM timescaledb_information.jobs
WHERE proc_name = 'policy_retention';

-- Check table sizes
SELECT
  schemaname || '.' || tablename AS table,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;

-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'bridge_watch';
```

## Data Retention

TimescaleDB retention policies automatically remove data older than 90 days from hypertables:

| Hypertable | Retention Period |
|------------|-----------------|
| `prices` | 90 days |
| `health_scores` | 90 days |
| `liquidity_snapshots` | 90 days |
| `alert_events` | 90 days |
| `verification_results` | 90 days |

Retention is enforced by a TimescaleDB background job. Check status:

```sql
SELECT * FROM timescaledb_information.job_stats
WHERE proc_name = 'policy_retention';
```
