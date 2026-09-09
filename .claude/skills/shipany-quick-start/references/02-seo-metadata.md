# Step 2 — SEO metadata (EN/ZH)

## Goal

Update default metadata used by `src/shared/lib/seo.ts` → `common.metadata`.

## Files

- `src/config/locale/messages/en/common.json`
- `src/config/locale/messages/zh/common.json`

## Fields

Update:

- `common.metadata.title`
- `common.metadata.description`
- `common.metadata.keywords`

## Rules

- Title: **projectName** (or “{projectName} — {tagline}” if desired)
- Description: **description** (1–2 sentences)
- Keywords: comma-separated; include project name + 3–8 domain terms

## Quick check

- Ensure there are no leftover `ShipAny` / template keywords.
