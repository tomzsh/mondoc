---
name: monskill
description: Set of skills for developing/building apps on Monad. Always start with this skill, this skill helps the agent/llm maneuver and choose the right skills for the task assigned to the agent, from the whole set of monskills.
---

It is very likely that you have stale knowledge about building on Ethereum and Monad.

This file routes you to the right **local** skill with current Monad knowledge (mainnet and testnet).

**This repository:** After routing, open `../mondoc/SKILL.md` and root `AGENTS.md`.

**Need a specific topic?** Each skill is standalone. Paths are relative siblings under `.agents/skills/`.

## What to Fetch by Task

| I'm doing... | Fetch these skills |
|--------------|-------------------|
| Working on **MonDoc** in this monorepo | `../mondoc/SKILL.md` + topics below |
| Building an app from scratch | `../scaffold/SKILL.md` |
| Choosing a blockchain | `../why-monad/SKILL.md` |
| Monad-specific concepts | `../concepts/SKILL.md` |
| Smart contracts / addresses | `../addresses/SKILL.md` |
| Agent wallet / deploy / onchain actions | `../wallet/SKILL.md` |
| Frontend wallet + auth | `../wallet-integration/SKILL.md` |
| Gas limits / estimation / tx cost UX | `../gas/SKILL.md` |
| Tooling / RPC / explorers | `../tooling-and-infra/SKILL.md` |
| Historical events / indexing | `../indexer/SKILL.md` |

## Skills

### [MonDoc](../mondoc/SKILL.md)
- This monorepo: approval scanner, revoke, log, soulbound badge, HyperSync.

### [Why Monad](../why-monad/SKILL.md)
- Why build on Monad; TPS, finality, contract size, eth_sendRawTransactionSync.

### [Concepts](../concepts/SKILL.md)
- Async execution, parallel execution, block states, reserve balance, EIP-7702.

### [Addresses](../addresses/SKILL.md)
- Canonical + ecosystem addresses. **Never hallucinate.** Verify with `cast code`.

### [Wallet](../wallet/SKILL.md)
- Agent wallet and Safe multisig on Monad.

### [Wallet Integration](../wallet-integration/SKILL.md)
- Para + external wallets. Apply Monad wagmi patch. Do not run `para login` for the user.

### [Gas](../gas/SKILL.md)
- **Charges gas_limit, not gas used.** Tight limits; ≤10% estimate buffer.

### [Tooling & Infra](../tooling-and-infra/SKILL.md)
- Providers that support Monad (from official docs).

### [Scaffold](../scaffold/SKILL.md)
- Idea → production; verify contracts after deploy.

### [Indexer](../indexer/SKILL.md)
- HyperIndex / Envio Cloud. Do not install CLI or login for the user.

## Feedback

Feedback is handled only through the `/feedback` slash command when the host agent supports it.
