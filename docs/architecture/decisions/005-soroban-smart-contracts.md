# ADR-005: Use Soroban for Smart Contract Components

## Status

Accepted

## Context

Bridge Watch monitors cross-chain bridge operations and needs on-chain components for trustless verification: a circuit breaker contract that can pause bridge operations during anomalies, fee distribution logic, insurance pool management, and time-locked escrow for pending transfers. The platform primarily monitors bridges on the Stellar network.

Options considered:
1. **Solidity (EVM)** — Deploy on Ethereum or EVM-compatible chains
2. **Soroban (Rust)** — Stellar's native smart contract platform
3. **No on-chain components** — Keep all logic off-chain in the backend

## Decision

Use **Soroban** (Stellar's smart contract platform) with **Rust** for all on-chain components.

## Consequences

### Positive

- **Native Stellar integration:** Soroban runs natively on Stellar, the primary blockchain monitored by Bridge Watch. No bridging or cross-chain calls needed.
- **Rust safety:** Memory safety, no null pointer exceptions, strong type system, and pattern matching reduce smart contract bugs.
- **Predictable fees:** Stellar's fee model is more predictable and lower cost than Ethereum gas fees.
- **WASM execution:** Contracts compile to WebAssembly (wasm32-unknown-unknown), benefiting from the WASM ecosystem and tooling.
- **State machine pattern:** Rust's enum and match expressions naturally model the transfer state machine (12 states with validated transitions).
- **Soroban SDK:** Provides contract macros, storage abstractions, and testing utilities.

### Negative

- **Smaller ecosystem:** Soroban is newer than Solidity with fewer libraries, auditors, and developer tools.
- **Stellar-specific:** Contracts only run on Stellar/Soroban, unlike Solidity which targets many EVM chains.
- **Learning curve:** Rust has a steeper learning curve than Solidity for new contributors.

### Neutral

- Contract crates are organized in `/contracts/` with separate crates: `soroban/` (core contract modules) and `transfer_state_machine/` (state machine logic).
- The `soroban/src/` directory contains focused modules: `circuit_breaker.rs`, `fee_distribution.rs`, `governance.rs`, `insurance_pool.rs`, `time_locked_escrow.rs`, and `price_oracle.rs`.
- Test snapshots in `test_snapshots/` provide deterministic testing of contract behavior.
