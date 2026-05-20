"""
Pubkey profile page — shows soul file, compact hint, and metadata for a user.

Accessible via /{label} (e.g. /au9913) or /{npub} (e.g. /npub1...).
"""

from __future__ import annotations

import logging
import re

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

from app.config import get_settings
from ingestion.pubkey_meta import load_metadata
from ingestion.soul_generator import load_hints, load_micros, load_soul

log = logging.getLogger(__name__)
router = APIRouter()

# --- Bech32 encoding for npub ---

BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"


def _bech32_polymod(values: list[int]) -> int:
    GEN = [0x3B6A57B2, 0x26508E6D, 0x1EA119FA, 0x3D4233DD, 0x2A1462B3]
    chk = 1
    for v in values:
        b = chk >> 25
        chk = ((chk & 0x1FFFFFF) << 5) ^ v
        for i in range(5):
            chk ^= GEN[i] if ((b >> i) & 1) else 0
    return chk


def _bech32_hrp_expand(hrp: str) -> list[int]:
    return [ord(x) >> 5 for x in hrp] + [0] + [ord(x) & 31 for x in hrp]


def _bech32_create_checksum(hrp: str, data: list[int]) -> list[int]:
    values = _bech32_hrp_expand(hrp) + data
    polymod = _bech32_polymod(values + [0, 0, 0, 0, 0, 0]) ^ 1
    return [(polymod >> 5 * (5 - i)) & 31 for i in range(6)]


def _convertbits(data: bytes, frombits: int, tobits: int, pad: bool = True) -> list[int]:
    acc = 0
    bits = 0
    ret = []
    maxv = (1 << tobits) - 1
    for value in data:
        if value < 0 or (value >> frombits):
            return []
        acc = (acc << frombits) | value
        bits += frombits
        while bits >= tobits:
            bits -= tobits
            ret.append((acc >> bits) & maxv)
    if pad:
        if bits:
            ret.append((acc << (tobits - bits)) & maxv)
    return ret


def hex_to_npub(hex_pubkey: str) -> str:
    """Convert hex pubkey to npub (bech32)."""
    data = bytes.fromhex(hex_pubkey)
    converted = _convertbits(data, 8, 5)
    checksum = _bech32_create_checksum("npub", converted)
    return "npub1" + "".join(BECH32_CHARSET[d] for d in converted + checksum)


# --- Simple markdown → HTML renderer ---

def _md_to_html(text: str) -> str:
    """Render basic markdown to HTML. Handles headers, bold, italic, lists, code, paragraphs."""
    html = text
    html = html.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    # Headers (must be before other processing)
    # No \n between header and div — would become <br> and break nextElementSibling
    html = re.sub(r"^### (.+)$", r'<h4>\1</h4>', html, flags=re.MULTILINE)
    html = re.sub(r"^## (.+)$", r'<h3 class="section-toggle">\1 ▾</h3><div>', html, flags=re.MULTILINE)
    html = re.sub(r"^# (.+)$", r'<h2 class="section-toggle">\1 ▾</h2><div>', html, flags=re.MULTILINE)

    # Close section divs: every ## or # header closes the previous div and opens a new one
    # We'll handle this with a post-pass

    # Bold + italic
    html = re.sub(r"\*\*\*(.+?)\*\*\*", r"<strong><em>\1</em></strong>", html)
    # Bold
    html = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html)
    # Italic
    html = re.sub(r"(?<!\*)\*(.+?)\*(?!\*)", r"<em>\1</em>", html)
    # Inline code
    html = re.sub(r"`([^`]+)`", r"<code>\1</code>", html)
    # Unordered lists
    html = re.sub(r"^[\-•] (.+)$", r"<li>\1</li>", html, flags=re.MULTILINE)
    # Wrap consecutive <li> in <ul>
    html = re.sub(r"((?:<li>.*?</li>\n?)+)", r"<ul>\1</ul>", html)

    # Paragraphs: double newline
    html = re.sub(r"\n\n", "</p><p>", html)
    html = re.sub(r"\n", "<br>", html)

    # Wrap sections: close div before next section-toggle or end
    html = html.replace('<h2 class="section-toggle"', '</div><h2 class="section-toggle"')
    html = html.replace('<h3 class="section-toggle"', '</div><h3 class="section-toggle"')

    # Remove leading </div> if it's the first one
    if html.startswith("</div>"):
        html = html[6:]

    # Close last open div
    html += "</div>"

    return html


# --- Route ---

def _find_pubkey(identifier: str) -> str | None:
    """Resolve a label (case-insensitive) or npub to a hex pubkey."""
    settings = get_settings()
    label_map = settings.pubkey_label_map

    # Try label match
    for pk, label in label_map.items():
        if label.lower() == identifier.lower():
            return pk

    # Try npub decode
    if identifier.startswith("npub1"):
        # Decode bech32 npub back to hex
        try:
            hrp = "npub"
            data_str = identifier[5:]
            data = [BECH32_CHARSET.index(c) for c in data_str]
            # Verify checksum
            if _bech32_polymod(_bech32_hrp_expand(hrp) + data) != 1:
                return None
            # Convert 5-bit to 8-bit
            converted = _convertbits(bytes(data[:-6]), 5, 8, pad=False)
            if converted is not None:
                hex_pk = bytes(converted).hex()
                if hex_pk in [pk for pk in settings.pubkey_list]:
                    return hex_pk
        except (ValueError, IndexError):
            return None

    return None


@router.get("/p/{identifier}", response_class=HTMLResponse)
async def pubkey_profile(identifier: str):
    """Profile page: /p/{label} or /p/{npub}. Shows rendered soul file + hint."""
    pubkey = _find_pubkey(identifier)
    if not pubkey:
        return HTMLResponse("<h1>Profile not found</h1><a href='/'>← Back</a>", status_code=404)

    settings = get_settings()
    label_map = settings.pubkey_label_map

    label = label_map.get(pubkey, pubkey[:8])
    meta = load_metadata().get(pubkey, {})
    soul = load_soul(pubkey)
    hints = load_hints()
    micros = load_micros()
    hint = hints.get(pubkey, "")
    micro = micros.get(pubkey, "")

    name = meta.get("name") or meta.get("display_name") or label
    picture = meta.get("picture", "")
    npub = hex_to_npub(pubkey)

    # Strip leading `# title` lines and `> Generated from...` boilerplate
    def _strip_title(md: str) -> str:
        md = re.sub(r"^> Generated from .+\n*", "", md, flags=re.MULTILINE)
        return re.sub(r"^# .+\n*", "", md, flags=re.MULTILINE)

    soul_html = _md_to_html(_strip_title(soul)) if soul else "<p>No soul file generated yet.</p>"
    hint_html = _md_to_html(_strip_title(hint)) if hint else "<p>No hint generated yet.</p>"

    return f"""<!DOCTYPE html>
<html>
<head>
    <title>{name} — Nostr Soul</title>
    <style>
        * {{ box-sizing: border-box; }}
        body {{ font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 1.5em;
               background: #0f1117; color: #ddd; }}
        a {{ color: #6ee7b7; text-decoration: none; }}
        a:hover {{ text-decoration: underline; }}
        .back {{ font-size: 0.85rem; color: #666; margin-bottom: 1em; display: inline-block; }}
        .back:hover {{ color: #6ee7b7; }}
        .header {{ display: flex; align-items: center; gap: 1em; margin-bottom: 1.5em; }}
        .header img {{ width: 64px; height: 64px; border-radius: 50%; object-fit: cover; }}
        .header .no-pfp {{ width: 64px; height: 64px; border-radius: 50%; background: #1a1a2e;
                           display: flex; align-items: center; justify-content: center;
                           font-size: 1.5rem; color: #6ee7b7; }}
        .header h1 {{ margin: 0; color: #6ee7b7; font-size: 1.5rem; }}
        .header .label {{ color: #888; font-size: 0.9rem; }}
        .header .npub {{ font-size: 0.75rem; color: #555; word-break: break-all; margin-top: 0.3em; }}
        .micro {{ background: #1a1a2e; border: 1px solid #333; border-radius: 6px;
                  padding: 0.8em 1em; margin-bottom: 1.5em; font-style: italic; color: #aaa;
                  line-height: 1.4; }}
        .content {{ line-height: 1.6; }}
        .content h2 {{ color: #6ee7b7; font-size: 1.1rem; border-bottom: 1px solid #222;
                       padding: 0.5em 0 0.3em; cursor: pointer; margin-top: 1.2em; }}
        .content h2:hover {{ color: #5cd6a8; }}
        .content h3 {{ color: #6ee7b7; font-size: 1rem; border-bottom: 1px solid #1a1a1a;
                       padding: 0.4em 0 0.2em; cursor: pointer; margin-top: 1em; }}
        .content h3:hover {{ color: #5cd6a8; }}
        .content h4 {{ color: #93c5fd; font-size: 0.95rem; margin-top: 0.8em; }}
        .content strong {{ color: #eee; }}
        .content em {{ color: #bbb; }}
        .content code {{ background: #1a1a2e; padding: 0.1em 0.3em; border-radius: 3px; font-size: 0.9em; }}
        .content ul {{ padding-left: 1.5em; margin: 0.3em 0; }}
        .content li {{ margin: 0.2em 0; color: #ccc; }}
        .content p {{ margin: 0.4em 0; }}
        .collapsed {{ display: none; }}
        .section-block {{ margin-bottom: 1em; padding: 0.5em 0; border-bottom: 1px solid #1a1a1a; }}
        .section-block h2 {{ margin: 0; }}
    </style>
    <script>
        document.addEventListener('click', function(e) {{
            if (e.target.classList.contains('section-toggle')) {{
                e.target.nextElementSibling.classList.toggle('collapsed');
            }}
        }});
    </script>
</head>
<body>
    <a class="back" href="/">← Back to chat</a>

    <div class="header">
        {"<img src='" + picture + "'>" if picture else '<div class="no-pfp">' + name[0].upper() + '</div>'}
        <div>
            <h1>{name}</h1>
            <div class="label">{label} · <a href="https://primal.net/p/{npub}" target="_blank">primal.net ↗</a></div>
            <div class="npub">{npub}</div>
        </div>
    </div>

    {"<div class='micro'>" + micro + "</div>" if micro else ""}

    <div class="content">
        <div class="section-block">
            <h2 class="section-toggle">Compact Profile ▾</h2>
            <div>{hint_html}</div>
        </div>

        <div class="section-block">
            <h2 class="section-toggle">Full Soul File ▾</h2>
            <div class="collapsed">{soul_html}</div>
        </div>
    </div>
</body>
</html>"""
