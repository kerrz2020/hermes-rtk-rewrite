# AGENT GUIDE — installing RTK on a Hermes machine (read by the agent)

> **Read this file AFTER the plugin has been cloned from git.** If you are reading it, the
> plugin is already installed at `~/.hermes/plugins/rtk-rewrite/` and only three things are
> left: **binary → ask for a restart → verify**.

Repo: `kerrz2020/hermes-rtk-rewrite` (public). Plugin: `rtk-rewrite` — a `pre_tool_call` hook
that rewrites `terminal` commands via `rtk rewrite`. RTK is a Rust binary that compresses
command output before it reaches the LLM context (token savings). This repository is a
community (non-official) add-on; the rewrite engine belongs to
[`rtk-ai/rtk`](https://github.com/rtk-ai/rtk) (Apache-2.0).

## Context (why the order matters)

- **A plugin without the binary does not work.** It fails open: no error, no rewrite either.
  The binary is a separate install — the plugin is only a bridge. Never report success while
  `rtk --version` fails.
- **Never restart the gateway from inside an agent session.** Hermes guards
  `hermes gateway restart` / `systemctl --user restart hermes-gateway` (SIGTERM propagates).
  When your steps are done, ASK the user to restart from their shell, WAIT for their
  confirmation, then verify.
- **Do not run `scripts/update.sh` from an agent session either** — it mentions a restart in
  its output, which trips the same guard. Use the manual steps below.
- **Public repo** — `hermes plugins install kerrz2020/hermes-rtk-rewrite` needs no auth. If git
  auth is broken anyway, check `gh auth status`.

## Step by step

### 1. (Already done) the plugin came from git — that is where this file lives

```bash
hermes plugins install kerrz2020/hermes-rtk-rewrite --enable
```

If an old non-git `~/.hermes/plugins/rtk-rewrite` folder exists, back it up and remove it,
then install again — `hermes plugins update` needs a git source.

### 2. The rtk binary (Pinned v0.49.0, checksum verified)

> Pinned release — deliberate. An unpinned "latest" auto-updates an untrusted binary
> that rewrites every terminal command. Bump `0.49.0` here and in `scripts/update.sh`
> together, on review/validation.

```bash
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64) A="rtk-x86_64-unknown-linux-musl.tar.gz" ;;
  aarch64) A="rtk-aarch64-unknown-linux-gnu.tar.gz" ;;
  *) echo "unsupported arch: $ARCH"; exit 1 ;;
esac
V=0.49.0
TMP="$(mktemp -d)"
curl -fsSL "https://github.com/rtk-ai/rtk/releases/download/v${V}/${A}" -o "$TMP/rtk.tar.gz"
EXPECTED="$(curl -fsSL "https://github.com/rtk-ai/rtk/releases/download/v${V}/checksums.txt" \
  | grep "$A" | awk '{print $1}' | head -1)"
[ "$(sha256sum "$TMP/rtk.tar.gz" | awk '{print $1}')" = "$EXPECTED" ] || { echo "checksum mismatch"; exit 1; }
tar -xzf "$TMP/rtk.tar.gz" -C "$TMP" && install -m 0755 "$TMP/rtk" "$HOME/.local/bin/rtk"
rm -rf "$TMP"
```

`PATH`: make sure `~/.local/bin` is present
(`grep -q '.local/bin' ~/.bashrc || echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc`).

### 3. Ask the user to restart (the agent must not do it)

Message the user: *"Run `hermes gateway restart` from your shell, then confirm."*
WAIT for that confirmation before verifying. The hook is registered when the process starts,
so nothing is live until then.

## Verify — acceptance criteria (all must be green before reporting "done")

```bash
rtk --version                                    # == 0.49.0 (pinned)
hermes plugins list | grep rtk-rewrite           # enabled + git source
hermes plugins update rtk-rewrite                # "already up to date"
grep -A20 '^plugins:' ~/.hermes/config.yaml | grep rtk   # present in plugins.enabled
grep -i rtk ~/.hermes/logs/errors.log | tail -5  # EMPTY (a warning means the binary was missing)
rtk rewrite "git status"                         # prints: rtk git status  (exit 3 = rewrite accepted)
```

All green → report "RTK installed and active" plus the state. Anything red → do not claim
success; diagnose per step (most common: binary missing, git auth, gateway not restarted).

Note the last line: `rtk rewrite` exits **3** for an accepted rewrite and **1**/`2` for
expected passthrough. Non-zero is the protocol, not a failure.

## Routine update (run by the user in a shell, not by the agent)

```bash
bash ~/.hermes/plugins/rtk-rewrite/scripts/update.sh
```

Full bootstrap: the binary when a newer release exists (checksum verified) plus
`plugins install/update`. Silent when already current → safe for a `no_agent` cron job.
An agent asked to update: repeat step 2 for the binary, then
`hermes plugins update rtk-rewrite`.

## Desktop UI (remote-backed Desktop)

The plugin is a unified package, so `desktop/plugin.js` is installed on the server too. The
Desktop app scans `$HERMES_HOME` **on the local machine**: copy the `desktop/` folder to the
laptop if you want the pane/chip to appear.

## Pitfalls

- `hermes gateway restart` / `systemctl --user restart hermes-gateway` from inside an agent
  session → blocked by the guard. The user's shell only.
- `scripts/update.sh` mentions a restart → the guard blocks it for an agent; use the manual
  steps above instead.
- The plugin fails open: if `rtk --version` fails, never report the install as done.
- `manifest_version: 2` is rejected by Hermes ≤0.21 — this manifest is v1-compatible.
- Renaming the repo/owner means updating every reference (this file, README, `update.sh`, the
  desktop footer, the catalog entry).
