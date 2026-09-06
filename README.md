# Project Studio

A local web studio for teaching someone AI by shipping pieces of *their* project. The project is the syllabus. There is no lesson list as the main view.

This is a new app. It is not `ai-llm-education-platform`.

## What it does

You name a project once. Four jobs rewrite themselves around that name. Each run is a prompt. The output renders as a card or a list, not a chat bubble. Ship pins it to a wall. Scrap prepends a constraint into the next prompt.

Locked behaviour lives in `SPEC.md`.

## Run

From this directory:

```
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
```

Put a key in `.env` as `STUDIO_API_KEY`, or set `STUDIO_MOCK=1` to skip the model and return canned artefacts.

```
.venv/bin/python -m backend
```

That binds `127.0.0.1:8787` only. Do not pass `--host 0.0.0.0`.

Open `http://127.0.0.1:8787`. The local server binds localhost only.

On Vercel the same UI is served from `public/` and `POST /run` goes to `api/run.py`. Set `STUDIO_API_KEY` in the project env, or leave it empty to use AI Gateway. The process spend cap is weaker on serverless because instances recycle; keep the provider budget tight as well.

## Tests

```
.venv/bin/pytest -q
```

## Notes

- The API key never goes to the page.
- Spend is capped per proxy process (`STUDIO_MAX_USD`, default 2).
- Browser state is `localStorage` key `studio.v1`. Reset clears it.
