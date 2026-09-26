## [1.0.1] — 2026-09-26

- README: pin the manual install snippet to RTK v0.49.0 — the last unpinned
  `releases/latest` fetch outside `scripts/update.sh`.
- README: drop the dual-name note. The catalog entry is `rtk-rewrite` (rename requested in
  review of the catalog PR), so the catalog key, the manifest name and the installed
  directory are one key.

## [1.0.0] — 2026-09-23

First public release of the community packaging.

- Public repo `kerrz2020/hermes-rtk-rewrite` (the previous source, `kerrz2020/rtk-hermes-plugin`,
  was private). Fresh orphan root: no private history, no operational logs.
- Translated every user-facing string to English (README, `docs/AGENT-GUIDE.md`,
  `scripts/update.sh`); removed private-repo and private-clone instructions.
- Explicit *community (non-official)* credit for the upstream project
  ([`rtk-ai/rtk`](https://github.com/rtk-ai/rtk), Apache-2.0) in `plugin.yaml`, README, the
  desktop pane footer and `NOTICE`, naming the mirrored files.
- License corrected to **Apache-2.0** (the mirrored hook is Apache-2.0 upstream code);
  added `LICENSE` + `NOTICE`.
- Repo hygiene matching a polished plugin: `.github/workflows/ci.yml` (catalog admission gate
  + unit tests + shell syntax + python compile), `.github/workflows/security.yml`
  (Gitleaks + ShellCheck), `.gitleaks.toml`, `.pre-commit-config.yaml`, `SECURITY.md`,
  `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, CI/Security/License badges.
- `docs/VALIDATION.md` — end-to-end validation record with the measured output.
- Version bumped 0.2.0 → 1.0.0.

## [0.2.0] — 2026-09-20

- Unified package: agent-side hook + optional desktop UI in one repository.
- `docs/AGENT-GUIDE.md`, `scripts/update.sh` (binary + plugin, checksum verified, silent when
  current), `scripts/sync-upstream.sh`.

## [0.1.0] — 2026-09-18

- Initial private packaging: `pre_tool_call` hook mirroring `rtk-ai/rtk` →
  `hooks/hermes/rtk-rewrite/`.
