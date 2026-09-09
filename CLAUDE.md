# Project instructions

Read and follow [`AGENTS.md`](./AGENTS.md) before making any repository change. It is the authoritative project memory and engineering contract.

The non-negotiable workflow is test-first development: create a failing behavior test, implement the smallest change, refactor with tests green, then run `pnpm verify`. Run `pnpm test:e2e` for user-visible and integration-flow changes. Never report a check as passing unless it was actually executed.
