"""Local Project Studio proxy. Binds localhost only. Never serves the API key."""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.engine import execute_run, reset_cap_for_tests, system_prefix, user_payload

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "public"
FONTS = STATIC / "fonts"
JOB_IDS = ("job1", "job2", "job3", "job4")

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
if STATIC.is_dir():
    app.mount("/static", StaticFiles(directory=str(STATIC)), name="static")
if FONTS.is_dir():
    app.mount("/fonts", StaticFiles(directory=str(FONTS)), name="fonts")


def fail(code: str, message: str) -> JSONResponse:
    return JSONResponse({"ok": False, "error": code, "message": message})


def gate_required() -> bool:
    return bool(os.environ.get("STUDIO_GATE", "").strip())


def gate_ok(request: Request) -> bool:
    expected = os.environ.get("STUDIO_GATE", "").strip()
    if not expected:
        return True
    got = request.headers.get("x-studio-gate", "")
    return got == expected


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True, "gate": gate_required()}


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC / "index.html")


@app.get("/styles.css")
def styles() -> FileResponse:
    return FileResponse(STATIC / "styles.css")


@app.get("/app.js")
def script() -> FileResponse:
    return FileResponse(STATIC / "app.js")


@app.post("/run")
async def run(request: Request) -> JSONResponse:
    if not gate_ok(request):
        return JSONResponse(
            {"ok": False, "error": "gate", "message": "This studio is gated."},
            status_code=401,
        )
    try:
        data = await request.json()
    except Exception:
        return fail("bad_request", "That run was rejected. Check the prompt and try again.")
    if not isinstance(data, dict):
        return fail("bad_request", "That run was rejected. Check the prompt and try again.")

    job_id = data.get("jobId")
    prompt = data.get("prompt")
    project = data.get("project")
    if job_id not in JOB_IDS:
        return fail("bad_request", "That run was rejected. Check the prompt and try again.")
    if not isinstance(prompt, str) or not prompt.strip():
        return fail("bad_request", "That run was rejected. Check the prompt and try again.")
    if not isinstance(project, dict):
        return fail("bad_request", "That run was rejected. Check the prompt and try again.")

    result = execute_run(job_id, prompt.strip(), project)
    if not result.get("ok"):
        return fail(result.get("error") or "upstream", result.get("message") or "The model did not respond. Try Run again.")
    return JSONResponse(result)


__all__ = [
    "app",
    "execute_run",
    "reset_cap_for_tests",
    "system_prefix",
    "user_payload",
]
