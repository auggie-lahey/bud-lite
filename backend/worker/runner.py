"""
Worker runner — CLI for ingestion jobs.

Jobs:
- nostr_sync: Fetch and index Nostr notes
- file_ingest: Process a file from Blossom storage

API keys must be provided via env vars or CLI args for batch operations.
For per-request usage, keys come from the frontend via HTTP headers.
"""

from __future__ import annotations

import asyncio
import logging
import os
import sys

from app.config import get_settings

log = logging.getLogger(__name__)


async def run_nostr_sync(hf_api_key: str = "", full: bool = False):
    """Fetch and index Nostr notes. Default: incremental. full=True: refetch everything."""
    from ingestion.nostr_sync import sync_and_index

    mode = "full" if full else "incremental"
    log.info("starting Nostr sync (%s)...", mode)
    count = await sync_and_index(hf_api_key=hf_api_key, full=full)
    log.info("Nostr sync complete: %d notes indexed", count)
    return count


def run_soul_generation():
    """Generate soul files and hints for all configured pubkeys."""
    from ingestion.soul_generator import generate_all_souls

    log.info("generating soul files...")
    hints = generate_all_souls()
    log.info("soul generation complete: %d profiles created", len(hints))
    return hints


async def run_file_ingest(
    file_path: str, hf_api_key: str = "", sha256: str = "", mime_type: str = "",
):
    """Process a single file: extract text → chunk → embed → index."""
    from ingestion.file_processor import process_file

    log.info("processing file: %s", file_path)
    count = await process_file(
        file_path, sha256=sha256, mime_type=mime_type, hf_api_key=hf_api_key,
    )
    log.info("file processed: %d chunks indexed", count)
    return count


def run_all_syncs(hf_api_key: str = "", full: bool = False):
    """Run all sync jobs sequentially (for CLI use). Default: incremental."""
    log.info("running all sync jobs...")

    async def _run():
        note_count = await run_nostr_sync(hf_api_key=hf_api_key, full=full)
        print(f"Indexed {note_count} Nostr notes")

    asyncio.run(_run())

    # Generate soul files after sync
    hints = run_soul_generation()
    print(f"Generated {len(hints)} soul profiles")


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    # HF key from env or CLI
    hf_key = os.environ.get("HF_API_KEY", "")

    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        full = "--full" in sys.argv
        if cmd == "sync":
            asyncio.run(run_nostr_sync(hf_api_key=hf_key, full=full))
        elif cmd == "souls":
            run_soul_generation()
        elif cmd == "file" and len(sys.argv) > 2:
            file_path = sys.argv[2]
            sha256 = sys.argv[3] if len(sys.argv) > 3 else ""
            mime = sys.argv[4] if len(sys.argv) > 4 else ""
            asyncio.run(run_file_ingest(
                file_path, hf_api_key=hf_key, sha256=sha256, mime_type=mime,
            ))
        else:
            print("Usage: python -m worker.runner [sync [--full] | souls | file <path> [sha256] [mime]]")
            sys.exit(1)
    else:
        asyncio.run(run_nostr_sync(hf_api_key=hf_key))
