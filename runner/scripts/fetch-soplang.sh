#!/usr/bin/env bash
# Fetches the pinned soplang/soplang release into runner/vendor/soplang.
# Re-run after bumping SOPLANG_REF to pick up a new interpreter version.
set -euo pipefail

SOPLANG_REF="${SOPLANG_REF:-v2.0.0}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENDOR_DIR="$SCRIPT_DIR/../vendor/soplang"

rm -rf "$VENDOR_DIR"
mkdir -p "$(dirname "$VENDOR_DIR")"
git clone --depth 1 --branch "$SOPLANG_REF" https://github.com/soplang/soplang.git "$VENDOR_DIR"
rm -rf "$VENDOR_DIR/.git"

echo "soplang $SOPLANG_REF vendored into $VENDOR_DIR"
