"""Vercel Python function for POST /run. Never returns the API key."""

from __future__ import annotations

import json
import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.engine import execute_run  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def log_message(self, *args, **kwargs) -> None:
        return

    def _send(self, status: int, payload: dict) -> None:
        raw = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.end_headers()

    def do_POST(self) -> None:
        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length) if length else b"{}"
            data = json.loads(raw.decode("utf-8") or "{}")
        except Exception:
            self._send(200, {"ok": False, "error": "bad_request", "message": "That run was rejected. Check the prompt and try again."})
            return
        if not isinstance(data, dict):
            self._send(200, {"ok": False, "error": "bad_request", "message": "That run was rejected. Check the prompt and try again."})
            return
        job_id = data.get("jobId")
        prompt = data.get("prompt")
        project = data.get("project")
        if job_id not in ("job1", "job2", "job3", "job4"):
            self._send(200, {"ok": False, "error": "bad_request", "message": "That run was rejected. Check the prompt and try again."})
            return
        if not isinstance(prompt, str) or not prompt.strip() or not isinstance(project, dict):
            self._send(200, {"ok": False, "error": "bad_request", "message": "That run was rejected. Check the prompt and try again."})
            return
        result = execute_run(job_id, prompt.strip(), project)
        self._send(200, result)
