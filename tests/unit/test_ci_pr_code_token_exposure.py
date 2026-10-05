"""PR code must not get a token that can post as github-actions[bot] (ai#398).

Two paths let the PR's own code (a test, a package.json script, an npm
dependency's install script) post a comment as the review bot and forge a
review:
  * actions/checkout's default persist-credentials: true leaves the job's
    GITHUB_TOKEN in .git/config, readable by every later step;
  * ai_pr_review.py ran the T2/T3 subprocesses with GH_TOKEN in their env.
The workflow test parses the YAML (permissions are resolved per job, called
workflows inherit their caller's); the script tests run the real functions.
"""

import importlib.util
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
    # pr_size_gate.py (the PR's copy) runs with GH_TOKEN = github.token to
    # label/comment; see TRUST in pr-size-gate.yml.
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
        writes, job = jobs[key]
        assert writes and _checkouts(job), key


def test_allow_list_entries_still_exist():
    jobs = _job_writes()
    for key in PERSISTED_TOKEN_OK:
        assert key in jobs, key


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
