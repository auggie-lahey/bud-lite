"""
Embedding generation — dual mode:
  - With API key (X-HF-Key header) → HuggingFace Inference API (remote)
  - Without API key → local sentence-transformers (dev mode)

Same model (mxbai-embed-large-v1), same 1024-dim vectors, either way.
"""

from __future__ import annotations

import hashlib
import logging
import time

import httpx

from app.config import get_settings

log = logging.getLogger(__name__)

HF_API_URL = "https://router.huggingface.co/hf-inference/models/{}"

# In-memory cache: text hash → vector
_cache: dict[str, list[float]] = {}

# Lazy-loaded local model (singleton)
_local_model = None


def _get_local_model():
    """Lazy-load sentence-transformers model for local dev."""
    global _local_model
    if _local_model is None:
        from sentence_transformers import SentenceTransformer

        settings = get_settings()
        log.info("loading local embedding model: %s", settings.embedding_model)
        _local_model = SentenceTransformer(settings.embedding_model)
        log.info("local model loaded")
    return _local_model


async def embed_text(text: str, api_key: str = "") -> list[float]:
    """Embed a single text string."""
    vectors = await embed_texts([text], api_key=api_key)
    return vectors[0]


async def embed_texts(texts: list[str], api_key: str = "") -> list[list[float]]:
    """Embed texts. If api_key provided → remote HF API. Otherwise → local model."""

    # Check cache
    uncached: list[tuple[int, str]] = []
    results: list[list[float] | None] = [None] * len(texts)

    for i, text in enumerate(texts):
        key = hashlib.sha256(text.encode()).hexdigest()
        if key in _cache:
            results[i] = _cache[key]
        else:
            uncached.append((i, text))

    if not uncached:
        return results  # type: ignore[return-value]

    if api_key:
        vectors_map = await _embed_remote(uncached, api_key)
    else:
        vectors_map = await _embed_local(uncached)

    for (orig_idx, text), vector in vectors_map:
        results[orig_idx] = vector
        cache_key = hashlib.sha256(text.encode()).hexdigest()
        _cache[cache_key] = vector

    return results  # type: ignore[return-value]


async def _embed_local(
    items: list[tuple[int, str]],
) -> list[tuple[tuple[int, str], list[float]]]:
    """Embed using local sentence-transformers. Process in smaller batches."""
    import asyncio

    model = _get_local_model()
    loop = asyncio.get_event_loop()
    result: list[tuple[tuple[int, str], list[float]]] = []

    # Process in small chunks to avoid memory/time spikes on CPU
    chunk_size = 16
    for i in range(0, len(items), chunk_size):
        chunk = items[i : i + chunk_size]
        texts = [t for _, t in chunk]
        embeddings = await loop.run_in_executor(
            None, lambda t=texts: model.encode(t, batch_size=8, show_progress_bar=False)
        )
        for item, vec in zip(chunk, embeddings.tolist()):
            result.append((item, vec))
        log.info("embedded %d/%d", min(i + chunk_size, len(items)), len(items))

    return result


async def _embed_remote(
    items: list[tuple[int, str]], api_key: str,
) -> list[tuple[tuple[int, str], list[float]]]:
    """Embed using HuggingFace Inference API."""
    settings = get_settings()
    url = HF_API_URL.format(settings.embedding_model)
    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    result: list[tuple[tuple[int, str], list[float]]] = []
    batch_size = 16

    for batch_start in range(0, len(items), batch_size):
        batch = items[batch_start : batch_start + batch_size]
        batch_texts = [t for _, t in batch]

        for attempt in range(3):
            try:
                async with httpx.AsyncClient(timeout=60) as client:
                    resp = await client.post(
                        url, headers=headers, json={"inputs": batch_texts}
                    )
                    resp.raise_for_status()
                    data = resp.json()

                vectors = _parse_hf_response(data, len(batch_texts))

                for j, item in enumerate(batch):
                    result.append((item, vectors[j]))
                break

            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    wait = 2 ** attempt * 5
                    log.warning("HF rate limited, waiting %ds", wait)
                    time.sleep(wait)
                elif e.response.status_code == 503:
                    log.info("HF model loading, waiting 20s...")
                    time.sleep(20)
                else:
                    raise
            except Exception as e:
                log.error("Embedding failed: %s", e)
                if attempt == 2:
                    raise
                time.sleep(2 ** attempt)

    return result


def _parse_hf_response(data: list | list[list], count: int) -> list[list[float]]:
    """Parse HF API response into list of flat vectors."""
    vectors: list[list[float]] = []
    for item in data:
        if isinstance(item[0], list):
            if len(item) == 1:
                vectors.append(item[0])
            else:
                dim = len(item[0])
                avg = [0.0] * dim
                for token_vec in item:
                    for d in range(dim):
                        avg[d] += token_vec[d]
                for d in range(dim):
                    avg[d] /= len(item)
                vectors.append(avg)
        else:
            vectors.append(item)
    return vectors
