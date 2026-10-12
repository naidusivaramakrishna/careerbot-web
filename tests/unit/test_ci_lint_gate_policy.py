"""Wiring of the new-error lint/type gate in frontend-ci.yml (`Lint and Build`),
and of the advisory `Unit Tests (new failures)` job (at the end of this file).

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
    checkout = next(s for s in _steps(frontend_ci) if str(s.get("uses", "")).startswith("actions/checkout@"))
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


# ── `Unit Tests (new failures)` (advisory; scripts/ci/new-vitest-failures.mjs) ──
# The FAIL-CLOSED guard, `needs: pr-size` and `!cancelled()` are enforced for
# this job by the parametrised tests in test_ci_pr_size_policy.py.

UNIT_JOB = "unit-tests"
UNIT_GUARD, UNIT_PUSH_NOTICE = "PR size gate", "Not a pull request"
UNIT_GATED = ["Install dependencies", "Unit tests (fail on new failures)"]


def _unit_steps(wf):
    return wf["jobs"][UNIT_JOB]["steps"]


def _unit_cond(step, ctx, count):
    from test_ci_draft_policy import _Expr, _truthy
    needs = {"pr-size": {"result": "success" if ctx["event_name"] == "pull_request" else "skipped"}}
    steps = {"affected": {"outputs": {"count": count}}}
    return _truthy(_Expr(step.get("if", "true")).eval({"github": ctx, "needs": needs, "steps": steps}))


def test_unit_job_is_named_and_not_a_required_check(frontend_ci):
    job = frontend_ci["jobs"][UNIT_JOB]
    assert job["name"] == "Unit Tests (new failures)"
    assert job["name"] not in {"ai-review", "Lint and Build"}
    assert isinstance(job["timeout-minutes"], int) and job["timeout-minutes"] <= 60


def test_unit_job_does_work_only_on_pull_requests(frontend_ci):
    for step in _unit_steps(frontend_ci):
        name = step.get("name", step.get("uses"))
        if name in (UNIT_GUARD, UNIT_PUSH_NOTICE):
            continue
        assert not _unit_cond(step, PUSH, "3"), name
        assert _unit_cond(step, READY, "3") and _unit_cond(step, DRAFT, "3"), name
    notice = next(s for s in _unit_steps(frontend_ci) if s.get("name") == UNIT_PUSH_NOTICE)
    assert _unit_cond(notice, PUSH, "") and not _unit_cond(notice, READY, "3")


@pytest.mark.parametrize("name", UNIT_GATED)
def test_unit_job_skips_install_and_tests_when_nothing_is_affected(frontend_ci, name):
    step = next(s for s in _unit_steps(frontend_ci) if s.get("name") == name)
    assert not _unit_cond(step, READY, "0")


def test_unit_gate_is_advisory_only_on_drafts_and_tested_first(frontend_ci):
    steps = _unit_steps(frontend_ci)
    gate = next(s for s in steps if s.get("name") == "Unit tests (fail on new failures)")
    assert _render(gate["env"]["ADVISORY"], DRAFT) == "1"
    assert _render(gate["env"]["ADVISORY"], READY) == ""
    assert "${ADVISORY:+--advisory}" in gate["run"] and "pipefail" in gate["run"]
    assert "|| true" not in gate["run"] and "continue-on-error" not in gate
    names = [s.get("name") for s in steps]
    assert names.index("Test the unit-test gate") < names.index("Unit tests (fail on new failures)")


def test_unit_scripts_take_event_data_from_env_not_inline(frontend_ci):
    for step in _unit_steps(frontend_ci):
        assert "${{" not in step.get("run", ""), step.get("name")


def test_unit_gate_script_crashes_are_advisory_on_drafts(frontend_ci):
    """Every gate invocation (affected, run, compare) gets --advisory on a draft,
    so a crash in any of them warns instead of failing the draft."""
    for step in _unit_steps(frontend_ci):
        calls = [l for l in step.get("run", "").replace("\\\n", " ").splitlines()
                 if "new-vitest-failures.mjs" in l or '"$gate"' in l]
        calls = [l for l in calls if not l.strip().startswith("gate=")]
        if not calls:
            continue
        assert _render(step["env"]["ADVISORY"], DRAFT) == "1", step.get("name")
        assert _render(step["env"]["ADVISORY"], READY) == "", step.get("name")
        for line in calls:
            assert "${ADVISORY:+--advisory}" in line, (step.get("name"), line)
