# Step 3 — Landing copy (EN + ZH)

## Goal

Update landing page content + navigation for the new product, while keeping the template’s JSON schema intact.

## Files

- Page body sections (the actual landing sections):
  - `src/config/locale/messages/en/pages/index.json`
  - `src/config/locale/messages/zh/pages/index.json`
- Header/footer + navigation (top nav, footer nav, show/hide sign-in):
  - `src/config/locale/messages/en/landing.json`
  - `src/config/locale/messages/zh/landing.json`

## Default scope (ShipAny Quick Start)

For the first version, default to these landing sections (in this order):

- `hero`
- `introduce`
- `benefits`
- `features`
- `faq`
- `cta`

Based on the user’s **reference links** and **product description**, you may enable or disable other sections as needed while still keeping the page coherent and minimal (e.g. `logos`, `cta`, `stats`, `testimonials`, `subscribe`, `showcases`).

Do **not** include login/auth in v1 (no sign-in CTA, no “OAuth ready” claims, etc.) unless explicitly requested.

## What to change

### 1) Enable sections based on references + brief (`pages/index.json`)

In both locales’ `src/config/locale/messages/{locale}/pages/index.json`:

- Set `page.show_sections` to include at least:
  - `["hero", "introduce", "benefits", "features", "faq", "cta"]`
- If the reference links/brief provide material for more sections (or if the user explicitly requests a leaner page), adjust `page.show_sections` accordingly (and ensure the corresponding `page.sections.<key>` exists and has real copy/images). It’s OK to add `usage` back **only if** it materially helps explain “how it works”.

Minimum fields to rewrite in v1:

- Hero: `page.sections.hero.{title,highlight_text,description,tip,buttons,announcement}`
- Introduce: `page.sections.introduce.{title,description,items}`
- Benefits: `page.sections.benefits.{title,description,items}`
- Features: `page.sections.features.{title,description,items}`
- FAQ: `page.sections.faq.{title,description,items}`
- CTA: `page.sections.cta.{title,description,buttons}`

Note: `cta` is often mistyped as “cat”; this is the call-to-action section.

**Important:** Remove/replace any feature copy that implies login/auth/payment is available in v1 (e.g. “Google OAuth”, “one-tap login”, “Stripe billing”) unless the user explicitly asked for it.

### Image rule (do not keep template defaults)

When updating `pages/index.json`, ensure the landing content does **not** reference template default images (e.g. `/imgs/features/*`). Replace those `src` values by following `references/08-images.md` (extract real images, otherwise use `https://picsum.photos/` placeholders).

### 2) Update navigation to only `/#features` (`landing.json`)

In both locales’ `src/config/locale/messages/{locale}/landing.json`:

- Header nav: keep only one item pointing to `/#features`
  - `header.nav.items = [{ title: "...", url: "/#features", ... }]`
- Footer nav: remove other internal links and keep only “Features” → `/#features`
- Disable sign-in entry points for v1:
  - set `header.show_sign = false`
  - (optional) empty `header.user_nav.items` if present

## Link hygiene

Replace placeholders:

- `your-app-name` → repo/org handle if known, otherwise remove the link.
- `your-domain.com` → **domain** / **appUrl**
- `support@your-domain.com` → **socialLinks.supportEmail**

## Chinese copy guidance

- Prefer clear, literal Chinese over over-marketed machine translation.
- If unsure, keep ZH text shorter and accurate.

## Avoid

- Do not claim customer counts, testimonials, awards, or revenue unless the user provided them.
