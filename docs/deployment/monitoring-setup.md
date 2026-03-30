# Monitoring Setup

This guide covers setting up monitoring, alerting, and observability for Stellar Bridge Watch.

## Overview

Bridge Watch provides built-in monitoring capabilities:

- **Health endpoints** for service health and dependency status
- **Prometheus metrics** for time-series monitoring
- **Structured logging** via Pino (JSON format) for log aggregation
- **Request tracing** with correlation IDs for distributed tracing

```
┌───────────────────────────────────────────────────────────┐
│                    Monitoring Stack                        │
│                                                           │
│  ┌──────────┐  ┌────────────┐  ┌───────────────────────┐ │
│  │Prometheus│←─│  Backend   │  │   Pino Logger         │ │
│  │ /metrics │  │ /health/*  │  │   (JSON to stdout)    │ │
│  └────┬─────┘  └────────────┘  └──────────┬────────────┘ │
│       │                                    │              │
│  ┌────▼─────┐                    ┌─────────▼──────────┐  │
│  │ Grafana  │                    │  Log Aggregation   │  │
│  │Dashboard │                    │  (ELK / Loki)      │  │
│  └──────────┘                    └────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

## Health Check Endpoints

Bridge Watch exposes five health endpoints on the backend (port 3001):

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `GET /health` | Simple alive check | `{ "status": "ok" }` |
| `GET /health/live` | Kubernetes liveness probe | `200` if process is alive |
| `GET /health/ready` | Kubernetes readiness probe | `200` if all dependencies are connected |
| `GET /health/detailed` | Full system health report | JSON with component-level status |
| `GET /health/metrics` | Prometheus-format metrics | Text-based Prometheus exposition format |

### Detailed Health Response

```json
{
  "status": "healthy",
  "timestamp": "2026-03-29T12:00:00Z",
  "uptime": 86400,
  "version": "1.0.0",
  "components": {
    "database": { "status": "healthy", "latency_ms": 2 },
    "redis": { "status": "healthy", "latency_ms": 1 },
    "stellar_horizon": { "status": "healthy", "latency_ms": 150 },
    "memory": { "status": "healthy", "usage_percent": 45 },
    "disk": { "status": "healthy", "usage_percent": 30 }
  }
}
```

### Health Check Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `HEALTH_CHECK_TIMEOUT_MS` | `5000` | Timeout for dependency checks |
| `HEALTH_CHECK_MEMORY_THRESHOLD` | `90` | Memory usage warning threshold (%) |
| `HEALTH_CHECK_DISK_THRESHOLD` | `80` | Disk usage warning threshold (%) |
| `HEALTH_CHECK_EXTERNAL_APIS` | `false` | Include external API checks |

## Prometheus Monitoring

### Prometheus Configuration

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 30s
  evaluation_interval: 30s

scrape_configs:
  - job_name: 'bridge-watch-backend'
    metrics_path: '/health/metrics'
    static_configs:
      - targets: ['backend:3001']
    scrape_interval: 15s

  - job_name: 'bridge-watch-postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'bridge-watch-redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

### Docker Compose Addition

```yaml
# Add to docker-compose.yml or create docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: bridge-watch-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    networks:
      - bridge-watch

  grafana:
    image: grafana/grafana:latest
    container_name: bridge-watch-grafana
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}
    volumes:
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus
    networks:
      - bridge-watch

volumes:
  prometheus_data:
  grafana_data:
```

### Kubernetes ServiceMonitor

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: bridge-watch-monitor
  namespace: bridge-watch
spec:
  selector:
    matchLabels:
      app: bridge-watch
      component: backend
  endpoints:
  - port: http
    path: /health/metrics
    interval: 30s
    scrapeTimeout: 10s
```

## Grafana Dashboards

### Recommended Dashboard Panels

**System Health:**
- Service uptime and availability
- Health check response times
- Memory and CPU usage
- Active connections (PostgreSQL + Redis)

**Application Metrics:**
- API request rate and latency (p50, p95, p99)
- WebSocket active connections
- BullMQ job queue depth and processing rate
- Rate limit hits per endpoint

**Business Metrics:**
- Monitored assets count and health scores
- Bridge status distribution (healthy/degraded/unhealthy)
- Price deviation alerts triggered
- Reserve verification success rate

**Infrastructure:**
- PostgreSQL query performance and connection pool usage
- Redis memory usage and hit/miss ratio
- TimescaleDB chunk count and compression ratio
- Disk usage trends

## Logging

### Log Format

Bridge Watch uses **Pino** for structured JSON logging to stdout:

```json
{
  "level": 30,
  "time": 1711713600000,
  "pid": 1,
  "hostname": "bridge-watch-backend",
  "msg": "Asset health calculated",
  "asset": "USDC",
  "score": 85,
  "requestId": "req-abc123"
}
```

### Log Levels

| Level | Value | Usage |
|-------|-------|-------|
| `error` | 50 | Errors requiring attention |
| `warn` | 40 | Unexpected but recoverable conditions |
| `info` | 30 | Normal operational events |
| `debug` | 20 | Detailed debugging information |

Set via `LOG_LEVEL` environment variable. Use `warn` or `info` for production.

### Log Aggregation

#### ELK Stack

```yaml
# Filebeat configuration for Docker logs
filebeat.inputs:
  - type: container
    paths:
      - '/var/lib/docker/containers/*/*.log'
    processors:
      - decode_json_fields:
          fields: ["message"]
          target: ""

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "bridge-watch-%{+yyyy.MM.dd}"
```

#### Loki (Grafana Stack)

```yaml
# Promtail configuration
scrape_configs:
  - job_name: bridge-watch
    docker_sd_configs:
      - host: "unix:///var/run/docker.sock"
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        target_label: 'container'
```

## Request Tracing

Bridge Watch includes request tracing middleware that assigns a unique correlation ID to every request:

- **Header:** `X-Request-Id`
- **Propagated:** Through all service calls and log entries
- **Admin endpoint:** `/api/v1/admin/tracing` for trace inspection

### Tracing Configuration

Request tracing is enabled by default. The tracing middleware injects a `requestId` into every log entry, enabling end-to-end request tracking across services.

## Alerting

### Recommended Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| Service Down | `/health/ready` returns non-200 for > 1 min | Critical |
| High Memory | Memory usage > 85% for > 5 min | Warning |
| High Latency | API p95 latency > 2s for > 5 min | Warning |
| Database Connection Pool Exhausted | Available connections = 0 | Critical |
| Redis Disconnected | Redis health check fails | Critical |
| High Error Rate | 5xx rate > 1% for > 5 min | Warning |
| Bridge Health Degraded | Any bridge health score < 50 | Warning |
| Price Deviation | Asset price deviation > 5% | Warning |

### Prometheus AlertRules

```yaml
groups:
  - name: bridge-watch-alerts
    rules:
      - alert: BridgeWatchDown
        expr: up{job="bridge-watch-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Bridge Watch backend is down"

      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes{job="bridge-watch-backend"} > 450e6
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Bridge Watch memory usage is high"

      - alert: HighErrorRate
        expr: rate(http_requests_total{job="bridge-watch-backend",status=~"5.."}[5m]) > 0.01
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
```
