# Load Balancer Configuration

This guide covers load balancer and reverse proxy configuration for Stellar Bridge Watch.

## Overview

Bridge Watch uses Nginx as the default reverse proxy in production. The frontend container includes a pre-configured Nginx instance that handles:

- Static asset serving with cache headers
- API request proxying to the backend
- WebSocket connection upgrades
- SPA routing fallback

For multi-instance deployments, an external load balancer sits in front of multiple frontend/backend instances.

## Built-in Nginx Configuration

The frontend production container includes Nginx routing configured in `frontend/nginx.conf`:

```
Client Request
      │
      ▼
┌─────────────────────┐
│   Nginx (Frontend)  │
│                     │
│  /api/v1/ws  ──────►│──► Backend :3002 (WebSocket)
│  /api/*      ──────►│──► Backend :3001 (REST API)
│  Static files ─────►│──► Local cache (1 year)
│  All other   ──────►│──► index.html (SPA fallback)
└─────────────────────┘
```

### Key Routing Rules

| Path | Target | Configuration |
|------|--------|---------------|
| `/api/v1/ws` | `backend:3002` | WebSocket upgrade, 3600s timeout |
| `/api/*` | `backend:3001` | Proxy with forwarded headers |
| `*.js`, `*.css`, `*.woff2` | Local files | Cache: 1 year, immutable |
| `/*` | `index.html` | SPA fallback, no cache |

## External Load Balancer

### Cloud Load Balancers

For cloud deployments, use the provider's managed load balancer:

| Provider | Service | Recommended Type |
|----------|---------|-----------------|
| AWS | Application Load Balancer (ALB) | Layer 7 with WebSocket support |
| GCP | Cloud Load Balancing | HTTP(S) with WebSocket |
| Azure | Application Gateway | Layer 7 with WebSocket |
| DigitalOcean | Load Balancer | HTTP with WebSocket |

### Configuration Requirements

Any load balancer in front of Bridge Watch must support:

1. **WebSocket connections** — The `/api/v1/ws` path requires HTTP upgrade to WebSocket
2. **Health checks** — Use `GET /health/ready` on port 3001 for backend health
3. **Sticky sessions** — Not required (the API is stateless)
4. **SSL termination** — Terminate SSL at the load balancer (see [SSL/TLS Setup](./ssl-tls-setup.md))
5. **Forwarded headers** — Pass `X-Forwarded-For`, `X-Forwarded-Proto`, `X-Real-IP`

### AWS ALB Example

```yaml
# Terraform/CloudFormation-style configuration
Target Groups:
  - Name: bridge-watch-api
    Port: 3001
    Protocol: HTTP
    HealthCheck:
      Path: /health/ready
      Port: 3001
      Interval: 10s
      HealthyThreshold: 2
      UnhealthyThreshold: 3

  - Name: bridge-watch-ws
    Port: 3002
    Protocol: HTTP
    HealthCheck:
      Path: /health/live
      Port: 3001
      Interval: 10s

  - Name: bridge-watch-frontend
    Port: 80
    Protocol: HTTP
    HealthCheck:
      Path: /
      Port: 80
      Interval: 30s

Listener Rules:
  - HTTPS:443
    - Host: api.bridgewatch.dev, Path: /api/v1/ws → bridge-watch-ws
    - Host: api.bridgewatch.dev, Path: /api/* → bridge-watch-api
    - Host: bridgewatch.dev → bridge-watch-frontend
```

### Nginx External Load Balancer

For self-managed deployments with multiple backend instances:

```nginx
upstream backend_api {
    least_conn;
    server backend-1:3001;
    server backend-2:3001;
    server backend-3:3001;
}

upstream backend_ws {
    # IP hash for WebSocket session affinity
    ip_hash;
    server backend-1:3002;
    server backend-2:3002;
    server backend-3:3002;
}

upstream frontend {
    server frontend-1:80;
    server frontend-2:80;
}

server {
    listen 443 ssl;
    server_name api.bridgewatch.dev;

    # SSL configuration (see ssl-tls-setup.md)

    location /api/v1/ws {
        proxy_pass http://backend_ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    location /api/ {
        proxy_pass http://backend_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://backend_api;
    }
}

server {
    listen 443 ssl;
    server_name bridgewatch.dev;

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Health Check Endpoints

Bridge Watch provides dedicated health check endpoints optimized for load balancer probes:

| Endpoint | Purpose | Use For |
|----------|---------|---------|
| `GET /health` | Basic alive check | Simple health probes |
| `GET /health/live` | Kubernetes liveness | Liveness probe |
| `GET /health/ready` | Dependency readiness | Readiness probe / LB health check |
| `GET /health/detailed` | Full system health | Monitoring dashboards |
| `GET /health/metrics` | Prometheus metrics | Metrics scraping |

### Recommended Health Check Configuration

```
Path:        /health/ready
Port:        3001
Interval:    10 seconds
Timeout:     5 seconds
Healthy:     2 consecutive successes
Unhealthy:   3 consecutive failures
```

## Rate Limiting

The backend includes built-in sliding-window rate limiting:

- **Default:** 100 requests per minute per IP
- **Burst:** 2x multiplier for short bursts
- **Configurable via:** `RATE_LIMIT_MAX` and `RATE_LIMIT_BURST_MULTIPLIER` environment variables

When using an external load balancer, ensure the `X-Forwarded-For` header is passed correctly so rate limiting applies to the original client IP, not the load balancer IP.
