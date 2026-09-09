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

## Pending, requiring in-scope backend or environment work

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

## Explicitly deferred beyond P0

- [ ] Login and account flows: only after history, repeat-review, or allowance
      requirements are approved; never gate the first analysis behind login.
- [ ] Pricing, checkout, subscriptions, and allowances: remain P1/P2 until
      product rules and real provider integration are approved.
