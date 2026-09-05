from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "public"


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
    assert "grounded" in js and "invented" in js and "unknown" in js
    assert 'className = "sheet"' in js


def test_woff2_fonts_are_present():
    fonts = STATIC / "fonts"
    for name in (
        "aileron-regular.woff2",
        "aileron-italic.woff2",
        "noto-serif-regular.woff2",
        "noto-serif-italic.woff2",
        "noto-serif-bold.woff2",
    ):
        path = fonts / name
        assert path.is_file(), name
        assert path.stat().st_size > 1000


def test_css_is_print_shop_not_dashboard():
    css = (STATIC / "styles.css").read_text(encoding="utf-8")
    assert "Inter" not in css
    assert "indigo" not in css.lower()
    assert "Get Started" not in css
    assert ".sheet" in css
    assert "border-left: 4px" not in css
    assert "aileron-regular.woff2" in css
    assert "noto-serif-regular.woff2" in css
    assert "overflow-wrap: anywhere" in css
    assert "press-text" in css


def test_skip_target_is_always_in_dom():
    html = (STATIC / "index.html").read_text(encoding="utf-8")
    assert 'href="#main"' in html
    assert '<main id="main">' in html
    assert html.find('<main id="main">') < html.find('id="intake"')
