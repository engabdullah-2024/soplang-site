# Soplang Playground Runner

A small, dependency-free HTTP service that executes untrusted Soplang source
code and returns its stdout/stderr. This is what actually runs code
submitted through the [Playground](../app/(dashboard)/playground/page.tsx) —
it is deployed **separately** from the Next.js site, on its own container,
because it needs a much tighter sandbox than a normal web app.

The Next.js site talks to it through `app/api/run/route.ts`, which forwards
`{ code }` and expects back `{ stdout, stderr, exitCode, timeMs }`.

Soplang's reference interpreter (`soplang/soplang`) is a pure Python
implementation — no compiler toolchain is needed, just Python 3. This
service vendors that interpreter's source (see "Vendoring" below) and calls
its file-execution pipeline directly, bypassing its interactive CLI.

## Quick local setup (no Docker)

```sh
# 1. Vendor the interpreter source (one-time, or after bumping SOPLANG_REF)
./scripts/fetch-soplang.sh          # or scripts\fetch-soplang.ps1 on Windows

# 2. Start the runner
cp .env.example .env      # edit RUNNER_SECRET if you like
node server.js            # reads PORT/RUNNER_SECRET/PYTHON_BIN/SOPLANG_SRC_DIR from env

# 3. Point the Next.js site at it — in the repo root, add to .env.local:
#   SOPLANG_RUNNER_URL=http://localhost:8080
#   SOPLANG_RUNNER_SECRET=dev-secret   (must match RUNNER_SECRET)
```

That's the whole local dev loop — no Docker, no cloud account. Requires
`python3` (`python` on Windows) and `git` on PATH.

## Why this needs to be a separate service

Running arbitrary user code means spawning a real interpreter process per
request. A shared serverless function (e.g. a Vercel function) can't safely
sandbox that — it needs OS-level isolation (its own container, no network,
hard resource limits) that only a dedicated, disposable execution
environment provides. Locally that isolation is weaker (see below); in
production, run it via the Dockerfile with network access fully disabled.

## Why `run_soplang.py`, not soplang's own CLI

`soplang`'s `main.py` unconditionally constructs `SoplangShell`, which
eagerly builds a `prompt_toolkit` `PromptSession` even when you just want to
run a file — that session requires a real console and throws
(`NoConsoleScreenBufferError` on Windows, similar failures elsewhere) the
moment stdio is piped, which it always is for a subprocess spawned by this
server. `run_soplang.py` calls `src.runtime.main.run_soplang_file` directly,
the same function the CLI eventually delegates to, without touching the
shell/prompt machinery — no extra dependencies (`colorama`, `prompt_toolkit`)
needed either.

## Vendoring

`scripts/fetch-soplang.sh` / `.ps1` clone the pinned `SOPLANG_REF` tag into
`runner/vendor/soplang` (gitignored — not committed). Re-run the script
after bumping the ref to pick up a new interpreter release. The Docker image
does the same clone at build time via `ARG SOPLANG_REF`.

## Security model

Defense in depth, in order of importance:

1. **No outbound network access — the most important control, and only
   relevant in a real deployment (not local dev).** Run the container with
   networking disabled or fully egress-denied (`docker run --network none`,
   or the equivalent on your host: a locked VPC with no NAT/egress route, a
   firewall policy that denies all outbound traffic, etc.). Without this,
   sandboxed code could reach internal services, exfiltrate data, or be used
   as an attack proxy. Nothing in `server.js` substitutes for this.
2. **Per-execution resource limits** (`server.js` + `prlimit` on Linux): CPU
   time, address space, and process count are capped, and Node's own spawn
   `timeout` guarantees the process is killed even where `prlimit` isn't
   available (e.g. local Windows/macOS dev). Output is capped and the
   process is killed if it writes past the cap.
3. **Container-level resource limits**: set `--memory`, `--cpus`, and
   `--pids-limit` on the container itself (or your platform's equivalent) in
   production, so a single request can't starve the whole instance.
4. **Shared-secret auth** (`RUNNER_SECRET` / `X-Runner-Secret` header): only
   requests carrying the matching secret are accepted — set it in production;
   it's optional for local dev. Not a substitute for #1.
5. **Non-root user in the container image, ephemeral per-request temp
   dirs**: each execution gets its own directory, deleted afterward.
6. **Empty stdin**: `gelin()` (interactive input) gets immediate EOF rather
   than hanging a request until timeout.

Locally (no Docker), only #2, #5 (temp dirs), and #6 apply — that's fine for
your own dev machine running your own code, but do **not** point a public
`SOPLANG_RUNNER_URL` at a bare `node server.js` process. Production traffic
must go through the container with network egress denied.

## Deploying to production

```sh
docker build -t soplang-runner .
docker run --rm -p 8080:8080 \
  --network none \
  --memory=512m --cpus=1 --pids-limit=128 \
  -e RUNNER_SECRET=<a-strong-secret> \
  soplang-runner
```

With `--network none` the container can still be reached on `localhost` for
the `-p` published port (Docker's port mapping happens at the host, outside
the container's network namespace) while the process inside has no way to
make outbound connections — exactly the property we want.

Deploy to any host that lets you run a container with egress disabled and
hard resource limits — a small dedicated VM, Fly.io Machines, Railway,
Google Cloud Run (with VPC egress set to none), etc. The exact flags differ
per platform, but you're looking for the same three things every time:
network egress denied, memory/CPU/pids caps, and the container reachable
only by the Next.js site (via the shared secret, and ideally also by
network policy / allowlist if your platform supports it).

Once deployed, set on the Next.js site:

- `SOPLANG_RUNNER_URL` — the runner's URL (its `/` endpoint)
- `SOPLANG_RUNNER_SECRET` — must match the runner's `RUNNER_SECRET`

Until both are set, `/api/run` responds with 503 and the Playground UI shows
a "runner isn't configured" message instead of trying to execute code.

## Environment variables

| Variable         | Default                  | Description                                  |
| ----------------- | ------------------------- | --------------------------------------------- |
| `PORT`            | `8080`                    | Port the HTTP server listens on              |
| `RUNNER_SECRET`   | _(unset)_                 | Shared secret required on `X-Runner-Secret`  |
| `PYTHON_BIN`      | `python3` (`python` on Windows) | Python interpreter to invoke           |
| `SOPLANG_SRC_DIR` | `<runner>/vendor/soplang` | Path to the vendored soplang source          |
