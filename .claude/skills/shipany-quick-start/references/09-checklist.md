# Minimal checklist (ShipAny Two)

Use this as the default “v1 bootstrap” scope.

## Rule (v1 hard limit)

For the first version, **only edit the files in the allowlist below**. Do not touch anything else unless the user explicitly expands scope.

## Validation (required)

- Before starting: `pnpm install`
- After finishing:
  - Clear Next.js cache first (prevents stale `public/logo.png`/favicon during validation):
    - macOS/Linux: `rm -rf .next`
    - Windows (PowerShell): `Remove-Item -Recurse -Force .next`
    - Windows (cmd): `rmdir /s /q .next`
  - Then run `pnpm build` (ensure no lint/build errors)

## Always

- `.env.development`, `.env.production`
- `src/config/locale/messages/*/common.json`
- `src/config/locale/messages/*/pages/index.json` (landing sections)
- `src/config/locale/messages/*/landing.json` (header/footer/nav; v1 disable sign-in)
- `src/config/style/theme.css`
- `public/logo.*`, `public/favicon.*`
- `public/sitemap.xml`
- `content/pages/privacy-policy*.mdx`, `content/pages/terms-of-service*.mdx`

## Do not edit in v1 (unless explicitly requested)

- `src/config/locale/index.ts` (only needed when adding **new** dynamic pages)
- `src/app/**`, `src/themes/**`, `src/shared/**` (no code changes)
- `src/config/locale/messages/*/admin/**`, `src/config/locale/messages/*/settings/**`, `src/config/locale/messages/*/activity/**` (avoid expanding surface area)
- Auth/billing wiring (`AUTH_SECRET`, database, payments) and any login UI/flows

## Optional (recommended)

- Replace landing images under `public/imgs/` and wire them in:
  - `src/config/locale/messages/*/pages/index.json`
  - `src/config/locale/messages/*/landing.json` (brand logo)
