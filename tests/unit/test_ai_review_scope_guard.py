"""Tests for the ai-review scope guard: which limit tripped, generated-file
exclusion from the added-lines count, and the `ai-review-large` size override.

#117 (13 files, +9,204) was refused with a message that printed every stat and
named no limit, so its author could not tell what to fix. #114 was refused with
17,393 of its added lines in one regenerated `cs-chatbot/package-lock.json`.

Kept apart from test_ai_review_gate.py, which is the suite shared verbatim with
careerbot-ai and careerbot-api.
"""

import importlib.util
import json
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

    def __init__(self, monkeypatch, rows, labels=(), prior=None, actor="alice",
                 lock_diff="", real_label_actor=False):
        self.posted, self.reviewed, self.cmds = [], [], []
        monkeypatch.setattr(gate, "pr_meta", lambda *a, **k: {
            "baseRefOid": BASE, "headRefOid": HEAD,
            "labels": [{"name": n} for n in labels]})

        def fake_run(cmd, **kw):
            self.cmds.append(cmd)
            if cmd[:3] == ["git", "--literal-pathspecs", "diff"]:
                return subprocess.CompletedProcess(cmd, 0, lock_diff, "")
            if "events" in " ".join(cmd):
                raise subprocess.TimeoutExpired(cmd, kw.get("timeout") or 60)
            return None
        monkeypatch.setattr(gate, "run", fake_run)
        monkeypatch.setattr(gate, "existing_review_sha",
                            lambda *a, **k: (1, HEAD) if prior else (None, None))
        monkeypatch.setattr(gate, "existing_review_body", lambda *a, **k: prior)
        _fake_git(monkeypatch, rows)
        monkeypatch.setattr(gate, "upsert_comment",
                            lambda repo, pr, body: self.posted.append(body))
        if not real_label_actor:
            monkeypatch.setattr(gate, "label_actor", lambda *a, **k: actor)
        monkeypatch.setattr(gate, "pr_context", lambda *a, **k: "")

        def claude(base, head, context, generated=""):
            self.reviewed.append(generated)
            return self.claude_text, True
        self.claude_text = "No issues found."
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

    def test_a_timeout_reading_the_event_log_is_none(self, monkeypatch):
        """run() lets subprocess.TimeoutExpired escape. A slow `--paginate`
        over a long event log must degrade to "actor unknown", not abort."""
        def slow(cmd, **kw):
            raise subprocess.TimeoutExpired(cmd, kw.get("timeout"))
        monkeypatch.setattr(gate, "run", slow)
        assert gate.label_actor("o/r", 5, "ai-review-large") is None

    def test_an_os_error_is_none(self, monkeypatch):
        def missing(cmd, **kw):
            raise FileNotFoundError("gh")
        monkeypatch.setattr(gate, "run", missing)
        assert gate.label_actor("o/r", 5, "ai-review-large") is None

    def test_the_review_still_runs_when_the_event_log_times_out(self, monkeypatch):
        """End to end: the harness's run() raises TimeoutExpired for the events
        call; the review must be posted, saying the actor is unknown."""
        h = _Harness(monkeypatch, _rows_117(), labels=("ai-review-large",),
                     real_label_actor=True)
        assert h.run() == 0
        assert len(h.reviewed) == 1, "the review ran"
        assert any("events" in " ".join(c) for c in h.cmds), "the event log was asked"
        assert "(added by unknown (label events unreadable))" in h.posted[0]


# --------------------------------------------------------------------------
# Removing ai-review-large re-applies the caps at the same head
# --------------------------------------------------------------------------

def _prior_review(override, findings="No issues found."):
    """A posted review at HEAD, as build_report writes it."""
    stats = {"files": 13, "added": 9204, "added_total": 9204, "removed": 0,
             "commits": 1, "authors": 1, "excluded": [], "excluded_added": 0}
    if override:
        stats["size_override"] = {"actor": "alice"}
    return gate.build_report(HEAD, stats, findings, "ok", None, None)


class TestRemovingTheSizeOverrideLabel:
    def test_the_override_report_carries_a_hidden_marker(self):
        assert gate.SIZE_OVERRIDE_MARKER in _prior_review(override=True)
        assert gate.SIZE_OVERRIDE_MARKER not in _prior_review(override=False)
        assert gate.SIZE_OVERRIDE_MARKER.startswith("<!--")

    def test_the_marker_is_not_a_finding(self):
        assert gate.blocking_findings(_prior_review(override=True))[1] == \
            {"P0": 0, "P1": 0, "P2": 0, "P3": 0}

    def test_label_added_reviews(self, monkeypatch):
        h = _Harness(monkeypatch, _rows_117(), labels=("ai-review-large",))
        assert h.run() == 0 and len(h.reviewed) == 1
        assert gate.SIZE_OVERRIDE_MARKER in h.posted[0]

    def test_label_removed_is_refused_again(self, monkeypatch, capsys):
        """The `unlabeled` run hits the skip path (same head). Carrying the
        prior verdict forward kept an oversized PR green without its label."""
        h = _Harness(monkeypatch, _rows_117(), prior=_prior_review(override=True))
        assert h.run() == 1
        assert h.reviewed == [], "no new review is spent on it"
        assert h.posted == [], "the existing review comment is left intact"
        err = capsys.readouterr().out
        assert "::error::" in err and "added lines 9,204 > 8,000" in err
        assert gate.SIZE_OVERRIDE_LABEL in err

    def test_label_removed_can_still_be_waived(self, monkeypatch, capsys):
        h = _Harness(monkeypatch, _rows_117(), labels=(gate.WAIVER_LABEL,),
                     prior=_prior_review(override=True))
        assert h.run() == 0
        assert "::warning::" in capsys.readouterr().out

    def test_label_removed_but_now_within_caps_carries_the_verdict(self, monkeypatch):
        h = _Harness(monkeypatch, [(10, 0, "src/a.ts")], prior=_prior_review(override=True))
        assert h.run() == 0 and h.reviewed == [] and h.posted == []
        prior = _prior_review(override=True, findings="### [P1] broken\n`src/a.ts:1` x")
        h = _Harness(monkeypatch, [(10, 0, "src/a.ts")], prior=prior)
        assert h.run() == 1, "findings from the prior review still block"

    def test_label_still_present_carries_the_verdict(self, monkeypatch):
        h = _Harness(monkeypatch, _rows_117(), labels=("ai-review-large",),
                     prior=_prior_review(override=True))
        assert h.run() == 0 and h.reviewed == [] and h.posted == []

    def test_unrelated_rerun_without_label_history_is_unchanged(self, monkeypatch):
        """A prior review never done under the override skips exactly as before
        -- the scope guard is not re-run (no git calls at all)."""
        h = _Harness(monkeypatch, [(10, 0, "src/a.ts")], prior=_prior_review(override=False))
        monkeypatch.setattr(gate, "out", lambda *a, **k: (_ for _ in ()).throw(
            AssertionError("the skip path must not re-run the scope guard")))
        assert h.run() == 0 and h.reviewed == [] and h.posted == []


# --------------------------------------------------------------------------
# Lockfile check: deterministic registry / integrity scan of lockfile diffs
# --------------------------------------------------------------------------

def _npm_diff(body, path="package-lock.json", start=10):
    return (f"diff --git a/{path} b/{path}\nindex 1..2 100644\n--- a/{path}\n+++ b/{path}\n"
            f"@@ -{start},9 +{start},9 @@\n{body}")


NPM_OK = _npm_diff(
    '     "node_modules/left-pad": {\n'
    '-      "version": "1.2.0",\n'
    '-      "resolved": "https://registry.npmjs.org/left-pad/-/left-pad-1.2.0.tgz",\n'
    '-      "integrity": "sha512-AAAA",\n'
    '+      "version": "1.3.0",\n'
    '+      "resolved": "https://registry.npmjs.org/left-pad/-/left-pad-1.3.0.tgz",\n'
    '+      "integrity": "sha512-BBBB",\n'
    '       "license": "MIT"\n'
    '     },\n')

NPM_OTHER_HOST = _npm_diff(
    '     "node_modules/left-pad": {\n'
    '       "version": "1.3.0",\n'
    '-      "resolved": "https://registry.npmjs.org/left-pad/-/left-pad-1.3.0.tgz",\n'
    '+      "resolved": "https://evil.example.com/left-pad-1.3.0.tgz",\n'
    '       "integrity": "sha512-BBBB",\n'
    '       "license": "MIT"\n'
    '     },\n')

NPM_GIT = _npm_diff(
    '+    "node_modules/foo": {\n'
    '+      "version": "1.0.0",\n'
    '+      "resolved": "git+https://github.com/someone/foo.git#abc123",\n'
    '+      "license": "MIT"\n'
    '+    },\n')

NPM_INTEGRITY_ONLY = _npm_diff(
    '     "node_modules/left-pad": {\n'
    '       "version": "1.3.0",\n'
    '       "resolved": "https://registry.npmjs.org/left-pad/-/left-pad-1.3.0.tgz",\n'
    '-      "integrity": "sha512-BBBB",\n'
    '+      "integrity": "sha512-EVIL",\n'
    '       "license": "MIT"\n'
    '     },\n', start=40)

NPM_ALGO_UPGRADE = _npm_diff(
    '     "node_modules/left-pad": {\n'
    '       "version": "1.3.0",\n'
    '       "resolved": "https://registry.npmjs.org/left-pad/-/left-pad-1.3.0.tgz",\n'
    '-      "integrity": "sha1-OLD",\n'
    '+      "integrity": "sha512-NEW",\n'
    '       "license": "MIT"\n'
    '     },\n')

YARN_DIFF = (
    "diff --git a/yarn.lock b/yarn.lock\n--- a/yarn.lock\n+++ b/yarn.lock\n"
    "@@ -1,4 +1,8 @@\n"
    " left-pad@^1.3.0:\n"
    "   version \"1.3.0\"\n"
    "+  resolved \"https://registry.yarnpkg.com/left-pad/-/left-pad-1.3.0.tgz#abc\"\n"
    "+\n"
    "+foo@^1.0.0:\n"
    "+  version \"1.0.0\"\n"
    "+  resolved \"http://registry.yarnpkg.com/foo/-/foo-1.0.0.tgz#def\"\n"
    "+  integrity sha512-XYZ\n")

PNPM_DIFF = (
    "diff --git a/pnpm-lock.yaml b/pnpm-lock.yaml\n--- a/pnpm-lock.yaml\n+++ b/pnpm-lock.yaml\n"
    "@@ -1,2 +1,4 @@\n"
    " packages:\n"
    "+  foo@1.0.0:\n"
    "+    resolution: {tarball: https://files.example.org/foo-1.0.0.tgz}\n"
    "+  bar@1.0.0:\n"
    "+    resolution: {integrity: sha512-OK}\n")


class TestLockfileScan:
    def test_npm_registry_is_ok(self):
        r = gate.scan_lockfile_diff(NPM_OK)
        assert r["sources"] == 1 and r["bad_sources"] == [] and r["integrity_same_version"] == []
        assert r["integrity_changed"] == 1, "counted, informational (the version changed)"

    def test_other_host_is_flagged_with_its_new_file_line(self):
        r = gate.scan_lockfile_diff(NPM_OTHER_HOST)
        ((path, line, value, why),) = r["bad_sources"]
        assert path == "package-lock.json" and line == 12
        assert "evil.example.com" in value and "evil.example.com" in why

    def test_git_dependency_is_flagged(self):
        ((_p, line, value, why),) = gate.scan_lockfile_diff(NPM_GIT)["bad_sources"]
        assert line == 12 and "github.com" in why

    def test_integrity_change_on_an_unchanged_version_is_flagged(self):
        r = gate.scan_lockfile_diff(NPM_INTEGRITY_ONLY)
        ((path, line, desc),) = r["integrity_same_version"]
        assert path == "package-lock.json" and line == 43 and "node_modules/left-pad" in desc
        assert r["bad_sources"] == []

    def test_an_algorithm_upgrade_is_informational(self):
        r = gate.scan_lockfile_diff(NPM_ALGO_UPGRADE)
        assert r["integrity_same_version"] == [] and r["integrity_changed"] == 1

    def test_yarn(self):
        r = gate.scan_lockfile_diff(YARN_DIFF)
        assert r["sources"] == 1, "the https registry one; the http one is in bad_sources"
        ((path, line, value, why),) = r["bad_sources"]
        assert path == "yarn.lock" and line == 7 and "http://" in value and "https" in why

    def test_pnpm_tarball(self):
        r = gate.scan_lockfile_diff(PNPM_DIFF)
        ((path, line, _v, why),) = r["bad_sources"]
        assert path == "pnpm-lock.yaml" and line == 3 and "files.example.org" in why

    def test_removed_lines_are_not_scanned(self):
        diff = _npm_diff('-      "resolved": "https://evil.example.com/x.tgz",\n')
        assert gate.scan_lockfile_diff(diff)["bad_sources"] == []

    def test_lookalike_host_is_flagged(self):
        diff = _npm_diff('+      "resolved": "https://registry.npmjs.org.evil.io/x.tgz",\n')
        assert len(gate.scan_lockfile_diff(diff)["bad_sources"]) == 1


class TestLockfileCheckInTheReview:
    ROWS = [(3, 3, "package-lock.json"), (1, 1, "package.json")]

    def test_only_lockfiles_are_diffed(self, monkeypatch):
        h = _Harness(monkeypatch, self.ROWS + [(9, 0, "dist/app.min.js")], lock_diff=NPM_OK)
        assert h.run() == 0
        (cmd,) = [c for c in h.cmds if c[:3] == ["git", "--literal-pathspecs", "diff"]]
        assert cmd[-2:] == ["--", "package-lock.json"]

    def test_registry_only_passes_and_says_so(self, monkeypatch):
        h = _Harness(monkeypatch, self.ROWS, lock_diff=NPM_OK)
        assert h.run() == 0
        assert "**Lockfile check:** ✅" in h.posted[0]

    def test_non_registry_host_blocks_like_a_p1(self, monkeypatch, capsys):
        h = _Harness(monkeypatch, self.ROWS, lock_diff=NPM_OTHER_HOST)
        assert h.run() == 1
        body = h.posted[0]
        assert "**Lockfile check:** ❌" in body
        n, counts, _ = gate.blocking_findings(body)
        assert n == 1 and counts["P1"] == 1
        assert "package-lock.json:12" in body and "evil.example.com" in body
        assert "::error::" in capsys.readouterr().out

    def test_non_registry_host_is_waivable(self, monkeypatch):
        h = _Harness(monkeypatch, self.ROWS, labels=(gate.WAIVER_LABEL,),
                     lock_diff=NPM_OTHER_HOST)
        assert h.run() == 0

    def test_the_block_survives_a_rerun_at_the_same_head(self, monkeypatch):
        h = _Harness(monkeypatch, self.ROWS, lock_diff=NPM_OTHER_HOST)
        h.run()
        h2 = _Harness(monkeypatch, self.ROWS, prior=h.posted[0])
        assert h2.run() == 1 and h2.reviewed == []

    def test_integrity_on_unchanged_version_is_an_advisory_p2(self, monkeypatch):
        h = _Harness(monkeypatch, self.ROWS, lock_diff=NPM_INTEGRITY_ONLY)
        assert h.run() == 0
        n, counts, _ = gate.blocking_findings(h.posted[0])
        assert n == 0 and counts["P2"] == 1
        assert "package-lock.json:43" in h.posted[0]

    def test_no_lockfile_no_line_and_no_git_call(self, monkeypatch):
        h = _Harness(monkeypatch, [(10, 0, "src/a.ts")])
        assert h.run() == 0
        assert "Lockfile check" not in h.posted[0]
        assert not [c for c in h.cmds if c[:3] == ["git", "--literal-pathspecs", "diff"]]

    @pytest.mark.parametrize("fail", [
        lambda cmd, **kw: None,
        lambda cmd, **kw: subprocess.CompletedProcess(cmd, 128, "", "fatal"),
        lambda cmd, **kw: (_ for _ in ()).throw(subprocess.TimeoutExpired(cmd, 300))
        if cmd[:3] == ["git", "--literal-pathspecs", "diff"] else None,
    ])
    def test_unreadable_diff_fails_closed(self, monkeypatch, fail):
        """A lockfile changed and nothing checked it: blocking, not a green
        with a warning (codex cross-check). Waivable like any P1."""
        h = _Harness(monkeypatch, self.ROWS)
        monkeypatch.setattr(gate, "run", fail)
        assert h.run() == 1
        body = h.posted[0]
        assert "**Lockfile check:** ❌ could not read the lockfile diff" in body
        assert gate.blocking_findings(body)[1]["P1"] == 1
        h = _Harness(monkeypatch, self.ROWS, labels=(gate.WAIVER_LABEL,))
        monkeypatch.setattr(gate, "run", fail)
        assert h.run() == 0


# --------------------------------------------------------------------------
# Label-event runs: the job is never skipped, so the script must re-derive the
# verdict cheaply (#117 went BLOCKED -> CLEAN on a skipped label run)
# --------------------------------------------------------------------------

@pytest.fixture
def label_env(monkeypatch):
    def set_label(action, label):
        monkeypatch.setenv("AI_REVIEW_EVENT_ACTION", action)
        monkeypatch.setenv("AI_REVIEW_EVENT_LABEL", label)
    for k in ("AI_REVIEW_EVENT_ACTION", "AI_REVIEW_EVENT_LABEL",
              "AI_REVIEW_EVENT_HEAD", "AI_REVIEW_EVENT_DRAFT"):
        monkeypatch.delenv(k, raising=False)
    return set_label


def _scope_guard_prior():
    return (f"## 🤖 AI Code Review — SCOPE GUARD\n\nnothing was reviewed\n\n"
            f"<sub>{gate.MARKER.format(sha=HEAD)}</sub>\n<sub>{gate.SCOPE_GUARD_MARKER}</sub>")


BLOCKING_PRIOR_FINDINGS = "### [P1] broken\n`src/a.ts:1` x"
SMALL = [(10, 0, "src/a.ts")]


class TestLabelEventDetection:
    def test_no_label_event_by_default(self, label_env):
        assert gate.label_event() is None and not gate.is_unrelated_label_event()

    @pytest.mark.parametrize("action", ["labeled", "unlabeled"])
    def test_label_events(self, label_env, action):
        label_env(action, "bug")
        assert gate.label_event() == "bug" and gate.is_unrelated_label_event()
        for review_label in (gate.WAIVER_LABEL, gate.SIZE_OVERRIDE_LABEL):
            label_env(action, review_label)
            assert gate.label_event() == review_label
            assert not gate.is_unrelated_label_event()

    def test_other_actions_are_not_label_events(self, label_env):
        label_env("synchronize", "")
        assert gate.label_event() is None and not gate.is_unrelated_label_event()


class TestUnrelatedLabelRederivesTheVerdict:
    """Unrelated label, review already posted at this head: no model is called,
    nothing is posted, and the exit code is the prior verdict's."""

    @pytest.fixture(autouse=True)
    def _label(self, label_env, monkeypatch):
        label_env("labeled", "bug")
        monkeypatch.setattr(gate, "earlier_run_in_flight", lambda *a, **k: False)

    def test_prior_blocking_review_stays_red(self, monkeypatch, capsys):
        h = _Harness(monkeypatch, SMALL,
                     prior=_prior_review(override=False, findings=BLOCKING_PRIOR_FINDINGS))
        assert h.run() != 0
        assert h.reviewed == [] and h.posted == []
        assert "::error::" in capsys.readouterr().out

    def test_prior_scope_guard_refusal_stays_red(self, monkeypatch):
        h = _Harness(monkeypatch, _rows_117(), prior=_scope_guard_prior())
        assert h.run() == 1
        assert h.reviewed == [] and h.posted == []

    def test_prior_scope_guard_refusal_can_be_waived(self, monkeypatch):
        h = _Harness(monkeypatch, _rows_117(), labels=(gate.WAIVER_LABEL,),
                     prior=_scope_guard_prior())
        assert h.run() == 0 and h.reviewed == []

    def test_prior_scope_guard_with_size_override_now_reviews(self, monkeypatch):
        """#117's case: ai-review-large was applied but its own run never
        reviewed (stale merge ref). The next label run honours it."""
        h = _Harness(monkeypatch, _rows_117(), labels=(gate.SIZE_OVERRIDE_LABEL,),
                     prior=_scope_guard_prior())
        assert h.run() == 0 and len(h.reviewed) == 1

    def test_prior_clean_review_stays_green(self, monkeypatch):
        h = _Harness(monkeypatch, SMALL, prior=_prior_review(override=False))
        assert h.run() == 0
        assert h.reviewed == [] and h.posted == []

    def test_prior_tier_failure_is_not_retried(self, monkeypatch, capsys):
        prior = _prior_review(override=False) + f"\n<sub>{gate.TIER_FAILURE_MARKER}</sub>"
        h = _Harness(monkeypatch, SMALL, prior=prior)
        assert h.run() == 1
        assert h.reviewed == [] and h.posted == []
        assert "::error::" in capsys.readouterr().out
        h = _Harness(monkeypatch, SMALL, labels=(gate.WAIVER_LABEL,), prior=prior)
        assert h.run() == 0 and h.reviewed == []

    def test_no_review_at_this_head_gets_a_full_review(self, monkeypatch):
        h = _Harness(monkeypatch, SMALL)
        assert h.run() == 0
        assert len(h.reviewed) == 1 and len(h.posted) == 1

    def test_no_review_at_this_head_with_findings_is_red(self, monkeypatch):
        h = _Harness(monkeypatch, SMALL)
        h.claude_text = BLOCKING_PRIOR_FINDINGS
        assert h.run() != 0 and len(h.reviewed) == 1


class TestReviewLabelTierFailureStillRetries:
    def test_waive_label_run_keeps_the_retry(self, monkeypatch, label_env):
        label_env("labeled", gate.WAIVER_LABEL)
        monkeypatch.setattr(gate, "earlier_run_in_flight", lambda *a, **k: False)
        prior = _prior_review(override=False) + f"\n<sub>{gate.TIER_FAILURE_MARKER}</sub>"
        h = _Harness(monkeypatch, SMALL, labels=(gate.WAIVER_LABEL,), prior=prior)
        assert h.run() == 0 and len(h.reviewed) == 1

    def test_push_run_keeps_the_retry(self, monkeypatch, label_env):
        prior = _prior_review(override=False) + f"\n<sub>{gate.TIER_FAILURE_MARKER}</sub>"
        h = _Harness(monkeypatch, SMALL, prior=prior)
        assert h.run() == 0 and len(h.reviewed) == 1


class TestLabelRunWaitsForTheInFlightReview:
    """A PR opened WITH labels fires `opened` plus one `labeled` per label at
    once; with parallel runners each label run would pay for its own review."""

    def _setup(self, monkeypatch, label_env, in_flight, appears_after):
        label_env("labeled", "bug")
        h = _Harness(monkeypatch, SMALL)
        polls = {"n": 0}

        def review_sha(*a, **k):
            polls["n"] += 1
            return (1, HEAD) if polls["n"] > appears_after else (None, None)
        monkeypatch.setattr(gate, "existing_review_sha", review_sha)
        monkeypatch.setattr(gate, "existing_review_body",
                            lambda *a, **k: _prior_review(override=False,
                                                          findings=BLOCKING_PRIOR_FINDINGS))
        monkeypatch.setattr(gate, "earlier_run_in_flight", in_flight)
        self.slept = []
        monkeypatch.setattr(gate.time, "sleep", self.slept.append)
        return h

    def test_waits_then_carries_the_posted_verdict(self, monkeypatch, label_env):
        h = self._setup(monkeypatch, label_env, lambda *a, **k: True, appears_after=2)
        assert h.run() != 0, "the posted review's P1 blocks"
        assert h.reviewed == [], "no second review was paid for"
        assert len(self.slept) == 2

    def test_nothing_in_flight_reviews_immediately(self, monkeypatch, label_env):
        h = self._setup(monkeypatch, label_env, lambda *a, **k: False, appears_after=99)
        assert h.run() == 0 and len(h.reviewed) == 1 and self.slept == []

    def test_gives_up_after_the_deadline_and_reviews(self, monkeypatch, label_env, capsys):
        h = self._setup(monkeypatch, label_env, lambda *a, **k: True, appears_after=99)
        monkeypatch.setattr(gate, "INFLIGHT_WAIT_SECONDS", 0)
        assert h.run() == 0 and len(h.reviewed) == 1
        assert "::warning::" in capsys.readouterr().out

    def test_push_runs_never_wait(self, monkeypatch, label_env):
        h = _Harness(monkeypatch, SMALL)
        monkeypatch.setattr(gate, "earlier_run_in_flight", lambda *a, **k: (
            _ for _ in ()).throw(AssertionError("only label runs look for other runs")))
        assert h.run() == 0 and len(h.reviewed) == 1


class TestEarlierRunInFlight:
    def _run(self, monkeypatch, result, run_id="500"):
        seen = []

        def fake_run(cmd, **kw):
            seen.append(cmd)
            if isinstance(result, BaseException):
                raise result
            return result
        monkeypatch.setattr(gate, "run", fake_run)
        if run_id is None:
            monkeypatch.delenv("GITHUB_RUN_ID", raising=False)
        else:
            monkeypatch.setenv("GITHUB_RUN_ID", run_id)
        return gate.earlier_run_in_flight("o/r", HEAD), seen

    def test_only_earlier_unfinished_runs_of_this_workflow_at_this_head(self, monkeypatch):
        got, (cmd,) = self._run(monkeypatch, subprocess.CompletedProcess([], 0, "480\n", ""))
        assert got is True
        assert f"actions/workflows/{gate.WORKFLOW_FILE}/runs?head_sha={HEAD}" in cmd[2]
        assert '.status != "completed" and .id < 500' in cmd[-1]

    def test_none_in_flight(self, monkeypatch):
        got, _ = self._run(monkeypatch, subprocess.CompletedProcess([], 0, "", ""))
        assert got is False

    def test_without_a_run_id_any_unfinished_run_counts(self, monkeypatch):
        got, (cmd,) = self._run(monkeypatch, subprocess.CompletedProcess([], 0, "1\n", ""),
                                run_id=None)
        assert got is True and ".id <" not in cmd[-1]

    @pytest.mark.parametrize("result", [
        subprocess.CompletedProcess([], 1, "", "HTTP 403"),
        subprocess.TimeoutExpired(["gh"], 60),
        OSError("gh missing"),
    ])
    def test_unknown_means_not_in_flight(self, monkeypatch, result):
        """Then the label run reviews: costs tokens, never a wrong verdict."""
        got, _ = self._run(monkeypatch, result)
        assert got is False


# --------------------------------------------------------------------------
# pull_request runs: the job is never skipped (drafts included), so the script
# decides on the PR's LIVE state. "Re-run all jobs" replays the original payload:
# a re-run of a draft-era run used to skip again (`draft: true`) and turn the
# required check green on a head whose real review had failed.
# --------------------------------------------------------------------------

NEW_HEAD = "fedcba98" * 5
EVENT_ENV = ("AI_REVIEW_EVENT_ACTION", "AI_REVIEW_EVENT_LABEL",
             "AI_REVIEW_EVENT_HEAD", "AI_REVIEW_EVENT_DRAFT")


@pytest.fixture
def pr_run(monkeypatch):
    """Make the NEXT review_one a pull_request run, after _Harness is built.

    `live` is what `gh pr view --json isDraft,headRefOid` answers now: a list of
    (is_draft, head) answers in call order (the last one repeats), or an
    exception / CompletedProcess to return instead."""
    for k in EVENT_ENV:
        monkeypatch.delenv(k, raising=False)

    def configure(*, action="synchronize", label="", event_head=HEAD,
                  payload_draft=False, live=((False, HEAD),)):
        monkeypatch.setenv("AI_REVIEW_EVENT_ACTION", action)
        monkeypatch.setenv("AI_REVIEW_EVENT_LABEL", label)
        monkeypatch.setenv("AI_REVIEW_EVENT_HEAD", event_head)
        monkeypatch.setenv("AI_REVIEW_EVENT_DRAFT", "true" if payload_draft else "false")
        views, inner = [], gate.run

        def fake_run(cmd, **kw):
            if cmd[:3] == ["gh", "pr", "view"] and "isDraft,headRefOid" in cmd:
                views.append(cmd)
                if isinstance(live, BaseException):
                    raise live
                if isinstance(live, subprocess.CompletedProcess):
                    return live
                draft, head = live[min(len(views), len(live)) - 1]
                return subprocess.CompletedProcess(
                    cmd, 0, json.dumps({"isDraft": draft, "headRefOid": head}), "")
            return inner(cmd, **kw)
        monkeypatch.setattr(gate, "run", fake_run)
        return views
    return configure


def _no_inflight_lookup(monkeypatch):
    monkeypatch.setattr(gate, "earlier_run_in_flight", lambda *a, **k: (
        _ for _ in ()).throw(AssertionError("must not look for other runs")))


def _fetched(h):
    return [c for c in h.cmds if c[:2] == ["git", "fetch"]]


class TestLiveDraftState:
    @pytest.mark.parametrize("payload_draft", [True, False])
    def test_a_draft_now_exits_0_without_calling_a_model(self, monkeypatch, pr_run,
                                                         payload_draft):
        """Blocking review on file, PR is a draft: 0 at once (GitHub will not merge
        a draft; ready_for_review starts a new run). Covers a ready-era payload on
        a PR converted back to draft, too."""
        h = _Harness(monkeypatch, SMALL,
                     prior=_prior_review(override=False, findings=BLOCKING_PRIOR_FINDINGS))
        _no_inflight_lookup(monkeypatch)
        views = pr_run(payload_draft=payload_draft, live=((True, HEAD),))
        assert h.run() == 0
        assert h.reviewed == [] and h.posted == [] and _fetched(h) == []
        (cmd,) = views
        assert cmd[:4] == ["gh", "pr", "view", "117"] and "o/r" in cmd

    def test_rerun_of_a_draft_era_run_keeps_the_failed_review_red(self, monkeypatch,
                                                                  pr_run, capsys):
        """The P1: run D fired while the PR was a draft; it is ready now and its
        review at this head found a P1. Re-running D must stay red."""
        h = _Harness(monkeypatch, SMALL,
                     prior=_prior_review(override=False, findings=BLOCKING_PRIOR_FINDINGS))
        monkeypatch.setattr(gate, "earlier_run_in_flight", lambda *a, **k: False)
        pr_run(action="synchronize", payload_draft=True, live=((False, HEAD),))
        assert h.run() != 0
        assert h.reviewed == [] and h.posted == []
        assert "::error::" in capsys.readouterr().out

    def test_rerun_of_a_draft_era_run_keeps_a_clean_review_green(self, monkeypatch, pr_run):
        h = _Harness(monkeypatch, SMALL, prior=_prior_review(override=False))
        monkeypatch.setattr(gate, "earlier_run_in_flight", lambda *a, **k: False)
        pr_run(payload_draft=True, live=((False, HEAD),))
        assert h.run() == 0 and h.reviewed == [] and h.posted == []

    def test_rerun_of_a_draft_era_run_does_not_retry_a_failed_tier(self, monkeypatch,
                                                                  pr_run):
        prior = _prior_review(override=False) + f"\n<sub>{gate.TIER_FAILURE_MARKER}</sub>"
        h = _Harness(monkeypatch, SMALL, prior=prior)
        monkeypatch.setattr(gate, "earlier_run_in_flight", lambda *a, **k: False)
        pr_run(payload_draft=True, live=((False, HEAD),))
        assert h.run() == 1 and h.reviewed == []

    def test_rerun_of_a_draft_era_run_with_the_scope_guard_refusal_stays_red(
            self, monkeypatch, pr_run):
        h = _Harness(monkeypatch, _rows_117(), prior=_scope_guard_prior())
        monkeypatch.setattr(gate, "earlier_run_in_flight", lambda *a, **k: False)
        pr_run(payload_draft=True, live=((False, HEAD),))
        assert h.run() == 1 and h.reviewed == [] and h.posted == []

    def test_draft_era_run_waits_for_the_in_flight_review(self, monkeypatch, pr_run):
        h = _Harness(monkeypatch, SMALL)
        polls = {"n": 0}

        def review_sha(*a, **k):
            polls["n"] += 1
            return (1, HEAD) if polls["n"] > 1 else (None, None)
        monkeypatch.setattr(gate, "existing_review_sha", review_sha)
        monkeypatch.setattr(gate, "existing_review_body", lambda *a, **k: _prior_review(
            override=False, findings=BLOCKING_PRIOR_FINDINGS))
        monkeypatch.setattr(gate, "earlier_run_in_flight", lambda *a, **k: True)
        monkeypatch.setattr(gate.time, "sleep", lambda s: None)
        pr_run(payload_draft=True, live=((False, HEAD),))
        assert h.run() != 0 and h.reviewed == []

    def test_ready_pr_with_no_review_gets_a_full_review(self, monkeypatch, pr_run):
        h = _Harness(monkeypatch, SMALL)
        pr_run(action="ready_for_review", live=((False, HEAD),))
        assert h.run() == 0 and len(h.reviewed) == 1 and len(h.posted) == 1

    @pytest.mark.parametrize("live", [
        subprocess.CompletedProcess([], 1, "", "HTTP 502"),
        subprocess.CompletedProcess([], 0, "", ""),
        subprocess.CompletedProcess([], 0, "not json", ""),
        subprocess.CompletedProcess([], 0, '{"headRefOid": "%s"}' % HEAD, ""),
        subprocess.CompletedProcess([], 0, '{"isDraft": "false", "headRefOid": "%s"}' % HEAD, ""),
        subprocess.TimeoutExpired(["gh"], 60),
        OSError("gh missing"),
    ], ids=["exit1", "empty", "garbage", "no-isDraft", "string-isDraft", "timeout", "no-gh"])
    def test_unreadable_live_state_fails_closed(self, monkeypatch, pr_run, live, capsys):
        """Never read "could not tell" as "draft" (which exits 0)."""
        h = _Harness(monkeypatch, SMALL, prior=_prior_review(override=False))
        pr_run(payload_draft=True, live=live)
        with pytest.raises(RuntimeError, match="failing closed"):
            h.run()
        assert h.reviewed == [] and h.posted == []
        monkeypatch.setattr(sys, "argv", ["ai_pr_review.py", "--repo", "o/r", "--pr", "117"])
        assert gate.main() == 1
        assert "::error::" in capsys.readouterr().out

    def test_non_pull_request_runs_do_not_look(self, monkeypatch, pr_run):
        """/ai-review comments and workflow_dispatch set no event head: a draft
        can still be reviewed on request."""
        h = _Harness(monkeypatch, SMALL)
        views = pr_run()
        monkeypatch.delenv("AI_REVIEW_EVENT_HEAD")
        monkeypatch.delenv("AI_REVIEW_EVENT_ACTION")
        assert h.run() == 0 and len(h.reviewed) == 1 and views == []


class TestStaleEventHead:
    """Decision: a pull_request run whose head moved exits NON-ZERO without a
    review. Its check run sits on the event head, which no longer gates the
    merge; the synchronize run for the new head does the work. Non-zero, not 0:
    a green check on a commit must mean "reviewed, nothing blocking" there, and
    this run established neither."""

    @pytest.mark.parametrize("event_head,live_head", [
        (HEAD, NEW_HEAD),   # pushed while this run was queued
        (NEW_HEAD, HEAD),   # re-run of an older run
    ])
    def test_moved_head_is_superseded_without_a_review(self, monkeypatch, pr_run, capsys,
                                                       event_head, live_head):
        h = _Harness(monkeypatch, SMALL)
        _no_inflight_lookup(monkeypatch)
        pr_run(action="labeled", label="bug", event_head=event_head,
               live=((False, live_head),))
        assert h.run() == 1
        assert h.reviewed == [] and h.posted == [] and _fetched(h) == []
        out = capsys.readouterr().out
        assert "::error::" in out and "superseded" in out

    def test_draft_wins_over_a_moved_head(self, monkeypatch, pr_run):
        h = _Harness(monkeypatch, SMALL)
        pr_run(event_head=HEAD, live=((True, NEW_HEAD),))
        assert h.run() == 0 and h.reviewed == []

    def _waiting(self, monkeypatch, in_flight):
        h = _Harness(monkeypatch, SMALL)
        monkeypatch.setattr(gate, "existing_review_sha", lambda *a, **k: (None, None))
        answers = iter(in_flight)
        monkeypatch.setattr(gate, "earlier_run_in_flight", lambda *a, **k: next(answers))
        self.slept = []
        monkeypatch.setattr(gate.time, "sleep", self.slept.append)
        return h

    def test_push_during_the_wait_stops_the_label_run(self, monkeypatch, pr_run, capsys):
        """#126 P2: the push cancels the review being waited for; the label run
        (in `-noreview`, so nothing cancels it) must not review the dead head."""
        h = self._waiting(monkeypatch, [True, True, True])
        views = pr_run(action="labeled", label="bug",
                       live=((False, HEAD), (False, NEW_HEAD)))
        assert h.run() == 1
        assert h.reviewed == [] and h.posted == [] and len(self.slept) == 1
        assert len(views) == 2 and "superseded" in capsys.readouterr().out

    def test_waited_for_run_ends_without_posting_after_a_push(self, monkeypatch, pr_run):
        """The poll right after the sleep still saw the old head; the push lands
        before the in-flight lookup, which then finds nothing."""
        h = self._waiting(monkeypatch, [True, False])
        views = pr_run(action="labeled", label="bug",
                       live=((False, HEAD), (False, HEAD), (False, NEW_HEAD)))
        assert h.run() == 1 and h.reviewed == [] and len(views) == 3

    def test_waited_for_run_ends_without_posting_at_the_same_head(self, monkeypatch, pr_run):
        """No push: the earlier run died without posting, so this run reviews."""
        h = self._waiting(monkeypatch, [True, False])
        pr_run(action="labeled", label="bug", live=((False, HEAD),))
        assert h.run() == 0 and len(h.reviewed) == 1
