# Database Migration Guide

Bridge Watch uses **Knex.js** as its migration and query-builder layer on top of
PostgreSQL 15 + TimescaleDB. This guide covers every aspect of working with the
migration system — from daily development to production deployments.

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Reference](#quick-reference)
3. [Running Migrations](#running-migrations)
4. [Rolling Back](#rolling-back)
5. [Migration Status](#migration-status)
6. [Dry Run Mode](#dry-run-mode)
7. [Creating Migration Files](#creating-migration-files)
8. [Validating Migrations](#validating-migrations)
9. [Migration History](#migration-history)
10. [Migration Locking](#migration-locking)
11. [Seed Data Management](#seed-data-management)
12. [Environment Awareness](#environment-awareness)
13. [Production Deployments](#production-deployments)
14. [CI/CD Integration](#cicd-integration)
15. [Writing Good Migrations](#writing-good-migrations)
16. [Troubleshooting](#troubleshooting)

---

## Overview

### How migrations work

Each migration is a TypeScript file that exports two functions:

| Function | Purpose |
|----------|---------|
| `up(knex)` | Apply the schema change (forward migration) |
| `down(knex)` | Revert the schema change (rollback) |

Knex tracks which migrations have been applied in the **`knex_migrations`** table
and groups runs into numbered **batches**. Rolling back a batch undoes all
migrations that were applied together in that run.

### Migration locking

Before any migration run Knex sets a lock row in the **`knex_migrations_lock`**
table. This prevents two processes from running migrations simultaneously (e.g.
two replicas racing at startup). The lock is released automatically when the
run completes. If a run crashes the lock may stay set; see
[Migration Locking](#migration-locking) for how to recover.

### File naming convention

Migration files use a **timestamp prefix** so new files always sort after
existing ones without collisions:

```
YYYYMMDDHHmmss_<description>.ts
```

The `npm run migrate:make` command generates this prefix automatically.

---

## Quick Reference

```bash
# --- Migrations ---
npm run migrate                       # run all pending migrations
npm run migrate:up                    # same as above
npm run migrate:down                  # roll back the last batch
npm run migrate:rollback              # same as migrate:down
npm run migrate:rollback:all          # roll back EVERY migration
npm run migrate:status                # show applied / pending table
npm run migrate:dry-run               # preview without touching the DB
npm run migrate:make -- add_foo_table # generate a new migration file
npm run migrate:validate              # validate all migration files
npm run migrate:history               # show full history from DB
npm run migrate:unlock                # release a stuck lock

# --- Seeds ---
npm run seed                          # run all seed files
npm run seed:specific -- 01_assets    # run a single seed file

# --- Make targets ---
make migrate                          # run all pending migrations
make migrate-status                   # show status
make migrate-dry-run                  # dry run
make migrate-rollback                 # roll back last batch
make migrate-make NAME=add_foo_table  # generate file
make migrate-validate                 # validate
make migrate-history                  # show history
make migrate-unlock                   # release lock
make seed                             # run all seeds
make seed-specific FILE=01_assets     # run one seed
```

---

## Running Migrations

### Apply all pending migrations

```bash
npm run migrate
# or
npm run migrate:up
# or (inside dev Docker environment)
make migrate
```

Knex applies every pending migration in alphabetical order and records them
together in a single batch. The output shows which files were applied and the
batch number assigned.

### What happens under the hood

1. Knex acquires the migration lock.
2. It reads the `knex_migrations` table to find which files have already run.
3. It compares that list against all files in `src/database/migrations/`.
4. It runs each pending file's `up()` function inside a transaction (where
   possible — DDL statements in PostgreSQL are transactional).
5. Each applied file is recorded in `knex_migrations`.
6. The lock is released.

---

## Rolling Back

### Roll back the last batch

```bash
npm run migrate:down
# or
npm run migrate:rollback
# or
make migrate-rollback
```

All migrations that were applied in the most recent batch are reverted by
calling their `down()` functions in reverse order.

### Roll back all migrations

```bash
npm run migrate:rollback:all
# or
make migrate-rollback-all
```

> **Warning:** This drops all managed schema objects. Use only in development
> or testing — never in production without a full backup.

---

## Migration Status

```bash
npm run migrate:status
# or
make migrate-status
```

Prints a formatted table showing every migration file, whether it has been
applied, which batch it belongs to, and when it was applied:

```
Migration Status  [env: development]
======================================================================================
Status      Batch   Name                                            Applied At
--------------------------------------------------------------------------------------
✓ applied   1       20240101120000_initial_schema                   2024-01-01T12:00:00.000Z
✓ applied   1       20240101120001_reserve_verification              2024-01-01T12:00:00.000Z
  pending           20240601090000_add_governance_table             -
======================================================================================
Applied: 2   Pending: 1
```

---

## Dry Run Mode

Preview which migrations would run without applying any changes:

```bash
npm run migrate:dry-run
# or
make migrate-dry-run
```

Useful before deploying to staging or production to confirm the exact set of
migrations that will be applied.

---

## Creating Migration Files

Generate a new, timestamped migration file with the correct boilerplate:

```bash
npm run migrate:make -- <name>
# Examples:
npm run migrate:make -- add_governance_table
npm run migrate:make -- alter_assets_add_decimals
npm run migrate:make -- drop_legacy_price_feed

# Via make:
make migrate-make NAME=add_governance_table
```

The command creates a file like:

```
backend/src/database/migrations/20240601090000_add_governance_table.ts
```

With this template:

```typescript
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // TODO: implement forward migration
}

export async function down(knex: Knex): Promise<void> {
  // TODO: implement rollback (mirror of up)
}
```

Fill in both functions before committing.

---

## Validating Migrations

Check that every migration file exports the required `up` and `down` functions:

```bash
npm run migrate:validate
# or
make migrate-validate
```

The validator imports each file and reports any that:
- are missing an `up` export
- are missing a `down` export (rollback will fail without it)
- fail to import (syntax error, missing dependency, etc.)

This command is run automatically in CI before any migration step (see
[CI/CD Integration](#cicd-integration)).

---

## Migration History

Query the full history of applied migrations stored in the database:

```bash
npm run migrate:history
# or
make migrate-history
```

Sample output:

```
Migration History:
--------------------------------------------------------------------------------------
ID    Batch   Name                                                Applied At
--------------------------------------------------------------------------------------
1     1       001_initial_schema.ts                               2024-01-01T12:00:00.000Z
2     1       002_reserve_verification.ts                         2024-01-01T12:00:00.000Z
3     2       20240601090000_add_governance_table.ts              2024-06-01T09:00:00.000Z
--------------------------------------------------------------------------------------
Total: 3 migration(s) applied.
```

---

## Migration Locking

Knex uses a two-row `knex_migrations_lock` table to ensure only one migration
process runs at a time:

```sql
SELECT * FROM knex_migrations_lock;
--  index | is_locked
-- -------+-----------
--      1 |         0   ← 0 = unlocked, 1 = locked
```

### Clearing a stuck lock

If a migration process was killed mid-run the lock may remain set, causing all
subsequent runs to fail with:

```
Migration table is already locked
```

To release it:

```bash
npm run migrate:unlock
# or
make migrate-unlock
```

> Only run this if you are certain no other migration process is currently
> running. In production, verify this across all application replicas first.

---

## Seed Data Management

Seeds populate the database with reference or test data. All seed files live in
`src/database/seeds/`.

### Run all seeds

```bash
npm run seed
# or
make seed
```

Seed files use `onConflict().ignore()` so they are safe to re-run — duplicate
rows are silently skipped.

### Run a specific seed file

```bash
npm run seed:specific -- 01_assets_and_bridges
npm run seed:specific -- 01_assets_and_bridges.ts   # extension optional

# Via make:
make seed-specific FILE=01_assets_and_bridges
```

### Execution order

Seed files run in alphabetical order. Use numeric prefixes to control
sequencing:

```
01_assets_and_bridges.ts
02_circuit_breaker_configs.ts
03_asset_metadata.ts
```

### Production safety

Running seeds in production is blocked by default:

```bash
# This will exit with an error:
NODE_ENV=production npm run seed

# To override explicitly:
NODE_ENV=production npm run seed -- --force
```

---

## Environment Awareness

The migration system respects `NODE_ENV`:

| `NODE_ENV` | Behaviour |
|------------|-----------|
| `development` (default) | Normal operation, no warnings |
| `test` | Normal operation, used in CI |
| `production` | Prints a prominent warning before running migrations; seeding is blocked unless `--force` is passed |

### Database configuration per environment

Connection credentials are read from environment variables (see `.env.example`):

```
POSTGRES_HOST
POSTGRES_PORT
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
```

For test environments set `POSTGRES_DB=bridge_watch_test` to isolate test data.

---

## Production Deployments

### Pre-deployment checklist

- [ ] Run `npm run migrate:validate` to confirm all files are valid.
- [ ] Run `npm run migrate:dry-run` against a production clone to preview changes.
- [ ] Verify you have a recent, tested database backup.
- [ ] Ensure no other migration process is running (check `knex_migrations_lock`).
- [ ] Review each pending migration's `down()` function — rollback must be tested.
- [ ] For large table changes (millions of rows), use `NOT VALID` constraints and
  validate in a separate step to avoid long locks.

### Zero-downtime migration patterns

**Additive changes (safe to deploy first):**
- Adding a new nullable column
- Creating a new table
- Adding an index `CONCURRENTLY`

**Breaking changes (require coordination):**
- Removing a column — deploy code that no longer references it *before* the migration
- Renaming a column — use a two-phase approach (add new column → backfill → remove old)
- Changing a column type — add a new column, backfill, swap at the application layer, then drop the old one

### Rollback procedure

```bash
# 1. Check what is currently applied
npm run migrate:status

# 2. Roll back the last batch
NODE_ENV=production npm run migrate:rollback

# 3. Confirm the state
npm run migrate:status
```

If an entire deployment needs to be undone, roll back multiple batches by
running `migrate:rollback` once per batch.

---

## CI/CD Integration

The CI pipeline (`.github/workflows/ci.yml`) runs the following migration steps
automatically on every push and pull request:

1. **Validate migration files** — `npm run migrate:validate`
   Ensures no file is missing `up` or `down` exports before touching the
   database.

2. **Apply pending migrations** — `npm run migrate`
   Runs all pending migrations against the test database service.

3. **Verify migration status** — `npm run migrate:status`
   Confirms the schema is fully up to date before tests run.

These steps run against a fresh `timescale/timescaledb:latest-pg15` service
provisioned by GitHub Actions, so every CI run starts from a clean state.

To add migration checks to the deployment pipeline, add a dry-run step before
applying changes:

```yaml
- name: Preview migrations
  run: npm run migrate:dry-run
  env:
    NODE_ENV: production
    POSTGRES_HOST: ${{ secrets.PROD_DB_HOST }}
    # ...

- name: Apply migrations
  run: npm run migrate
  env:
    NODE_ENV: production
    POSTGRES_HOST: ${{ secrets.PROD_DB_HOST }}
    # ...
```

---

## Writing Good Migrations

### Always implement `down()`

Every migration **must** have a working `down()` function. A migration without
a rollback path blocks incident recovery.

```typescript
// ✓ Good
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("governance_proposals");
}

// ✗ Bad — leaves team unable to roll back
export async function down(_knex: Knex): Promise<void> {
  // not implemented
}
```

### Keep migrations small and focused

One schema change per file. This makes rollbacks surgical and simplifies
code review.

### Make migrations idempotent where possible

Use `createTableIfNotExists`, `dropTableIfExists`, and `hasColumn` checks to
make re-runs safe:

```typescript
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable("governance_proposals"))) {
    await knex.schema.createTable("governance_proposals", (t) => {
      t.uuid("id").primary().defaultTo(knex.fn.uuid());
      t.string("title").notNullable();
      t.timestamps(true, true);
    });
  }
}
```

### Use transactions for data migrations

Wrap data-only migrations (UPDATE / INSERT) in a transaction so they are
atomic:

```typescript
export async function up(knex: Knex): Promise<void> {
  await knex.transaction(async (trx) => {
    await trx("assets").where({ type: null }).update({ type: "credit_alphanum4" });
  });
}
```

### TimescaleDB hypertables

Create the regular table first, then convert it:

```typescript
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("my_timeseries", (t) => {
    t.timestamp("recorded_at").notNullable();
    t.string("symbol").notNullable();
    t.decimal("value", 36, 18).notNullable();
  });

  // Convert to hypertable (time column must be the first argument)
  await knex.raw(
    "SELECT create_hypertable('my_timeseries', 'recorded_at', if_not_exists => TRUE)"
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("my_timeseries");
}
```

### Never edit an applied migration

Once a migration has been applied in any shared environment (development, CI,
staging, production), treat it as immutable. Create a new migration to make
further changes.

---

## Troubleshooting

### "Migration table is already locked"

Another process holds the lock, or a previous run crashed.

```bash
# Verify no migration process is running, then:
npm run migrate:unlock
```

### "relation knex_migrations does not exist"

The database has never been migrated. Run:

```bash
npm run migrate
```

### Migration applied but schema looks wrong

Check the history to confirm which batch ran:

```bash
npm run migrate:history
```

Then roll back and re-apply:

```bash
npm run migrate:rollback
npm run migrate
```

### Validation errors

```bash
npm run migrate:validate
```

The command prints each failing file with the specific problem. Common causes:
- Forgot to export `down` as a named export
- TypeScript compilation error in the file
- Missing `import type { Knex } from "knex"` at the top

### Seed re-run produces no data

Seeds use `onConflict().ignore()`, so rows that already exist are silently
skipped. If you need fresh data, either clear the table manually or add a
`truncate` step at the top of the seed file (development only).

### TimescaleDB extension not found

The database must have the TimescaleDB extension enabled. Run:

```bash
make psql
# then inside psql:
CREATE EXTENSION IF NOT EXISTS timescaledb;
```

Or re-run the init script:

```bash
psql -U bridge_watch bridge_watch < scripts/init-db.sql
```
