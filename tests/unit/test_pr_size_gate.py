"""Tests for scripts/ai_review/pr_size_gate.py -- the fail-fast PR Size gate.

Limits: reviewable added lines 1,500, changed files 40, commits 20 (a value
equal to the limit passes). Reviewable lines leave out generated files, using
the ai-review scope guard's own code (size_stats / GENERATED_FILE_PATTERNS),
imported rather than copied.

PR shapes are from this repo: #117 (13 files, +9,204 when refused by the scope
guard), #114 (+17,393 in one regenerated cs-chatbot/package-lock.json, 117
files, 37 commits), #99 (3 files, +49, 2 commits).
"""

import importlib.util
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT = REPO_ROOT / "scripts" / "ai_review" / "pr_size_gate.py"


def _load():
    spec = importlib.util.spec_from_file_location("pr_size_gate", SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["pr_size_gate"] = mod
    spec.loader.exec_module(mod)
    return mod


gate = _load()
review = sys.modules["ai_pr_review"]  # imported by the gate itself


def _stats(rows, commits=1):
    """rows: [(added, removed, path)] -> the dict the gate evaluates."""
    stats = gate.size_stats("\n".join(f"{a}\t{r}\t{p}" for a, r, p in rows))
    stats["commits"] = commits
    return stats


def _files(n, lines_each=1, prefix="src/f"):
    return [(lines_each, 0, f"{prefix}{i}.ts") for i in range(n)]


def _rows_117():
    rows = [(700, 3, f"src/app/feature/file{i}.tsx") for i in range(12)]
    rows.append((9204 - 700 * 12, 0, "src/app/feature/page.tsx"))
    return rows


def _rows_114():
    rows = [(17393, 0, "cs-chatbot/package-lock.json")]
    rows += [(147, 0, f"cs-chatbot/src/f{i}.tsx") for i in range(115)]
    rows.append((17035 - 147 * 115, 21, "src/app/(ai)/chatbot/page.tsx"))
    return rows


# --------------------------------------------------------------------------
# Shared logic, not a second copy
# --------------------------------------------------------------------------

def test_generated_patterns_and_size_split_are_the_scope_guards():
    assert gate.GENERATED_FILE_PATTERNS is review.GENERATED_FILE_PATTERNS
    assert gate.size_stats is review.size_stats
    assert gate.SIZE_OVERRIDE_LABEL == review.SIZE_OVERRIDE_LABEL == "ai-review-large"
    src = SCRIPT.read_text()
    for pattern in review.GENERATED_FILE_PATTERNS:
        assert f'"{pattern}"' not in src, f"{pattern} is re-declared in the gate"


# --------------------------------------------------------------------------
# Real PR shapes
# --------------------------------------------------------------------------

def test_pr_117_shape_fails_on_lines_as_xxl():
    stats = _stats(_rows_117(), commits=2)
    v = gate.evaluate(stats, [])
    assert (stats["files"], stats["added"]) == (13, 9204)
    assert v["label"] == "size/XXL" and not v["passed"]
    assert v["tripped"] == ["reviewable added lines 9,204 > 1,500"]
    assert v["within"] == ["changed files 13 ≤ 40", "commits 2 ≤ 20"]


def test_pr_114_shape_excludes_the_lockfile_but_counts_it_as_a_file():
    stats = _stats(_rows_114(), commits=37)
    assert stats["excluded"] == [("cs-chatbot/package-lock.json", 17393)]
    assert stats["excluded_added"] == 17393
    assert stats["added"] == 17035 and stats["files"] == 117
    v = gate.evaluate(stats, [])
    assert v["tripped"] == ["reviewable added lines 17,035 > 1,500",
                            "changed files 117 > 40", "commits 37 > 20"]
    summary = gate.summary_markdown(stats, v)
    assert "`cs-chatbot/package-lock.json` (+17,393)" in summary
    assert "| Excluded generated added lines | 17,393 |" in summary


def test_a_regenerated_lockfile_alone_does_not_fail_the_gate():
    stats = _stats([(17393, 0, "cs-chatbot/package-lock.json"), (3, 1, "cs-chatbot/package.json")])
    v = gate.evaluate(stats, [])
    assert v["passed"] and v["label"] == "size/XS" and stats["files"] == 2


def test_pr_99_shape_passes_as_xs():
    stats = _stats([(1, 1, "src/api/resumeatsapi.ts"),
                    (3, 2, "src/app/(resume)/atslogin/report/page.tsx"),
                    (45, 0, "src/tests/unit/features/ats/atsReportPage.test.tsx")], commits=2)
    v = gate.evaluate(stats, [])
    assert stats["added"] == 49
    assert v["passed"] and v["label"] == "size/XS" and v["tripped"] == []


# --------------------------------------------------------------------------
# Exactly at / one over each limit
# --------------------------------------------------------------------------

@pytest.mark.parametrize("added,passed,label", [(1500, True, "size/XL"), (1501, False, "size/XXL")])
def test_added_lines_limit(added, passed, label):
    v = gate.evaluate(_stats([(added, 0, "src/big.ts")]), [])
    assert v["passed"] is passed and v["label"] == label
    if not passed:
        assert v["tripped"] == ["reviewable added lines 1,501 > 1,500"]


@pytest.mark.parametrize("files,passed", [(40, True), (41, False)])
def test_files_limit(files, passed):
    v = gate.evaluate(_stats(_files(files)), [])
    assert v["passed"] is passed
    if not passed:
        assert v["tripped"] == ["changed files 41 > 40"]
        assert v["label"] == "size/XS"  # the label measures lines, the verdict all three


def test_generated_files_count_toward_the_files_limit():
    rows = _files(40) + [(10, 0, "public/app.js.map")]
    v = gate.evaluate(_stats(rows), [])
    assert v["tripped"] == ["changed files 41 > 40"]


@pytest.mark.parametrize("commits,passed", [(20, True), (21, False)])
def test_commits_limit(commits, passed):
    v = gate.evaluate(_stats([(5, 0, "src/a.ts")], commits=commits), [])
    assert v["passed"] is passed
    if not passed:
        assert v["tripped"] == ["commits 21 > 20"]


def test_exactly_at_every_limit_passes():
    rows = _files(39) + [(1500 - 39, 0, "src/big.ts")]
    v = gate.evaluate(_stats(rows, commits=20), [])
    assert v["passed"] and v["tripped"] == [] and v["label"] == "size/XL"


@pytest.mark.parametrize("added,label", [
    (0, "size/XS"), (49, "size/XS"), (50, "size/S"), (199, "size/S"), (200, "size/M"),
    (499, "size/M"), (500, "size/L"), (999, "size/L"), (1000, "size/XL"), (1500, "size/XL"),
    (1501, "size/XXL"), (9204, "size/XXL"),
])
def test_size_label_buckets(added, label):
    assert gate.size_label(added) == label
    assert label in gate.SIZE_LABELS and label in gate.SIZE_LABEL_COLORS


# --------------------------------------------------------------------------
# Override label
# --------------------------------------------------------------------------

def test_override_label_lifts_the_failure_but_keeps_the_xxl_label():
    stats = _stats(_rows_117())
    v = gate.evaluate(stats, ["bug", "ai-review-large"])
    assert v["passed"] and v["overridden"] and v["label"] == "size/XXL"
    summary = gate.summary_markdown(stats, v, actor="maintainer1")
    assert "overridden" in summary and "@maintainer1" in summary
    assert "How to split it" not in summary


def test_override_on_a_small_pr_is_not_reported_as_an_override():
    v = gate.evaluate(_stats([(5, 0, "src/a.ts")]), ["ai-review-large"])
    assert v["passed"] and not v["overridden"]


def test_similar_label_names_do_not_override():
    v = gate.evaluate(_stats(_rows_117()), ["ai-review-large-ish", "ai-review-waive"])
    assert not v["passed"]


# --------------------------------------------------------------------------
# Messages
# --------------------------------------------------------------------------

def test_failure_summary_names_the_limit_and_gives_split_advice():
    stats = _stats(_rows_117())
    s = gate.summary_markdown(stats, gate.evaluate(stats, []))
    assert "too large" in s and "**Limit exceeded:** reviewable added lines 9,204 > 1,500" in s
    assert "Split by concern" in s and "squash" not in s
    assert "ai-review-large" in s


def test_commit_advice_only_when_commits_tripped():
    stats = _stats([(5, 0, "src/a.ts")], commits=21)
    tips = gate.split_advice(stats)
    assert len(tips) == 1 and "squash" in tips[0]


def test_passing_summary():
    stats = _stats([(5, 0, "src/a.ts")])
    s = gate.summary_markdown(stats, gate.evaluate(stats, []))
    assert "within limits" in s and "size/XS" in s and "none" in s


# --------------------------------------------------------------------------
# I/O: fail closed, exit codes, publishing
# --------------------------------------------------------------------------

def test_unreadable_diff_fails_closed(monkeypatch):
    def fake_run(cmd, **kw):
        return subprocess.CompletedProcess(cmd, 128, "", "fatal: bad revision")
    monkeypatch.setattr(gate.subprocess, "run", fake_run)
    with pytest.raises(RuntimeError, match="bad revision"):
        gate.git_stats("a" * 40, "b" * 40)


def test_git_stats_uses_the_scope_guards_commands(monkeypatch):
    calls = []

    def fake_run(cmd, **kw):
        calls.append(cmd)
        out = "45\t0\tsrc/a.ts\n100\t0\tpackage-lock.json" if cmd[1] == "diff" else "3\n"
        return subprocess.CompletedProcess(cmd, 0, out, "")
    monkeypatch.setattr(gate.subprocess, "run", fake_run)
    stats = gate.git_stats("B", "H")
    assert calls == [["git", "diff", "--numstat", "B...H"], ["git", "rev-list", "--count", "B..H"]]
    assert (stats["files"], stats["added"], stats["excluded_added"], stats["commits"]) == (2, 45, 100, 3)


def _run_main(monkeypatch, tmp_path, stats, labels, publish=False, actor="maint"):
    summary = tmp_path / "summary.md"
    monkeypatch.setenv("GITHUB_STEP_SUMMARY", str(summary))
    monkeypatch.setattr(gate, "git_stats", lambda b, h: stats)
    monkeypatch.setattr(gate, "current_labels", lambda r, p: labels)
    monkeypatch.setattr(gate, "label_actor", lambda r, p, l: actor)
    published = []
    monkeypatch.setattr(gate, "publish_label", lambda *a: published.append(("label", a[2])))
    monkeypatch.setattr(gate, "publish_comment", lambda *a: published.append(("comment",)))
    argv = ["--repo", "o/r", "--pr", "7", "--base", "B", "--head", "H"] + (["--publish"] if publish else [])
    return gate.main(argv), summary.read_text(), published


def test_main_fails_an_oversized_pr_and_writes_the_summary(monkeypatch, tmp_path):
    code, summary, published = _run_main(monkeypatch, tmp_path, _stats(_rows_117()), [])
    assert code == 1 and "too large" in summary and published == []


def test_main_passes_under_override(monkeypatch, tmp_path):
    code, summary, _ = _run_main(monkeypatch, tmp_path, _stats(_rows_117()), ["ai-review-large"])
    assert code == 0 and "@maint" in summary


def test_main_publishes_only_when_asked(monkeypatch, tmp_path):
    code, _, published = _run_main(monkeypatch, tmp_path, _stats([(5, 0, "a.ts")]), [], publish=True)
    assert code == 0 and published == [("label", "size/XS"), ("comment",)]


def test_publish_errors_never_change_the_verdict(monkeypatch, tmp_path, capsys):
    def boom(*a):
        raise RuntimeError("Resource not accessible by integration")
    stats = _stats(_rows_117())
    monkeypatch.setenv("GITHUB_STEP_SUMMARY", str(tmp_path / "s.md"))
    monkeypatch.setattr(gate, "git_stats", lambda b, h: stats)
    monkeypatch.setattr(gate, "current_labels", lambda r, p: [])
    monkeypatch.setattr(gate, "publish_label", boom)
    monkeypatch.setattr(gate, "publish_comment", boom)
    assert gate.main(["--repo", "o/r", "--pr", "7", "--base", "B", "--head", "H", "--publish"]) == 1
    assert capsys.readouterr().out.count("::warning::PR Size: could not update") == 2


class FakeGh:
    def __init__(self, comments=""):
        self.calls, self.comments = [], comments

    def __call__(self, *args, stdin=None, check=True):
        self.calls.append(args)
        out = self.comments if "comments" in args[1] and args[0] == "api" and "-X" not in args else ""
        return subprocess.CompletedProcess(args, 0, out, "")


def test_publish_label_replaces_the_previous_size_label(monkeypatch):
    gh = FakeGh()
    monkeypatch.setattr(gate, "_gh", gh)
    gate.publish_label("o/r", 7, "size/XXL", ["bug", "size/M"])
    assert gh.calls[0] == ("api", "-X", "DELETE", "repos/o/r/issues/7/labels/size%2FM")
    assert gh.calls[1][:2] == ("label", "create") and gh.calls[1][2] == "size/XXL"
    assert gh.calls[2] == ("api", "-X", "POST", "repos/o/r/issues/7/labels", "-f", "labels[]=size/XXL")


def test_publish_label_is_a_no_op_when_already_set(monkeypatch):
    gh = FakeGh()
    monkeypatch.setattr(gate, "_gh", gh)
    gate.publish_label("o/r", 7, "size/S", ["size/S", "bug"])
    assert gh.calls == []


def _comment_calls(gh):
    return [c for c in gh.calls if "-X" in c]


def test_comment_posted_once_when_failing(monkeypatch):
    gh = FakeGh()
    monkeypatch.setattr(gate, "_gh", gh)
    stats = _stats(_rows_117())
    gate.publish_comment("o/r", 7, stats, gate.evaluate(stats, []), None)
    assert [c[:4] for c in _comment_calls(gh)] == [("api", "-X", "POST", "repos/o/r/issues/7/comments")]


def test_comment_edited_in_place_not_duplicated(monkeypatch):
    gh = FakeGh('{"id": 55, "body": "<!-- pr-size-gate -->\\nold"}')
    monkeypatch.setattr(gate, "_gh", gh)
    stats = _stats(_rows_117())
    gate.publish_comment("o/r", 7, stats, gate.evaluate(stats, []), None)
    assert [c[:4] for c in _comment_calls(gh)] == [("api", "-X", "PATCH", "repos/o/r/issues/comments/55")]


def test_no_comment_for_a_pr_that_never_failed(monkeypatch):
    gh = FakeGh()
    monkeypatch.setattr(gate, "_gh", gh)
    stats = _stats([(5, 0, "src/a.ts")])
    gate.publish_comment("o/r", 7, stats, gate.evaluate(stats, []), None)
    assert _comment_calls(gh) == []


def test_resolved_comment_after_the_pr_shrinks(monkeypatch):
    gh = FakeGh('{"id": 55, "body": "<!-- pr-size-gate -->\\nold"}')
    monkeypatch.setattr(gate, "_gh", gh)
    stats = _stats([(5, 0, "src/a.ts")])
    v = gate.evaluate(stats, [])
    gate.publish_comment("o/r", 7, stats, v, None)
    assert [c[:4] for c in _comment_calls(gh)] == [("api", "-X", "PATCH", "repos/o/r/issues/comments/55")]
    assert "now within the limits" in gate.resolved_body(v)


def test_labels_are_read_live_from_the_api_not_the_event_payload(monkeypatch):
    """A re-run replays the ORIGINAL event payload, whose labels predate an
    `ai-review-large` applied since; the gate must see the label to pass."""
    calls = []

    def fake_gh(*args, stdin=None, check=True):
        calls.append(args)
        return subprocess.CompletedProcess(args, 0, "bug\nai-review-large\n", "")
    monkeypatch.setattr(gate, "_gh", fake_gh)
    assert gate.current_labels("o/r", 7) == ["bug", "ai-review-large"]
    assert calls == [("api", "repos/o/r/issues/7/labels", "--paginate", "-q", ".[].name")]
    assert "github.event.pull_request.labels" not in (
        REPO_ROOT / ".github/workflows/pr-size-gate.yml").read_text()


# --------------------------------------------------------------------------
# Fetching base/head: fork PRs (codex P1 on #130)
# --------------------------------------------------------------------------

class FakeGit:
    """Records git commands. `present` = SHAs available locally; a fetch adds
    what the (simulated) origin serves: `pull_ref` for refs/pull/<N>/head and
    `by_sha` for fetches by SHA."""

    def __init__(self, present=(), pull_ref=(), by_sha=(), pull_ref_ok=True):
        self.calls, self.present = [], set(present)
        self.pull_ref, self.by_sha, self.pull_ref_ok = set(pull_ref), set(by_sha), pull_ref_ok

    def __call__(self, cmd, **kw):
        self.calls.append(cmd)
        rc = 0
        if cmd[1] == "fetch":
            spec = cmd[-1]
            if spec.startswith("+refs/pull/"):
                if self.pull_ref_ok:
                    self.present |= self.pull_ref
                else:
                    rc = 128
            elif spec in self.by_sha:
                self.present.add(spec)
            else:
                rc = 128
        elif cmd[1] == "cat-file":
            rc = 0 if cmd[3].removesuffix("^{commit}") in self.present else 1
        return subprocess.CompletedProcess(cmd, rc, "", "" if rc == 0 else "fatal")


BASE, HEAD = "b" * 40, "h" * 40


def test_fork_pr_head_comes_from_the_pull_ref_not_a_branch(monkeypatch):
    """A fork PR: the base repo has the base commit and refs/pull/<N>/head,
    and no origin/<head_ref> branch."""
    git = FakeGit(present={BASE}, pull_ref={HEAD})
    monkeypatch.setattr(gate.subprocess, "run", git)
    gate.ensure_commits(130, BASE, HEAD)
    assert git.calls[0] == ["git", "fetch", "--no-tags", "--quiet", "origin",
                            "+refs/pull/130/head:refs/remotes/pull/130/head"]
    assert git.calls[1:] == [["git", "cat-file", "-e", f"{BASE}^{{commit}}"],
                             ["git", "cat-file", "-e", f"{HEAD}^{{commit}}"]] * 2
    flat = " ".join(" ".join(c) for c in git.calls)
    assert "refs/heads/" not in flat and "origin/" not in flat


def test_pr_head_ref_is_the_base_repos_pull_ref():
    assert gate.pr_head_ref(7) == "refs/pull/7/head"
    assert gate.pr_head_ref("130") == "refs/pull/130/head"
    with pytest.raises(ValueError):
        gate.pr_head_ref("7/head:refs/heads/x")  # the PR number goes into a refspec


def test_head_moved_since_the_event_is_fetched_by_sha(monkeypatch):
    """refs/pull/<N>/head moved on (force-push after the event): fetch the
    event's head SHA directly."""
    git = FakeGit(present={BASE}, pull_ref={"n" * 40}, by_sha={HEAD})
    monkeypatch.setattr(gate.subprocess, "run", git)
    gate.ensure_commits(7, BASE, HEAD)
    assert ["git", "fetch", "--no-tags", "--quiet", "origin", HEAD] in git.calls
    assert ["git", "fetch", "--no-tags", "--quiet", "origin", BASE] not in git.calls


def test_missing_base_is_fetched_by_sha(monkeypatch):
    git = FakeGit(present=set(), pull_ref={HEAD}, by_sha={BASE})
    monkeypatch.setattr(gate.subprocess, "run", git)
    gate.ensure_commits(7, BASE, HEAD)
    assert ["git", "fetch", "--no-tags", "--quiet", "origin", BASE] in git.calls


def test_pull_ref_fetch_failure_falls_back_to_sha(monkeypatch):
    git = FakeGit(present={BASE}, pull_ref={HEAD}, by_sha={HEAD}, pull_ref_ok=False)
    monkeypatch.setattr(gate.subprocess, "run", git)
    gate.ensure_commits(7, BASE, HEAD)
    assert HEAD in git.present


def test_unfetchable_commit_fails_closed(monkeypatch):
    git = FakeGit(present={BASE}, pull_ref=set(), by_sha=set())
    monkeypatch.setattr(gate.subprocess, "run", git)
    with pytest.raises(RuntimeError, match=HEAD):
        gate.ensure_commits(7, BASE, HEAD)


def _main_env(monkeypatch, tmp_path):
    monkeypatch.setenv("GITHUB_STEP_SUMMARY", str(tmp_path / "s.md"))
    monkeypatch.setattr(gate, "current_labels", lambda r, p: [])
    monkeypatch.setattr(gate, "git_stats", lambda b, h: _stats([(5, 0, "a.ts")]))
    argv = ["--repo", "o/r", "--pr", "7", "--base", BASE, "--head", HEAD]
    return argv, tmp_path / "s.md"


def test_main_fetches_only_with_the_flag(monkeypatch, tmp_path):
    argv, _ = _main_env(monkeypatch, tmp_path)
    fetched = []
    monkeypatch.setattr(gate, "ensure_commits", lambda *a: fetched.append(a))
    assert gate.main(argv) == 0 and fetched == []
    assert gate.main(argv + ["--fetch"]) == 0 and fetched == [(7, BASE, HEAD)]


def test_main_fails_closed_with_a_summary_when_it_cannot_measure(monkeypatch, tmp_path, capsys):
    argv, summary = _main_env(monkeypatch, tmp_path)

    def boom(*a):
        raise RuntimeError("cannot fetch hhh")
    monkeypatch.setattr(gate, "ensure_commits", boom)
    assert gate.main(argv + ["--fetch"]) == 1
    assert "could not measure" in summary.read_text()
    assert "::error title=PR Size could not measure the PR::" in capsys.readouterr().out


def test_label_read_failure_fails_closed_with_a_summary(monkeypatch, tmp_path):
    argv, summary = _main_env(monkeypatch, tmp_path)

    def boom(*a):
        raise RuntimeError("gh api failed (1): HTTP 502")
    monkeypatch.setattr(gate, "current_labels", boom)
    assert gate.main(argv) == 1
    assert "HTTP 502" in summary.read_text()


def test_messages_say_to_rerun_both_label_blind_workflows():
    stats = _stats(_rows_117())
    for verdict in (gate.evaluate(stats, []), gate.evaluate(stats, ["ai-review-large"])):
        s = gate.summary_markdown(stats, verdict, "maint")
        assert "Frontend CI and Security Scan" in s and "re-run BOTH" in s
        assert "other CI jobs run" not in s
    s = gate.summary_markdown(stats, gate.evaluate(stats, []))
    assert "FAILS at its first step" in s and "skipped until" not in s


# ── Test-file exemption from the LINE cap (added 2026-10-02) ────────────────
# The gate calls size_stats(exempt_tests=True); the ai-review scope guard does
# not. These pin both halves, because the gate and the guard share one function
# and the guard's 8,000-line limit must keep counting tests.

def _gate_stats(rows, commits=1):
    """Exactly how the gate computes stats: size_stats(..., exempt_tests=True)."""
    stats = gate.size_stats("\n".join(f"{a}\t{r}\t{p}" for a, r, p in rows),
                            exempt_tests=True)
    stats["commits"] = commits
    return stats


def test_test_lines_do_not_count_toward_the_line_cap():
    # Shape of careerbot-web #144: 550 production + 948 test lines. It measured
    # 1,498/1,500 and the cap then blocked an 11-line correctness fix.
    rows = [(550, 0, "src/utils/resumeMappers.ts"),
            (948, 0, "src/tests/unit/utils/resumeMapperCgpa.test.ts")]
    stats = _gate_stats(rows)
    assert stats["added"] == 550, "production lines only"
    assert stats["tests_added"] == 948
    assert stats["added_total"] == 1498, "the raw diff is unchanged"
    assert gate.evaluate(stats, [])["passed"] is True


def test_a_test_only_pr_can_never_trip_the_line_cap():
    stats = _gate_stats([(9000, 0, "src/tests/unit/huge.test.ts")])
    assert stats["added"] == 0 and stats["tests_added"] == 9000
    assert gate.evaluate(stats, [])["passed"] is True


def test_test_files_still_count_as_files_and_the_file_cap_still_bites():
    rows = [(1, 0, f"src/tests/unit/f{i}.test.ts") for i in range(gate.MAX_FILES + 1)]
    stats = _gate_stats(rows)
    assert stats["added"] == 0, "no lines counted"
    assert stats["files"] == gate.MAX_FILES + 1
    verdict = gate.evaluate(stats, [])
    assert verdict["passed"] is False
    assert any("files" in t for t in verdict["tripped"])


def test_production_code_is_still_capped():
    stats = _gate_stats([(gate.MAX_ADDED_LINES + 1, 0, "src/app/big.tsx")])
    assert gate.evaluate(stats, [])["passed"] is False


def test_generated_wins_over_test():
    """A checked-in bundle under __tests__ is generated, not a test."""
    stats = _gate_stats([(100, 0, "src/__tests__/vendor.min.js")])
    assert stats["excluded_added"] == 100 and stats["tests_added"] == 0


@pytest.mark.parametrize("path", [
    "src/a.test.ts", "src/a.test.tsx", "src/a.spec.ts", "src/a.spec.tsx",
    "src/a.test.js", "src/a.spec.jsx",
    "src/__tests__/helper.ts", "src/__mocks__/axios.ts", "src/__fixtures__/resume.json",
])
def test_is_test_matches_the_project_s_test_shapes(path):
    assert review.is_test(path)


@pytest.mark.parametrize("path", [
    "src/app/page.tsx", "src/utils/latest.ts", "src/lib/contest.ts",
    "src/testimonials.ts", "src/app/protest/page.tsx",
])
def test_is_test_does_not_fire_on_production_paths(path):
    """'test'/'spec' inside a longer word must not match -- `latest.ts`,
    `contest.ts`, `testimonials.ts` are production files."""
    assert not review.is_test(path)


def test_the_scope_guard_default_still_counts_test_lines():
    """THE REGRESSION GUARD. size_stats is shared with the ai-review scope
    guard's 8,000-line limit, which must keep counting tests: a 9,000-line diff
    is unreviewable whatever is in it. Only the gate opts out."""
    rows = [(9000, 0, "src/tests/unit/huge.test.ts")]
    assert gate.size_stats("\n".join(f"{a}\t{r}\t{p}" for a, r, p in rows))["added"] == 9000
    assert review.size_stats("\n".join(f"{a}\t{r}\t{p}" for a, r, p in rows))["added"] == 9000


def test_the_report_never_calls_a_test_file_generated():
    """A hand-written test is not generated; saying so in the report would be a
    false statement about the code."""
    stats = _gate_stats([(10, 0, "src/app/page.tsx"),
                         (900, 0, "src/tests/unit/a.test.ts"),
                         (17393, 0, "package-lock.json")])
    s = gate.summary_markdown(stats, gate.evaluate(stats, []))
    assert "Excluded test added lines | 900" in s
    assert "Excluded test files" in s and "`src/tests/unit/a.test.ts`" in s
    # the test file must appear under the TEST heading, not the generated one
    generated_block = s.split("Excluded generated files")[1].split("Excluded test files")[0]
    assert "a.test.ts" not in generated_block
