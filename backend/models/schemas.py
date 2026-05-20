"""
Pydantic models for API request/response schemas.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class SearchResultItem(BaseModel):
    """A single search result from Qdrant."""

    score: float
    event_id: str | None = None
    pubkey: str | None = None
    author_label: str | None = None
    content: str
    created_at: int | None = None
    hashtags: list[str] = Field(default_factory=list)
    source_type: str | None = None  # "nostr_note", "nostr_article", "file"
    kind: int | None = None
    sha256: str | None = None  # For file sources


class SearchResponse(BaseModel):
    """Response from GET /search."""

    query: str
    count: int
    results: list[SearchResultItem]
    error: str | None = None


class AskRequest(BaseModel):
    """Request body for POST /ask."""

    question: str
    limit: int = 15
    pubkeys: list[str] = Field(default_factory=list)  # Filter to these pubkeys (empty = all)


class AskSourceNote(BaseModel):
    """A source note cited in an Ask response."""

    author: str
    content: str
    date: int | float
    score: float
    hashtags: list[str] = Field(default_factory=list)
    event_id: str | None = None
    kind: int | None = None


class AskResponse(BaseModel):
    """Response from POST /ask."""

    question: str
    answer: str
    sources: list[AskSourceNote]
    system_prompt: str = ""
    user_prompt: str = ""


class StatusResponse(BaseModel):
    """Response from GET /status."""

    collection: str
    points_count: int | None = None
    vector_size: int | None = None
    status: str | None = None
    llm_configured: bool = False
    llm_model: str | None = None
    embedder: str = "huggingface"
    keys_source: str = "user-provided"
