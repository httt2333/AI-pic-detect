# ShipAny Page Builder — Guide (v1)

## Goal

Create a new dynamic page from a short spec by:

- Creating locale JSON files for **all configured locales**
- Registering the page once in `src/config/locale/index.ts` → `localeMessagesPaths`

No routing/code changes are needed.

## Route → slug → files

- **Route**: `/features/ai-image-generator`
- **Slug**: `features/ai-image-generator`

Files to create (for each configured locale in `localeNames`):

- `src/config/locale/messages/<locale>/pages/features/ai-image-generator.json`

Registration to add (once):

- `src/config/locale/index.ts` → `'pages/features/ai-image-generator'`

Runtime message namespace:

- `pages.features.ai-image-generator`

## Hard constraints (v1)

- Only create **new** page JSON files under `src/config/locale/messages/<locale>/pages/**` (one per configured locale).
- Only update `src/config/locale/index.ts` by appending `'pages/<slug>'` to `localeMessagesPaths`.
- **Images must be placeholders** (do not add real images to `public/`).
- When writing JSON string content, avoid control/special characters that can break JSON parsing. Ensure generated output is valid JSON (the script sanitizes text before writing).

## Placeholder image rule

Whenever the JSON uses an image field (e.g. `hero.image`, `hero.background_image`), it must be a placeholder image URL.

Recommended placeholder source:

- `https://picsum.photos/seed/<seed>/<width>/<height>`

Notes:

- `<seed>` must be a **single string path segment** (no `/`). If your route slug contains `/`, convert it to a single token like `features-ai-image-generator-hero`.

In this repo, blocks will auto-set `unoptimized` for `http(s)://` images, so placeholders work without Next.js image domain configuration.

## JSON shape (minimal)

Use a simple landing-style set of sections:

- `hero`
- `introduce`
- `benefits`
- `features`
- `faq`
- `cta`

Each section chooses a block by `section.block || section.id || sectionKey`.

## Script usage

Use the bundled script:

- `.claude/skills/shipany-page-builder/scripts/create_dynamic_page.py`

It will:

- Generate JSON files for all configured locales (or a subset via `--locales`)
- Add placeholder hero images automatically
- Append `'pages/<slug>'` to `localeMessagesPaths` once (no duplicates)
