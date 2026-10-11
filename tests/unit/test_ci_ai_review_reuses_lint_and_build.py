"""ai-review reuses Lint and Build instead of building twice (CI-speed roadmap
step 9).

On web, T2 (npm install + next build + full npm run lint) was 13.6 of 16.9 min
of the ai-review job. frontend-ci's REQUIRED "Lint and Build" runs on the same
commits: the new-error ESLint/tsc gates (blocking on every non-draft commit,
advisory on drafts), and npm ci + next build on non-draft commits outside its
fast lane (a pull_request run of ai-review never reviews a draft; a
comment/dispatch review of a draft says the build was deferred; a fast-lane
commit changes nothing next build compiles). The
full-repo lint is deliberately not repeated. ai-review no longer passes
--dynamic; its report points at that check. That is safe only while Lint and
Build keeps those exact conditions, so they are pinned here.
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


def _wf(path):
    return yaml.safe_load(path.read_text())


def _step(job, name):
    return next(s for s in job["steps"] if s.get("name") == name)


@pytest.fixture(scope="module")
def review_job():
    return _wf(AI_REVIEW)["jobs"]["ai-review"]


@pytest.mark.parametrize("event,expected", [
    ("pull_request", "args=--pr 12"),
    ("issue_comment", "args=--pr 12"),
    ("workflow_dispatch", "args=--pr 12"),
    ("schedule", "args=--all"),
])
def test_no_event_runs_t2(review_job, tmp_path, event, expected):
    run = _step(review_job, "Decide target")["run"]
    for expr, value in {"${{ github.event_name }}": event,
                        "${{ github.event.pull_request.number }}": "12",
                        "${{ github.event.issue.number }}": "12",
                        "${{ github.event.inputs.pr }}": "12"}.items():
        run = run.replace(expr, value)
    assert "${{" not in run
    out = tmp_path / "out"
    subprocess.run(["bash", "-e", "-c", run], env={**os.environ, "GITHUB_OUTPUT": str(out)},
                   check=True, capture_output=True)
    assert out.read_text().strip() == expected
    review = _step(review_job, "Run review (T1 static + T2 build/lint)")
    assert "--dynamic" not in review["run"], "--dynamic must not be hardcoded on the run step"


def test_lint_and_build_still_does_what_t2_did_on_the_same_events():
    wf = _wf(FRONTEND)
    on = wf.get("on") or wf.get(True)  # PyYAML reads a bare `on:` as True
    pr = on["pull_request"]
    review_on = (_wf(AI_REVIEW).get("on") or _wf(AI_REVIEW).get(True))["pull_request"]
    # labeled / unlabeled do not change the commit: Lint and Build already ran
    # on that head for the opened / synchronize event that produced it.
    commit_events = set(review_on["types"]) - {"labeled", "unlabeled"}
    assert commit_events <= set(pr["types"]), (
        "ai-review reviews a commit-changing PR event Lint and Build does not run on")
    assert pr.get("branches") == ["**"] and "paths" not in pr and "paths-ignore" not in pr

    job = next(j for j in wf["jobs"].values() if j.get("name") == "Lint and Build")
    step = {s.get("name"): s for s in job["steps"]}

    # npm ci + next build: every non-draft commit outside the fast lane, blocking.
    build = step["Build"]
    assert "npm run build" in build["run"] and not build.get("continue-on-error")
    assert build["if"] == ("(github.event_name != 'pull_request' || "
                           "github.event.pull_request.draft == false) && "
                           "steps.lane.outputs.lane != 'fast'")
    install = step["Install dependencies"]
    assert "npm ci" in install["run"] and install["if"] == "steps.lane.outputs.lane != 'fast'"

    # New-error ESLint / tsc gates: every PR commit; blocking on non-drafts,
    # advisory on drafts.
    for name in ("ESLint (fail on new errors in changed lines)",
                 "TypeScript (fail on new errors in changed files)",
                 "Fail on new ESLint / TypeScript errors"):
        assert step[name]["if"] == "github.event_name == 'pull_request'", name
    final = step["Fail on new ESLint / TypeScript errors"]
    assert not final.get("continue-on-error"), "the new-error gate must still block"


def test_pull_request_runs_do_not_review_drafts():
    """Lint and Build defers the build on drafts. A pull_request run of
    ai-review never reviews a draft: review_one reads the PR's LIVE draft state
    and returns before any model call (behaviour covered in
    test_ci_draft_policy.py). Comment/dispatch runs CAN review a draft; the
    report text covers that case (test_the_report_points_at_lint_and_build)."""
    src = SCRIPT.read_text()
    body = src[src.index("def review_one("):]
    body = body[:body.index("\ndef ")]
    i = body.index('if state["isDraft"]:')
    assert "return 0" in body[i:i + 600], "a live draft must end the review early"
    assert i < body.index("claude_pass("), "the draft exit must come before any model call"


def test_the_report_points_at_lint_and_build(review_job, monkeypatch):
    step = _step(review_job, "Run review (T1 static + T2 build/lint)")
    reason = step["env"]["AI_REVIEW_T2_SKIP_REASON"]
    assert "Lint and Build" in reason and "${{" not in reason
    # A /ai-review comment or a dispatch can review a DRAFT (the draft exit is
    # pull_request-only), and Lint and Build defers the build on drafts: the
    # text must not imply a build ran (bot P2 on #198).
    assert "DRAFT" in reason and "defers the build" in reason

    spec = importlib.util.spec_from_file_location("ai_pr_review_reuse_lab", SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["ai_pr_review_reuse_lab"] = mod
    spec.loader.exec_module(mod)
    monkeypatch.delenv("AI_REVIEW_T2_SKIP_REASON", raising=False)
    assert mod.dyn_section(None) == "_dynamic tier skipped (run with --dynamic)_"
    monkeypatch.setenv("AI_REVIEW_T2_SKIP_REASON", "see Lint and Build <!-- x -->")
    text = mod.dyn_section(None)
    assert text.startswith("_dynamic tier skipped: see Lint and Build")
    assert "<!--" not in text, "the reason must be inert like any other report text"
