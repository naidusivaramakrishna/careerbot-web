"""Regression tests for the draft-PR / concurrency policy of the CI workflows.

These evaluate the workflow expressions (concurrency group, cancel-in-progress,
job and step `if:`) against synthetic event payloads, instead of grepping the
YAML for a substring: a substring test passes when the expression is moved into
a comment or onto a key where it has no effect.

`_Expr` implements only the subset of the GitHub Actions expression language
these workflows use: context property access, ==, !=, !, &&, ||, string/bool/
null literals, fromJSON, contains, startsWith and cancelled(), with GitHub's
loose equality and truthiness rules. `needs.<job-id>.result` is read from a
`needs` context (see _cond).
"""

import ast
import json
import math
import re
import shlex
from pathlib import Path

import pytest
import yaml

ROOT = Path(__file__).resolve().parents[2]
AI_REVIEW = ROOT / ".github/workflows/ai-pr-review.yml"
FRONTEND_CI = ROOT / ".github/workflows/frontend-ci.yml"
PR = 72
REVIEW_GROUP = f"ai-pr-review-{PR}"


# --------------------------------------------------------------------------
# Minimal GitHub Actions expression evaluator
# --------------------------------------------------------------------------

def _to_number(v):
    if v is None:
        return 0.0
    if isinstance(v, bool):
        return 1.0 if v else 0.0
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        if v.strip() == "":
            return 0.0
        try:
            return float(v)
        except ValueError:
            return math.nan
    return math.nan


def _eq(a, b):
    if type(a) is type(b) or (isinstance(a, (int, float)) and isinstance(b, (int, float))
                              and not isinstance(a, bool) and not isinstance(b, bool)):
        if isinstance(a, str):
            return a.lower() == b.lower()
        return a == b
    na, nb = _to_number(a), _to_number(b)
    return not (math.isnan(na) or math.isnan(nb)) and na == nb


def _truthy(v):
    if v is None or v is False or v == "":
        return False
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        return not (v == 0 or math.isnan(v))
    return True


def _to_python(expr):
    """Translate operators/literals outside string literals into Python syntax."""
    parts = re.split(r"('(?:[^']|'')*')", expr)
    out = []
    for i, part in enumerate(parts):
        if i % 2:  # string literal
            out.append(part)
            continue
        part = part.replace("&&", " and ").replace("||", " or ")
        part = re.sub(r"!(?!=)", " not ", part)
        # `needs.pr-size.result`: a hyphenated property name is not a Python
        # identifier (it would parse as a subtraction).
        part = re.sub(r"\.([A-Za-z_]\w*(?:-\w+)+)",
                      lambda m: "." + m.group(1).replace("-", HYPHEN), part)
        part = re.sub(r"\bnull\b", "None", part)
        part = re.sub(r"\btrue\b", "True", part)
        part = re.sub(r"\bfalse\b", "False", part)
        out.append(part)
    return " ".join("".join(out).split())


HYPHEN = "__hyphen__"


class _Expr:
    FUNCS = {
        "fromJSON": lambda s: json.loads(s),
        "contains": lambda hay, needle: (
            any(_eq(x, needle) for x in hay) if isinstance(hay, list)
            else str(needle).lower() in str(hay).lower()),
        "startsWith": lambda s, p: str(s).lower().startswith(str(p).lower()),
    }

    def __init__(self, source):
        source = source.strip()
        if source.startswith("${{") and source.endswith("}}"):
            source = source[3:-2]
        self.tree = ast.parse(_to_python(source), mode="eval").body

    def eval(self, ctx):
        return self._ev(self.tree, ctx)

    def _ev(self, node, ctx):
        if isinstance(node, ast.Constant):
            return node.value
        if isinstance(node, ast.Name):
            return ctx.get(node.id)
        if isinstance(node, ast.Attribute):
            base = self._ev(node.value, ctx)
            attr = node.attr.replace(HYPHEN, "-")
            return base.get(attr) if isinstance(base, dict) else None
        if isinstance(node, ast.BoolOp):
            val = None
            for operand in node.values:
                val = self._ev(operand, ctx)
                if isinstance(node.op, ast.And) and not _truthy(val):
                    return val
                if isinstance(node.op, ast.Or) and _truthy(val):
                    return val
            return val
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.Not):
            return not _truthy(self._ev(node.operand, ctx))
        if isinstance(node, ast.Compare) and len(node.ops) == 1:
            a = self._ev(node.left, ctx)
            b = self._ev(node.comparators[0], ctx)
            if isinstance(node.ops[0], ast.Eq):
                return _eq(a, b)
            if isinstance(node.ops[0], ast.NotEq):
                return not _eq(a, b)
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            if node.func.id == "cancelled":
                return bool(ctx.get("cancelled"))
            return self.FUNCS[node.func.id](*(self._ev(a, ctx) for a in node.args))
        raise NotImplementedError(ast.dump(node))


def _render(template, ctx):
    """Evaluate a string that interpolates ${{ }} expressions, as GitHub does."""
    def sub(m):
        v = _Expr(m.group(1)).eval({"github": ctx})
        if v is None:
            return ""
        if isinstance(v, bool):
            return "true" if v else "false"
        if isinstance(v, float) and v.is_integer():
            return str(int(v))
        return str(v)
    return re.sub(r"\$\{\{(.*?)\}\}", sub, template, flags=re.S)


def _cond(source, ctx, needs=None, cancelled=False):
    """Evaluate a job/step `if:`. `needs` defaults to what the PR Size gate
    (pr-size) reports: it runs -- and here passes -- on pull_request events only,
    and is skipped on every other event."""
    if needs is None:
        needs = {"pr-size": {"result": "success" if ctx["event_name"] == "pull_request"
                             else "skipped"}}
    return _truthy(_Expr(source).eval({"github": ctx, "needs": needs,
                                       "cancelled": cancelled}))


def _load(path):
    doc = yaml.safe_load(path.read_text())
    # PyYAML (YAML 1.1) parses the bare key `on` as boolean True.
    doc["on"] = doc.get("on", doc.get(True))
    return doc


# --------------------------------------------------------------------------
# Synthetic event payloads
# --------------------------------------------------------------------------

def pr_event(action, draft, label=None):
    event = {"action": action, "pull_request": {"number": PR, "draft": draft}}
    if label is not None:
        event["label"] = {"name": label}
    return {"event_name": "pull_request", "ref": f"refs/pull/{PR}/merge", "event": event}


def comment_event(body="/ai-review", association="OWNER"):
    return {
        "event_name": "issue_comment",
        "ref": "refs/heads/master",
        "event": {
            "action": "created",
            "issue": {"number": PR, "pull_request": {"url": "https://example.invalid"}},
            "comment": {"body": body, "author_association": association},
        },
    }


def push_event():
    return {"event_name": "push", "ref": "refs/heads/develop2", "event": {}}


PULL_REQUEST_EVENTS = [
    pr_event(action, draft, label)
    for draft in (True, False)
    for action, label in [
        ("opened", None), ("synchronize", None), ("reopened", None),
        ("ready_for_review", None), ("labeled", "ai-review-waive"),
        ("unlabeled", "ai-review-waive"), ("labeled", "ai-review-large"),
        ("unlabeled", "ai-review-large"), ("labeled", "bug"), ("unlabeled", "bug"),
    ]
]


def _ids(events):
    return [f"{e['event']['action']}-draft={e['event']['pull_request']['draft']}"
            f"{'-' + e['event']['label']['name'] if 'label' in e['event'] else ''}"
            for e in events]


@pytest.fixture(scope="module")
def ai_review():
    return _load(AI_REVIEW)


@pytest.fixture(scope="module")
def frontend_ci():
    # `master` (the default branch) carries the ai-review workflow -- it is the
    # copy issue_comment runs use -- but not frontend-ci.yml. This file is kept
    # identical on both branches, so the frontend-ci policy tests skip where the
    # workflow they test does not exist rather than fail on a missing file.
    if not FRONTEND_CI.exists():
        pytest.skip(f"{FRONTEND_CI.relative_to(ROOT)} is not on this branch")
    return _load(FRONTEND_CI)


def _group(wf, ctx):
    return _render(wf["concurrency"]["group"], ctx)


def _cancels(wf, ctx):
    value = wf["concurrency"]["cancel-in-progress"]
    return value if isinstance(value, bool) else _cond(value, ctx)


# --------------------------------------------------------------------------
# ai-pr-review.yml
# --------------------------------------------------------------------------

def test_evaluator_matches_github_loose_equality():
    # Guards the helper itself: null == false is TRUE in GitHub expressions.
    assert _cond("github.event.pull_request.draft == false", push_event())
    assert not _cond("github.event.pull_request.draft", push_event())


REVIEW_LABELS = ("ai-review-waive", "ai-review-large")


def _unrelated_label(ctx):
    ev = ctx["event"]
    return (ev["action"] in ("labeled", "unlabeled")
            and ev["label"]["name"] not in REVIEW_LABELS)


@pytest.mark.parametrize("ctx", PULL_REQUEST_EVENTS, ids=_ids(PULL_REQUEST_EVENTS))
def test_pull_request_run_joins_review_group_only_if_it_starts_a_review(ai_review, ctx):
    """A run that does not START a review -- a draft push (job runs, exits 0 on
    the live draft state) or an unrelated label (job runs, but only re-derives
    the posted verdict) -- must
    not enter the per-PR review group. Concurrency is workflow-level: inside the
    group it either cancels the in-flight review (cancel-in-progress: true) or,
    whatever the flag says, replaces a PENDING requested /ai-review run -- GitHub
    keeps at most one pending run per group."""
    starts_review = (not ctx["event"]["pull_request"]["draft"]
                     and not _unrelated_label(ctx))
    assert (_group(ai_review, ctx) == REVIEW_GROUP) is starts_review


@pytest.mark.parametrize("ctx", PULL_REQUEST_EVENTS, ids=_ids(PULL_REQUEST_EVENTS))
def test_ai_review_is_never_skipped_for_a_pull_request(ai_review, ctx):
    """`ai-review` is a REQUIRED check and GitHub counts a SKIPPED job as a
    passing check run; the newest run on the head is the one that counts. So a
    pull_request run whose job is skipped turns the gate green with no review --
    #117 went BLOCKED -> CLEAN on a label run (36172176433) that skipped it.
    Drafts included: "Re-run all jobs" replays the original payload, so a re-run
    of a draft-era run kept `draft: true` and skipped again on a head whose real
    review had failed. The script reads the LIVE draft state instead."""
    assert _cond(ai_review["jobs"]["ai-review"]["if"], ctx) is True


def test_ai_review_job_if_does_not_look_at_the_draft_flag(ai_review):
    """The payload's draft flag is stale on a re-run; only the concurrency group
    (never the job `if`) may use it."""
    assert "draft" not in ai_review["jobs"]["ai-review"]["if"]


def plain_issue_comment_event(body="/ai-review", association="OWNER"):
    ctx = comment_event(body, association)
    del ctx["event"]["issue"]["pull_request"]
    return ctx


COMMENT_EVENTS = [
    comment_event("/ai-review", "OWNER"),
    comment_event("/ai-review-live", "MEMBER"),
    comment_event("/ai-review", "COLLABORATOR"),
    comment_event("thanks", "OWNER"),
    comment_event("LGTM /ai-review", "OWNER"),
    comment_event("/ai-review", "CONTRIBUTOR"),
    comment_event("/ai-review", "NONE"),
    comment_event("thanks", "NONE"),
    plain_issue_comment_event("/ai-review", "OWNER"),
]


def _comment_ids(events):
    return [f"{e['event']['comment']['author_association']}:"
            f"{e['event']['comment']['body']}"
            f"{'' if 'pull_request' in e['event']['issue'] else '-on-issue'}"
            for e in events]


@pytest.mark.parametrize("ctx", COMMENT_EVENTS, ids=_comment_ids(COMMENT_EVENTS))
def test_comment_run_joins_review_group_only_if_it_reviews(ai_review, ctx):
    """Same rule as for pull_request runs. An ordinary comment (or an
    untrusted `/ai-review`) produces a run whose jobs are all skipped; in the
    review group it would REPLACE a pending requested /ai-review run (GitHub
    keeps at most one pending run per group, cancel-in-progress or not)."""
    reviews = _cond(ai_review["jobs"]["ai-review"]["if"], ctx)
    assert (_group(ai_review, ctx) == REVIEW_GROUP) is reviews


def test_ordinary_comment_cannot_displace_a_pending_review(ai_review):
    """Scenario from the 137e3a1 review: a review is running, an OWNER's
    `/ai-review` run X is pending behind it, then someone comments "thanks"
    (run Y). Y must land in neither the review group (would replace X) nor the
    draft `-noreview` group (would replace a pending draft run's
    gate-self-test)."""
    requested = _group(ai_review, comment_event("/ai-review", "OWNER"))
    draft = _group(ai_review, pr_event("synchronize", True))
    for chatter in (comment_event("thanks", "NONE"),
                    comment_event("/ai-review", "CONTRIBUTOR"),
                    plain_issue_comment_event("hello", "NONE")):
        assert _group(ai_review, chatter) not in (requested, draft, REVIEW_GROUP)
        # and it never cancels anything on the way in
        assert _cancels(ai_review, chatter) is False


def test_requested_review_queues_instead_of_cancelling(ai_review):
    ctx = comment_event()
    assert _cond(ai_review["jobs"]["ai-review"]["if"], ctx)
    assert _group(ai_review, ctx) == REVIEW_GROUP
    assert _cancels(ai_review, ctx) is False


def test_non_draft_push_supersedes_the_in_flight_review(ai_review):
    ctx = pr_event("synchronize", draft=False)
    assert _group(ai_review, ctx) == REVIEW_GROUP
    assert _cancels(ai_review, ctx) is True


def test_draft_pushes_supersede_each_other(ai_review):
    """Rapid draft pushes must not stack serialized gate-self-test runs on the
    single ai-review runner."""
    first, second = pr_event("synchronize", True), pr_event("synchronize", True)
    assert _group(ai_review, first) == _group(ai_review, second) != REVIEW_GROUP
    assert _cancels(ai_review, second) is True


@pytest.mark.parametrize("label", ["ai-review-waive", "ai-review-large"])
def test_review_labels_start_a_review(ai_review, label):
    """Applying `ai-review-large` (size override) or `ai-review-waive` must start
    a run that reviews; the label is otherwise inert until the next push."""
    ctx = pr_event("labeled", draft=False, label=label)
    assert _cond(ai_review["jobs"]["ai-review"]["if"], ctx)
    assert _group(ai_review, ctx) == REVIEW_GROUP


@pytest.mark.parametrize("action", ["labeled", "unlabeled"])
@pytest.mark.parametrize("label", ["bug", "ai-review-largest", "documentation"])
def test_unrelated_label_runs_the_gate_outside_the_review_group(ai_review, action, label):
    """The job RUNS (a skipped job would pass the required check), but the run
    stays out of the review group, so it can neither cancel the in-flight review
    nor displace a pending requested one. It lands with draft runs in
    `-noreview`, where runs only supersede each other."""
    ctx = pr_event(action, draft=False, label=label)
    assert _cond(ai_review["jobs"]["ai-review"]["if"], ctx)
    group = _group(ai_review, ctx)
    assert group != REVIEW_GROUP
    assert group == _group(ai_review, pr_event("synchronize", True)) == f"{REVIEW_GROUP}-noreview"
    # Nothing in the review group is affected by whatever it cancels.
    assert _group(ai_review, pr_event("synchronize", False)) == REVIEW_GROUP
    assert _group(ai_review, comment_event()) == REVIEW_GROUP


def test_draft_label_event_runs_outside_the_review_group(ai_review):
    ctx = pr_event("labeled", draft=True, label="bug")
    assert _cond(ai_review["jobs"]["ai-review"]["if"], ctx)
    assert _group(ai_review, ctx) == f"{REVIEW_GROUP}-noreview"


def _review_step(wf):
    steps = wf["jobs"]["ai-review"]["steps"]
    return next(s for s in steps if "ai_pr_review.py" in s.get("run", ""))


@pytest.mark.parametrize("ctx,action,label", [
    (pr_event("labeled", False, "bug"), "labeled", "bug"),
    (pr_event("unlabeled", False, "ai-review-large"), "unlabeled", "ai-review-large"),
    (pr_event("synchronize", False), "synchronize", ""),
    (comment_event(), "", ""),
])
def test_review_step_is_told_about_label_events(ai_review, ctx, action, label):
    """The script's label-event path (label_event) reads these two variables.
    They go through env, not ${{ }} in `run:` -- a label name is user text."""
    step = _review_step(ai_review)
    assert "github.event.label" not in step["run"]
    env = {k: _render(v, ctx) for k, v in step["env"].items()}
    assert env["AI_REVIEW_EVENT_ACTION"] == action
    assert env["AI_REVIEW_EVENT_LABEL"] == label


def _with_head(ctx, sha):
    ctx = {**ctx, "event": {**ctx["event"]}}
    ctx["event"]["pull_request"] = {**ctx["event"]["pull_request"], "head": {"sha": sha}}
    return ctx


@pytest.mark.parametrize("ctx,head,draft", [
    (_with_head(pr_event("synchronize", True), "a" * 40), "a" * 40, "true"),
    (_with_head(pr_event("labeled", False, "bug"), "b" * 40), "b" * 40, "false"),
    (_with_head(pr_event("ready_for_review", False), "c" * 40), "c" * 40, "false"),
    (comment_event(), "", "false"),
])
def test_review_step_is_told_the_event_head_and_draft_flag(ai_review, ctx, head, draft):
    """live_pr_state is compared with these: the payload head (the commit the
    check run is attached to) and the payload draft flag, which a re-run replays.
    Only pull_request runs set a head -- that is how the script tells them apart."""
    env = {k: _render(v, ctx) for k, v in _review_step(ai_review)["env"].items()}
    assert env["AI_REVIEW_EVENT_HEAD"] == head
    assert env["AI_REVIEW_EVENT_DRAFT"] == draft


def test_workflow_can_read_its_own_runs(ai_review):
    """earlier_run_in_flight lists this workflow's runs; with an explicit
    `permissions:` block every scope not named is `none`."""
    assert ai_review["permissions"].get("actions") in ("read", "write")


def test_draft_pr_is_not_ai_reviewed_until_ready(ai_review):
    """The draft run's job RUNS (never skipped) but outside the review group; the
    script exits 0 on the live draft state. ready_for_review starts the review."""
    job_if = ai_review["jobs"]["ai-review"]["if"]
    assert _cond(job_if, pr_event("synchronize", True))
    assert _group(ai_review, pr_event("synchronize", True)) == f"{REVIEW_GROUP}-noreview"
    assert _cond(job_if, pr_event("ready_for_review", False))
    assert _group(ai_review, pr_event("ready_for_review", False)) == REVIEW_GROUP
    assert "ready_for_review" in ai_review["on"]["pull_request"]["types"]


@pytest.mark.parametrize("association,allowed", [
    ("OWNER", True), ("MEMBER", True), ("COLLABORATOR", True),
    ("CONTRIBUTOR", False), ("FIRST_TIME_CONTRIBUTOR", False), ("NONE", False),
])
def test_ai_review_command_restricted_to_trusted_commenters(ai_review, association, allowed):
    assert _cond(ai_review["jobs"]["ai-review"]["if"],
                 comment_event(association=association)) is allowed


def test_comments_do_not_start_gate_self_test(ai_review):
    """Every comment on every issue/PR fires issue_comment; the self-test has
    nothing to test there."""
    job_if = ai_review["jobs"]["gate-self-test"].get("if", "true")
    assert not _cond(job_if, comment_event(body="thanks", association="NONE"))
    assert _cond(job_if, pr_event("synchronize", True))
    assert _cond(job_if, pr_event("synchronize", False))


def test_gate_self_test_runs_every_unit_test_file(ai_review):
    steps = ai_review["jobs"]["gate-self-test"]["steps"]
    commands = " ".join(s.get("run", "") for s in steps)
    pytest_args = shlex.split(commands.split("pytest", 2)[-1])
    targets = [a for a in pytest_args if not a.startswith("-")]
    for test_file in sorted((ROOT / "tests/unit").glob("test_*.py")):
        rel = test_file.relative_to(ROOT).as_posix()
        assert any(rel == t or rel.startswith(t.rstrip("/") + "/") for t in targets), rel
    assert "pyyaml" in commands.lower(), "this file imports yaml"


def test_ai_review_docs_do_not_claim_removed_scheduled_sweep():
    script = (ROOT / "scripts/ai_review/ai_pr_review.py").read_text()
    for stale_claim in ("30-min sweep", "6-hourly sweep", "scheduled job"):
        assert stale_claim not in script


# --------------------------------------------------------------------------
# frontend-ci.yml
# --------------------------------------------------------------------------

def _step(wf, name):
    steps = wf["jobs"]["lint-and-build"]["steps"]
    return next(s for s in steps if s.get("name") == name)


def test_ready_for_review_triggers_frontend_ci(frontend_ci):
    assert "ready_for_review" in frontend_ci["on"]["pull_request"]["types"]


@pytest.mark.parametrize("ctx,builds", [
    (pr_event("synchronize", True), False),
    (pr_event("synchronize", False), True),
    (pr_event("ready_for_review", False), True),
    (push_event(), True),
])
def test_build_deferred_only_for_drafts_and_says_so(frontend_ci, ctx, builds):
    """A skipped step leaves `Lint and Build` green; the deferral must be
    visible, so exactly one of Build / Build deferred runs."""
    assert _cond(_step(frontend_ci, "Build")["if"], ctx) is builds
    assert _cond(_step(frontend_ci, "Build deferred (draft PR)")["if"], ctx) is not builds
