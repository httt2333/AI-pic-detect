# Tasks

## Completed P0 front end

- [x] Replace the public ShipAny landing experience with AI-PIC-DETECT P0.
- [x] Add single-image format and size validation.
- [x] Add centralized mock analysis response and confidence filtering.
- [x] Add analysing, no-issue, unsupported, failure, retry, and success UI.
- [x] Add bidirectional issue-list and normalized bbox selection.
- [x] Align normalized bbox markers to the actual displayed image frame.
- [x] Add sequential next-item navigation and a local ignore decision.
- [x] Add Vitest and Testing Library coverage for the core workflow.
- [x] Complete the P0 UI convergence pass: stronger result workspace, unified
      “修改优先级” language, concise detail copy, recoverable empty/error/file
      states, original hero scan example, and removal of public ShipAny
      metadata and commercial entry points.
- [x] Add a provisional A/B/C 17-dimension check-state panel. It supports
      verified `dim_id` to bbox navigation without implying that every
      dimension is an error or every result has three issues.
- [x] Separate retryable `timeout` and `analysis_failed` states in the client
      workflow and cover them with unit and browser tests.
- [x] Move the A/B/C state summary into a full-width “详细检查报告” below the
      image-and-current-issue row so the image panel is not stretched.
- [x] Keep credit entry points on the Chinese route, add a same-tab return path,
      and avoid account/database reads while checkout is disabled.

## Pending, requiring in-scope backend or environment work

- [ ] In a normal local terminal, complete final runtime acceptance in order:
      `pnpm install --frozen-lockfile`, `pnpm verify`, `pnpm test:e2e`, and
      `pnpm dev`. The restricted Agent environment passed TypeScript but cannot
      restore dependencies or spawn the child processes required for the other
      checks; do not retry those operations there.
- [ ] Replace the mock executor with a real, privacy-reviewed analysis API.
- [ ] Agree the versioned API shape for validated dimension states and `dim_id`
      links before replacing the mock executor. The browser must never consume
      raw provider output or temporary upload URLs.
- [ ] Agree the final visual-model category taxonomy after reproducible image
      testing; keep the current taxonomy provisional until then.
- [ ] Create annotated Good/Bad API cases from the approved historical
      candidate pool, starting with hand, eye, hair, body structure, boundary
      overlap, penetration, and accessory details.
- [x] Create a private, sanitized migration-corpus index pipeline and typed
      historical dimension map without exposing the original corpus.
- [ ] Define API authentication, timeout, response versioning, and server-side
      image retention/deletion guarantees.
- [x] Install Playwright Chromium and run the browser journey.
- [ ] Add an API integration test once the backend contract is available.

The main product remains paused at the mock/fallback boundary until the Harness
has produced reproducible real-Provider validation. Do not add a Provider,
`/api/analyze` implementation, or object-storage dependency before that result.

## Approved P1 commercial shell

- [x] Map the template pricing surface to one-time CNY packs (10/50/200),
      with 50 marked as recommended and all price fields configurable.
- [x] Keep purchase buttons disabled while the payment provider and formal
      price configuration are unavailable.
- [x] Add public entry points for sign-in, review history, credit balance, and
      purchase records without blocking the guest review.
- [ ] Enforce the one-free-review policy and credit consumption server-side
      after the API/auth contract is approved.
- [ ] Configure formal prices only after a reproducible model/API cost review.
- [ ] Connect and verify a real payment provider, checkout, and webhook flow.
- [ ] Persist review history and repeat-review data after the analysis API is
      available.

## Still deferred

- [ ] Subscriptions, automatic retouching, bulk upload, team collaboration,
      and AI-truth verdicts.
