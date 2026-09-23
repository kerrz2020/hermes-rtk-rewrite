# Security Policy

## Supported versions

This repository is a small Hermes Agent plugin (a `pre_tool_call` bridge to the RTK binary).
The `main` branch is the only supported development line.

## Reporting a vulnerability

Do not open a public issue for suspected credential leaks or security-sensitive behavior.

Preferred reporting path: use GitHub's private
**[Report a vulnerability](https://github.com/kerrz2020/hermes-rtk-rewrite/security/advisories/new)**
flow. Do not include vulnerability details in a public issue.

Please include, privately:
- the affected commit or file path;
- a concise description of the issue;
- reproduction steps when applicable;
- whether any credential, private local path, or private document content was exposed.

## Secret handling

This plugin holds no credentials and reads no secret store. It shells out to the `rtk` binary
on `PATH`, which the user installs separately from the upstream project's releases. Do not
commit `.env`, `*.secret`, key files, or private operational logs. The `.gitignore`, Gitleaks
config, security workflow, and GitHub-native secret scanning reduce accidental leaks; they do
not replace review.

## Command rewriting (by design)

The plugin changes the string Hermes is about to execute for the `terminal` tool whenever
`rtk rewrite` returns a rewritten command. That is the point of the plugin, and it is why the
code is deliberately small and readable: read `__init__.py` (≈90 lines) before trusting it.
Three properties limit the blast radius:

- it fails open — any error, timeout (2 s), or unexpected exit code leaves the original
  command untouched;
- it is the official protocol of the upstream hook mirrored from `rtk-ai/rtk`, not a local
  invention;
- it never runs a command itself — it only replaces the string, and Hermes still applies its
  own approval/dangerous-pattern checks to the rewritten command.

Installing the plugin means trusting `rtk-ai/rtk` to rewrite commands sanely. The plugin pins
no version of that binary — `scripts/update.sh` installs the latest release with a checksum
check.

## Response expectations

Security fixes should be committed normally after local validation. If a real secret is
committed, rotate the secret first, then remove it from Git history if needed.
