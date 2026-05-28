"""
Application configuration — server-side infra only (Qdrant, Nostr relays).
API keys for AI services come per-request from the frontend.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Server-side config. No API keys stored here — those come per-request."""

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Qdrant (only server-side infra that needs config)
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str = ""
    collection_name: str = "nostr_rag"
    vector_size: int = 1024

    # Embedding model name (not a secret, just a config choice)
    embedding_model: str = "mixedbread-ai/mxbai-embed-large-v1"

    # Nostr relays (for sync pipeline)
    relay_urls: str = (
        "wss://relay.damus.io,wss://nos.lol,"
        "wss://relay.nostr.net,wss://relay.primal.net"
    )

    # Pubkeys to index
    pubkeys: str = ""
    pubkey_labels: str = "{}"

    # Blossom data dir (for file watcher)
    blossom_data_dir: str = "./data/blobs"

    # Content filtering
    min_content_length: int = 20

    # Dev defaults (pre-filled in landing page UI only, NOT used server-side)
    dev_llm_key: str = ""
    dev_llm_base_url: str = ""
    dev_llm_model: str = ""
    dev_hf_key: str = ""

    @property
    def relay_list(self) -> list[str]:
        return [r.strip() for r in self.relay_urls.split(",") if r.strip()]

    @property
    def pubkey_list(self) -> list[str]:
        return [p.strip() for p in self.pubkeys.split(",") if p.strip()]

    @property
    def pubkey_label_map(self) -> dict[str, str]:
        try:
            return json.loads(self.pubkey_labels) if self.pubkey_labels else {}
        except json.JSONDecodeError:
            return {}


# Singleton
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
