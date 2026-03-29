# Architecture Documentation

Comprehensive documentation of the Stellar Bridge Watch system architecture, including component interactions, data flows, and design decisions.

## Table of Contents

| Document | Description |
|----------|-------------|
| [System Overview](./system-overview.md) | High-level architecture and component descriptions |
| [Data Flow](./data-flow.md) | Data flow diagrams and processing pipelines |
| [API Architecture](./api-architecture.md) | Backend API design, routes, and middleware |
| [Frontend Architecture](./frontend-architecture.md) | React application structure and state management |
| [Contract Architecture](./contract-architecture.md) | Soroban smart contract design and modules |
| [Database Architecture](./database-architecture.md) | Schema design, TimescaleDB hypertables, and data model |
| [Integration Points](./integration-points.md) | External service integrations and data sources |
| [Security Architecture](./security-architecture.md) | Security model, authentication, and threat mitigation |
| [Scalability](./scalability.md) | Scaling strategies and performance considerations |
| [ADR Index](./decisions/) | Architecture Decision Records |

## Quick Reference

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Node.js 20+, TypeScript, Fastify | REST API, WebSocket, job processing |
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS | Dashboard and user interface |
| **Smart Contracts** | Soroban (Rust) | On-chain monitoring and verification |
| **Database** | PostgreSQL 15+ with TimescaleDB | Relational and time-series storage |
| **Cache** | Redis 7+ | Caching, rate limiting, job queues |
| **Job Queue** | BullMQ | Background task scheduling |
| **Containerization** | Docker, Docker Compose | Deployment and orchestration |
| **CI/CD** | GitHub Actions | Automated testing and deployment |

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         External Data Sources                       │
│  ┌──────────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │Stellar Horizon│  │Soroban   │  │Circle API │  │Ethereum RPC  │  │
│  │   API         │  │  RPC     │  │           │  │(Bridge Verify)│  │
│  └──────┬───────┘  └────┬─────┘  └─────┬─────┘  └──────┬───────┘  │
└─────────┼───────────────┼───────────────┼───────────────┼──────────┘
          │               │               │               │
          ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Backend (Fastify)                            │
│                                                                     │
│  ┌──────────────────┐  ┌───────────────────┐  ┌─────────────────┐  │
│  │   REST API       │  │  Background Jobs  │  │  WebSocket      │  │
│  │   Port 3001      │  │  (BullMQ Workers) │  │  Port 3002      │  │
│  └────────┬─────────┘  └────────┬──────────┘  └────────┬────────┘  │
│           │                     │                      │            │
│  ┌────────▼─────────────────────▼──────────────────────▼────────┐  │
│  │                    Services Layer                             │  │
│  │  ┌───────┐ ┌───────┐ ┌────────┐ ┌──────────┐ ┌───────────┐  │  │
│  │  │Health │ │Price  │ │Bridge  │ │Liquidity │ │Alert      │  │  │
│  │  │Service│ │Service│ │Service │ │Service   │ │Service    │  │  │
│  │  └───────┘ └───────┘ └────────┘ └──────────┘ └───────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────┬──────────────────────┬───────────────────────┘
                      │                      │
               ┌──────▼──────┐        ┌──────▼──────┐
               │ PostgreSQL  │        │   Redis     │
               │ TimescaleDB │        │   Cache     │
               │ Port 5432   │        │  Port 6379  │
               └─────────────┘        └─────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       Frontend (React 18)                           │
│                                                                     │
│  ┌───────────┐  ┌────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Dashboard │  │ Analytics  │  │ Bridge View  │  │  Settings  │  │
│  │           │  │            │  │              │  │            │  │
│  └───────────┘  └────────────┘  └──────────────┘  └────────────┘  │
│                                                                     │
│  State: Zustand + React Query    Styling: TailwindCSS               │
│  Charts: Recharts                Routing: React Router v6           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                   Soroban Smart Contracts (Rust)                    │
│                                                                     │
│  ┌──────────────────┐  ┌───────────────────────────────────────┐   │
│  │ Bridge Watch Core│  │ Transfer State Machine                │   │
│  │ - Asset Registry │  │ - Bridge transfer lifecycle           │   │
│  │ - Health Scores  │  │ - State: Initiated → Completed/Failed│   │
│  │ - Circuit Breaker│  │ - Audit trail logging                 │   │
│  │ - Alert System   │  │ - Escrow management                  │   │
│  └──────────────────┘  └───────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```
