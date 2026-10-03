"""Workflow-policy tests for the fail-fast PR Size gate (pr-size-gate.yml).

Every workflow triggered by pull_request must run the gate FIRST and make every
other job depend on it, without the dependency blocking the workflow's other
triggers (push, issue_comment, workflow_dispatch), where the gate is skipped.

FAIL-CLOSED: a job skipped because its `needs` failed counts as PASSING for a
required check, so no downstream job may be skipped by a failed gate. Each one
runs under `!cancelled()` and its FIRST step fails the job when the gate did
not pass on a pull_request.
Job `if:`s are evaluated with the expression evaluator in
test_ci_draft_policy.py rather than grepped, so a condition that is moved into
a comment or onto the wrong key fails here.
"""

import json
from pathlib import Path

import pytest

from test_ci_draft_policy import (
    ROOT, _cond, _load, comment_event, pr_event, push_event,
)

WORKFLOWS = ROOT / ".github/workflows"
GATE_FILE = "pr-size-gate.yml"
GATE_USES = f"./.github/workflows/{GATE_FILE}"


def _workflows():
    return {p.name: _load(p) for p in sorted(WORKFLOWS.glob("*.yml"))}


def _triggers(wf):
    on = wf["on"]
    return [on] if isinstance(on, str) else list(on)


PR_WORKFLOWS = sorted(name for name, wf in _workflows().items()
                      if "pull_request" in _triggers(wf))


def schedule_event():
    return {"event_name": "schedule", "ref": "refs/heads/master", "event": {}}


def dispatch_event():
    return {"event_name": "workflow_dispatch", "ref": "refs/heads/develop2",
            "event": {"inputs": {"pr": ""}}}


def _other_jobs(wf):
    return {jid: job for jid, job in wf["jobs"].items() if jid != "pr-size"}


def _needs(job):
    n = job.get("needs", [])
    return [n] if isinstance(n, str) else list(n)


def test_the_expected_workflows_are_covered():
    """A new pull_request workflow is picked up by the parametrised tests below;
    this pins the three that exist today so a rename cannot silently drop one."""
    assert {"ai-pr-review.yml", "frontend-ci.yml", "security-scan.yml"} <= set(PR_WORKFLOWS)
    assert GATE_FILE not in PR_WORKFLOWS


@pytest.mark.parametrize("name", PR_WORKFLOWS)
def test_pr_size_is_the_first_job_and_calls_the_gate(name):
    wf = _workflows()[name]
    assert next(iter(wf["jobs"])) == "pr-size"
    assert wf["jobs"]["pr-size"]["uses"] == GATE_USES


@pytest.mark.parametrize("name", PR_WORKFLOWS)
def test_every_other_job_needs_pr_size(name):
    for jid, job in _other_jobs(_workflows()[name]).items():
        assert "pr-size" in _needs(job), f"{name}: job {jid} does not need pr-size"


@pytest.mark.parametrize("name", PR_WORKFLOWS)
def test_pr_size_runs_only_on_pull_request(name):
    job_if = _workflows()[name]["jobs"]["pr-size"]["if"]
    assert _cond(job_if, pr_event("synchronize", False))
    assert _cond(job_if, pr_event("synchronize", True))
    assert _cond(job_if, pr_event("labeled", False, "bug"))
    for ctx in (push_event(), comment_event(), dispatch_event()):
        assert not _cond(job_if, ctx), ctx["event_name"]


PR_CTXS = [pr_event("opened", False), pr_event("synchronize", False),
           pr_event("synchronize", True), pr_event("ready_for_review", False),
           pr_event("labeled", False, "ai-review-large")]


GUARD_NAME = "PR size gate"
STATUS_FUNCS = ("always()", "failure()", "cancelled()", "success()")


def _guard(job):
    return job["steps"][0]


# A job may opt OUT of the pull_request path entirely by saying so in its own
# `if`. Such a job cannot be a required check (a check that never runs on a PR
# can never be satisfied), so the "must fail, not skip" policy below does not
# apply to it -- there is nothing to skip. Decided by EVALUATING the condition
# for every PR context and every gate result -- not by grepping it -- so
# `!cancelled() || github.event_name != 'pull_request'` (which still runs on a
# PR) is not mistaken for an opt-out. The set of opted-out jobs is pinned in
# test_only_npm_audit_is_pr_exempt, so a new opt-out needs a deliberate edit.
_GATE_RESULTS = ("success", "failure", "cancelled", "skipped")


def _skips_pull_requests(job):
    job_if = job.get("if") or "true"
    return all(
        not _cond(job_if, ctx, needs={"pr-size": {"result": result}})
        for ctx in PR_CTXS
        for result in _GATE_RESULTS
    )


def _pr_exempt():
    return [(name, jid, job) for name in PR_WORKFLOWS
            for jid, job in _other_jobs(_workflows()[name]).items()
            if _skips_pull_requests(job)]


def _downstream():
    return [(name, jid, job) for name in PR_WORKFLOWS
            for jid, job in _other_jobs(_workflows()[name]).items()
            if not _skips_pull_requests(job)]


DOWNSTREAM_IDS = [f"{n}:{j}" for n, j, _ in _downstream()]


@pytest.mark.parametrize("name,jid,job", _downstream(), ids=DOWNSTREAM_IDS)
@pytest.mark.parametrize("result", ["failure", "cancelled", "skipped"])
def test_a_failed_gate_fails_every_other_job_instead_of_skipping_it(name, jid, job, result):
    """A skipped job is a PASSING required check, so a gate that did not pass
    must make every other job RUN and FAIL at its first step ('skipped' is not a
    pass on a pull_request either -- the gate always runs there)."""
    needs = {"pr-size": {"result": result}}
    guard = _guard(job)
    for ctx in PR_CTXS:
        assert _cond(job.get("if", "true"), ctx, needs=needs), (jid, ctx["event"])
        assert _cond(guard["if"], ctx, needs=needs), (jid, ctx["event"])


@pytest.mark.parametrize("name,jid,job", _downstream(), ids=DOWNSTREAM_IDS)
def test_guard_step_fails_loudly(name, jid, job):
    guard = _guard(job)
    assert guard["name"] == GUARD_NAME
    assert guard["env"]["GATE_RESULT"] == "${{ needs.pr-size.result }}"
    lines = [l.strip() for l in guard["run"].strip().splitlines()]
    assert lines[-1] == "exit 1"
    assert any(l.startswith('echo "::error') for l in lines)
    assert any("PR size gate failed — see PR Size" in l and '>> "$GITHUB_STEP_SUMMARY"' in l
               for l in lines)
    # Nothing may turn the failure back into a pass.
    assert "continue-on-error" not in guard and "continue-on-error" not in job


@pytest.mark.parametrize("name,jid,job", _downstream(), ids=DOWNSTREAM_IDS)
def test_guard_runs_before_anything_heavy_and_nothing_runs_after_it_fails(name, jid, job):
    """First step, so no checkout / npm ci / build / review precedes it; and no
    later step carries a status function, so after the guard's `exit 1` every
    later step is skipped by the implicit success()."""
    steps = job["steps"]
    assert steps[0]["name"] == GUARD_NAME and "uses" not in steps[0]
    assert [s.get("name") for s in steps].count(GUARD_NAME) == 1
    for step in steps[1:]:
        cond = str(step.get("if", ""))
        assert not any(f in cond for f in STATUS_FUNCS), (jid, step.get("name"), cond)


@pytest.mark.parametrize("name,jid,job", _downstream(), ids=DOWNSTREAM_IDS)
def test_job_if_never_skips_on_the_gate_result(name, jid, job):
    """The gate's result is judged by the guard step, never by the job `if` --
    a job-level check would SKIP the job, i.e. pass the required check."""
    assert "needs.pr-size" not in job.get("if", "")
    assert "!cancelled()" in job["if"]


@pytest.mark.parametrize("name,jid,job", _downstream(), ids=DOWNSTREAM_IDS)
def test_a_passing_gate_does_not_trip_the_guard(name, jid, job):
    needs = {"pr-size": {"result": "success"}}
    for ctx in PR_CTXS:
        assert _cond(job.get("if", "true"), ctx, needs=needs), (jid, ctx["event"])
        assert not _cond(_guard(job)["if"], ctx, needs=needs), (jid, ctx["event"])


@pytest.mark.parametrize("name", PR_WORKFLOWS)
def test_cancelled_run_starts_nothing(name):
    """`!cancelled()`, not `always()`: always() would keep a job alive through
    cancel-in-progress, so a new push could no longer supersede a review."""
    for jid, job in _other_jobs(_workflows()[name]).items():
        assert "always()" not in job.get("if", "")
        assert not _cond(job["if"], pr_event("synchronize", False), cancelled=True), jid


def test_non_pr_triggers_still_run_when_the_gate_is_skipped():
    wfs = _workflows()
    skipped = {"pr-size": {"result": "skipped"}}
    for name in ("frontend-ci.yml", "security-scan.yml"):
        assert "push" in _triggers(wfs[name])
        for jid, job in _other_jobs(wfs[name]).items():
            assert _cond(job["if"], push_event(), needs=skipped), (name, jid)
    for name, jid, job in _downstream():
        for ctx in (push_event(), comment_event(), dispatch_event()):
            assert not _cond(_guard(job)["if"], ctx, needs=skipped), (name, jid, ctx["event_name"])
    ai = wfs["ai-pr-review.yml"]["jobs"]
    assert _cond(ai["ai-review"]["if"], dispatch_event(), needs=skipped)
    assert _cond(ai["ai-review"]["if"], comment_event(), needs=skipped)
    assert not _cond(ai["ai-review"]["if"], comment_event(association="NONE"), needs=skipped)
    assert _cond(ai["gate-self-test"]["if"], dispatch_event(), needs=skipped)
    assert not _cond(ai["gate-self-test"]["if"], comment_event(), needs=skipped)


def test_a_passing_gate_lets_a_ready_pr_be_reviewed():
    """The draft/label policy itself (#72, #126) is pinned in
    test_ci_draft_policy.py, whose `_cond` assumes a passing gate."""
    ai = _workflows()["ai-pr-review.yml"]["jobs"]["ai-review"]["if"]
    assert _cond(ai, pr_event("synchronize", False))
    assert _cond(ai, pr_event("labeled", False, "ai-review-large"))


def _check_names(wf):
    """Check-run names: `<caller name> / <called job name>` for a reusable call."""
    names = []
    for jid, job in wf["jobs"].items():
        name = job.get("name", jid)
        if job.get("uses") == GATE_USES:
            name = f"{name} / {job['with']['gate']}"
        names.append(name)
    return names


def test_check_names_are_unique_across_workflows():
    """GitHub: 'make sure that job names are unique across all workflows' when
    they are required checks -- the gate's check must be requirable per workflow."""
    names = [n for name, wf in _workflows().items() if name != GATE_FILE
             for n in _check_names(wf)]
    assert len(names) == len(set(names)), names
    for n in ("PR Size / frontend-ci", "PR Size / ai-review", "PR Size / security-scan"):
        assert n in names


def test_called_job_is_named_after_the_gate_input():
    gate = _workflows()[GATE_FILE]
    assert _triggers(gate) == ["workflow_call"]
    (job,) = gate["jobs"].values()
    assert job["name"] == "${{ inputs.gate }}"
    assert job["runs-on"] == "${{ fromJSON(inputs.runs-on) }}"


@pytest.mark.parametrize("name", PR_WORKFLOWS)
def test_gate_uses_the_workflows_own_runners(name):
    wf = _workflows()[name]
    labels = json.loads(wf["jobs"]["pr-size"]["with"]["runs-on"])
    assert labels in [job.get("runs-on") for job in _other_jobs(wf).values()]


def test_exactly_one_caller_publishes_labels_and_it_can_write():
    """Three callers setting the same label/comment would race. The publisher is
    the workflow that also runs on label events (it sees ai-review-large)."""
    publishers = [name for name in PR_WORKFLOWS
                  if _workflows()[name]["jobs"]["pr-size"]["with"].get("publish")]
    assert publishers == ["ai-pr-review.yml"]
    wf = _workflows()["ai-pr-review.yml"]
    assert "labeled" in wf["on"]["pull_request"]["types"]
    perms = wf["jobs"]["pr-size"]["permissions"]
    assert perms["pull-requests"] == "write" and perms["issues"] == "write"


def test_gate_step_runs_the_script_with_full_history():
    (job,) = _workflows()[GATE_FILE]["jobs"].values()
    checkout = next(s for s in job["steps"] if str(s.get("uses", "")).startswith("actions/checkout"))
    assert checkout["with"]["fetch-depth"] == 0
    run = next(s for s in job["steps"] if "pr_size_gate.py" in s.get("run", ""))
    # Event data reaches the script through env, never ${{ }} inside `run:`.
    assert "${{" not in run["run"]
    assert (ROOT / "scripts/ai_review/pr_size_gate.py").exists()


def test_gate_fetches_through_the_script_so_fork_prs_work():
    """A fork's branch is not under origin/<head_ref>; the script fetches
    refs/pull/<N>/head (then by SHA) -- see test_pr_size_gate.py."""
    (job,) = _workflows()[GATE_FILE]["jobs"].values()
    run = next(s for s in job["steps"] if "pr_size_gate.py" in s.get("run", ""))
    assert "--fetch" in run["run"]
    assert "git fetch" not in run["run"]
    assert "head_ref" not in (WORKFLOWS / GATE_FILE).read_text().replace("<head_ref>", "")


def test_gate_docs_list_every_gate_check_and_do_not_require_branch_protection():
    text = (WORKFLOWS / GATE_FILE).read_text()
    for n in ("PR Size / frontend-ci", "PR Size / ai-review", "PR Size / security-scan"):
        assert n in text
    assert "NOT a precondition" in text and "FAIL-CLOSED" in text


# ── Jobs exempt from the pull_request path (added 2026-10-02) ───────────────

def test_a_pr_exempt_job_is_never_a_required_check():
    """The exemption must stay bounded. A required check that never runs on a
    PR can never be satisfied, so it would block every PR forever. Branch
    protection on develop2 requires `ai-review` and `Lint and Build`; neither
    may opt out of the pull_request path."""
    REQUIRED = {"ai-review", "Lint and Build"}
    for name, jid, job in _pr_exempt():
        assert job.get("name") not in REQUIRED, (name, jid, job.get("name"))


def test_only_npm_audit_is_pr_exempt():
    """Which jobs may leave the PR path is a deliberate decision, not something
    a condition edit can do silently. gitleaks in particular must stay on PRs:
    catching a secret BEFORE merge is the whole point of it."""
    assert {(n, j) for n, j, _ in _pr_exempt()} == {("security-scan.yml", "npm-audit")}


def test_exemption_is_evaluated_not_grepped():
    """A condition that merely CONTAINS the opt-out text but still runs on a PR
    (here `||` instead of `&&`) is not an exemption."""
    runs_on_pr = {"if": "${{ !cancelled() || github.event_name != 'pull_request' }}"}
    assert not _skips_pull_requests(runs_on_pr)
    opted_out = {"if": "${{ !cancelled() && github.event_name != 'pull_request' }}"}
    assert _skips_pull_requests(opted_out)


def test_gitleaks_runs_on_prs_and_pushes_but_not_nightly():
    """The nightly schedule exists for npm audit. gitleaks (full history,
    fetch-depth 0) adds nothing nightly that the push run did not already
    scan, and the single runner is shared."""
    job = _workflows()["security-scan.yml"]["jobs"]["gitleaks"]
    skipped = {"pr-size": {"result": "skipped"}}
    assert all(_cond(job["if"], ctx) for ctx in PR_CTXS)
    assert _cond(job["if"], push_event(), needs=skipped)
    assert _cond(job["if"], dispatch_event(), needs=skipped)
    assert not _cond(job["if"], schedule_event(), needs=skipped)


def test_a_pr_exempt_job_still_runs_on_push_and_schedule():
    """Opting out of PRs must not mean opting out of everything: the signal has
    to keep arriving on the branches that ship."""
    wfs = _workflows()
    skipped = {"pr-size": {"result": "skipped"}}
    for name, jid, job in _pr_exempt():
        triggers = _triggers(wfs[name])
        assert "push" in triggers, (name, jid)
        assert "schedule" in triggers, (name, jid, "a PR-exempt job needs a schedule")
        assert "workflow_dispatch" in triggers, (name, jid, "and an on-demand run")
        for ctx in (push_event(), schedule_event(), dispatch_event()):
            assert _cond(job["if"], ctx, needs=skipped), (name, jid, ctx["event_name"])


def test_npm_audit_is_pr_exempt_and_reports_off_the_pr_path():
    """npm audit is the current exemption. It is allowed off the PR path
    because it is not a required check and on PRs it could never fail (both
    steps ended in `|| true`) -- it held the single online runner for 6-12
    minutes to report something nobody could act on. Off the PR path it must
    be ABLE to fail: a red nightly / post-merge run is how a new high or
    critical advisory surfaces. `|| true` there would make every run green and
    the advisory invisible (ai-review P1 on #159)."""
    job = _workflows()["security-scan.yml"]["jobs"]["npm-audit"]
    assert _skips_pull_requests(job)
    assert job.get("name") not in {"ai-review", "Lint and Build"}
    audit_steps = [st for st in job["steps"] if "npm audit" in str(st.get("run", ""))]
    assert len(audit_steps) == 2, "expected the production and full audit steps"
    for st in audit_steps:
        run = st["run"]
        assert "|| true" not in run, (st.get("name"), "audit must be able to fail")
        assert "exit 1" in run and "pipefail" in run, st.get("name")
        assert "GITHUB_STEP_SUMMARY" in run, (st.get("name"), "findings must reach the run summary")
    # The second audit runs even when the first one failed.
    assert audit_steps[1].get("if") == "${{ !cancelled() }}"


def test_nightly_run_has_its_own_concurrency_group():
    """A scheduled run takes the default branch's ref. Sharing a group with
    push-to-master runs, the nightly (which skips gitleaks) would cancel an
    in-flight push run and leave those commits without a gitleaks scan."""
    from test_ci_draft_policy import PR, _group
    wf = _workflows()["security-scan.yml"]
    master_push = {"event_name": "push", "ref": "refs/heads/master", "event": {}}
    nightly = _group(wf, schedule_event())
    assert nightly != _group(wf, master_push)
    assert nightly != _group(wf, push_event())
    assert nightly.endswith("-nightly")
    # PR runs still group per PR number, pushes per ref.
    assert _group(wf, pr_event("synchronize", False)).endswith(f"-{PR}")
    assert _group(wf, push_event()).endswith("-refs/heads/develop2")
