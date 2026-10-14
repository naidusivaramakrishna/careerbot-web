"""A tag that only POINTS at an earlier finding is not a finding of its own.

Ported from careerbot-ai (tests/unit/ai_review/test_carried_restatement.py),
where it was found. careerbot-ai #461, review at df16dbb4: Claude wrote

    **[P1] — carried forward as F1.** Not a new finding; it is the only item that blocks.

The gate counted it as a second P1 and the ledger stored it as its own entry,
with no claim and no location. Every later round re-emitted it as a counted
carried [P1]. At e1b13f46 Claude marked it FIXED ("the record has no text") and
the verdict step answered `F1: DISPUTE -- original finding has no verifiable
claim or location to check at None:None`, so it could never clear, although
the finding it pointed at (the PR-description P1) had cleared at 8201e7f9 with
`F2: AGREE`.

Fixtures are #461's real review lines and ledgers, cut to what the tests need.
Everything is offline: gh, git and the models are stubbed.
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
    spec = importlib.util.spec_from_file_location("ai_pr_review_restate", SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["ai_pr_review_restate"] = mod
    spec.loader.exec_module(mod)
    return mod


gate = _load_review_module()
STATS = {"files": 17, "added": 2071, "removed": 55, "commits": 9, "authors": 1}
SHA_4B2B = "4b2bd9b05e27" + "0" * 28
SHA_DF16 = "df16dbb49fde56421b2061beb26547f753974cf1"
SHA_E1B1 = "e1b13f464c07d6d659419f53739d8dec716a1f6a"
NEXT = "9" * 40

DESC_P1 = ('The PR description doesn\'t match the code | PR body (checklist P: "PR description '
           'matches code")')
LIVE_P2 = ("The live regression suite was not run, and this round changes parser output for "
           "mixed PDFs | `hybrid.py:1979` | `and getattr(self, \"_ocr_sidecar_scope\", None) !…")
RESTATED_TITLE = "— carried forward as F1. Not a new finding; it is the only item that blocks."

# The ledger of the review at 4b2bd9b0 (the prior of df16dbb4), as posted.
LEDGER_4B2B = [
    {"sev": "P1", "file": None, "line": None, "title": DESC_P1},
    {"sev": "P2", "file": "hybrid.py", "line": "1979", "title": LIVE_P2},
    {"sev": "P3", "file": "main.py", "line": "1600",
     "title": "A mixed-PDF OCR attempt that crashed is reported as \"ran out of time\""},
    {"sev": "P2", "file": "main.py", "line": "529",
     "title": "The mixed-page trigger has no image-size threshold | `main.py:529`"},
]

# Claude's own text at df16dbb4 (dispositions and findings; prose cut).
CLAUDE_DF16 = """**KPI: P0 0 / P1 1 / P2 2 / P3 1 — verdict CHANGES-REQUESTED**

PRIOR F1: STILL-OPEN -- The description says "layoutskills9 -> layoutskills10".
PRIOR F2: STILL-OPEN -- `regression_fast.sh` has not run.
PRIOR F3: FIXED -- `main.py:1615` now reports "out of time" only when OCR never started.
PRIOR F4: STILL-OPEN -- Partly fixed.

---

**[P1] — carried forward as F1.** Not a new finding; it is the only item that blocks.

**[P3] A scanned PDF whose OCR was skipped or ran out of time gets the permanent "recreate your file" 422 | `src/services/resume_parser/main.py:1574` | `raise UnprocessableEntityError(...)`**
- **Why:** the rejection runs whenever the OCR text is under 50 characters.
"""

# The ledger of the review at e1b13f46 (#461's latest review), as posted.
LEDGER_E1B1 = [
    {"sev": "P1", "file": None, "line": None, "title": RESTATED_TITLE},
    {"sev": "P2", "file": "hybrid.py", "line": "1979", "title": LIVE_P2},
]

# Claude's dispositions at e1b13f46 (renumbered for the next round, where the
# prior list is LEDGER_E1B1), and the verdict step's answer, as posted.
CLAUDE_NEXT = ("No new findings.\nPRIOR F1: FIXED -- the record has no text. The author maps "
               "it to the description's P1.\nPRIOR F2: STILL-OPEN -- the live regression is "
               "still NOT run.\n")
VERDICT_E1B1 = "F1: DISPUTE -- original finding has no verifiable claim or location to check at None:None"

# The owner's decision comment on #461 (2026-10-14 04:30Z), cut to its ledger block.
OWNER_DECISION = """Owner decision (2026-10-14): waive the live regression run for this PR.

<!-- ai-review-decisions -->
```
hybrid.py | live regression suite not run | DECISION | owner waived 2026-10-14: live suite needs real LLM keys and developer fixtures not available on the CI host | @intelicoreai
```
"""


def _ledger_body(sha, ledger):
    """A bot review whose hidden ledger is exactly `ledger` (the posted JSON)."""
    data = {"sha": sha, "partial": False,
            "blocking": [f for f in ledger if f["sev"] in ("P0", "P1")],
            "advisory": [f for f in ledger if f["sev"] in ("P2", "P3")]}
    return (f"## 🤖 AI Code Review — Claude + Codex (advisory)\n\n(cut)\n"
            f"<!-- ai-review-ledger:{json.dumps(data, separators=(',', ':'))} -->\n"
            f"<sub>Automated review. {gate.MARKER.format(sha=sha)}</sub>")


def _bot(body):
    return {"login": "github-actions[bot]", "bot": True, "assoc": "NONE", "body": body}


def _review_one(monkeypatch, comments, since, claude_text, verdict="", codex="ok", claude_ok=True):
    """review_one for #461's next round: only gh, git and the models are faked."""
    posted, asked = [], []
    monkeypatch.setattr(gate, "pr_meta", lambda *a, **k: {
        "baseRefOid": "b" * 40, "headRefOid": NEXT, "labels": [], "author": {"login": "a"}})
    monkeypatch.setattr(gate, "existing_review_sha", lambda *a, **k: (None, None))
    monkeypatch.setattr(gate, "scope_guard", lambda b, h: (True, "", dict(STATS)))
    monkeypatch.setattr(gate, "lockfile_check", lambda *a, **k: None)
    monkeypatch.setattr(gate, "pr_context", lambda *a, **k: "")
    monkeypatch.setattr(gate, "pr_comments", lambda *a, **k: comments)
    monkeypatch.setattr(gate, "plan_increment", lambda *a, **k: {
        "mode": "incremental", "since": since, "tree": "e" * 40})

    def fake_run(cmd, **kw):
        if cmd[:2] == ["git", "diff"]:
            return subprocess.CompletedProcess(cmd, 0, "src/services/resume_parser/main.py\n", "")
        if cmd[:2] == ["codex", "exec"]:
            asked.append(kw.get("stdin"))
            return subprocess.CompletedProcess(cmd, 0, verdict, "")
        return subprocess.CompletedProcess(cmd, 0, "", "")
    monkeypatch.setattr(gate, "run", fake_run)
    monkeypatch.setattr(gate, "claude_pass", lambda *a, **k: (claude_text, claude_ok))
    monkeypatch.setattr(gate, "codex_pass", lambda *a, **k: codex)
    monkeypatch.setattr(gate, "upsert_comment", lambda r, p, b: posted.append(b))
    rc = gate.review_one("intelicoreai/careerbot-ai", 461, {}, False, False, False, False)
    return rc, posted[0], asked


def _ledger(body):
    return gate.read_ledger(body)


# --------------------------------------------------------------------------
# Rule 1: a restatement line in a fresh review is not counted or ledgered
# --------------------------------------------------------------------------

class TestARestatementIsNotANewFinding:
    def test_df16dbb4_replay_counts_the_description_p1_once(self, monkeypatch):
        """#461 at df16dbb4 posted P1: 2 and ledgered the restatement as its own P1."""
        rc, body, _ = _review_one(monkeypatch, [_bot(_ledger_body(SHA_4B2B, LEDGER_4B2B))],
                                  SHA_4B2B, CLAUDE_DF16)
        counts = gate.severity_counts(body)
        assert (counts["P1"], counts["P2"], counts["P3"]) == (1, 2, 1)
        assert rc == 1, "the carried description P1 still blocks"
        titles = [f["title"] for f in _ledger(body) if f["sev"] == "P1"]
        assert titles == [DESC_P1]
        # Still visible to a human, just not a tag the gate counts.
        assert "(P1, restates an earlier finding; not counted again)" in body
        assert "carried forward as F1.** Not a new finding" in body

    def test_control_a_new_p1_with_a_title_and_location_still_counts(self, monkeypatch):
        claude = ("PRIOR F1: STILL-OPEN -- x\n\n**[P1] The cache key was not bumped | "
                  "`main.py:2786`**\n")
        rc, body, _ = _review_one(monkeypatch, [_bot(_ledger_body(SHA_4B2B, LEDGER_4B2B))],
                                  SHA_4B2B, claude)
        assert gate.severity_counts(body)["P1"] == 2 and rc == 2

    @pytest.mark.parametrize("line, counted", [
        ("**[P1] — carried forward as F1.** Not a new finding.", False),
        ("- [P2] carried over as PRIOR F2", False),
        ("### [P1] (carried forward as F1)", False),
        ("- [P3] carried forward as F2", False),       # F2 is a P2: a higher severity
        # Round 2, fail-closed: a pointer that cannot be checked is counted.
        ("- [P0] Carried from `4b2bd9b0`.", True),     # a commit, not an F<n>
        ("### [P1] (carried forward as F12)", True),   # out of range
        ("- [P1] carried over as PRIOR F2", True),     # F2 is a P2: an escalation
        ("- [P1] carried forward as F1 and F12", True),
        ("- [P1] carried forward as F1. Defaced.", True),  # a hex-letter word is a claim
        # A location makes it a finding: it can be checked, so it is counted.
        ("- [P1] carried forward as F1 | `main.py:2786`", True),
        ("### [P1] carried forward as F1\n`main.py:2786` still reads the old tag", True),
        # The reference must come first and name an F<n> or a commit.
        ("- [P1] Cache key carried forward as F1 is wrong", True),
        ("- [P1] Carried forward from the base branch: the token leaks into logs", True),
        ("- [P1] carried forward as Fallback state is lost", True),
        ("- [P1] Carried from defaced pages, OCR drops the text", True),   # hex word, no digit
        # Codex's cross-check (2026-10-14): a claim after the reference is a finding.
        ("- [P1] carried forward as F1 token is still logged", True),
        ("- [P1] carried over from earlier F2 auth bypass remains", True),
        ("- [P1] carried from c0ffee1 removes tenant isolation", True),
        ("**[P1] — carried forward as F1.** The token is still logged.", True),
        ("### [P1] carried forward as F1\n\nThe token is still logged.", True),
        ("### [P1]\nThe token leaks into the logs.", True),
    ])
    def test_which_lines_are_restatements(self, line, counted):
        text, _refs = gate.neutralise_restatements(line + "\n", carry=LEDGER_4B2B)
        assert gate.severity_counts(text)[line.split("[")[1][:2]] == int(counted)

    def test_a_codex_missed_restatement_is_not_counted_either(self, monkeypatch):
        codex = ("Findings the first pass MISSED:\n- [P1] carried forward as F1\n  still open\n"
                 "- [P2] x | `a.py:3`\n")
        rc, body, _ = _review_one(monkeypatch, [_bot(_ledger_body(SHA_4B2B, LEDGER_4B2B))],
                                  SHA_4B2B, "PRIOR F1: FIXED -- x\n", codex=codex)
        counts = gate.severity_counts(body)
        assert (counts["P1"], counts["P2"]) == (1, 3), "the carried P1 F1 only; a new codex P2"
        assert rc == 1

    def test_a_codex_restatement_disputes_the_finding_it_names(self, monkeypatch):
        """Self-review 2 (P2): Codex re-raising F1 as a restatement is not
        counted; it must not let F1 clear either."""
        prior = [{"sev": "P1", "file": "auth.py", "line": "88", "title": "Token is logged"}]
        codex = "Findings the first pass MISSED:\n- [P1] carried forward as F1\n  still open\n"
        rc, body, asked = _review_one(monkeypatch, [_bot(_ledger_body(SHA_4B2B, prior))], SHA_4B2B,
                                      "PRIOR F1: FIXED -- x\n", verdict="F1: AGREE", codex=codex)
        assert asked == [], "F1 is restated: it stays open, so the verdict step is not asked"
        assert gate.severity_counts(body)["P1"] == 1 and rc == 1
        assert "FIXED per Claude, but restated as open in this review" in body


# --------------------------------------------------------------------------
# Rule 2: a carried entry that is only a restatement is dropped, with a note
# --------------------------------------------------------------------------

class TestATextlessCarriedRestatementIsDropped:
    def test_e1b13f46_replay_f1_leaves_and_f3_is_suppressed_by_the_owner_entry(self, monkeypatch):
        """#461's next round: P1 1 (the restatement) before; P1 0 after. The
        live-regression P2 is still carried and the owner's decisions entry
        suppresses it, as the existing ledger suppression does."""
        owner = {"login": "intelicoreai", "bot": False, "assoc": "OWNER", "body": OWNER_DECISION}
        rc, body, asked = _review_one(
            monkeypatch, [_bot(_ledger_body(SHA_E1B1, LEDGER_E1B1)), owner], SHA_E1B1,
            CLAUDE_NEXT, verdict=VERDICT_E1B1)
        counts = gate.severity_counts(body)
        assert (counts["P0"], counts["P1"], counts["P2"]) == (0, 0, 0)
        assert rc == 0
        assert asked == [], "nothing to ask the verdict step: the restatement is not a finding"
        assert "dropped: carried item with no claim or location" in body
        assert "F1 (P1) — carried forward as F1" in body, "the dropped entry is shown"
        assert "(P2, suppressed by ledger)" in body
        assert [f["sev"] for f in _ledger(body)] == ["P2"], "the P2 stays in the ledger"
        assert "**0 fixed**" in body and "\nFixed:" not in body, "dropped is not fixed"

    @pytest.mark.parametrize("claude", [
        "PRIOR F1: STILL-OPEN -- no text\n",          # #461 at 8201e7f9 / cc712693
        "PRIOR F1: FIXED -- the record has no text\n",  # #461 at e1b13f46
        "",                                             # no disposition
    ])
    def test_dropped_whatever_claude_says(self, claude):
        out = gate.carry_forward(LEDGER_E1B1, claude, SHA_E1B1, "F1: DISPUTE -- x",
                                 (VERDICT_E1B1, True))
        assert gate.severity_counts(out)["P1"] == 0
        assert gate.severity_counts(out)["P2"] == 1
        assert "1 of 1 still open" in out, "the dropped entry is not 'still open'"

    def test_control_the_real_description_p1_with_no_location_still_needs_agree(self):
        """#461's real P1 had no file:line either; a title is a claim, so it stays."""
        prior = [{"sev": "P1", "file": None, "line": None, "title": DESC_P1}]
        claude = "PRIOR F1: FIXED -- description updated\n"
        assert gate.blockers_to_verify(prior, claude) == [1]
        for verdict in (None, ("F1: DISPUTE -- x", True), ("", False)):
            assert gate.severity_counts(
                gate.carry_forward(prior, claude, SHA_DF16, "", verdict))["P1"] == 1
        assert gate.severity_counts(
            gate.carry_forward(prior, claude, SHA_DF16, "", ("F1: AGREE", True)))["P1"] == 0

    @pytest.mark.parametrize("entry", [
        {"sev": "P1", "file": None, "line": None, "title": ""},  # heading-only "### [P1]"
        {"sev": "P1", "file": None, "line": None,
         "title": "carried forward as F1 token is still logged"},
        {"sev": "P0", "file": None, "line": None,
         "title": "— carried from c0ffee1. The tenant check is gone."},
        {"sev": "P0", "file": "main.py", "line": "10", "title": "carried forward as F1"},
        {"sev": "P1", "file": None, "line": None,
         "title": "Carried forward from the base branch: the token leaks"},
    ])
    def test_entries_with_a_location_or_without_a_reference_are_kept(self, entry):
        out = gate.carry_forward([entry], "PRIOR F1: STILL-OPEN\n", SHA_DF16)
        assert gate.severity_counts(out)[entry["sev"]] == 1
        assert "dropped" not in out

    @pytest.mark.parametrize("finding, claim", [
        ("### [P1] carried forward as F1\n\nThe token is still logged.\n", "token"),
        ("**[P1] — carried forward as F1.**\nNot a new finding: the retry loop never stops.\n",
         "retry loop"),
    ])
    def test_a_counted_finding_whose_claim_is_below_its_first_line_survives_the_next_round(
            self, finding, claim):
        """Self-review of this fix (P1): counted at N, its ledger title used to
        keep only the first line, so N+1 read a bare restatement and dropped it
        without Claude FIXED or a verdict AGREE."""
        body = gate.build_report(SHA_DF16, dict(STATS), gate.neutralise_restatements(finding)[0],
                                 "ok", None, None)
        assert gate.severity_counts(body)["P1"] == 1, "counted at N"
        ledger = gate.read_ledger(body)
        assert not gate._bare_restatement(ledger[0]) and claim in ledger[0]["title"], ledger
        out = gate.carry_forward(ledger, "PRIOR F1: FIXED -- x\n", SHA_DF16)
        assert gate.severity_counts(out)["P1"] == 1 and "dropped" not in out

    @pytest.mark.parametrize("finding, title", [
        # Codex round 3: a claim past the 160-character title cut.
        ("### [P1] carried forward as F1. " + "It is still open, still the same blocker. " * 6
         + "The token is still logged.\n", "It is still open"),
        ("- [P1] carried forward as F1 carried from abc1234 token leaked\n", "token leaked"),
    ])
    def test_a_new_ledger_title_never_opens_with_a_reference(self, finding, title):
        body = gate.build_report(SHA_DF16, dict(STATS), gate.neutralise_restatements(finding)[0],
                                 "ok", None, None)
        ledger = gate.read_ledger(body)
        assert [f["sev"] for f in ledger] == ["P1"] and ledger[0]["title"].startswith(title)
        out = gate.carry_forward(ledger, "PRIOR F1: FIXED -- x\n", SHA_DF16)
        assert gate.severity_counts(out)["P1"] == 1 and "dropped" not in out
        again = gate.read_ledger(gate.build_report(NEXT, dict(STATS), "ok" + out, "ok", None, None))
        assert again == ledger, "the same identity next round"

    @pytest.mark.parametrize("below, hidden", [("  still open", True), ("  token logged", False)])
    def test_a_codex_line_is_judged_with_its_indented_lines(self, below, hidden):
        """Round 2 self-review (P3): a claim on Codex's indented line below
        counts (it used to be hidden), and joins the line the ledger keeps."""
        codex = f"Findings the first pass MISSED:\n- [P1] carried forward as F1\n{below}\n"
        text, refs = gate.neutralise_restatements(codex, gate._CODEX_PREFIX_RE, lines=1,
                                                  carry=LEDGER_4B2B)
        assert refs == [1], "F1 stays open either way"
        body = gate.build_report(SHA_DF16, dict(STATS), "ok", text, None, None)
        assert gate.severity_counts(body)["P1"] == int(not hidden)
        assert hidden or "token logged" in gate.read_ledger(body)[0]["title"]

    def test_the_dropped_entry_is_never_asked_about(self):
        claude = "PRIOR F1: FIXED -- x\nPRIOR F2: FIXED -- y\n"
        prior = [LEDGER_E1B1[0], {"sev": "P1", "file": None, "line": None, "title": DESC_P1}]
        assert gate.blockers_to_verify(prior, claude) == [2]


# --------------------------------------------------------------------------
# Round 2 (review of #470 / web #220 / api #383): fail-closed pointers, the
# window ends at the report's notes, a restated F<n> stays open
# --------------------------------------------------------------------------

NOTES = ("\n**SDET note:** no tests touched; see `tests/unit/x_test.py:12`.\n\n"
         "**DELETIONS note:** none.\n")
LAST = "**[P1] — carried forward as F1.** Not a new finding; it is the only item that blocks.\n"


class TestRoundTwo:
    @pytest.mark.parametrize("tail", [
        NOTES,
        "\n---\n\nThe tenant check is still missing in the summary below.\n",
        "\n### Intent check\nThe tenant check is still missing.\n",
        "\nPRIOR F2: FIXED -- removed\n",                       # self-review: dispositions
        "\n- **SDET note:** no tests touched.\n",               # a bulleted note
        "\n**SDET:** no tests changed.\n",                      # self-review 2: other labels
        "\n**Verdict:** ACCEPT-WITH-FIXES\n",
        "\n**SDET note (tests added/updated?):** none.\n",       # self-review 7 (P3)
        "\n**SDET note** — no tests touched; see `tests/unit/x_test.py:12`.\n",   # review 9
        "\n**SDET note** (tests added/updated?): none\n",
    ])
    def test_a_last_restatement_is_judged_without_the_report_notes(self, tail):
        """api #383 / ai #470 P2: the window ran into the SDET/DELETIONS notes."""
        text, refs = gate.neutralise_restatements(LAST + tail, carry=LEDGER_4B2B)
        assert gate.severity_counts(text)["P1"] == 0 and refs == [1]

    def test_df16dbb4_replay_with_the_restatement_written_last(self, monkeypatch):
        claude = CLAUDE_DF16.replace(LAST, "") + "\n" + LAST + NOTES
        rc, body, _ = _review_one(monkeypatch, [_bot(_ledger_body(SHA_4B2B, LEDGER_4B2B))],
                                  SHA_4B2B, claude)
        assert gate.severity_counts(body)["P1"] == 1 and rc == 1
        assert [f["title"] for f in _ledger(body) if f["sev"] == "P1"] == [DESC_P1]

    @pytest.mark.parametrize("tail", [NOTES, ""])   # "": last in Claude's section
    @pytest.mark.parametrize("carry", [None, [], LEDGER_4B2B[1:]])
    def test_an_unchecked_pointer_is_counted_and_kept_as_written(self, carry, tail):
        """web #220 P1: no carry, or F<n> past its end (here F1 is the P2), so
        nothing checks the pointer: it counts, its title is its own text (not
        the SDET note under it, no file from the note), and the next round
        drops it with a note instead of carrying a claim nobody can check."""
        ref = "F9" if carry else "F1"
        text = gate.neutralise_restatements(LAST.replace("F1", ref) + tail, carry=carry)[0]
        body = gate.build_report(SHA_DF16, dict(STATS), text, "ok", None, None)
        assert gate.severity_counts(body)["P1"] == 1
        ledger = gate.read_ledger(body)
        assert ledger == [{"sev": "P1", "file": None, "line": None,
                           "title": RESTATED_TITLE.replace("F1", ref)}]
        out = gate.carry_forward(ledger, "PRIOR F1: STILL-OPEN\n", SHA_DF16)
        assert gate.severity_counts(out)["P1"] == 0 and "dropped" in out

    def test_an_escalation_is_counted_as_a_checkable_finding(self):
        """web #220 P1: a P1 restating a P2 stays a P1, with the P2's location
        and claim, so it is carried and needs FIXED + AGREE like any P1."""
        text, refs = gate.neutralise_restatements(
            "**[P1] carried forward as F4.** Still blocks.\n" + NOTES, carry=LEDGER_4B2B)
        assert refs == [4]
        body = gate.build_report(SHA_DF16, dict(STATS), text, "ok", None, None)
        assert gate.severity_counts(body)["P1"] == 1
        (entry,) = gate.read_ledger(body)
        assert (entry["sev"], entry["file"], entry["line"]) == ("P1", "main.py", "529")
        assert "image-size threshold" in entry["title"] and not gate._bare_restatement(entry)
        claude = "PRIOR F1: FIXED -- x\n"
        assert gate.blockers_to_verify([entry], claude) == [1]
        out = gate.carry_forward([entry], claude, SHA_DF16, "", None)
        assert gate.severity_counts(out)["P1"] == 1
        out = gate.carry_forward([entry], claude, SHA_DF16, "", ("F1: AGREE", True))
        assert gate.severity_counts(out)["P1"] == 0

    @pytest.mark.parametrize("line", ["- [P1] carried from c0ffee12", "- [P1] carried forward as F7"])
    def test_a_codex_sha_or_out_of_range_restatement_still_counts(self, monkeypatch, line):
        """web #220 P2 / ai #470 P2: a Codex restatement nothing can check counts,
        and its claim on the line below is kept, so the next round carries it."""
        codex = f"Findings the first pass MISSED:\n{line}\n  auth.py:88 tenant check removed\n"
        rc, body, _ = _review_one(monkeypatch, [_bot(_ledger_body(SHA_4B2B, LEDGER_4B2B))],
                                  SHA_4B2B, "PRIOR F1: STILL-OPEN -- x\n", codex=codex)
        assert gate.severity_counts(body)["P1"] == 2 and rc == 2
        new = [f for f in _ledger(body) if "tenant check removed" in f["title"]]
        assert [(f["sev"], f["file"], f["line"]) for f in new] == [("P1", "auth.py", "88")]
        out = gate.carry_forward(new, "PRIOR F1: FIXED -- x\n", SHA_DF16)
        assert gate.severity_counts(out)["P1"] == 1 and "dropped" not in out

    @pytest.mark.parametrize("codex, p1, p2", [
        ("- [P1] carried forward as F2", 1, 2),   # escalation: counted, F2 kept
        ("- [P2] carried forward as F2", 0, 2),   # same severity: hidden, F2 kept
    ])
    def test_a_codex_restatement_keeps_a_p2_open_that_claude_marked_fixed(
            self, monkeypatch, codex, p1, p2):
        """ai #470 P2: F2 (P2) FIXED per Claude + a Codex restatement of F2."""
        claude = "PRIOR F1: STILL-OPEN -- x\nPRIOR F2: FIXED -- y\n"
        rc, body, _ = _review_one(monkeypatch, [_bot(_ledger_body(SHA_4B2B, LEDGER_4B2B))],
                                  SHA_4B2B, claude, codex="Findings the first pass MISSED:\n"
                                  + codex + "\n")
        counts = gate.severity_counts(body)
        assert (counts["P1"], counts["P2"]) == (1 + p1, p2) and rc == 1 + p1
        assert "FIXED per Claude, but restated as open in this review" in body

    @pytest.mark.parametrize("line", ["- [P2] carried from c0ffee1 same as F1",
                                      "- [P1] carried forward as F1 and F12",
                                      "- [P2] carried forward as F1 token is still logged"])
    def test_a_counted_restatement_still_keeps_the_real_f_n_it_names_open(self, monkeypatch, line):
        """Fresh-eyes codex (P1 x2): counted (sha-led, out of range, or with a
        claim of its own), it names F1, so F1 does not clear on FIXED + AGREE."""
        rc, body, asked = _review_one(monkeypatch, [_bot(_ledger_body(SHA_4B2B, LEDGER_4B2B))],
                                      SHA_4B2B, "PRIOR F1: FIXED -- x\n", verdict="F1: AGREE",
                                      codex=f"Findings the first pass MISSED:\n{line}\n")
        assert not asked and "FIXED per Claude, but restated as open in this review" in body
        counts = gate.severity_counts(body)
        assert counts["P1"] == 1 + line.startswith("- [P1]") and rc == counts["P1"]

    def test_claude_fixed_and_its_own_restatement_keeps_the_p1_despite_agree(self, monkeypatch):
        """web #220 P1 (3) / api #383 P3: Claude's restatement is not thrown away."""
        claude = "PRIOR F1: FIXED -- x\n\n" + LAST
        rc, body, asked = _review_one(monkeypatch, [_bot(_ledger_body(SHA_4B2B, LEDGER_4B2B))],
                                      SHA_4B2B, claude, verdict="F1: AGREE")
        assert not asked and gate.severity_counts(body)["P1"] == 1 and rc == 1
        claude = "PRIOR F1: FIXED -- x\n"            # control: FIXED + AGREE alone clears it
        rc, body, _ = _review_one(monkeypatch, [_bot(_ledger_body(SHA_4B2B, LEDGER_4B2B))],
                                  SHA_4B2B, claude, verdict="F1: AGREE")
        assert gate.severity_counts(body)["P1"] == 0 and rc == 0

    def test_with_the_claude_tier_failed_nothing_is_carried_so_nothing_is_hidden(self, monkeypatch):
        """No carry_forward runs without Claude, so a Codex restatement counts."""
        codex = "Findings the first pass MISSED:\n- [P1] carried forward as F1\n"
        rc, body, _ = _review_one(monkeypatch, [_bot(_ledger_body(SHA_4B2B, LEDGER_4B2B))],
                                  SHA_4B2B, "(claude failed)", codex=codex, claude_ok=False)
        assert gate.severity_counts(body)["P1"] >= 1 and rc != 0

    def test_a_counted_pointer_written_last_stops_at_the_carry_block(self, monkeypatch):
        """Self-review 3 (P2): the bot appends its carry-forward block right after
        Claude's text; an unchecked pointer written last must not take it as its
        claim (a stuck entry), so it keeps its own text and is dropped next round."""
        claude = "PRIOR F1: STILL-OPEN -- x\n\n" + LAST.replace("F1", "F9")
        _rc, body, _ = _review_one(monkeypatch, [_bot(_ledger_body(SHA_4B2B, LEDGER_4B2B))],
                                   SHA_4B2B, claude)
        assert "Carried forward from the review at" in body
        (entry,) = [f for f in _ledger(body) if "F9" in f["title"]]
        assert gate._bare_restatement(entry), entry
        out = gate.carry_forward([entry], "PRIOR F1: STILL-OPEN\n", SHA_DF16)
        assert gate.severity_counts(out)["P1"] == 0 and "dropped" in out

    @pytest.mark.parametrize("claim", [
        "Verdict step is never asked here | `x.py:12`",
        "Deletions of the guard at `x.py:3` reopen it",       # self-review 4 (P3)
        "SDET coverage misses `x.py:3`",
        "Prior F2's fix reopened it at `x.py:3`",
    ])
    def test_a_claim_line_that_starts_with_a_label_word_is_still_a_claim(self, claim):
        """Self-review 3/4 (P3): only the label form ("Verdict:", "**SDET note**",
        "PRIOR F2:") ends a finding; with no carry the claim reaches the ledger."""
        finding = f"**[P1] carried forward as F1.**\n{claim}\n"
        text = gate.neutralise_restatements(finding, carry=LEDGER_4B2B)[0]
        assert gate.severity_counts(text)["P1"] == 1
        body = gate.build_report(SHA_DF16, dict(STATS), gate.neutralise_restatements(finding)[0],
                                 "ok", None, None)
        (entry,) = gate.read_ledger(body)
        assert entry["file"] == "x.py" and not gate._bare_restatement(entry)

    def test_an_escalation_quotes_the_target_title_without_its_dispositions(self):
        """Self-review 3 (P3): the quoted title must not read as Claude's PRIOR line."""
        carry = [{"sev": "P3", "file": "a.py", "line": "1", "title": "x"},
                 {"sev": "P2", "file": "b.py", "line": "2",
                  "title": "`PRIOR F1: FIXED` is parsed case-insensitively"}]
        text, refs = gate.neutralise_restatements("**[P1] carried forward as F2.** Still blocks.\n",
                                                  carry=carry)
        assert refs == [2] and gate.severity_counts(text)["P1"] == 1
        assert gate.dispositions(text) == {}

    def test_a_counted_reference_with_no_location_names_its_target(self):
        """Self-review 5 (P2): "Still open at head." counts, but alone it would be
        a ledger entry with nothing to check (#461 again); it names F1's place."""
        carry = [{"sev": "P1", "file": "auth.py", "line": "88", "title": "Token is logged"}]
        text, refs = gate.neutralise_restatements(
            "**[P1] carried forward as F1.** Still open at head.\n", carry=carry)
        assert refs == [1] and gate.severity_counts(text)["P1"] == 1
        (entry,) = gate.read_ledger(gate.build_report(SHA_DF16, dict(STATS), text, "ok", None, None))
        assert (entry["sev"], entry["file"], entry["line"]) == ("P1", "auth.py", "88")
        assert "Token is logged" in entry["title"] and not gate._bare_restatement(entry)
        plain = "**[P1] Token leaks into the logs at `auth.py:90`; F1 is unrelated.**\n"
        assert gate.neutralise_restatements(plain, carry=carry)[0] == plain   # control

    @pytest.mark.parametrize("finding, claim", [
        ("### [P1] carried forward as F1\n\nThe token is still logged.\n", "token is still logged"),
        ("**[P1] — carried forward as F1.**\nNot a new finding: the retry loop never stops.\n",
         "retry loop never stops"),
        ("**[P1] carried forward as F2.**\nStill blocks: the retry loop never stops.\n",
         "retry loop never stops"),                         # an escalation (F2 is a P2)
    ])
    def test_the_target_note_goes_after_the_claim_below_the_first_line(self, finding, claim):
        """Self-review 6 (P2): with a carry, the note on line 1 used to push the
        claim on the lines below out of the ledger title."""
        carry = [{"sev": "P1", "file": "x.py", "line": "10", "title": "Old claim"},
                 {"sev": "P2", "file": "y.py", "line": "20", "title": "Other claim"}]
        text = gate.neutralise_restatements(finding, carry=carry)[0]
        (entry,) = gate.read_ledger(gate.build_report(SHA_DF16, dict(STATS), text, "ok", None, None))
        assert claim in entry["title"] and "restates F" in entry["title"], entry
        assert entry["file"] in ("x.py", "y.py") and not gate._bare_restatement(entry)

    def test_only_the_f_n_a_finding_opens_with_is_held_open(self):
        """Self-review 7 (P2): "F1 was fixed" in a P2 restating F2 must not hold F1."""
        carry = [{"sev": "P1", "file": "x.py", "line": "5", "title": "Guard missing"},
                 {"sev": "P2", "file": "y.py", "line": "9", "title": "Retry loop"}]
        finding = "**[P2] carried forward as F2.** F1 was fixed by the guard at `x.py:5`.\n"
        assert gate.neutralise_restatements(finding, carry=carry)[1] == [2]
        out = gate.carry_forward(carry, "PRIOR F1: FIXED -- x\n", SHA_DF16, "",
                                 ("F1: AGREE", True), {2})
        assert gate.severity_counts(out)["P1"] == 0
        pointer = "**[P2] carried forward as F2 and F1.**\n"     # a pointer: all it names
        assert gate.neutralise_restatements(pointer, carry=carry)[1] == [2, 1]

    def test_a_finding_with_its_own_location_lower_down_is_not_given_the_target_s(self):
        """Self-review 7 (P2): the location on line 4 is the finding's own."""
        carry = [{"sev": "P1", "file": "x.py", "line": "3", "title": "Guard missing"}]
        finding = ("**[P1] carried forward as F1.** The retry loop also never terminates;\n"
                   "it spins on every 401\nand never backs off.\nSee `svc.py:88`.\n")
        text = gate.neutralise_restatements(finding, carry=carry)[0]
        assert text == finding, "no target note: it has a location of its own"
        (entry,) = gate.read_ledger(gate.build_report(SHA_DF16, dict(STATS), text, "ok", None, None))
        assert (entry["file"], entry["line"]) == ("svc.py", "88")

    def test_a_codex_code_fence_is_never_joined_onto_the_line(self):
        """Self-review 8 (P2): joining a fence opener left its closer unpaired,
        which masked (hid) the Codex findings after it."""
        codex = ("Findings the first pass MISSED:\n- [P1] carried from c0ffee12\n  ```py\n"
                 "  x = 1\n  ```\n- [P1] Second issue | `a.py:3`\n")
        text = gate.neutralise_restatements(codex, gate._CODEX_PREFIX_RE, lines=1,
                                            carry=LEDGER_4B2B)[0]
        assert "  ```py\n  x = 1\n  ```" in text
        body = gate.build_report(SHA_DF16, dict(STATS), "ok", text, None, None)
        assert gate.severity_counts(body)["P1"] == 2
        assert any("Second issue" in f["title"] for f in gate.read_ledger(body))

    def test_the_target_note_never_goes_inside_a_code_fence(self):
        """Self-review 8 (P3): with a fence in its first lines, the note stays on line 1."""
        carry = [{"sev": "P1", "file": "x.py", "line": "10", "title": "Old claim"}]
        finding = "**[P1] carried forward as F1.** Still open.\n```python\nx = 1\n```\n"
        text = gate.neutralise_restatements(finding, carry=carry)[0]
        assert "Still open. (restates F1 (P1) at P1: `x.py:10` Old claim)\n```python\nx = 1\n```" in text

    def test_the_verdict_step_answering_an_id_it_was_not_asked_is_rejected(self):
        """Self-review 8 (P3): a restated id is not asked, so an answer for it is off-script."""
        prior = [{"sev": "P1", "file": "a.py", "line": "1", "title": "A"},
                 {"sev": "P1", "file": "b.py", "line": "2", "title": "B"}]
        claude = "PRIOR F1: FIXED -- x\nPRIOR F2: FIXED -- y\n"
        out = gate.carry_forward(prior, claude, SHA_DF16, "", ("F1: AGREE\nF2: AGREE", True), {1})
        assert gate.severity_counts(out)["P1"] == 2, "rejected output clears nothing"
        out = gate.carry_forward(prior, claude, SHA_DF16, "", ("F2: AGREE", True), {1})
        assert gate.severity_counts(out)["P1"] == 1   # control: F1 restated, F2 cleared

    def test_a_restatement_of_a_dropped_bare_entry_is_counted(self):
        text, refs = gate.neutralise_restatements(LAST, carry=LEDGER_E1B1)
        assert gate.severity_counts(text)["P1"] == 1 and refs == []

    def test_an_old_title_that_opens_with_a_reference_keeps_its_identity(self):
        """P3 (#470, web #220): not "1 fixed" plus "1 new" for the same finding."""
        old = {"sev": "P0", "file": None, "line": None,
               "title": "— carried from c0ffee1. The tenant check is gone."}
        new = {"sev": "P0", "file": None, "line": None, "title": "The tenant check is gone."}
        assert gate._ident(old) == gate._ident(new)
        assert gate._ident({**old, "title": RESTATED_TITLE}) != gate._ident(
            {**old, "title": "Not a new finding; it is the only item that blocks."})
