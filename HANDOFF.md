# AI-PIC-DETECT Front-end Handoff

Updated: 2026-09-09

## What is implemented

- `src/features/ai-pic-detect/review-experience.tsx` owns the P0 client flow.
- `validation.ts` performs browser-side declared-type, size, and empty-file
  checks. Server-side byte-signature validation remains in
  `src/features/analyze/image-input.ts`.
- `review-experience.tsx` uses `analyze-client.ts` to post one image to
  `POST /api/ai-pic-detect/analyze`. The server validates file bytes, calls the
  EvoLink Claude Messages adapter, and sanitizes output before returning it. `mock.ts`
  remains a deterministic test/demo dependency only; the contract accepts zero
  through five candidates. `bbox.ts` maps them to the actual contained-image
  frame displayed in the review workspace.
- The public `/` page renders `ReviewExperience`; the landing route layout no
  longer shows the inherited ShipAny navigation or banner.
- The public metadata is AI-PIC-DETECT, not ShipAny. The header now includes
  working links for one-time credit packs, sign-in, and review history. The
  guest upload entry remains available without authentication.
- The workspace is now a single desktop-first review flow: image marker,
  summary, issue list, selected issue, “修改优先级”, concise reason/suggestion,
  “下一项”, local ignore, and a collapsible A/B/C 17-dimension state panel.
  This panel is not an error list; only a retained candidate with matching
  `dim_id` can navigate to a bbox. `no_issue`, `unsupported`, `timeout`,
  `quota_exhausted`, and `analysis_failed` use cautious outcome language with
  clear next actions.
- The image and selected-candidate detail now form the top result row. The A/B/C
  state panel is renamed “详细检查报告” and spans the full row beneath them, so it
  no longer controls the image panel height. Credit links use `/zh/pricing` in
  the same tab; the pricing shell has a return link and skips account/database
  loading while purchases remain disabled.
- `public/images/ai-pic-detect/hero-review-sample.png` is an original local
  illustrative sample. It is a product demo asset only, not an uploaded user
  image or model validation evidence.
- The Landing Page has been separated into
  `src/features/ai-pic-detect/landing-page.tsx`. It is a presentation-only,
  image-first editorial surface. Its upload CTAs call the existing `openUpload`
  handler, and its workspace preview reads the centralized mock response
  without changing review state. `DESIGN.md` records the durable visual and
  product-copy constraints for future landing work.
- The Find / Understand / Fix story now renders three numbered crop tiles beside
  the corresponding copy. They are visual placeholders backed by the existing
  local sample asset, not additional analysis results or API data.

## Tests and checks

- `src/features/ai-pic-detect/*.test.*` covers validation, mock filtering,
  upload entry, bbox/list/dimension selection, ignore, no-issue, timeout,
  quota-exhausted guidance, history empty states, and analysis-failure retry.
  `src/features/analyze/contract.test.ts` covers the server-side safe contract
  filtering of invalid dimension links.
- `e2e/smoke.spec.ts` covers the public upload entry, a narrow mobile Landing
  viewport without horizontal overflow, upload-to-workspace, issue selection,
  next-item review, and the disabled CNY credit pack page.
- Current checks: all 84 Vitest tests passed; the three new integration modules
  meet the affected-module coverage target; all four Playwright journeys
  passed; TypeScript passed; targeted ESLint reported no errors. The production
  build compiled and generated pages, then Windows blocked the final standalone
  symlink with `EPERM`. Repository-wide `pnpm verify` still stops on unrelated
  formatting files and inherited template lint debt; keep that cleanup
  separate.

## Next agent

1. Read `AGENTS.md`, this file, `PROJECT_CONTEXT.md`, `CURRENT_STATE.md`,
   `DECISIONS.md`, and `TASKS.md` before changing behavior.
2. Preserve the provider-independent `analyzeImage` boundary. The implemented
   server route must continue returning validated candidate issues and safe
   dimension states, never provider raw output or upload URLs.
3. Do not log or store the upload, model prompt, provider response, or secrets.
4. Use `docs/migration-vision-evaluation.md` as the boundary for reusing the
   historical migration package: it supplies candidate test dimensions and
   failure constraints, not current product scope or AI-origin conclusions.
5. The approved commercial shell uses guest free one review plus one-time CNY
   packs of 10/50/200 checks, with 50 recommended. Prices are placeholders and
   all purchase buttons are disabled until costs and a payment provider are
   verified. Do not add subscriptions or client-side credit accounting.
6. `/reviews` is an honest empty/auth-aware shell: it never fabricates history.
   The template `/settings/credits` and `/settings/payments` routes are mapped
   as account surfaces; server persistence and entitlement enforcement are
   still pending.
7. `pnpm migration:corpus:index` builds a local-only summary from a
   user-authorized JSONL. Its output belongs in ignored `private-assets/`; do
   not copy the original corpus into the repository or public deployment.
8. `pnpm spike:evolink:single-dimension <image-path>` is a non-production,
   user-authorized stability probe. It returns only a sanitized status and
   historical dimension ID. The current EvoLink result is `invalid_output` on
   the first call; do not infer bbox or production readiness from it.
9. A three-call plain-description probe received non-empty text twice and then
   failed with `TypeError`. Treat EvoLink image description as demo-usable but
   unstable; do not rely on it for the production analysis path.
10. The Harness's Claude Messages route is integrated at
    `/api/ai-pic-detect/analyze`; older Gemini and DeepSeek probes remain failure
    evidence only. Two real Claude calls passed the external PoC, but clean,
    blurry, and `no_issue` live cases remain unverified and bbox placement is not
    consistently precise. Rotate the exposed provider key before any live call.
    Do not add R2/S3 or other object storage.
