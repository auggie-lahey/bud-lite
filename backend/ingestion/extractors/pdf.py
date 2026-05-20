"""
PDF text extraction via PyMuPDF (fitz).
Local, no API needed, no network calls.
"""

from __future__ import annotations

import logging

import pymupdf  # PyMuPDF

log = logging.getLogger(__name__)


def extract_pdf(file_path: str) -> str:
    """Extract text from a PDF file using PyMuPDF.

    Returns extracted text string. Raises on failure.
    """
    doc = pymupdf.open(file_path)
    pages = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text")
        if text.strip():
            pages.append(text.strip())

    doc.close()

    result = "\n\n".join(pages)
    log.info("extracted %d chars from %d pages in %s", len(result), len(pages), file_path)
    return result
