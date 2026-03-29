# Prerequisites

This document lists all required tools, accounts, and system requirements for deploying Stellar Bridge Watch.

## System Requirements

### Minimum Requirements (Development)

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Disk | 10 GB | 20 GB |
| OS | Linux, macOS, Windows (WSL2) | Ubuntu 22.04+ / macOS 13+ |

### Minimum Requirements (Production)

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 4 cores | 8 cores |
| RAM | 8 GB | 16 GB |
| Disk | 50 GB SSD | 100 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| Network | 100 Mbps | 1 Gbps |

## Required Software

### Core Tools

| Tool | Minimum Version | Installation | Purpose |
|------|----------------|--------------|---------|
| Node.js | 20.0.0+ | [nodejs.org](https://nodejs.org) | Backend and frontend runtime |
| npm | 10.0.0+ | Bundled with Node.js | Package management |
| Docker | 24.0+ | [docs.docker.com](https://docs.docker.com/get-docker/) | Containerization |
| Docker Compose | 2.0+ | Bundled with Docker Desktop | Service orchestration |
| Git | 2.30+ | [git-scm.com](https://git-scm.com) | Version control |

### Optional Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Rust | Latest stable | Soroban smart contract compilation |
| `stellar-cli` | Latest | Stellar contract deployment |
| `kubectl` | 1.28+ | Kubernetes cluster management |
| `helm` | 3.12+ | Kubernetes package management |
| `make` | 3.80+ | Build automation (Makefile targets) |

### Install Node.js

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20

# Verify
node --version  # v20.x.x
npm --version   # 10.x.x
```

### Install Docker

```bash
# Ubuntu
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin

# Verify
docker --version         # Docker 24.x+
docker compose version   # Docker Compose 2.x+

# Add user to docker group (restart required)
sudo usermod -aG docker $USER
```

### Install Rust (Optional)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# Verify
rustc --version
cargo --version
```

### Install Kubernetes Tools (Optional)

```bash
# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install kubectl /usr/local/bin/

# Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verify
kubectl version --client
helm version
```

## Network Requirements

### Outbound Access

The following external services must be reachable from the deployment environment:

| Service | Endpoint | Port | Purpose |
|---------|----------|------|---------|
| Stellar Horizon | `horizon.stellar.org` | 443 | On-chain data |
| Soroban RPC | `soroban-rpc.stellar.org` | 443 | Smart contract interaction |
| Circle API | `api.circle.com` | 443 | USDC/EURC pricing |
| Coinbase API | `api.coinbase.com` | 443 | Price feeds |
| Docker Hub | `registry-1.docker.io` | 443 | Container images |
| npm Registry | `registry.npmjs.org` | 443 | Node.js packages |

### Internal Ports

| Port | Service | Protocol |
|------|---------|----------|
| 3001 | Backend API | HTTP |
| 3002 | WebSocket Server | WS |
| 5173 | Frontend Dev Server | HTTP |
| 80 | Frontend Production (Nginx) | HTTP |
| 5432 | PostgreSQL | TCP |
| 6379 | Redis | TCP |
| 5050 | PgAdmin (optional) | HTTP |
| 8081 | Redis Commander (optional) | HTTP |

## Accounts and API Keys

### Required

| Service | Purpose | How to Obtain |
|---------|---------|---------------|
| Stellar Network | Blockchain data access | No API key needed for public Horizon |

### Recommended for Production

| Service | Purpose | How to Obtain |
|---------|---------|---------------|
| Circle API | USDC/EURC reserve data | [circle.com/developers](https://www.circle.com/developers) |
| Ethereum RPC | Bridge contract verification | [Alchemy](https://www.alchemy.com) or [Infura](https://www.infura.io) |
| SMTP Service | Alert email delivery | SendGrid, AWS SES, or similar |

## Pre-deployment Checklist

- [ ] All required software installed and at minimum versions
- [ ] Docker daemon running (`docker info`)
- [ ] Sufficient disk space available
- [ ] Required ports are not in use
- [ ] Outbound network access to external services verified
- [ ] API keys obtained for production integrations
- [ ] `.env` file created from `.env.example`
- [ ] Git repository cloned with all submodules
