"""
HuggingFace Spaces deployment for WidiAI backend.
FastAPI app with rate limiting (5 requests/min per user).
"""
import os
from fastapi import FastAPI, Request

# Import the base app from main.py
from backend.main import (
    app as base_app,
    _load_allowed_origins,
)

# Add rate limiting
try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    from slowapi.middleware import SlowAPIMiddleware

    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=["5/minute"],
        storage_uri="memory://",
    )

    app = base_app
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)

    # Add rate limit to existing routes
    for route in app.routes:
        if hasattr(route, 'endpoint'):
            original_endpoint = route.endpoint
            if original_endpoint.__name__ in ['transcribe_audio']:
                route.endpoint = limiter.limit("5/minute")(original_endpoint)

except ImportError:
    # Fallback if slowapi not installed - just use base app
    app = base_app

# Configure for HF Spaces
allowed_origins = _load_allowed_origins()
hf_space_url = os.getenv("HF_SPACE_HOST", "")
if hf_space_url and hf_space_url not in allowed_origins:
    allowed_origins.append(hf_space_url)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)

