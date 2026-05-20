"""
Pubkeys endpoint — returns metadata (name, pfp, micro summary) for all configured pubkeys.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter

from app.config import get_settings
from ingestion.pubkey_meta import load_metadata
from ingestion.soul_generator import load_micros

log = logging.getLogger(__name__)
router = APIRouter()


@router.get("/pubkeys")
async def get_pubkeys() -> list[dict[str, Any]]:
    """Return metadata for all configured pubkeys (name, picture, label, micro summary)."""
    settings = get_settings()
    meta = load_metadata()
    label_map = settings.pubkey_label_map
    micros = load_micros()

    result = []
    for pubkey in settings.pubkey_list:
        m = meta.get(pubkey, {})
        result.append({
            "pubkey": pubkey,
            "name": m.get("name") or m.get("display_name") or label_map.get(pubkey, pubkey[:8]),
            "display_name": m.get("display_name", ""),
            "picture": m.get("picture", ""),
            "label": label_map.get(pubkey, ""),
            "micro": micros.get(pubkey, ""),
        })
    return result
