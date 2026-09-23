# hermes-rtk-rewrite

[![CI](https://github.com/kerrz2020/hermes-rtk-rewrite/actions/workflows/ci.yml/badge.svg)](https://github.com/kerrz2020/hermes-rtk-rewrite/actions/workflows/ci.yml)
[![Security scans](https://github.com/kerrz2020/hermes-rtk-rewrite/actions/workflows/security.yml/badge.svg)](https://github.com/kerrz2020/hermes-rtk-rewrite/actions/workflows/security.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

Community (non-official) Hermes plugin that rewrites Hermes `terminal` calls through
**RTK** before execution. Every `terminal` tool call gets passed to `rtk rewrite`; when RTK
returns a rewritten command, that is what Hermes executes — so RTK's compressed output
(git status, cargo/npm test, ls, grep, …) is what reaches the model context instead of raw
output.

**RTK** itself ([`rtk-ai/rtk`](https://github.com/rtk-ai/rtk), Apache-2.0) is developed and
maintained by the RTK project. This repository is an independent community add-on: it is
**not** affiliated with, endorsed by, or maintained by the upstream RTK project. The
agent-side hook is a mirror of the Hermes hook that upstream ships in
`rtk-ai/rtk` → `hooks/hermes/rtk-rewrite/` (see [Credits](#credits)).

> **The plugin is only a bridge.** All rewrite logic lives in the `rtk` Rust binary. Without
> the binary the plugin is a no-op (it fails open and warns once).

What this repo adds over upstream's minimal hook:

- `pre_tool_call` hook that rewrites `terminal` commands (fail-open, 2 s timeout)
- a desktop UI starter (`desktop/plugin.js` — optional pane + status-bar chip)
- `scripts/update.sh` — binary + plugin updater (silent when already current)
- `docs/AGENT-GUIDE.md` — the agent-facing install guide, cloned with the repo
- point-in-time validation record with real command output: `docs/VALIDATION.md`

## Install

For **agents**: read [`docs/AGENT-GUIDE.md`](docs/AGENT-GUIDE.md) after the plugin is cloned.

Manual:

```bash
# 1. the RTK binary (required — the plugin alone does nothing)
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64) ASSET="rtk-x86_64-unknown-linux-musl.tar.gz" ;;
  aarch64) ASSET="rtk-aarch64-unknown-linux-gnu.tar.gz" ;;
  *) echo "unsupported arch: $ARCH"; exit 1 ;;
esac
VERSION="$(curl -fsSL https://api.github.com/repos/rtk-ai/rtk/releases/latest \
  | grep -m1 '"tag_name"' | sed -E 's/.*"v([0-9.]+)".*/\1/')"
TMP="$(mktemp -d)"
curl -fsSL "https://github.com/rtk-ai/rtk/releases/download/v${VERSION}/${ASSET}" -o "$TMP/rtk.tar.gz"
EXPECTED="$(curl -fsSL "https://github.com/rtk-ai/rtk/releases/download/v${VERSION}/checksums.txt" \
  | grep "$ASSET" | awk '{print $1}' | head -1)"
[ "$(sha256sum "$TMP/rtk.tar.gz" | awk '{print $1}')" = "$EXPECTED" ] || { echo "checksum mismatch"; exit 1; }
tar -xzf "$TMP/rtk.tar.gz" -C "$TMP" && install -m 0755 "$TMP/rtk" "$HOME/.local/bin/rtk"
rm -rf "$TMP"
rtk --version

# 2. the plugin, from git (git source → `hermes plugins update` works)
hermes plugins install kerrz2020/hermes-rtk-rewrite --enable

# 3. restart the gateway from YOUR shell (never from inside an agent session)
hermes gateway restart
```

`~/.local/bin` must be on `PATH`. The hook is registered at process start, so a freshly
enabled plugin needs that restart before it is live.

## Update

```bash
bash ~/.hermes/plugins/rtk-rewrite/scripts/update.sh
```

Checksum-verified binary update when a newer RTK release exists, then
`hermes plugins update rtk-rewrite`. Silent when everything is already current, so it is safe
in an unattended cron job.

## Fail-open behaviour

The plugin never blocks a command. The original command runs unchanged when:

- `rtk` is not on `PATH` (a one-time warning is printed and the hook is not registered)
- `rtk rewrite` times out (2 s) or exits with an unexpected code
- the tool call is not `terminal`, or the payload has no string `command`
- anything raises — the exception is caught and reported on stderr

Exit codes are treated as protocol, not errors: `0`/`3` mean "rewrite accepted", `1`/`2` mean
"expected passthrough" (the command runs as-is, no warning).

## Structure

```
hermes-rtk-rewrite/
├── plugin.yaml            # manifest — name: rtk-rewrite, hook: pre_tool_call
├── __init__.py            # pre_tool_call bridge to `rtk rewrite` (mirror of upstream)
├── tests/                 # unittest suite (from upstream + a repo-layout fix)
├── desktop/plugin.js      # optional desktop UI (pane + status-bar chip)
├── docs/AGENT-GUIDE.md    # agent-facing install/verify guide
├── docs/VALIDATION.md     # end-to-end validation record (measured, with output)
├── scripts/update.sh      # binary + plugin updater
├── scripts/sync-upstream.sh  # maintainer: re-sync the mirrored files
└── upstream/plugin.yaml   # upstream manifest copy (reference)
```

> The installed plugin directory is `~/.hermes/plugins/rtk-rewrite/` — the manifest name
> (`rtk-rewrite`) is the install key, the repository name is not.

## Validation

`docs/VALIDATION.md` records an end-to-end pass with the actual command output: the admission
gate (`hermes plugins validate --json .`), the unit suite, the rewrite round trip against the
real binary, and a live-harness proof that Hermes itself calls the hook.

```bash
python3 -m unittest discover -s tests -q   # unit suite
hermes plugins validate --json .           # catalog admission gate
```

## Desktop UI

`desktop/plugin.js` adds a right-side pane and a status-bar chip. Desktop plugins are loaded
from `$HERMES_HOME/desktop-plugins/` **on the machine running the desktop app** — if your
Desktop is remote-backed to a server, copy the `desktop/` folder to the laptop as well.
No desktop? Delete `desktop/` — the agent side works without it.

## Credits

- **RTK** — [`rtk-ai/rtk`](https://github.com/rtk-ai/rtk), Apache-2.0, the project that owns
  the rewrite engine and the original Hermes hook this plugin mirrors
  (`hooks/hermes/rtk-rewrite/`). Upstream also ships `rtk init --agent hermes`, which writes
  the plugin locally without a git source or desktop UI.
- **This repository** — a non-official community packaging (git install, updater, desktop UI,
  agent guide), Apache-2.0. See [`NOTICE`](NOTICE).

## License

Apache-2.0 — see [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE). The mirrored hook
(`__init__.py`, `tests/`) is Apache-2.0 upstream code; the plugin manifest declares
`license: Apache-2.0` to match.
