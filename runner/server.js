'use strict';

/**
 * Sandboxed execution service for the Soplang Playground.
 *
 * This process is the ONLY thing that ever runs untrusted, user-submitted
 * code. It is deployed separately from the Next.js site (see README.md) and
 * must run inside a container with no outbound network access — that
 * boundary is a deployment-level control this file cannot enforce itself.
 */

const http = require('node:http');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT) || 8080;
const RUNNER_SECRET = process.env.RUNNER_SECRET || '';
const PYTHON_BIN = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
const RUN_SCRIPT = path.join(__dirname, 'run_soplang.py');
const SOPLANG_SRC_DIR =
  process.env.SOPLANG_SRC_DIR || path.join(__dirname, 'vendor', 'soplang');

const MAX_BODY_BYTES = 64 * 1024; // 64KB request body cap
const MAX_CODE_LENGTH = 20_000;
const MAX_OUTPUT_BYTES = 200 * 1024; // truncate stdout/stderr beyond this
const CPU_TIME_LIMIT_SECONDS = 5;
const WALL_TIME_LIMIT_MS = 8_000;
const MEMORY_LIMIT_BYTES = 256 * 1024 * 1024; // 256MB address space
const MAX_PROCESSES = 64;
const MAX_CONCURRENT_EXECUTIONS = 4;

let activeExecutions = 0;

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Request body too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

// We call run_soplang.py directly (never soplang's own CLI/shell — see that
// file's docstring for why). On Linux (the production container) we
// additionally wrap it with prlimit for OS-enforced CPU/memory/process
// caps; that binary doesn't exist on Windows/macOS dev machines, so there we
// rely on Node's own spawn timeout below, which works everywhere.
function buildCommand(file) {
  const pythonArgs = [RUN_SCRIPT, file];
  if (process.platform === 'linux') {
    return {
      cmd: 'prlimit',
      args: [
        `--as=${MEMORY_LIMIT_BYTES}`,
        `--cpu=${CPU_TIME_LIMIT_SECONDS}`,
        `--nproc=${MAX_PROCESSES}`,
        '--',
        PYTHON_BIN,
        ...pythonArgs,
      ],
    };
  }
  return { cmd: PYTHON_BIN, args: pythonArgs };
}

async function runSoplang(code) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'soplang-run-'));
  const file = path.join(dir, 'main.sop');
  await fs.writeFile(file, code, 'utf8');

  const { cmd, args } = buildCommand(file);
  const startedAt = Date.now();

  return new Promise((resolve) => {
    // `timeout`/`killSignal` are Node's own spawn options — this guarantees
    // we reclaim a hung process on every platform, independent of prlimit.
    const child = spawn(cmd, args, {
      cwd: dir,
      env: {
        PATH: process.env.PATH || '/usr/bin:/bin',
        SOPLANG_SRC_DIR,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1',
        PYTHONDONTWRITEBYTECODE: '1',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: WALL_TIME_LIMIT_MS,
      killSignal: 'SIGKILL',
    });

    let stdout = '';
    let stderr = '';
    let truncated = false;

    const cap = (buf, current) => {
      if (truncated) return current;
      const next = current + buf;
      if (Buffer.byteLength(next, 'utf8') > MAX_OUTPUT_BYTES) {
        truncated = true;
        child.kill('SIGKILL');
        return `${next.slice(0, MAX_OUTPUT_BYTES)}\n…(output truncated)`;
      }
      return next;
    };

    child.stdout.on('data', (d) => {
      stdout = cap(d.toString('utf8'), stdout);
    });
    child.stderr.on('data', (d) => {
      stderr = cap(d.toString('utf8'), stderr);
    });

    // Programs that call gelin() (read stdin) get immediate EOF instead of
    // hanging until the timeout kills them.
    child.stdin.end();

    child.on('close', async (exitCode) => {
      await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
      resolve({
        stdout,
        stderr,
        exitCode,
        timeMs: Date.now() - startedAt,
      });
    });

    child.on('error', async () => {
      await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
      resolve({
        stdout: '',
        stderr: 'Failed to start the interpreter.',
        exitCode: null,
        timeMs: Date.now() - startedAt,
      });
    });
  });
}

function isAuthorized(req) {
  if (!RUNNER_SECRET) return true; // no secret configured (e.g. local dev)
  const provided = req.headers['x-runner-secret'];
  if (typeof provided !== 'string') return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(RUNNER_SECRET);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (!isAuthorized(req)) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return;
  }

  if (activeExecutions >= MAX_CONCURRENT_EXECUTIONS) {
    sendJson(res, 503, { error: 'Runner is busy, try again shortly.' });
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch (err) {
    sendJson(res, err.status || 400, { error: 'Failed to read request body.' });
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body.' });
    return;
  }

  const code = parsed && parsed.code;
  if (typeof code !== 'string' || code.trim().length === 0) {
    sendJson(res, 400, { error: '`code` must be a non-empty string.' });
    return;
  }
  if (code.length > MAX_CODE_LENGTH) {
    sendJson(res, 413, { error: 'Code exceeds the maximum allowed length.' });
    return;
  }

  activeExecutions += 1;
  try {
    const result = await runSoplang(code);
    sendJson(res, 200, result);
  } catch {
    sendJson(res, 500, { error: 'Execution failed unexpectedly.' });
  } finally {
    activeExecutions -= 1;
  }
});

server.listen(PORT, () => {
  console.log(`soplang runner listening on :${PORT}`);
});
