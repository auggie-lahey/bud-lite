"""
Soul file generator — creates comprehensive user profiles from their Nostr notes.

For each configured pubkey, fetches all their indexed notes from Qdrant,
feeds them to an LLM, and generates:
  - Soul file (~20-30K tokens): detailed profile of the person
  - Soul hint (~100-200 tokens): condensed version for quick context

Files:
  - data/souls/{pubkey}.md  — full soul file
  - data/souls/hints.json   — all hints keyed by pubkey
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path

import anthropic

from app.config import get_settings

log = logging.getLogger(__name__)

SOULS_DIR = Path("data/souls")
HINTS_FILE = SOULS_DIR / "hints.json"

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


def _get_notes_for_pubkey(pubkey: str, limit: int = 2000) -> list[dict]:
    """Fetch all indexed notes for a pubkey from Qdrant."""
    from ingestion.indexer import get_qdrant_client

    settings = get_settings()
    client = get_qdrant_client()

    # Scroll through all points for this pubkey
    notes = []
    offset = None
    while True:
        results, offset = client.scroll(
            collection_name=settings.collection_name,
            scroll_filter={
                "must": [
                    {"key": "pubkey", "match": {"value": pubkey}}
                ]
            },
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
                })
        if not offset:
            break

    # Sort by date
    notes.sort(key=lambda n: n["date"], reverse=True)
    return notes[:limit]


def _format_notes_for_soul(notes: list[dict], label: str) -> str:
    """Format notes into a readable block for the LLM."""
    import datetime

    lines = [f"=== Posts by {label} ({len(notes)} total) ===\n"]
    for i, note in enumerate(notes):
        ts = (
            datetime.datetime.fromtimestamp(note["date"]).strftime("%Y-%m-%d")
            if note["date"] else "?"
        )
        tags = f" [#{', #'.join(note['hashtags'][:3])}]" if note["hashtags"] else ""
        lines.append(f"[{i+1}] ({ts}){tags}: {note['content']}\n")
    return "\n".join(lines)


def generate_soul_file(
    pubkey: str,
    label: str = "",
    api_key: str = "",
    base_url: str = "",
    model: str = "",
) -> str:
    """Generate a soul file for a single user. Returns the soul content."""
    settings = get_settings()

    api_key = api_key or settings.dev_llm_key
    base_url = base_url or settings.dev_llm_base_url
    model = model or settings.dev_llm_model

    if not api_key:
        raise ValueError("LLM API key required for soul generation. Set DEV_LLM_KEY in .env")

    label = label or settings.pubkey_label_map.get(pubkey, pubkey[:8])
    log.info("generating soul file for %s (%s)...", label, pubkey[:12])

    # Fetch notes
    notes = _get_notes_for_pubkey(pubkey)
    if not notes:
        log.warning("no notes found for %s", label)
        return ""

    log.info("fetched %d notes for %s", len(notes), label)

    # Format and send to LLM
    formatted = _format_notes_for_soul(notes, label)

    client = anthropic.Anthropic(api_key=api_key, base_url=base_url)

    # Split into chunks if too large (max ~100K chars per call)
    max_chars = 80000
    if len(formatted) > max_chars:
        # Use most recent + sampled older notes
        recent = formatted[:max_chars // 2]
        # Sample from older notes
        older_notes = notes[len(notes) // 2:]
        step = max(1, len(older_notes) // 50)
        sampled = older_notes[::step]
        older_formatted = _format_notes_for_soul(sampled, f"{label} (older sampled)")
        formatted = recent + "\n\n[... sampled older posts ...]\n\n" + older_formatted

    message = client.messages.create(
        model=model,
        max_tokens=8000,
        system=SOUL_PROMPT,
        messages=[{"role": "user", "content": formatted}],
    )
    soul_content = f"# Soul File: {label}\n\n> Generated from {len(notes)} posts by {label} ({pubkey[:12]}...)\n\n{message.content[0].text}"

    # Save soul file
    SOULS_DIR.mkdir(parents=True, exist_ok=True)
    soul_path = SOULS_DIR / f"{pubkey}.md"
    soul_path.write_text(soul_content)
    log.info("soul file saved: %s (%d chars)", soul_path.name, len(soul_content))

    return soul_content


def generate_hint(
    pubkey: str,
    soul_content: str = "",
    api_key: str = "",
    base_url: str = "",
    model: str = "",
) -> str:
    """Distill a soul file into a compact hint (~100-200 tokens)."""
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

    client = anthropic.Anthropic(api_key=api_key, base_url=base_url)
    message = client.messages.create(
        model=model,
        max_tokens=1500,
        system=HINT_PROMPT,
        messages=[{"role": "user", "content": soul_content}],
    )
    hint = message.content[0].text.strip()
    log.info("hint for %s: %s", label, hint[:80])

    # Generate micro summary from hint
    micro_resp = client.messages.create(
        model=model,
        max_tokens=150,
        system=MICRO_PROMPT,
        messages=[{"role": "user", "content": hint}],
    )
    micro = micro_resp.content[0].text.strip()
    log.info("micro for %s: %s", label, micro[:80])

    return hint, micro


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

    # Save hints (compact ~1000 token profiles)
    SOULS_DIR.mkdir(parents=True, exist_ok=True)
    HINTS_FILE.write_text(json.dumps({"hints": hints, "micros": micros}, indent=2))
    log.info("saved %d hints + %d micros to %s", len(hints), len(micros), HINTS_FILE)

    return hints


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
