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
- [x] Rebuild the public Landing Page as an image-first editorial narrative:
      Hero, creator pain, brand value, Find/Understand/Fix, read-only workspace
      preview, product boundary, and final CTA. Preserve the existing guest
      upload callback and all analysis/result behavior.
- [x] Add same-sized `1 / 2 / 3` markers for the three Find/Understand/Fix
      steps, with active-step emphasis and a mobile-safe stacked layout.
- [x] Turn the hero sample into an accessible right-to-left scan reveal with
      progressive candidate annotations and conditional result copy.
- [x] Add a single automatic hero scan with immediate user takeover and a
      reduced-motion result-state fallback.
- [x] Fix the product navigation across all P0 views and align the Chinese auth
      entry with the AI-PIC-DETECT visual system and a clear return path.

## Pending, requiring in-scope backend or environment work

- [ ] Address the inherited repository formatting and ESLint baseline in a
      separate, explicitly scoped cleanup. The current Landing files pass
      targeted lint, TypeScript, Vitest coverage, and Playwright; do not mix the
      template-wide cleanup into product work.
- [x] Replace the default mock executor with a server-only EvoLink Claude
      Messages adapter at `POST /api/ai-pic-detect/analyze`; validate images and sanitize
      all results before returning the provider-independent contract.
- [x] Preserve the validated dimension-state and `dim_id` links at the server
      boundary. The browser never consumes raw provider output or upload URLs.
- [ ] Agree the final visual-model category taxonomy after reproducible image
      testing; keep the current taxonomy provisional until then.
- [ ] Create annotated Good/Bad API cases from the approved historical
      candidate pool, starting with hand, eye, hair, body structure, boundary
      overlap, penetration, and accessory details.
- [x] Create a private, sanitized migration-corpus index pipeline and typed
      historical dimension map without exposing the original corpus.
- [ ] Define API authentication, response versioning, and entitlement policy.
      The current guest route has a 120-second provider timeout and does not
      retain images or provider responses.
- [x] Install Playwright Chromium and run the browser journey.
- [x] Add API handler and client integration tests for validation, filtering,
      `no_issue`, provider failure, and timeout behavior.
- [ ] Run reproducible live-provider checks for clean, blurry, and `no_issue`
      samples after rotating the exposed API key.

The server adapter is integrated from the Harness proof. Keep its taxonomy
provisional and do not add object storage or claim production stability until
the remaining live-provider cases are reproducible.

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
