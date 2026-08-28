#!/usr/bin/env python3
"""Headless entry point for executing a single Soplang file.

Deliberately does NOT go through soplang's own CLI (main.py) or
SoplangShell: those unconditionally construct a prompt_toolkit
PromptSession for the interactive shell, which requires a real console and
crashes (NoConsoleScreenBufferError / similar) when stdio is piped, as it
always is when this runs as a subprocess of the runner's HTTP server. This
script calls the same file-execution pipeline (src.runtime.main.run_soplang_file)
directly, which has no such dependency.
"""

import os
import sys

SOPLANG_SRC_DIR = os.environ.get("SOPLANG_SRC_DIR")
if SOPLANG_SRC_DIR:
    sys.path.insert(0, SOPLANG_SRC_DIR)

from src.runtime.main import run_soplang_file  # noqa: E402


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: run_soplang.py <file.sop>", file=sys.stderr)
        return 2
    return run_soplang_file(sys.argv[1])


if __name__ == "__main__":
    sys.exit(main())
