"""
Image description via Google Gemini 2.0 Flash API.

Sends image bytes and prompts for a detailed visual description.
"""

from __future__ import annotations

import base64
import logging
import mimetypes

import httpx

from app.config import get_settings

log = logging.getLogger(__name__)

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

DESCRIPTION_PROMPT = (
    "Describe this image in detail. Include: "
    "the main subject, setting, colors, text visible in the image, "
    "any people or objects, and the overall scene. "
    "Be thorough — this description will be used for semantic search."
)


def _guess_mime(file_path: str) -> str:
    """Guess MIME type from file path."""
    mime, _ = mimetypes.guess_type(file_path)
    return mime or "image/jpeg"


async def extract_image(file_path: str) -> str:
    """Generate a detailed description of an image using Gemini.

    Returns description text string. Raises on API failure.
    """
    settings = get_settings()
    if not settings.gemini_api_key:
        raise ValueError("GEMINI_API_KEY not configured")

    with open(file_path, "rb") as f:
        img_bytes = f.read()

    img_b64 = base64.b64encode(img_bytes).decode()
    mime_type = _guess_mime(file_path)

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": DESCRIPTION_PROMPT},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": img_b64,
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.0,
            "maxOutputTokens": 2048,
        },
    }

    url = f"{GEMINI_API_URL}?key={settings.gemini_api_key}"

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()

    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        log.info("generated %d char description for image %s", len(text), file_path)
        return text
    except (KeyError, IndexError) as e:
        log.error("unexpected Gemini response format: %s", e)
        raise ValueError(f"Failed to parse Gemini response: {e}")
