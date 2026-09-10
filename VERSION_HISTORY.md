# Version History and Backup Ledger

This file records what each Git checkpoint or backup contains. It is a human-readable supplement to `git log`; the commit itself remains the source of truth for the exact file contents.

## Rules

- Only record a row when the user explicitly requests a Git backup.
- First confirm that the requested work is complete and that necessary checks have run.
- Combine continuous changes from one task into one version entry.
- Do not create entries for isolated wording, styling, or other small changes.
- Keep each entry concise: completed work, important changes, test results, and known issues.
- Git commits are the recovery source of truth; this file is only a quick human-readable summary.
- Never record secrets, tokens, uploaded image data, provider responses, or personal data.

## Ledger

| Date | Commit | Agent/window | Type | Scope / summary | Checks run | Risks / follow-up | Remote status |
|---|---|---|---|---|---|---|---|
| 2026-09-09 | `dcce486` | Codex audit window | `chore` | Created the first local baseline backup containing the project source, tests, configuration, documentation, and assets. Excluded `.dev.vars` and `.pnpm-store/`. | No tests run; documentation/backup operation only. | `.dev.vars` and `.pnpm-store/` remain untracked; `.gitignore` should be reviewed. | Local only; push to `origin/main` failed because GitHub HTTPS/proxy/TLS connection was unavailable. |
| 2026-09-09 | `b446d37` | Codex product window | `chore` | Added local-environment and package-cache ignore protection. | No tests run; ignore-rule change only. | Local-only files remain machine-specific. | Local only. |
| 2026-09-09 | `89faa7b` | Codex product window | `feat` | Added the approved one-time CNY credit-pack shell (10/50/200), guest review history surface, configurable placeholder prices, and disabled purchase states. | Tests were added in the commit; no historical rerun. | Real pricing, entitlement enforcement, and payment provider remain deferred. | Local only. |
| 2026-09-09 | `2048c94` | Codex product window | `fix` | Refined the result report layout, detailed check report placement, credit-route behavior, and pricing access boundary. | Tests were added/updated in the commit; no historical rerun. | Backend analysis and real checkout contracts remain pending. | Local only. |
| 2026-09-09 | `448257d` | Codex product window | `feat` | Rebuilt the Landing Page as an image-first editorial narrative with Hero, creator pain, Find/Understand/Fix, workspace preview, product boundary, and final upload CTA. | 64 Vitest tests, 4 Playwright journeys, TypeScript, targeted ESLint, and Landing coverage passed in the session. | Repository-wide `pnpm verify` still has unrelated template formatting and lint debt; Impeccable engine binary was unavailable. | Local only. |
| 2026-09-09 | `d675f1b` | Codex product window | `chore` | Created a rollback checkpoint before the UI refinement work. | No tests run; checkpoint only. | Recovery point for the preceding UI state. | Local only. |
| 2026-09-09 | `c41a6fe` | Codex analysis window | `chore` | Created the checkpoint immediately before live analysis integration work. | No tests run; checkpoint only. | Recovery point before provider-backed changes. | Local only. |
| 2026-09-09 | `6f8ac35` | Codex analysis window | `feat` | Added the provider-backed analysis boundary, safe response filtering, client integration, and provider response fixtures/tests. | Tests were added in the commit; no historical rerun. | Provider stability and production readiness still require reproducible validation. | Local only. |
| 2026-09-09 | `5b6b325` | Codex analysis window | `docs` | Recorded provider integration verification and handoff findings. | No tests run; documentation-only change. | Provider validation remains provisional. | Local only. |
| 2026-09-09 | `22ef8b6` | Codex maintenance window | `ci` | Aligned build environments with pnpm 12. | No historical rerun. | CI/runtime behavior should be rechecked in the deployment environment. | Local only; `origin/main` points to this commit. |
| 2026-09-09 | `c12afb9` + `dd3fce3` | Codex maintenance window | `chore` | Preserved checkpoints before lint cleanup and format verification. | No tests run; checkpoints only. | These are rollback points, not completed lint/format remediation. | Local only. |
| 2026-09-09 | `90ef966` | Codex maintenance window | `docs` | Backfilled the Git version history ledger. | No tests run; documentation-only change. | The ledger should remain aligned with later user-requested backup commits. | Local only; not pushed to `origin/main`. |
| 2026-09-09 | `4695320` | Codex product window | `feat` | Completed the basic product interface and image-upload location inspection flow, including the analysis boundary and Claude message handling. | Focused Vitest run attempted but blocked by local `esbuild` `spawn EPERM`; no test result claimed. | Full `pnpm verify` and E2E remain unverified; remote push status still pending. | Local only; not pushed to `origin/main`. |
| 2026-09-09 | `7619183` | Codex P0 fix window | `fix` | Made image detection use the real PNG/JPEG/WebP signature and added runtime validation for completed analysis responses, including `no_issue`. | 91 Vitest tests, TypeScript, targeted ESLint, and earlier Playwright regression suite passed. | Provider migration remains a separate follow-up; no live Provider call was made for this fix. | Local only; backup commit created before PoC migration. |
| 2026-09-10 | pending | Codex UI refinement window | `feat` | Smoothed the landing hero auto-scan with requestAnimationFrame/direct DOM updates and added a fixed full product navigation to the Chinese pricing page. | 16 focused Vitest tests, 6 Playwright journeys, TypeScript, targeted ESLint, and `git diff --check` passed. | Repository-wide verify still has pre-existing template debt; changes are local only. | Local only; commit created below. |
