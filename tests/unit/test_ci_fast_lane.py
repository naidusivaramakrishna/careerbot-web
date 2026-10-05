"""The Lint and Build fast lane must fail closed.

scripts/ci/fast_lane.py lets a PR that only touches the AI reviewer / PR-size
gate, the Python CI tests or Markdown under docs/ skip npm ci and `next build`.
A wrong "fast" answer lets an app change merge unbuilt, so every way to get
"fast" is pinned here and everything else must come out "full". The classifier
is driven through its real main() against a real git merge commit; the step
conditions are evaluated with test_ci_draft_policy's expression evaluator.
"""

import importlib.util
import subprocess
import sys

import pytest

from test_ci_draft_policy import ROOT, _Expr, _truthy, pr_event, push_event, frontend_ci  # noqa: F401

_spec = importlib.util.spec_from_file_location("fast_lane", ROOT / "scripts/ci/fast_lane.py")
fast_lane = importlib.util.module_from_spec(_spec)
sys.modules["fast_lane"] = fast_lane
_spec.loader.exec_module(fast_lane)

DRAFT, READY, PUSH = pr_event("synchronize", True), pr_event("synchronize", False), push_event()


@pytest.mark.parametrize("paths", [
    # careerbot-web#168 and #174 as merged / proposed
    ["scripts/ai_review/ai_pr_review.py", "tests/unit/test_ai_review_incremental_ledger.py"],
    ["scripts/ai_review/ai_pr_review.py", "tests/unit/test_pr_size_gate.py"],
    ["scripts/ai_review/pr_size_gate.py", "scripts/ai_review/review_config.json"],
    ["scripts/ai_review/RUNNER_SETUP.txt", "scripts/ai_review/NOTES.md"],
    ["docs/ci/fast-lane.md"],
])
def test_allow_listed_changes_take_the_fast_lane(paths):
    assert fast_lane.classify(paths)[0] == "fast"


@pytest.mark.parametrize("paths", [
    [],
    ["src/lib/http.ts"],
    ["scripts/ai_review/ai_pr_review.py", "src/app/page.tsx"],
    [".github/workflows/frontend-ci.yml"],
    [".github/workflows/security-scan.yml", "tests/unit/test_ci_pr_size_policy.py"],
    ["scripts/ci/fast_lane.py"],                     # the classifier itself
    ["scripts/ci/new-lint-errors.mjs"],
    ["scripts/ai_review_helper.py"],                 # prefix without the slash
    ["scripts/ai_review/x.ts"],                      # tsconfig type-checks it
    ["scripts/ai_review/x.tsx"],
    ["scripts/ai_review/x.d.ts"],
    ["scripts/ai_review/sub/helper.py"],             # flat directory only
    ["tests/unit/conftest.py"],
    ["tests/unit/helpers/test_x.py"],
    ["docs/CompanyLogo.tsx"],                        # tsconfig type-checks it
    ["README.md"],
    ["package.json"],
    ["next.config.ts"],
    ["public/robots.txt"],
    ["docs/a\nb.md"],
    ["docs/a\tb.md"],                                # control char, else allowed
])
def test_everything_else_takes_the_full_lane(paths):
    assert fast_lane.classify(paths)[0] == "full"


@pytest.mark.parametrize("ext", ["ts", "tsx", "d.ts", "js", "jsx", "mjs"])
def test_no_allow_list_entry_admits_a_script_or_typescript_file(ext):
    # tsconfig type-checks *.ts/*.tsx (and allowJs); the fast lane has no tsc.
    for d in ("scripts/ai_review/", "tests/unit/", "docs/"):
        for name in (f"x.{ext}", f"test_x.{ext}", f"a/x.{ext}"):
            assert fast_lane.classify([d + name])[0] == "full", d + name


def _git(cwd, *args):
    return subprocess.run(["git", "-c", "user.name=t", "-c", "user.email=t@t",
                           *args], cwd=cwd, check=True, capture_output=True,
                          text=True).stdout.strip()


@pytest.fixture
def repo(tmp_path, monkeypatch):
    """A base commit, a PR branch, and the merge commit CI checks out."""
    _git(tmp_path, "init", "-q", "-b", "base")
    for rel in ("src/x.ts", "scripts/ai_review/ai_pr_review.py", "docs/a.md"):
        (tmp_path / rel).parent.mkdir(parents=True, exist_ok=True)
        (tmp_path / rel).write_text("x = 1\n" * 20)
    _git(tmp_path, "add", "-A")
    _git(tmp_path, "commit", "-qm", "base")
    _git(tmp_path, "checkout", "-qb", "pr")
    monkeypatch.chdir(tmp_path)

    def merge(change):
        change(tmp_path)
        _git(tmp_path, "add", "-A")
        _git(tmp_path, "commit", "-qm", "pr")
        head = _git(tmp_path, "rev-parse", "HEAD")
        _git(tmp_path, "checkout", "-q", "base")
        _git(tmp_path, "merge", "-q", "--no-ff", "-m", "merge", "pr")
        return head
    return tmp_path, merge


def _run(tmp_path, *args):
    out = tmp_path / "out.txt"
    assert fast_lane.main([*args, "--github-output", str(out)]) == 0
    return dict(line.split("=", 1) for line in out.read_text().splitlines())


def test_reviewer_only_merge_commit_is_fast(repo):
    tmp_path, merge = repo
    head = merge(lambda r: (r / "scripts/ai_review/ai_pr_review.py").write_text("y = 2\n"))
    assert _run(tmp_path, "--expect-head", head) == {
        "lane": "fast", "changed": "scripts/ai_review/ai_pr_review.py"}


def test_app_change_in_merge_commit_is_full(repo):
    tmp_path, merge = repo
    head = merge(lambda r: (r / "src/x.ts").write_text("y = 2\n"))
    assert _run(tmp_path, "--expect-head", head) == {"lane": "full"}


def test_rename_out_of_src_counts_the_old_path(repo):
    """git diff without --no-renames would report only docs/x.md -> fast."""
    tmp_path, merge = repo
    head = merge(lambda r: _git(r, "mv", "src/x.ts", "docs/x.md"))
    assert _run(tmp_path, "--expect-head", head) == {"lane": "full"}


def test_wrong_head_or_non_merge_checkout_is_full(repo):
    tmp_path, merge = repo
    head = merge(lambda r: (r / "docs/a.md").write_text("y\n"))
    assert _run(tmp_path, "--expect-head", "0" * 40) == {"lane": "full"}
    assert _run(tmp_path) == {"lane": "full"}            # no expected head
    _git(tmp_path, "checkout", "-q", head)               # PR head, not a merge
    assert _run(tmp_path, "--expect-head", head) == {"lane": "full"}


def test_classifier_error_is_full(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)                          # not a git repo
    assert _run(tmp_path, "--expect-head", "a" * 40) == {"lane": "full"}


# ---- workflow wiring -------------------------------------------------------

def _steps(wf):
    return wf["jobs"]["lint-and-build"]["steps"]


def _runs(step, ctx, lane):
    """Does the step run? `lane` is the classifier output (None = no output)."""
    cond = step.get("if")
    if cond is None:
        return True
    steps = {"lane": {"outputs": {"lane": lane} if lane is not None else {}}}
    return _truthy(_Expr(cond).eval({"github": ctx, "steps": steps,
                                     "needs": {"pr-size": {"result": "success"}}}))


def _step(wf, name):
    return next(s for s in _steps(wf) if s.get("name") == name)


def test_classifier_runs_on_pull_requests_only_from_the_base_copy(frontend_ci):
    lane = next(s for s in _steps(frontend_ci) if s.get("id") == "lane")
    assert _runs(lane, READY, None) and _runs(lane, DRAFT, None)
    assert not _runs(lane, PUSH, None)
    assert lane["continue-on-error"] is True
    assert "git show HEAD^1:scripts/ci/fast_lane.py" in lane["run"]


@pytest.mark.parametrize("name", ["Upgrade npm to match lockfile generator",
                                  "Install dependencies", "Build"])
def test_only_an_explicit_fast_answer_skips_install_and_build(frontend_ci, name):
    step = _step(frontend_ci, name)
    for lane in (None, "", "full", "FULL ", "fastish"):
        assert _runs(step, READY, lane), (name, lane)
        assert _runs(step, PUSH, lane), (name, lane)
    assert not _runs(step, READY, "fast")


def test_nothing_else_is_gated_on_the_lane(frontend_ci):
    gated = [s["name"] for s in _steps(frontend_ci) if "steps.lane" in str(s.get("if", ""))]
    assert sorted(gated) == sorted(["Upgrade npm to match lockfile generator",
                                    "Install dependencies", "Build",
                                    "Build deferred (draft PR)",
                                    "Build skipped (FAST LANE)"])


def test_draft_fast_lane_pr_gets_one_notice_not_a_misleading_deferral(frontend_ci):
    deferred = _step(frontend_ci, "Build deferred (draft PR)")
    assert _runs(deferred, DRAFT, None) and _runs(deferred, DRAFT, "full")
    assert not _runs(deferred, DRAFT, "fast") and not _runs(deferred, READY, None)
    assert _runs(_step(frontend_ci, "Build skipped (FAST LANE)"), DRAFT, "fast")


def test_fast_lane_says_so_and_still_runs_the_gates(frontend_ci):
    notice = _step(frontend_ci, "Build skipped (FAST LANE)")
    assert _runs(notice, READY, "fast") and not _runs(notice, READY, None)
    assert "FAST LANE: only ${CHANGED} changed" in notice["run"]
    for name in ("Test the new-error gate", "ESLint (fail on new errors in changed lines)",
                 "TypeScript (fail on new errors in changed files)",
                 "Fail on new ESLint / TypeScript errors"):
        assert _runs(_step(frontend_ci, name), READY, "fast"), name


def test_job_keeps_the_required_check_name(frontend_ci):
    assert frontend_ci["jobs"]["lint-and-build"]["name"] == "Lint and Build"
