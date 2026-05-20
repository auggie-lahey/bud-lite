"""
Minimal Blossom server API client.
"""

from __future__ import annotations

import logging
from typing import Optional

import httpx

log = logging.getLogger(__name__)


class BlossomClient:
    """HTTP client for a Blossom blob server."""

    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url.rstrip("/")

    async def get_blob(self, sha256: str) -> Optional[bytes]:
        """Download a blob by its SHA-256 hash. Returns None if not found."""
        url = f"{self.base_url}/{sha256}"
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.get(url)
                if resp.status_code == 200:
                    return resp.content
                return None
            except httpx.HTTPError as e:
                log.warning("failed to fetch blob %s: %s", sha256[:12], e)
                return None

    async def list_blobs(self, pubkey: str) -> list[dict]:
        """List blobs for a given pubkey (BUD-02)."""
        url = f"{self.base_url}/list/{pubkey}"
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.get(url)
                if resp.status_code == 200:
                    return resp.json()
                return []
            except httpx.HTTPError as e:
                log.warning("failed to list blobs for %s: %s", pubkey[:12], e)
                return []

    async def health(self) -> bool:
        """Check if the Blossom server is responding."""
        async with httpx.AsyncClient(timeout=5) as client:
            try:
                resp = await client.get(self.base_url)
                return resp.status_code < 500
            except httpx.HTTPError:
                return False
