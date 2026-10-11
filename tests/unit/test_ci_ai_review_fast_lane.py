"""ai-review T2 fast lane (CI-speed roadmap step 6).

T2 on web is npm install + next build + npm run lint: 13.6 of 16.9 min on #195,
a PR that Lint and Build itself put in the fast lane. ai-review now asks the
SAME classifier (the base branch's scripts/ci/fast_lane.py) and skips T2 only
on an explicit lane=fast for a pull_request run. Everything else -- no output,
lane=full, a comment or dispatch run -- still runs T2.
"""
import importlib.util
import os
import subprocess
import sys
from pathlib import Path

import pytest
import yaml

ROOT = Path(__file__).resolve().parents[2]
AI_REVIEW = ROOT / ".github" / "workflows" / "ai-pr-review.yml"
FRONTEND = ROOT / ".github" / "workflows" / "frontend-ci.yml"
SCRIPT = ROOT / "scripts" / "ai_review" / "ai_pr_review.py"


def _job(path, key):
    return yaml.safe_load(path.read_text())["jobs"][key]


def _step(job, name):
    for s in job["steps"]:
        if s.get("name") == name:
            return s
    raise AssertionError(f"no step {name!r}")


@pytest.fixture(scope="module")
def review_job():
    return _job(AI_REVIEW, "ai-review")


def test_ai_review_asks_the_same_classifier_the_same_way_as_lint_and_build(review_job):
    mine = _step(review_job, "Classify changed paths (fast lane)")
    lint_build = next(j for j in yaml.safe_load(FRONTEND.read_text())["jobs"].values()
                      if j.get("name") == "Lint and Build")
    theirs = _step(lint_build, "Classify changed paths (fast lane)")
    # One rule for "non-app": identical command, trigger and failure mode.
    assert mine["run"] == theirs["run"]
    assert mine["if"] == theirs["if"] == "github.event_name == 'pull_request'"
    assert mine["continue-on-error"] is True
    assert mine["env"] == theirs["env"]
    assert "HEAD^1:scripts/ci/fast_lane.py" in mine["run"], "the BASE copy decides"
    # The classifier runs before the token-bearing review step; nothing secret here.
    assert "secrets." not in yaml.safe_dump(mine) and "GITHUB_TOKEN" not in yaml.safe_dump(mine)


def test_the_lane_is_decided_before_the_target_and_the_review(review_job):
    names = [s.get("name") for s in review_job["steps"]]
    assert (names.index("Classify changed paths (fast lane)")
            < names.index("Decide target")
            < names.index("Run review (T1 static + T2 build/lint)"))


def _decide(review_job, tmp_path, event, lane, changed=""):
    """Execute the SHIPPED Decide target script with its ${{ }} filled in."""
    step = _step(review_job, "Decide target")
    run = step["run"]
    # The step's literal env (e.g. T2_OWN_INPUTS) goes in as GitHub would set it.
    static_env = {k: str(v) for k, v in (step.get("env") or {}).items() if "${{" not in str(v)}
    assert "T2_OWN_INPUTS" in static_env
    for expr, value in {"${{ github.event_name }}": event,
                        "${{ github.event.pull_request.number }}": "12",
                        "${{ github.event.issue.number }}": "12",
                        "${{ github.event.inputs.pr }}": "12"}.items():
        run = run.replace(expr, value)
    assert "${{" not in run, f"unfilled expression in {run!r}"
    out = tmp_path / f"out-{event}-{lane}-{abs(hash(changed))}"
    env = {**os.environ, **static_env, "LANE": lane, "CHANGED": changed, "GITHUB_OUTPUT": str(out)}
    subprocess.run(["bash", "-e", "-c", run], env=env, check=True, capture_output=True)
    return out.read_text().strip().splitlines()[0]


DOCS = "docs/a.md, tests/unit/test_x.py"


def test_only_an_explicit_fast_lane_on_a_pr_skips_t2(review_job, tmp_path):
    assert _decide(review_job, tmp_path, "pull_request", "fast", DOCS) == "args=--pr 12"
    for lane in ("", "full", "FAST", "fast "):
        assert _decide(review_job, tmp_path, "pull_request", lane) == "args=--pr 12 --dynamic", lane


@pytest.mark.parametrize("changed", [
    "scripts/ai_review/review_config.json",
    "scripts/ai_review/ai_pr_review.py",
    "docs/a.md, scripts/ai_review/ai_pr_review.py, tests/unit/test_x.py",
    "",  # fast lane with no changed list: doubt keeps T2
])
def test_a_pr_changing_t2s_own_config_or_code_still_runs_t2(review_job, tmp_path, changed):
    """Found by the bot on #196: fast_lane.py's allow-list includes T2's own
    inputs, so the one PR that changes T2 would be the one that skips it."""
    assert _decide(review_job, tmp_path, "pull_request", "fast", changed).endswith("--dynamic")


def test_other_harness_files_still_skip(review_job, tmp_path):
    # pr_size_gate.py and RUNNER_SETUP.txt are not T2 inputs.
    changed = "scripts/ai_review/pr_size_gate.py, scripts/ai_review/RUNNER_SETUP.txt"
    assert _decide(review_job, tmp_path, "pull_request", "fast", changed) == "args=--pr 12"


@pytest.mark.parametrize("event", ["issue_comment", "workflow_dispatch"])
def test_comment_and_dispatch_runs_keep_t2(review_job, tmp_path, event):
    # The lane step does not run for them, but even a stray value must not skip.
    assert _decide(review_job, tmp_path, event, "fast", DOCS).endswith("--dynamic")


def test_the_report_says_why_t2_was_skipped(review_job, monkeypatch):
    env = _step(review_job, "Run review (T1 static + T2 build/lint)")["env"]
    # Keyed on the DECISION, not the lane: a fast-lane PR that changed T2's own
    # inputs runs T2 and must not be reported as skipped.
    assert "steps.t.outputs.t2_skipped == 'true'" in env["AI_REVIEW_T2_SKIP_REASON"]

    spec = importlib.util.spec_from_file_location("ai_pr_review_fast_lane", SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["ai_pr_review_fast_lane"] = mod
    spec.loader.exec_module(mod)
    monkeypatch.delenv("AI_REVIEW_T2_SKIP_REASON", raising=False)
    assert mod.dyn_section(None) == "_dynamic tier skipped (run with --dynamic)_"
    monkeypatch.setenv("AI_REVIEW_T2_SKIP_REASON", "fast lane <!-- x -->")
    text = mod.dyn_section(None)
    assert text.startswith("_dynamic tier skipped: fast lane")
    assert "<!--" not in text
