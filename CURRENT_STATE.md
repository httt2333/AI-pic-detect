# Current State

Updated: 2026-09-09

The public landing route now renders the AI-PIC-DETECT P0 front end. It has a
product header, value proposition, example bbox treatment, upload CTA,
capability flow, and product-boundary copy.

The client workflow implements `idle`, `uploading`, `analysing`, `success`,
`no_issue`, `unsupported`, `timeout`, `quota_exhausted`, and `analysis_failed` states. It validates a single
PNG/JPEG/WebP file under 10MB, previews it locally, provides failure retry, and
renders a desktop-first workspace where the issue list and bbox markers select
one another. Markers are positioned against the actual rendered image area, so
they stay aligned when landscape or square images are letterboxed. A creator
can move to the next issue or ignore an item; the ignore decision is local for
this session. `timeout` and `analysis_failed` are separate recoverable states.

The workflow also has a guarded `quota_exhausted` state. It points to the
configured credit-pack page without retrying an exhausted request. The browser
does not calculate, persist, or spend entitlements; this result must come from
a future server boundary.

The analysis result is mock-only. No uploaded image, prompt, provider response,
or personal data is logged or sent from this UI.

The safe analysis contract now includes a provisional 17-dimension A/B/C
status panel in addition to `status`, `summary`, and `issues[]`. The panel is a
check-state display, not a fixed error checklist. It always renders the known
dimensions, but only a validated candidate with matching `dim_id` and bbox may
be used to select an image region. Mock data contains three such candidates to
exercise the interaction; the contract permits zero through five candidates.

The P0 UI has completed a desktop-first convergence pass. The result workspace
now keeps image location, issue list, current issue, and the editing-priority
decision in one compact review flow. All creator-facing priority language uses
“修改优先级”; reasons and suggestions are deliberately short. The no-issue,
unsupported-file, and failed-analysis states each explain the outcome and offer
one clear recovery path. The public home metadata and visual surface are
AI-PIC-DETECT rather than ShipAny, and the hero uses an original local example
image to show a normal-looking illustration becoming locally marked after a
scan. The approved commercial shell exposes links for sign-in, review history,
one-time credit packs, remaining credits, and purchase records. The three CNY
pack cards (10/50/200, with 50 recommended) have configurable placeholder
prices and disabled purchase buttons. No subscription or real checkout is
enabled.

The inherited template supplies account, credit, purchase-record, and payment
route primitives. They are mapped to the approved commercial shell; billing
and subscription navigation is removed from the active Chinese settings
sidebar. Keep the direct unauthenticated single-analysis workflow intact until
a real analysis API contract and server-side entitlement policy are available.

The review workspace now uses a two-level result layout: the image and detected
candidate detail share the top row, while the 17-dimension state summary sits
below them as a full-width “详细检查报告”. This prevents the report from stretching
the image panel. Credit entry points open the Chinese pricing route in the same
tab, and that page provides a clear return path. While purchases are disabled,
the pricing page skips account/subscription database reads so the frontend shell
does not surface an unrelated schema failure.

Historical P0-focused Vitest and Playwright journeys have passed in a normal
runner, but the current restricted environment has not completed a fresh runtime
acceptance. This session confirmed a clean working tree and passed
`tsc --noEmit` directly. Dependency restoration could not complete because the
offline cache is incomplete and the registry connection was refused. Vitest,
Playwright, `next build`, and `next dev` were then blocked before application
checks by the environment's child-process `spawn EPERM` policy. Do not retry
installation, build, or process-permission remediation in this environment.

The repository-wide `pnpm verify` baseline also remains blocked by pre-existing
formatting and ESLint debt outside this feature. Final runtime acceptance must
run in a normal local terminal, in order: `pnpm install --frozen-lockfile`,
`pnpm verify`, `pnpm test:e2e`, and `pnpm dev`.

The main product is paused at its mock/fallback boundary while the Harness
performs reproducible Provider validation. Do not add a visual Provider,
`/api/analyze` implementation, R2/S3, or another object-storage dependency
until the Harness has supplied a mature Provider Adapter recommendation.

The historical migration corpus now has a typed A/B/C dimension map and a
local-only, Git-ignored sanitized-index command. A v10 index was generated
from 1,149 source records; it retained 1,146 known non-noise records without
copying raw comments, authors, source links, or platform identifiers.

The EvoLink single-dimension stability probe is implemented and covered by
mocked tests. Its first real anime-image call returned only `invalid_output`;
under the three-identical-results acceptance rule, the provider is currently
not stable for this classification step. No additional calls or bbox work were
performed.

A separate three-call description probe received non-empty text twice, then
failed with a client-side `TypeError` on the third call. The basic description
path is demo-usable but not stable enough for a production dependency.
