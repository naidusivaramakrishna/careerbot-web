"""Tests for the ai-review scope guard: which limit tripped, generated-file
exclusion from the added-lines count, and the `ai-review-large` size override.

#117 (13 files, +9,204) was refused with a message that printed every stat and
named no limit, so its author could not tell what to fix. #114 was refused with
17,393 of its added lines in one regenerated `cs-chatbot/package-lock.json`.

Kept apart from test_ai_review_gate.py, which is the suite shared verbatim with
careerbot-ai and careerbot-api.
"""

import importlib.util
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT = REPO_ROOT / "scripts" / "ai_review" / "ai_pr_review.py"


def _load_review_module():
    spec = importlib.util.spec_from_file_location("ai_pr_review_scope", SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["ai_pr_review_scope"] = mod
    spec.loader.exec_module(mod)
    return mod


gate = _load_review_module()
BASE, HEAD = "b" * 40, "0123abcd" * 5  # hex: MARKER_RE only matches a real SHA


def _numstat(rows):
    """rows: [(added, removed, path)]; added/removed may be '-' (binary)."""
    return "\n".join(f"{a}\t{r}\t{p}" for a, r, p in rows)


def _fake_git(monkeypatch, rows, commits=1, authors=1, deleted=()):
    def fake_out(cmd, **kw):
        if cmd[:3] == ["git", "diff", "--numstat"]:
            return _numstat(rows)
        if cmd[:3] == ["git", "diff", "--diff-filter=D"]:
            return "\n".join(deleted)
        if cmd[:3] == ["git", "rev-list", "--count"]:
            return str(commits)
        if cmd[:2] == ["git", "log"]:
            return "\n".join(f"author{i}" for i in range(authors))
        raise AssertionError(f"unexpected command {cmd}")
    monkeypatch.setattr(gate, "out", fake_out)


def _guard(monkeypatch, rows, **kw):
    _fake_git(monkeypatch, rows, **kw)
    return gate.scope_guard(BASE, HEAD)


def _rows_117():
    """13 hand-written files, 9,204 added lines, nothing generated."""
    rows = [(700, 3, f"src/app/feature/file{i}.tsx") for i in range(12)]
    rows.append((9204 - 700 * 12, 0, "src/app/feature/page.tsx"))
    return rows


# --------------------------------------------------------------------------
# Which limit tripped
# --------------------------------------------------------------------------

class TestTheTrippedLimitIsNamed:
    def test_pr_117_shape_names_the_added_lines_limit(self, monkeypatch):
        ok, reason, stats = _guard(monkeypatch, _rows_117())
        assert not ok
        assert (stats["files"], stats["added"]) == (13, 9204)
        assert reason == "added lines 9,204 > 8,000"
        assert gate.limits_line(stats) == (
            "added lines 9,204 > 8,000 — files 13 ≤ 120 ✓, commits 1 ≤ 40 ✓, authors 1 ≤ 4 ✓")

    def test_files_limit(self, monkeypatch):
        ok, reason, stats = _guard(monkeypatch, [(1, 0, f"src/f{i}.ts") for i in range(121)])
        assert not ok and reason == "files 121 > 120"
        assert "added lines 121 ≤ 8,000 ✓" in gate.limits_line(stats)

    def test_commits_limit(self, monkeypatch):
        ok, reason, stats = _guard(monkeypatch, [(5, 0, "src/a.ts")], commits=41)
        assert not ok and reason == "commits 41 > 40"
        assert gate.limits_line(stats).startswith("commits 41 > 40 — ")

    def test_authors_limit(self, monkeypatch):
        ok, reason, stats = _guard(monkeypatch, [(5, 0, "src/a.ts")], authors=5)
        assert not ok and reason == "authors 5 > 4"
        assert gate.limits_line(stats).endswith("commits 1 ≤ 40 ✓")

    def test_multiple_limits_are_all_named(self, monkeypatch):
        ok, reason, stats = _guard(monkeypatch, [(100, 0, f"src/f{i}.ts") for i in range(130)],
                                   commits=50, authors=2)
        assert not ok
        assert reason == "added lines 13,000 > 8,000; files 130 > 120; commits 50 > 40"
        assert gate.limits_line(stats) == (
            "added lines 13,000 > 8,000; files 130 > 120; commits 50 > 40 — authors 2 ≤ 4 ✓")

    def test_exactly_at_every_cap_passes(self, monkeypatch):
        rows = [(1, 0, f"src/f{i}.ts") for i in range(119)] + [(8000 - 119, 0, "src/big.ts")]
        ok, reason, stats = _guard(monkeypatch, rows, commits=40, authors=4)
        assert ok and reason == ""
        assert " > " not in gate.limits_line(stats)


# --------------------------------------------------------------------------
# Generated files
# --------------------------------------------------------------------------

GENERATED = [
    "package-lock.json", "cs-chatbot/package-lock.json", "yarn.lock", "web/pnpm-lock.yaml",
    "npm-shrinkwrap.json", "public/vendor/lib.min.js", "public/theme.min.css",
    "public/app.js.map", "styles/site.css.map",
    "src/components/__snapshots__/Button.test.tsx.snap", "__snapshots__/x.snap",
]
NOT_GENERATED = [
    "src/app/page.ts", "src/app/page.tsx", "src/styles/global.css", "public/logo.svg",
    "src/lib/sitemap.ts", "src/lib/admin.js", "package.json", "docs/package-lock.json.md",
    "src/components/Button.snap", "src/snapshots/x.snap", "src/yarn.lock.ts",
]


class TestGeneratedFilePatterns:
    @pytest.mark.parametrize("path", GENERATED)
    def test_generated(self, path):
        assert gate.is_generated(path)

    @pytest.mark.parametrize("path", NOT_GENERATED)
    def test_real_source_is_not_generated(self, path):
        """SVG and CSS are hand-edited: a large change to them must be counted."""
        assert not gate.is_generated(path)

    def test_patterns_live_in_one_constant(self):
        assert set(gate.GENERATED_FILE_PATTERNS) == {
            "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "npm-shrinkwrap.json",
            "*.min.js", "*.min.css", "*.map", "**/__snapshots__/*.snap"}

    @pytest.mark.parametrize("field,dest", [
        ("old.json => package-lock.json", "package-lock.json"),
        ("cs-chatbot/{pkg.json => package-lock.json}", "cs-chatbot/package-lock.json"),
        ("{a => b}/yarn.lock", "b/yarn.lock"),
        ("src/{ => sub}/a.ts", "src/sub/a.ts"),
        ('"weird dir/package-lock.json"', "weird dir/package-lock.json"),
        # verbatim `git diff --numstat` path fields (git 2.43) for a file under
        # "café/", and for a rename there -- each side quoted separately
        ('"caf\\303\\251/package-lock.json"', "café/package-lock.json"),
        ('"caf\\303\\251/a.json" => "caf\\303\\251/yarn.lock"', "café/yarn.lock"),
        ('"caf\\303\\251/yarn.lock" => "caf\\303\\251/a.json"', "café/a.json"),
    ])
    def test_renames_are_judged_by_their_destination(self, field, dest):
        assert gate._numstat_path(field) == dest
        assert gate.is_generated(field) is gate.is_generated(dest)


class TestGeneratedFilesAreExcludedFromAddedLinesOnly:
    def test_pr_114_shape_counts_only_the_hand_written_lines(self, monkeypatch):
        rows = [(17393, 2100, "cs-chatbot/package-lock.json"),
                (240, 10, "cs-chatbot/src/Chat.tsx"), (60, 0, "cs-chatbot/package.json")]
        ok, reason, stats = _guard(monkeypatch, rows)
        assert ok, reason
        assert stats["added"] == 300
        assert stats["added_total"] == 17693
        assert stats["excluded"] == [("cs-chatbot/package-lock.json", 17393)]
        assert stats["excluded_added"] == 17393
        assert stats["files"] == 3, "generated files still count as files"
        assert stats["removed"] == 2110, "removed lines are not filtered"
        assert gate.size_line(stats) == (
            "reviewable +300 lines; excluded generated +17,393 lines: "
            "`cs-chatbot/package-lock.json` (+17,393)")

    def test_every_generated_kind_is_excluded_and_listed(self, monkeypatch):
        rows = [(1000, 0, p) for p in GENERATED] + [(10, 0, "src/a.ts")]
        ok, _reason, stats = _guard(monkeypatch, rows)
        assert ok
        assert stats["added"] == 10
        assert stats["excluded_added"] == 1000 * len(GENERATED)
        line = gate.size_line(stats)
        for p in GENERATED:
            assert f"`{p}` (+1,000)" in line

    def test_real_ts_css_svg_are_counted(self, monkeypatch):
        rows = [(3000, 0, "src/app/page.ts"), (3000, 0, "src/styles/global.css"),
                (3000, 0, "public/logo.svg")]
        ok, reason, stats = _guard(monkeypatch, rows)
        assert not ok and reason == "added lines 9,000 > 8,000"
        assert stats["excluded"] == []
        assert gate.size_line(stats).endswith("excluded generated +0 lines: none")

    def test_generated_files_still_count_toward_the_files_limit(self, monkeypatch):
        rows = [(1, 0, f"pkg{i}/package-lock.json") for i in range(121)]
        ok, reason, stats = _guard(monkeypatch, rows)
        assert not ok and reason == "files 121 > 120"
        assert stats["added"] == 0

    def test_binary_files_still_count_zero(self, monkeypatch):
        ok, _reason, stats = _guard(monkeypatch, [("-", "-", "public/img.png"),
                                                  ("-", "-", "public/app.js.map"),
                                                  (5, 1, "src/a.ts")])
        assert ok
        assert (stats["files"], stats["added"], stats["removed"]) == (3, 5, 1)
        assert stats["excluded"] == [("public/app.js.map", 0)]

    def test_generated_lines_alone_can_no_longer_trip_the_cap(self, monkeypatch):
        ok, _r, stats = _guard(monkeypatch, [(9000, 0, "yarn.lock"), (7000, 0, "src/a.ts")])
        assert ok and stats["added"] == 7000
        ok, reason, _s = _guard(monkeypatch, [(9000, 0, "yarn.lock"), (8001, 0, "src/a.ts")])
        assert not ok and reason == "added lines 8,001 > 8,000"


class TestGeneratedFilesAreNamedToTheModels:
    """The review tiers read the diff themselves, so the scope guard's list does
    not feed them. They are told which files are generated (don't spend tokens
    on them) but the files are still named, never silently dropped."""

    def test_no_note_when_nothing_is_generated(self):
        assert gate.generated_note({"excluded": []}) == ""
        assert gate.generated_note({}) == ""

    def test_note_lists_each_generated_file(self):
        note = gate.generated_note({"excluded": [("cs-chatbot/package-lock.json", 17393)]})
        assert "cs-chatbot/package-lock.json (+17393)" in note
        assert "do NOT read" in note

    def test_claude_prompt_carries_the_note(self, monkeypatch):
        seen = {}

        def fake_run(cmd, **kw):
            seen["prompt"] = cmd[-1]
            return subprocess.CompletedProcess(cmd, 0, "### no findings", "")
        monkeypatch.setattr(gate, "run", fake_run)
        gate.claude_pass(BASE, HEAD, "ctx", generated="\nGENERATED FILES: yarn.lock\n")
        assert "GENERATED FILES: yarn.lock" in seen["prompt"]
        gate.claude_pass(BASE, HEAD, "ctx")
        assert "{generated}" not in seen["prompt"]

    def test_codex_prompt_carries_the_note(self, monkeypatch):
        seen = {}

        def fake_run(cmd, stdin=None, **kw):
            seen["prompt"] = stdin
            return subprocess.CompletedProcess(cmd, 0, "ok", "")
        monkeypatch.setattr(gate, "run", fake_run)
        gate.codex_pass(BASE, HEAD, "review", "ctx", generated="\nGENERATED FILES: a.map\n")
        assert "GENERATED FILES: a.map" in seen["prompt"]


class TestReportScopeLine:
    def _stats(self, **extra):
        s = {"files": 3, "added": 300, "added_total": 17693, "removed": 5, "commits": 1,
             "authors": 1, "deleted": [],
             "excluded": [("cs-chatbot/package-lock.json", 17393)], "excluded_added": 17393}
        s.update(extra)
        return s

    def test_normal_report_lists_excluded_files(self):
        body = gate.build_report(HEAD, self._stats(), "no findings", "ok", None, None)
        assert ("**Size:** reviewable +300 lines; excluded generated +17,393 lines: "
                "`cs-chatbot/package-lock.json` (+17,393).") in body
        assert "+17693/-5 lines" in body
        assert "overridden" not in body

    def test_report_without_new_keys_still_renders(self):
        """Callers (and the shared gate tests) pass the old minimal stats."""
        body = gate.build_report(HEAD, {"files": 1, "added": 1, "removed": 0, "commits": 1,
                                        "authors": 1, "deleted": []}, "x", "y", None, None)
        assert "reviewable +1 lines; excluded generated +0 lines: none" in body

    def test_excluded_files_list_does_not_count_as_findings(self):
        stats = self._stats(excluded=[("src/[P0]/__snapshots__/a.snap", 5)])
        body = gate.build_report(HEAD, stats, "no findings", "ok", None, None)
        assert gate.blocking_findings(body)[0] == 0


# --------------------------------------------------------------------------
# review_one: rejection message, ai-review-large override
# --------------------------------------------------------------------------

class _Harness:
    """Drive review_one with git/gh/models stubbed out."""

    def __init__(self, monkeypatch, rows, labels=(), prior=None, actor="alice"):
        self.posted, self.reviewed = [], []
        monkeypatch.setattr(gate, "pr_meta", lambda *a, **k: {
            "baseRefOid": BASE, "headRefOid": HEAD,
            "labels": [{"name": n} for n in labels]})
        monkeypatch.setattr(gate, "run", lambda *a, **k: None)
        monkeypatch.setattr(gate, "existing_review_sha",
                            lambda *a, **k: (1, HEAD) if prior else (None, None))
        monkeypatch.setattr(gate, "existing_review_body", lambda *a, **k: prior)
        _fake_git(monkeypatch, rows)
        monkeypatch.setattr(gate, "upsert_comment",
                            lambda repo, pr, body: self.posted.append(body))
        monkeypatch.setattr(gate, "label_actor", lambda *a, **k: actor)
        monkeypatch.setattr(gate, "pr_context", lambda *a, **k: "")

        def claude(base, head, context, generated=""):
            self.reviewed.append(generated)
            return "No issues found.", True
        monkeypatch.setattr(gate, "claude_pass", claude)
        monkeypatch.setattr(gate, "codex_pass", lambda *a, **k: "ok")
        monkeypatch.setattr(gate, "run_dynamic", lambda *a, **k: None)
        monkeypatch.setattr(gate, "run_live_llm", lambda *a, **k: None)

    def run(self):
        return gate.review_one("o/r", 117, {}, False, False, False, False)


class TestScopeGuardRejection:
    def test_rejection_names_the_limit_and_keeps_both_markers(self, monkeypatch, capsys):
        h = _Harness(monkeypatch, _rows_117())
        assert h.run() == 1
        assert h.reviewed == [], "nothing may be reviewed"
        (body,) = h.posted
        assert ("**Limit exceeded:** added lines 9,204 > 8,000 — files 13 ≤ 120 ✓, "
                "commits 1 ≤ 40 ✓, authors 1 ≤ 4 ✓") in body
        assert "reviewable +9,204 lines; excluded generated +0 lines: none" in body
        assert gate.MARKER.format(sha=HEAD) in body
        assert gate.SCOPE_GUARD_MARKER in body
        assert gate.MARKER_RE.search(body).group(1) == HEAD
        assert gate.SIZE_OVERRIDE_LABEL in body and gate.WAIVER_LABEL in body
        assert "stats {" not in body, "no raw dict dump"
        err = capsys.readouterr().out
        assert "::error::" in err and "added lines 9,204 > 8,000" in err

    def test_rejection_lists_generated_files(self, monkeypatch):
        rows = [(17393, 0, "cs-chatbot/package-lock.json"), (8100, 0, "src/a.ts")]
        h = _Harness(monkeypatch, rows)
        assert h.run() == 1
        (body,) = h.posted
        assert "added lines 8,100 > 8,000" in body
        assert "`cs-chatbot/package-lock.json` (+17,393)" in body

    def test_waiver_behaviour_is_unchanged(self, monkeypatch):
        """ai-review-waive still ships an oversized PR UNREVIEWED, green."""
        h = _Harness(monkeypatch, _rows_117(), labels=(gate.WAIVER_LABEL,))
        assert h.run() == 0
        assert h.reviewed == []
        assert gate.SCOPE_GUARD_MARKER in h.posted[0]


class TestSizeOverrideLabel:
    def test_label_constant(self):
        assert gate.SIZE_OVERRIDE_LABEL == "ai-review-large"
        assert gate.SIZE_OVERRIDE_LABEL != gate.WAIVER_LABEL

    def test_detected_like_the_waiver(self):
        assert gate.has_size_override({}) is False
        assert gate.has_size_override({"labels": [None, {}, {"name": "ci"}]}) is False
        assert gate.has_size_override({"labels": [{"name": "ai-review-large"}]}) is True
        assert gate.has_size_override({"labels": [{"name": gate.WAIVER_LABEL}]}) is False
        assert gate.has_waiver({"labels": [{"name": "ai-review-large"}]}) is False

    def test_label_lifts_the_caps_and_the_report_says_so(self, monkeypatch, capsys):
        h = _Harness(monkeypatch, _rows_117(), labels=("ai-review-large",))
        assert h.run() == 0
        assert len(h.reviewed) == 1, "the review ran"
        (body,) = h.posted
        assert gate.SCOPE_GUARD_MARKER not in body
        assert "Size limits overridden by label ai-review-large (added by alice)" in body
        assert "Over the limit: added lines 9,204 > 8,000" in body
        assert body.index("overridden") < body.index("T1 · Claude static review")
        assert "::warning::" in capsys.readouterr().out

    def test_unknown_actor_is_stated_not_hidden(self, monkeypatch):
        h = _Harness(monkeypatch, _rows_117(), labels=("ai-review-large",), actor=None)
        assert h.run() == 0
        assert "(added by unknown (label events unreadable))" in h.posted[0]

    def test_label_lifts_every_cap(self, monkeypatch):
        rows = [(100, 0, f"src/f{i}.ts") for i in range(130)]
        h = _Harness(monkeypatch, rows, labels=("ai-review-large",))
        _fake_git(monkeypatch, rows, commits=60, authors=9)
        assert h.run() == 0
        assert ("Over the limit: added lines 13,000 > 8,000; files 130 > 120; "
                "commits 60 > 40; authors 9 > 4") in h.posted[0]

    def test_findings_still_block_under_the_override(self, monkeypatch):
        h = _Harness(monkeypatch, _rows_117(), labels=("ai-review-large",))
        monkeypatch.setattr(gate, "claude_pass",
                            lambda *a, **k: ("### [P1] broken\n`src/a.ts:1` x", True))
        assert h.run() == 1

    def test_generated_files_are_named_to_the_reviewer(self, monkeypatch):
        h = _Harness(monkeypatch, [(17393, 0, "yarn.lock"), (10, 0, "src/a.ts")])
        assert h.run() == 0
        assert "yarn.lock (+17393)" in h.reviewed[0]

    def test_label_absent_small_pr_unchanged(self, monkeypatch):
        h = _Harness(monkeypatch, [(10, 0, "src/a.ts")])
        assert h.run() == 0
        assert len(h.reviewed) == 1
        assert "overridden" not in h.posted[0]

    def test_rerun_after_refusal_reviews_once_the_label_is_applied(self, monkeypatch):
        """The refusal carries the head-SHA marker, so the run started by the
        `labeled` event takes the skip path. With the label it must fall
        through to a real review, not replay the refusal."""
        prior = (f"## SCOPE GUARD\n<sub>{gate.MARKER.format(sha=HEAD)}</sub>\n"
                 f"<sub>{gate.SCOPE_GUARD_MARKER}</sub>")
        h = _Harness(monkeypatch, _rows_117(), labels=("ai-review-large",), prior=prior)
        assert h.run() == 0
        assert len(h.reviewed) == 1
        assert "Size limits overridden by label ai-review-large" in h.posted[0]

    def test_rerun_after_refusal_without_the_label_stays_red(self, monkeypatch):
        prior = (f"## SCOPE GUARD\n<sub>{gate.MARKER.format(sha=HEAD)}</sub>\n"
                 f"<sub>{gate.SCOPE_GUARD_MARKER}</sub>")
        h = _Harness(monkeypatch, _rows_117(), prior=prior)
        assert h.run() == 1
        assert h.reviewed == [] and h.posted == []


class TestLabelActor:
    def test_last_labeler_wins(self, monkeypatch):
        seen = {}

        def fake_run(cmd, **kw):
            seen["cmd"] = cmd
            return subprocess.CompletedProcess(cmd, 0, "bob\nalice\n", "")
        monkeypatch.setattr(gate, "run", fake_run)
        assert gate.label_actor("o/r", 5, "ai-review-large") == "alice"
        assert "repos/o/r/issues/5/events" in seen["cmd"]
        assert any('.label.name == "ai-review-large"' in c for c in seen["cmd"])

    @pytest.mark.parametrize("proc", [
        subprocess.CompletedProcess([], 1, "", "boom"),
        subprocess.CompletedProcess([], 0, "", ""),
        None,
    ])
    def test_unreadable_log_is_none(self, monkeypatch, proc):
        monkeypatch.setattr(gate, "run", lambda *a, **k: proc)
        assert gate.label_actor("o/r", 5, "ai-review-large") is None
