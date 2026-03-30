# SSL/TLS Setup

This guide covers configuring HTTPS and secure communication for Stellar Bridge Watch deployments.

## Overview

SSL/TLS is essential for securing:
- Client-to-frontend communication (HTTPS)
- Client-to-API communication (HTTPS)
- WebSocket connections (WSS)
- Internal service communication (optional, for zero-trust environments)

## Docker Compose with Let's Encrypt

### Using Nginx Reverse Proxy

Add an Nginx reverse proxy with automatic certificate management using [certbot](https://certbot.eff.org/):

```yaml
# docker-compose.ssl.yml (override file)
services:
  nginx-proxy:
    image: nginx:1.27-alpine
    container_name: bridge-watch-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/proxy.conf:/etc/nginx/conf.d/default.conf:ro
      - certbot_certs:/etc/letsencrypt:ro
      - certbot_www:/var/www/certbot:ro
    depends_on:
      - frontend
      - backend
    networks:
      - bridge-watch

  certbot:
    image: certbot/certbot
    container_name: bridge-watch-certbot
    volumes:
      - certbot_certs:/etc/letsencrypt
      - certbot_www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    networks:
      - bridge-watch

volumes:
  certbot_certs:
  certbot_www:
```

### Nginx Proxy Configuration

```nginx
# nginx/proxy.conf
server {
    listen 80;
    server_name bridgewatch.dev api.bridgewatch.dev;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name bridgewatch.dev;

    ssl_certificate /etc/letsencrypt/live/bridgewatch.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bridgewatch.dev/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl;
    server_name api.bridgewatch.dev;

    ssl_certificate /etc/letsencrypt/live/api.bridgewatch.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.bridgewatch.dev/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # API routes
    location /api/ {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /api/v1/ws {
        proxy_pass http://backend:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # Health check (no SSL required internally)
    location /health {
        proxy_pass http://backend:3001;
    }
}
```

### Obtain Certificates

```bash
# Initial certificate generation
docker compose -f docker-compose.yml -f docker-compose.ssl.yml run --rm certbot \
  certonly --webroot \
  --webroot-path=/var/www/certbot \
  -d bridgewatch.dev \
  -d api.bridgewatch.dev \
  --email admin@bridgewatch.dev \
  --agree-tos \
  --no-eff-email

# Start services with SSL
docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d
```

Certificates auto-renew every 12 hours via the certbot container.

## Kubernetes with cert-manager

### Install cert-manager

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

### ClusterIssuer for Let's Encrypt

```yaml
# k8s/cluster-issuer.yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@bridgewatch.dev
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
    - http01:
        ingress:
          class: nginx
```

### TLS in Ingress

```yaml
# Included in the Ingress configuration (see kubernetes-deployment.md)
spec:
  tls:
  - hosts:
    - bridgewatch.dev
    - api.bridgewatch.dev
    secretName: bridge-watch-tls
```

cert-manager automatically provisions and renews certificates when the `cert-manager.io/cluster-issuer` annotation is present on the Ingress resource.

## Self-Signed Certificates (Development/Testing)

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout ./certs/privkey.pem \
  -out ./certs/fullchain.pem \
  -subj "/CN=localhost"
```

## Security Best Practices

1. **Minimum TLS 1.2** — Disable TLS 1.0 and 1.1.
2. **HSTS headers** — Enable HTTP Strict Transport Security with a long `max-age`.
3. **Redirect HTTP to HTTPS** — All HTTP traffic should redirect to HTTPS.
4. **Certificate monitoring** — Set alerts for certificates expiring within 14 days.
5. **Private keys** — Store private keys securely, never commit to version control.
6. **Internal encryption** — Consider mTLS for internal service communication in zero-trust environments.
