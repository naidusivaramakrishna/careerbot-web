#!/usr/bin/env python3
"""Decide whether a pull request may skip `next build` in Lint and Build.

The required "Lint and Build" job takes 13-23 min, almost all of it npm ci and
the Next.js production build. A PR that only touches the AI reviewer / PR-size
gate (scripts/ai_review/*.{py,json,txt,md}, not subdirectories), the Python CI
tests (tests/unit/test_*.py) or Markdown under docs/ changes nothing that build
compiles. In the fast lane the job still runs, still reports under its required
name and still runs the new-error lint/type gates; it skips only npm ci and the
build. The Python tests for those paths run in gate-self-test, on every PR, as
before.

FAIL CLOSED. Anything other than a clean "every changed path is on the
allow-list" answer is the full lane: a push event, a checkout that is not the
PR merge commit for the expected head, a git error, an empty diff, a path
with a control character, any path off the list -- .github/** and this file
included. The workflow runs the BASE branch's copy of this script, so a PR
that does not edit the workflow cannot widen the list for itself.

Paths come from `git diff --no-renames` between the merge commit and its first
parent: exactly what the PR merges, both sides of a rename, no API page cap.

Usage (in CI):  fast_lane.py --expect-head <sha> --github-output "$GITHUB_OUTPUT"
Usage (local):  fast_lane.py --files-from changed.txt
"""
from __future__ import annotations

import argparse
import pathlib
import re
import subprocess
import sys

# Each entry was checked against the repo: tsconfig type-checks every .ts/.tsx
# (docs/ holds a .tsx, so only .md is listed), next build bundles only what
# src/ imports, nothing in src/, next.config.ts, vitest or eslint config reads
# these, and .dockerignore drops *.md. Python test modules only -- a
# conftest.py would change how gate-self-test collects the whole directory.
ALLOW = (
    # Flat, and only the file types there today: a .ts/.tsx here would be
    # type-checked by tsc, which the fast lane cannot run without npm ci.
    re.compile(r"scripts/ai_review/[^/]+\.(?:py|json|txt|md)"),
    re.compile(r"tests/unit/test_\w+\.py"),
    re.compile(r"docs/.+\.md"),
)


def classify(paths):
    """Return (lane, reason). lane is "fast" only if every path is allowed."""
    if not paths:
        return "full", "no changed paths (empty or unreadable diff)"
    for p in paths:
        if any(ord(c) < 32 or ord(c) == 127 for c in p):
            return "full", f"path with a control character: {p!r}"
        if not any(rule.fullmatch(p) for rule in ALLOW):
            return "full", f"{p} is not on the fast-lane allow-list"
    return "fast", "only allow-listed paths changed"


def _git(*args):
    return subprocess.run(["git", *args], check=True, capture_output=True).stdout


def merge_commit_paths(expect_head):
    """Changed paths of the PR merge commit, or None if HEAD is not it."""
    commit, *parents = _git("rev-list", "--parents", "-n", "1", "HEAD").decode().split()
    if len(parents) != 2 or not expect_head or parents[1] != expect_head:
        print(f"HEAD {commit} parents {parents} is not the merge commit for "
              f"head {expect_head!r}")
        return None
    raw = _git("diff", "--no-renames", "--name-only", "-z", parents[0], commit)
    return [p for p in raw.decode("utf-8", "replace").split("\0") if p]


def decide(args):
    if args.files_from:
        text = pathlib.Path(args.files_from).read_text(encoding="utf-8")
        paths = [line for line in text.splitlines() if line.strip()]
    else:
        paths = merge_commit_paths(args.expect_head)
        if paths is None:
            return "full", "not a pull_request merge commit", []
    lane, reason = classify(paths)
    return lane, reason, paths


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--expect-head", default="")
    ap.add_argument("--files-from")
    ap.add_argument("--github-output")
    args = ap.parse_args(argv)
    try:
        lane, reason, paths = decide(args)
    except Exception as exc:  # noqa: BLE001 - any doubt -> full lane
        lane, reason, paths = "full", f"classifier error: {exc!r}", []
    if lane == "fast":
        print(f"FAST LANE: only {', '.join(paths)} changed; "
              "skipping npm ci and next build")
    else:
        print(f"FULL LANE: {reason}")
    if args.github_output:
        with open(args.github_output, "a", encoding="utf-8") as fh:
            fh.write(f"lane={lane}\n")
            if lane == "fast":
                fh.write(f"changed={', '.join(paths)}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
