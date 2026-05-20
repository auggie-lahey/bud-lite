"""
Integration test — verifies backend stack with real services.
Run: .venv/bin/python test_integration.py
"""

import asyncio
import sys
import os

# Ensure we load .env
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from app.config import get_settings


def test_config():
    """Phase 1: Config loads correctly."""
    s = get_settings()
    assert s.anthropic_api_key, "ANTHROPIC_API_KEY not set"
    assert s.anthropic_base_url, "ANTHROPIC_BASE_URL not set"
    assert len(s.pubkey_list) >= 1, "No pubkeys configured"
    assert len(s.relay_list) >= 1, "No relays configured"
    print(f"  [PASS] config: {len(s.pubkey_list)} pubkeys, {len(s.relay_list)} relays")
    print(f"  [PASS] LLM: {s.anthropic_model} @ {s.anthropic_base_url}")
    if not s.huggingface_api_key:
        print(f"  [WARN] No HUGGINGFACE_API_KEY — embedding tests will fail")
    return s.huggingface_api_key != ""


def test_qdrant_connection():
    """Phase 2: Qdrant is reachable and collection exists."""
    from ingestion.indexer import ensure_collection, get_qdrant_client
    from app.config import get_settings

    s = get_settings()
    client = ensure_collection()
    info = client.get_collection(s.collection_name)
    assert info.points_count is not None
    print(f"  [PASS] qdrant: collection '{s.collection_name}', {info.points_count} points, status={info.status}")


def test_nostr_fetch():
    """Phase 3: Can fetch notes from Nostr relays."""
    from ingestion.nostr_sync import fetch_all_notes

    # Small fetch — just 10 notes, first pubkey only
    settings = get_settings()
    notes = fetch_all_notes(
        pubkeys=[settings.pubkey_list[0]],
        limit_per_pubkey=10,
        timeout=10.0,
    )
    print(f"  [PASS] nostr fetch: {len(notes)} notes from {settings.pubkey_list[0][:12]}...")
    return notes


async def test_embed_and_index(notes):
    """Phase 4: Embed notes and index into Qdrant."""
    from ingestion.embedder import embed_texts
    from ingestion.indexer import build_note_point, upsert_points, ensure_collection
    from app.config import get_settings

    s = get_settings()

    if not s.huggingface_api_key:
        print("  [SKIP] embed: no HuggingFace API key")
        return

    if not notes:
        print("  [SKIP] embed: no notes to index")
        return

    # Take first 3 notes for test
    test_notes = notes[:3]
    contents = [n.content for n in test_notes]
    vectors = await embed_texts(contents)
    assert len(vectors) == len(test_notes)
    assert len(vectors[0]) == s.vector_size
    print(f"  [PASS] embed: {len(vectors)} vectors, dim={len(vectors[0])}")

    # Build points
    label_map = s.pubkey_label_map
    points = []
    for note, vector in zip(test_notes, vectors):
        point = build_note_point(
            event_id=note.event_id,
            vector=vector,
            pubkey=note.pubkey,
            content=note.content,
            created_at=note.created_at,
            hashtags=note.hashtags,
            author_label=label_map.get(note.pubkey, ""),
            source_type=note.source_type,
        )
        points.append(point)

    # Upsert
    client = ensure_collection()
    count = upsert_points(points, client=client)
    print(f"  [PASS] index: {count} points upserted")


async def test_search():
    """Phase 5: Search endpoint returns results."""
    from ingestion.embedder import embed_text
    from ingestion.indexer import get_qdrant_client
    from app.config import get_settings

    s = get_settings()
    if not s.huggingface_api_key:
        print("  [SKIP] search: no HuggingFace API key")
        return

    vector = await embed_text("bitcoin")
    client = get_qdrant_client()
    results = client.query_points(
        collection_name=s.collection_name,
        query=vector,
        limit=5,
    )
    print(f"  [PASS] search: {len(results.points)} results for 'bitcoin'")
    for r in results.points[:3]:
        p = r.payload or {}
        print(f"    - {r.score:.3f} {p.get('author_label', '?')}: {p.get('content', '')[:60]}...")


async def test_ask():
    """Phase 6: Ask endpoint returns answer from LLM."""
    from app.ask import ask_question
    from models.schemas import AskRequest

    resp = await ask_question(AskRequest(question="What do people think about bitcoin?", limit=5))
    assert resp.answer, "No answer returned"
    print(f"  [PASS] ask: {len(resp.answer)} chars, {len(resp.sources)} sources")
    print(f"    answer preview: {resp.answer[:100]}...")


def test_chunker():
    """Phase 7: Text chunker works correctly."""
    from ingestion.chunker import chunk_text

    text = "Word " * 300  # ~1500 chars
    chunks = chunk_text(text, chunk_size=512, chunk_overlap=64)
    assert len(chunks) > 1, "Should produce multiple chunks"
    assert all(len(c.text) <= 600 for c in chunks), "Chunks should be roughly chunk_size"
    print(f"  [PASS] chunker: {len(chunks)} chunks from {len(text)} chars")


def main():
    print("=== Backend Integration Tests ===\n")

    # Sync tests
    print("[1/7] Config...")
    has_hf = test_config()

    print("\n[2/7] Qdrant connection...")
    test_qdrant_connection()

    print("\n[3/7] Nostr fetch...")
    notes = test_nostr_fetch()

    print("\n[4/7] Embed + Index...")
    asyncio.run(test_embed_and_index(notes))

    print("\n[5/7] Search...")
    asyncio.run(test_search())

    print("\n[6/7] Ask (LLM)...")
    asyncio.run(test_ask())

    print("\n[7/7] Chunker...")
    test_chunker()

    print("\n=== All tests complete ===")


if __name__ == "__main__":
    main()
