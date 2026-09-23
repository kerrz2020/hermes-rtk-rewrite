# Validation record — end-to-end pass (measured 2026-09-23)

Record of the checks that ran on the released tree, with their real output. If a value
differs when you reproduce, do not report "done" — diagnose first.

Environment reference: Ubuntu (kernel 7.0.0), Hermes v0.21.4, Python 3.11, rtk 0.49.0
(x86_64), plugin export dir `hermes-rtk-rewrite` @ sha (see badge commit).

## 1. Catalog admission gate (`hermes plugins validate --json .`)

`overall_ok: True` — all 14 checks `ok=True`, `warnings: []`:

- manifest parses; name/version/description present; no `requires_hermes`; plugin loads
  (`register()` ran in isolation — capability probe ok)
- declared hooks match registrations (`pre_tool_call`)
- **security scan: `safe`** (no high/critical findings; the CI workflow's Hermes install
  step is written as download-then-run precisely to keep the scan at `safe` — a shell-piped
  install line in workflow YAML would downgrade it to `caution`)
- desktop surface: stays inside the plugin SDK surface

## 2. Unit suite (`python3 -m unittest discover -s tests`)

`Ran 18 tests in 0.012s — OK (skipped=1)`. The skip is the installed-flow test, which needs
a `cargo`-built upstream checkout; on this box it is skipped, not failed.

## 3. Static gates

| Check | Result |
|---|---|
| `bash -n scripts/*.sh` | PASS |
| `python3 -m py_compile __init__.py tests/*.py` | PASS |
| ShellCheck 0.11.0, `-x -S error` on `scripts/*.sh` | PASS (0 error) |
| Gitleaks 8.30.1, `detect` with repo config | `no leaks found` (also ran on the full commit) |

## 4. Rewrite round trip (real binary, rtk 0.49.0)

```text
$ rtk rewrite "git status"
rtk git status          # rc=3 → accepted rewrite (rc 1/2 = expected passthrough)

$ rtk git status        # in a fresh git repo
* No commits yet on main
A  file.txt
```

Non-zero exits are the protocol, not a failure: `0`/`3` accept the rewrite, `1`/`2` are
expected passthrough (command runs unchanged).

## 5. Live-harness proof (Hermes actually calls the hook)

A fresh `hermes chat -q` process (never the live gateway) was started with a logging wrapper
named `rtk` prepended to `PATH`. The wrapper appends every invocation to a log, then `exec`s
the real binary. Measured:

- wrapper log, one line per hook call:
  `RTK_HOOK_CALL args=rewrite git status` (the plugin's `pre_tool_call` bridge at work)
- the terminal tool ran as `rtk git status` (`💻 $ rtk git status`) and, inside a git repo,
  exited 0 with RTK-compressed output (`A  file.txt`)
- with `cd … && git status`, the same pipeline completed with exit 0

Notes: the hook fires on **every** terminal call (the log recorded 3 rewrite calls across one
session). The executed command is a string mutation only — Hermes still applies its own
approval/dangerous-pattern checks to the rewritten command. Fail-open paths (missing binary,
timeout, unexpected exit) are covered by the unit suite.

## 6. CI / Security badges

After the push: `.github/workflows/ci.yml` (validate + unit tests + shell syntax + python
compile) and `.github/workflows/security.yml` (Gitleaks + ShellCheck, pinned image digests,
read-only permissions) both green on `main` — see the badges in the README.