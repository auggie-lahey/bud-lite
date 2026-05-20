"""
Qdrant collection management and point upserts.
Creates collection with int8 quantization for minimal RAM on free tier.
"""

from __future__ import annotations

import logging
from typing import Optional

from qdrant_client import QdrantClient, models
from qdrant_client.models import (
    Distance,
    OptimizersConfigDiff,
    ScalarQuantization,
    ScalarQuantizationConfig,
    ScalarType,
    VectorParams,
)

from app.config import get_settings

log = logging.getLogger(__name__)


def get_qdrant_client() -> QdrantClient:
    """Create a Qdrant client from settings."""
    settings = get_settings()
    kwargs: dict = {"url": settings.qdrant_url}
    if settings.qdrant_api_key:
        kwargs["api_key"] = settings.qdrant_api_key
    return QdrantClient(**kwargs)


def ensure_collection(client: Optional[QdrantClient] = None) -> QdrantClient:
    """Ensure the Qdrant collection exists with optimized settings.

    Creates the collection with:
    - int8 scalar quantization (4x smaller vectors)
    - on_disk_payload (payloads stored on disk, not RAM)
    - on_disk vectors (vectors stored on disk when possible)
    - Higher indexing threshold (less frequent optimization passes)

    Returns the QdrantClient.
    """
    if client is None:
        client = get_qdrant_client()

    settings = get_settings()
    collection_name = settings.collection_name

    existing = [c.name for c in client.get_collections().collections]
    if collection_name in existing:
        log.info("collection '%s' already exists", collection_name)
        return client

    client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(
            size=settings.vector_size,
            distance=Distance.COSINE,
            on_disk=True,  # Store vectors on disk to save RAM
        ),
        quantization_config=ScalarQuantization(
            scalar=ScalarQuantizationConfig(
                type=ScalarType.INT8,
                quantile=0.99,
                always_ram=False,  # Keep quantized values on disk too
            ),
        ),
        optimizers_config=OptimizersConfigDiff(
            indexing_threshold=20000,  # Don't index until 20K points
        ),
    )
    log.info(
        "created collection '%s' (size=%d, cosine, int8 quantization, on_disk)",
        collection_name,
        settings.vector_size,
    )
    return client


def upsert_points(
    points: list[models.PointStruct],
    batch_size: int = 50,
    client: Optional[QdrantClient] = None,
) -> int:
    """Upsert points into the collection in batches.

    Returns the total number of points upserted.
    """
    if client is None:
        client = get_qdrant_client()

    settings = get_settings()
    total = 0

    for i in range(0, len(points), batch_size):
        batch = points[i : i + batch_size]
        client.upsert(collection_name=settings.collection_name, points=batch)
        total += len(batch)
        log.info("  upserted %d/%d", min(i + batch_size, len(points)), len(points))

    return total


def build_note_point(
    event_id: str,
    vector: list[float],
    pubkey: str,
    content: str,
    created_at: int,
    hashtags: list[str],
    author_label: str = "",
    source_type: str = "nostr_note",
    kind: int = 1,
) -> models.PointStruct:
    """Build a Qdrant point for a Nostr event."""
    # Deterministic integer ID from event ID hex
    point_id = int(event_id[:16], 16)

    payload = {
        "event_id": event_id,
        "pubkey": pubkey,
        "author_label": author_label or pubkey[:8],
        "content": content,
        "created_at": created_at,
        "hashtags": hashtags,
        "source_type": source_type,
        "kind": kind,
    }

    return models.PointStruct(id=point_id, vector=vector, payload=payload)


def build_file_point(
    sha256: str,
    vector: list[float],
    content: str,
    file_name: str = "",
    mime_type: str = "",
    chunk_index: int = 0,
    source_type: str = "file",
) -> models.PointStruct:
    """Build a Qdrant point for an ingested file chunk."""
    # Deterministic ID from sha256 + chunk_index
    combined = f"{sha256}:{chunk_index}"
    point_id = int(hashlib.sha256(combined.encode()).hexdigest()[:16], 16)

    payload = {
        "sha256": sha256,
        "content": content,
        "file_name": file_name,
        "mime_type": mime_type,
        "chunk_index": chunk_index,
        "source_type": source_type,
    }

    return models.PointStruct(id=point_id, vector=vector, payload=payload)


# Needed for build_file_point
import hashlib
