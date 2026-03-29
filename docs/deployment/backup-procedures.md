# Backup Procedures

This guide covers backup and disaster recovery procedures for Stellar Bridge Watch.

## Backup Strategy

Bridge Watch requires backups for two primary data stores:

| Store | Data Type | Backup Priority | Method |
|-------|-----------|-----------------|--------|
| PostgreSQL + TimescaleDB | All application data | **Critical** | `pg_dump` / continuous archiving |
| Redis | Cache and queue state | Low | RDB snapshots (optional) |

Redis data is transient (cache + job queues) and can be rebuilt from PostgreSQL on restart. PostgreSQL is the source of truth and must be backed up.

## PostgreSQL Backup

### On-Demand Backup (pg_dump)

```bash
# Docker Compose environment
docker compose exec postgres pg_dump \
  -U bridge_watch \
  -d bridge_watch \
  --format=custom \
  --compress=9 \
  > backups/bridge_watch_$(date +%Y%m%d_%H%M%S).dump

# Kubernetes environment
kubectl exec -it statefulset/bridge-watch-postgres -n bridge-watch -- \
  pg_dump -U bridge_watch -d bridge_watch --format=custom --compress=9 \
  > backups/bridge_watch_$(date +%Y%m%d_%H%M%S).dump
```

### Automated Daily Backup Script

```bash
#!/bin/bash
# scripts/backup-db.sh

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/bridge_watch_${TIMESTAMP}.dump"

mkdir -p "$BACKUP_DIR"

echo "Starting database backup..."

# Create backup
docker compose exec -T postgres pg_dump \
  -U bridge_watch \
  -d bridge_watch \
  --format=custom \
  --compress=9 \
  > "$BACKUP_FILE"

# Verify backup
if pg_restore --list "$BACKUP_FILE" > /dev/null 2>&1; then
  echo "Backup verified: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
else
  echo "ERROR: Backup verification failed!"
  exit 1
fi

# Clean up old backups
find "$BACKUP_DIR" -name "bridge_watch_*.dump" -mtime +"$RETENTION_DAYS" -delete
echo "Cleaned backups older than ${RETENTION_DAYS} days"
```

### Schedule with Cron

```bash
# Run daily at 2:00 AM
0 2 * * * cd /opt/bridge-watch && bash scripts/backup-db.sh >> /var/log/bridge-watch-backup.log 2>&1
```

### Restore from Backup

```bash
# Stop the backend to prevent writes
docker compose stop backend

# Restore from a backup file
docker compose exec -T postgres pg_restore \
  -U bridge_watch \
  -d bridge_watch \
  --clean \
  --if-exists \
  < backups/bridge_watch_20260329_020000.dump

# Restart everything
docker compose start backend
```

## Continuous Archiving (WAL)

For production environments requiring point-in-time recovery:

### Enable WAL Archiving

```bash
# PostgreSQL configuration
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backups/wal/%f'
max_wal_senders = 3
```

### Docker Volume for WAL Archives

```yaml
# docker-compose.yml addition
services:
  postgres:
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - wal_archive:/backups/wal
    command: >
      postgres
        -c wal_level=replica
        -c archive_mode=on
        -c archive_command='cp %p /backups/wal/%f'

volumes:
  wal_archive:
```

### Point-in-Time Recovery

```bash
# Restore base backup
pg_restore --clean --if-exists -d bridge_watch base_backup.dump

# Apply WAL files up to a specific timestamp
recovery_target_time = '2026-03-29 12:00:00'
restore_command = 'cp /backups/wal/%f %p'
```

## Cloud Backup Solutions

### AWS

| Service | Use Case |
|---------|----------|
| RDS Automated Backups | Managed PostgreSQL with daily snapshots |
| S3 | Store `pg_dump` output for off-site backup |
| AWS Backup | Centralized backup management |

```bash
# Upload backup to S3
aws s3 cp backups/bridge_watch_latest.dump \
  s3://bridge-watch-backups/$(date +%Y/%m/%d)/ \
  --storage-class STANDARD_IA
```

### GCP

| Service | Use Case |
|---------|----------|
| Cloud SQL Automated Backups | Managed PostgreSQL backups |
| Cloud Storage | Off-site backup storage |

### Azure

| Service | Use Case |
|---------|----------|
| Azure Database for PostgreSQL | Managed backups |
| Blob Storage | Off-site backup storage |

## Redis Backup (Optional)

Redis stores transient cache data and BullMQ job queues. Backups are optional since data can be rebuilt.

```bash
# Trigger RDB snapshot
docker compose exec redis redis-cli BGSAVE

# Copy RDB file
docker cp bridge-watch-redis:/data/dump.rdb backups/redis_$(date +%Y%m%d).rdb
```

## Backup Verification

Regularly test backup restoration:

```bash
# Create a test database
docker compose exec postgres createdb -U bridge_watch bridge_watch_test

# Restore backup to test database
docker compose exec -T postgres pg_restore \
  -U bridge_watch \
  -d bridge_watch_test \
  < backups/bridge_watch_latest.dump

# Verify data integrity
docker compose exec postgres psql -U bridge_watch -d bridge_watch_test \
  -c "SELECT count(*) FROM assets; SELECT count(*) FROM bridges;"

# Clean up
docker compose exec postgres dropdb -U bridge_watch bridge_watch_test
```

## Backup Schedule

| Backup Type | Frequency | Retention | Storage |
|-------------|-----------|-----------|---------|
| Full `pg_dump` | Daily at 2:00 AM | 30 days | Local + off-site |
| WAL archiving | Continuous | 7 days | Local |
| Redis RDB | Weekly | 7 days | Local |
| Configuration files | On change | Indefinite | Version control |

## Disaster Recovery Runbook

### Scenario: Database Corruption

1. Stop the backend: `docker compose stop backend`
2. Identify the last known good backup
3. Restore from backup (see [Restore from Backup](#restore-from-backup))
4. Run pending migrations: `make migrate`
5. Verify data: `make psql` and run validation queries
6. Restart the backend: `docker compose start backend`
7. Monitor health: `curl http://localhost:3001/health/detailed`

### Scenario: Complete System Loss

1. Provision new infrastructure (server, Docker)
2. Clone the repository
3. Restore `.env` from secure backup
4. Start database services: `docker compose up -d postgres redis`
5. Restore database from latest backup
6. Run migrations: `make migrate`
7. Start all services: `make up`
8. Verify deployment: `curl http://localhost:3001/health/detailed`
9. Update DNS if IP has changed
