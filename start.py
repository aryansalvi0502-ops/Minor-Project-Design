import os
import sys

# Ensure root directory is always on PYTHONPATH
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

import uvicorn

if __name__ == "__main__":
    # Render, Railway, Heroku pass PORT as an env var (e.g. 10000)
    raw_port = os.environ.get("PORT", "8000")
    try:
        port = int(raw_port)
    except (ValueError, TypeError):
        port = 8000

    host = os.environ.get("HOST", "0.0.0.0")
    print(f"[UDAAN Runner] Starting Uvicorn server on {host}:{port}...")
    uvicorn.run(
        "backend.app.main:app",
        host=host,
        port=port,
        reload=False,
        proxy_headers=True,
        forwarded_allow_ips="*"
    )
