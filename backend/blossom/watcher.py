"""
Blossom blob directory watcher — monitors for new files and processes them inline.

Uses watchfiles for filesystem events. No queue needed — processes one file at a time.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
import os
from pathlib import Path

from app.config import get_settings
from ingestion.file_processor import process_file

log = logging.getLogger(__name__)

# Track already-processed files to avoid reprocessing
_processed: set[str] = set()


def sha256_file(file_path: str) -> str:
    """Compute SHA-256 hash of a file."""
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


async def process_new_file(file_path: str, hf_api_key: str = "") -> int:
    """Process a single new file from the Blossom data dir.

    Returns number of chunks indexed. Skips if already processed.
    """
    # Skip if already processed
    abs_path = os.path.abspath(file_path)
    if abs_path in _processed:
        return 0

    _processed.add(abs_path)

    try:
        sha = sha256_file(file_path)
        count = await process_file(file_path, sha256=sha, hf_api_key=hf_api_key)
        log.info("processed %s → %d chunks", file_path, count)
        return count
    except Exception as e:
        log.error("failed to process %s: %s", file_path, e)
        return 0


async def scan_existing_files(hf_api_key: str = ""):
    """Scan the Blossom data dir for existing files and process any unprocessed ones."""
    settings = get_settings()
    data_dir = Path(settings.blossom_data_dir)

    if not data_dir.exists():
        log.warning("blossom data dir does not exist: %s", data_dir)
        return

    # Walk the directory for files (blobs are stored as sha256 hashes)
    file_count = 0
    for root, _dirs, files in os.walk(data_dir):
        for fname in files:
            fpath = os.path.join(root, fname)
            # Skip very small files (metadata, locks) and hidden files
            if fname.startswith(".") or os.path.getsize(fpath) < 100:
                continue
            file_count += await process_new_file(fpath, hf_api_key=hf_api_key)

    log.info("existing file scan complete: %d files processed", file_count)


def watch_and_process(hf_api_key: str = ""):
    """Start watching the Blossom data directory for new files.

    Blocks forever. Processes files inline as they appear.
    """
    import watchfiles

    settings = get_settings()
    data_dir = settings.blossom_data_dir

    if not os.path.exists(data_dir):
        os.makedirs(data_dir, exist_ok=True)
        log.info("created blossom data dir: %s", data_dir)

    log.info("watching %s for new files...", data_dir)

    async def _process_change(changes):
        for change_type, path in changes:
            if change_type == watchfiles.Change.added:
                if os.path.isfile(path) and not os.path.basename(path).startswith("."):
                    log.info("new file detected: %s", path)
                    await process_new_file(path, hf_api_key=hf_api_key)

    # watchfiles.run is synchronous but supports async callbacks
    # We use the filter to only watch for created files
    for changes in watchfiles.watch(data_dir, watch_filter=lambda _: True):
        asyncio.run(_process_change(changes))


if __name__ == "__main__":
    """CLI: watch the blossom data dir for new files."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    watch_and_process()
