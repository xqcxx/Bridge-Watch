# Integration Points

External service integrations and data source connections for Stellar Bridge Watch.

## Overview

Bridge Watch integrates with multiple external systems to collect, verify, and enrich monitoring data:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Bridge Watch Backend                        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Integration Layer                       │  │
│  │                                                           │  │
│  │  ┌──────────────┐  ┌─────────────┐  ┌─────────────────┐  │  │
│  │  │stellar/      │  │ethereum/    │  │sources/         │  │  │
│  │  │  horizon.ts  │  │  bridge.ts  │  │  circle.ts      │  │  │
│  │  │  soroban.ts  │  │             │  │  coinbase.ts    │  │  │
│  │  └──────────────┘  └─────────────┘  └─────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                    │                     │
         ▼                    ▼                     ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐
│ Stellar Network│  │ Ethereum       │  │ Price Data Providers   │
│                │  │                │  │                        │
│ • Horizon API  │  │ • JSON-RPC    │  │ • Circle API           │
│ • Soroban RPC  │  │ • Bridge      │  │ • Coinbase API         │
│ • SDEX         │  │   Contracts   │  │ • Exchange APIs        │
└────────────────┘  └────────────────┘  └────────────────────────┘
```

## Stellar Network Integration

### Horizon API

| Property | Value |
|----------|-------|
| **Endpoint** | `https://horizon.stellar.org` (mainnet) |
| **SDK** | `@stellar/stellar-sdk` |
| **Config** | `STELLAR_HORIZON_URL` environment variable |

**Data collected:**
- Asset metadata and issuer information
- SDEX (Stellar Decentralized Exchange) order book and trades
- Account balances for reserve verification
- Transaction history for bridge activity tracking
- Trust line data for asset distribution

### Soroban RPC

| Property | Value |
|----------|-------|
| **Endpoint** | `https://soroban-rpc.stellar.org` (mainnet) |
| **Config** | `SOROBAN_RPC_URL` environment variable |

**Data collected:**
- Smart contract state queries
- Contract event logs
- Soroban DEX liquidity data
- Bridge contract interactions

## Ethereum Integration

### Bridge Contract Verification

| Property | Value |
|----------|-------|
| **SDK** | `ethers.js` |
| **Config** | `ETHEREUM_RPC_URL` environment variable |
| **Providers** | Alchemy, Infura, or self-hosted node |

**Data collected:**
- Bridge contract state (locked funds, minting records)
- Cross-chain reserve backing verification
- Bridge operator activity monitoring
- Mint/burn event logs

**Verification flow:**
1. Query Stellar for minted supply of bridged asset
2. Query Ethereum bridge contract for locked reserves
3. Compare values — flag mismatch if `reserves < minted_supply`
4. Store result in `verification_results` hypertable

## Price Data Sources

### Circle API

| Property | Value |
|----------|-------|
| **Endpoint** | `https://api.circle.com` |
| **Config** | `CIRCLE_API_KEY`, `CIRCLE_API_TIMEOUT` (default: 5000ms) |
| **Assets** | USDC, EURC |

**Data collected:**
- Official USDC and EURC pricing
- Reserve attestation reports
- Minting/burning activity

### Coinbase API

| Property | Value |
|----------|-------|
| **Endpoint** | `https://api.coinbase.com` |
| **Assets** | XLM, USDC, and other listed assets |

**Data collected:**
- Exchange price data
- 24-hour volume
- Price change metrics

### Stellar DEX

| Property | Value |
|----------|-------|
| **Source** | Stellar Horizon API order book endpoints |
| **Assets** | All monitored Stellar assets |

**Data collected:**
- SDEX order book depth
- Recent trade prices
- Volume-weighted average price (VWAP)

## DEX Liquidity Sources

Bridge Watch aggregates liquidity across multiple Stellar DEXes:

| DEX | Integration Method | Data Collected |
|-----|-------------------|----------------|
| **SDEX** | Horizon API | Order book depth, trade history |
| **StellarX AMM** | Horizon API | AMM pool sizes, swap rates |
| **Phoenix DEX** | DEX-specific API | Liquidity pools, volume |
| **LumenSwap** | DEX-specific API | Pool sizes, trading pairs |
| **Soroswap** | Soroban RPC | Smart contract pool state |

## Integration Patterns

### Retry Strategy

All external API calls use exponential backoff:

```
Attempt 1: immediate
Attempt 2: 1s delay
Attempt 3: 2s delay
Attempt 4: 4s delay (max)
```

### Circuit Breaker Pattern

External integrations are protected by circuit breakers:
- **Closed** (normal) — Requests pass through
- **Open** (failure detected) — Requests fail fast, no external calls
- **Half-open** (testing recovery) — Limited requests to check if service recovered

### Caching Strategy

| Data Source | Cache TTL | Cache Location |
|-------------|-----------|----------------|
| Price data | 30 seconds | Redis |
| Asset metadata | 5 minutes | Redis |
| Liquidity depth | 60 seconds | Redis |
| Health scores | 60 seconds | Redis |
| Bridge status | 30 seconds | Redis |

### Timeout Configuration

| Integration | Default Timeout | Config Variable |
|-------------|----------------|-----------------|
| Stellar Horizon | 10s | — |
| Soroban RPC | 10s | — |
| Circle API | 5s | `CIRCLE_API_TIMEOUT` |
| Ethereum RPC | 10s | — |
| Coinbase API | 5s | — |

## Data Freshness

| Data Type | Update Frequency | Source |
|-----------|-----------------|--------|
| Prices | Real-time (15-30s) | Multiple sources aggregated |
| Health scores | Every 60 seconds | Computed from latest data |
| Liquidity depth | Every 60 seconds | DEX API polling |
| Bridge status | Every 30 seconds | Blockchain polling |
| Reserve verification | Every 5 minutes | Cross-chain comparison |

## Error Handling

When external integrations fail:

1. **Cached data** is served if available and within TTL
2. **Partial data** is returned with a degraded status indicator
3. **Circuit breaker** opens after repeated failures
4. **Alert events** are created for monitoring team notification
5. **Health check** reports external dependency as degraded
