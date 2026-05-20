"""
File processor — routes files to the correct extractor by MIME type,
then chunks the extracted text and indexes it into Qdrant.
"""

from __future__ import annotations

import logging
import mimetypes
import os

from app.config import get_settings
from ingestion.chunker import chunk_text
from ingestion.embedder import embed_texts
from ingestion.indexer import build_file_point, ensure_collection, upsert_points

log = logging.getLogger(__name__)

# MIME type → extractor module mapping
MIME_EXTRACTORS = {
    "application/pdf": "pdf",
    "image/jpeg": "image",
    "image/png": "image",
    "image/gif": "image",
    "image/webp": "image",
    "audio/mpeg": "audio",
    "audio/wav": "audio",
    "audio/ogg": "audio",
    "audio/mp4": "audio",
    "audio/webm": "audio",
}


def _guess_mime(file_path: str) -> str:
    """Guess MIME type from file path, falling back to extension."""
    mime, _ = mimetypes.guess_type(file_path)
    if mime:
        return mime
    # Fallback by extension
    ext = os.path.splitext(file_path)[1].lower()
    ext_map = {
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".ogg": "audio/ogg",
        ".m4a": "audio/mp4",
        ".webm": "audio/webm",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".pdf": "application/pdf",
    }
    return ext_map.get(ext, "application/octet-stream")


async def extract_text(file_path: str, mime_type: str = "") -> str:
    """Route file to the correct extractor based on MIME type.

    Returns extracted text. Falls back to reading as plain text.
    """
    mime_type = mime_type or _guess_mime(file_path)
    extractor_key = MIME_EXTRACTORS.get(mime_type)

    if extractor_key == "pdf":
        from ingestion.extractors.pdf import extract_pdf
        return extract_pdf(file_path)

    elif extractor_key == "image":
        from ingestion.extractors.image import extract_image
        return await extract_image(file_path)

    elif extractor_key == "audio":
        from ingestion.extractors.audio import extract_audio
        return await extract_audio(file_path)

    else:
        # Plain text — try reading as UTF-8
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        except UnicodeDecodeError:
            log.warning("cannot extract text from %s (mime: %s)", file_path, mime_type)
            return ""


async def process_file(
    file_path: str,
    sha256: str = "",
    mime_type: str = "",
    chunk_size: int = 512,
    chunk_overlap: int = 64,
    hf_api_key: str = "",
) -> int:
    """Full pipeline: extract → chunk → embed → index.

    Args:
        hf_api_key: HuggingFace key passed from user's browser
    Returns number of chunks indexed.
    """
    settings = get_settings()

    # Extract text
    text = await extract_text(file_path, mime_type)
    if not text.strip():
        log.warning("no text extracted from %s", file_path)
        return 0

    # Compute SHA-256 if not provided
    if not sha256:
        import hashlib
        with open(file_path, "rb") as f:
            sha256 = hashlib.sha256(f.read()).hexdigest()

    # Chunk
    chunks = chunk_text(text, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    if not chunks:
        return 0

    log.info("extracted %d chars, chunked into %d segments", len(text), len(chunks))

    # Embed all chunks
    chunk_texts = [c.text for c in chunks]
    vectors = await embed_texts(chunk_texts, api_key=hf_api_key)

    # Build Qdrant points
    points = []
    file_name = os.path.basename(file_path)
    actual_mime = mime_type or _guess_mime(file_path)

    for chunk, vector in zip(chunks, vectors):
        if vector is None:
            continue
        point = build_file_point(
            sha256=sha256,
            vector=vector,
            content=chunk.text,
            file_name=file_name,
            mime_type=actual_mime,
            chunk_index=chunk.index,
        )
        points.append(point)

    # Upsert
    client = ensure_collection()
    count = upsert_points(points, client=client)
    log.info("indexed %d chunks from file %s", count, file_path)
    return count
