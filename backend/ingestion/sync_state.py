"""
Sync state tracker — records last successful sync per pubkey.

Enables incremental sync: only fetch events newer than last sync.
"""

from __future__ import annotations

import json
import logging
import time
from pathlib import Path

log = logging.getLogger(__name__)

STATE_FILE = Path("data/sync_state.json")


def load_sync_state() -> dict[str, int]:
    """Load sync state. Returns pubkey -> last_sync_timestamp mapping."""
    if STATE_FILE.exists():
        try:
            data = json.loads(STATE_FILE.read_text())
            return data.get("pubkeys", {})
        except json.JSONDecodeError:
            pass
    return {}


def save_sync_state(state: dict[str, int]) -> None:
    """Persist sync state to disk."""
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps({
        "pubkeys": state,
        "last_sync": int(time.time()),
    }, indent=2))


def get_last_sync(pubkey: str) -> int:
    """Get last sync timestamp for a pubkey. Returns 0 if never synced."""
    return load_sync_state().get(pubkey, 0)


def update_sync_timestamps(pubkeys: list[str]) -> None:
    """Update sync timestamps for all listed pubkeys to now."""
    state = load_sync_state()
    now = int(time.time())
    for pk in pubkeys:
        state[pk] = now
    save_sync_state(state)
    log.info("sync state updated for %d pubkeys", len(pubkeys))
