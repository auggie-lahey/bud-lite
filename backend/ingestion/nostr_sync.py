"""
Nostr sync — fetch ALL event kinds from configured relays, normalize, enrich, index.

Supports: kind 0 (metadata), kind 1 (notes), kind 30023 (articles),
kind 6 (reposts), kind 7 (reactions), kind 35128 (manifests), and more.
Any event with >= min_content_length chars gets indexed.

Enrichment at index time:
  - npub/nprofile → @Username (resolved from relay metadata)
  - nevent → [quoting @Author: "content preview..."]
  - naddr → [article by @Author: "title"]
  - note1 → [note by @Author: "content preview..."]
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
import ssl
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

# Bech32 charset for decoding
BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"

# Regex patterns — (?<!/) avoids matching inside URLs (blossom subdomains)
NPUB_RE = re.compile(r"(?<!/)(?:nostr:)?npub1([a-zA-HJ-NP-Z0-9]+)")
NPROFILE_RE = re.compile(r"(?<!/)(?:nostr:)?nprofile1[a-zA-HJ-NP-Z0-9]+")
NEVENT_RE = re.compile(r"(?<!/)(?:nostr:)?nevent1[a-zA-HJ-NP-Z0-9]+")
NADDR_RE = re.compile(r"(?<!/)(?:nostr:)?naddr1[a-zA-HJ-NP-Z0-9]+")
NOTE_RE = re.compile(r"(?<!/)(?:nostr:)?note1[a-zA-HJ-NP-Z0-9]+")


# ── Bech32 decoders ──────────────────────────────────────────────────────────

def _bech32_decode_to_bytes(bech32str: str) -> bytes | None:
    """Decode any bech32 string to raw bytes (strip hrp + checksum)."""
    # Find the '1' separator
    sep = bech32str.rfind("1")
    if sep < 1:
        return None
    data_part = bech32str[sep + 1:]
    data = []
    for c in data_part:
        idx = BECH32_CHARSET.find(c)
        if idx == -1:
            return None
        data.append(idx)
    # Convert 5-bit to 8-bit, strip last 6 chars (checksum)
    payload = data[:-6]
    bits, acc, result = 0, 0, []
    for val in payload:
        acc = (acc << 5) | val
        bits += 5
        while bits >= 8:
            bits -= 8
            result.append((acc >> bits) & 255)
    return bytes(result)


def _decode_npub(npub: str) -> str | None:
    """Decode npub to hex pubkey."""
    if not npub.startswith("npub1"):
        return None
    raw = _bech32_decode_to_bytes(npub)
    return raw.hex() if raw and len(raw) == 32 else None


def _decode_nprofile(nprofile: str) -> str | None:
    """Decode nprofile TLV to hex pubkey (type 0)."""
    raw = _bech32_decode_to_bytes(nprofile.replace("nostr:", ""))
    if not raw:
        return None
    i = 0
    while i + 1 < len(raw):
        t, length = raw[i], raw[i + 1]
        if t == 0 and length == 32:
            return raw[i + 2 : i + 2 + length].hex()
        i += 2 + length
    return None


def _decode_nevent(nevent: str) -> dict | None:
    """Decode nevent TLV → {event_id, author_pk, relay}."""
    raw = _bech32_decode_to_bytes(nevent.replace("nostr:", ""))
    if not raw:
        return None
    result = {}
    i = 0
    while i + 1 < len(raw):
        t, length = raw[i], raw[i + 1]
        val = raw[i + 2 : i + 2 + length]
        if t == 0 and length == 32:
            result["event_id"] = val.hex()
        elif t == 2 and length == 32:
            result["author_pk"] = val.hex()
        elif t == 1:
            result["relay"] = val.decode("utf-8", errors="ignore")
        i += 2 + length
    return result if result.get("event_id") else None


def _decode_naddr(naddr: str) -> dict | None:
    """Decode naddr TLV → {d_tag, author_pk, kind, relay}."""
    raw = _bech32_decode_to_bytes(naddr.replace("nostr:", ""))
    if not raw:
        return None
    result = {}
    i = 0
    while i + 1 < len(raw):
        t, length = raw[i], raw[i + 1]
        val = raw[i + 2 : i + 2 + length]
        if t == 0:
            result["d_tag"] = val.decode("utf-8", errors="ignore")
        elif t == 2 and length == 32:
            result["author_pk"] = val.hex()
        elif t == 3 and length == 4:
            result["kind"] = int.from_bytes(val, "big")
        elif t == 1:
            result["relay"] = val.decode("utf-8", errors="ignore")
        i += 2 + length
    return result if result.get("d_tag") and result.get("author_pk") else None


def _decode_note1(note: str) -> str | None:
    """Decode note1 to hex event ID."""
    if not note.startswith("note1"):
        return None
    raw = _bech32_decode_to_bytes(note)
    return raw.hex() if raw and len(raw) == 32 else None


# ── Metadata and event fetching ──────────────────────────────────────────────

def _fetch_metadata_batch(pubkeys: set[str], relay_urls: list[str]) -> dict[str, str]:
    """Fetch kind:0 metadata for pubkeys from relays. Returns {hex_pk: display_name}."""
    names: dict[str, str] = {}
    if not pubkeys or not relay_urls:
        return names

    async def _fetch_batch(pk_batch: list[str]) -> dict[str, str]:
        try:
            import websockets
        except ImportError:
            return {}
        results = {}
        for relay_url in relay_urls[:2]:
            try:
                async with websockets.connect(
                    relay_url, ssl=ssl.create_default_context(), open_timeout=10
                ) as ws:
                    sub_id = "enrich_meta"
                    filt = {"kinds": [0], "authors": pk_batch, "limit": len(pk_batch)}
                    await ws.send(json.dumps(["REQ", sub_id, filt]))
                    remaining = set(pk_batch)
                    while remaining:
                        try:
                            msg = await asyncio.wait_for(ws.recv(), timeout=15)
                            ev = json.loads(msg)
                            if ev[0] == "EVENT" and ev[2].get("kind") == 0:
                                pk = ev[2].get("pubkey", "")
                                try:
                                    meta = json.loads(ev[2].get("content", "{}"))
                                except json.JSONDecodeError:
                                    meta = {}
                                name = meta.get("display_name") or meta.get("name") or pk[:8]
                                results[pk] = name
                                remaining.discard(pk)
                            elif ev[0] == "EOSE":
                                break
                        except asyncio.TimeoutError:
                            break
                    try:
                        await ws.send(json.dumps(["CLOSE", sub_id]))
                    except Exception:
                        pass
                if results:
                    break
            except Exception as e:
                log.debug("metadata relay %s failed: %s", relay_url, e)
                continue
        return results

    # Fetch in batches of 50 to avoid relay limits
    pk_list = list(pubkeys)
    batch_size = 50
    for i in range(0, len(pk_list), batch_size):
        batch = pk_list[i : i + batch_size]
        try:
            batch_results = asyncio.run(_fetch_batch(batch))
            names.update(batch_results)
        except Exception as e:
            log.warning("metadata batch %d-%d failed: %s", i, i + len(batch), e)
    return names


def _fetch_referenced_events(
    event_ids: set[str],
    naddr_refs: list[dict],
    relay_urls: list[str],
) -> dict[str, dict]:
    """Fetch referenced events by ID. Returns {event_id: {pubkey, content, kind, title}}."""
    results: dict[str, dict] = {}
    if not relay_urls:
        return results

    # Fetch by event IDs (nevent, note1)
    for relay_url in relay_urls[:2]:
        try:
            ids_list = list(event_ids)
            # Batch in groups of 50
            for i in range(0, len(ids_list), 50):
                batch = ids_list[i : i + 50]
                filt = {"ids": batch, "limit": len(batch)}
                raw_events = _query_relay(relay_url, filt, timeout=15.0)
                for ev in raw_events:
                    eid = ev.get("id", "")
                    tags = ev.get("tags", [])
                    title = next((t[1] for t in tags if t[0] == "title"), "")
                    results[eid] = {
                        "pubkey": ev.get("pubkey", ""),
                        "content": ev.get("content", ""),
                        "kind": ev.get("kind", 1),
                        "title": title,
                    }
                log.info("fetched %d/%d referenced events from %s", len(results), len(event_ids), relay_url)
        except Exception as e:
            log.debug("ref event fetch from %s failed: %s", relay_url, e)

    # Fetch naddr events (by author + kind + d-tag)
    for ref in naddr_refs:
        pk = ref.get("author_pk")
        kind = ref.get("kind")
        d_tag = ref.get("d_tag")
        if not pk or kind is None or not d_tag:
            continue
        for relay_url in relay_urls[:2]:
            try:
                filt = {"kinds": [kind], "authors": [pk], "#d": [d_tag], "limit": 1}
                raw_events = _query_relay(relay_url, filt, timeout=10.0)
                for ev in raw_events:
                    eid = ev.get("id", "")
                    tags = ev.get("tags", [])
                    title = next((t[1] for t in tags if t[0] == "title"), "")
                    summary = next((t[1] for t in tags if t[0] == "summary"), "")
                    results[f"naddr:{pk}:{kind}:{d_tag}"] = {
                        "pubkey": pk,
                        "content": ev.get("content", ""),
                        "kind": kind,
                        "title": title,
                        "summary": summary,
                    }
            except Exception:
                continue

    return results


# ── Content enrichment ───────────────────────────────────────────────────────

MAX_PK_REFS_PER_NOTE = 20    # max npub/nprofile username lookups per note
MAX_EVENT_REFS_PER_NOTE = 10  # max nevent/naddr/note1 event fetches per note


def enrich_notes(notes: list[NormalizedNote], relay_urls: list[str], label_map: dict[str, str]) -> None:
    """Enrich note content in-place: resolve names, referenced events.

    Modifies notes[i].content with enriched versions.
    Per-note limits prevent excessive relay queries on reference-heavy notes.
    No recursion — referenced events are fetched raw, not enriched.
    """
    if not notes:
        return

    # Collect all referenced pubkeys and event IDs across all notes
    referenced_pks: set[str] = set()
    referenced_event_ids: set[str] = set()
    naddr_refs: list[dict] = []

    for note in notes:
        content = note.content
        pk_count = 0
        event_count = 0

        # npub references
        for m in NPUB_RE.finditer(content):
            if pk_count >= MAX_PK_REFS_PER_NOTE:
                break
            pk = _decode_npub(m.group(0).replace("nostr:", ""))
            if pk:
                referenced_pks.add(pk)
                pk_count += 1

        # nprofile references
        for m in NPROFILE_RE.finditer(content):
            if pk_count >= MAX_PK_REFS_PER_NOTE:
                break
            pk = _decode_nprofile(m.group(0))
            if pk:
                referenced_pks.add(pk)
                pk_count += 1

        # nevent references
        for m in NEVENT_RE.finditer(content):
            if event_count >= MAX_EVENT_REFS_PER_NOTE:
                break
            decoded = _decode_nevent(m.group(0))
            if decoded:
                referenced_event_ids.add(decoded["event_id"])
                if decoded.get("author_pk"):
                    referenced_pks.add(decoded["author_pk"])
                event_count += 1

        # naddr references
        for m in NADDR_RE.finditer(content):
            if event_count >= MAX_EVENT_REFS_PER_NOTE:
                break
            decoded = _decode_naddr(m.group(0))
            if decoded:
                naddr_refs.append(decoded)
                if decoded.get("author_pk"):
                    referenced_pks.add(decoded["author_pk"])
                event_count += 1

        # note1 references
        for m in NOTE_RE.finditer(content):
            if event_count >= MAX_EVENT_REFS_PER_NOTE:
                break
            eid = _decode_note1(m.group(0).replace("nostr:", ""))
            if eid:
                referenced_event_ids.add(eid)
                event_count += 1

        # From tags
        for pk in note.mentioned_pubkeys:
            if pk:
                referenced_pks.add(pk)
        if note.reply_to_pubkey:
            referenced_pks.add(note.reply_to_pubkey)

    # Remove pubkeys already in label_map
    referenced_pks -= set(label_map.keys())

    log.info("enrichment: resolving %d pubkeys, %d event IDs, %d naddr refs",
             len(referenced_pks), len(referenced_event_ids), len(naddr_refs))

    # Fetch metadata for referenced pubkeys
    name_lookup = dict(label_map)
    if referenced_pks:
        fetched = _fetch_metadata_batch(referenced_pks, relay_urls)
        name_lookup.update(fetched)
        log.info("resolved %d/%d pubkey names", len(fetched), len(referenced_pks))

    # Fetch referenced events
    event_lookup: dict[str, dict] = {}
    if referenced_event_ids or naddr_refs:
        event_lookup = _fetch_referenced_events(referenced_event_ids, naddr_refs, relay_urls)
        log.info("fetched %d/%d referenced events", len(event_lookup), len(referenced_event_ids) + len(naddr_refs))

    # Apply enrichment to each note
    for note in notes:
        note.content = _enrich_content(note.content, name_lookup, event_lookup)


def _enrich_content(content: str, name_lookup: dict[str, str], event_lookup: dict[str, dict]) -> str:
    """Replace bech32 references with human-readable equivalents.

    Per-note limits: max 20 pk refs, max 10 event refs. Excess left as-is.
    """
    pk_remaining = [MAX_PK_REFS_PER_NOTE]
    event_remaining = [MAX_EVENT_REFS_PER_NOTE]

    def _replace_npub(match):
        if pk_remaining[0] <= 0:
            return match.group(0)  # leave as-is when limit reached
        npub_str = match.group(0).replace("nostr:", "")
        pk = _decode_npub(npub_str)
        if pk and pk in name_lookup:
            pk_remaining[0] -= 1
            return f"@{name_lookup[pk]}"
        return npub_str

    def _replace_nprofile(match):
        if pk_remaining[0] <= 0:
            return match.group(0)
        pk = _decode_nprofile(match.group(0))
        if pk and pk in name_lookup:
            pk_remaining[0] -= 1
            return f"@{name_lookup[pk]}"
        return match.group(0).replace("nostr:", "")

    def _replace_nevent(match):
        if event_remaining[0] <= 0:
            return match.group(0)
        decoded = _decode_nevent(match.group(0))
        if not decoded:
            return match.group(0).replace("nostr:", "")
        eid = decoded["event_id"]
        ev = event_lookup.get(eid)
        if not ev:
            return match.group(0).replace("nostr:", "")
        event_remaining[0] -= 1
        author = name_lookup.get(ev.get("pubkey", ""), ev.get("pubkey", "")[:8])
        preview = ev.get("content", "")[:100].replace("\n", " ").strip()
        if ev.get("title"):
            return f"[{ev['title']} by @{author}]"
        if preview:
            return f'[quoting @{author}: "{preview}..."]'
        return f"[event by @{author}]"

    def _replace_naddr(match):
        if event_remaining[0] <= 0:
            return match.group(0)
        decoded = _decode_naddr(match.group(0))
        if not decoded:
            return match.group(0).replace("nostr:", "")
        event_remaining[0] -= 1
        key = f"naddr:{decoded['author_pk']}:{decoded['kind']}:{decoded['d_tag']}"
        ev = event_lookup.get(key)
        author = name_lookup.get(decoded.get("author_pk", ""), decoded.get("author_pk", "")[:8])
        if ev and ev.get("title"):
            return f"[{ev['title']} by @{author}]"
        if ev and ev.get("summary"):
            return f"[article by @{author}: {ev['summary'][:80]}]"
        return f"[article by @{author}]"

    def _replace_note1(match):
        if event_remaining[0] <= 0:
            return match.group(0)
        note_str = match.group(0).replace("nostr:", "")
        eid = _decode_note1(note_str)
        if not eid:
            return note_str
        ev = event_lookup.get(eid)
        if not ev:
            return note_str
        event_remaining[0] -= 1
        author = name_lookup.get(ev.get("pubkey", ""), ev.get("pubkey", "")[:8])
        preview = ev.get("content", "")[:100].replace("\n", " ").strip()
        if preview:
            return f'[quoting @{author}: "{preview}..."]'
        return f"[note by @{author}]"

    content = NPUB_RE.sub(_replace_npub, content)
    content = NPROFILE_RE.sub(_replace_nprofile, content)
    content = NEVENT_RE.sub(_replace_nevent, content)
    content = NADDR_RE.sub(_replace_naddr, content)
    content = NOTE_RE.sub(_replace_note1, content)
    content = content.replace("@@", "@")  # fix double-@ from @npub1... in content
    return content


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
    # Reply/thread info
    reply_to_id: str = ""       # e tag — event being replied to
    reply_to_pubkey: str = ""   # p tag — pubkey being replied to
    mentioned_pubkeys: list[str] = field(default_factory=list)  # all p tag pubkeys


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

    # Extract reply/thread info from e and p tags
    e_tags = [t for t in tags if len(t) >= 2 and t[0] == "e"]
    p_tags = [t for t in tags if len(t) >= 2 and t[0] == "p"]
    # First e tag is usually the replied-to event
    reply_to_id = e_tags[0][1] if e_tags else ""
    # All p tags are referenced pubkeys (first is often the replied-to user)
    mentioned_pubkeys = [t[1] for t in p_tags]
    reply_to_pubkey = mentioned_pubkeys[0] if mentioned_pubkeys else ""

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
            reply_to_id=reply_to_id,
            reply_to_pubkey=reply_to_pubkey,
            mentioned_pubkeys=mentioned_pubkeys,
        )

    return NormalizedNote(
        event_id=event_id,
        pubkey=pubkey,
        content=content,
        created_at=created_at,
        kind=kind,
        hashtags=hashtags,
        source_type=f"nostr_{kind_label}",
        reply_to_id=reply_to_id,
        reply_to_pubkey=reply_to_pubkey,
        mentioned_pubkeys=mentioned_pubkeys,
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

    # Enrich content: resolve names, referenced events
    enrich_notes(notes, settings.relay_list, settings.pubkey_label_map)

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
            reply_to_id=note.reply_to_id,
            reply_to_pubkey=note.reply_to_pubkey,
            mentioned_pubkeys=note.mentioned_pubkeys,
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
