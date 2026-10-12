"""ai-review phase timings (CI-speed roadmap step 5).

The whole review is one workflow step, so the job log could not say whether
npm install, next build, lint or the model calls cost its 12-35 minutes. Each
phase now prints a ::notice:: line and appends a row to $GITHUB_STEP_SUMMARY.
The timer must be purely observational: it never changes a result, never
swallows an exception, and never breaks a review when the summary file is
missing or unwritable.
"""
import importlib.util
import re
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT = REPO_ROOT / "scripts" / "ai_review" / "ai_pr_review.py"


@pytest.fixture
def mod(monkeypatch):
    spec = importlib.util.spec_from_file_location("ai_pr_review_timings", SCRIPT)
    m = importlib.util.module_from_spec(spec)
    sys.modules["ai_pr_review_timings"] = m
    spec.loader.exec_module(m)
    monkeypatch.setattr(m, "_TIMING_HEADER_WRITTEN", False)
    return m


def _rows(path):
    return [line for line in path.read_text().splitlines() if line.startswith("| ") and "---" not in line]


def test_rows_go_to_the_job_summary_under_one_header(mod, tmp_path, monkeypatch, capsys):
    summary = tmp_path / "summary.md"
    monkeypatch.setenv("GITHUB_STEP_SUMMARY", str(summary))
    mod.record_phase("#7 T1 claude", 123.4)
    mod.record_phase("T2 build", 61.0, "ok")

    text = summary.read_text()
    assert text.count("### ai-review phase timings") == 1
    assert _rows(summary) == ["| Phase | Seconds | Outcome |",
                              "| #7 T1 claude | 123 | ok |",
                              "| T2 build | 61 | ok |"]
    assert "::notice title=ai-review timing::#7 T1 claude: 123s (ok)" in capsys.readouterr().out


def test_a_phase_that_raises_is_recorded_and_the_error_still_propagates(mod, tmp_path, monkeypatch):
    summary = tmp_path / "summary.md"
    monkeypatch.setenv("GITHUB_STEP_SUMMARY", str(summary))
    with pytest.raises(subprocess.TimeoutExpired):
        with mod._phase("T2 install"):
            raise subprocess.TimeoutExpired("npm ci", 900)
    assert "| T2 install | 0 | raised TimeoutExpired |" in summary.read_text()


@pytest.mark.parametrize("summary_env", [None, "/nonexistent-dir/summary.md"])
def test_timing_never_breaks_a_review(mod, monkeypatch, summary_env):
    if summary_env is None:
        monkeypatch.delenv("GITHUB_STEP_SUMMARY", raising=False)
    else:
        monkeypatch.setenv("GITHUB_STEP_SUMMARY", summary_env)
    with mod._phase("#1 T1 codex") as p:
        result = 42
    assert result == 42 and p.name == "#1 T1 codex"


def test_pr_controlled_phase_names_cannot_inject_commands_or_break_the_table(
        mod, tmp_path, monkeypatch, capsys):
    """A check command comes from the PR's review_config.json."""
    summary = tmp_path / "summary.md"
    monkeypatch.setenv("GITHUB_STEP_SUMMARY", str(summary))
    evil = "T2 check: npm run lint\n::error::pwned\r\n| x | y |%0A" + "z" * 300

    mod.record_phase(evil, 5)

    out = capsys.readouterr().out
    lines = out.splitlines()
    assert len(lines) == 1 and lines[0].startswith("::notice title=ai-review timing::")
    assert not any(line.startswith("::error") for line in lines)
    assert "%250A" in lines[0], "% must be escaped as %25 in workflow-command data"
    rows = _rows(summary)
    assert len(rows) == 2, rows  # header + one row: the name could not add rows
    cells = re.split(r"(?<!\\)\|", rows[1].strip())[1:-1]
    assert len(cells) == 3, f"the name added table cells: {cells}"
    assert "\\| x \\| y \\|" in cells[0]
    assert len(rows[1]) < 200, "the name is bounded"


def _fake_run(returncodes):
    calls = []

    def run(cmd, **kw):
        calls.append(cmd[-1])
        return subprocess.CompletedProcess(cmd, returncodes.get(cmd[-1], 0), "out", "err")
    return run, calls


def test_dynamic_node_times_install_build_and_each_check(mod, tmp_path, monkeypatch):
    summary = tmp_path / "summary.md"
    monkeypatch.setenv("GITHUB_STEP_SUMMARY", str(summary))
    run, calls = _fake_run({})
    monkeypatch.setattr(mod, "run", run)
    cfg = {"node": {"install": "npm ci", "build": "npm run build", "checks": ["npm run lint"]}}

    res = mod.dynamic_node(cfg)

    assert res["install_ok"] and res["build_ok"] and res["checks"][0]["ok"]
    assert calls == ["npm ci", "npm run build", "npm run lint"]
    phases = [row.split("|")[1].strip() for row in _rows(summary)[1:]]
    assert phases == ["T2 install", "T2 build", "T2 check: npm run lint"]


def test_a_failed_install_records_only_the_install(mod, tmp_path, monkeypatch):
    summary = tmp_path / "summary.md"
    monkeypatch.setenv("GITHUB_STEP_SUMMARY", str(summary))
    run, calls = _fake_run({"npm ci": 1})
    monkeypatch.setattr(mod, "run", run)

    res = mod.dynamic_node({"node": {"install": "npm ci"}})

    assert res["install_ok"] is False
    assert calls == ["npm ci"]
    assert [row.split("|")[1].strip() for row in _rows(summary)[1:]] == ["T2 install"]


def test_review_one_times_each_model_and_tier_call():
    """Every expensive call in review_one sits inside a _phase block."""
    src = SCRIPT.read_text()
    body = src[src.index("def review_one("):src.index("\ndef ", src.index("def review_one(") + 1)]
    for label, call in (("T1 claude", "claude_pass("), ("T1 codex", "codex_pass("),
                        ("T1 codex verdicts", "codex_verdicts("), ("T2 total", "run_dynamic("),
                        ("T3 live", "run_live_llm(")):
        m = re.search(r'with _phase\(f"#\{pr\} ' + re.escape(label) + r'[^"]*"\):\n\s+[^\n]*'
                      + re.escape(call), body)
        assert m, f"{call} is not timed as {label!r}"
