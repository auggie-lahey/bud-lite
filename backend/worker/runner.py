"""
Worker runner — CLI for ingestion jobs.

Pipeline phases (run in order):
  1. fetch    — Fetch notes from Nostr relays
  2. enrich   — Resolve usernames + referenced event content
  3. index    — Embed enriched notes and upsert to Qdrant

Or run all at once with: sync

Other commands:
  souls       — Generate soul files and hints
  file        — Process a single file
"""

from __future__ import annotations

import asyncio
import logging
import os
import sys

from app.config import get_settings

log = logging.getLogger(__name__)


def run_fetch(full: bool = False) -> int:
    """Phase 1: Fetch notes from relays."""
    from ingestion.nostr_sync import fetch_notes

    mode = "full" if full else "incremental"
    log.info("Phase 1: fetching notes (%s)...", mode)
    count = fetch_notes(full=full)
    log.info("Phase 1 complete: %d notes fetched", count)
    return count


async def run_enrich_npubs() -> int:
    """Phase 2a: Resolve npub → @Username."""
    from ingestion.nostr_sync import enrich_npubs

    log.info("Phase 2a: resolving npubs...")
    count = await enrich_npubs()
    log.info("Phase 2a complete: %d substitutions", count)
    return count


async def run_enrich_nprofiles() -> int:
    """Phase 2b: Resolve nprofile → @Username."""
    from ingestion.nostr_sync import enrich_nprofiles

    log.info("Phase 2b: resolving nprofiles...")
    count = await enrich_nprofiles()
    log.info("Phase 2b complete: %d substitutions", count)
    return count


def run_enrich_nevents() -> int:
    """Phase 2c: Resolve nevent → quoted content."""
    from ingestion.nostr_sync import enrich_nevents

    log.info("Phase 2c: resolving nevents...")
    count = enrich_nevents()
    log.info("Phase 2c complete: %d substitutions", count)
    return count


def run_enrich_naddrs() -> int:
    """Phase 2d: Resolve naddr → article reference."""
    from ingestion.nostr_sync import enrich_naddrs

    log.info("Phase 2d: resolving naddrs...")
    count = enrich_naddrs()
    log.info("Phase 2d complete: %d substitutions", count)
    return count


def run_enrich_note1s() -> int:
    """Phase 2e: Resolve note1 → note content."""
    from ingestion.nostr_sync import enrich_note1s

    log.info("Phase 2e: resolving note1s...")
    count = enrich_note1s()
    log.info("Phase 2e complete: %d substitutions", count)
    return count


def run_enrich_replies() -> int:
    """Phase 2f: Prepend reply context to notes."""
    from ingestion.nostr_sync import enrich_replies

    log.info("Phase 2f: enriching reply context...")
    count = enrich_replies()
    log.info("Phase 2f complete: %d notes enriched", count)
    return count


async def run_enrich() -> int:
    """Phase 2 (all): Run all enrichment types."""
    from ingestion.nostr_sync import enrich_notes_file

    log.info("Phase 2: enriching notes...")
    count = await enrich_notes_file()
    log.info("Phase 2 complete: %d notes enriched", count)
    return count


async def run_index(hf_api_key: str = "") -> int:
    """Phase 3: Embed and index to Qdrant."""
    from ingestion.nostr_sync import embed_and_index

    log.info("Phase 3: embedding and indexing...")
    count = await embed_and_index(hf_api_key=hf_api_key)
    log.info("Phase 3 complete: %d events indexed", count)
    return count


async def run_nostr_sync(hf_api_key: str = "", full: bool = False):
    """Run all 3 phases sequentially."""
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


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    hf_key = os.environ.get("HF_API_KEY", "")

    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        full = "--full" in sys.argv
        if cmd == "sync":
            asyncio.run(run_nostr_sync(hf_api_key=hf_key, full=full))
        elif cmd == "fetch":
            run_fetch(full=full)
        elif cmd == "enrich":
            asyncio.run(run_enrich())
        elif cmd == "enrich-npubs":
            asyncio.run(run_enrich_npubs())
        elif cmd == "enrich-nprofiles":
            asyncio.run(run_enrich_nprofiles())
        elif cmd == "enrich-nevents":
            run_enrich_nevents()
        elif cmd == "enrich-naddrs":
            run_enrich_naddrs()
        elif cmd == "enrich-note1s":
            run_enrich_note1s()
        elif cmd == "enrich-replies":
            run_enrich_replies()
        elif cmd == "index":
            asyncio.run(run_index(hf_api_key=hf_key))
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
            print("Usage: python -m worker.runner <command> [options]")
            print()
            print("Pipeline (run in order):")
            print("  fetch [--full]        Fetch notes from Nostr relays")
            print("  enrich-npubs          Resolve npub → @Username")
            print("  enrich-nprofiles      Resolve nprofile → @Username")
            print("  enrich-nevents        Resolve nevent → quoted content")
            print("  enrich-naddrs         Resolve naddr → article reference")
            print("  enrich-note1s         Resolve note1 → note content")
            print("  enrich-replies        Prepend reply context to notes")
            print("  index                 Embed and upsert to Qdrant")
            print()
            print("Shortcuts:")
            print("  enrich                Run all enrichment steps")
            print("  sync [--full]         Fetch + enrich + index (all-in-one)")
            print()
            print("Other:")
            print("  souls                 Generate soul files and hints")
            print("  file <path>           Process a single file")
            sys.exit(1)
    else:
        asyncio.run(run_nostr_sync(hf_api_key=hf_key))
