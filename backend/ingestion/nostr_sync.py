"""
Nostr sync — fetch ALL event kinds from configured relays, normalize, index.

Supports: kind 0 (metadata), kind 1 (notes), kind 30023 (articles),
kind 6 (reposts), kind 7 (reactions), kind 35128 (manifests), and more.
Any event with >= min_content_length chars gets indexed.
"""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass, field
from typing import Optional

import websocket

from app.config import get_settings

log = logging.getLogger(__name__)

# Kinds to fetch from relays. Broad coverage for semantic search.
FETCH_KINDS = [0, 1, 6, 7, 14, 30023, 35128]

# Human-readable kind labels
KIND_LABELS = {
    0: "metadata",
    1: "note",
    6: "repost",
    7: "reaction",
    14: "channel",
    30023: "article",
    35128: "manifest",
}


@dataclass
class NormalizedNote:
    """Unified representation of any Nostr event."""

    event_id: str
    pubkey: str
    content: str
    created_at: int
    kind: int = 1
    hashtags: list[str] = field(default_factory=list)
    source_type: str = "nostr_note"
    title: str = ""
    summary: str = ""
    d_tag: str = ""


def fetch_all_notes(
    pubkeys: list[str] | None = None,
    relay_urls: list[str] | None = None,
    limit_per_pubkey: int = 2000,
    timeout: float = 10.0,
    since: int = 0,
) -> list[NormalizedNote]:
    """Fetch events of all supported kinds for configured pubkeys.

    Args:
        since: Unix timestamp. Only fetch events newer than this. 0 = fetch all.
    """
    settings = get_settings()
    pubkeys = pubkeys or settings.pubkey_list
    relay_urls = relay_urls or settings.relay_list

    seen_ids: set[str] = set()
    all_notes: list[NormalizedNote] = []

    for pubkey in pubkeys:
        filter_obj: dict = {
            "kinds": FETCH_KINDS,
            "authors": [pubkey],
            "limit": limit_per_pubkey,
        }
        # Incremental: only fetch events after last sync
        if since:
            filter_obj["since"] = since

        for relay_url in relay_urls:
            try:
                raw_events = _query_relay(relay_url, filter_obj, timeout=timeout)
                for ev in raw_events:
                    ev_id = ev.get("id", "")
                    if ev_id and ev_id not in seen_ids:
                        seen_ids.add(ev_id)
                        note = _normalize_event(ev, settings.pubkey_label_map)
                        if note:
                            all_notes.append(note)
                log.info("relay %s: got events for %s (%d total)", relay_url, pubkey[:8], len(all_notes))
            except Exception as e:
                log.warning("relay %s failed: %s", relay_url, e)
                continue

    all_notes.sort(key=lambda n: n.created_at, reverse=True)
    mode = "incremental" if since else "full"
    log.info("fetched %d events from %d pubkeys (%s sync)", len(all_notes), len(pubkeys), mode)
    return all_notes


def _normalize_event(event: dict, label_map: dict[str, str]) -> Optional[NormalizedNote]:
    """Convert any Nostr event into a NormalizedNote.

    Returns None if content is too short or empty.
    """
    settings = get_settings()
    kind = event.get("kind", 0)
    content = event.get("content", "")
    tags = event.get("tags", [])
    event_id = event.get("id", "")
    pubkey = event.get("pubkey", "")
    created_at = event.get("created_at", 0)

    # Kind 0 (metadata) — use the about field as content if present
    if kind == 0:
        try:
            meta = json.loads(content) if content else {}
            parts = []
            if meta.get("name"):
                parts.append(f"Name: {meta['name']}")
            if meta.get("display_name"):
                parts.append(f"Display: {meta['display_name']}")
            if meta.get("about"):
                parts.append(f"About: {meta['about']}")
            if meta.get("website"):
                parts.append(f"Website: {meta['website']}")
            if meta.get("nip05"):
                parts.append(f"NIP-05: {meta['nip05']}")
            content = "\n".join(parts)
        except json.JSONDecodeError:
            pass

    # Kind 6 (repost) — use the reposted content if our content is empty
    if kind == 6 and not content.strip():
        # Try to get content from the reposted event tag
        for tag in tags:
            if len(tag) >= 2 and tag[0] == "e":
                content = f"[Repost of event {tag[1][:16]}...]"
                break

    # Kind 7 (reaction) — often just an emoji, skip if too short
    if kind == 7 and len(content.strip()) < settings.min_content_length:
        return None

    # Filter short content
    if len(content.strip()) < settings.min_content_length:
        return None

    # Filter raw JSON that slipped through (kind 0 with unparsed JSON)
    if content.strip().startswith('{"') and content.strip().endswith('}'):
        try:
            json.loads(content)
            return None  # Raw JSON, not useful for search
        except json.JSONDecodeError:
            pass

    hashtags = [t[1] for t in tags if len(t) >= 2 and t[0] == "t"]
    kind_label = KIND_LABELS.get(kind, f"kind:{kind}")

    if kind == 30023:
        title = next((t[1] for t in tags if t[0] == "title"), "")
        summary = next((t[1] for t in tags if t[0] == "summary"), "")
        d_tag = next((t[1] for t in tags if t[0] == "d"), "")
        full_content = f"# {title}\n\n{content}" if title else content

        return NormalizedNote(
            event_id=event_id,
            pubkey=pubkey,
            content=full_content,
            created_at=created_at,
            kind=kind,
            hashtags=hashtags,
            source_type="nostr_article",
            title=title,
            summary=summary,
            d_tag=d_tag,
        )

    return NormalizedNote(
        event_id=event_id,
        pubkey=pubkey,
        content=content,
        created_at=created_at,
        kind=kind,
        hashtags=hashtags,
        source_type=f"nostr_{kind_label}",
    )


def _query_relay(
    relay_url: str,
    filter_obj: dict,
    timeout: float = 10.0,
) -> list[dict]:
    """Send a REQ to a relay, collect events until EOSE or timeout."""
    sub_id = "rag_" + str(int(time.time()))
    events: list[dict] = []

    ws = websocket.create_connection(relay_url, timeout=timeout)
    try:
        req = json.dumps(["REQ", sub_id, filter_obj])
        ws.send(req)

        deadline = time.time() + timeout
        while time.time() < deadline:
            remaining = deadline - time.time()
            if remaining <= 0:
                break
            ws.settimeout(remaining)
            try:
                raw = ws.recv()
                if not raw:
                    break
                data = json.loads(raw)
                if data[0] == "EVENT" and len(data) >= 3:
                    events.append(data[2])
                elif data[0] == "EOSE":
                    break
                elif data[0] == "NOTICE":
                    log.debug("relay notice: %s", data[1] if len(data) > 1 else "")
                    break
            except websocket.WebSocketTimeoutException:
                break
    finally:
        try:
            ws.send(json.dumps(["CLOSE", sub_id]))
            ws.close()
        except Exception:
            pass

    return events


async def sync_and_index(hf_api_key: str = "", full: bool = False) -> int:
    """Fetch events and index them into Qdrant. Returns count of indexed events.

    Args:
        full: If True, fetch all events. If False, only fetch new events since last sync.
    """
    from ingestion.embedder import embed_texts
    from ingestion.indexer import ensure_collection, build_note_point, upsert_points
    from ingestion.sync_state import load_sync_state, update_sync_timestamps

    settings = get_settings()

    # Determine since timestamp per pubkey (use oldest across all pubkeys for simplicity)
    since = 0
    if not full:
        state = load_sync_state()
        if state:
            # Use minimum timestamp — sync from the least-recently-synced pubkey
            since = min(state.values())
            log.info("incremental sync since %d", since)

    notes = fetch_all_notes(since=since)
    if not notes:
        log.warning("no events fetched")
        if not full:
            # Still update sync timestamps so next incremental doesn't re-check
            update_sync_timestamps(settings.pubkey_list)
        return 0

    log.info("embedding %d events...", len(notes))
    contents = [n.content for n in notes]
    vectors = await embed_texts(contents, api_key=hf_api_key)

    label_map = settings.pubkey_label_map
    points = []
    for note, vector in zip(notes, vectors):
        if vector is None:
            continue
        point = build_note_point(
            event_id=note.event_id,
            vector=vector,
            pubkey=note.pubkey,
            content=note.content,
            created_at=note.created_at,
            hashtags=note.hashtags,
            author_label=label_map.get(note.pubkey, ""),
            source_type=note.source_type,
            kind=note.kind,
        )
        points.append(point)

    client = ensure_collection()
    count = upsert_points(points, client=client)
    log.info("indexed %d events", count)

    # Update sync state after successful index
    update_sync_timestamps(settings.pubkey_list)

    return count


if __name__ == "__main__":
    import asyncio

    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    notes = fetch_all_notes(limit_per_pubkey=10, timeout=10.0)
    for n in notes[:10]:
        print(f"  [{n.source_type}] {n.event_id[:12]}... ({n.created_at}) {n.content[:80]}...")
    print(f"\nTotal: {len(notes)} events")
