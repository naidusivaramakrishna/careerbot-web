#!/usr/bin/env python3
"""
pr_size_gate.py -- the fail-fast "PR Size" gate (.github/workflows/pr-size-gate.yml).

Runs FIRST in every pull_request workflow; every other pull_request job `needs`
it and, when it did not pass, FAILS at its first step (see FAIL-CLOSED in
pr-size-gate.yml), so an oversized PR fails in seconds instead of queueing a
build, a security scan and a ~25-minute AI review on the shared self-hosted
runners only to be refused by the ai-review scope guard at the end.

A PR FAILS when any of these is exceeded (a value equal to the limit passes):
  * reviewable added lines > MAX_ADDED_LINES
  * changed files          > MAX_FILES
  * commits                > MAX_COMMITS

"Reviewable" is computed by the SAME code as the ai-review scope guard:
`git diff --numstat base...head` split by ai_pr_review.size_stats, which leaves
out the added lines of GENERATED_FILE_PATTERNS (lockfiles, *.min.js/css, *.map,
__snapshots__/*.snap). Generated files still count as FILES. The limits here are
tighter than the scope guard's (8,000 / 120 / 40): that one decides whether a
review is possible at all, this one whether the PR is a reasonable size to ask
a human and the AI reviewer to read.

This gate ALSO exempts TEST_FILE_PATTERNS, by calling size_stats with
exempt_tests=True. Tests are not generated and they do get reviewed -- they are
exempt from the LINE CAP only, because counting them taxes the one thing this
cap should encourage. Measured across careerbot-web PRs #144-#148, tests were
18-74% of each diff and no PR exceeded 1,500 lines of PRODUCTION code (largest
1,007); two PRs failed this gate purely on test volume, and on #144 the cap
then blocked an 11-line correctness fix. The scope guard keeps counting tests,
because a 9,000-line diff is unreviewable whatever is in it.

The maintainer-only label SIZE_OVERRIDE_LABEL (`ai-review-large`) lifts the
failure, exactly as it lifts the scope guard's caps; the size label still says
how big the PR is, and the job summary names who applied the override.

Each run writes a table to $GITHUB_STEP_SUMMARY. With --publish it also sets one
size/* label (replacing any other size/* label, creating the label in the repo
the first time it is needed) and keeps ONE marker comment on the PR while it is
over the limits (edited in place, never duplicated; rewritten to a short note
once the PR is back within the limits or overridden). Publishing is best
effort: a token that cannot write (a fork PR) logs a warning and never changes
the verdict.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
# One definition of "generated" and of the override label, shared with the
# ai-review scope guard -- do not copy the pattern list here.
from ai_pr_review import (  # noqa: E402
    GENERATED_FILE_PATTERNS,
    SIZE_OVERRIDE_LABEL,
    TEST_FILE_PATTERNS,
    label_actor,
    size_stats,
)

# Line cap raised 1,500 -> 3,000 by the owner on 2026-10-24: of the last 78 sized
# careerbot-web PRs, 8 went over 1,500 reviewable lines and 5 of those were
# 1,537-2,511. Above 3,000, split the PR or apply SIZE_OVERRIDE_LABEL.
MAX_ADDED_LINES, MAX_FILES, MAX_COMMITS = 3000, 40, 20

# (label, reviewable added lines strictly below which it applies). Anything
# above MAX_ADDED_LINES is size/XXL, and fails.
SIZE_BUCKETS = (("size/XS", 50), ("size/S", 200), ("size/M", 500), ("size/L", 1000))
SIZE_XL, SIZE_XXL = "size/XL", "size/XXL"
SIZE_LABELS = tuple(name for name, _ in SIZE_BUCKETS) + (SIZE_XL, SIZE_XXL)
SIZE_LABEL_COLORS = {"size/XS": "3cbf00", "size/S": "5d9801", "size/M": "7f7203",
                     "size/L": "a14c05", "size/XL": "c32607", "size/XXL": "e50009"}
COMMENT_MARKER = "<!-- pr-size-gate -->"
COMMENT_AUTHOR = "github-actions[bot]"
# Only AI PR Review triggers on label events; the other callers need a re-run.
RERUN_HINT = ("AI PR Review re-runs on the label by itself; Frontend CI and Security Scan "
              "do not trigger on labels -- re-run BOTH of them (\"Re-run failed jobs\"; the "
              "gate reads the PR's current labels) or push a commit.")

# (stats key, label, cap) -- the order the limits are reported in.
LIMITS = (("added", "reviewable added lines", MAX_ADDED_LINES),
          ("files", "changed files", MAX_FILES),
          ("commits", "commits", MAX_COMMITS))


# ── pure logic (unit-tested) ────────────────────────────────────────────────
def size_label(added: int) -> str:
    """size/* label for a number of reviewable added lines."""
    for name, below in SIZE_BUCKETS:
        if added < below:
            return name
    return SIZE_XL if added <= MAX_ADDED_LINES else SIZE_XXL


def check_limits(stats) -> tuple[list, list]:
    """(tripped, within): 'reviewable added lines 9,204 > 3,000' / 'commits 2 ≤ 20'."""
    tripped, within = [], []
    for key, label, cap in LIMITS:
        v = int(stats.get(key) or 0)
        if v > cap:
            tripped.append(f"{label} {v:,} > {cap:,}")
        else:
            within.append(f"{label} {v:,} ≤ {cap:,}")
    return tripped, within


def evaluate(stats, labels) -> dict:
    """Verdict for one PR. `labels` are the PR's CURRENT label names."""
    tripped, within = check_limits(stats)
    overridden = bool(tripped) and SIZE_OVERRIDE_LABEL in labels
    return {"label": size_label(int(stats.get("added") or 0)), "tripped": tripped,
            "within": within, "overridden": overridden,
            "passed": not tripped or overridden}


def split_advice(stats) -> list:
    """Concrete ways out, for the limits that tripped."""
    tips = []
    if int(stats.get("added") or 0) > MAX_ADDED_LINES or int(stats.get("files") or 0) > MAX_FILES:
        tips += [
            "Split by concern, one PR each: refactors/renames/moves (no behaviour change), "
            "then the behaviour change, then follow-up UI/copy. Each must build on its own.",
            "Land shared groundwork first (types, API client, utilities, feature-flagged "
            "components) and stack the feature on top in a second PR.",
            "Move fixtures for already-merged code, formatting-only changes, and stray "
            "files (backups, `*.tmp.*`, exported HTML) out of the PR -- or delete them.",
            "Regenerated files (lockfiles, `*.min.*`, `*.map`, snapshots) and test files "
            "do not count toward the LINE limit, but each still counts as a file. Do not "
            "delete tests to fit the cap -- they are already free.",
        ]
    if int(stats.get("commits") or 0) > MAX_COMMITS:
        tips.append(
            "Too many commits: squash fix-ups into a few meaningful commits on a NEW branch "
            "(`git checkout -b <new> origin/<base> && git merge --squash <this-branch>`) and "
            "open that as a replacement PR, or split the history into several PRs. Rebasing "
            "onto the current base also drops commits that are already merged.")
    return tips


def _table(stats) -> str:
    rows = ["| Measure | Value | Limit | |", "|---|---:|---:|:-:|"]
    for key, label, cap in LIMITS:
        v = int(stats.get(key) or 0)
        rows.append(f"| {label.capitalize()} | {v:,} | {cap:,} | {'❌' if v > cap else '✅'} |")
    rows.append(f"| Excluded generated added lines | {int(stats.get('excluded_added') or 0):,} "
                f"| not counted | |")
    rows.append(f"| Excluded test added lines | {int(stats.get('tests_added') or 0):,} "
                f"| not counted | |")
    return "\n".join(rows)


def _file_list(paths, heading, limit=40) -> str:
    """`heading` + a bulleted path list, or a one-line "none"."""
    if not paths:
        return f"_{heading}: none._"
    lines = [f"- `{p}` (+{n:,})" for p, n in paths[:limit]]
    if len(paths) > limit:
        lines.append(f"- …and {len(paths) - limit} more")
    return f"_{heading} (still counted as files):_\n" + "\n".join(lines)


def _excluded_list(stats, limit=40) -> str:
    """Generated and test exemptions, named separately.

    Deliberately two lists: a hand-written test file is not "generated", and
    labelling it so in the report would be a false statement about the code.
    """
    return (_file_list(stats.get("excluded") or [], "Excluded generated files", limit)
            + "\n\n"
            + _file_list(stats.get("tests") or [], "Excluded test files", limit))


def summary_markdown(stats, verdict, actor=None) -> str:
    """The job summary ($GITHUB_STEP_SUMMARY)."""
    if not verdict["tripped"]:
        head = f"### ✅ PR Size: within limits — `{verdict['label']}`"
    elif verdict["overridden"]:
        head = f"### ⚠️ PR Size: over the limits, overridden — `{verdict['label']}`"
    else:
        head = f"### ❌ PR Size: too large — `{verdict['label']}`"
    parts = [head, "", _table(stats), "", _excluded_list(stats), ""]
    if verdict["tripped"]:
        parts.append("**Limit exceeded:** " + "; ".join(verdict["tripped"]))
        parts.append("")
    if verdict["overridden"]:
        parts.append(f"**Override:** the `{SIZE_OVERRIDE_LABEL}` label is applied "
                     f"(added by {('@' + actor) if actor else 'unknown'}), so this gate passes "
                     f"here. {RERUN_HINT} Only maintainers should apply it.")
        parts.append("")
    elif verdict["tripped"]:
        parts.append("Every other CI job in this workflow FAILS at its first step (nothing "
                     "else runs) until the PR is within the limits. **How to split it:**")
        parts += [f"- {t}" for t in split_advice(stats)]
        parts.append("")
        parts.append(f"If the change genuinely cannot be split (e.g. one mechanical rename), a "
                     f"maintainer can apply `{SIZE_OVERRIDE_LABEL}`. {RERUN_HINT}")
        parts.append("")
    parts.append(f"<sub>Generated-file patterns (shared with the ai-review scope guard): "
                 f"{', '.join(f'`{g}`' for g in GENERATED_FILE_PATTERNS)}. "
                 f"Test patterns exempt from the LINE cap here only: "
                 f"{', '.join(f'`{t}`' for t in TEST_FILE_PATTERNS)}. Size labels by "
                 f"reviewable added lines: XS <50, S <200, M <500, L <1000, "
                 f"XL ≤{MAX_ADDED_LINES:,}, XXL >{MAX_ADDED_LINES:,}.</sub>")
    return "\n".join(parts) + "\n"


def comment_body(stats, verdict, actor=None) -> str:
    """Body of the single marker comment posted while the PR fails the gate."""
    return COMMENT_MARKER + "\n" + summary_markdown(stats, verdict, actor)


def resolved_body(verdict, actor=None) -> str:
    how = (f"overridden by `{SIZE_OVERRIDE_LABEL}` (added by {('@' + actor) if actor else 'unknown'})"
           if verdict["overridden"] else "now within the limits")
    return (f"{COMMENT_MARKER}\n### PR Size: {how} — `{verdict['label']}`\n\n"
            f"An earlier push exceeded the PR size limits; see the **PR Size** check for "
            f"the current numbers.\n")


# ── git / GitHub I/O ────────────────────────────────────────────────────────
def _git(*args) -> str:
    r = subprocess.run(["git", *args], text=True, capture_output=True)
    if r.returncode != 0:  # fail closed: an unreadable diff must not read as "0 lines"
        raise RuntimeError(f"git {' '.join(args)} failed ({r.returncode}): {r.stderr.strip()[:500]}")
    return r.stdout


def _git_ok(*args) -> bool:
    return subprocess.run(["git", *args], text=True, capture_output=True).returncode == 0


def pr_head_ref(pr) -> str:
    """The PR's head as the BASE repository publishes it. It exists for fork and
    same-repo PRs alike; a fork's branch is NOT under origin/<head_ref>."""
    return f"refs/pull/{int(pr)}/head"


def _has_commit(sha: str) -> bool:
    return _git_ok("cat-file", "-e", f"{sha}^{{commit}}")


def ensure_commits(pr, base: str, head: str) -> None:
    """Make `base` and `head` present locally, from the base repo only.

    1. `refs/pull/<N>/head` -- where a fork PR's commits live in this repo.
    2. A SHA still missing (the base branch or the PR moved on since the event,
       e.g. a force-push) is fetched by SHA.
    Anything still missing fails closed: an unmeasurable PR must not pass."""
    ref = pr_head_ref(pr)
    _git_ok("fetch", "--no-tags", "--quiet", "origin", f"+{ref}:refs/remotes/pull/{int(pr)}/head")
    for sha in (base, head):
        if not _has_commit(sha):
            _git_ok("fetch", "--no-tags", "--quiet", "origin", sha)
    missing = [sha for sha in (base, head) if not _has_commit(sha)]
    if missing:
        raise RuntimeError(f"cannot fetch {', '.join(missing)} from origin ({ref} or by SHA)")


def git_stats(base: str, head: str) -> dict:
    """The ai-review scope guard's numbers: same diff, same split, same commit count."""
    stats = size_stats(_git("diff", "--numstat", f"{base}...{head}"), exempt_tests=True)
    stats["commits"] = int(_git("rev-list", "--count", f"{base}..{head}").strip() or 0)
    return stats


def _gh(*args, stdin=None, check=True):
    r = subprocess.run(["gh", *args], text=True, capture_output=True, input=stdin, timeout=120)
    if check and r.returncode != 0:
        raise RuntimeError(f"gh {' '.join(args[:3])} failed ({r.returncode}): {r.stderr.strip()[:500]}")
    return r


def current_labels(repo, pr) -> list:
    """The PR's labels NOW -- not the event payload's, which a re-run replays."""
    r = _gh("api", f"repos/{repo}/issues/{pr}/labels", "--paginate", "-q", ".[].name")
    return [l for l in r.stdout.splitlines() if l.strip()]


def publish_label(repo, pr, label, labels):
    """Set exactly one size/* label. Creates `label` in the repo if it is missing."""
    for stale in (l for l in labels if l in SIZE_LABELS and l != label):
        _gh("api", "-X", "DELETE",
            f"repos/{repo}/issues/{pr}/labels/{urllib.parse.quote(stale, safe='')}")
    if label in labels:
        return
    # Fails harmlessly (HTTP 422) when the label already exists.
    _gh("label", "create", label, "--repo", repo, "--color", SIZE_LABEL_COLORS[label],
        "--description", "PR size by reviewable added lines (PR Size gate)", check=False)
    _gh("api", "-X", "POST", f"repos/{repo}/issues/{pr}/labels", "-f", f"labels[]={label}")


def _marker_comment(repo, pr):
    r = _gh("api", f"repos/{repo}/issues/{pr}/comments", "--paginate",
            "-q", f'.[] | select(.user.login == "{COMMENT_AUTHOR}" and '
                  f'(.body | contains("{COMMENT_MARKER}"))) | {{id: .id, body: .body}}')
    found = [json.loads(l) for l in r.stdout.splitlines() if l.strip()]
    return found[0] if found else None


def publish_comment(repo, pr, stats, verdict, actor):
    """One marker comment while failing; rewritten (never deleted) once resolved."""
    existing = _marker_comment(repo, pr)
    failing = verdict["tripped"] and not verdict["overridden"]
    if failing:
        body = comment_body(stats, verdict, actor)
    elif existing:
        body = resolved_body(verdict, actor)
    else:
        return
    if existing and existing.get("body", "").strip() == body.strip():
        return
    with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False) as f:
        f.write(json.dumps({"body": body}))
        path = f.name
    try:
        if existing:
            _gh("api", "-X", "PATCH", f"repos/{repo}/issues/comments/{existing['id']}",
                "--input", path)
        else:
            _gh("api", "-X", "POST", f"repos/{repo}/issues/{pr}/comments", "--input", path)
    finally:
        os.unlink(path)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--repo", required=True)
    ap.add_argument("--pr", type=int, required=True)
    ap.add_argument("--base", required=True, help="base commit SHA")
    ap.add_argument("--head", required=True, help="head commit SHA")
    ap.add_argument("--fetch", action="store_true",
                    help="fetch base/head from origin first (refs/pull/<N>/head, then by SHA)")
    ap.add_argument("--publish", action="store_true",
                    help="set the size/* label and the marker comment on the PR")
    a = ap.parse_args(argv)

    try:
        if a.fetch:
            ensure_commits(a.pr, a.base, a.head)
        stats = git_stats(a.base, a.head)
        labels = current_labels(a.repo, a.pr)
    except (RuntimeError, subprocess.TimeoutExpired, OSError) as e:
        # Fail closed, but say why in the summary instead of a bare traceback.
        msg = f"PR Size could not measure this PR: {e}"
        print(f"::error title=PR Size could not measure the PR::{msg}")
        if os.environ.get("GITHUB_STEP_SUMMARY"):
            with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
                f.write(f"### ❌ PR Size: could not measure the PR\n\n{msg}\n")
        return 1
    verdict = evaluate(stats, labels)
    actor = label_actor(a.repo, a.pr, SIZE_OVERRIDE_LABEL) if verdict["overridden"] else None

    summary = summary_markdown(stats, verdict, actor)
    print(summary)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
            f.write(summary)

    if a.publish:
        for what, fn in (("size label", lambda: publish_label(a.repo, a.pr, verdict["label"], labels)),
                         ("size comment", lambda: publish_comment(a.repo, a.pr, stats, verdict, actor))):
            try:
                fn()
            except (RuntimeError, subprocess.TimeoutExpired, OSError) as e:
                print(f"::warning::PR Size: could not update the {what} ({e}). "
                      f"The verdict is unaffected.")

    if verdict["overridden"]:
        print(f"::warning title=PR Size overridden::{'; '.join(verdict['tripped'])} -- passing "
              f"because `{SIZE_OVERRIDE_LABEL}` is applied (added by {actor or 'unknown'}).")
        return 0
    if verdict["tripped"]:
        print(f"::error title=PR too large::{'; '.join(verdict['tripped'])}. Split the PR "
              f"(advice in the job summary); a maintainer can apply `{SIZE_OVERRIDE_LABEL}`.")
        return 1
    print(f"PR Size OK: {verdict['label']} ({'; '.join(verdict['within'])}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
