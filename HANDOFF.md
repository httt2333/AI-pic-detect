# P0 Front-end Handoff

Updated: 2026-09-09

## What is implemented

- `src/features/ai-pic-detect/review-experience.tsx` owns the P0 client flow.
- `validation.ts` performs browser-side declared-type, size, and empty-file
  checks. Server-side byte-signature validation remains in
  `src/features/analyze/image-input.ts`.
- `mock.ts` is the sole temporary response source. Its issue objects follow the
  analysis contract and use normalized bbox coordinates. It has three mock
  candidates only to exercise interaction; the contract accepts zero through
  five candidates. `bbox.ts` maps them to the actual contained-image frame
  displayed in the review workspace.
- The public `/` page renders `ReviewExperience`; the landing route layout no
  longer shows the inherited ShipAny navigation or banner.
- The public metadata is AI-PIC-DETECT, not ShipAny. The active P0 header has
  only working in-page navigation and the upload entry. Template auth and
  commercial routes remain inactive and out of scope; do not delete or enable
  them as part of P0 UI work.
- The workspace is now a single desktop-first review flow: image marker,
  summary, issue list, selected issue, “修改优先级”, concise reason/suggestion,
  “下一项”, local ignore, and a collapsible A/B/C 17-dimension state panel.
  This panel is not an error list; only a retained candidate with matching
  `dim_id` can navigate to a bbox. `no_issue`, `unsupported`, `timeout`, and
  `analysis_failed` use cautious outcome language with clear next actions.
- `public/images/ai-pic-detect/hero-review-sample.png` is an original local
  illustrative sample. It is a product demo asset only, not an uploaded user
  image or model validation evidence.

## Tests and checks

- `src/features/ai-pic-detect/*.test.*` covers validation, mock filtering,
  upload entry, bbox/list/dimension selection, ignore, no-issue, timeout, and
  analysis-failure retry. `src/features/analyze/contract.test.ts` covers the
  server-side safe contract filtering of invalid dimension links.
- `e2e/smoke.spec.ts` covers the public upload entry plus upload-to-workspace,
  issue selection, and next-item review in Chromium.

## Next agent

1. Read `AGENTS.md`, this file, `PROJECT_CONTEXT.md`, `CURRENT_STATE.md`,
   `DECISIONS.md`, and `TASKS.md` before changing behavior.
2. When a backend is supplied, add a failing contract/integration test first;
   replace only the `analyzeImage` boundary, not the UI response shape. It must
   return validated candidate issues and safe dimension states, never provider
   raw output or upload URLs.
3. Do not log or store the upload, model prompt, provider response, or secrets.
4. Use `docs/migration-vision-evaluation.md` as the boundary for reusing the
   historical migration package: it supplies candidate test dimensions and
   failure constraints, not current product scope or AI-origin conclusions.
5. Do not enable the inherited template's login, pricing, checkout,
   subscription, or allowance routes for AI-PIC-DETECT P0. Guests can complete
   one analysis directly; future accounts are for history, repeat reviews, and
   allowances after explicit product approval.
6. `pnpm migration:corpus:index` builds a local-only summary from a
   user-authorized JSONL. Its output belongs in ignored `private-assets/`; do
   not copy the original corpus into the repository or public deployment.
7. `pnpm spike:evolink:single-dimension <image-path>` is a non-production,
   user-authorized stability probe. It returns only a sanitized status and
   historical dimension ID. The current EvoLink result is `invalid_output` on
   the first call; do not infer bbox or production readiness from it.
8. A three-call plain-description probe received non-empty text twice and then
   failed with `TypeError`. Treat EvoLink image description as demo-usable but
   unstable; do not rely on it for the production analysis path.
