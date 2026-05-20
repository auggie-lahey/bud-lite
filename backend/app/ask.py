"""
Ask endpoint — RAG Q&A with tiered context:
  - Soul hints: always included (~1K tokens total)
  - Soul files: pulled in when query mentions specific users
  - Vector search: for specific note citations
API keys come from request headers (per-user, stored in browser).
"""

from __future__ import annotations

import datetime
import logging

import anthropic
from fastapi import APIRouter, Header
from fastapi.responses import JSONResponse

from app.config import get_settings
from ingestion.embedder import embed_text
from ingestion.indexer import get_qdrant_client
from ingestion.soul_generator import load_hints, load_soul
from models.schemas import AskRequest, AskResponse, AskSourceNote

log = logging.getLogger(__name__)
router = APIRouter()


async def _retrieve_notes(
    query: str, hf_key: str, limit: int = 15, pubkeys: list[str] | None = None,
) -> list[dict]:
    """Search Qdrant for notes relevant to the query, optionally filtered by pubkey."""
    settings = get_settings()

    query_vector = await embed_text(query, api_key=hf_key)

    client = get_qdrant_client()
    query_params = dict(
        collection_name=settings.collection_name,
        query=query_vector,
        limit=limit,
    )
    if pubkeys:
        query_params["query_filter"] = {
            "must": [{"key": "pubkey", "match": {"any": pubkeys}}]
        }
    results = client.query_points(**query_params)

    notes = []
    for r in results.points:
        p = r.payload or {}
        notes.append(
            {
                "score": r.score,
                "author": p.get("author_label", p.get("pubkey", "?")[:8]),
                "pubkey": p.get("pubkey", ""),
                "content": p.get("content", ""),
                "date": p.get("created_at", 0),
                "hashtags": p.get("hashtags", []),
                "event_id": p.get("event_id", ""),
                "kind": p.get("kind"),
            }
        )
    return notes


def _select_notes(
    raw_notes: list[dict], active_pubkeys: list[str] | None, limit: int,
) -> tuple[list[dict], bool]:
    """Select notes: at least 1 per active user, then all above 0.3 threshold.

    Returns (selected_notes, low_confidence).
    """
    settings = get_settings()
    pk_set = set(active_pubkeys) if active_pubkeys else set()

    # Notes above threshold
    high_score = [n for n in raw_notes if n.get("score", 0) >= 0.3]

    # Ensure at least 1 note per active user
    guaranteed = []
    seen_pubkeys = set()
    for n in high_score:
        seen_pubkeys.add(n.get("pubkey", ""))

    if pk_set:
        for pk in pk_set:
            if pk not in seen_pubkeys:
                # Find best note for this pubkey
                best = None
                for n in raw_notes:
                    if n.get("pubkey") == pk:
                        if best is None or n.get("score", 0) > best.get("score", 0):
                            best = n
                if best:
                    guaranteed.append(best)

    # Merge: high-score notes + guaranteed per-user notes (dedup)
    seen_ids = set()
    selected = []
    for n in high_score + guaranteed:
        nid = (n.get("pubkey", ""), n.get("content", "")[:50])
        if nid not in seen_ids:
            seen_ids.add(nid)
            selected.append(n)

    low_confidence = len(high_score) < len(raw_notes) // 2 if raw_notes else False
    return selected[:limit], low_confidence


def _format_context(notes: list[dict]) -> str:
    """Format retrieved notes as context for the LLM. Includes relevance scores and kind."""
    lines = []
    for i, note in enumerate(notes, 1):
        ts = (
            datetime.datetime.fromtimestamp(note["date"]).strftime("%Y-%m-%d")
            if note["date"]
            else "?"
        )
        tags = f" [#{', #'.join(note['hashtags'][:3])}]" if note["hashtags"] else ""
        score_pct = f"{note.get('score', 0) * 100:.0f}%"
        kind_label = f" kind:{note['kind']}" if note.get("kind") else ""
        eid = note.get("event_id", "")
        eid_label = f" id:{eid}" if eid else ""
        lines.append(f"[{i}] {note['author']} ({ts}){tags} relevance: {score_pct}{kind_label}{eid_label}\n{note['content']}")
    return "\n\n---\n\n".join(lines)


def _build_soul_context(question: str, pubkeys: list[str] | None = None) -> tuple[str, str]:
    """Build soul context for the query.

    Returns (hints_block, soul_files_block).
    - hints_block: always included, compact profiles of all users (or filtered)
    - soul_files_block: full soul files for users mentioned in the query
    """
    settings = get_settings()
    label_map = settings.pubkey_label_map
    hints = load_hints()

    if not hints:
        return "", ""

    # Filter hints if pubkey filter active
    if pubkeys:
        hints = {pk: h for pk, h in hints.items() if pk in pubkeys}

    # Build hints block (always included)
    hint_lines = ["=== Group Members (compact profiles) ==="]
    for pkey, hint in hints.items():
        label = label_map.get(pkey, pkey[:8])
        hint_lines.append(f"**{label}**: {hint}")
    hints_block = "\n".join(hint_lines)

    # Check if query mentions any specific user by label or partial match
    question_lower = question.lower()
    mentioned_pubkeys = []
    for pubkey, label in label_map.items():
        if label.lower() in question_lower:
            mentioned_pubkeys.append(pubkey)

    # Also check for "user A and user B" patterns or "between X and Y"
    if mentioned_pubkeys:
        soul_lines = ["\n=== Detailed Profiles (requested users) ==="]
        for pubkey in mentioned_pubkeys:
            soul = load_soul(pubkey)
            if soul:
                label = label_map.get(pubkey, pubkey[:8])
                soul_lines.append(f"\n--- {label} ---\n{soul}")
        soul_files_block = "\n".join(soul_lines)
    else:
        soul_files_block = ""

    return hints_block, soul_files_block


@router.post("/ask/preview")
async def ask_preview(
    req: AskRequest,
    x_hf_key: str = Header(default="", alias="X-HF-Key"),
    x_llm_key: str = Header(default="", alias="X-LLM-Key"),
):
    """Return the constructed prompt without calling the LLM. For prompt inspection."""
    active_pubkeys = req.pubkeys if req.pubkeys else None

    # Retrieve notes
    try:
        raw_notes = await _retrieve_notes(
            req.question, hf_key=x_hf_key, limit=req.limit * 2, pubkeys=active_pubkeys,
        )
    except Exception as e:
        return JSONResponse({"error": str(e)})

    notes, low_confidence = _select_notes(raw_notes, active_pubkeys, req.limit)

    # Build prompts (same logic as ask)
    soul_hints, soul_details = _build_soul_context(req.question, active_pubkeys)
    context = _format_context(notes) if notes else "No notes retrieved."

    system_prompt = (
        "The notes below were retrieved via semantic search (vector similarity) against a database "
        "of Nostr posts. They are ranked by relevance to the user's query.\n\n"
        "SYNTHESIZE and AGGREGATE information from the provided notes to answer "
        "the user's question. Do NOT just list or repeat the notes.\n\n"
        "Rules:\n"
        "- Read ALL the notes carefully and identify patterns, consensus, disagreements, and key insights.\n"
        "- Form a direct, well-reasoned answer that draws from multiple notes when relevant.\n"
        "- Cite which notes support your points by number (e.g. [3], [7]).\n"
        "- If there are different opinions across notes, present the range of views.\n"
        "- If the notes don't contain enough information, say so clearly rather than speculating.\n"
        "- Never add information not present in the notes.\n"
        "- Be concise but thorough.\n\n"
        "If the retrieved notes are poorly matched to the question, end your response with:\n"
        "\"\\n\\n---\\n**Suggested search terms:** term1, term2, term3\"\n"
        "Suggest 3-5 alternative search queries that might yield better results from the same database."
    )

    parts = []
    if soul_hints:
        parts.append(soul_hints)
    if soul_details:
        parts.append(soul_details)
    parts.append(f"Here are the most relevant notes from the group:\n\n{context}")
    parts.append(f"Based on the above context, answer this question: {req.question}")
    user_prompt = "\n\n---\n\n".join(parts)

    # Token estimate (~4 chars per token)
    total_chars = len(system_prompt) + len(user_prompt)
    est_tokens = total_chars // 4
    user_prompt += f"\n\n---\n[Token estimate: ~{est_tokens}]"

    if low_confidence:
        system_prompt += (
            "\n\nIMPORTANT: The retrieved notes have low relevance scores to the question. "
            "Use the soul profiles and any tangentially relevant information to provide the best answer you can. "
            "Be upfront about what the notes directly address vs. what you're inferring."
        )

    return {
        "system_prompt": system_prompt,
        "user_prompt": user_prompt,
        "notes_count": len(notes),
        "low_confidence": low_confidence,
        "scores": [round(n.get("score", 0), 3) for n in notes],
    }


@router.get("/system-prompt")
async def get_system_prompt():
    """Return the static system prompt for immediate display."""
    return {"system_prompt": (
        "SYNTHESIZE and AGGREGATE information from the provided notes to answer "
        "the user's question. Do NOT just list or repeat the notes.\n\n"
        "Rules:\n"
        "- Read ALL the notes carefully and identify patterns, consensus, disagreements, and key insights.\n"
        "- Form a direct, well-reasoned answer that draws from multiple notes when relevant.\n"
        "- Cite which notes support your points by number (e.g. [3], [7]).\n"
        "- If there are different opinions across notes, present the range of views.\n"
        "- If the notes don't contain enough information, say so clearly rather than speculating.\n"
        "- Never add information not present in the notes.\n"
        "- Be concise but thorough.\n\n"
        "Note types: you may see regular notes, long-form articles, reposts, and metadata. "
        "Focus on the substantive content, not the metadata."
    )}


@router.post("/ask", response_model=AskResponse)
async def ask_question(
    req: AskRequest,
    x_hf_key: str = Header(default="", alias="X-HF-Key"),
    x_llm_key: str = Header(default="", alias="X-LLM-Key"),
    x_llm_base_url: str = Header(default="https://api.anthropic.com", alias="X-LLM-Base-URL"),
    x_llm_model: str = Header(default="claude-sonnet-4-5-20250514", alias="X-LLM-Model"),
):
    """RAG Q&A with soul-aware context. Tiered: hints always, soul files on mention, vector search for citations."""

    # Step 1: Retrieve notes (uses local embedder if no HF key)
    active_pubkeys = req.pubkeys if req.pubkeys else None
    try:
        raw_notes = await _retrieve_notes(
            req.question, hf_key=x_hf_key, limit=req.limit * 2, pubkeys=active_pubkeys,
        )
    except Exception as e:
        log.error("Retrieval failed: %s", e)
        return AskResponse(question=req.question, answer=f"Retrieval failed: {e}", sources=[])

    # Select notes: at least 1 per active user, then all above threshold
    notes, low_confidence = _select_notes(raw_notes, active_pubkeys, req.limit)

    if not notes:
        return AskResponse(
            question=req.question,
            answer="No relevant notes found for your question.",
            sources=[],
        )

    sources = [
        AskSourceNote(
            author=n["author"],
            content=n["content"],
            date=n["date"],
            score=n["score"],
            hashtags=n["hashtags"],
            event_id=n.get("event_id"),
            kind=n.get("kind"),
        )
        for n in notes
    ]

    # Step 2: Build tiered context
    soul_hints, soul_details = _build_soul_context(req.question, active_pubkeys)

    # Step 3: Synthesize answer
    if not x_llm_key:
        answer = _summarize_notes_locally(req.question, notes)
        if low_confidence:
            answer = "*Note: No highly relevant results found. Showing best available matches.*\n\n" + answer
        return AskResponse(question=req.question, answer=answer, sources=sources)

    context = _format_context(notes)

    system_prompt = (
        "The notes below were retrieved via semantic search (vector similarity) against a database "
        "of Nostr posts. They are ranked by relevance to the user's query.\n\n"
        "SYNTHESIZE and AGGREGATE information from the provided notes to answer "
        "the user's question. Do NOT just list or repeat the notes.\n\n"
        "Rules:\n"
        "- Read ALL the notes carefully and identify patterns, consensus, disagreements, and key insights.\n"
        "- Form a direct, well-reasoned answer that draws from multiple notes when relevant.\n"
        "- Cite which notes support your points by number (e.g. [3], [7]).\n"
        "- If there are different opinions across notes, present the range of views.\n"
        "- If the notes don't contain enough information, say so clearly rather than speculating.\n"
        "- Never add information not present in the notes.\n"
        "- Be concise but thorough.\n\n"
        "If the retrieved notes are poorly matched to the question, end your response with:\n"
        "\"\\n\\n---\\n**Suggested search terms:** term1, term2, term3\"\n"
        "Suggest 3-5 alternative search queries that might yield better results from the same database."
    )

    # Build user message with tiered context
    parts = []
    if soul_hints:
        parts.append(soul_hints)
    if soul_details:
        parts.append(soul_details)
    parts.append(f"Here are the most relevant notes from the group:\n\n{context}")
    parts.append(f"Based on the above context, answer this question: {req.question}")
    user_message = "\n\n---\n\n".join(parts)

    if low_confidence:
        system_prompt += (
            "\n\nIMPORTANT: The retrieved notes have low relevance scores to the question. "
            "Use the soul profiles and any tangentially relevant information to provide the best answer you can. "
            "Be upfront about what the notes directly address vs. what you're inferring."
        )

    try:
        llm_client = anthropic.Anthropic(
            api_key=x_llm_key,
            base_url=x_llm_base_url,
        )
        message = llm_client.messages.create(
            model=x_llm_model,
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )
        answer = message.content[0].text
    except Exception as e:
        log.error("LLM call failed: %s", e)
        answer = _summarize_notes_locally(req.question, notes) + f"\n\n*(LLM call failed: {e})*"

    return AskResponse(
        question=req.question,
        answer=answer,
        sources=sources,
        system_prompt=system_prompt,
        user_prompt=user_message,
    )


def _summarize_notes_locally(question: str, notes: list[dict]) -> str:
    """Fallback: compose a simple answer from top-ranked notes without LLM."""
    lines = [f"Top {len(notes)} relevant notes for: **{question}**\n"]
    for i, note in enumerate(notes[:5], 1):
        ts = (
            datetime.datetime.fromtimestamp(note["date"]).strftime("%Y-%m-%d")
            if note["date"] else "?"
        )
        tags = f" [#{', #'.join(note['hashtags'][:3])}]" if note["hashtags"] else ""
        snippet = note["content"][:200]
        lines.append(f"[{i}] **{note['author']}** ({ts}){tags}: {snippet}")
    lines.append(
        "\n*No LLM key provided — showing raw note excerpts. "
        "Add an LLM API key in Settings for AI-powered synthesis.*"
    )
    return "\n\n".join(lines)
