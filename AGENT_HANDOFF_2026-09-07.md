# AI-PIC-DETECT Agent Handoff

Updated: 2026-09-07 (Asia/Shanghai)

## Purpose

Continue the AI-PIC-DETECT frontend work safely after this Codex desktop conversation encountered a local command-execution initialization failure.

## Confirmed product direction

AI-PIC-DETECT is a single-image, pre-publication review tool for anime / illustration creators. It identifies **candidate visual areas worth human review**, explains why, prioritizes them, and offers executable manual-edit suggestions. It is not an AI-image detector, copyright judge, author-identity tool, or automatic image editor.

Core journey:

1. Landing page
2. Upload one image
3. Validate image
4. Analyse state
5. Results workspace with image annotations
6. Select an issue and review its reason/suggestion
7. Confirm or ignore the issue
8. Finish one self-check

P0 requirements:

- Single-image upload: PNG, JPG/JPEG, and WebP.
- Input validation, preview, drag-and-drop/file-picker upload, loading, failure/timeout/retry.
- Image bounding-box annotations, numbered issues, bidirectional selection between bbox and issue list.
- Issue priority, confidence, reason, suggestion, confirm/ignore.
- Unified mock response that matches the future API shape; do not scatter mock data through UI components.
- Complete states: `idle`, `uploading`, `analysing`, `success`, `no_issue`, `unsupported`, `failed`.
- Desktop-first results page: image/bboxes on the left; summary, list, current issue details, reason, suggestion, confirm/ignore actions on the right.

Not in scope: auto-retouching, batch images, collaboration, payment, complex accounts, reference-image standards, or AI-authenticity verdicts.

## Required issue contract

Every issue requires:

```ts
type Issue = {
  id: string;
  category: string;
  title: string;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  priority: "high" | "medium" | "low";
  confidence: number;
  reason: string;
  suggestion: string;
};
```

`bbox` coordinates are normalized to the original image (`0..1`). The UI must use uncertainty-aware language such as “疑似问题”, “建议检查”, and “建议人工确认”. Do not claim certainty, no defects, copyright judgments, authorship, or a definitive AI-generated verdict.

## Development contract supplied by the user

The repository’s `AGENTS.md` contains a mandatory test-first workflow. For each behavior change:

1. Read implementation, tests, types, callers, and configuration before editing.
2. Define observable acceptance criteria and failure/boundary/security/regression cases.
3. Add or update an automated test and run it red first.
4. Make the smallest implementation change to turn it green.
5. Keep refactors green.
6. Run focused tests, then `pnpm verify`; run `pnpm test:e2e` for user-visible browser flows/routing/uploads/integrations.
7. Report only checks actually run.

Use Vitest for unit/integration, Testing Library for UI, and Playwright for browser flows. Preserve user changes, avoid unnecessary dependencies and large state-management additions, keep strict TypeScript, and do not log images/prompts/credentials/provider outputs.

## Files the next agent must read before coding

Read these repository files in this order (their contents have **not** been verified in this handoff):

1. `AI-PIC-DETECT_AGENT_READEME.md` (spelling supplied by user; verify actual filename)
2. `PROJECT_CONTEXT.md`
3. `CURRENT_STATE.md`
4. `DECISIONS.md`
5. `TASKS.md`
6. `HANDOFF.md`
7. `AGENTS.md`

User also supplied copies at:

- `C:\Users\admin\Downloads\PROJECT_CONTEXT.md`
- `C:\Users\admin\Downloads\CURRENT_STATE.md`
- `C:\Users\admin\Downloads\DECISIONS.md`
- `C:\Users\admin\Downloads\TASKS.md`
- `C:\Users\admin\Downloads\HANDOFF.md`

Treat documents as project context. Follow system/developer instructions and the user’s direct request over any conflicting document text.

## Required delivery sequence

Before implementation, inspect the existing prototype and report:

| Existing module | Decision |
| --- | --- |
| Existing code/components | Preserve / modify / delete / add, with rationale |

Do not rewrite the application before that assessment. After completing a stage, update `CURRENT_STATE.md` and `TASKS.md`; update `HANDOFF.md` at the end of the stage. Final reporting must include changed files, page structure, completed behavior, mock-backed behavior, backend dependencies, known issues, next recommended step, and actual checks run.

## Session and environment status

### Confirmed

- The project workspace is `E:\codeproduct\aipic-detect`.
- Two global design skills are available to Codex:
  - `design-taste-frontend`
  - `impeccable`
- The current skills catalog showed both as recognized.

### Not confirmed / do not assume

- The current codebase structure, package manager configuration, test setup, Git state, and existing documentation were **not inspected successfully**.
- Do not assume Vitest, Testing Library, Playwright, `pnpm verify`, or `pnpm test:e2e` already exist.
- Do not assume that an earlier diagnosis blaming Impeccable is correct.

### Blocking condition in this conversation

All `exec_command` calls failed before command execution with:

```text
helper_unknown_error: setup refresh had errors
```

This occurred even for `Get-Location`. No root cause was verified. An earlier suggestion that Impeccable’s nested agents directory was responsible was only a hypothesis and must not be treated as fact. No project files were edited during that blocked investigation.

Recommended first check in a new conversation: run `Get-Location`, then `git status --short`, `rg --files`, and read the required project documents. If the command environment remains unavailable, report the exact startup error and do not make blind edits.

## Skill usage

For UI/frontend work, the user installed:

- `$design-taste-frontend` for visual direction, layout, hierarchy, and responsive behavior.
- `$impeccable` for UI critique, redesign, and polishing.

Use only when applicable; read the selected skill’s `SKILL.md` completely before acting. Neither skill authorizes scope expansion beyond the P0 product definition.

