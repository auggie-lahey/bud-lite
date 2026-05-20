"""
Recursive character text splitter — chunks text into ~512 char segments
with 64 char overlap for context preservation.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class TextChunk:
    """A single text chunk with metadata."""

    text: str
    index: int
    start_char: int
    end_char: int


# Default separators in priority order
DEFAULT_SEPARATORS = ["\n\n", "\n", ". ", " ", ""]


def chunk_text(
    text: str,
    chunk_size: int = 512,
    chunk_overlap: int = 64,
    separators: list[str] | None = None,
) -> list[TextChunk]:
    """Split text into overlapping chunks.

    Tries each separator in order, splitting at the largest meaningful boundary
    that fits within chunk_size. Falls back to character-level splitting.

    Returns list of TextChunk with position metadata.
    """
    if not text.strip():
        return []

    separators = separators or DEFAULT_SEPARATORS
    chunks: list[TextChunk] = []

    _recursive_split(text, separators, chunk_size, chunk_overlap, 0, chunks)

    # Re-index after collection
    for i, chunk in enumerate(chunks):
        chunk.index = i

    return chunks


def _recursive_split(
    text: str,
    separators: list[str],
    chunk_size: int,
    chunk_overlap: int,
    start_char: int,
    results: list[TextChunk],
) -> None:
    """Recursively split text using separator hierarchy."""
    if len(text) <= chunk_size:
        results.append(
            TextChunk(
                text=text,
                index=0,
                start_char=start_char,
                end_char=start_char + len(text),
            )
        )
        return

    # Try each separator
    for i, sep in enumerate(separators):
        if not sep:
            # Empty separator = character-level split
            _split_by_length(text, chunk_size, chunk_overlap, start_char, results)
            return

        if sep in text:
            parts = text.split(sep)

            # Rejoin small parts back together to fill chunk_size
            current_chunk = ""
            chunk_start = start_char

            for j, part in enumerate(parts):
                candidate = sep.join([current_chunk, part]) if current_chunk else part

                if len(candidate) > chunk_size and current_chunk:
                    # Save current chunk
                    results.append(
                        TextChunk(
                            text=current_chunk.strip(),
                            index=0,
                            start_char=chunk_start,
                            end_char=chunk_start + len(current_chunk),
                        )
                    )

                    # Start new chunk with overlap
                    overlap_text = current_chunk[-chunk_overlap:] if chunk_overlap > 0 else ""
                    current_chunk = overlap_text + sep + part if overlap_text else part
                    chunk_start = chunk_start + len(current_chunk) - len(part) - len(overlap_text)
                else:
                    current_chunk = candidate

            # Don't forget the last chunk
            if current_chunk.strip():
                if len(current_chunk) > chunk_size:
                    # Still too big — recurse with next separator
                    next_seps = separators[i + 1 :]
                    _recursive_split(
                        current_chunk, next_seps, chunk_size, chunk_overlap,
                        chunk_start, results,
                    )
                else:
                    results.append(
                        TextChunk(
                            text=current_chunk.strip(),
                            index=0,
                            start_char=chunk_start,
                            end_char=chunk_start + len(current_chunk),
                        )
                    )
            return

    # No separator found — split by length
    _split_by_length(text, chunk_size, chunk_overlap, start_char, results)


def _split_by_length(
    text: str,
    chunk_size: int,
    chunk_overlap: int,
    start_char: int,
    results: list[TextChunk],
) -> None:
    """Fallback: split text into fixed-size chunks with overlap."""
    pos = 0
    while pos < len(text):
        end = min(pos + chunk_size, len(text))
        chunk = text[pos:end]
        if chunk.strip():
            results.append(
                TextChunk(
                    text=chunk.strip(),
                    index=0,
                    start_char=start_char + pos,
                    end_char=start_char + end,
                )
            )
        pos += chunk_size - chunk_overlap
        if pos >= len(text):
            break
