# AI Picture Detection

Production image-recognition product based on Next.js, React, and TypeScript.

> AI contributors must read and follow [AGENTS.md](./AGENTS.md) before changing this repository. The project requires test-driven development for every behavior change.

## Getting started

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The upstream framework documentation is available in the [ShipAny documentation](https://shipany.ai/docs/quick-start).

## Test-first development

Every feature, behavior change, and bug fix follows red-green-refactor:

1. Add or update a test that describes the acceptance criteria.
2. Run it and confirm it fails for the intended reason.
3. Implement the smallest change that makes it pass.
4. Refactor while keeping tests green.
5. Run the complete verification suite before finishing.

Documentation-only, formatting-only, and non-executable asset changes may omit tests when the reason is stated.

### Quality commands

| Command              | Purpose                                           |
| -------------------- | ------------------------------------------------- |
| `pnpm test`          | Run Vitest unit and integration tests once        |
| `pnpm test:watch`    | Run focused tests while developing                |
| `pnpm test:coverage` | Run tests and enforce coverage thresholds         |
| `pnpm test:e2e`      | Run Playwright browser tests                      |
| `pnpm typecheck`     | Check TypeScript without emitting files           |
| `pnpm lint`          | Run ESLint                                        |
| `pnpm format:check`  | Check formatting                                  |
| `pnpm verify`        | Run formatting, linting, types, and covered tests |

Unit tests are co-located with source files as `*.test.ts(x)`. End-to-end tests live in `e2e/`; shared test setup lives in `tests/`. Pull requests run all checks in `.github/workflows/quality.yaml`, and production-code changes without a test change are rejected by the test-policy gate.

Before running E2E tests for the first time, install Chromium with `pnpm exec playwright install chromium`.

## Analysis safeguards

The local image-analysis contract is deliberately provider-independent. The
server route validates and sanitizes untrusted model output before it can reach
the UI.

- `src/features/analyze/image-input.ts` accepts only PNG, JPEG, and WebP files
  up to 10MB, validating both declared MIME type and file signature.
- `src/features/analyze/contract.ts` validates candidate issues, rejects invalid
  fields and out-of-bounds normalized boxes, removes low-confidence results, and
  caps the response at five issues. It also produces a complete, safe A/B/C
  dimension-status list; a dimension can link to a candidate only when that
  candidate survived validation and has the same `dim_id`.
- The category set is provisional for the visual-model spike; it is not a final
  product taxonomy until real-image testing is complete.
- Historical human-review constraints for future opt-in provider tests are
  documented in [Vision API Test Baseline](./docs/vision-api-test-baseline.md).
- The approved reuse boundary for the historical migration package is
  documented in
  [Migration Vision Evaluation](./docs/migration-vision-evaluation.md).
- The private corpus pipeline and migration-package inventory are documented in
  [Migration Asset Registry](./docs/migration-asset-registry.md).
- The first sanitized live-provider outcome is recorded in
  [Vision API Spike Results](./docs/vision-api-spike-results.md).

Run the focused local contract checks with:

```bash
pnpm test -- src/features/analyze/contract.test.ts src/features/analyze/image-input.test.ts
```

The guest review flow posts the selected image to
`POST /api/ai-pic-detect/analyze`. The Node.js route validates the image bytes,
calls EvoLink's OpenAI-compatible Responses endpoint, sanitizes the result, and
returns only the product contract. Configure these server-only variables in
`.env.local`:

```bash
EVOLINK_API_KEY="replace-with-a-rotated-key"
EVOLINK_RESPONSES_URL="https://api.evolink.ai/v1/responses"
EVOLINK_RESPONSES_MODEL="deepseek-v4-flash-vision-exp"
```

Uploads, prompts, credentials, and raw provider responses are kept out of logs,
fixtures, browser responses, and persistent storage. The request has a 120
second provider timeout; the client allows 130 seconds before showing its
recoverable timeout state. The mock remains available only through explicit
test or component dependency injection.

The non-production, user-authorized single-dimension provider probe is run
locally and never from CI:

```powershell
pnpm spike:evolink:single-dimension <image-path>
```

It reads its provider configuration and instruction from ignored `.env.local`
and only prints a sanitized status and dimension ID.

AI contributors must also read `AGENTS.md` at the start of every coding task.

## AI-PIC-DETECT P0 front end

The public home route is the P0 creator review experience. It deliberately
does not determine whether an image is AI-generated, make copyright or author
claims, or edit images automatically.

- Upload one PNG, JPEG, or WebP image up to 10MB.
- Review candidate visual issues by normalized image bounding box, editing
  priority (修改优先级), concise reason, and manual adjustment suggestion.
  Markers are aligned to the actual contained-image area, including landscape
  and square uploads.
- Move through candidates sequentially or ignore an item. The UI filters
  low-confidence candidates before they reach the workspace.
- The workspace presents 17 A/B/C check states, not a 17-item error list.
  Only dimensions with a valid candidate bbox can select a region on the image.
  The temporary IDs are a provisional UI contract, not a claim of provider
  capability or a final taxonomy.
- Results explicitly distinguish `no_issue`, `timeout`, and `analysis_failed`;
  the latter two offer a retry without exposing provider diagnostics.
- The current result uses the server analysis route. Provider output is never
  consumed directly by the browser; unit and browser tests replace the external
  boundary with deterministic mocks.
- The public P0 review flow remains usable without login. The approved first
  commercial layer exposes account, review-history, credit-balance,
  purchase-record, and pricing entry points without blocking the guest review.
  It uses one-time CNY credit packs of 10, 50, and 200 checks; the 50-pack is
  recommended. Prices are placeholders until model/API costs are validated,
  and purchase controls remain disabled until a verified provider is ready.
  Subscriptions are not part of the product direction.

Relevant project memory is kept in `PROJECT_CONTEXT.md`, `CURRENT_STATE.md`,
`DECISIONS.md`, `TASKS.md`, and `HANDOFF.md`. Read those with `AGENTS.md`
before product changes.

## License

Do not publicly release ShipAny source code. See the repository license for terms.

[ShipAny LICENSE](./LICENSE)
