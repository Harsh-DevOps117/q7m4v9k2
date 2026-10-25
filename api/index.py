"""Vercel entry point: restores the /api path that the vercel.json rewrite replaces."""

from urllib.parse import parse_qsl, urlencode
from backend.main import app as fastapi_app


async def app(scope, receive, send):
    if scope["type"] == "http":
        query = parse_qsl(scope["query_string"].decode(), keep_blank_values=True)
        original = [v for k, v in query if k == "__path"]
        if original:
            path = "/api/" + original[0].lstrip("/")
            rest = urlencode([(k, v) for k, v in query if k != "__path"])
            scope = {
                **scope,
                "path": path,
                "raw_path": path.encode(),
                "query_string": rest.encode(),
            }
    await fastapi_app(scope, receive, send)
