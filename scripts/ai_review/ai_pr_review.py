#!/usr/bin/env python3
"""
ai_pr_review.py — automated two-model (Claude + Codex) PR reviewer + real testing.

Reviews ONE PR (--pr N) or ALL open PRs (--all). For each PR it runs:
  T0 SCOPE GUARD  — refuse mega/integration branches; post "split required".
  T1 STATIC       — Claude deep review + Codex adversarial cross-check (at head SHA).
  T2 DYNAMIC      — (--dynamic) real testing, per the repo's stack:
                      python: import smoke + targeted pytest (LLM MOCKED)
                              + live-server boot & /health check
                      node:   install + build (typecheck/compile) + lint
  T3 LIVE-LLM     — (--live, opt-in) real LLM call on the repo's live-LLM test.
                      Costs real tokens; triggered on demand (/ai-review-live),
                      NEVER on every PR.
  then RECONCILE  → upsert ONE review comment on the PR (idempotent per head SHA).

Per-repo behaviour is driven by scripts/ai_review/review_config.json (see
load_config() for the schema + defaults). This one script serves every repo.

Idempotency: each comment carries `<!-- ai-review:<headSHA> -->`. A PR whose
current head already has a review comment is SKIPPED (unless --force / --live),
so a manual `--all` sweep only reviews new/changed PRs. Each NEW commit gets its own
fresh review comment (visible per-commit history); a forced/live re-run of the
same head edits that commit's comment in place instead of posting a duplicate.

Never merges. Advisory. A human approves.
"""
from __future__ import annotations
import argparse, json, os, re, signal, subprocess, sys, tempfile, time, traceback, urllib.request
from pathlib import Path

MAX_FILES, MAX_ADDED_LINES, MAX_COMMITS, MAX_AUTHORS = 120, 8000, 40, 4
MARKER = "<!-- ai-review:{sha} -->"
MARKER_RE = re.compile(r"<!-- ai-review:([0-9a-f]{7,40}) -->")
HERE = Path(__file__).resolve().parent


def run(cmd, check=False, stdin=None, timeout=None, env=None, cwd=None):
    r = subprocess.run(cmd, input=stdin, text=True, capture_output=True,
                       check=False, timeout=timeout, env=env, cwd=cwd)
    if check and r.returncode != 0:
        sys.stderr.write(f"[cmd-failed:{r.returncode}] {' '.join(cmd)}\n{r.stderr[:2000]}\n")
    return r


def out(cmd, **kw):
    return run(cmd, **kw).stdout.strip()


# ── per-repo config ──────────────────────────────────────────────────────────
def load_config():
    """Read scripts/ai_review/review_config.json; fall back to api-style python."""
    default = {
        "stack": "python",
        "changed_prefix": ["app/", "src/"],
        "test_glob": "tests/**/test_*.py",
        "import_smoke": "app.main",
        "server": None,   # {"cmd": "...", "health": "http://127.0.0.1:PORT/health", "boot_wait": 30}
        "node": None,     # {"install": "npm ci", "build": "npm run build", "checks": ["npm run lint"]}
        "live": None,     # {"cmd": "python -m pytest tests/.../test_live_llm.py -q", "note": "real Azure call"}
    }
    p = HERE / "review_config.json"
    if p.exists():
        try:
            default.update(json.loads(p.read_text()))
        except Exception as e:
            print(f"[config] failed to read {p}: {e}; using defaults")
    return default


def open_prs(repo):
    j = out(["gh", "pr", "list", "--repo", repo, "--state", "open", "--limit", "100",
             "--json", "number,isDraft"])
    return [p["number"] for p in json.loads(j or "[]") if not p["isDraft"]]


def pr_meta(repo, pr):
    return json.loads(out(["gh", "pr", "view", str(pr), "--repo", repo,
                           "--json", "baseRefOid,headRefOid,title,author,labels"]))


def existing_review_sha(repo, pr):
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
    # Post a FRESH review comment for each new commit so every push gets its own
    # report and the PR keeps a visible per-commit review history. Only EDIT the
    # existing comment in place when re-reviewing the SAME head SHA (e.g. a
    # forced/live re-run), so repeated runs on one commit don't spam duplicates.
    cur = MARKER_RE.search(body)
    cur_sha = cur.group(1) if cur else None
    cid, last_sha = existing_review_sha(repo, pr)
    with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False) as f:
        f.write(body); path = f.name
    same_commit = bool(cid and last_sha and cur_sha and last_sha == cur_sha)
    if same_commit:
        run(["gh", "api", f"repos/{repo}/issues/comments/{cid}", "-X", "PATCH",
             "-F", f"body=@{path}"])
    else:
        run(["gh", "pr", "comment", str(pr), "--repo", repo, "--body-file", path])


# ── PR context (description + human conversation) ───────────────────────────
def pr_context(repo, pr):
    """Fetch the PR title, description, and human comments so the reviewer
    understands the author's INTENT — not just the diff. Excludes the bot's own
    ai-review comments to avoid feeding it its own prior output."""
    meta = json.loads(out(["gh", "pr", "view", str(pr), "--repo", repo,
                           "--json", "title,body"]) or "{}")
    title = (meta.get("title") or "").strip()
    body = (meta.get("body") or "").strip()
    raw = out(["gh", "api", f"repos/{repo}/issues/{pr}/comments", "--paginate",
               "-q", ".[] | select((.body // \"\") | contains(\"<!-- ai-review:\") | not) "
                     "| \"[\\(.user.login)] \\(.body)\""])
    convo = [l for l in raw.splitlines() if l.strip()][-12:]  # last dozen human comments
    parts = [f"TITLE: {title}"]
    parts.append("DESCRIPTION:\n" + (body[:4000] if body else "(none provided)"))
    if convo:
        parts.append("CONVERSATION (author/reviewers, newest last):\n" + "\n".join(convo)[:4000])
    return "\n\n".join(parts)


# ── T0 scope guard ──────────────────────────────────────────────────────────
def scope_guard(base, head):
    files = [l for l in out(["git", "diff", "--numstat", f"{base}...{head}"]).splitlines() if l.strip()]
    added = sum(int(c.split("\t")[0]) for c in files if c.split("\t")[0].isdigit())
    removed = sum(int(p[1]) for p in (c.split("\t") for c in files)
                  if len(p) > 1 and p[1].isdigit())
    # Fully-deleted files (D) — surfaced prominently so a human confirms the
    # removal was intentional (cleanup/optimization) and not an accidental drop.
    deleted = [l for l in out(["git", "diff", "--diff-filter=D", "--name-only",
                               f"{base}...{head}"]).splitlines() if l.strip()]
    commits = int(out(["git", "rev-list", "--count", f"{base}..{head}"]) or 0)
    authors = len({a for a in out(["git", "log", "--format=%an", f"{base}..{head}"]).splitlines() if a})
    stats = {"files": len(files), "added": added, "removed": removed,
             "deleted": deleted, "commits": commits, "authors": authors}
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

FIRST read the author's stated INTENT below (PR description + conversation). Review the
diff AGAINST that intent: (a) does the code do what the description claims — flag any claim
the diff does not actually deliver; (b) if a change looks like a bug but the description shows
it is deliberate, reframe to "verify callers/tests/docs migrated" instead of "bug"; (c) if the
description leaves a contract/back-compat question open, make verifying it a finding.

=== AUTHOR INTENT (PR description + conversation) ===
{context}
=== END INTENT ===

DELETIONS: if this diff DELETES files or removes functions/classes/exports/routes,
treat each removal as suspect until proven safe. For EVERY deleted file or removed
symbol, grep the repo AT head for remaining importers/callers/route-registrations/
config references; a surviving reference to a deleted target is a [P0] break. If the
description says the removal is intentional cleanup, downgrade to "verify no orphaned
references remain" and name the greps you'd run. Never assume a deletion is safe.

Output: a KPI line (P0/P1/P2/P3 + verdict BLOCK|CHANGES-REQUESTED|ACCEPT-WITH-FIXES|ACCEPT),
then each finding as [sev] title | file:line | quoted code | why | fix. Add an SDET note
(tests added/updated? removal-orphans deleted?) and a DELETIONS note (each deleted file:
intentional? orphaned refs?). Evidence-only; no speculation."""


def claude_pass(base, head, context):
    """(review_text, ok). `ok` is False when the primary reviewer did not run.

    run() never raises on a non-zero exit, so a `claude` CLI that is present
    but FAILS -- usage limit, expired auth, a timeout kill -- returned empty
    stdout, became "_no output_", counted as zero findings and let main()
    exit 0. Before the merge gate that produced a useless comment; with it,
    the required check would assert "reviewed and nothing blocking is open"
    about a PR nothing reviewed. codex_pass already handles exactly this for
    the cross-check tier; the primary tier had no equivalent.
    """
    r = run(["claude", "-p", CLAUDE_PROMPT.format(base=base, head=head, context=context)],
            timeout=900)
    text = (r.stdout or "").strip()
    if r.returncode != 0 or not text:
        detail = (r.stderr or "").strip()[-1500:] or f"exit {r.returncode}, no output"
        return (f"**The Claude review tier did not run.**\n\n```\n{detail}\n```\n\n"
                f"This is a harness failure, not a verdict on the code."), False
    return text, True


def codex_pass(base, head, claude, context):
    prompt = (f"ROLE: OUTSIDER senior reviewer. Cross-check the review below AND find what it "
              f"missed. Inspect only diff {base}...{head}. file:line evidence required. Use the "
              f"author's INTENT to judge whether flagged 'bugs' are deliberate and whether the "
              f"diff actually delivers what the description claims. For each finding "
              f"CONFIRM|REFUTE|REGRADE; then MISSED [sev]+file:line; OVERALL verdict. "
              f"DELETIONS: independently check every deleted file / removed symbol for "
              f"surviving importers, callers, route registrations, or config references "
              f"AT head — a live reference to a deleted target is a [P0] the first pass "
              f"may have missed.\n\n"
              f"=== AUTHOR INTENT ===\n{context}\n\n=== REVIEW TO CROSS-CHECK ===\n{claude}\n")
    # The Codex cross-check is a SECONDARY tier. It must never crash the primary
    # Claude review: a missing `codex` binary (FileNotFoundError) or any codex
    # failure degrades to a visible note so the review is still posted. The gap
    # is surfaced (not silent) so the runner's missing tool gets fixed.
    try:
        r = run(["codex", "review", "-"], stdin=prompt, timeout=900)
        out = (r.stdout or "").strip()
        if out:
            return out
        # codex wrote nothing to stdout. Surface stderr so the REAL reason is
        # visible (e.g. "You've hit your usage limit", auth error) instead of a
        # bland "_no output_" — codex writes its status/errors to stderr, and
        # the empty-stdout case was silently hiding them.
        err = (r.stderr or "").strip()
        if err:
            return (f"_Codex produced no stdout (exit {r.returncode}). stderr tail:_\n\n"
                    f"```\n{err[-1500:]}\n```\n\n_**Claude's review above still applies.**_")
        return (f"_Codex produced no output (exit {r.returncode}). "
                f"**Claude's review above still applies.**_")
    except FileNotFoundError:
        return ("_Codex cross-check unavailable: the `codex` CLI is not installed / not on "
                "PATH on this runner (FileNotFoundError). Install it on the ai-review runner "
                "to restore the adversarial pass. **Claude's review above still applies.**_")
    except Exception as e:
        return (f"_Codex cross-check failed ({type(e).__name__}: {e}). "
                f"**Claude's review above still applies.**_")


def boot_server(server):
    """Start the app, poll /health, return (ok, detail). Always kills the process."""
    cmd = server["cmd"]; health = server["health"]; wait = int(server.get("boot_wait", 30))
    logf = tempfile.NamedTemporaryFile("w+", suffix=".log", delete=False)
    proc = subprocess.Popen(cmd, shell=True, stdout=logf, stderr=subprocess.STDOUT,
                            text=True, preexec_fn=os.setsid)
    try:
        deadline = time.time() + wait
        while time.time() < deadline:
            if proc.poll() is not None:
                break  # crashed on boot
            try:
                with urllib.request.urlopen(health, timeout=3) as r:
                    if 200 <= r.status < 500:
                        return True, f"{health} -> HTTP {r.status}"
            except Exception:
                time.sleep(2)
        # timed out or crashed
        try:
            tail = Path(logf.name).read_text(errors="replace").strip().splitlines()[-12:]
        except Exception:
            tail = []
        why = "process exited on boot" if proc.poll() is not None else f"no healthy /health within {wait}s"
        return False, why + ("\n```\n" + "\n".join(tail) + "\n```" if tail else "")
    finally:
        try:
            os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
        except Exception:
            pass


# ── T2 dynamic — python: import smoke + tests + live server ──────────────────
def dynamic_python(cfg, base, head):
    res = {"stack": "python"}
    py = ".venv/bin/python" if Path(".venv/bin/python").exists() else "python3"

    # 1) import smoke
    if cfg.get("import_smoke"):
        smoke = run([py, "-c", f"import importlib; importlib.import_module('{cfg['import_smoke']}')"],
                    timeout=180)
        res["smoke_ok"] = smoke.returncode == 0
        res["smoke_tail"] = (smoke.stderr or smoke.stdout or "").strip().splitlines()[-8:]

    # 2) targeted unit tests (LLM mocked)
    prefixes = tuple(cfg.get("changed_prefix", ["app/", "src/"]))
    changed = [l for l in out(["git", "diff", "--name-only", f"{base}...{head}"]).splitlines()
               if l.endswith(".py") and l.startswith(prefixes)]
    stems = {Path(c).stem for c in changed}
    glob = cfg.get("test_glob", "tests/**/test_*.py")
    all_tests = out(["bash", "-lc", f"git ls-files '{glob}' 2>/dev/null"]).splitlines()
    picked = sorted({t for t in all_tests for s in stems if s and s in Path(t).name})[:25]
    if picked:
        r = run([py, "-m", "pytest", *picked, "-q", "--no-header", "-p", "no:cacheprovider"], timeout=1200)
        res["tests"] = picked
        res["tests_passed"] = r.returncode == 0
        res["tests_tail"] = (r.stdout + "\n" + r.stderr).strip().splitlines()[-25:]
    else:
        res["tests"] = []
        res["tests_note"] = "no test files matched the changed modules"

    # 3) live-server boot + /health
    if cfg.get("server"):
        ok, detail = boot_server(cfg["server"])
        res["server_ok"] = ok
        res["server_detail"] = detail
    return res


# ── T2 dynamic — node: install + build + checks ──────────────────────────────
def dynamic_node(cfg):
    n = cfg.get("node") or {}
    res = {"stack": "node"}
    inst = run(["bash", "-lc", n.get("install", "npm ci || npm install")], timeout=900)
    res["install_ok"] = inst.returncode == 0
    if not res["install_ok"]:
        res["install_tail"] = (inst.stdout + inst.stderr).strip().splitlines()[-12:]
        return res
    b = run(["bash", "-lc", n.get("build", "npm run build")], timeout=1200)
    res["build_ok"] = b.returncode == 0
    res["build_tail"] = (b.stdout + b.stderr).strip().splitlines()[-20:]
    res["checks"] = []
    for c in n.get("checks", []):
        cr = run(["bash", "-lc", c], timeout=600)
        res["checks"].append({"cmd": c, "ok": cr.returncode == 0,
                              "tail": (cr.stdout + cr.stderr).strip().splitlines()[-12:]})
    return res


def run_dynamic(cfg, base, head):
    return dynamic_node(cfg) if cfg.get("stack") == "node" else dynamic_python(cfg, base, head)


# ── T3 live-LLM (opt-in) ─────────────────────────────────────────────────────
def run_live_llm(cfg):
    live = cfg.get("live")
    if not live:
        return {"configured": False}
    py = ".venv/bin/python" if Path(".venv/bin/python").exists() else "python3"
    cmd = live["cmd"]
    r = run(["bash", "-lc", (cmd.replace("python3", py) if cmd.startswith("python") else cmd)],
            timeout=1800)
    return {"configured": True, "ok": r.returncode == 0, "note": live.get("note", "real LLM call"),
            "tail": (r.stdout + "\n" + r.stderr).strip().splitlines()[-30:]}


# ── report ──────────────────────────────────────────────────────────────────
def _ok(b): return "✅" if b else "❌"


def dyn_section(dyn):
    if dyn is None:
        return "_dynamic tier skipped (run with --dynamic)_"
    if dyn.get("stack") == "node":
        lines = [f"- Install: {_ok(dyn.get('install_ok'))}"]
        if dyn.get("install_ok"):
            lines.append(f"- Build (typecheck/compile): {_ok(dyn.get('build_ok'))}")
            if not dyn.get("build_ok"):
                lines.append("```\n" + "\n".join(dyn.get("build_tail", [])) + "\n```")
            for c in dyn.get("checks", []):
                lines.append(f"- `{c['cmd']}`: {_ok(c['ok'])}"
                             + ("" if c["ok"] else "\n```\n" + "\n".join(c["tail"]) + "\n```"))
        else:
            lines.append("```\n" + "\n".join(dyn.get("install_tail", [])) + "\n```")
        return "\n".join(lines)
    # python
    lines = []
    if "smoke_ok" in dyn:
        lines.append(f"- App import smoke: {_ok(dyn['smoke_ok'])}"
                     + ("" if dyn["smoke_ok"] else "\n```\n" + "\n".join(dyn.get("smoke_tail", [])) + "\n```"))
    if dyn.get("tests"):
        lines.append(f"- Unit tests (LLM mocked) — {_ok(dyn.get('tests_passed'))} "
                     f"({len(dyn['tests'])} file(s))\n<details><summary>pytest output</summary>\n\n```\n"
                     + "\n".join(dyn.get("tests_tail", [])) + "\n```\n</details>")
    else:
        lines.append(f"- Unit tests: _{dyn.get('tests_note', 'none matched')}_")
    if "server_ok" in dyn:
        lines.append(f"- Live-server boot + /health: {_ok(dyn['server_ok'])} — {dyn.get('server_detail','')}")
    return "\n".join(lines)


def live_section(live):
    if live is None:
        return None
    if not live.get("configured"):
        return "_no live-LLM test configured for this repo_"
    return (f"**Real LLM call — {_ok(live['ok'])}** ({live.get('note','')})\n"
            f"<details><summary>output</summary>\n\n```\n" + "\n".join(live.get("tail", [])) + "\n```\n</details>")


def build_report(head, stats, claude, codex, dyn, live):
    live_md = live_section(live)
    live_block = (f"""
<details open><summary><b>T3 · Live-LLM (real Azure call — on demand)</b></summary>

{live_md}

</details>
""" if live_md is not None else "")
    deleted = stats.get("deleted") or []
    if deleted:
        shown = "\n".join(f"- `{f}`" for f in deleted[:40])
        more = f"\n- …and {len(deleted) - 40} more" if len(deleted) > 40 else ""
        del_block = (f"\n> ⚠️ **{len(deleted)} file(s) deleted — confirm this removal is "
                     f"intentional** (cleanup/optimization) and not an accidental drop. "
                     f"Verify nothing still imports/calls/registers them.\n{shown}{more}\n")
    else:
        del_block = ""
    return f"""## 🤖 AI Code Review — Claude + Codex (advisory)

**Scope:** {stats['files']} files, +{stats['added']}/-{stats.get('removed', 0)} lines, {stats['commits']} commits, {stats['authors']} author(s). Advisory — a human still approves/merges. Findings **confirmed by both** models are highest-confidence.
{del_block}

<details open><summary><b>T1 · Claude static review</b></summary>

{claude}

</details>

<details><summary><b>T1 · Codex cross-check (verifies + frame-challenges)</b></summary>

{codex}

</details>

<details open><summary><b>T2 · Dynamic testing</b></summary>

{dyn_section(dyn)}

</details>
{live_block}
<sub>Automated review. `/ai-review` re-runs after pushes; `/ai-review-live` adds the real-LLM tier (costs tokens). {MARKER.format(sha=head)}</sub>
"""


# ---------------------------------------------------------------------------
# Merge gate
#
# main() previously failed only when a review CRASHED. A review that completed
# and found real problems still exited 0, so the `ai-review` check went green
# because the reviewer ran, not because the code was sound -- a PR could carry a
# dozen findings, show a green check, and merge with every one of them open.
# That is how #288/#289/#290/#296/#297 merged 44 blocking findings, three of
# them P0, with no review saying the change was acceptable.
# ---------------------------------------------------------------------------

# Severity policy. P0/P1 block the merge; P2/P3 are advisory and belong in a
# follow-up PR or a tracked issue rather than holding this one open.
#
# P2 used to block. It was moved out after measuring what that actually did:
# re-running the reviewer on a PR after fixing everything it reported produced a
# DIFFERENT set of roughly five blocking findings every time -- 8, 6, 6, 5, 5
# over five rounds on careerbot-api#174, never reaching zero, with about a third
# of each round's findings INTRODUCED by the previous round's fix.
#
# That is not a tuning problem, it is the shape of the tool: an adversarial LLM
# review is an open-ended stochastic search, not a proof, so "the reviewer found
# nothing" is not a reachable state on a non-trivial diff. A gate whose exit
# condition cannot be reached is a livelock, and a livelocked gate gets
# bypassed -- which is worse than a narrower one that holds.
#
# P0/P1 is the line that stays reachable: "broken or unsafe as written" and
# "must fix before this ships". P2 findings are real and are still reported and
# tracked; they just do not hold a correct change hostage to a search that never
# terminates.
#
# Changing these two tuples is the only thing needed to re-tune the gate.
BLOCKING_SEVERITIES = ("P0", "P1")
ADVISORY_SEVERITIES = ("P2", "P3")

# Applying this label to a PR converts a block into a warning. It does not hide
# the findings: the run still prints them and still says the PR shipped with
# them open. GitHub records who added the label, which is the audit trail -- an
# admin merge leaves no such record, which is why this exists.
WAIVER_LABEL = "ai-review-waive"

# Stamped into a report whose review did not actually happen. A failure body
# carries ZERO [Pn] tags, so without this the skip path counted 0 on the next
# run at the same head and turned the red check green -- "push nothing, re-run,
# merge", the exact hole the skip path exists to close. The workflow never
# passes --force, so both /ai-review and GitHub's "Re-run failed jobs" button
# reach that path.
TIER_FAILURE_MARKER = "<!-- ai-review-status:tier-failed -->"

# Stamped into the scope-guard notice, for the same reason and a different cause:
# that body is posted when NOTHING was reviewed, it carries the head-SHA marker
# so the skip path matches it on the next run, and it has zero [Pn] tags. Without
# this stamp the second run counted 0 and went GREEN on a PR no model ever read --
# "re-run, merge", the hole the skip path exists to close.
SCOPE_GUARD_MARKER = "<!-- ai-review-status:scope-guard-reject -->"

_VERDICT_RE = re.compile(r"\b(BLOCK|CHANGES-REQUESTED|ACCEPT-WITH-FIXES|ACCEPT)\b")

# --- masking ---------------------------------------------------------------
# Quoted code is never a finding, and it is never STRUCTURE either: a review OF
# this reviewer quotes `</details>`, <summary> markers and [P0] tags as
# examples. Blanking is length-preserving and keeps newlines, so offsets and
# line anchors both survive.
# CommonMark-ish: an opener records its marker char and run length; only a
# line using the SAME char with a run at least as long closes it. Index-pairing
# every fence line was wrong -- one stray marker mid-body shifts every later
# pair by one, blanking prose (undercount, green) and unmasking real code
# (overcount). A trailing unmatched opener is left as ordinary text.
_FENCE_LINE_RE = re.compile(r"^[ \t]{0,3}(?P<ch>`{3,}|~{3,})(?P<info>.*)$")
_INLINE_CODE_RE = re.compile(r"`{1,3}[^`\n]*`{1,3}")


def mask_code(text: str) -> str:
    """Same-length copy with fenced blocks and inline code spans blanked."""
    text = text or ""
    chars = list(text)
    n = len(chars)
    pos = 0
    spans, open_at, open_marker = [], None, None
    for ln in text.split("\n"):
        m = _FENCE_LINE_RE.match(ln)
        if m:
            marker = m.group("ch")
            if open_at is None:
                # An opener may carry an info string; a closer may not.
                open_at, open_marker = pos, marker
            elif marker[0] == open_marker[0] and len(marker) >= len(open_marker) \
                    and not m.group("info").strip():
                # A span that swallows a tier <summary> marker is a MIS-PAIRING,
                # not a code block: build_report emits those markers at top
                # level, never inside a fence. Blanking it hides a whole tier
                # from severity_counts (undercount, and undercounts read as
                # green), so keep the text and let the section extractor see it.
                if not _TIER_SUMMARY_RE.search(text[open_at:pos + len(ln)]):
                    spans.append((open_at, pos + len(ln)))
                open_at, open_marker = None, None
        pos += len(ln) + 1
    # An unterminated opener stays ordinary text rather than swallowing the
    # rest of the body.
    for a, b in spans:
        for i in range(a, min(b, n)):
            if chars[i] != "\n":
                chars[i] = " "
    masked = "".join(chars)
    chars = list(masked)
    for m in _INLINE_CODE_RE.finditer(masked):
        for i in range(m.start(), m.end()):
            if chars[i] != "\n":
                chars[i] = " "
    return "".join(chars)


# --- sections --------------------------------------------------------------
_CLAUDE_SUMMARY = "T1 · Claude static review"
_CODEX_SUMMARY = "T1 · Codex cross-check"
# Section boundaries are the tier <summary> markers, not </details>: matching a
# close tag ends the section at the first one the review MENTIONS, which on
# careerbot-ai#305 truncated the Claude section to 2 of its 8 findings.
_TIER_SUMMARY_RE = re.compile(r"<summary><b>T\d+[ \t]*·", re.I)


def _extract_details(masked: str, summary: str):
    """(start, end) offsets of one tier section, or None.

    Offsets rather than a slice: masking is length-preserving, so the same
    bounds index the RAW body too. Structure is read from the masked copy;
    file references are read from the raw one, because they live inside inline
    code spans that masking necessarily blanks.
    """
    i = masked.find(summary)
    if i < 0:
        return None
    start = masked.find("</summary>", i)
    if start < 0:
        return None
    start += len("</summary>")
    nxt = _TIER_SUMMARY_RE.search(masked, start)
    return start, (nxt.start() if nxt else len(masked))


# --- tags ------------------------------------------------------------------
# Findings are located by SCANNING FOR THE TAG and then validating the short
# prefix before it on its own line -- not with one line-anchored regex.
# Expressing the allowed prefixes as nested optional quantifiers (bullet?
# number? heading? emphasis? whitespace between each?) makes the engine try
# every way of splitting a line among them: O(line**4) on prose that does not
# match, and a 33KB review body then never finishes parsing.
_TAG_RE = re.compile(r"\[[ \t]*(P[0-3])[ \t]*\]", re.I)
# Blockquote marks, a list bullet or number, a heading marker, an ordinal,
# emphasis -- the habits both models actually emit ("- [P1]", "3) [P1]",
# "### [P1]", "### 1. [P1]", "**[P1]**"). Only ever run on the prefix, which is
# a handful of characters.
_PREFIX_RE = re.compile(
    r"^[ \t>|]*(?:[-*+]|\d+[.)]|#{1,6})?[ \t]*(?:\d+[.)])?[ \t]*[*_~]{0,3}[ \t]*$")
# Boundaries exclude letters and digits but NOT underscore: `\b` treats `_` as
# a word character, so "__Findings ... MISSED__" -- underscore emphasis, an
# ordinary markdown form -- had no boundary after MISSED and did not match.
_MISSED_RE = re.compile(r"(?<![A-Za-z0-9])MISSED(?![A-Za-z0-9])", re.I)
# Codex writes the disposition BEFORE the tag as often as after it -- the
# prompt itself asks for "MISSED [sev]". The generic prefix rule rejects that
# (it sees a word and calls the line prose), so a finding written exactly the
# way the prompt asks for counted zero.
_CODEX_PREFIX_RE = re.compile(
    r"^[ \t>|]*(?:[-*+]|\d+[.)]|#{1,6})?[ \t]*(?:\d+[.)])?[ \t]*[*_~]{0,3}[ \t]*"
    r"(?:MISSED[ \t]*:?[ \t]*[*_~]{0,3}[ \t]*)?$", re.I)


def _tags(text: str, prefix_re=None, raw: str = None):
    """[(severity, tag_pos, line_start, line_end, is_heading)] for structural
    tags only.

    A [P0] quoted mid-sentence has prose before it on its line, fails the
    prefix check, and is not a finding.

    `raw` is the UNMASKED text at the same offsets, used only for the table-row
    location check below. Masking is length-preserving, so the same bounds
    index both.
    """
    text = text or ""
    src = raw if raw is not None else text
    out = []
    for m in _TAG_RE.finditer(text):
        a = text.rfind("\n", 0, m.start()) + 1
        b = text.find("\n", m.start())
        b = len(text) if b < 0 else b
        prefix = text[a:m.start()]
        if "|" in prefix and not _LINE_REF_RE.search(src[a:b]):
            # A table row is a finding only if it carries a location; without
            # this a summary table -- "| [P0] | 0 |" -- counts as findings.
            # Checked against RAW: locations are routinely written as inline
            # code (`src/x.py:10`), which the masked copy has blanked, so
            # checking the masked line dropped real table findings entirely --
            # an undercount, the false-green direction this gate exists to stop.
            continue
        if (prefix_re or _PREFIX_RE).match(prefix):
            out.append((m.group(1).upper(), m.start(), a, b,
                        prefix.lstrip(" \t>").startswith("#")))
    return out


# --- identity --------------------------------------------------------------
# Scanned forward from ":<line>" then backwards over a BOUNDED window for the
# filename. A greedy path class followed by a literal dot backtracks badly on
# prose, and review bodies are mostly prose.
_LINE_REF_RE = re.compile(r":(\d+)\b")
_NAME_TAIL_RE = re.compile(r"([A-Za-z0-9_-]+\.[A-Za-z]{1,5})\Z")


def _first_file_ref(chunk: str):
    """(basename, line) of the first `file.ext:123` in `chunk`, or None."""
    for m in _LINE_REF_RE.finditer(chunk):
        nm = _NAME_TAIL_RE.search(chunk[max(0, m.start() - 120):m.start()])
        if nm:
            return nm.group(1), m.group(1)
    return None


def _is_section_header(line: str) -> bool:
    """Does this line open a section, rather than being prose or a finding?

    Only a HEADER may change MISSED scope. Letting any tagless line do it means
    a sentence of prose between the header and its bullets closes the scope and
    zeroes them; letting only `#` do it means a bold or trailing-colon header
    never opens one. Both are undercounts, and undercounts read as green.
    """
    s = (line or "").strip()
    if not s:
        return False                      # blank lines separate, they do not close
    if s.lstrip(" \t>").startswith("#"):
        return True                       # ### Findings we MISSED
    if (s.startswith("**") and s.endswith("**")) or \
       (s.startswith("__") and s.endswith("__")):
        return True                       # **Findings the first pass MISSED**
    return s.strip("*_~ ").endswith(":")  # Findings missed:


def severity_counts(text: str) -> dict:
    """Count [P0]..[P3] findings in a review body.

    Each section is counted under its own rule. Claude's section is the finding
    list; Codex contributes only its MISSED entries, because CONFIRM/REFUTE/
    REGRADE are dispositions on findings Claude already reported -- counting
    them would double-count agreement and leave the cross-check able only to
    add, never subtract. REFUTE is reported, not subtracted: one model's
    disagreement is not authority to clear a finding, and the waiver label is
    the auditable way to ship with one open.

    Within Claude's section every structural tag is counted and then
    de-duplicated on finding identity. The previous rule -- headings if any
    exist, else bullets -- was all-or-nothing: ONE heading anywhere made every
    bullet-formatted finding uncountable, and the undercount direction is
    green. It was not a safe assumption either, since CLAUDE_PROMPT never asks
    for headings and claude_review concatenates one model output per batch into
    this single section.
    """
    counts = {"P0": 0, "P1": 0, "P2": 0, "P3": 0}
    raw = text or ""
    masked = mask_code(raw)
    claude_at = _extract_details(masked, _CLAUDE_SUMMARY)
    codex_at = _extract_details(masked, _CODEX_SUMMARY)

    # Neither marker => a hand-written body, a SCOPE GUARD notice, or a future
    # report shape: count the whole thing rather than silently zero. If only
    # the Codex marker is present, the primary must EXCLUDE it or its lines get
    # counted once as generic tags and again as MISSED entries.
    # A marker that is in the RAW body but gone from the masked copy is a
    # masking failure, not an absent section -- build_report always emits both.
    # Silently contributing 0 for the lost tier is the false-green this gate
    # exists to close, so fall back to counting the whole body: over-counting
    # is the safe direction.
    lost = (codex_at is None and _CODEX_SUMMARY in raw) or \
           (claude_at is None and _CLAUDE_SUMMARY in raw)
    if lost:
        lo, hi = 0, len(masked)
    elif claude_at is not None:
        lo, hi = claude_at
    elif codex_at is not None:
        lo, hi = 0, masked.find(_CODEX_SUMMARY)
    else:
        lo, hi = 0, len(masked)
    primary, primary_raw = masked[lo:hi], raw[lo:hi]

    hits = _tags(primary, raw=primary_raw)
    seen = set()
    for i, (sev, pos, _a, _b, is_heading) in enumerate(hits):
        end = hits[i + 1][1] if i + 1 < len(hits) else len(primary)
        # A finding's text runs to the next tag, so a heading picks up the
        # `file.py:123` on the line below it and a fix-list bullet picks up its
        # inline one. Read from the RAW slice: those references are usually
        # written as inline code, which the masked copy has blanked. Paths
        # differ between the two forms (relative vs absolute); the target does
        # not, so identity is (basename, line).
        key = _first_file_ref(primary_raw[pos:end])
        # Only a BULLET can be a restatement. The duplication mechanism is a
        # fix list recapping findings already stated as headings, so a bullet
        # may merge into a heading -- but two headings are two findings even
        # when they point at the same line, and merging them undercounts
        # toward green. A finding with no file reference is never merged.
        if key is not None and not is_heading and (sev, key) in seen:
            continue
        if key is not None and is_heading:
            seen.add((sev, key))
        counts[sev] += 1

    if codex_at is not None:
        clo, chi = codex_at
        codex_sec = masked[clo:chi]
        # MISSED may qualify the tag's own line OR head a subsection of them:
        # "### Findings the first pass MISSED" followed by bullets is the
        # natural rendering of a list, and requiring the word on every line
        # counted all of them as zero. Headings are tracked by walking the
        # section, because a scoping heading carries no tag of its own and so
        # never appears in _tags().
        tagged = {a: sev for sev, _pos, a, _b, _h in
                  _tags(codex_sec, _CODEX_PREFIX_RE, raw=raw[clo:chi])}
        missed_scope = False
        offset = 0
        for line in codex_sec.split("\n"):
            if offset in tagged:
                if missed_scope or _MISSED_RE.search(line):
                    counts[tagged[offset]] += 1
                # A tagged line is a FINDING first. `_is_section_header` also
                # admits bold and trailing-colon shapes, and an ordinary bullet
                # title ending in `:` is one of them -- letting that close the
                # scope zeroes every finding under the heading. So a tagged line
                # may only OPEN scope; only a genuine `#` heading may close it.
                if line.lstrip(" \t>").startswith("#"):
                    missed_scope = bool(_MISSED_RE.search(line))
                elif _is_section_header(line) and _MISSED_RE.search(line):
                    missed_scope = True
            # The untagged branch needs the same asymmetry as the tagged one
            # above. `_is_section_header` admits any line ending in `:`, and
            # Codex's own section literally contains "Full review comments:"
            # between the MISSED heading and its bullets -- that prose closed
            # the scope and zeroed every finding under it. Only a `#` heading
            # may close; any header-shaped line carrying MISSED may open.
            elif line.lstrip(" \t>").startswith("#"):
                missed_scope = bool(_MISSED_RE.search(line))
            elif _is_section_header(line) and _MISSED_RE.search(line):
                missed_scope = True
            offset += len(line) + 1
    return counts


def blocking_findings(text: str):
    """(blocking_count, counts, verdicts) for one review body.

    Verdicts are reported but NOT enforced: they are free text from a model, and
    one stray "BLOCK" inside an explanation should not fail a build.
    """
    counts = severity_counts(text)
    verdicts = sorted(set(v.upper() for v in _VERDICT_RE.findall(text or "")))
    return sum(counts[s] for s in BLOCKING_SEVERITIES), counts, verdicts


def _fmt(counts, severities):
    """'2 P0, 8 P1' -- only the severities actually present."""
    return ", ".join(f"{counts[s]} {s}" for s in severities if counts[s])


def has_waiver(meta) -> bool:
    return any((lb or {}).get("name") == WAIVER_LABEL for lb in (meta.get("labels") or []))


def existing_review_body(repo, pr):
    """Body of the most recent ai-review comment, or None.

    Selected with MARKER_RE -- the same matcher existing_review_sha uses. A
    substring test on "<!-- ai-review:" also matches a HUMAN comment that
    merely QUOTES the marker, which is routine when discussing this reviewer;
    that comment then parses to zero findings and greens the check.

    Raises on a fetch failure rather than returning None. out() swallows a
    non-zero exit and returns "", so a transient `gh api` error was
    indistinguishable from "no review exists": the skip path counted zero and
    went green with the red review still sitting on the PR. main() turns the
    exception into a red check, which is the safe direction.
    """
    # run(), not out(): out() swallows a non-zero exit and returns whatever
    # stdout it got, so a --paginate walk that dies partway yields page 1 only.
    # If the newest review comment is on page 2 the guard never fires, nothing
    # matches MARKER_RE, and the skip path counts zero.
    r = run(["gh", "api", f"repos/{repo}/issues/{pr}/comments", "--paginate",
             "-q", ".[] | {body:.body}"], timeout=120)
    if r.returncode != 0:
        raise RuntimeError(
            f"could not read comments for #{pr} (gh exit {r.returncode}); refusing to "
            f"treat that as 'no findings' -- the skip path would go green")
    j = r.stdout or ""
    if not j.strip():
        # This function only runs after existing_review_sha already matched a
        # marker comment on this PR, so at least one comment provably exists.
        # An empty result here is never a legitimate "no comments" -- it is
        # always "could not look", and the untrustworthy answer must not read
        # as clean.
        raise RuntimeError(
            f"comment fetch for #{pr} returned nothing, but a review comment is known "
            f"to exist; refusing to treat that as 'no findings'")
    last = None
    for line in j.splitlines():
        try:
            body = json.loads(line).get("body") or ""
        except Exception:
            continue
        if MARKER_RE.search(body):
            last = body
    return last


def review_one(repo, pr, cfg, dynamic, live, dry_run, force):
    meta = pr_meta(repo, pr)
    base, head = meta["baseRefOid"], meta["headRefOid"]
    run(["git", "fetch", "origin", base, f"refs/pull/{pr}/head"], timeout=300)

    _, reviewed_sha = existing_review_sha(repo, pr)
    # --live always re-runs (it adds a tier); otherwise skip already-reviewed heads.
    if reviewed_sha and head.startswith(reviewed_sha) and not force and not live:
        # RE-COUNT THE EXISTING REVIEW. Returning 0 here would let a re-run
        # turn a red check green with the findings untouched -- push nothing,
        # re-run, merge. The verdict has to survive a re-run, so the count
        # comes from the comment that is already on the PR.
        prior = existing_review_body(repo, pr)
        if prior is None:
            # existing_review_sha just matched a marker comment on this PR, so
            # None here means the two matchers disagree -- an inconsistency, not
            # a clean PR. `or ""` counted zero and turned the skip path green,
            # re-opening the fail-open the rest of this function closes.
            raise RuntimeError(
                f"#{pr}: existing_review_sha matched a review comment but "
                f"existing_review_body found none; refusing to count zero")
        if SCOPE_GUARD_MARKER in prior:
            # The prior run rejected this PR UNREAD. There is no verdict to carry
            # forward -- counting its zero [Pn] tags scored 0 and turned the
            # second run green on a PR no model ever read. Re-reviewing does not
            # help either: the diff is still the same size. Split it, or waive.
            # The waiver is consulted FIRST, as it is on every other blocking
            # path here; a refusal with no way through gets bypassed by an admin
            # merge, which leaves no record at all.
            if has_waiver(meta):
                print(f"::warning::#{pr} was too large to review and ships UNREVIEWED, "
                      f"waived via `{WAIVER_LABEL}`.")
                return 0
            print(f"::error::#{pr} was not reviewed at all (scope guard, {head[:8]}), so its "
                  f"zero findings mean 'nothing ran', not 'nothing wrong'. Split it into "
                  f"focused PRs, or apply `{WAIVER_LABEL}` to ship it unreviewed.")
            return 1
        if TIER_FAILURE_MARKER in prior:
            # A failed tier left no verdict to carry forward either -- but unlike
            # the scope guard, re-reviewing CAN succeed once the tier is healthy.
            # Returning 1 here made that unreachable: the skip path is bypassed
            # only by --force/--live and the workflow passes neither, so every
            # re-run replayed the failure and the waiver was never consulted.
            # Fall through to a real review, which is what makes /ai-review a
            # usable retry.
            print(f"#{pr}: the review at {head[:8]} recorded a FAILED tier — re-reviewing "
                  f"rather than carrying its zero findings forward")
        else:
            n_prior, counts_prior, _ = blocking_findings(prior)
            desc = _fmt(counts_prior, BLOCKING_SEVERITIES)
            print(f"#{pr}: already reviewed at {head[:8]} — skip"
                  + (f" (carrying {desc} from the existing review)" if n_prior else ""))
            if n_prior and has_waiver(meta):
                print(f"::warning::#{pr} still has {desc} open, waived via `{WAIVER_LABEL}`.")
                return 0
            if n_prior:
                print(f"::error::#{pr} still has {desc} from the review at {head[:8]}. "
                      f"Re-running does not clear them; push a fix, downgrade them with "
                      f"justification, or apply `{WAIVER_LABEL}`.")
            return n_prior

    ok, reason, stats = scope_guard(base, head)
    if not ok:
        body = (f"## 🤖 AI Code Review — SCOPE GUARD\n\nThis PR is too large for a meaningful "
                f"single review ({reason}); stats {stats}. **Split into focused, single-concern "
                f"PRs** (or rebase onto the current base). Re-run `/ai-review` on the splits.\n\n"
                f"<sub>{MARKER.format(sha=head)}</sub>\n<sub>{SCOPE_GUARD_MARKER}</sub>")
        print(f"#{pr}: SCOPE-GUARD reject ({reason})")
        if not dry_run: upsert_comment(repo, pr, body)
        if has_waiver(meta):
            print(f"::warning::#{pr} was too large to review ({reason}) and ships unreviewed, "
                  f"waived via `{WAIVER_LABEL}`.")
            return 0
        # Nothing was reviewed, so a green check here would assert "reviewed and
        # nothing blocking is open" about a PR no model ever read. Unlike the
        # batch-cap case this IS clearable: split the PR, or waive it.
        print(f"::error::#{pr} was not reviewed at all ({reason}). Split it into focused "
              f"PRs, or apply `{WAIVER_LABEL}` to ship it unreviewed.")
        return 1

    context = pr_context(repo, pr)
    claude, claude_ok = claude_pass(base, head, context)
    codex = codex_pass(base, head, claude, context)
    dyn = run_dynamic(cfg, base, head) if dynamic else None
    live_res = run_live_llm(cfg) if live else None
    body = build_report(head, stats, claude, codex, dyn, live_res)
    if not claude_ok:
        # Stamped so a re-run at this head cannot read the failure as "clean":
        # a failure body carries zero [Pn] tags, so the skip path would count 0.
        body += f"\n<sub>{TIER_FAILURE_MARKER}</sub>"
    if dry_run:
        # Print instead of posting, then fall through: returning here skipped
        # the `not claude_ok` fail-closed branch, so a dry run over a PR whose
        # primary tier died exited 0 -- the exact "did not finish, therefore
        # found nothing" reading the posted path refuses.
        print(body)
    else:
        upsert_comment(repo, pr, body)
        tiers = "T1" + ("+T2" if dynamic else "") + ("+T3-live" if live else "")
        print(f"#{pr}: reviewed + posted ({head[:8]}) [{tiers}]")

    if not claude_ok:
        # Fail closed: a green required check must never mean "the primary
        # reviewer failed and therefore found nothing".
        #
        # The waiver is consulted FIRST, as it is on every other blocking path
        # in this function (scope-guard skip, scope-guard fresh, skip-with-
        # findings, fresh findings). Without it a dead `claude` CLI was
        # unwaivable: the TIER_FAILURE_MARKER skip branch above falls through to
        # exactly this line -- so applying the label changed nothing, and the
        # only remaining exit was the admin merge WAIVER_LABEL exists to make
        # unnecessary. "Nothing was reviewed" is the same state the scope guard
        # reaches, and that path has always been waivable; the two disagreeing
        # was the inconsistency, not the waiver.
        if has_waiver(meta):
            print(f"::warning::#{pr} ships with the primary review tier DEAD, waived via "
                  f"`{WAIVER_LABEL}`. NOTHING was reviewed -- this is the absence of a "
                  f"verdict, not a clean one. The label records who accepted that.")
            return 0
        print(f"::error::#{pr}: the Claude review tier did not run. The check "
              f"fails closed -- this is a harness failure, not a clean review. "
              f"Re-run with /ai-review once the tier is healthy, or apply "
              f"`{WAIVER_LABEL}` to ship it unreviewed.")
        return 1

    n_block, counts, verdicts = blocking_findings(body)
    print(f"#{pr}: findings " + " ".join(f"{k}:{v}" for k, v in counts.items())
          + (f"  verdict={'/'.join(verdicts)}" if verdicts else ""))
    for sev in ADVISORY_SEVERITIES:
        if counts[sev]:
            print(f"::warning::#{pr} has {counts[sev]} {sev} finding(s) — advisory, and do "
                  f"not block this PR. Fix them here if they are cheap, or file them as "
                  f"issues before merging; they are listed in the review comment.")
    if n_block and has_waiver(meta):
        print(f"::warning::#{pr} ships with {_fmt(counts, BLOCKING_SEVERITIES)} open, waived "
              f"via `{WAIVER_LABEL}`. The findings stand in the review comment.")
        return 0
    if n_block:
        print(f"::error::#{pr} has {_fmt(counts, BLOCKING_SEVERITIES)} finding(s). "
              f"P0/P1 block the merge: fix them, downgrade them with justification in the "
              f"PR, or apply `{WAIVER_LABEL}` to ship with them open. Re-run with /ai-review.")
    return n_block


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--pr", type=int); g.add_argument("--all", action="store_true")
    ap.add_argument("--dynamic", action="store_true", help="run T2 (tests + live-server boot)")
    ap.add_argument("--live", action="store_true", help="run T3 real-LLM tier (on-demand; costs tokens)")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true", help="re-review even if head unchanged")
    a = ap.parse_args()
    cfg = load_config()
    prs = open_prs(a.repo) if a.all else [a.pr]
    print(f"Reviewing {len(prs)} PR(s): {prs}  [stack={cfg.get('stack')} dynamic={a.dynamic} live={a.live}]")
    errors = 0
    blocked = {}
    for pr in prs:
        try:
            n = review_one(a.repo, pr, cfg, a.dynamic, a.live, a.dry_run, a.force)
            if n:
                blocked[pr] = n
        except Exception as e:  # one bad PR must not stop the sweep
            errors += 1
            traceback.print_exc()
            print(f"#{pr}: ERROR {type(e).__name__}: {e}")
    # Fail the check when any review errored. A crashed review must NEVER report
    # success (the silent-green that hid the missing-codex crash on #211): the
    # green check would otherwise imply "reviewed + clean" when nothing ran.
    # Recoverable degradations (e.g. codex missing) are handled in-tier above and
    # do NOT raise, so they don't trip this.
    if errors:
        note = f"{errors} PR review(s) errored. A crashed review is not a clean one."
        if a.all:
            # The manual --all sweep gates nothing (each PR's own pull_request
            # run is the required check), so a failure on some OTHER PR is
            # reported without misrepresenting the current PR's required gate.
            print(f"::warning::{note} Each PR's own ai-review check is what gates its merge.")
        else:
            print(f"::error::{note} Failing the check (no silent green).")
            return 1
    if blocked:
        detail = ", ".join(f"#{pr} ({n} blocking)" for pr, n in sorted(blocked.items()))
        if a.all:
            # A manual --all sweep reviews every open PR, but gates nothing:
            # each PR's own pull_request run is the required check.
            print(f"::warning::open PRs with blocking findings: {detail}. Each PR's own "
                  f"ai-review check is what gates its merge.")
            return 0
        print(f"::error::P0/P1 findings block the check: {detail}. A green ai-review must "
              f"mean 'reviewed and nothing blocking is open', not 'the reviewer ran'.")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
