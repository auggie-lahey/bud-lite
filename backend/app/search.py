"""
Search endpoint — embeds query via HuggingFace, queries Qdrant, returns results.
API keys come from request headers (per-user, stored in browser).
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Header, Query

from app.config import get_settings
from ingestion.embedder import embed_text
from ingestion.indexer import get_qdrant_client
from models.schemas import SearchResponse, SearchResultItem

log = logging.getLogger(__name__)
router = APIRouter()


@router.get("/search", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=1),
    limit: int = Query(default=10, le=50),
    pubkeys: str = Query(default="", alias="pubkeys"),  # Comma-separated hex pubkeys
    x_hf_key: str = Header(default="", alias="X-HF-Key"),
):
    """Semantic search. Filter by pubkeys if provided."""
    settings = get_settings()

    # Parse pubkey filter
    pk_filter = [p.strip() for p in pubkeys.split(",") if p.strip()] if pubkeys else []

    # Embed the query (local fallback if no key)
    try:
        query_vector = await embed_text(q, api_key=x_hf_key)
    except Exception as e:
        log.error("Embedding failed: %s", e)
        return SearchResponse(query=q, count=0, results=[], error=str(e))

    # Query Qdrant
    client = get_qdrant_client()
    try:
        query_params = dict(
            collection_name=settings.collection_name,
            query=query_vector,
            limit=limit,
        )
        # Add pubkey filter if specified
        if pk_filter:
            query_params["query_filter"] = {
                "must": [{"key": "pubkey", "match": {"any": pk_filter}}]
            }
        results = client.query_points(**query_params)
    except Exception as e:
        log.error("Qdrant query failed: %s", e)
        return SearchResponse(query=q, count=0, results=[], error=str(e))

    items = []
    for r in results.points:
        p = r.payload or {}
        items.append(
            SearchResultItem(
                score=r.score,
                event_id=p.get("event_id"),
                pubkey=p.get("pubkey"),
                author_label=p.get("author_label"),
                content=p.get("content", ""),
                created_at=p.get("created_at"),
                hashtags=p.get("hashtags", []),
                source_type=p.get("source_type"),
                kind=p.get("kind"),
                sha256=p.get("sha256"),
            )
        )

    return SearchResponse(query=q, count=len(items), results=items)
