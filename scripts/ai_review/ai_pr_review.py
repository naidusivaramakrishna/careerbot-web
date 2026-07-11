#!/usr/bin/env python3
"""
ai_pr_review.py — automated two-model (Claude + Codex) PR reviewer, batch + dynamic.

Reviews ONE PR (--pr N) or ALL open PRs (--all). For each PR it runs:
  T0 SCOPE GUARD   — refuse mega/integration branches; post "split required".
  T1 STATIC        — Claude deep review + Codex adversarial cross-check (at head SHA).
  T2 DYNAMIC       — (--dynamic) run the PR's relevant tests + an import smoke in CI.
  then RECONCILE   → upsert ONE review comment on the PR (idempotent per head SHA).

Idempotency: each comment carries `<!-- ai-review:<headSHA> -->`. On a schedule sweep,
a PR whose current head already has a review comment is SKIPPED — so you can run this
every 30 min over all PRs and it only reviews new/changed ones. That is the "monitor".

Never merges. Advisory. A human approves.

Requirements on the runner (see SETUP.txt): git, gh, claude, codex; and for --dynamic:
python + the project deps + an ephemeral Mongo/Redis (provided by the CI job's services).
"""
from __future__ import annotations
import argparse, json, os, re, subprocess, sys, tempfile
from pathlib import Path

MAX_FILES, MAX_ADDED_LINES, MAX_COMMITS, MAX_AUTHORS = 120, 8000, 40, 4
MARKER = "<!-- ai-review:{sha} -->"
MARKER_RE = re.compile(r"<!-- ai-review:([0-9a-f]{7,40}) -->")


def run(cmd, check=False, stdin=None, timeout=None):
    r = subprocess.run(cmd, input=stdin, text=True, capture_output=True,
                       check=False, timeout=timeout)
    if check and r.returncode != 0:
        sys.stderr.write(f"[cmd-failed:{r.returncode}] {' '.join(cmd)}\n{r.stderr[:2000]}\n")
    return r


def out(cmd, **kw):
    return run(cmd, **kw).stdout.strip()


def open_prs(repo):
    j = out(["gh", "pr", "list", "--repo", repo, "--state", "open", "--limit", "100",
             "--json", "number,isDraft"])
    return [p["number"] for p in json.loads(j or "[]") if not p["isDraft"]]


def pr_meta(repo, pr):
    return json.loads(out(["gh", "pr", "view", str(pr), "--repo", repo,
                           "--json", "baseRefOid,headRefOid,title,author"]))


def existing_review_sha(repo, pr):
    """Return the headSHA of the most recent AI-review comment, or None."""
    j = out(["gh", "api", f"repos/{repo}/issues/{pr}/comments", "--paginate",
             "-q", ".[] | select(.body | contains(\"<!-- ai-review:\")) | {id:.id, body:.body}"])
    last_id, last_sha = None, None
    for line in j.splitlines():
        try:
            c = json.loads(line)
        except Exception:
            continue
        m = MARKER_RE.search(c["body"])
        if m:
            last_id, last_sha = c["id"], m.group(1)
    return last_id, last_sha


def upsert_comment(repo, pr, body):
    """Edit the existing AI-review comment if present, else create a new one."""
    cid, _ = existing_review_sha(repo, pr)
    with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False) as f:
        f.write(body); path = f.name
    if cid:
        run(["gh", "api", f"repos/{repo}/issues/comments/{cid}", "-X", "PATCH",
             "-F", f"body=@{path}"])
    else:
        run(["gh", "pr", "comment", str(pr), "--repo", repo, "--body-file", path])


# ── T0 scope guard ──────────────────────────────────────────────────────────
def scope_guard(base, head):
    files = [l for l in out(["git", "diff", "--numstat", f"{base}...{head}"]).splitlines() if l.strip()]
    added = sum(int(c.split("\t")[0]) for c in files if c.split("\t")[0].isdigit())
    commits = int(out(["git", "rev-list", "--count", f"{base}..{head}"]) or 0)
    authors = len({a for a in out(["git", "log", "--format=%an", f"{base}..{head}"]).splitlines() if a})
    stats = {"files": len(files), "added": added, "commits": commits, "authors": authors}
    reasons = []
    if stats["files"] > MAX_FILES: reasons.append(f"{stats['files']} files>{MAX_FILES}")
    if stats["added"] > MAX_ADDED_LINES: reasons.append(f"+{stats['added']}>{MAX_ADDED_LINES}")
    if stats["commits"] > MAX_COMMITS: reasons.append(f"{stats['commits']} commits>{MAX_COMMITS}")
    if stats["authors"] > MAX_AUTHORS: reasons.append(f"{stats['authors']} authors>{MAX_AUTHORS}")
    return (not reasons), "; ".join(reasons), stats


# ── T1 static (Claude + Codex) ──────────────────────────────────────────────
CLAUDE_PROMPT = """You are a top-1% senior backend reviewer + SDET reviewing ONE PR.
Review ONLY diff {base}...{head} (three-dot). Read files AT head SHA {head}. Follow the
repo review checklist (docs/claude_split/**/*_pr_review_checklist.md) and CLAUDE.md.
Output: a KPI line (P0/P1/P2/P3 + verdict BLOCK|CHANGES-REQUESTED|ACCEPT-WITH-FIXES|ACCEPT),
then each finding as [sev] title | file:line | quoted code | why | fix. Add an SDET note
(tests added/updated? removal-orphans deleted?). Evidence-only; no speculation."""


def claude_pass(base, head):
    return run(["claude", "-p", CLAUDE_PROMPT.format(base=base, head=head)]).stdout or "_no output_"


def codex_pass(base, head, claude):
    prompt = (f"ROLE: OUTSIDER senior reviewer. Cross-check the review below AND find what it "
              f"missed. Inspect only diff {base}...{head}. file:line evidence required. For each "
              f"finding CONFIRM|REFUTE|REGRADE; then MISSED [sev]+file:line; OVERALL verdict.\n\n"
              f"=== REVIEW TO CROSS-CHECK ===\n{claude}\n")
    return run(["codex", "review", "-"], stdin=prompt).stdout or "_no output_"


# ── T2 dynamic (run tests touching changed modules + import smoke) ───────────
def run_dynamic(base, head):
    changed = [l for l in out(["git", "diff", "--name-only", f"{base}...{head}"]).splitlines()
               if l.endswith(".py") and l.startswith("app/")]
    # map app/x/y/foo.py -> tests matching *foo*
    stems = {Path(c).stem for c in changed}
    all_tests = out(["bash", "-lc", "git ls-files 'tests/**/test_*.py' 2>/dev/null"]).splitlines()
    picked = sorted({t for t in all_tests for s in stems if s and s in Path(t).name})[:25]
    py = ".venv/bin/python" if Path(".venv/bin/python").exists() else "python3"

    smoke = run([py, "-c", "import importlib; importlib.import_module('app.main')"], timeout=180)
    smoke_ok = smoke.returncode == 0
    smoke_tail = (smoke.stderr or smoke.stdout or "").strip().splitlines()[-8:]

    if not picked:
        return {"ran": False, "smoke_ok": smoke_ok, "smoke_tail": smoke_tail,
                "summary": "no test files matched the changed modules"}
    r = run([py, "-m", "pytest", *picked, "-q", "--no-header", "-p", "no:cacheprovider"], timeout=1200)
    tail = (r.stdout + "\n" + r.stderr).strip().splitlines()[-25:]
    return {"ran": True, "passed": r.returncode == 0, "tests": picked,
            "smoke_ok": smoke_ok, "smoke_tail": smoke_tail, "tail": tail}


# ── report ──────────────────────────────────────────────────────────────────
def build_report(head, stats, claude, codex, dyn):
    dyn_md = "_dynamic tier skipped (run with --dynamic in CI)_"
    if dyn is not None:
        s = "✅" if dyn.get("smoke_ok") else "❌"
        if not dyn.get("ran"):
            dyn_md = (f"- App import smoke: {s}\n- Tests: {dyn.get('summary')}\n"
                      + ("```\n" + "\n".join(dyn.get('smoke_tail', [])) + "\n```" if not dyn.get('smoke_ok') else ""))
        else:
            p = "✅ PASS" if dyn.get("passed") else "❌ FAIL"
            dyn_md = (f"- App import smoke: {s}\n- Ran {len(dyn['tests'])} test file(s): **{p}**\n"
                      f"<details><summary>pytest output</summary>\n\n```\n"
                      + "\n".join(dyn.get("tail", [])) + "\n```\n</details>")
    return f"""## 🤖 AI Code Review — Claude + Codex (advisory)

**Scope:** {stats['files']} files, +{stats['added']} lines, {stats['commits']} commits, {stats['authors']} author(s). Advisory — a human still approves/merges. Findings **confirmed by both** models are highest-confidence.

<details open><summary><b>T1 · Claude static review</b></summary>

{claude}

</details>

<details><summary><b>T1 · Codex cross-check (verifies + frame-challenges)</b></summary>

{codex}

</details>

<details><summary><b>T2 · Dynamic (tests + import smoke)</b></summary>

{dyn_md}

</details>

<sub>Automated static+dynamic review. `/ai-review` to re-run after pushes. {MARKER.format(sha=head)}</sub>
"""


def review_one(repo, pr, dynamic, dry_run, force):
    meta = pr_meta(repo, pr)
    base, head = meta["baseRefOid"], meta["headRefOid"]
    run(["git", "fetch", "origin", base, f"refs/pull/{pr}/head"], timeout=300)

    _, reviewed_sha = existing_review_sha(repo, pr)
    if reviewed_sha and reviewed_sha.startswith(head[:len(reviewed_sha)]) and not force:
        print(f"#{pr}: already reviewed at {head[:8]} — skip"); return

    ok, reason, stats = scope_guard(base, head)
    if not ok:
        body = (f"## 🤖 AI Code Review — SCOPE GUARD\n\nThis PR is too large for a meaningful "
                f"single review ({reason}); stats {stats}. **Split into focused, single-concern "
                f"PRs** (or rebase onto the current base). Re-run `/ai-review` on the splits.\n\n"
                f"<sub>{MARKER.format(sha=head)}</sub>")
        print(f"#{pr}: SCOPE-GUARD reject ({reason})")
        if not dry_run: upsert_comment(repo, pr, body)
        return

    claude = claude_pass(base, head)
    codex = codex_pass(base, head, claude)
    dyn = run_dynamic(base, head) if dynamic else None
    body = build_report(head, stats, claude, codex, dyn)
    if dry_run:
        print(body); return
    upsert_comment(repo, pr, body)
    print(f"#{pr}: reviewed + posted ({head[:8]})")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--pr", type=int); g.add_argument("--all", action="store_true")
    ap.add_argument("--dynamic", action="store_true", help="run T2 (needs deps + DB)")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true", help="re-review even if head unchanged")
    a = ap.parse_args()
    prs = open_prs(a.repo) if a.all else [a.pr]
    print(f"Reviewing {len(prs)} PR(s): {prs}")
    for pr in prs:
        try:
            review_one(a.repo, pr, a.dynamic, a.dry_run, a.force)
        except Exception as e:  # one bad PR must not stop the sweep
            print(f"#{pr}: ERROR {type(e).__name__}: {e}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
