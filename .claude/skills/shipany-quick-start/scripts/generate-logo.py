#!/usr/bin/env python3
"""
Generate `public/logo.png` and `public/favicon.ico` for ShipAny Quick Start.

Primary path:
- Uses Pillow (PIL) to render a simple text mark: first character of brand name.

Fallback path (when Pillow is unavailable or generation fails, e.g. some Windows setups):
- Writes simple solid-color placeholder images so we never keep the template defaults.
"""

from __future__ import annotations

import argparse
import os
import struct
import sys
import zlib
from pathlib import Path


def _first_char(brand_name: str) -> str:
    s = (brand_name or "").strip()
    return s[0] if s else "A"


def _parse_hex_color(value: str) -> tuple[int, int, int]:
    v = (value or "").strip()
    if not v:
        return (17, 24, 39)  # slate-900-ish
    if v.startswith("#"):
        v = v[1:]
    if len(v) == 3:
        v = "".join([c * 2 for c in v])
    if len(v) != 6:
        raise ValueError(f"Invalid hex color: {value}")
    return (int(v[0:2], 16), int(v[2:4], 16), int(v[4:6], 16))


def _repo_root_from_this_file() -> Path:
    # .../.claude/skills/shipany-quick-start/scripts/generate-logo.py
    # parents[0]=scripts, [1]=shipany-quick-start, [2]=skills, [3]=.claude, [4]=repo root
    return Path(__file__).resolve().parents[4]


def _write_solid_png(path: Path, size: int, rgb: tuple[int, int, int]) -> None:
    """Write a valid PNG without external deps (solid color, opaque)."""
    r, g, b = rgb
    # Raw image data: each row starts with filter byte 0, then RGB bytes per pixel.
    row = bytes([0] + [r, g, b] * size)
    raw = row * size
    compressed = zlib.compress(raw, level=9)

    def chunk(chunk_type: bytes, data: bytes) -> bytes:
        length = struct.pack(">I", len(data))
        crc = struct.pack(">I", zlib.crc32(chunk_type + data) & 0xFFFFFFFF)
        return length + chunk_type + data + crc

    signature = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)  # 8-bit, RGB
    png = signature + chunk(b"IHDR", ihdr) + chunk(b"IDAT", compressed) + chunk(b"IEND", b"")
    path.write_bytes(png)


def _write_solid_ico(path: Path, size: int, rgb: tuple[int, int, int]) -> None:
    """Write a minimal valid ICO (single 32-bit DIB, solid color)."""
    w = h = size
    r, g, b = rgb
    # DIB header (BITMAPINFOHEADER). Height is *2 because it includes AND mask.
    header = struct.pack(
        "<IIIHHIIIIII",
        40,  # biSize
        w,  # biWidth
        h * 2,  # biHeight (color + mask)
        1,  # biPlanes
        32,  # biBitCount
        0,  # biCompression = BI_RGB
        0,  # biSizeImage
        0,  # biXPelsPerMeter
        0,  # biYPelsPerMeter
        0,  # biClrUsed
        0,  # biClrImportant
    )

    # Pixel data is bottom-up, BGRA per pixel.
    pixel = bytes([b, g, r, 255])
    pixels = pixel * (w * h)

    # AND mask: 1bpp, rows padded to 32-bit boundary.
    mask_row_bytes = ((w + 31) // 32) * 4
    mask = b"\x00" * (mask_row_bytes * h)

    dib = header + pixels + mask

    # ICONDIR + ICONDIRENTRY
    icondir = struct.pack("<HHH", 0, 1, 1)  # reserved, type=icon, count=1
    image_offset = 6 + 16
    entry = struct.pack(
        "<BBBBHHII",
        w if w < 256 else 0,
        h if h < 256 else 0,
        0,  # color count
        0,  # reserved
        1,  # planes
        32,  # bit count
        len(dib),  # bytes in resource
        image_offset,  # offset
    )
    path.write_bytes(icondir + entry + dib)


def _try_generate_with_pillow(letter: str, rgb: tuple[int, int, int], out_logo: Path, out_favicon: Path) -> None:
    from PIL import Image, ImageDraw, ImageFont  # type: ignore

    bg = "#{:02x}{:02x}{:02x}".format(*rgb)
    fg = "#ffffff"

    # Logo
    size = 512
    logo = Image.new("RGB", (size, size), color=bg)
    draw = ImageDraw.Draw(logo)

    font_size = 300
    font_candidates = [
        # macOS
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        # Linux
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        # Windows
        "C:\\Windows\\Fonts\\arialbd.ttf",
        "C:\\Windows\\Fonts\\seguisb.ttf",
    ]
    font = None
    for fp in font_candidates:
        try:
            font = ImageFont.truetype(fp, font_size)
            break
        except Exception:
            pass
    if font is None:
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except Exception:
            font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), letter, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    pos = ((size - text_w) // 2, (size - text_h) // 2)
    draw.text(pos, letter, fill=fg, font=font)
    logo.save(out_logo, "PNG")

    # Favicon (multi-size ICO)
    favicon_sizes = [16, 32, 48]
    fav_images = []
    for s in favicon_sizes:
        fav = Image.new("RGB", (s, s), color=bg)
        fav_draw = ImageDraw.Draw(fav)
        try:
            fav_font = ImageFont.truetype(font_candidates[0], max(10, int(s * 0.65)))
        except Exception:
            try:
                fav_font = ImageFont.truetype("arial.ttf", max(10, int(s * 0.65)))
            except Exception:
                fav_font = ImageFont.load_default()
        fb = fav_draw.textbbox((0, 0), letter, font=fav_font)
        fw = fb[2] - fb[0]
        fh = fb[3] - fb[1]
        fav_pos = ((s - fw) // 2, (s - fh) // 2)
        fav_draw.text(fav_pos, letter, fill=fg, font=fav_font)
        fav_images.append(fav)
    fav_images[-1].save(out_favicon, format="ICO", sizes=[(s, s) for s in favicon_sizes])


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--brand-name", required=True, help="Brand name (used to pick first character)")
    parser.add_argument("--primary-color", default="#111827", help="Hex color like #111827")
    parser.add_argument(
        "--public-dir",
        default="public",
        help='Output directory for assets. Default "public" (repo root).',
    )
    args = parser.parse_args()

    letter = _first_char(args.brand_name)
    rgb = _parse_hex_color(args.primary_color)

    repo_root = _repo_root_from_this_file()
    public_dir = Path(args.public_dir)
    if not public_dir.is_absolute():
        public_dir = (repo_root / public_dir).resolve()
    public_dir.mkdir(parents=True, exist_ok=True)

    out_logo = public_dir / "logo.png"
    out_favicon = public_dir / "favicon.ico"

    try:
        _try_generate_with_pillow(letter, rgb, out_logo, out_favicon)
        print(f"Logo saved to {out_logo}")
        print(f"Favicon saved to {out_favicon}")
        return 0
    except Exception as e:
        # Fallback: ensure we still replace template defaults with placeholders.
        print(f"[warn] Logo/favicon generation failed, using placeholders: {e}", file=sys.stderr)
        _write_solid_png(out_logo, 512, rgb)
        _write_solid_ico(out_favicon, 16, rgb)
        print(f"Placeholder logo saved to {out_logo}")
        print(f"Placeholder favicon saved to {out_favicon}")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
