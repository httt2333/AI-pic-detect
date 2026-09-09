# Step 6 — Sitemap

## Goal

Ensure sitemap points to the correct domain and only includes real pages.

## File

- `public/sitemap.xml`

## Actions

- Replace `https://your-domain.com` with **appUrl**.
- Ensure URLs match enabled pages (commonly `/`, `/blog`, `/showcases`).
- Update `lastmod` to today for a first bootstrap.

## Note

Robots references sitemap via `src/app/robots.ts` and `envConfigs.app_url`.
