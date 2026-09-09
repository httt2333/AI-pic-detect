# Step 4 — Theme styles

## Goal

Generate a cohesive theme **as if the user tuned it in tweakcn**, while keeping the file structure and token names stable.

## File

- `src/config/style/theme.css`

## Context (important)

This project’s `theme.css` is in the **tweakcn export style** (shadcn/ui theme variables):

- `:root` (light) tokens
- `.dark` tokens
- `@theme inline` mapping (do not modify this mapping block)

Reference UI/editor: `https://tweakcn.com/editor/theme`

## Generation workflow (tweakcn-like)

### 1) Infer the brand “vibe” from brief + references

From the user’s project description, keywords, and reference links, infer:

- product category (devtool/finance/health/education/creator/consumer…)
- tone (serious, playful, premium, friendly, minimal, bold)
- any explicit brand colors (hex/rgb/hsl), or “avoid colors” constraints

### 2) Choose a primary hue and build the palette

Prefer **explicit** user-provided brand colors. If absent, pick a primary color that fits the category:

- devtools/infra: blue/indigo/cyan (trust + clarity)
- finance/compliance: blue/teal (stability)
- creative/AI/consumer: purple/pink (energy)
- wellness: teal/green (calm)
- productivity: indigo/violet (focus)

Then generate a full palette that stays harmonious in both modes:

- **primary** / **primary-foreground**
- **ring** aligned with primary
- **accent** used for subtle highlights/hover
- **secondary** should be neutral-ish (not competing with primary)
- **destructive** keep readable and consistent
- **chart-1..5** should be a coordinated set (chart-1 can align with primary; the rest should be distinct but not clashing)
- **sidebar-\* tokens** should align with the overall palette (sidebar-primary often aligns with primary)

### 3) Write the theme into `theme.css` without changing structure

Constraints:

- Keep **all existing variable names** intact (do not rename tokens).
- Keep the overall structure: `:root`, `.dark`, then `@theme inline`.
- Do **not** delete tokens; update values.
- Keep typography (`--font-*`) unchanged unless the user explicitly requests a font change.
- Keep shadows/radius unchanged unless the user explicitly requests “more playful/rounded” or “more sharp/enterprise”.

### 4) Quality bar (what “done” looks like)

- The theme reads like a real tweakcn-tuned theme: primary/accent/ring/chart/sidebar feel intentional.
- Light + dark both have good contrast (buttons, links, focus ring are readable).
- No “template default look”: do not keep ShipAny’s original primary hue unless it matches the new brand.

## Guidance

- Prefer hex input from the brief; since the file uses `oklch()`, you may:
  - convert hex → oklch (ideal), or
  - pick a close `oklch()` by approximation (acceptable for v1), then ensure the UI still looks consistent.

Practical recommendation:

- If you are unsure, keep the neutral system (`--background`, `--foreground`, `--border`, `--muted`, etc.) close to the existing values and focus on producing a strong, coherent brand layer:
  - `--primary`, `--primary-foreground`, `--ring`
  - `--accent`, `--accent-foreground`
  - `--chart-1..5`
  - `--sidebar-primary`, `--sidebar-ring`
