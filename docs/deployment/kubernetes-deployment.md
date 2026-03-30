# Kubernetes Deployment Guide

This guide covers deploying Stellar Bridge Watch to a Kubernetes cluster with production-grade configuration.

## Prerequisites

- Kubernetes cluster (1.28+)
- `kubectl` configured with cluster access
- Container registry for images (Docker Hub, GHCR, ECR, etc.)
- `helm` (optional, for dependency charts)

## Namespace Setup

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: bridge-watch
  labels:
    app: bridge-watch
    environment: production
```

```bash
kubectl apply -f k8s/namespace.yaml
```

## Secrets and ConfigMaps

### Secrets

```bash
# Create secrets from command line
kubectl create secret generic bridge-watch-secrets \
  --namespace bridge-watch \
  --from-literal=postgres-host=bridge-watch-postgres.bridge-watch.svc.cluster.local \
  --from-literal=postgres-password=$(openssl rand -base64 32) \
  --from-literal=redis-password=$(openssl rand -base64 32) \
  --from-literal=circle-api-key=<your-circle-api-key>
```

```yaml
# k8s/secrets.yaml (base64-encoded values)
apiVersion: v1
kind: Secret
metadata:
  name: bridge-watch-secrets
  namespace: bridge-watch
type: Opaque
data:
  postgres-host: <base64-encoded>
  postgres-password: <base64-encoded>
  redis-password: <base64-encoded>
  circle-api-key: <base64-encoded>
```

### ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: bridge-watch-config
  namespace: bridge-watch
data:
  NODE_ENV: "production"
  PORT: "3001"
  WS_PORT: "3002"
  POSTGRES_PORT: "5432"
  POSTGRES_DB: "bridge_watch"
  POSTGRES_USER: "bridge_watch"
  REDIS_HOST: "bridge-watch-redis.bridge-watch.svc.cluster.local"
  REDIS_PORT: "6379"
  RATE_LIMIT_MAX: "200"
  HEALTH_CHECK_TIMEOUT_MS: "5000"
  HEALTH_CHECK_MEMORY_THRESHOLD: "85"
  LOG_LEVEL: "warn"
```

```bash
kubectl apply -f k8s/configmap.yaml
```

## Backend Deployment

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bridge-watch-backend
  namespace: bridge-watch
  labels:
    app: bridge-watch
    component: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bridge-watch
      component: backend
  template:
    metadata:
      labels:
        app: bridge-watch
        component: backend
    spec:
      containers:
      - name: backend
        image: <your-registry>/bridge-watch-backend:latest
        ports:
        - containerPort: 3001
          name: http
        - containerPort: 3002
          name: websocket
        envFrom:
        - configMapRef:
            name: bridge-watch-config
        env:
        - name: POSTGRES_HOST
          valueFrom:
            secretKeyRef:
              name: bridge-watch-secrets
              key: postgres-host
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: bridge-watch-secrets
              key: postgres-password
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: bridge-watch-secrets
              key: redis-password

        livenessProbe:
          httpGet:
            path: /health/live
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3

        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3

        startupProbe:
          httpGet:
            path: /health/live
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 30  # Allow up to 150s for startup

        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: bridge-watch-backend
  namespace: bridge-watch
spec:
  selector:
    app: bridge-watch
    component: backend
  ports:
  - name: http
    port: 3001
    targetPort: 3001
  - name: websocket
    port: 3002
    targetPort: 3002
  type: ClusterIP
```

## Frontend Deployment

```yaml
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bridge-watch-frontend
  namespace: bridge-watch
  labels:
    app: bridge-watch
    component: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: bridge-watch
      component: frontend
  template:
    metadata:
      labels:
        app: bridge-watch
        component: frontend
    spec:
      containers:
      - name: frontend
        image: <your-registry>/bridge-watch-frontend:latest
        ports:
        - containerPort: 80
          name: http

        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 10

        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5

        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
---
apiVersion: v1
kind: Service
metadata:
  name: bridge-watch-frontend
  namespace: bridge-watch
spec:
  selector:
    app: bridge-watch
    component: frontend
  ports:
  - name: http
    port: 80
    targetPort: 80
  type: ClusterIP
```

## PostgreSQL Deployment

For production, consider using a managed database service (AWS RDS, GCP Cloud SQL, Azure Database). For self-managed deployments:

```yaml
# k8s/postgres-deployment.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: bridge-watch-postgres
  namespace: bridge-watch
spec:
  serviceName: bridge-watch-postgres
  replicas: 1
  selector:
    matchLabels:
      app: bridge-watch
      component: postgres
  template:
    metadata:
      labels:
        app: bridge-watch
        component: postgres
    spec:
      containers:
      - name: postgres
        image: timescale/timescaledb:latest-pg15
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: "bridge_watch"
        - name: POSTGRES_USER
          value: "bridge_watch"
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: bridge-watch-secrets
              key: postgres-password
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data

        livenessProbe:
          exec:
            command: ["pg_isready", "-U", "bridge_watch"]
          initialDelaySeconds: 30
          periodSeconds: 10

        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"

  volumeClaimTemplates:
  - metadata:
      name: postgres-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 50Gi
---
apiVersion: v1
kind: Service
metadata:
  name: bridge-watch-postgres
  namespace: bridge-watch
spec:
  selector:
    app: bridge-watch
    component: postgres
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
```

## Redis Deployment

```yaml
# k8s/redis-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bridge-watch-redis
  namespace: bridge-watch
spec:
  replicas: 1
  selector:
    matchLabels:
      app: bridge-watch
      component: redis
  template:
    metadata:
      labels:
        app: bridge-watch
        component: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        command: ["redis-server", "--requirepass", "$(REDIS_PASSWORD)"]
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: bridge-watch-secrets
              key: redis-password

        livenessProbe:
          exec:
            command: ["redis-cli", "ping"]
          initialDelaySeconds: 10
          periodSeconds: 10

        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: bridge-watch-redis
  namespace: bridge-watch
spec:
  selector:
    app: bridge-watch
    component: redis
  ports:
  - port: 6379
    targetPort: 6379
  type: ClusterIP
```

## Ingress Configuration

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: bridge-watch-ingress
  namespace: bridge-watch
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/websocket-services: "bridge-watch-backend"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - bridgewatch.dev
    - api.bridgewatch.dev
    secretName: bridge-watch-tls
  rules:
  - host: bridgewatch.dev
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: bridge-watch-frontend
            port:
              number: 80
  - host: api.bridgewatch.dev
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: bridge-watch-backend
            port:
              number: 3001
      - path: /api/v1/ws
        pathType: Prefix
        backend:
          service:
            name: bridge-watch-backend
            port:
              number: 3002
```

## Autoscaling

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: bridge-watch-backend-hpa
  namespace: bridge-watch
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: bridge-watch-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Pod Disruption Budget

```yaml
# k8s/pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: bridge-watch-pdb
  namespace: bridge-watch
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: bridge-watch
      component: backend
```

## Network Policies

```yaml
# k8s/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: bridge-watch-backend-policy
  namespace: bridge-watch
spec:
  podSelector:
    matchLabels:
      app: bridge-watch
      component: backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: bridge-watch
          component: frontend
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - port: 3001
    - port: 3002
  egress:
  - to:
    - podSelector:
        matchLabels:
          component: postgres
    ports:
    - port: 5432
  - to:
    - podSelector:
        matchLabels:
          component: redis
    ports:
    - port: 6379
  - to:  # Allow external API access
    - ipBlock:
        cidr: 0.0.0.0/0
        except:
        - 10.0.0.0/8
        - 172.16.0.0/12
        - 192.168.0.0/16
    ports:
    - port: 443
```

## Monitoring with ServiceMonitor

```yaml
# k8s/service-monitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: bridge-watch-monitor
  namespace: bridge-watch
  labels:
    app: bridge-watch
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

## Deployment Steps

### 1. Build and Push Images

```bash
# Build images
docker compose build

# Tag images
docker tag bridge-watch-backend:latest <registry>/bridge-watch-backend:v1.0.0
docker tag bridge-watch-frontend:latest <registry>/bridge-watch-frontend:v1.0.0

# Push images
docker push <registry>/bridge-watch-backend:v1.0.0
docker push <registry>/bridge-watch-frontend:v1.0.0
```

### 2. Apply Kubernetes Resources

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets and config
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml

# Deploy data stores
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml

# Wait for data stores to be ready
kubectl wait --for=condition=ready pod -l component=postgres -n bridge-watch --timeout=120s
kubectl wait --for=condition=ready pod -l component=redis -n bridge-watch --timeout=60s

# Deploy application
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Run migrations (one-time)
kubectl exec -it deploy/bridge-watch-backend -n bridge-watch -- npm run migrate

# Apply ingress and policies
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/pdb.yaml
kubectl apply -f k8s/network-policy.yaml
```

### 3. Verify Deployment

```bash
# Check pod status
kubectl get pods -n bridge-watch

# Check services
kubectl get svc -n bridge-watch

# Check ingress
kubectl get ingress -n bridge-watch

# Test health endpoint
kubectl exec -it deploy/bridge-watch-backend -n bridge-watch -- \
  wget -qO- http://localhost:3001/health/detailed

# View logs
kubectl logs -l component=backend -n bridge-watch --tail=50
```

## Rolling Updates

```bash
# Update backend image
kubectl set image deployment/bridge-watch-backend \
  backend=<registry>/bridge-watch-backend:v1.1.0 \
  -n bridge-watch

# Monitor rollout
kubectl rollout status deployment/bridge-watch-backend -n bridge-watch

# Rollback if needed
kubectl rollout undo deployment/bridge-watch-backend -n bridge-watch
```
