"""
Audio transcription via Groq Whisper API.

Sends audio file to whisper-large-v3 for transcription.
Free tier: 1440 requests/day.
"""

from __future__ import annotations

import logging

import httpx

from app.config import get_settings

log = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions"


async def extract_audio(file_path: str) -> str:
    """Transcribe audio file using Groq Whisper.

    Returns transcription text. Raises on API failure.
    """
    settings = get_settings()
    if not settings.groq_api_key:
        raise ValueError("GROQ_API_KEY not configured")

    with open(file_path, "rb") as f:
        audio_bytes = f.read()

    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
    }

    # Groq expects multipart/form-data
    files = {
        "file": (file_path.split("/")[-1], audio_bytes),
        "model": (None, "whisper-large-v3"),
        "response_format": (None, "text"),
    }

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(GROQ_API_URL, headers=headers, files=files)
        resp.raise_for_status()
        text = resp.text.strip()

    log.info("transcribed %d chars from audio %s", len(text), file_path)
    return text
