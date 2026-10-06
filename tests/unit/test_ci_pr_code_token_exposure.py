"""PR code must not get a token that can post as github-actions[bot] (ai#398).

Three paths let the PR's own code (a test, a package.json script, an npm
dependency's install script) post a comment as the review bot and forge a
review:
  * actions/checkout's default persist-credentials: true leaves the job's
    GITHUB_TOKEN in .git/config, readable by every later step;
  * a later step of a job with a write token (checkout's post step gets it
    as an input) runs after the PR's code, which can rewrite it first;
  * ai_pr_review.py ran the T2/T3 subprocesses with GH_TOKEN in their env.
The workflow test parses the YAML (permissions are resolved per job, called
workflows inherit their caller's); the script tests run the real functions.
"""

import importlib.util
import os
import subprocess
import sys
from pathlib import Path

import pytest
import yaml

ROOT = Path(__file__).resolve().parents[2]
WORKFLOWS = ROOT / ".github" / "workflows"
SCRIPT = ROOT / "scripts" / "ai_review" / "ai_pr_review.py"

# A job here runs a PR-controlled script that is GIVEN the token on purpose,
# so a token in .git/config adds nothing. Each entry needs its reason.
PERSISTED_TOKEN_OK = {
    # Runs no PR code: the gate script is origin/develop2's copy, else the
    # step fails (see TRUST in pr-size-gate.yml and the tests below) -- and
    # its --fetch needs the token.
    ("pr-size-gate.yml", "size"),
}


def _load(path):
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def _writes(perms):
    if perms is None:
        return None
    if isinstance(perms, str):
        return perms == "write-all"
    return any(v == "write" for v in perms.values())


def _job_writes():
    """{(file, job): token can write}. A job without `permissions` takes the
    workflow's; a workflow without any takes the repo default, which is read
    (Settings > Actions > Workflow permissions). A called workflow's jobs get
    the calling job's permissions."""
    wfs = {p.name: _load(p) for p in sorted(WORKFLOWS.glob("*.yml"))}
    called = {}
    for name, wf in wfs.items():
        for job in wf["jobs"].values():
            uses = job.get("uses", "")
            if uses.startswith("./.github/workflows/"):
                w = _writes(job.get("permissions")) or _writes(wf.get("permissions")) or False
                key = uses.rsplit("/", 1)[1]
                called[key] = called.get(key, False) or w
    out = {}
    for name, wf in wfs.items():
        for jid, job in wf["jobs"].items():
            if "steps" not in job:
                continue
            w = _writes(job.get("permissions"))
            if w is None:
                w = _writes(wf.get("permissions"))
            if w is None:
                w = called.get(name, False)
            out[(name, jid)] = (w, job)
    return out


def _checkouts(job):
    return [s for s in job["steps"] if str(s.get("uses", "")).startswith("actions/checkout@")]


def test_every_write_token_job_checks_out_without_persisting_the_token():
    bad = []
    for (name, jid), (writes, job) in _job_writes().items():
        if not writes or (name, jid) in PERSISTED_TOKEN_OK:
            continue
        for step in _checkouts(job):
            if (step.get("with") or {}).get("persist-credentials") is not False:
                bad.append(f"{name}:{jid}")
    assert bad == []


def test_the_review_jobs_are_covered_by_the_check():
    jobs = _job_writes()
    for key in [("ai-pr-review.yml", "ai-review"), ("ai-pr-review.yml", "gate-self-test")]:
        assert _checkouts(jobs[key][1]) and _runs_pr_code(jobs[key][1]), key


# A job that runs PR code AND gets a write token. Each entry needs its reason.
WRITE_TOKEN_WITH_PR_CODE_OK = {
    # Runs the PR's T2 tier, then posts the review with GH_TOKEN; see "Still
    # open" at PR_CODE_SECRET_ENV in the review script.
    ("ai-pr-review.yml", "ai-review"),
    # Its `run:` step runs origin/develop2's copy of the gate, not the PR's
    # or the base's (see the pr-size-gate.yml tests below).
    ("pr-size-gate.yml", "size"),
}


def _runs_pr_code(job):
    """A checkout followed by any `run:` step: the step runs the checked-out
    tree's code, or code the tree's install/test steps planted for it."""
    steps = job["steps"]
    first = next((i for i, s in enumerate(steps)
                  if str(s.get("uses", "")).startswith("actions/checkout@")), None)
    return first is not None and any("run" in s for s in steps[first + 1:])


def test_no_job_that_runs_pr_code_gets_a_write_token():
    """Even without a persisted token, a later step of the same job that holds
    the token (actions/checkout's post step gets it as an input) runs after the
    PR's code, which can rewrite that action or the job's env first (ai#398)."""
    bad = [f"{n}:{j}" for (n, j), (writes, job) in _job_writes().items()
           if writes and _runs_pr_code(job) and (n, j) not in WRITE_TOKEN_WITH_PR_CODE_OK]
    assert bad == []


def test_allow_list_entries_still_exist():
    jobs = _job_writes()
    for key in PERSISTED_TOKEN_OK | WRITE_TOKEN_WITH_PR_CODE_OK:
        assert key in jobs, key


# --------------------------------------------------------------------------
# pr-size-gate.yml: the step that holds a write token runs develop2's gate
# --------------------------------------------------------------------------

def _git(cwd, *args):
    return subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True,
                          text=True).stdout.strip()


def _gate_repo(tmp_path, base_has_gate=True):
    """A base commit (any branch the PR author can push), origin/develop2 on
    top of it, then a PR commit that edits the gate script. Returns (repo,
    base sha). The stub gate prints which copy ran and its argv."""
    repo = tmp_path / "repo"
    gate = repo / "scripts" / "ai_review"
    gate.mkdir(parents=True)
    _git(repo, "init", "-q")
    _git(repo, "config", "user.email", "t@t")
    _git(repo, "config", "user.name", "t")
    (repo / "README").write_text("x\n")
    if base_has_gate:
        (gate / "ai_pr_review.py").write_text('WHO = "base"\n')
        # Like the real gate: it imports ai_pr_review from its own directory.
        (gate / "pr_size_gate.py").write_text(
            'import sys, ai_pr_review; print("GATE=base", ai_pr_review.WHO, *sys.argv[1:])\n')
    _git(repo, "add", "-A")
    _git(repo, "commit", "-qm", "base")
    base = _git(repo, "rev-parse", "HEAD")
    # origin/develop2, the protected branch: the only copy that may run.
    _git(repo, "checkout", "-q", "-b", "d2", base)
    gate.mkdir(parents=True, exist_ok=True)  # checkout drops it if the base has no gate
    (gate / "ai_pr_review.py").write_text('WHO = "develop2"\n')
    (gate / "pr_size_gate.py").write_text(
        'import sys, ai_pr_review; print("GATE=develop2", ai_pr_review.WHO, *sys.argv[1:])\n')
    _git(repo, "add", "-A")
    _git(repo, "commit", "-qm", "develop2")
    _git(repo, "update-ref", "refs/remotes/origin/develop2", "HEAD")
    _git(repo, "checkout", "-q", "-b", "pr", base)
    gate.mkdir(parents=True, exist_ok=True)  # checkout drops it if the base has no gate
    (gate / "ai_pr_review.py").write_text('WHO = "pr"\n')
    (gate / "pr_size_gate.py").write_text('print("GATE=pr")\n')
    _git(repo, "add", "-A")
    _git(repo, "commit", "-qm", "pr edits the gate")
    return repo, base


def _run_gate_step(repo, base, tmp_path):
    job = _load(WORKFLOWS / "pr-size-gate.yml")["jobs"]["size"]
    step = next(s for s in job["steps"] if "pr_size_gate.py" in s.get("run", ""))
    (tmp_path / "runner-temp").mkdir()
    env = {**os.environ, "RUNNER_TEMP": str(tmp_path / "runner-temp"), "BASE_SHA": base,
           "HEAD_SHA": "h" * 40, "REPO": "o/r", "PR": "7", "PUBLISH": ""}
    # GitHub's default `run:` shell.
    return subprocess.run(["bash", "--noprofile", "--norc", "-eo", "pipefail", "-c", step["run"]],
                          cwd=repo, env=env, capture_output=True, text=True)


def test_the_size_gate_runs_develop2s_copy_not_the_bases_or_the_prs(tmp_path):
    """The PR author picks the base: any branch they can push, with their own
    gate on it, then a PR into it. Only the protected branch's copy runs."""
    repo, base = _gate_repo(tmp_path)
    r = _run_gate_step(repo, base, tmp_path)
    assert r.returncode == 0, r.stderr
    # develop2's gate, with develop2's ai_pr_review, measuring the PR's base.
    assert f"GATE=develop2 develop2 --repo o/r --pr 7 --base {base}" in r.stdout
    assert "GATE=base" not in r.stdout and "GATE=pr" not in r.stdout


def test_a_base_without_the_gate_runs_develop2s_copy(tmp_path):
    """master and other branches that predate the gate."""
    repo, base = _gate_repo(tmp_path, base_has_gate=False)
    r = _run_gate_step(repo, base, tmp_path)
    assert r.returncode == 0, r.stderr
    assert "GATE=develop2 develop2 --repo o/r" in r.stdout
    assert "GATE=pr" not in r.stdout


@pytest.mark.parametrize("base_has_gate", [True, False])
def test_a_tag_named_origin_develop2_cannot_stand_in_for_the_branch(tmp_path, base_has_gate):
    """A short `origin/develop2` resolves refs/tags/ before refs/remotes/, and
    anyone who can push can push a tag."""
    repo, base = _gate_repo(tmp_path, base_has_gate=base_has_gate)
    _git(repo, "tag", "origin/develop2", "pr")
    r = _run_gate_step(repo, base, tmp_path)
    assert r.returncode == 0, r.stderr
    assert "GATE=develop2 develop2" in r.stdout
    assert "GATE=pr" not in r.stdout


def test_develop2_without_the_gates_import_fails_closed(tmp_path):
    repo, base = _gate_repo(tmp_path)
    _git(repo, "checkout", "-q", "d2")
    _git(repo, "rm", "-q", "scripts/ai_review/ai_pr_review.py")
    _git(repo, "commit", "-qm", "develop2 without ai_pr_review")
    _git(repo, "update-ref", "refs/remotes/origin/develop2", "HEAD")
    _git(repo, "checkout", "-q", "pr")
    r = _run_gate_step(repo, base, tmp_path)
    assert r.returncode != 0
    assert "GATE=" not in r.stdout


@pytest.mark.parametrize("base_has_gate", [True, False])
def test_no_develop2_fails_closed(tmp_path, base_has_gate):
    repo, base = _gate_repo(tmp_path, base_has_gate=base_has_gate)
    _git(repo, "update-ref", "-d", "refs/remotes/origin/develop2")
    r = _run_gate_step(repo, base, tmp_path)
    assert r.returncode != 0
    assert "GATE=" not in r.stdout


def test_an_empty_base_fails_closed(tmp_path):
    """The gate measures the PR against BASE_SHA. (A base commit missing from
    the checkout is the gate's own --fetch: by SHA, else it fails closed.)"""
    repo, _ = _gate_repo(tmp_path)
    r = _run_gate_step(repo, "", tmp_path)
    assert r.returncode != 0
    assert "GATE=" not in r.stdout


# --------------------------------------------------------------------------
# ai_pr_review.py: the env of every subprocess that runs PR code
# --------------------------------------------------------------------------

# Spelled out, not read from the script: dropping a name there must fail here.
SECRETS = {"GH_TOKEN", "GITHUB_TOKEN", "GH_ENTERPRISE_TOKEN", "GITHUB_ENTERPRISE_TOKEN",
           "ANTHROPIC_API_KEY", "OPENAI_API_KEY", "CODEX_API_KEY"}


@pytest.fixture
def mod(monkeypatch):
    spec = importlib.util.spec_from_file_location("ai_pr_review_token_env", SCRIPT)
    m = importlib.util.module_from_spec(spec)
    sys.modules["ai_pr_review_token_env"] = m
    spec.loader.exec_module(m)
    for k in SECRETS:
        monkeypatch.setenv(k, "sekrit-" + k)
    monkeypatch.setenv("KEEP_ME", "1")
    return m


@pytest.fixture
def calls(mod, monkeypatch):
    seen = []

    def fake(cmd, *a, **k):
        seen.append((cmd, k.get("env")))
        out = ""
        if cmd[:2] == ["git", "diff"]:
            out = "app/foo.py\n"
        elif cmd[:2] == ["bash", "-lc"] and "git ls-files" in cmd[2]:
            out = "tests/unit/test_foo.py\n"
        return subprocess.CompletedProcess(cmd, 0, out, "")
    monkeypatch.setattr(mod.subprocess, "run", fake)
    return seen


def _assert_clean(env):
    assert env is not None, "inherits os.environ, GH_TOKEN included"
    assert not SECRETS & set(env)
    assert env.get("KEEP_ME") == "1" and env.get("PATH")


def test_node_tier_install_build_and_checks_run_without_the_token(mod, tmp_path):
    """Real subprocesses: the 'build' prints whatever GH_TOKEN it can see."""
    cfg = {"stack": "node", "node": {"install": "test -z \"$GH_TOKEN\"",
                                    "build": "echo \"tok=${GH_TOKEN:-none} key=${OPENAI_API_KEY:-none}\"",
                                    "checks": ["test -z \"$GITHUB_TOKEN$ANTHROPIC_API_KEY\""]}}
    res = mod.run_dynamic(cfg, "b", "h")
    assert res["install_ok"] and res["build_ok"]
    assert "tok=none key=none" in "\n".join(res["build_tail"])
    assert res["checks"][0]["ok"], res["checks"]


def test_python_tier_smoke_and_tests_run_without_the_token(mod, calls):
    cfg = {"stack": "python", "import_smoke": "app.main", "changed_prefix": ["app/"],
           "test_glob": "tests/unit/test_*.py"}
    res = mod.dynamic_python(cfg, "b", "h")
    assert res["tests"] == ["tests/unit/test_foo.py"]
    pr_code = [env for cmd, env in calls if "importlib" in " ".join(cmd) or "pytest" in cmd
               or cmd[:2] == ["bash", "-lc"]]  # the config's test_glob goes through a shell
    assert len(pr_code) == 3, calls
    for env in pr_code:
        _assert_clean(env)


def test_server_boot_and_live_tier_run_without_the_token(mod, calls, monkeypatch):
    popen = []

    class P:
        pid = 0
        def __init__(self, cmd, **k): popen.append(k.get("env"))
        def poll(self): return 1
    monkeypatch.setattr(mod.subprocess, "Popen", P)
    monkeypatch.setattr(mod.os, "killpg", lambda *a: None)
    monkeypatch.setattr(mod.os, "getpgid", lambda *a: 0)
    mod.boot_server({"cmd": "true", "health": "http://127.0.0.1:9/health", "boot_wait": 1})
    _assert_clean(popen[0])
    mod.run_live_llm({"live": {"cmd": "true"}})
    _assert_clean(calls[-1][1])


def test_the_scripts_own_gh_calls_keep_the_token(mod, calls):
    """Control: stripping is for PR code only; gh still needs GH_TOKEN."""
    mod.run(["gh", "api", "user"])
    env = calls[-1][1]
    assert env is None  # inherits os.environ, GH_TOKEN included


def test_model_clis_get_no_github_token_but_keep_their_keys(mod, calls):
    """claude/codex run in the PR checkout and may load its project settings
    (hooks, allowed commands): no GitHub token for them, their own keys stay."""
    mod.codex_pass("b", "h", "claude text", "ctx")
    mod.run(["claude", "-p", "review"])
    model = [env for cmd, env in calls if cmd[0] in ("claude", "codex")]
    assert len(model) == 2, calls
    for env in model:
        assert env is not None, "inherits os.environ, GH_TOKEN included"
        assert not {"GH_TOKEN", "GITHUB_TOKEN", "GH_ENTERPRISE_TOKEN",
                    "GITHUB_ENTERPRISE_TOKEN"} & set(env)
        assert env["ANTHROPIC_API_KEY"] == "sekrit-ANTHROPIC_API_KEY"
        assert env.get("KEEP_ME") == "1"


def test_the_fetch_authenticates_through_gh_not_git_config(mod):
    assert mod.GIT_GH_AUTH[-1] == "credential.helper=!gh auth git-credential"
    src = SCRIPT.read_text(encoding="utf-8")
    assert '[*GIT_GH_AUTH, "fetch", "origin", base, f"refs/pull/{pr}/head"]' in src
