"""
Simple IP-based rate limiter — sliding window, in-memory.

No Redis needed. Good enough for single-instance deploy.
"""

from __future__ import annotations

import time
from collections import defaultdict

from fastapi import Request
from fastapi.responses import JSONResponse


class RateLimiter:
    """Sliding window rate limiter per client IP."""

    def __init__(self, max_requests: int = 20, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # ip -> list of request timestamps
        self._hits: dict[str, list[float]] = defaultdict(list)

    def _cleanup(self, ip: str, now: float) -> None:
        """Remove timestamps outside the sliding window."""
        cutoff = now - self.window_seconds
        self._hits[ip] = [t for t in self._hits[ip] if t > cutoff]

    def is_allowed(self, ip: str) -> bool:
        """Check if request from this IP is allowed. Returns False if rate limited."""
        now = time.time()
        self._cleanup(ip, now)
        if len(self._hits[ip]) >= self.max_requests:
            return False
        self._hits[ip].append(now)
        return True

    def remaining(self, ip: str) -> int:
        """How many requests remaining in current window."""
        now = time.time()
        self._cleanup(ip, now)
        return max(0, self.max_requests - len(self._hits[ip]))


# Singleton instance — 20 req/min on /ask
ask_limiter = RateLimiter(max_requests=20, window_seconds=60)


def get_client_ip(request: Request) -> str:
    """Extract client IP, respecting X-Forwarded-For for reverse proxies."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def rate_limit_middleware(request: Request, call_next):
    """Rate limit /ask endpoint. Other endpoints pass through."""
    if request.url.path == "/ask" and request.method == "POST":
        ip = get_client_ip(request)
        if not ask_limiter.is_allowed(ip):
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limited. Try again in a minute.",
                    "remaining": 0,
                },
                headers={"Retry-After": "60"},
            )
    return await call_next(request)
