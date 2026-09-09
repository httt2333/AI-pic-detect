# Images — Replace template images with Picsum placeholders

## Goal

Replace template default screenshots with **safe placeholders** for v1, focusing on replacing all image `src` fields referenced by the landing page JSON.

This step is optional but recommended when the user provides **referenceLinks** or wants a “first version” that looks real.

## Priority rule

1. **Prefer extracting image URLs from the user’s reference links / reference content**:
   - OG/Twitter images (`og:image`, `twitter:image`)
   - product screenshots, hero images, illustrations, section images
   - (if the reference is a docs/blog page) images embedded in the content
2. **Wire extracted image URLs into the correct content fields first** (do not leave default template images).
3. **If any image fields still point to template defaults**, replace them with **Picsum placeholders** using `https://picsum.photos/`.
4. **Logo + favicon must be regenerated for the new brand** (never keep the template defaults). See `references/05-logo-favicon.md`.

## Placeholder rule (Picsum)

When you need placeholders, use **Picsum** to generate stable remote images:

- Use seeded URLs so the same image is returned consistently:
  - `https://picsum.photos/seed/<seed>/<w>/<h>.webp`
- Use different seeds per section/slot so images don’t repeat.
- Prefer `.webp` to keep payload sizes reasonable.

Seed format (recommended):

- `<seed> = <appSlug>-<locale>-<sectionKey>-<slot>`
- Example: `acme-en-hero-main`, `acme-zh-features-2`

Size guidance (recommended defaults):

- **Hero main image**: 1200×800
- **Hero dark/invert**: 1200×800 (use a different seed)
- **Section images**: 960×640 or 800×600
- **Small card thumbnails**: 640×480
- **Background image (optional)**: 1600×900

Hard rule:

- Do **not** leave any default template image paths in page content, especially:
  - `/imgs/features/admin.png`
  - `/imgs/features/admin-dark.png`
  - `/imgs/features/landing-page.png`
  - any other `/imgs/features/*` ShipAny screenshots
- Also do **not** keep template default `public/logo.png` / `public/favicon.ico` as-is; they must be replaced (see logo step).

## Where images are configured (ShipAny Two)

Landing images commonly live in `src/config/locale/messages/*/pages/index.json` (page sections), plus branding in `src/config/locale/messages/*/landing.json` (header/footer):

- Page sections (`pages/index.json`):
  - Hero: `page.sections.hero.image.src`, `page.sections.hero.image_invert.src`, `page.sections.hero.background_image.src`
  - Other sections: `page.sections.<sectionKey>.*.image.src`
- Header/footer branding (`landing.json`):
  - `header.brand.logo.src`
  - `footer.brand.logo.src`

Images are typically served from `public/`.

## What “done” looks like

- All enabled landing sections have **non-template** images (either extracted real images or Picsum placeholders), and **default template screenshots are removed**.
- `pages/index.json` contains **no** `/imgs/features/*` references.
- `public/logo.png` and `public/favicon.ico` are **new** and match the **brandName** (see `references/05-logo-favicon.md`).

## Option A — Extract images from reference links/content (preferred)

Best-effort strategy:

1. For each reference link, extract candidate image URLs in this order:
   - `og:image`, `twitter:image`
   - on-page hero image / product screenshot
   - “features/benefits” section images
2. **Prefer wiring stable remote URLs directly** into the landing JSON if they are reliable (and permitted).
3. If you want stability or need to normalize formats, download and store under `public/imgs/brand/` (create if needed), using stable names:
   - `public/imgs/brand/hero.png`
   - `public/imgs/brand/hero-dark.png` (optional)
   - `public/imgs/brand/bg.jpg` (optional)
   - `public/imgs/brand/feature-1.png` …
4. Wire those URLs/paths into the correct `src` fields in:
   - `src/config/locale/messages/en/pages/index.json`
   - `src/config/locale/messages/zh/pages/index.json`

### Mapping guidance (wire to the section you enabled)

- If `hero` is enabled:
  - `page.sections.hero.image.src` → best “product UI” screenshot / illustration
  - `page.sections.hero.image_invert.src` → dark-mode variant if available (otherwise reuse `image.src`)
  - `page.sections.hero.background_image.src` → subtle background (optional)
- If `introduce/benefits/features/faq/cta` are enabled:
  - Fill `...image.src` fields and any per-item images (e.g. `items[].image.src`) with extracted visuals that match each item.
- If `testimonials` is enabled:
  - Prefer **no avatars** over fake faces unless the user provides them; otherwise use abstract icons/illustrations.

### If you are using Picsum (quick replace)

In both locales’ `pages/index.json`, replace any template defaults like `/imgs/features/*.png` with seeded Picsum URLs.

Examples:

- Hero:
  - `https://picsum.photos/seed/<appSlug>-<locale>-hero-main/1200/800.webp`
  - `https://picsum.photos/seed/<appSlug>-<locale>-hero-invert/1200/800.webp`
- Section item (e.g. features item #2):
  - `https://picsum.photos/seed/<appSlug>-<locale>-features-2/960/640.webp`

### Suggested automation

Use the bundled script:

- `scripts/fetch_og_image.py <url> <output-path>`

If the OG image is SVG or a remote CDN URL without an extension:

- Save with a safe extension (`.png` if it’s an actual PNG/JPG, `.svg` if SVG).
- If you cannot determine the type, save as `.bin` and replace manually (avoid shipping unknown binaries).

## Option B — Fill gaps with Picsum placeholders

If you cannot extract enough usable images (or you want a quick “first version”), use **Picsum placeholders** instead of generating new raster assets.

## Quality bar

- Do not use copyrighted competitor screenshots unless the user explicitly provided them and confirmed usage rights.
- Avoid fake brand logos or trademarked icons.
- Keep file sizes reasonable.

## Wiring

After adding images:

- Update `pages/index.json` section image `src` fields to point to your new assets.
- Update `landing.json` logo `src` fields if you changed branding assets.
- Ensure both light and dark hero images exist (or reuse one if acceptable).
