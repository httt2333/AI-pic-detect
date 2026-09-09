# Step 1 — App basics (env-driven)

## Goal

Make app URL/name/description/logo consistent via env files (ShipAny Two follows env → `src/config/index.ts` → `envConfigs`).

## Files

- `.env.example` (source template)
- `.env.development` (local)
- `.env.production` (prod)

## Actions

- Copy `.env.example` → `.env.development` and `.env.production`.
- Set at minimum:
  - `NEXT_PUBLIC_APP_URL` = **appUrl**
  - `NEXT_PUBLIC_APP_NAME` = **projectName**
  - `NEXT_PUBLIC_APPEARANCE` = `system` (unless user asks)
  - `NEXT_PUBLIC_THEME` = `default` (unless user uses a different theme folder)
  - `NEXT_PUBLIC_APP_LOGO` = `/logo.svg` or `/logo.png`
  - `NEXT_PUBLIC_APP_PREVIEW_IMAGE` = `/preview.png` (unless replaced)

## Notes

- Some environments may not allow reading `.env.example` directly; copying via shell is sufficient.
- Do not set `AUTH_SECRET` / `DATABASE_URL` unless the user explicitly wants login/admin now.
