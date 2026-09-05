from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"


def test_static_has_no_key_or_env_names():
    blob = ""
    for path in STATIC.iterdir():
        if path.suffix in {".html", ".js", ".css"}:
            blob += path.read_text(encoding="utf-8")
    for needle in ("STUDIO_API_KEY", "sk-", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"):
        assert needle not in blob


def test_job_ids_and_storage_key_present():
    js = (STATIC / "app.js").read_text(encoding="utf-8")
    assert "studio.v1" in js
    for job in ("job1", "job2", "job3", "job4"):
        assert job in js
    assert "make something cool for this" in js
    assert "Constraint from scrap:" in js
    assert "innerHTML" not in js
