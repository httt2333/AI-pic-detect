# Step 5 — Logo + favicon

## Goal

Replace template visuals with minimal surface area changes (v1 hard limit).

## Files (typical)

- `public/logo.png` (existing)
- `public/favicon.ico` (existing)

## v1 rule (do not expand scope)

For the first version, **do not change asset formats** and **do not update code references**. Keep filenames stable to avoid touching files outside the v1 allowlist.

## If user provides assets

- Copy/replace into `public/`.
- Keep filenames stable (`logo.png`, `favicon.ico`) to avoid code changes.

## If user does not provide assets

- **Do not reuse the template default files.** You must generate **new** assets while keeping filenames stable:
  - Replace `public/logo.png`
  - Replace `public/favicon.ico`

### Scheduling (use the bundled generator script)

Use the bundled script to generate **both** `public/logo.png` and `public/favicon.ico`:

- macOS/Linux:
  - `python3 ".claude/skills/shipany-quick-start/scripts/generate-logo.py" --brand-name "<brandName>" --primary-color "<#RRGGBB>" --public-dir "public"`
- Windows (PowerShell / cmd):
  - `py ".claude\\skills\\shipany-quick-start\\scripts\\generate-logo.py" --brand-name "<brandName>" --primary-color "<#RRGGBB>" --public-dir "public"`

**Compatibility rule:** This script is best-effort. On some systems (commonly Windows) Pillow/fonts may be unavailable. The script will automatically fall back to writing **placeholder** `logo.png` / `favicon.ico` so we still avoid keeping template defaults.

Validation (required):

- Ensure `public/logo.png` and `public/favicon.ico` exist after running the script.
- If they do not exist, treat it as generation failure and manually replace them with **any non-template placeholder images** (do not keep the defaults).

### Text logo + favicon rule (default fallback)

If the user does not provide brand files, generate a simple **text-based** mark using the **first character** of `brandName`:

- **Letter**: the first character of the brand name (e.g. “Acme” → “A”, “星河” → “星”)
- **Style**: bold, centered, high-contrast, works at small sizes
- **Colors**: use the project’s primary brand color as background (or a dark neutral if unknown) + white/near-white letter
- **No template imagery**: do not keep or copy any ShipAny/logo defaults

Recommended outputs (still saved to the required filenames):

- `public/logo.png`: 512×512 (or 400×400), square, transparent optional but not required
- `public/favicon.ico`: multi-size ICO (at least 16×16 + 32×32; ideally include 48×48)

After generating/replacing the files, update text/alt/brand copy in `src/config/locale/messages/{locale}/landing.json`:

- `header.brand.{title,logo.alt}`
- `footer.brand.{title,logo.alt,description}`

## Update references

In v1, only update branding references inside the allowlist:

- `src/config/locale/messages/{locale}/landing.json` brand logo fields should continue to point to `/logo.png` unless the user explicitly expands scope.

## Rule

If the user wants SVG logos or wants the whole app to reference new filenames, treat it as **scope expansion** (not v1) because it requires touching code and other message files.
