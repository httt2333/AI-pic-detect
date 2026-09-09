# Product Decisions

- The product makes cautious candidate-review statements only. Never state
  that an image is definitely AI-made, definitely faulty, copyright-infringing,
  or free of all problems.
- Bbox coordinates are normalized from 0 to 1 relative to the original image.
- The UI converts normalized bbox coordinates to the actual contained-image
  frame rather than the fixed review-stage frame, preserving alignment for all
  uploaded aspect ratios.
- `priority` communicates editing order, not a definitive severity judgment.
- Low-confidence candidates are filtered before the result workspace.
- P0 has no automatic retouching, bulk upload, account complexity, payment,
  collaboration, or AI-truth verdict.
- Do not activate the template's existing login, pricing, checkout,
  subscription, or allowance features during P0. An unauthenticated creator
  can complete one image analysis without login. Any later account system
  exists for history, repeat reviews, and allowances, not as an analysis gate.
- The front-end mock must use the same response shape as the future analysis
  API. Mock data stays in `src/features/ai-pic-detect/mock.ts`.
- The primary result action advances to the next candidate. “确认需要处理” is
  intentionally not used; users can still explicitly ignore a candidate.
- The result contract remains provider-independent: the browser consumes only
  the backend-validated `status`, `summary`, `issues[]`, and safe dimension
  states. Provider prompts, raw output, temporary URLs, and diagnostics never
  enter the client response.
- The 17 A/B/C IDs are an approved provisional interface skeleton for review
  states, not a 17-error checklist, final taxonomy, or provider-capability
  claim. A dimension may navigate to an image region only when a retained
  candidate supplies a matching `dim_id` and legal normalized bbox. The
  accepted response may contain zero through five candidate issues.
- `no_issue` is a normal successful result. `timeout` and `analysis_failed`
  are separate retryable presentation states; detailed provider failures stay
  on the server boundary.
- Historical visual-review material is an evaluation corpus and candidate issue
  pool. Its local, visible dimensions and failure lessons may guide provider
  prompts and automated tests, but it does not override the current product
  scope or establish any provider capability without fresh evidence.
