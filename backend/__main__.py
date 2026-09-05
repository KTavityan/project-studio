"""Run the studio bound to localhost only."""

import uvicorn

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8787, factory=False)
