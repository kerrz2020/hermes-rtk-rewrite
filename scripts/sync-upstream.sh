#!/usr/bin/env bash
# Maintainer helper: re-sync the mirrored agent-side files from upstream rtk-ai/rtk (develop).
# Only __init__.py + tests are mirrored — plugin.yaml, desktop/ and docs/ are maintained here.
set -euo pipefail
cd "$(dirname "$0")/.."

BASE="https://raw.githubusercontent.com/rtk-ai/rtk/develop/hooks/hermes"
curl -fsSL "$BASE/rtk-rewrite/__init__.py" -o __init__.py
curl -fsSL "$BASE/rtk-rewrite/plugin.yaml" -o upstream/plugin.yaml
curl -fsSL "$BASE/tests/__init__.py" -o tests/__init__.py
curl -fsSL "$BASE/tests/test_rtk_rewrite_plugin.py" -o tests/test_rtk_rewrite_plugin.py

echo "synced from upstream (develop). This overwrites the local tests/ layout fix — re-apply it"
echo "(tests/test_rtk_rewrite_plugin.py, _PLUGIN_CANDIDATES) before committing:"
echo "  git diff && git add -A && git commit -m 'sync: upstream hooks/hermes'"