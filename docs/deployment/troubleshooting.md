# Troubleshooting Guide

Common issues, debugging steps, and operational runbooks for Stellar Bridge Watch.

## Quick Diagnostics

```bash
# Check all service status
docker compose ps

# Check health endpoint
curl http://localhost:3001/health/detailed | jq .

# View recent logs
docker compose logs --tail=100

# Check resource usage
docker stats --no-stream
```

## Common Issues

### Backend Fails to Start

**Symptoms:** Backend container exits immediately or enters restart loop.

**Diagnosis:**

```bash
# Check logs
docker compose logs backend --tail=100

# Check if dependencies are healthy
docker compose ps postgres redis
```

**Common Causes:**

| Cause | Solution |
|-------|----------|
| Database not ready | Wait for PostgreSQL health check or restart: `docker compose restart backend` |
| Missing environment variables | Verify `.env` file has required variables (see [Environment Setup](./environment-setup.md)) |
| Port conflict on 3001/3002 | Check for other services: `lsof -i :3001` |
| Migration not run | Run migrations: `make migrate` |
| Invalid database credentials | Verify `POSTGRES_USER` and `POSTGRES_PASSWORD` in `.env` |

### Database Connection Refused

**Symptoms:** `ECONNREFUSED 127.0.0.1:5432` or similar connection errors.

**Diagnosis:**

```bash
# Check PostgreSQL is running
docker compose ps postgres

# Test connection directly
docker compose exec postgres pg_isready -U bridge_watch

# Check PostgreSQL logs
docker compose logs postgres --tail=50
```

**Solutions:**

1. **Container not started:** `docker compose up -d postgres`
2. **Wrong host:** In Docker, use `postgres` (service name), not `localhost`
3. **Credentials mismatch:** Ensure `.env` matches what PostgreSQL was initialized with
4. **Data corruption:** Remove volume and reinitialize: `docker compose down -v && docker compose up -d postgres`

### Redis Connection Issues

**Symptoms:** `ECONNREFUSED` to Redis or `NOAUTH Authentication required`.

**Diagnosis:**

```bash
# Check Redis status
docker compose ps redis

# Test connection
docker compose exec redis redis-cli ping

# If password is set
docker compose exec redis redis-cli -a "$REDIS_PASSWORD" ping
```

**Solutions:**

1. **Container not started:** `docker compose up -d redis`
2. **Password mismatch:** Verify `REDIS_PASSWORD` in `.env` matches the Redis configuration
3. **Connection from wrong network:** Ensure the backend is on the `bridge-watch` network

### Frontend Shows Blank Page

**Symptoms:** Browser shows blank white page or loading spinner indefinitely.

**Diagnosis:**

```bash
# Check frontend container
docker compose ps frontend

# Check browser console for errors (F12 → Console)

# Verify API connectivity
curl http://localhost:3001/health
```

**Solutions:**

1. **Backend not reachable:** Ensure backend is running and healthy
2. **CORS issue:** Check browser console for CORS errors
3. **Wrong API URL:** Verify `VITE_API_URL` matches the backend address
4. **Build error:** Rebuild frontend: `docker compose build frontend`

### Migrations Fail

**Symptoms:** `npm run migrate` exits with an error.

**Diagnosis:**

```bash
# Check migration status
make migrate-status

# View specific error
cd backend && npm run migrate 2>&1

# Check database connectivity
make psql
```

**Solutions:**

1. **Database not running:** Start PostgreSQL first: `docker compose up -d postgres`
2. **Previous migration partially applied:** Check `knex_migrations` table and manually resolve
3. **TimescaleDB extension missing:** Run `CREATE EXTENSION IF NOT EXISTS timescaledb;` in the database
4. **Permission denied:** Verify the database user has appropriate privileges

### WebSocket Connection Fails

**Symptoms:** Real-time updates don't work. Browser console shows WebSocket errors.

**Diagnosis:**

```bash
# Test WebSocket endpoint
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  http://localhost:3002/

# Check WebSocket port
docker compose exec backend wget -qO- http://localhost:3002/ || echo "WS port responding"
```

**Solutions:**

1. **Port not exposed:** Ensure port 3002 is in `docker-compose.yml`
2. **Reverse proxy not upgrading:** Check Nginx config includes WebSocket upgrade headers
3. **Firewall blocking:** Open port 3002 in firewall rules
4. **Wrong URL:** Verify `VITE_WS_URL` points to the correct host and port

### High Memory Usage

**Symptoms:** Container OOM killed or slow responses.

**Diagnosis:**

```bash
# Check container resource usage
docker stats --no-stream

# Check Node.js heap
curl http://localhost:3001/health/detailed | jq '.components.memory'
```

**Solutions:**

1. **Increase container memory limits** in `docker-compose.yml`
2. **Check for memory leaks:** Monitor heap growth over time
3. **Reduce connection pool size:** Lower `pool.max` in database config
4. **Enable Redis caching:** Ensure Redis is properly caching frequent queries

### Slow API Responses

**Symptoms:** API endpoints take > 2 seconds to respond.

**Diagnosis:**

```bash
# Check response time
time curl http://localhost:3001/api/v1/assets

# Check database query performance
make psql
# Then run: SELECT * FROM pg_stat_activity WHERE state = 'active';

# Check Redis cache hit ratio
docker compose exec redis redis-cli INFO stats | grep keyspace
```

**Solutions:**

1. **Missing indexes:** Check `EXPLAIN ANALYZE` for slow queries
2. **Redis cache cold:** Trigger cache warming: the backend handles this automatically on startup
3. **Too many concurrent connections:** Check connection pool utilization
4. **TimescaleDB chunks not compressed:** Check chunk compression status

## Operational Runbooks

### Runbook: Restart All Services

```bash
# Graceful restart (preserves data)
docker compose down
docker compose up -d

# Verify health after restart
sleep 30
curl http://localhost:3001/health/detailed
```

### Runbook: Scale Backend Horizontally

```bash
# Docker Compose (simple scaling)
docker compose up -d --scale backend=3

# Kubernetes
kubectl scale deployment bridge-watch-backend --replicas=5 -n bridge-watch
```

### Runbook: Emergency Database Recovery

```bash
# 1. Stop application traffic
docker compose stop backend

# 2. Assess damage
docker compose exec postgres psql -U bridge_watch -d bridge_watch \
  -c "SELECT count(*) FROM assets;"

# 3. If corrupt, restore from backup
docker compose exec -T postgres pg_restore \
  -U bridge_watch -d bridge_watch --clean --if-exists \
  < backups/bridge_watch_latest.dump

# 4. Run pending migrations
make migrate

# 5. Restart backend
docker compose start backend

# 6. Verify
curl http://localhost:3001/health/detailed
```

### Runbook: Rotate Database Credentials

```bash
# 1. Generate new password
NEW_PASSWORD=$(openssl rand -base64 32)

# 2. Update PostgreSQL user password
docker compose exec postgres psql -U bridge_watch -c \
  "ALTER USER bridge_watch WITH PASSWORD '${NEW_PASSWORD}';"

# 3. Update .env file
sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${NEW_PASSWORD}/" .env

# 4. Restart backend to pick up new credentials
docker compose restart backend

# 5. Verify connection
curl http://localhost:3001/health/ready
```

### Runbook: Clear Redis Cache

```bash
# Flush all Redis data (cache + queues)
docker compose exec redis redis-cli FLUSHALL

# Or flush only the current database
docker compose exec redis redis-cli FLUSHDB

# Restart backend to rebuild cache
docker compose restart backend
```

## Log Analysis

### Finding Errors

```bash
# Filter for error-level logs
docker compose logs backend 2>&1 | grep '"level":50'

# Count errors in the last hour
docker compose logs backend --since 1h 2>&1 | grep '"level":50' | wc -l

# Find specific request by correlation ID
docker compose logs backend 2>&1 | grep 'req-abc123'
```

### Database Query Debugging

```bash
# Enable query logging temporarily
docker compose exec postgres psql -U bridge_watch -c \
  "ALTER SYSTEM SET log_min_duration_statement = 100;"
docker compose exec postgres psql -U bridge_watch -c \
  "SELECT pg_reload_conf();"

# Check slow queries
docker compose logs postgres 2>&1 | grep "duration:"

# Disable when done
docker compose exec postgres psql -U bridge_watch -c \
  "ALTER SYSTEM RESET log_min_duration_statement;"
docker compose exec postgres psql -U bridge_watch -c \
  "SELECT pg_reload_conf();"
```

## Getting Help

If you cannot resolve an issue using this guide:

1. Search [existing issues](https://github.com/StellaBridge/Bridge-Watch/issues) for similar problems
2. Check the [discussions](https://github.com/StellaBridge/Bridge-Watch/discussions) for community solutions
3. Open a new issue with:
   - Error messages and logs
   - Steps to reproduce
   - Environment details (OS, Docker version, Node version)
   - Output of `docker compose ps` and `curl http://localhost:3001/health/detailed`
