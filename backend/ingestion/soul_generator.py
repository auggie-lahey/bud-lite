"""
Soul file generator — creates comprehensive user profiles from their Nostr notes.

Chunked pipeline:
  1. Fetch all notes from Qdrant
  2. Split into ~100K char date-ordered chunks
  3. Generate ~10K token soul per chunk → save to data/souls/{pubkey}/{date_range}.md
  4. Merge all chunk souls into one final ~10K token soul → data/souls/{pubkey}.md
  5. Distill final soul into compact hint (~1000 tokens) + micro summary (~80 words)

Incremental: on subsequent runs, only generate new chunks for new date ranges,
then re-merge all chunk souls.

Files:
  - data/souls/{pubkey}/YYYY-MM-DD_YYYY-MM-DD.md  — chunk souls
  - data/souls/{pubkey}.md                          — merged final soul (~10K tokens)
  - data/souls/hints.json                            — compact hints + micros
"""

from __future__ import annotations

import json
import logging
import os
import re
import httpx
from pathlib import Path

from app.config import get_settings

log = logging.getLogger(__name__)

SOULS_DIR = Path("data/souls")
HINTS_FILE = SOULS_DIR / "hints.json"

# Regex patterns for Nostr references in note content
# Negative lookbehind (?<!/) avoids matching bech32 inside URLs (e.g. https://npub1...blossom.band)
NPROFILE_RE = re.compile(r'(?<!/)(?:nostr:)?nprofile1[a-zA-HJ-NP-Z0-9]+')
NEVENT_RE = re.compile(r'(?<!/)(?:nostr:)?nevent1[a-zA-HJ-NP-Z0-9]+')
NADDR_RE = re.compile(r'(?<!/)(?:nostr:)?naddr1[a-zA-HJ-NP-Z0-9]+')
NOTE_RE = re.compile(r'(?<!/)(?:nostr:)?note1[a-zA-HJ-NP-Z0-9]+')
NPUB_RE = re.compile(r'(?<!/)(?:nostr:)?npub1([a-zA-HJ-NP-Z0-9]+)')

# Size constants
CHUNK_CHAR_LIMIT = 100_000  # ~25K tokens per chunk of raw notes
FINAL_SOUL_TOKENS = 10_000  # target token count for final merged soul

SOUL_PROMPT = """\
You are creating a comprehensive "soul file" — a deep profile of a person based on their public posts.

Analyze ALL of the provided posts carefully and create a structured profile covering:

## Identity
- How they present themselves (name, handles, professional identity)
- Personality traits evident from their writing (analytical, opinionated, humorous, technical, etc.)
- Communication style (concise vs verbose, casual vs formal, uses metaphors, data-driven, etc.)

## Expertise & Knowledge
- Primary areas of expertise and depth of knowledge in each
- Technical skills mentioned or demonstrated
- Industries or domains they work in or comment on
- Certifications, roles, or credentials mentioned

## Beliefs & Opinions
- Strongly held beliefs (especially on Bitcoin, Lightning, Nostr, economics, technology)
- Controversial or contrarian positions they take
- How their views have evolved over time (if evident from the posts)
- Things they explicitly disagree with or argue against

## Interests & Themes
- Recurring topics they post about
- Hobbies or interests outside of main expertise
- Projects they're involved in or excited about
- People or organizations they frequently reference

## Insights & Contributions
- Unique insights or frameworks they've shared
- Original ideas or mental models they use
- Notable predictions, analyses, or observations
- Educational content they've created

## Relationships
- Other people they interact with or reference (use labels if available)
- Communities they're part of
- Collaborative projects or discussions

## Quirks & Patterns
- Running jokes, catchphrases, or recurring expressions
- Posting patterns or habits
- Unique perspectives or angles they bring to topics

Rules:
- Be specific, not generic. Quote or paraphrase actual posts when relevant.
- Don't hallucinate information not present in the posts.
- Note uncertainty where the data is ambiguous.
- Preserve nuance — if they hold mixed views on something, say so.
- Write in third person.
- Use up to 10,000 tokens. Be exhaustive — include every detail, pattern, and observation you can extract from the posts.
"""

MERGE_PROMPT = """\
You are merging multiple time-period soul profiles of the same person into one comprehensive profile.

Combine all the chunk profiles into a single coherent soul file. Rules:
- Deduplicate: merge overlapping sections, keep the most detailed version
- Chronology: if views evolved over time, show the evolution (e.g. "Initially X, later shifted to Y")
- Completeness: preserve ALL unique details, insights, relationships, and quirks from every chunk
- Specificity: keep actual quotes, project names, and concrete details — don't generalize them away
- Structure: use the same sections (Identity, Expertise, Beliefs, Interests, Contributions, Relationships, Quirks)
- Target ~10,000 tokens. Be exhaustive.

Write in third person.
"""

HINT_PROMPT = """\
Distill this soul file into a detailed profile. Target ~1000 tokens.

Cover:
- Name and identity (2-3 sentences: who they are, what they do, their role in the community)
- Expertise (5-8 specific areas with brief context on depth)
- Key beliefs and positions (4-6 positions they hold strongly, with nuance)
- Notable contributions (2-3 specific things they've built, said, or contributed)
- Communication style (1-2 sentences)
- Recurring themes (3-5 topics they return to often)
- Relationships (key people they reference or collaborate with)
- Quirks (catchphrases, running jokes, distinctive patterns)

Be specific — reference actual posts, projects, or examples. This profile should give enough context that someone could understand this person's perspective without reading their full archive.
"""

MICRO_PROMPT = """\
Summarize this person in exactly 2-3 sentences, ~80 words max. Cover: who they are, what they're known for, their vibe. Write in third person. No lists, no headers — just prose.
"""


# ── Bech32 decoding for npub → hex pubkey ──────────────────────────────────

BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"


def _bech32_decode_npub(npub: str) -> str | None:
    """Decode npub (bech32) to hex pubkey. Returns None on failure."""
    if not npub.startswith("npub1"):
        return None
    data = []
    for c in npub[5:]:
        idx = BECH32_CHARSET.find(c)
        if idx == -1:
            return None
        data.append(idx)
    payload = data[:-6]  # strip checksum
    bits, acc, result = 0, 0, []
    for val in payload:
        acc = (acc << 5) | val
        bits += 5
        while bits >= 8:
            bits -= 8
            result.append((acc >> bits) & 255)
    return bytes(result).hex()


def _bech32_decode_nprofile(nprofile: str) -> str | None:
    """Decode nprofile (bech32 TLV) to hex pubkey. Returns None on failure."""
    if not nprofile.startswith("nprofile1"):
        return None
    # Strip nostr: prefix if present
    nprofile = nprofile.replace("nostr:", "")
    # Decode bech32 5-bit words to 8-bit bytes
    data = []
    for c in nprofile[len("nprofile1"):]:
        idx = BECH32_CHARSET.find(c)
        if idx == -1:
            return None
        data.append(idx)
    payload = data[:-6]  # strip checksum
    bits, acc, decoded = 0, 0, []
    for val in payload:
        acc = (acc << 5) | val
        bits += 5
        while bits >= 8:
            bits -= 8
            decoded.append((acc >> bits) & 255)
    # Parse TLV — type 0 = 32-byte pubkey
    i = 0
    while i + 1 < len(decoded):
        t, length = decoded[i], decoded[i + 1]
        if t == 0 and length == 32:
            return bytes(decoded[i + 2 : i + 2 + length]).hex()
        i += 2 + length
    return None


# ── Metadata resolution ────────────────────────────────────────────────────

def _fetch_metadata_batch(pubkeys: set[str], relay_urls: list[str]) -> dict[str, str]:
    """Fetch kind:0 metadata for pubkeys from relays. Returns {hex_pubkey: display_name}."""
    names: dict[str, str] = {}
    if not pubkeys or not relay_urls:
        return names

    import asyncio
    import ssl

    try:
        import websockets
    except ImportError:
        log.warning("websockets not installed — skipping metadata fetch")
        return names

    async def _fetch_batch(pk_batch: list[str]) -> dict[str, str]:
        """Fetch metadata for a single batch of pubkeys."""
        results = {}
        for relay_url in relay_urls[:2]:
            try:
                async with websockets.connect(
                    relay_url, ssl=ssl.create_default_context(), open_timeout=10
                ) as ws:
                    sub_id = "soul_meta"
                    import json as _json
                    filt = {"kinds": [0], "authors": pk_batch, "limit": len(pk_batch)}
                    await ws.send(_json.dumps(["REQ", sub_id, filt]))
                    remaining = set(pk_batch)
                    while remaining:
                        try:
                            msg = await asyncio.wait_for(ws.recv(), timeout=15)
                            ev = _json.loads(msg)
                            if ev[0] == "EVENT" and ev[2].get("kind") == 0:
                                pk = ev[2].get("pubkey", "")
                                try:
                                    meta = _json.loads(ev[2].get("content", "{}"))
                                except _json.JSONDecodeError:
                                    meta = {}
                                name = meta.get("display_name") or meta.get("name") or pk[:8]
                                results[pk] = name
                                remaining.discard(pk)
                            elif ev[0] == "EOSE":
                                break
                        except asyncio.TimeoutError:
                            break
                    try:
                        await ws.send(_json.dumps(["CLOSE", sub_id]))
                    except Exception:
                        pass
                if results:
                    break
            except Exception as e:
                log.debug("relay %s failed: %s", relay_url, e)
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


def _build_name_lookup(notes: list[dict], label_map: dict[str, str], relay_urls: list[str]) -> dict[str, str]:
    """Build pubkey→name lookup from label_map + fetch metadata for referenced npubs."""
    lookup = dict(label_map)

    referenced_hex = set()
    for note in notes:
        # Collect from content text (npub references)
        content = note.get("content", "")
        for match in NPUB_RE.finditer(content):
            npub_str = match.group(0).replace("nostr:", "")
            hex_pk = _bech32_decode_npub(npub_str)
            if hex_pk and hex_pk not in lookup:
                referenced_hex.add(hex_pk)
        # Collect from content text (nprofile references)
        for match in NPROFILE_RE.finditer(content):
            nprof_str = match.group(0).replace("nostr:", "")
            hex_pk = _bech32_decode_nprofile(nprof_str)
            if hex_pk and hex_pk not in lookup:
                referenced_hex.add(hex_pk)
        # Collect from reply_to_pubkey and mentioned_pubkeys tags
        for pk in note.get("mentioned_pubkeys", []):
            if pk and pk not in lookup:
                referenced_hex.add(pk)
        reply_pk = note.get("reply_to_pubkey", "")
        if reply_pk and reply_pk not in lookup:
            referenced_hex.add(reply_pk)

    if referenced_hex:
        log.info("fetching metadata for %d referenced pubkeys", len(referenced_hex))
        fetched = _fetch_metadata_batch(referenced_hex, relay_urls)
        lookup.update(fetched)

    return lookup


def _enrich_content(content: str, name_lookup: dict[str, str]) -> str:
    """Replace npub/nprofile references with @Name. Leave other bech32 refs unchanged."""
    def _replace_npub(match):
        npub_str = match.group(0).replace("nostr:", "")
        hex_pk = _bech32_decode_npub(npub_str)
        if hex_pk and hex_pk in name_lookup:
            name = name_lookup[hex_pk]
            return f"@{name}"
        return npub_str  # unknown — leave full npub as-is

    def _replace_nprofile(match):
        profile_str = match.group(0).replace("nostr:", "")
        hex_pk = _bech32_decode_nprofile(profile_str)
        if hex_pk and hex_pk in name_lookup:
            return f"@{name_lookup[hex_pk]}"
        return profile_str

    content = NPUB_RE.sub(_replace_npub, content)
    content = NPROFILE_RE.sub(_replace_nprofile, content)
    content = content.replace("@@", "@")
    return content


# ── Note fetching and formatting ────────────────────────────────────────────

def _get_notes_for_pubkey(pubkey: str) -> list[dict]:
    """Fetch ALL indexed notes for a pubkey from Qdrant."""
    from ingestion.indexer import get_qdrant_client

    settings = get_settings()
    client = get_qdrant_client()

    notes = []
    offset = None
    while True:
        results, offset = client.scroll(
            collection_name=settings.collection_name,
            scroll_filter={"must": [{"key": "pubkey", "match": {"value": pubkey}}]},
            limit=100,
            offset=offset,
            with_payload=True,
            with_vectors=False,
        )
        for r in results:
            p = r.payload or {}
            content = p.get("content", "")
            if content:
                notes.append({
                    "content": content,
                    "date": p.get("created_at", 0),
                    "kind": p.get("kind", 1),
                    "hashtags": p.get("hashtags", []),
                    "reply_to_id": p.get("reply_to_id", ""),
                    "reply_to_pubkey": p.get("reply_to_pubkey", ""),
                    "mentioned_pubkeys": p.get("mentioned_pubkeys", []),
                })
        if not offset:
            break

    notes.sort(key=lambda n: n["date"], reverse=True)
    return notes


def _format_notes_for_soul(notes: list[dict], label: str, name_lookup: dict[str, str] | None = None) -> str:
    """Format notes into a readable block for the LLM, enriching Nostr references."""
    import datetime

    lines = [f"=== Posts by {label} ({len(notes)} total) ===\n"]
    for i, note in enumerate(notes):
        ts = (
            datetime.datetime.fromtimestamp(note["date"]).strftime("%Y-%m-%d")
            if note["date"] else "?"
        )
        tags = f" [#{', #'.join(note['hashtags'][:3])}]" if note["hashtags"] else ""
        content = note["content"]
        if name_lookup:
            content = _enrich_content(content, name_lookup)

        # Prefix replies with context
        prefix = ""
        reply_pk = note.get("reply_to_pubkey", "")
        if reply_pk and name_lookup:
            reply_name = name_lookup.get(reply_pk, reply_pk[:8])
            prefix = f"reply to @{reply_name}: "
        elif reply_pk:
            prefix = f"reply to {reply_pk[:8]}...: "

        lines.append(f"[{i+1}] ({ts}){tags}: {prefix}{content}\n")
    return "\n".join(lines)


# ── LLM calls ───────────────────────────────────────────────────────────────

def _call_llm(system_prompt: str, user_content: str, api_key: str, base_url: str, model: str, max_tokens: int = 4000) -> str:
    """Call LLM — auto-detects Anthropic vs OpenAI-compatible format."""
    base_url = base_url.rstrip("/")
    if base_url.endswith(("/v4", "/v1", "/v4/", "/v1/")):
        endpoint = f"{base_url}/chat/completions"
    else:
        endpoint = f"{base_url}/v1/chat/completions"

    resp = httpx.post(
        endpoint,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        json={
            "model": model,
            "max_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
        },
        timeout=300,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


# ── Chunking ────────────────────────────────────────────────────────────────

def _chunk_notes(notes: list[dict], char_limit: int = CHUNK_CHAR_LIMIT) -> list[list[dict]]:
    """Split notes into chunks that fit within char_limit when formatted.

    Notes are sorted newest-first. Chunks preserve date ordering within each chunk.
    Each chunk will be ~char_limit characters when formatted (~25K tokens).
    """
    if not notes:
        return []

    # Pre-format to get accurate char counts, then chunk by note boundaries
    chunks = []
    current_chunk = []
    current_size = 0

    for note in notes:
        # Estimate formatted size: date + hashtags + content + overhead
        est_size = len(note.get("content", "")) + 50  # overhead for date, tags, formatting
        if current_chunk and current_size + est_size > char_limit:
            chunks.append(current_chunk)
            current_chunk = []
            current_size = 0
        current_chunk.append(note)
        current_size += est_size

    if current_chunk:
        chunks.append(current_chunk)

    return chunks


def _chunk_date_range(chunk: list[dict]) -> tuple[str, str]:
    """Get the date range for a chunk of notes (oldest, newest)."""
    import datetime
    dates = [n["date"] for n in chunk if n.get("date")]
    if not dates:
        return ("unknown", "unknown")
    oldest = datetime.datetime.fromtimestamp(min(dates)).strftime("%Y-%m-%d")
    newest = datetime.datetime.fromtimestamp(max(dates)).strftime("%Y-%m-%d")
    return (oldest, newest)


def _get_existing_chunks(pubkey: str) -> list[Path]:
    """List existing chunk soul files for a pubkey."""
    chunk_dir = SOULS_DIR / pubkey
    if not chunk_dir.exists():
        return []
    return sorted(chunk_dir.glob("*.md"))


def _chunk_end_date(chunk_path: Path) -> str:
    """Extract end date from chunk filename (YYYY-MM-DD_YYYY-MM-DD.md)."""
    stem = chunk_path.stem
    parts = stem.split("_")
    return parts[-1] if parts else ""


# ── Soul generation pipeline ────────────────────────────────────────────────

def generate_soul_file(
    pubkey: str,
    label: str = "",
    api_key: str = "",
    base_url: str = "",
    model: str = "",
) -> str:
    """Generate soul file using chunked pipeline.

    1. Fetch all notes
    2. Split into ~100K char chunks
    3. Generate ~10K token soul per chunk (skip existing chunks)
    4. Merge all chunk souls into final ~10K token soul
    """
    settings = get_settings()

    api_key = api_key or settings.dev_llm_key
    base_url = base_url or settings.dev_llm_base_url
    model = model or settings.dev_llm_model

    if not api_key:
        raise ValueError("LLM API key required for soul generation. Set DEV_LLM_KEY in .env")

    label = label or settings.pubkey_label_map.get(pubkey, pubkey[:8])
    log.info("generating soul file for %s (%s)...", label, pubkey[:12])

    # Fetch all notes
    notes = _get_notes_for_pubkey(pubkey)
    if not notes:
        log.warning("no notes found for %s", label)
        return ""

    log.info("fetched %d notes for %s", len(notes), label)

    # Build name lookup
    name_lookup = _build_name_lookup(notes, settings.pubkey_label_map, settings.relay_list)
    log.info("name lookup has %d entries", len(name_lookup))

    # Split into chunks
    chunks = _chunk_notes(notes)
    log.info("split %d notes into %d chunks", len(notes), len(chunks))

    # Ensure chunk directory exists
    chunk_dir = SOULS_DIR / pubkey
    chunk_dir.mkdir(parents=True, exist_ok=True)

    # ── Phase 1: Generate new chunks (only when large enough) ─────────
    # Check which chunks already exist
    existing_chunk_paths = _get_existing_chunks(pubkey)
    existing_date_ranges = {p.stem for p in existing_chunk_paths}

    # Find the end date of the most recent existing chunk
    last_chunk_end = None
    if existing_chunk_paths:
        import datetime
        last_end_str = _chunk_end_date(existing_chunk_paths[-1])
        try:
            last_chunk_end = datetime.datetime.strptime(last_end_str, "%Y-%m-%d")
        except ValueError:
            pass

    # Separate notes into: covered by existing chunks vs new since last chunk
    new_notes = []
    if last_chunk_end:
        import datetime
        cutoff_ts = int(last_chunk_end.timestamp())
        new_notes = [n for n in notes if n["date"] >= cutoff_ts]
    else:
        new_notes = list(notes)  # no existing chunks, all notes are "new"

    # Check if new notes are large enough to form a new chunk
    new_formatted = _format_notes_for_soul(new_notes, label, name_lookup) if new_notes else ""
    new_chars = len(new_formatted)

    # Chunk the new notes if they exceed the threshold
    if new_chars >= CHUNK_CHAR_LIMIT:
        new_chunks = _chunk_notes(new_notes)
        log.info("new notes: %d notes, %d chars → %d new chunks", len(new_notes), new_chars, len(new_chunks))

        for i, chunk in enumerate(new_chunks):
            oldest, newest = _chunk_date_range(chunk)
            chunk_name = f"{oldest}_{newest}"
            chunk_path = chunk_dir / f"{chunk_name}.md"

            if chunk_path.exists():
                log.info("chunk already exists: %s", chunk_name)
                continue

            log.info("generating chunk %d/%d: %s (%d notes)", i + 1, len(new_chunks), chunk_name, len(chunk))
            formatted = _format_notes_for_soul(chunk, f"{label} ({oldest} to {newest})", name_lookup)

            soul_text = _call_llm(SOUL_PROMPT, formatted, api_key, base_url, model, max_tokens=FINAL_SOUL_TOKENS)
            chunk_content = f"# Soul Chunk: {label} ({oldest} to {newest})\n\n> Generated from {len(chunk)} posts\n\n{soul_text}"
            chunk_path.write_text(chunk_content)
            log.info("chunk saved: %s (%d chars)", chunk_name, len(chunk_content))
    else:
        log.info("new notes: %d notes, %d chars — below %d threshold, not chunking",
                 len(new_notes), new_chars, CHUNK_CHAR_LIMIT)

    # ── Phase 2: Merge all chunk souls + un-chunked new notes ────────
    all_chunk_paths = _get_existing_chunks(pubkey)
    merge_parts = []

    # Add all existing chunk souls
    for cp in all_chunk_paths:
        merge_parts.append(cp.read_text())

    # If new notes weren't large enough to chunk, include them as raw formatted text
    if new_chars < CHUNK_CHAR_LIMIT and new_notes:
        import datetime
        oldest_new = datetime.datetime.fromtimestamp(min(n["date"] for n in new_notes if n["date"])).strftime("%Y-%m-%d")
        newest_new = datetime.datetime.fromtimestamp(max(n["date"] for n in new_notes if n["date"])).strftime("%Y-%m-%d")
        new_formatted_labeled = (
            f"=== Recent uncategorized posts by {label} ({oldest_new} to {newest_new}, {len(new_notes)} posts) ===\n\n"
            f"{new_formatted}"
        )
        merge_parts.append(new_formatted_labeled)
        log.info("including %d new raw notes in merge", len(new_notes))

    log.info("merging %d chunk souls + %d raw note blocks", len(all_chunk_paths), 1 if new_chars < CHUNK_CHAR_LIMIT and new_notes else 0)

    # If single chunk and no raw notes, just use it directly
    if len(merge_parts) == 1:
        final_content = merge_parts[0]
        log.info("single source — using directly as final soul")
    else:
        merge_input = "\n\n---\n\n".join(merge_parts)
        merged_text = _call_llm(MERGE_PROMPT, merge_input, api_key, base_url, model, max_tokens=FINAL_SOUL_TOKENS)
        final_content = f"# Soul File: {label}\n\n> Merged from {len(all_chunk_paths)} chunk(s) + recent notes, {len(notes)} total posts by {label} ({pubkey[:12]}...)\n\n{merged_text}"

    # Save final soul
    soul_path = SOULS_DIR / f"{pubkey}.md"
    soul_path.write_text(final_content)
    log.info("final soul saved: %s (%d chars)", soul_path.name, len(final_content))

    return final_content


def generate_hint(
    pubkey: str,
    soul_content: str = "",
    api_key: str = "",
    base_url: str = "",
    model: str = "",
) -> tuple[str, str]:
    """Distill a soul file into a compact hint (~1000 tokens) + micro summary (~80 words)."""
    settings = get_settings()

    api_key = api_key or settings.dev_llm_key
    base_url = base_url or settings.dev_llm_base_url
    model = model or settings.dev_llm_model

    if not api_key:
        raise ValueError("LLM API key required for hint generation")

    if not soul_content:
        soul_path = SOULS_DIR / f"{pubkey}.md"
        if not soul_path.exists():
            raise FileNotFoundError(f"No soul file for {pubkey[:12]}")
        soul_content = soul_path.read_text()

    label = settings.pubkey_label_map.get(pubkey, pubkey[:8])
    log.info("generating hint for %s...", label)

    hint = _call_llm(HINT_PROMPT, soul_content, api_key, base_url, model, max_tokens=1500).strip()
    log.info("hint for %s: %s", label, hint[:80])

    micro = _call_llm(MICRO_PROMPT, hint, api_key, base_url, model, max_tokens=150).strip()
    log.info("micro for %s: %s", label, micro[:80])

    return hint, micro


# ── Orchestrator ─────────────────────────────────────────────────────────────

def generate_all_souls(
    api_key: str = "",
    base_url: str = "",
    model: str = "",
) -> dict[str, str]:
    """Generate soul files, hints, and micro summaries for all configured pubkeys."""
    settings = get_settings()
    label_map = settings.pubkey_label_map
    hints = {}
    micros = {}

    for pubkey in settings.pubkey_list:
        label = label_map.get(pubkey, pubkey[:8])
        try:
            soul = generate_soul_file(pubkey, label=label, api_key=api_key, base_url=base_url, model=model)
            if soul:
                hint, micro = generate_hint(pubkey, soul_content=soul, api_key=api_key, base_url=base_url, model=model)
                hints[pubkey] = hint
                micros[pubkey] = micro
        except Exception as e:
            log.error("soul generation failed for %s: %s", label, e)

    # Save hints
    SOULS_DIR.mkdir(parents=True, exist_ok=True)
    HINTS_FILE.write_text(json.dumps({"hints": hints, "micros": micros}, indent=2))
    log.info("saved %d hints + %d micros to %s", len(hints), len(micros), HINTS_FILE)

    return hints


# ── Loaders ──────────────────────────────────────────────────────────────────

def load_hints() -> dict[str, str]:
    """Load soul hints from disk. Returns pubkey -> hint mapping."""
    if HINTS_FILE.exists():
        try:
            data = json.loads(HINTS_FILE.read_text())
            if isinstance(data, dict) and "hints" in data:
                return data["hints"]
            return data
        except json.JSONDecodeError:
            pass
    return {}


def load_micros() -> dict[str, str]:
    """Load micro summaries from disk. Returns pubkey -> micro mapping."""
    if HINTS_FILE.exists():
        try:
            data = json.loads(HINTS_FILE.read_text())
            return data.get("micros", {})
        except json.JSONDecodeError:
            pass
    return {}


def load_soul(pubkey: str) -> str:
    """Load a full soul file for a pubkey."""
    soul_path = SOULS_DIR / f"{pubkey}.md"
    if soul_path.exists():
        return soul_path.read_text()
    return ""
