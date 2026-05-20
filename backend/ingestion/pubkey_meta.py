"""
Pubkey metadata cache — fetches kind 0 events from relays for profile pics and names.

Stores cached metadata in data/pubkey_meta.json:
{
  "pubkey_hex": {
    "name": "...",
    "display_name": "...",
    "picture": "https://...",
    "about": "...",
    "nip05": "...",
    "lud16": "..."
  }
}
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

from app.config import get_settings

log = logging.getLogger(__name__)

META_FILE = Path("data/pubkey_meta.json")


def _fetch_meta_from_relay(relay_url: str, pubkey: str, timeout: float = 10.0) -> dict:
    """Fetch kind 0 metadata for a pubkey from a single relay."""
    import json as _json
    import time
    import websocket

    sub_id = "meta_" + str(int(time.time()))
    ws = websocket.create_connection(relay_url, timeout=timeout)
    try:
        req = _json.dumps(["REQ", sub_id, {"kinds": [0], "authors": [pubkey], "limit": 1}])
        ws.send(req)
        deadline = time.time() + timeout
        while time.time() < deadline:
            ws.settimeout(deadline - time.time())
            try:
                raw = ws.recv()
                data = _json.loads(raw)
                if data[0] == "EVENT" and len(data) >= 3:
                    content = data[2].get("content", "{}")
                    try:
                        return _json.loads(content)
                    except _json.JSONDecodeError:
                        return {}
                elif data[0] == "EOSE":
                    break
            except websocket.WebSocketTimeoutException:
                break
    finally:
        try:
            ws.send(_json.dumps(["CLOSE", sub_id]))
            ws.close()
        except Exception:
            pass
    return {}


def fetch_and_cache_metadata() -> dict:
    """Fetch kind 0 metadata for all configured pubkeys. Returns the cached dict."""
    settings = get_settings()
    relay_urls = settings.relay_list

    # Load existing cache
    cache = {}
    if META_FILE.exists():
        try:
            cache = json.loads(META_FILE.read_text())
        except json.JSONDecodeError:
            pass

    for pubkey in settings.pubkey_list:
        label = settings.pubkey_label_map.get(pubkey, pubkey[:8])

        # Skip if already cached with picture
        if pubkey in cache and cache[pubkey].get("picture"):
            log.info("cached meta for %s: %s", label, cache[pubkey].get("name", "?"))
            continue

        log.info("fetching metadata for %s (%s)...", label, pubkey[:12])
        meta = {}
        for relay_url in relay_urls:
            try:
                meta = _fetch_meta_from_relay(relay_url, pubkey)
                if meta:
                    break
            except Exception as e:
                log.debug("relay %s failed for %s: %s", relay_url, label, e)
                continue

        if meta:
            cache[pubkey] = {
                "name": meta.get("name", ""),
                "display_name": meta.get("display_name", ""),
                "picture": meta.get("picture", ""),
                "about": meta.get("about", ""),
                "nip05": meta.get("nip05", ""),
                "lud16": meta.get("lud16", ""),
            }
            log.info("fetched meta for %s: name=%s, pfp=%s",
                     label, meta.get("name", "?"),
                     "yes" if meta.get("picture") else "no")
        else:
            # Fallback: use label as name, no pfp
            if pubkey not in cache:
                cache[pubkey] = {"name": label, "picture": ""}
            log.warning("no metadata found for %s", label)

    # Save cache
    META_FILE.parent.mkdir(parents=True, exist_ok=True)
    META_FILE.write_text(json.dumps(cache, indent=2))
    log.info("cached metadata for %d pubkeys", len(cache))
    return cache


def load_metadata() -> dict:
    """Load cached pubkey metadata. Returns pubkey -> {name, picture, ...}."""
    if META_FILE.exists():
        try:
            return json.loads(META_FILE.read_text())
        except json.JSONDecodeError:
            pass
    return {}
