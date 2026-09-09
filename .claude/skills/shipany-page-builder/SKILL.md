---
name: shipany-page-builder
description: Create new dynamic pages from a short spec (keywords, route/path, reference content).
---

# ShipAny Page Builder (Dynamic Pages)

This skill creates **new pages** using ShipAny’s **dynamic page builder** approach: a page is rendered from a JSON file (per-locale), and activated by registering that JSON path in `localeMessagesPaths`.

This skill is intentionally **much simpler** than `shipany-quick-start`: it only creates new dynamic pages.

## v1 edit scope (hard limit)

For v1, you may **only**:

- Add **new** multi-language dynamic page JSON files:
  - `src/config/locale/messages/en/pages/**` (new page JSON files only)
  - `src/config/locale/messages/zh/pages/**` (new page JSON files only)
- Update `src/config/locale/index.ts`:
  - Append the new `'pages/<slug>'` entry to `localeMessagesPaths` (do not duplicate)

Hard rules:

- Do **not** modify any existing page JSON files (only create new ones).
- Do **not** touch routing code, layouts, components, or theme blocks.
- Do **not** add or edit any images under `public/`. **Use placeholder images in JSON only.**

## Inputs (normalize first)

Normalize the user request into:

- `route`: string (e.g. `/features/ai-image-generator`)
- `slug`: string (derived from route, e.g. `features/ai-image-generator`)
- `keywords`: string[] (3–10)
- `referenceCopy`: optional raw text snippets, bullets, competitor copy, or notes
- `sectionsWanted`: optional list of section keys (default: `["hero","introduce","benefits","features","faq","cta"]`)

See `references/00-guide.md`.

## Execution order

1. Normalize input + decide route/slug: `references/00-guide.md`
2. Generate locale files (based on configured `localeNames`) and register `'pages/<slug>'`:
   - Use `scripts/create_dynamic_page.py`
3. Quick validation checklist: `references/01-checklist.md`
4. Validate build (required):
   - Build: `pnpm build`

## Bundled script (recommended)

Use the bundled script to create files + register the message path:

- `scripts/create_dynamic_page.py`

It is intentionally conservative:

- Creates missing folders
- Refuses to overwrite unless `--force`
- Adds `TODO:` markers for missing translations/content
