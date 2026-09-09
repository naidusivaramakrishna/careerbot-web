"""Tests for the ai-review merge gate.

Before this gate existed, `ai_pr_review.py` always exited 0: the `ai-review`
check went green because the reviewer RAN, not because the code was sound. A PR
could carry a dozen findings, show a green check, and merge with every one of
them open. That is how #288/#289/#290/#296/#297 merged 44 blocking
findings, three of them P0.

The gate decides whether every PR may merge, so a silent regression here is
worse than a bug in any single reviewed file. Every policy decision is pinned.
"""

import importlib.util
import inspect
import re
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT = REPO_ROOT / "scripts" / "ai_review" / "ai_pr_review.py"


def _load_review_module():
    spec = importlib.util.spec_from_file_location("ai_pr_review_gate", SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["ai_pr_review_gate"] = mod
    spec.loader.exec_module(mod)
    return mod


gate = _load_review_module()


class TestSeverityPolicy:
    def test_only_p0_and_p1_block(self):
        """P2 was moved out of the blocking set after measuring what it did:
        re-running the reviewer after fixing everything it reported produced a
        DIFFERENT ~5 blocking findings every round (8, 6, 6, 5, 5), never
        reaching zero. A gate whose exit condition is unreachable is a livelock,
        and a livelocked gate gets bypassed."""
        assert gate.BLOCKING_SEVERITIES == ("P0", "P1")
        assert gate.ADVISORY_SEVERITIES == ("P2", "P3")

    @pytest.mark.parametrize("sev", ["P0", "P1"])
    def test_each_blocking_severity_blocks_on_its_own(self, sev):
        assert gate.blocking_findings(f"### [{sev}] something is wrong")[0] == 1

    @pytest.mark.parametrize("sev", ["P2", "P3"])
    def test_advisory_severities_never_block(self, sev):
        n, counts, _ = gate.blocking_findings(f"### [{sev}] worth doing, not urgent")
        assert n == 0
        assert counts[sev] == 1, "still counted and reported, just not blocking"

    def test_advisory_findings_alone_never_block(self):
        body = ("### [P2] missing a test here\n\n### [P3] rename this variable\n\n"
                "### [P3] docstring typo")
        n, counts, _ = gate.blocking_findings(body)
        assert n == 0
        assert (counts["P2"], counts["P3"]) == (1, 2)

    def test_clean_review_does_not_block(self):
        assert gate.blocking_findings("No issues found. LGTM.")[0] == 0

    def test_blocking_count_sums_only_the_blocking_severities(self):
        body = "### [P0] a\n### [P1] b\n### [P1] c\n### [P2] d\n### [P3] e"
        n, counts, _ = gate.blocking_findings(body)
        assert (counts["P0"], counts["P1"], counts["P2"], counts["P3"]) == (1, 2, 1, 1)
        assert n == 3, "P2 and P3 are reported but excluded from the blocking total"


class TestIdentityDeduplication:
    """A finding is rendered twice -- as a '### [Pn] Title' section and again as
    a short entry in the fix list -- with DIFFERENT wording but the same
    file:line target. Identity de-duplication counts it once.

    The rule this replaced was `list(headings) or list(tags)`: heading-wins,
    all-or-nothing. One heading anywhere made every bullet-formatted finding
    uncountable, and the undercount direction is green. `claude_review`
    concatenates one model output per batch into a single section, so batch 1
    emitting headings silently zeroed batch 2's bullets."""

    BODY = """## Findings

### [P1] Seniority rank inverts compound titles
`src/matcher.py:197` — detail about the bug.

### [P2] Responsibilities extracted twice per parse
`src/parser.py:88` — more detail.

### [P3] Wrong occurrence excised
`src/jd.py:12` — advisory detail.

## Suggested fixes

- [P1] Resolve compound titles before ranking — /abs/path/src/matcher.py:197
- [P2] Avoid running extraction twice — /abs/path/src/parser.py:88
- [P3] Remove the chunk by position — /abs/path/src/jd.py:12
"""

    def test_each_finding_counts_once(self):
        n, counts, _ = gate.blocking_findings(self.BODY)
        assert (counts["P1"], counts["P2"], counts["P3"]) == (1, 1, 1)
        assert n == 1, "only the P1 blocks"

    def test_a_bullet_only_finding_is_not_swallowed_by_headings(self):
        """The regression the old heading-wins rule could not see."""
        body = ("### [P1] a heading finding\n`src/a.py:1` detail\n\n"
                "- [P0] a bullet finding — src/b.py:9\n")
        n, counts, _ = gate.blocking_findings(body)
        assert counts["P0"] == 1, "a bullet finding must survive alongside headings"
        assert counts["P1"] == 1
        assert n == 2

    def test_mixed_format_batches_both_count(self):
        """claude_review glues per-batch outputs into one section; batch 2
        using bullets must not be zeroed by batch 1 using headings."""
        body = ("### Batch 1/2\n### [P1] first — \n`src/a.py:10` detail\n\n"
                "### Batch 2/2\n- [P2] second — src/b.py:20\n")
        _, counts, _ = gate.blocking_findings(body)
        assert (counts["P1"], counts["P2"]) == (1, 1)

    def test_same_severity_different_targets_both_count(self):
        body = ("### [P1] one\n`src/a.py:1` d\n\n### [P1] two\n`src/b.py:2` d\n")
        _, counts, _ = gate.blocking_findings(body)
        assert counts["P1"] == 2

    def test_same_target_different_severity_both_count(self):
        body = ("### [P1] one\n`src/a.py:1` d\n\n### [P2] two\n`src/a.py:1` d\n")
        _, counts, _ = gate.blocking_findings(body)
        assert (counts["P1"], counts["P2"]) == (1, 1)

    def test_findings_without_a_file_reference_are_never_merged(self):
        """No identity means no evidence they are the same finding, so they
        must each count -- the safe direction."""
        body = "### [P1] one\n### [P1] two\n### [P1] three\n"
        _, counts, _ = gate.blocking_findings(body)
        assert counts["P1"] == 3

    def test_two_headings_at_the_same_line_are_two_findings(self):
        """Only a BULLET can be a restatement. Two headings pointing at the
        same line are two distinct problems there; merging them undercounts
        toward green. Caught by re-measuring real bodies: this merge silently
        dropped one finding each from #289 and #296."""
        body = ("### [P1] first problem here\n`src/a.py:42` detail\n\n"
                "### [P1] a different problem, same line\n`src/a.py:42` detail\n")
        _, counts, _ = gate.blocking_findings(body)
        assert counts["P1"] == 2

    def test_a_bullet_merges_only_into_a_heading_seen_earlier(self):
        body = ("- [P1] a bullet first — src/a.py:42\n\n"
                "### [P1] a heading later — \n`src/a.py:42` detail\n")
        _, counts, _ = gate.blocking_findings(body)
        assert counts["P1"] == 2, "a bullet before any heading is its own finding"

    def test_relative_and_absolute_paths_match(self):
        body = ("### [P1] finding\n`src/services/x.py:42` detail\n\n"
                "- [P1] restated — /home/runner/work/repo/src/services/x.py:42\n")
        _, counts, _ = gate.blocking_findings(body)
        assert counts["P1"] == 1

    @pytest.mark.parametrize("hashes", ["#", "##", "###", "####", "#####", "######"])
    def test_any_heading_level_is_a_finding(self, hashes):
        assert gate.blocking_findings(f"{hashes} [P1] finding")[0] == 1

    @pytest.mark.parametrize("lead", ["### 1. ", "### **", "1. ", "- **", "> - "])
    def test_numbered_and_emphasised_tags_count(self, lead):
        """Model habits the strict prefix used to reject, counting a real
        finding as zero."""
        assert gate.blocking_findings(f"{lead}[P1] finding")[0] == 1

    def test_falls_back_to_bullets_when_no_headings(self):
        body = "- [P0] a\n- [P1] b\n- [P2] c\n- [P3] d"
        n, counts, _ = gate.blocking_findings(body)
        assert (counts["P0"], counts["P1"], counts["P2"], counts["P3"]) == (1, 1, 1, 1)
        assert n == 2


class TestParsingRobustness:
    def test_severity_tags_quoted_in_code_fences_are_ignored(self):
        body = "```python\n# handles the [P0] case\nBLOCK = '[P1]'\n```\nNothing found."
        assert gate.blocking_findings(body)[0] == 0

    def test_heading_inside_a_code_fence_is_not_a_finding(self):
        assert gate.blocking_findings("```md\n### [P0] example\n```\nClean.")[0] == 0

    def test_tag_must_start_a_line_not_appear_mid_sentence(self):
        assert gate.blocking_findings("We considered marking this [P0] but it is fine.")[0] == 0

    @pytest.mark.parametrize("prefix", ["- ", "* ", "+ ", "1. ", "2) ", "> - ", ""])
    def test_common_markdown_prefixes_are_recognised(self, prefix):
        assert gate.blocking_findings(f"{prefix}[P1] real finding")[0] == 1

    def test_severity_tag_is_case_insensitive(self):
        assert gate.blocking_findings("### [p1] lowercase tag")[0] == 1

    def test_empty_and_none_bodies_are_safe(self):
        assert gate.blocking_findings("")[0] == 0
        assert gate.blocking_findings(None)[0] == 0

    def test_verdicts_are_reported_but_never_enforced(self):
        """A model writing the word BLOCK must not fail a build on its own."""
        n, _, verdicts = gate.blocking_findings("VERDICT: BLOCK\n\nNo specific findings.")
        assert n == 0
        assert "BLOCK" in verdicts


def _report(claude_body="", codex_body=""):
    """A body shaped like build_report's real output, with both sections."""
    return (
        "## AI Code Review\n\n"
        "<details open><summary><b>T1 · Claude static review</b></summary>\n\n"
        f"{claude_body}\n\n</details>\n\n"
        "<details><summary><b>T1 · Codex cross-check (verifies + frame-challenges)"
        "</b></summary>\n\n"
        f"{codex_body}\n\n</details>\n\n"
        "<sub><!-- ai-review:abc1234 --></sub>\n"
    )


class TestUnbalancedFences:
    """A ```...``` regex pair mispairs when the body has an odd number of fence
    markers -- routine, because reviews quote diffs and markdown. On
    careerbot-api#174's own review body (21 markers) it blanked the text between
    two unrelated markers and deleted 6 of 12 real findings."""

    def test_finding_after_an_unterminated_fence_still_counts(self):
        body = "```\nquoted\n```\n### [P1] real finding\n```\ntrailing opener"
        assert gate.blocking_findings(body)[0] == 1

    def test_odd_marker_count_does_not_swallow_the_rest_of_the_body(self):
        body = "```\na\n```\n### [P0] one\n```\n### [P1] two\n### [P2] three"
        n, counts, _ = gate.blocking_findings(body)
        assert (counts["P0"], counts["P1"], counts["P2"]) == (1, 1, 1)
        assert n == 2

    def test_balanced_fence_still_hides_its_contents(self):
        assert gate.blocking_findings("```\n### [P0] quoted\n```\nclean")[0] == 0

    def test_tilde_fences_are_recognised(self):
        assert gate.blocking_findings("~~~\n### [P0] quoted\n~~~\nclean")[0] == 0

    def test_indented_fence_up_to_three_spaces(self):
        assert gate.blocking_findings("   ```\n### [P0] quoted\n   ```\nclean")[0] == 0

    def test_masking_preserves_offsets_and_line_structure(self):
        """Blanking is length-preserving: section slicing works on offsets, and
        the line-anchored regexes depend on newlines surviving."""
        src = "a\n```\nx\n```\nb"
        out = gate.mask_code(src)
        assert len(out) == len(src)
        assert len(out.splitlines()) == len(src.splitlines())
        assert out.splitlines()[0] == "a" and out.splitlines()[-1] == "b"
        assert "x" not in out

    def test_inline_code_is_masked_too(self):
        """A review OF this reviewer quotes tags and markup as examples. Those
        are not findings, and they are not structure either."""
        assert gate.blocking_findings("we saw `### [P0] x` once")[0] == 0
        assert "details" not in gate.mask_code("text `</details>` more")


class TestSectionAwareCounting:
    """The report concatenates two independently-formatted sections. Claude
    emits '### [Pn]' headings; Codex emits bullets. Counting the concatenation
    under one rule breaks whichever section loses."""

    def test_codex_missed_counts_even_when_claude_used_headings(self):
        """The false-green this prevents: one Claude heading made the heading
        rule authoritative and every Codex MISSED line counted as zero."""
        body = _report(
            claude_body="### [P3] a nit",
            codex_body="- [P0] MISSED: unguarded delete — src/x.py:10",
        )
        n, counts, _ = gate.blocking_findings(body)
        assert counts["P0"] == 1, "a Codex MISSED [P0] must not be dropped"
        assert counts["P3"] == 1
        assert n == 1

    def test_codex_confirm_does_not_double_count_a_claude_finding(self):
        body = _report(
            claude_body="### [P1] the finding",
            codex_body="- [P1] CONFIRM: the finding — src/x.py:10",
        )
        _, counts, _ = gate.blocking_findings(body)
        assert counts["P1"] == 1, "CONFIRM is a disposition, not a new finding"

    @pytest.mark.parametrize("disposition", ["CONFIRM", "REFUTE", "REGRADE"])
    def test_codex_dispositions_are_not_findings(self, disposition):
        body = _report(claude_body="",
                       codex_body=f"- [P0] {disposition}: something — src/x.py:1")
        assert gate.blocking_findings(body)[0] == 0

    def test_claude_fix_list_still_deduplicates_within_its_section(self):
        body = _report(
            claude_body=("### [P1] real\n`src/x.py:5` detail\n\n"
                         "## Fixes\n- [P1] restatement — /abs/src/x.py:5"),
            codex_body="",
        )
        _, counts, _ = gate.blocking_findings(body)
        assert counts["P1"] == 1

    def test_body_without_section_markers_is_counted_whole(self):
        """Hand-written bodies and SCOPE GUARD notices must not silently
        count zero just because they carry no <details> scaffolding."""
        assert gate.blocking_findings("### [P0] a\n### [P1] b")[0] == 2


class TestExistingReviewBody:
    """The marker is emitted at the END of the body (`<sub>{MARKER}</sub>`), so
    splitting the raw text on it and keeping the last fragment returned
    '<!-- ai-review:abc --></sub>' and never the findings -- every skip counted
    zero, which is exactly the hole this function exists to close."""

    @staticmethod
    def _proc(rc, out, err=""):
        class R: pass
        r = R(); r.returncode, r.stdout, r.stderr = rc, out, err
        return r

    def test_returns_the_last_comment_body_in_full(self, monkeypatch):
        import json as _json
        marker = "\n<sub><!-- ai-review:abc1234 --></sub>"
        older = _report(claude_body="### [P2] old\n`src/a.py:1` d") + marker
        newer = (_report(claude_body="### [P0] new\n`src/a.py:1` d\n\n"
                                     "### [P1] also\n`src/b.py:2` d") + marker)
        payload = "\n".join(_json.dumps({"body": b}) for b in (older, newer))
        monkeypatch.setattr(gate, "run", lambda *a, **k: self._proc(0, payload))
        got = gate.existing_review_body("o/r", 1)
        assert got == newer
        assert gate.blocking_findings(got)[0] == 2, "the skip path must see the findings"

    def test_malformed_lines_are_skipped(self, monkeypatch):
        import json as _json
        good = (_report(claude_body="### [P1] x\n`src/a.py:1` d")
                + "\n<sub><!-- ai-review:abc1234 --></sub>")
        monkeypatch.setattr(gate, "run", lambda *a, **k: self._proc(
            0, "not json\n" + _json.dumps({"body": good})))
        assert gate.existing_review_body("o/r", 1) == good

    def test_comments_without_the_marker_are_not_the_review(self, monkeypatch):
        import json as _json
        monkeypatch.setattr(gate, "run", lambda *a, **k: self._proc(
            0, _json.dumps({"body": "just a human comment"})))
        assert gate.existing_review_body("o/r", 1) is None


class TestSectionBoundaries:
    """A review OF this reviewer quotes `</details>`, tier <summary> markers and
    `[P0]` tags as examples. Treating quoted text as structure truncated the
    Claude section to 2 of its 8 blocking findings on #305's own review."""

    def test_quoted_close_tag_does_not_end_the_section(self):
        body = (
            "<details open><summary><b>T1 · Claude static review</b></summary>\n\n"
            "### [P1] first\n\n"
            "Prose mentioning `</details>` as an example.\n\n"
            "### [P2] second\n\n"
            "</details>\n"
        )
        _, counts, _ = gate.blocking_findings(body)
        assert (counts["P1"], counts["P2"]) == (1, 1), \
            "a quoted close tag must not truncate the section"

    def test_fenced_close_tag_does_not_end_the_section(self):
        body = (
            "<details open><summary><b>T1 · Claude static review</b></summary>\n\n"
            "### [P1] first\n\n```html\n</details>\n```\n\n### [P2] second\n\n"
            "</details>\n"
        )
        _, counts, _ = gate.blocking_findings(body)
        assert (counts["P1"], counts["P2"]) == (1, 1)

    def test_section_ends_at_the_next_tier_marker(self):
        """Claude's findings must not absorb the Codex section's bullets."""
        body = (
            "<details open><summary><b>T1 · Claude static review</b></summary>\n"
            "### [P1] claude finding\n</details>\n"
            "<details><summary><b>T1 · Codex cross-check</b></summary>\n"
            "- [P2] CONFIRM: claude finding — src/x.py\n</details>\n"
            "<details open><summary><b>T2 · Dynamic testing</b></summary>\n"
            "- [P0] some pytest line\n</details>\n"
        )
        n, counts, _ = gate.blocking_findings(body)
        assert counts["P1"] == 1
        assert counts["P2"] == 0, "CONFIRM is a disposition, not a finding"
        assert counts["P0"] == 0, "the T2 section is not a finding list"
        assert n == 1

    def test_codex_only_body_does_not_double_count(self):
        """With no Claude section the primary must EXCLUDE the Codex block, or
        its lines count once as generic tags and again as MISSED entries."""
        body = ("preamble\n"
                "<details><summary><b>T1 · Codex cross-check</b></summary>\n"
                "- MISSED [P0] unguarded delete — src/x.py:10\n</details>\n")
        _, counts, _ = gate.blocking_findings(body)
        assert counts["P0"] == 1


class TestCodexMissedTokenOrder:
    """The prompt asks for "MISSED [sev]"; models also emit "[sev] MISSED".
    Accepting one order meant a Codex-only finding written the way the prompt
    ASKS FOR counted zero -- the false green this parser exists to prevent."""

    @pytest.mark.parametrize("line", [
        "- MISSED [P0] unguarded delete — src/x.py:10",
        "- [P0] MISSED: unguarded delete — src/x.py:10",
        "MISSED [P0] unguarded delete — src/x.py:10",
        "1. MISSED [P0] unguarded delete — src/x.py:10",
        # Heading forms. _CODEX_PREFIX_RE admits `#{1,6}`, so these reach
        # `tagged` -- but an if/elif meant a heading could only ever set the
        # MISSED scope, never count itself. A P0 the cross-check found, written
        # exactly as the prompt asks and rendered as a heading, counted zero.
        "### MISSED [P0] unguarded delete — src/x.py:10",
        "#### [P0] MISSED: unguarded delete — src/x.py:10",
    ])
    def test_both_orders_count(self, line):
        body = ("pre\n<details><summary><b>T1 · Codex cross-check</b></summary>\n"
                + line + "\n</details>")
        assert gate.severity_counts(body)["P0"] == 1

    @pytest.mark.parametrize("header", [
        "### Findings the first pass MISSED",
        "**Findings the first pass MISSED**",
        "__Findings the first pass MISSED__",
        "Findings missed:",
        "#### MISSED",
    ])
    def test_any_section_header_form_opens_the_scope(self, header):
        """Only `#` opened a scope, so a bold or trailing-colon header -- both
        ordinary model output -- zeroed every finding under it. A
        cross-check-exclusive P0 then counted zero and the check went green."""
        body = ("pre\n<details><summary><b>T1 · Codex cross-check</b></summary>\n"
                + header + "\n- [P0] unguarded delete — src/x.py:10\n</details>")
        assert gate.severity_counts(body)["P0"] == 1

    def test_prose_inside_a_section_does_not_close_the_scope(self):
        """The cheap fix -- letting any tagless line set the scope -- means a
        sentence between the header and its bullets zeroes them."""
        body = ("pre\n<details><summary><b>T1 · Codex cross-check</b></summary>\n"
                "### MISSED findings\nSome explanation here.\n"
                "- [P0] a — src/x.py:1\n</details>")
        assert gate.severity_counts(body)["P0"] == 1

    def test_a_blank_line_does_not_close_the_scope(self):
        body = ("pre\n<details><summary><b>T1 · Codex cross-check</b></summary>\n"
                "### MISSED findings\n\n- [P0] a — src/x.py:1\n</details>")
        assert gate.severity_counts(body)["P0"] == 1

    def test_a_later_non_missed_header_closes_the_scope(self):
        body = ("pre\n<details><summary><b>T1 · Codex cross-check</b></summary>\n"
                "### MISSED findings\n- [P0] a — src/x.py:1\n"
                "### Dispositions\n- [P0] CONFIRM: b — src/y.py:2\n</details>")
        assert gate.severity_counts(body)["P0"] == 1

    def test_a_scoping_heading_does_not_double_count_its_bullets(self):
        """A bare "### ... MISSED" heading carries no tag, so it is not in
        `tagged` and cannot be counted alongside the bullets it scopes."""
        body = ("pre\n<details><summary><b>T1 · Codex cross-check</b></summary>\n"
                "### Findings the first pass MISSED\n"
                "- [P0] a — src/x.py:1\n- [P1] b — src/y.py:2\n</details>")
        c = gate.severity_counts(body)
        assert (c["P0"], c["P1"]) == (1, 1)

    def test_a_heading_that_is_itself_a_finding_counts_once(self):
        body = ("pre\n<details><summary><b>T1 · Codex cross-check</b></summary>\n"
                "### MISSED [P0] unguarded delete — src/x.py:10\n</details>")
        assert gate.severity_counts(body)["P0"] == 1

    @pytest.mark.parametrize("disposition", ["CONFIRM", "REFUTE", "REGRADE"])
    def test_dispositions_still_do_not_count(self, disposition):
        body = ("pre\n<details><summary><b>T1 · Codex cross-check</b></summary>\n"
                f"- [P0] {disposition}: something — src/x.py:1\n</details>")
        assert gate.severity_counts(body)["P0"] == 0


class TestPrimaryTierFailsClosed:
    """run() never raises on a non-zero exit, so a `claude` CLI that is PRESENT
    but fails -- usage limit, expired auth, timeout kill -- returned empty
    stdout, counted as zero findings, and let the required check go green for a
    PR nothing reviewed.

    Two shapes exist across the repos: a single-call `claude_pass` returning
    (text, ok), and a chunk-aware `_claude_call` returning None on a failed
    batch (which drives `complete=False`). Both must refuse to certify.
    """

    @staticmethod
    def _proc(returncode, stdout, stderr=""):
        class R:
            pass
        r = R()
        r.returncode, r.stdout, r.stderr = returncode, stdout, stderr
        return r

    def _call(self, monkeypatch, returncode, stdout, stderr=""):
        """Invoke whichever primary-tier entry point this build has.
        Returns (text_or_none, ok)."""
        monkeypatch.setattr(gate, "run",
                            lambda *a, **k: self._proc(returncode, stdout, stderr))
        if hasattr(gate, "claude_pass"):
            return gate.claude_pass("b", "h", "ctx")
        res = gate._claude_call("b", "h", "ctx", "", 60)
        return res, res is not None

    def test_nonzero_exit_does_not_certify(self, monkeypatch):
        text, ok = self._call(monkeypatch, 1, "", "usage limit reached")
        assert ok is False
        if text is not None:
            assert "usage limit reached" in text

    def test_empty_stdout_does_not_certify(self, monkeypatch):
        _, ok = self._call(monkeypatch, 0, "   \n")
        assert ok is False

    def test_real_output_is_accepted(self, monkeypatch):
        text, ok = self._call(monkeypatch, 0, "### [P1] a finding\n")
        assert ok is True
        assert "### [P1] a finding" in text

    def test_failure_text_is_not_itself_counted_as_findings(self, monkeypatch):
        text, ok = self._call(monkeypatch, 1, "", "boom [P0] boom")
        assert ok is False
        if text:
            assert gate.blocking_findings(text)[0] == 0, \
                "a [P0] in captured stderr must not read as a finding"

    def test_the_failure_reaches_the_exit_code(self):
        """A dead or incomplete primary tier must fail the check, not pass it
        with zero findings."""
        src = SCRIPT.read_text(encoding="utf-8")
        assert ("if not claude_ok:" in src) or ("if not complete:" in src), \
            "review_one must fail closed when the primary tier did not deliver"
        assert ("the Claude review tier did not run" in src
                or "review tier did not complete" in src)


@pytest.mark.skipif(not hasattr(gate, "MAX_CHUNKS"),
                    reason="this build has no chunked Claude tier, so there is no "
                           "over-cap case to distinguish from a dead one")
class TestTruncationIsNotFailure:
    """`complete` conflated two very different things: a tier that DIED, and a
    diff bigger than the batch cap. With CHUNK_FILES*MAX_CHUNKS = 150, every PR
    of >=151 files deterministically failed closed -- on every run, forever --
    and the waiver could not clear it because the branch returned before the
    waiver check. careerbot-api#78 (1038 files) is the precedent."""

    def test_claude_review_reports_truncation_separately(self):
        src = SCRIPT.read_text(encoding="utf-8")
        assert "return (\"\\n\".join(parts), complete, over_cap)" in src, \
            "claude_review must distinguish over-cap from a dead tier"

    def test_over_cap_warns_and_does_not_fail_closed(self):
        """Anchored on the messages, not the bare condition: `not complete` also
        guards the tier-failure stamp, which legitimately runs earlier."""
        src = SCRIPT.read_text(encoding="utf-8")
        i = src.index("if truncated:")
        j = src.index("a review tier did not complete")
        assert i < j, "truncation is handled before, and separately from, tier death"
        assert "::warning::" in src[i:j]
        assert "return 1" not in src[i:j], "a too-large diff must not fail closed"

    def test_a_dead_tier_still_fails_closed(self):
        src = SCRIPT.read_text(encoding="utf-8")
        tail = src[src.index("a review tier did not complete"):]
        assert "return 1" in tail[:600]
        assert "fails closed" in src[src.index("if truncated:"):][:1600]


class TestCrossCheckFailsVisibly:
    """run() does not raise on a non-zero exit, so a codex CLI that is present
    but fails contributed zero MISSED findings and read as AGREEMENT. Nothing
    in the report distinguished a dead cross-check from a clean one."""

    @staticmethod
    def _proc(rc, out, err=""):
        class R: pass
        r = R(); r.returncode, r.stdout, r.stderr = rc, out, err
        return r

    def test_nonzero_exit_renders_a_failure_block(self, monkeypatch):
        monkeypatch.setattr(gate, "run",
                            lambda *a, **k: self._proc(1, "", "usage limit reached"))
        text = gate.codex_pass("b", "h", "claude", "ctx")
        # Wording differs between the copies; what matters is that a dead
        # cross-check is VISIBLE and never reads as agreement.
        assert re.search(r"did not run|unavailable|no output|no stdout|failed", text, re.I), text[:200]
        assert "usage limit reached" in text

    def test_empty_output_renders_a_failure_block(self, monkeypatch):
        monkeypatch.setattr(gate, "run", lambda *a, **k: self._proc(0, "  \n"))
        text = gate.codex_pass("b", "h", "claude", "ctx")
        assert re.search(r"did not run|unavailable|no output|no stdout|failed", text, re.I), text[:200]

    def test_a_missing_codex_binary_does_not_abort_the_review(self, monkeypatch):
        """A FileNotFoundError must degrade to a note, not propagate and leave
        the PR with no report at all."""
        def boom(*a, **k):
            raise FileNotFoundError("codex")
        monkeypatch.setattr(gate, "run", boom)
        text = gate.codex_pass("b", "h", "claude", "ctx")
        assert isinstance(text, str) and text.strip()
        assert gate.blocking_findings(text)[0] == 0

    def test_failure_block_contributes_no_findings(self, monkeypatch):
        monkeypatch.setattr(gate, "run",
                            lambda *a, **k: self._proc(1, "", "boom [P0] boom"))
        text = gate.codex_pass("b", "h", "claude", "ctx")
        assert gate.blocking_findings(text)[0] == 0

    def test_real_output_passes_through(self, monkeypatch):
        monkeypatch.setattr(gate, "run",
                            lambda *a, **k: self._proc(0, "- [P1] MISSED: x — src/a.py:1"))
        assert "MISSED" in gate.codex_pass("b", "h", "claude", "ctx")


class TestSkipPathNeverFailsOpen:
    """This function only runs after existing_review_sha matched a marker
    comment, so a comment provably exists. An empty or failed fetch is never a
    legitimate 'no review' -- it is 'I could not look', and treating the
    untrustworthy answer as clean greens the check with the red review still
    sitting on the PR."""

    @staticmethod
    def _proc(rc, out, err=""):
        class R: pass
        r = R(); r.returncode, r.stdout, r.stderr = rc, out, err
        return r

    def test_nonzero_gh_exit_raises(self, monkeypatch):
        monkeypatch.setattr(gate, "run", lambda *a, **k: self._proc(1, "", "api error"))
        with pytest.raises(RuntimeError):
            gate.existing_review_body("o/r", 1)

    def test_empty_result_raises(self, monkeypatch):
        monkeypatch.setattr(gate, "run", lambda *a, **k: self._proc(0, ""))
        with pytest.raises(RuntimeError):
            gate.existing_review_body("o/r", 1)

    def test_marker_selector_matches_its_sibling(self, monkeypatch):
        """A HUMAN comment merely QUOTING the marker must not become 'the
        review' -- it parses to zero findings and greens the check."""
        import json as _json
        quoted = _json.dumps({"body": "I think `<!-- ai-review:` is the marker"})
        real = _json.dumps({"body": _report(claude_body="### [P1] x\n`src/a.py:1` d")
                            + "\n<sub><!-- ai-review:abc1234 --></sub>"})
        monkeypatch.setattr(gate, "run",
                            lambda *a, **k: self._proc(0, real + "\n" + quoted))
        got = gate.existing_review_body("o/r", 1)
        assert got is not None
        assert gate.blocking_findings(got)[0] == 1


class TestCodexMissedScoping:
    def test_a_missed_heading_scopes_the_bullets_under_it(self):
        body = ("pre\n<details><summary><b>T1 · Codex cross-check</b></summary>\n"
                "### Findings the first pass MISSED\n"
                "- [P0] unguarded delete — src/x.py:10\n"
                "- [P1] no timeout on the Azure call — src/y.py:3\n</details>")
        counts = gate.severity_counts(body)
        assert (counts["P0"], counts["P1"]) == (1, 1)

    def test_a_later_heading_closes_the_scope(self):
        body = ("pre\n<details><summary><b>T1 · Codex cross-check</b></summary>\n"
                "### MISSED\n- [P0] real — src/x.py:1\n"
                "### Dispositions\n- [P0] CONFIRM: not a new finding — src/y.py:2\n"
                "</details>")
        assert gate.severity_counts(body)["P0"] == 1


class TestTableFindings:
    """CLAUDE_PROMPT asks for '[sev] title | file:line | ...' -- a
    pipe-delimited spec -- and the inlined checklist is full of tables. A model
    rendering that spec as a table produced rows the prefix rule rejected."""

    def test_table_row_counts(self):
        body = ("| Sev | Title | Location |\n|---|---|---|\n"
                "| [P0] | unguarded delete | src/x.py:10 |\n")
        assert gate.blocking_findings(body)[0] == 1

    def test_table_row_with_a_backticked_location_counts(self):
        """Locations are routinely written as inline code. Checking the MASKED
        line for one dropped every such row -- an undercount, which is the
        false-green direction this gate exists to stop."""
        body = ("| Sev | Issue | Where |\n|---|---|---|\n"
                "| [P0] | unguarded delete | `src/x.py:10` |\n")
        assert gate.blocking_findings(body)[0] == 1

    def test_table_separator_is_not_a_finding(self):
        assert gate.blocking_findings("|---|---|\n")[0] == 0


@pytest.mark.skipif(
    "HARNESS ERROR" not in SCRIPT.read_text(encoding="utf-8"),
    reason="this build's error handler posts no comment, so it cannot clobber "
           "the review; there is nothing to pin")
class TestHarnessNoticeNeverClobbersTheReview:
    """The harness-error body carries the head SHA marker, so upsert_comment
    would see same_commit and PATCH the real review comment -- replacing the
    findings the gate is enforcing with a four-line error."""

    def test_the_error_handler_posts_a_new_comment(self):
        src = SCRIPT.read_text(encoding="utf-8")
        tail = src[src.index("HARNESS ERROR") - 900:src.index("HARNESS ERROR")]
        assert "post_comment(" in tail, "must not upsert over the review"

    def test_post_comment_never_patches(self):
        """Checked against the CODE. Its docstring necessarily mentions PATCH,
        to explain the thing it exists to avoid."""
        import inspect
        src_lines = inspect.getsource(gate.post_comment).splitlines()
        in_doc = False
        code = []
        for ln in src_lines:
            if ln.strip().startswith('"""'):
                in_doc = not in_doc
                if ln.strip().endswith('"""') and len(ln.strip()) > 3:
                    in_doc = False
                continue
            if not in_doc:
                code.append(ln)
        code = "\n".join(code)
        assert "PATCH" not in code
        assert "issues/comments/" not in code

class TestWaiver:
    def test_absent_by_default(self):
        assert gate.has_waiver({}) is False
        assert gate.has_waiver({"labels": []}) is False

    def test_unrelated_labels_do_not_waive(self):
        assert gate.has_waiver({"labels": [{"name": "ci"}, {"name": "ai-review"}]}) is False

    def test_exact_label_waives(self):
        assert gate.has_waiver({"labels": [{"name": gate.WAIVER_LABEL}]}) is True

    def test_malformed_label_entries_do_not_crash(self):
        assert gate.has_waiver({"labels": [None, {}, {"name": gate.WAIVER_LABEL}]}) is True


class TestFormatting:
    def test_only_present_severities_are_listed(self):
        counts = {"P0": 0, "P1": 2, "P2": 0, "P3": 9}
        assert gate._fmt(counts, gate.BLOCKING_SEVERITIES) == "2 P1"

    def test_empty_when_nothing_blocking(self):
        counts = {"P0": 0, "P1": 0, "P2": 0, "P3": 3}
        assert gate._fmt(counts, gate.BLOCKING_SEVERITIES) == ""


class TestWiring:
    """The gate is only real if its count reaches the process exit code."""

    def test_pr_meta_requests_labels(self):
        """has_waiver reads meta['labels']; if pr_meta stops fetching them the
        waiver silently never applies. Pin the two together."""
        src = SCRIPT.read_text(encoding="utf-8")
        assert "baseRefOid,headRefOid,title,author,labels" in src

    def test_main_returns_nonzero_when_a_pr_is_blocked(self):
        src = SCRIPT.read_text(encoding="utf-8")
        assert "P0/P1 findings block the check" in src, "main() must fail the job"

    def test_skip_path_carries_the_prior_verdict(self):
        """Re-running a review on an unchanged head must not launder a red
        check green with the findings untouched."""
        src = SCRIPT.read_text(encoding="utf-8")
        assert "existing_review_body" in src
        assert "carrying" in src


class TestATaggedLineIsAFindingNotAHeader:
    """`_is_section_header` admits three shapes -- `#`, fully bold, and any line
    ending in `:` -- and the last one is also an ordinary bullet title
    introducing a nested detail list. Letting a TAGGED bullet change MISSED
    scope zeroed every finding under the heading, and undercounts read green."""

    def test_a_tagged_bullet_ending_in_a_colon_does_not_close_the_scope(self):
        body = ("pre\n<details><summary><b>T1 · Codex cross-check</b></summary>\n"
                "### Findings the first pass MISSED\n"
                "- [P0] Race between upload and process:\n"
                "  the second write clobbers the first — src/a.py:12\n"
                "- [P1] No timeout on the Azure call — src/b.py:3\n</details>")
        counts = gate.severity_counts(body)
        assert (counts["P0"], counts["P1"]) == (1, 1), \
            "the colon-terminated bullet closed the scope and zeroed the P1"

    def test_a_bold_tagged_bullet_does_not_close_the_scope(self):
        body = ("pre\n<details><summary><b>T1 · Codex cross-check</b></summary>\n"
                "### Findings the first pass MISSED\n"
                "- **[P0] unguarded delete — src/a.py:1**\n"
                "- [P1] no timeout — src/b.py:3\n</details>")
        counts = gate.severity_counts(body)
        assert (counts["P0"], counts["P1"]) == (1, 1)

    def test_a_genuine_heading_still_closes_the_scope(self):
        """Only `#` may close it -- otherwise CONFIRM/REFUTE dispositions under
        a later heading get counted as new findings."""
        body = ("pre\n<details><summary><b>T1 · Codex cross-check</b></summary>\n"
                "### MISSED\n- [P0] real — src/x.py:1\n"
                "### [P1] Dispositions\n- [P0] CONFIRM: known — src/y.py:2\n"
                "</details>")
        counts = gate.severity_counts(body)
        assert counts["P0"] == 1

    def test_a_tagged_heading_can_still_open_the_scope(self):
        body = ("pre\n<details><summary><b>T1 · Codex cross-check</b></summary>\n"
                "### [P0] MISSED: unguarded delete — src/x.py:1\n"
                "- [P1] no timeout — src/y.py:2\n</details>")
        counts = gate.severity_counts(body)
        assert (counts["P0"], counts["P1"]) == (1, 1)


class TestMaskingCannotSilentlyDropATier:
    """`mask_code` pairs fence lines sequentially over the WHOLE body, and
    build_report concatenates the tiers into one document. An odd fence run in
    the Claude section leaves an opener live that the first fence in the Codex
    section closes -- blanking the `<summary>` marker in between. `codex_at`
    then reads as 'there is no cross-check' and every Codex MISSED P0
    contributed zero: a green check with a blocker open."""

    # Three fence lines in Claude (the ordinary rendering when a review quotes
    # markup) leave the third one open; the first fence in the Codex section
    # closes it, and everything between -- the Codex <summary> marker included
    # -- is blanked.
    _ODD_CLAUDE = "### [P1] quoting markup\n```markdown\n### [P2] example\n```\n```"
    # The blocking bullet sits INSIDE the span the stray opener now spans, so
    # it is blanked along with the marker -- the zero-findings false green.
    _CODEX_WITH_FENCE = ("### Findings the first pass MISSED\n"
                         "- [P0] unguarded delete — src/x.py:10\n"
                         "```\nsnippet\n```\n")

    def test_an_odd_fence_run_in_claude_does_not_hide_the_codex_section(self):
        body = _report(claude_body=self._ODD_CLAUDE, codex_body=self._CODEX_WITH_FENCE)
        counts = gate.severity_counts(body)
        assert counts["P0"] >= 1, \
            "the Codex section was masked away and its P0 counted zero"
        assert gate.blocking_findings(body)[0] >= 1

    def test_the_tier_marker_survives_masking(self):
        body = _report(claude_body=self._ODD_CLAUDE, codex_body=self._CODEX_WITH_FENCE)
        assert gate._extract_details(gate.mask_code(body), gate._CODEX_SUMMARY) is not None

    def test_a_genuinely_absent_codex_section_still_counts_zero(self):
        """The guard keys on the marker being in the RAW body. A report that
        never had a Codex section must not start over-counting."""
        body = ("<details open><summary><b>T1 · Claude static review</b></summary>\n"
                "clean\n</details>")
        assert gate.blocking_findings(body)[0] == 0


class TestSkipPathRefusesAnInconsistentBody:
    def test_none_body_raises_rather_than_counting_zero(self, monkeypatch):
        """`existing_review_sha` matched a marker comment, so `None` here means
        the two matchers disagree. `or ""` turned that into 0 blocking -- the
        fail-open the rest of the skip path exists to close."""
        monkeypatch.setattr(gate, "pr_meta", lambda *a, **k: {
            "baseRefOid": "b" * 40, "headRefOid": "h" * 40, "labels": []})
        monkeypatch.setattr(gate, "run", lambda *a, **k: None)
        # Two shapes exist across the repos: (id, sha) and (id, sha, partial).
        wide = "reviewed_partial" in inspect.getsource(gate.review_one)
        monkeypatch.setattr(
            gate, "existing_review_sha",
            lambda *a, **k: (None, "h" * 40, False) if wide else (None, "h" * 40))
        monkeypatch.setattr(gate, "existing_review_body", lambda *a, **k: None)
        with pytest.raises(RuntimeError):
            gate.review_one("o/r", 1, {}, False, False, False, False)


class TestMainExitCodes:
    """Nothing exercised `main()` itself: a regression that made it return 0
    again would pass every other test in this file."""

    def _main(self, monkeypatch, argv, review_one, prs=(1,)):
        monkeypatch.setattr(sys, "argv", ["ai_pr_review.py"] + argv)
        monkeypatch.setattr(gate, "load_config", lambda *a, **k: {"stack": "python"})
        monkeypatch.setattr(gate, "open_prs", lambda *a, **k: list(prs))
        monkeypatch.setattr(gate, "review_one", review_one)
        # Only the build whose error handler posts a harness notice has these
        # on the main() path; raising=False keeps the file shared across repos.
        monkeypatch.setattr(gate, "pr_meta", lambda *a, **k: {"headRefOid": "h" * 40},
                            raising=False)
        monkeypatch.setattr(gate, "post_comment", lambda *a, **k: None, raising=False)
        return gate.main()

    def test_blocking_findings_fail_the_single_pr_check(self, monkeypatch):
        assert self._main(monkeypatch, ["--repo", "o/r", "--pr", "1"],
                          lambda *a, **k: 2) == 1

    def test_a_clean_pr_passes(self, monkeypatch):
        assert self._main(monkeypatch, ["--repo", "o/r", "--pr", "1"],
                          lambda *a, **k: 0) == 0

    def test_a_crashed_review_fails_the_single_pr_check(self, monkeypatch):
        def boom(*a, **k):
            raise RuntimeError("gh exploded")
        assert self._main(monkeypatch, ["--repo", "o/r", "--pr", "1"], boom) == 1

    def test_the_sweep_is_exempt_from_another_prs_findings(self, monkeypatch):
        assert self._main(monkeypatch, ["--repo", "o/r", "--all"],
                          lambda *a, **k: 3, prs=(1, 2)) == 0

    def test_the_sweep_is_exempt_from_a_transient_error_too(self, monkeypatch):
        """The `blocked` branch already exempts --all; the `errors` branch did
        not, so one rate-limited `gh` call across N PRs made the 6-hourly
        scheduled job permanently red -- and it gates nothing."""
        def boom(*a, **k):
            raise RuntimeError("gh rate limited")
        assert self._main(monkeypatch, ["--repo", "o/r", "--all"],
                          boom, prs=(1, 2)) == 0


class TestUntaggedProseDoesNotCloseTheScope:
    """The sibling of the tagged-bullet bug. `_is_section_header` admits any
    line ending in `:`, and Codex's own cross-check section literally emits
    `Full review comments:` between the MISSED heading and its bullets -- so
    the reviewer's own output format zeroed the findings under it."""

    def test_explanatory_prose_ending_in_a_colon_keeps_the_scope_open(self):
        body = ("pre\n<details><summary><b>T1 · Codex cross-check</b></summary>\n"
                "### Findings the first pass MISSED\n"
                "Full review comments:\n\n"
                "- [P0] unguarded delete — src/x.py:10\n"
                "- [P1] no timeout — src/y.py:3\n</details>")
        counts = gate.severity_counts(body)
        assert (counts["P0"], counts["P1"]) == (1, 1), \
            "`Full review comments:` closed the scope and zeroed both findings"

    def test_a_bold_label_between_heading_and_bullets_keeps_it_open(self):
        body = ("pre\n<details><summary><b>T1 · Codex cross-check</b></summary>\n"
                "### Findings the first pass MISSED\n"
                "**Details**\n"
                "- [P0] unguarded delete — src/x.py:10\n</details>")
        assert gate.severity_counts(body)["P0"] == 1

    def test_a_hash_heading_still_closes_it(self):
        body = ("pre\n<details><summary><b>T1 · Codex cross-check</b></summary>\n"
                "### MISSED\n- [P0] real — src/x.py:1\n"
                "### Dispositions\n- [P0] CONFIRM: known — src/y.py:2\n</details>")
        assert gate.severity_counts(body)["P0"] == 1


@pytest.mark.skipif(not hasattr(gate, "SCOPE_GUARD_MARKER"),
                    reason="this build's scope guard does not reject unread -- it routes "
                           "large PRs through bounded batches, so there is no unreviewed "
                           "body for the skip path to miscount")
class TestAnUnreviewedPRNeverGoesGreenOnRerun:
    """The scope-guard notice carries the head-SHA marker, so the NEXT run at the
    same head takes the skip path. That body has zero `[Pn]` tags, so it counted
    0 and the required check went green on a PR no model ever read -- reachable
    with nothing but GitHub's 'Re-run failed jobs' button."""

    def _review_one(self, monkeypatch, prior, labels=()):
        monkeypatch.setattr(gate, "pr_meta", lambda *a, **k: {
            "baseRefOid": "b" * 40, "headRefOid": "h" * 40,
            "labels": [{"name": n} for n in labels]})
        monkeypatch.setattr(gate, "run", lambda *a, **k: None)
        wide = "reviewed_partial" in inspect.getsource(gate.review_one)
        monkeypatch.setattr(
            gate, "existing_review_sha",
            lambda *a, **k: (None, "h" * 40, False) if wide else (None, "h" * 40))
        monkeypatch.setattr(gate, "existing_review_body", lambda *a, **k: prior)
        return gate.review_one("o/r", 1, {}, False, False, False, False)

    def _scope_guard_body(self):
        return ("## AI Code Review — SCOPE GUARD\n\nToo large.\n\n"
                f"<sub><!-- ai-review:hhhhhhh --></sub>\n"
                f"<sub>{gate.SCOPE_GUARD_MARKER}</sub>")

    def test_rerunning_an_unreviewed_pr_stays_red(self, monkeypatch):
        assert self._review_one(monkeypatch, self._scope_guard_body()) == 1

    def test_the_waiver_can_clear_it(self, monkeypatch):
        """Every other blocking path consults the waiver. A refusal with no way
        through gets bypassed by an admin merge, which leaves no record."""
        assert self._review_one(monkeypatch, self._scope_guard_body(),
                                labels=(gate.WAIVER_LABEL,)) == 0

    def test_a_real_clean_review_still_skips_green(self, monkeypatch):
        clean = _report(claude_body="no findings") + "\n<sub><!-- ai-review:hhhhhhh --></sub>"
        assert self._review_one(monkeypatch, clean) == 0


@pytest.mark.skipif(not hasattr(gate, "claude_pass"),
                    reason="this build's primary tier is the chunked claude_review, whose "
                           "fail-closed branch also covers over-cap truncation -- different "
                           "semantics, tracked separately")
class TestADeadPrimaryTierIsWaivable:
    """Every other blocking path in `review_one` consults `has_waiver` first --
    scope-guard skip, scope-guard fresh, skip-with-findings, fresh findings.
    This one did not, and the TIER_FAILURE_MARKER skip branch was deliberately
    changed to fall THROUGH onto it, so applying the label changed nothing: a
    dead `claude` CLI blocked the merge with no way through. A gate with no way
    through gets bypassed by an admin merge, which leaves no record at all --
    exactly what WAIVER_LABEL exists to replace.

    "Nothing was reviewed" is the same state the scope guard reaches, and that
    path has always honoured the waiver. The two disagreeing was the bug.
    """

    def _run(self, monkeypatch, labels=()):
        monkeypatch.setattr(gate, "pr_meta", lambda *a, **k: {
            "baseRefOid": "b" * 40, "headRefOid": "h" * 40,
            "labels": [{"name": n} for n in labels]})
        monkeypatch.setattr(gate, "run", lambda *a, **k: None)
        wide = "reviewed_partial" in inspect.getsource(gate.review_one)
        monkeypatch.setattr(gate, "existing_review_sha",
                            lambda *a, **k: (None, None, False) if wide else (None, None))
        stats = {"files": 1, "added": 1, "removed": 0, "commits": 1,
                 "authors": 1, "deleted": []}
        monkeypatch.setattr(gate, "scope_guard", lambda *a, **k: (True, "", stats))
        monkeypatch.setattr(gate, "pr_context", lambda *a, **k: "")
        monkeypatch.setattr(gate, "claude_pass", lambda *a, **k: ("the tier died", False))
        monkeypatch.setattr(gate, "codex_pass", lambda *a, **k: "")
        monkeypatch.setattr(gate, "run_dynamic", lambda *a, **k: None)
        monkeypatch.setattr(gate, "run_live_llm", lambda *a, **k: None)
        # dry_run=True so the test never posts; the dry-run path deliberately
        # falls through to this same fail-closed branch.
        return gate.review_one("o/r", 1, {}, False, False, True, False)

    def test_a_dead_tier_still_fails_closed(self, monkeypatch):
        assert self._run(monkeypatch) == 1

    def test_the_waiver_can_clear_a_dead_tier(self, monkeypatch):
        assert self._run(monkeypatch, labels=(gate.WAIVER_LABEL,)) == 0
