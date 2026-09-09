# AI Engineering Contract

This file is the persistent project memory for every AI coding session. These rules are mandatory for all repository changes, including small fixes.

## Product context

- This repository is a production image-recognition product built with Next.js, React, and TypeScript.
- Reliability, privacy, deterministic behavior, and clear error handling take priority over delivery speed.
- Never expose uploaded images, prompts, credentials, API keys, personal data, or provider responses in logs, fixtures, snapshots, or commits.

## Session preflight

Before changing executable code, read `README.md` and the relevant implementation, tests, types, and call sites. For product work, also read `AGENT_HANDOFF.md` and, when present, `PROJECT_CONTEXT.md`, `CURRENT_STATE.md`, `DECISIONS.md`, `TASKS.md`, and `HANDOFF.md`.

- Treat the latest project context and decisions as the source of truth; historical migration materials are reference-only and must be revalidated.
- The historical migration package is an evaluation asset, not a product-spec
  override. Reuse its candidate dimensions, evidence references, Good/Bad
  cases, and failure lessons through `docs/migration-vision-evaluation.md`.
  Do not reintroduce AI-origin conclusions, a fixed issue count, or legacy
  model routes without a new reproducible validation.
- If a required context file is missing, state that fact before relying on assumptions.
- Do not claim an AI model capability is validated until a real, reproducible provider call against an in-scope image has been recorded without exposing the image or provider response.

## Required workflow: test first

For every behavior change, follow this order:

1. Read the relevant implementation, existing tests, types, call sites, and configuration before editing.
2. Translate the request into observable acceptance criteria and identify failure, boundary, security, and regression cases.
3. Add or update an automated test that expresses the requested behavior. Run it and confirm it fails for the expected reason (red).
4. Make the smallest production-code change that makes the test pass (green).
5. Refactor only while the tests remain green.
6. Run the narrow test during development, then run `pnpm verify`. Run `pnpm test:e2e` when a user-visible flow, routing, browser interaction, upload flow, or integration boundary changes.
7. Report exactly which checks ran and any check that could not run. Never claim a check passed without executing it.

Tests may be omitted only for documentation/comment-only, formatting-only, or non-executable asset changes. State the reason explicitly. Do not weaken, skip, delete, or rewrite a valid test merely to make a change pass.

## Testing standards

- Unit/integration tests: Vitest. UI tests: Testing Library. Browser journeys: Playwright.
- Co-locate unit tests as `*.test.ts` or `*.test.tsx`. Put browser tests in `e2e/*.spec.ts`.
- Prefer behavior and public interfaces over implementation details. Tests must be deterministic and isolated; never depend on execution order, real time, randomness, the public internet, or live paid services.
- Mock at external boundaries (AI providers, storage, payment, email, database, clock), not inside the behavior under test.
- Every bug fix requires a regression test that fails on the old behavior.
- For image-recognition logic, cover valid files, unsupported types, size/dimension limits, malformed input, provider timeout/error, low-confidence or empty results, and sensitive-data handling as applicable.
- Do not use snapshots as the only assertion for important behavior. Assert status, structured output, side effects, and error states explicitly.
- New or substantially changed code should maintain at least 80% line, function, branch, and statement coverage in the affected module. Coverage is a signal, not permission to write weak tests.

## Change discipline

- Preserve existing user changes and unrelated work. Do not perform destructive Git or filesystem operations without explicit authorization.
- Keep changes small and scoped. Avoid unrelated dependency upgrades or refactors.
- Validate inputs at trust boundaries and return actionable, non-sensitive errors. Add timeouts and controlled failure behavior around external services.
- Use strict TypeScript; do not introduce `any`, unsafe casts, disabled lint rules, or swallowed errors without a documented reason.
- Update README or relevant docs whenever setup, commands, environment variables, behavior, or architecture changes.
- Before finishing, inspect the final diff for accidental secrets, generated files, debug code, skipped tests, and scope creep.

## Definition of done

A code change is complete only when acceptance criteria are met, tests were written first, relevant automated checks pass, documentation is current, and remaining risks or unverified external dependencies are disclosed.
