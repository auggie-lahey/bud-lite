"""
FastAPI application — RAG backend for the Internet Archive on Nostr.

Endpoints:
    GET  /status  — Qdrant collection info
    GET  /search  — Semantic search (query -> Qdrant results)
    POST /ask     — RAG Q&A (retrieve + Claude synthesis)
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.ask import router as ask_router
from app.search import router as search_router
from app.status import router as status_router
from app.pubkeys import router as pubkeys_router
from app.pubkey_page import router as pubkey_page_router
from app.rate_limit import rate_limit_middleware
from ingestion.indexer import get_qdrant_client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger("rag-backend")


def create_app() -> FastAPI:
    """Application factory."""
    settings = get_settings()

    app = FastAPI(
        title="Nostr RAG Backend",
        description="Semantic search & Q&A over Nostr notes and ingested files",
        version="0.1.0",
    )

    # CORS — allow consumer-site (GitHub Pages) and local dev
    origins = [
        "http://localhost:3000",
        "http://localhost:5173",  # Vite default
        "http://localhost:8080",
        "https://auggie-lahey.github.io",
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
        expose_headers=["X-Keys-Source"],
    )

    # Rate limiting on /ask (20 req/min per IP)
    app.middleware("http")(rate_limit_middleware)

    # Mount routes
    app.include_router(status_router, tags=["status"])
    app.include_router(search_router, tags=["search"])
    app.include_router(ask_router, tags=["ask"])
    app.include_router(pubkeys_router, tags=["pubkeys"])
    app.include_router(pubkey_page_router, tags=["pubkey_page"])

    @app.get("/health")
    async def health():
        """Health check — verifies Qdrant connectivity."""
        try:
            client = get_qdrant_client()
            info = client.get_collection(settings.collection_name)
            return {"status": "ok", "qdrant": info.status, "points": info.points_count}
        except Exception as e:
            return {"status": "degraded", "qdrant": "unavailable", "error": str(e)}

    @app.on_event("startup")
    async def startup():
        """Ensure Qdrant collection exists on startup."""
        from ingestion.indexer import ensure_collection

        try:
            ensure_collection()
            log.info("Qdrant collection ready")
        except Exception as e:
            log.warning("Could not connect to Qdrant: %s", e)

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8080, reload=True)
