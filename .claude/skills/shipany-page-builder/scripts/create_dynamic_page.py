#!/usr/bin/env python3
"""
Create ShipAny dynamic page JSON files and register them in `localeMessagesPaths`.

This script is intentionally conservative:
- Creates missing directories
- Refuses to overwrite unless --force
- Avoids duplicating `localeMessagesPaths` entries

Example:
  python .claude/skills/shipany-page-builder/scripts/create_dynamic_page.py \
    --route "/features/ai-image-generator" \
    --title "AI Image Generator" \
    --description "Generate images with AI models, support text-to-image and image-to-image." \
    --keywords "text-to-image,image-to-image,batch,styles" \
    --sections "hero,introduce,benefits,features,faq,cta"
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


def _repo_root_from_this_file() -> Path:
    # .../.claude/skills/shipany-page-builder/scripts/create_dynamic_page.py
    # parents[0]=scripts, [1]=shipany-page-builder, [2]=skills, [3]=.claude, [4]=repo root
    return Path(__file__).resolve().parents[4]


def _normalize_route(route_or_url: str) -> str:
    raw = (route_or_url or "").strip()
    if not raw:
        raise ValueError("route is required")

    # Accept full URL inputs; use only path.
    if "://" in raw:
        parsed = urlparse(raw)
        raw = parsed.path or "/"

    # Strip query/hash if user accidentally passed them in a path-like string.
    raw = raw.split("?", 1)[0].split("#", 1)[0]

    if not raw.startswith("/"):
        raw = "/" + raw

    # Strip locale prefix (/en, /zh) if present.
    for prefix in ("/en", "/zh"):
        if raw == prefix:
            raw = "/"
        elif raw.startswith(prefix + "/"):
            raw = raw[len(prefix) :]
            break

    # Collapse duplicate slashes.
    raw = re.sub(r"/{2,}", "/", raw)

    return raw


def _slug_from_route(route: str) -> str:
    slug = route.strip().strip("/")
    if not slug:
        raise ValueError("route resolves to empty slug; refusing to generate root page")
    if "." in slug:
        raise ValueError(f"slug must not contain '.': {slug}")
    return slug


def _parse_csv(value: str) -> list[str]:
    raw = (value or "").strip()
    if not raw:
        return []
    return [p.strip() for p in raw.split(",") if p.strip()]

def _sanitize_json_text(value: Any) -> str:
    """
    Ensure text is safe to embed in JSON:
    - Coerce to string
    - Remove ASCII control characters that can cause downstream tooling issues
      (JSON serializer would escape some, but we keep the output clean)
    - Ensure the result is valid UTF-8 (replace invalid sequences)
    """
    if value is None:
        return ""
    s = str(value)
    # Drop NULL and other control chars except tab/newline/carriage-return.
    s = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", s)
    # Normalize newlines.
    s = s.replace("\r\n", "\n").replace("\r", "\n")
    # Ensure UTF-8 encodable text (replace invalid).
    s = s.encode("utf-8", errors="replace").decode("utf-8", errors="replace")
    return s

def _sanitize_list(values: list[Any]) -> list[str]:
    return [_sanitize_json_text(v) for v in values if _sanitize_json_text(v)]


def _read_configured_locales(repo_root: Path) -> list[str]:
    """
    Read locales from `src/config/locale/index.ts`.

    Preference order:
    1) Keys of `export const localeNames = { ... }`
    2) Values of `export const locales = [...]`
    """
    path = repo_root / "src/config/locale/index.ts"
    text = path.read_text(encoding="utf-8")

    # 1) localeNames object keys
    m = re.search(r"export\s+const\s+localeNames[^=]*=\s*\{([\s\S]*?)\};", text)
    if m:
        body = m.group(1)
        keys = re.findall(r"^\s*([A-Za-z0-9_-]+)\s*:\s*", body, flags=re.MULTILINE)
        keys = [k for k in keys if k]
        if keys:
            return keys

    # 2) locales array
    m = re.search(r"export\s+const\s+locales\s*=\s*\[([^\]]*?)\]\s*;", text)
    if m:
        body = m.group(1)
        keys = re.findall(r"['\"]([^'\"]+)['\"]", body)
        keys = [k.strip() for k in keys if k.strip()]
        if keys:
            return keys

    raise RuntimeError(f"Could not parse configured locales from {path}")


def _parse_csv(value: str) -> list[str]:
    raw = (value or "").strip()
    if not raw:
        return []
    return [p.strip() for p in raw.split(",") if p.strip()]


def _todo(s: str) -> str:
    return f"TODO: {s}"

def _picsum_seedify(value: str) -> str:
    """
    picsum.photos seed must be a single URL path segment (no slashes).
    Convert arbitrary strings (e.g. "foo/bar") into a safe segment.
    """
    s = (value or "").strip()
    if not s:
        s = "seed"
    # Replace path separators and whitespace with hyphens.
    s = re.sub(r"[\/\s]+", "-", s)
    # Keep only URL-safe-ish characters for a path segment.
    s = re.sub(r"[^A-Za-z0-9._-]+", "-", s)
    # Collapse repeats and trim.
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s or "seed"

def _picsum_seed_url(seed: str, w: int, h: int) -> str:
    # Deterministic placeholder image.
    safe_seed = _picsum_seedify(seed)
    return f"https://picsum.photos/seed/{safe_seed}/{w}/{h}"


def _build_page_payload(
    *,
    locale: str,
    base_locale: str,
    title: str,
    description: str,
    keywords: list[str],
    slug: str,
    cta_url: str,
    sections: list[str],
) -> dict[str, Any]:
    if locale != base_locale:
        # Do not auto-translate inside tooling. Keep placeholders explicit.
        if title:
            title = f"{title}（{_todo('translate')}）"
        if description:
            description = f"{description}（{_todo('translate')}）"

    # Seed items from keywords (best-effort). Keep safe fallbacks.
    seed = keywords[:]
    if not seed:
        seed = ["Feature 1", "Feature 2", "Feature 3"]

    def make_item(i: int, label: str) -> dict[str, Any]:
        return {
            "title": label,
            "description": _todo(f"describe '{label}'"),
            "icon": "Sparkles",
            "image": {"src": _picsum_seed_url(f"{slug}-item-{i}", 800, 600), "alt": label},
        }

    introduce_items = [make_item(i, label) for i, label in enumerate(seed[:4])]
    benefits_items = [make_item(i + 10, label) for i, label in enumerate(seed[:3])]
    features_items = [
        {"title": label, "description": _todo(f"describe '{label}'"), "icon": "Sparkles"}
        for label in seed[:6]
    ]

    payload: dict[str, Any] = {
        "metadata": {
            "title": _sanitize_json_text(title),
            "description": _sanitize_json_text(description),
        },
        "page": {
            "title": _sanitize_json_text(title),
            "show_sections": sections,
            "sections": {},
        },
    }

    # Build sections dynamically based on `sections` list.
    out_sections: dict[str, Any] = {}
    for section_key in sections:
        if section_key == "hero":
            out_sections["hero"] = {
                "id": "hero",
                "title": _sanitize_json_text(title),
                "description": _sanitize_json_text(description),
                "buttons": [{"title": "Get Started", "url": cta_url, "icon": "Zap"}],
                # Always placeholder images (no /public edits)
                "image": {
                    "src": _picsum_seed_url(f"{slug}-hero", 1200, 800),
                    "alt": "hero",
                    "width": 1200,
                    "height": 800,
                },
                "background_image": {
                    "src": _picsum_seed_url(f"{slug}-bg", 1600, 900),
                    "alt": "background",
                },
            }
        elif section_key == "introduce":
            out_sections["introduce"] = {
                "block": "features-list",
                "id": "introduce",
                "title": _todo("Introduce title"),
                "description": _todo("Introduce description"),
                "image": {
                    "src": _picsum_seed_url(f"{slug}-introduce", 1200, 800),
                    "alt": "introduce",
                },
                "items": introduce_items,
                "className": "bg-muted",
            }
        elif section_key == "benefits":
            out_sections["benefits"] = {
                "block": "features-accordion",
                "id": "benefits",
                "title": _todo("Benefits title"),
                "description": _todo("Benefits description"),
                "items": benefits_items,
            }
        elif section_key == "features":
            out_sections["features"] = {
                "id": "features",
                "title": "Features",
                "description": _todo("write a short features summary"),
                "items": features_items,
            }
        elif section_key == "faq":
            out_sections["faq"] = {
                "id": "faq",
                "title": "FAQ",
                "description": _todo("write a short FAQ intro"),
                "items": [
                    {"question": _todo("question 1"), "answer": _todo("answer 1")},
                    {"question": _todo("question 2"), "answer": _todo("answer 2")},
                    {"question": _todo("question 3"), "answer": _todo("answer 3")},
                ],
            }
        elif section_key == "cta":
            out_sections["cta"] = {
                "id": "cta",
                "title": _todo("CTA title"),
                "description": _todo("CTA description"),
                "buttons": [{"title": "Get Started", "url": cta_url, "icon": "Zap"}],
                "className": "bg-muted",
            }
        else:
            # Unknown section key: keep it disabled but present for user to fill in.
            out_sections[section_key] = {
                "id": section_key,
                "disabled": True,
                "title": _todo(f"section '{section_key}' title"),
                "description": _todo(f"section '{section_key}' description"),
            }

    payload["page"]["sections"] = out_sections
    return payload


def _write_json(path: Path, data: dict[str, Any], *, force: bool) -> None:
    if path.exists() and not force:
        raise FileExistsError(f"Refusing to overwrite existing file (use --force): {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _ensure_locale_messages_path(repo_root: Path, slug: str, *, dry_run: bool) -> bool:
    """
    Ensure `'pages/<slug>'` exists in src/config/locale/index.ts localeMessagesPaths.
    Returns True if file was modified.
    """
    target = repo_root / "src/config/locale/index.ts"
    text = target.read_text(encoding="utf-8")
    entry_single = f"'pages/{slug}'"
    entry_double = f"\"pages/{slug}\""
    if entry_single in text or entry_double in text:
        return False

    start = text.find("export const localeMessagesPaths = [")
    if start < 0:
        raise RuntimeError("Could not find localeMessagesPaths array in src/config/locale/index.ts")
    end = text.find("];", start)
    if end < 0:
        raise RuntimeError("Could not find end of localeMessagesPaths array in src/config/locale/index.ts")

    insertion = f"  'pages/{slug}',\n"
    # Insert just before the closing bracket.
    new_text = text[:end] + insertion + text[end:]

    if dry_run:
        return True

    target.write_text(new_text, encoding="utf-8")
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--route", required=True, help='Route path like "/features/ai-image-generator"')
    parser.add_argument("--title", required=True, help="Page title")
    parser.add_argument("--description", required=True, help="Page description (can include <br/>)")
    parser.add_argument(
        "--locales",
        default="",
        help="Comma-separated locales to generate (must be configured in src/config/locale/index.ts). Default: all configured locales.",
    )
    parser.add_argument("--keywords", default="", help='Comma-separated keywords (used to seed features), e.g. "a,b,c"')
    parser.add_argument(
        "--sections",
        default="hero,introduce,benefits,features,faq,cta",
        help='Comma-separated sections to include, default "hero,introduce,benefits,features,faq,cta".',
    )
    parser.add_argument("--cta-url", default="#get-started", help='Default CTA URL (hash or route), e.g. "#create"')
    parser.add_argument("--force", action="store_true", help="Overwrite existing JSON files")
    parser.add_argument("--dry-run", action="store_true", help="Print planned changes without writing files")
    args = parser.parse_args()

    route = _normalize_route(args.route)
    slug = _slug_from_route(route)
    title = _sanitize_json_text(args.title)
    description = _sanitize_json_text(args.description)
    keywords = _sanitize_list(_parse_csv(args.keywords))
    sections = _sanitize_list(_parse_csv(args.sections)) or [
        "hero",
        "introduce",
        "benefits",
        "features",
        "faq",
        "cta",
    ]

    repo_root = _repo_root_from_this_file()
    configured_locales = _read_configured_locales(repo_root)
    if args.locales.strip():
        requested = _sanitize_list(_parse_csv(args.locales))
        bad = [l for l in requested if l not in configured_locales]
        if bad:
            raise ValueError(f"Requested locales not configured in localeNames: {bad}")
        locales = requested
    else:
        locales = configured_locales

    if not locales:
        raise RuntimeError("No locales to generate (check src/config/locale/index.ts)")
    base_locale = "en" if "en" in locales else locales[0]

    # 1) Register localeMessagesPaths
    would_update_index = _ensure_locale_messages_path(repo_root, slug, dry_run=args.dry_run)

    # 2) Create JSON files
    created_files: list[Path] = []
    for locale in locales:
        out_path = repo_root / f"src/config/locale/messages/{locale}/pages/{slug}.json"
        payload = _build_page_payload(
            locale=locale,
            base_locale=base_locale,
            title=title,
            description=description,
            keywords=keywords,
            slug=slug,
            cta_url=args.cta_url,
            sections=sections,
        )
        if args.dry_run:
            created_files.append(out_path)
        else:
            _write_json(out_path, payload, force=args.force)
            created_files.append(out_path)

    # Output
    if args.dry_run:
        print("[dry-run] Would ensure localeMessagesPaths contains:", f"pages/{slug}")
        if would_update_index:
            print("[dry-run] Would update:", repo_root / "src/config/locale/index.ts")
        else:
            print("[dry-run] Already present:", repo_root / "src/config/locale/index.ts")
        for p in created_files:
            print("[dry-run] Would write:", p)
    else:
        if would_update_index:
            print("Updated:", repo_root / "src/config/locale/index.ts")
        else:
            print("No change:", repo_root / "src/config/locale/index.ts")
        for p in created_files:
            print("Wrote:", p)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())


