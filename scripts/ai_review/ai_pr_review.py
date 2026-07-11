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
so the 30-min sweep only reviews new/changed PRs.

Never merges. Advisory. A human approves.
"""
from __future__ import annotations
import argparse, json, os, re, signal, subprocess, sys, tempfile, time, urllib.request
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
                           "--json", "baseRefOid,headRefOid,title,author"]))


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
    return run(["claude", "-p", CLAUDE_PROMPT.format(base=base, head=head)],
               timeout=900).stdout or "_no output_"


def codex_pass(base, head, claude):
    prompt = (f"ROLE: OUTSIDER senior reviewer. Cross-check the review below AND find what it "
              f"missed. Inspect only diff {base}...{head}. file:line evidence required. For each "
              f"finding CONFIRM|REFUTE|REGRADE; then MISSED [sev]+file:line; OVERALL verdict.\n\n"
              f"=== REVIEW TO CROSS-CHECK ===\n{claude}\n")
    return run(["codex", "review", "-"], stdin=prompt, timeout=900).stdout or "_no output_"


# ── live-server boot + /health probe (python web apps) ───────────────────────
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
    return f"""## 🤖 AI Code Review — Claude + Codex (advisory)

**Scope:** {stats['files']} files, +{stats['added']} lines, {stats['commits']} commits, {stats['authors']} author(s). Advisory — a human still approves/merges. Findings **confirmed by both** models are highest-confidence.

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


def review_one(repo, pr, cfg, dynamic, live, dry_run, force):
    meta = pr_meta(repo, pr)
    base, head = meta["baseRefOid"], meta["headRefOid"]
    run(["git", "fetch", "origin", base, f"refs/pull/{pr}/head"], timeout=300)

    _, reviewed_sha = existing_review_sha(repo, pr)
    # --live always re-runs (it adds a tier); otherwise skip already-reviewed heads.
    if reviewed_sha and head.startswith(reviewed_sha) and not force and not live:
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
    dyn = run_dynamic(cfg, base, head) if dynamic else None
    live_res = run_live_llm(cfg) if live else None
    body = build_report(head, stats, claude, codex, dyn, live_res)
    if dry_run:
        print(body); return
    upsert_comment(repo, pr, body)
    tiers = "T1" + ("+T2" if dynamic else "") + ("+T3-live" if live else "")
    print(f"#{pr}: reviewed + posted ({head[:8]}) [{tiers}]")


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
    for pr in prs:
        try:
            review_one(a.repo, pr, cfg, a.dynamic, a.live, a.dry_run, a.force)
        except Exception as e:  # one bad PR must not stop the sweep
            print(f"#{pr}: ERROR {type(e).__name__}: {e}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
