"""Wiring of the new-error lint/type gate in frontend-ci.yml (`Lint and Build`).

The gate's logic lives in scripts/ci/new-lint-errors.mjs (tested by
scripts/ci/test_new_lint_errors.mjs, run inside the job itself). These tests
pin down WHEN it runs and how it blocks, evaluating the workflow expressions
with the evaluator from test_ci_draft_policy.py.
"""

import pytest

from test_ci_draft_policy import _cond, _render, pr_event, push_event, frontend_ci  # noqa: F401

GATE_STEPS = [
    "Test the new-error gate",
    "Diff against the PR base",
    "ESLint (fail on new errors in changed lines)",
    "TypeScript (fail on new errors in changed files)",
    "Fail on new ESLint / TypeScript errors",
]
WHOLE_REPO_ADVISORY = ["ESLint (advisory)", "TypeScript check (advisory)"]
DRAFT, READY, PUSH = pr_event("synchronize", True), pr_event("synchronize", False), push_event()


def _steps(wf):
    return wf["jobs"]["lint-and-build"]["steps"]


def _step(wf, name):
    return next(s for s in _steps(wf) if s.get("name") == name)


@pytest.mark.parametrize("name", GATE_STEPS)
def test_gate_runs_on_every_pull_request_and_never_on_push(frontend_ci, name):
    cond = _step(frontend_ci, name)["if"]
    assert _cond(cond, DRAFT) and _cond(cond, READY)
    assert not _cond(cond, PUSH)


@pytest.mark.parametrize("name", WHOLE_REPO_ADVISORY)
def test_whole_repo_advisory_runs_only_on_push(frontend_ci, name):
    step = _step(frontend_ci, name)
    assert _cond(step["if"], PUSH)
    assert not _cond(step["if"], READY)
    assert step["run"].rstrip().endswith("|| true")


def test_pr_checkout_has_history_for_the_merge_base(frontend_ci):
    checkout = _steps(frontend_ci)[0]
    assert checkout["uses"].startswith("actions/checkout@")
    depth = checkout["with"]["fetch-depth"]
    assert _render(depth, READY) == "0"
    assert _render(depth, PUSH) == "1"


@pytest.mark.parametrize("name", [
    "ESLint (fail on new errors in changed lines)",
    "TypeScript (fail on new errors in changed files)",
])
def test_gates_are_advisory_only_on_drafts(frontend_ci, name):
    step = _step(frontend_ci, name)
    assert _render(step["env"]["ADVISORY"], DRAFT) == "1"
    assert _render(step["env"]["ADVISORY"], READY) == ""
    assert "${ADVISORY:+--advisory}" in step["run"]


def test_final_step_blocks_ready_prs_and_only_warns_on_drafts(frontend_ci):
    final = _step(frontend_ci, "Fail on new ESLint / TypeScript errors")
    assert _steps(frontend_ci)[-1] is final, "must run after Build and the other checks"
    assert _render(final["env"]["DRAFT"], DRAFT) == "1"
    assert _render(final["env"]["DRAFT"], READY) == ""
    for gate_id, var in [("eslint_gate", "ESLINT_GATE"), ("tsc_gate", "TSC_GATE")]:
        gate = next(s for s in _steps(frontend_ci) if s.get("id") == gate_id)
        assert gate["continue-on-error"] is True
        assert final["env"][var] == "${{ steps.%s.outcome }}" % gate_id
    assert "exit 1" in final["run"]


def test_eslint_gate_fails_on_errors_not_warnings(frontend_ci):
    run = _step(frontend_ci, "ESLint (fail on new errors in changed lines)")["run"]
    run = "\n".join(line for line in run.splitlines() if not line.strip().startswith("#"))
    assert "--max-warnings" not in run
    assert "|| true" not in run


@pytest.mark.parametrize("name", GATE_STEPS)
def test_gate_scripts_take_event_data_from_env_not_inline(frontend_ci, name):
    # ${{ }} inside `run:` is spliced into the script before bash parses it.
    assert "${{" not in _step(frontend_ci, name)["run"]


def test_build_deferral_for_drafts_unchanged(frontend_ci):
    # PR #72's semantics: the gate must not change who builds.
    build = _step(frontend_ci, "Build")["if"]
    assert not _cond(build, DRAFT) and _cond(build, READY) and _cond(build, PUSH)
