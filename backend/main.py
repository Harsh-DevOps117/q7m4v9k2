"""Application composition root for Docker, local development and Vercel."""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from backend.repository import ROOT
from backend.routes import router

app = FastAPI(
    title="Wind Desk API",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)
app.include_router(router)
if (ROOT / "frontend/dist").is_dir():
    app.mount(
        "/", StaticFiles(directory=ROOT / "frontend/dist", html=True), name="frontend"
    )
