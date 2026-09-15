"""Regression tests for draft-PR review workflow invariants."""

from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_draft_push_cannot_cancel_requested_ai_review():
    workflow = (ROOT / ".github/workflows/ai-pr-review.yml").read_text()
    assert "github.event.pull_request.draft != true" in workflow


def test_ai_review_docs_do_not_claim_removed_scheduled_sweep():
    script = (ROOT / "scripts/ai_review/ai_pr_review.py").read_text()
    for stale_claim in ("30-min sweep", "6-hourly sweep", "scheduled job"):
        assert stale_claim not in script
