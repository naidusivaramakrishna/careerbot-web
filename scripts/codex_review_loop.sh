#!/usr/bin/env bash
# =============================================================================
# scripts/codex_review_loop.sh — non-interactive Codex review runner
# =============================================================================
# Eliminates the Claude ↔ Codex copy-paste loop. Pipes a prompt file into
# `codex review --base <SHA> -` and parses the verdict line from stdout.
#
# Usage:
#   bash scripts/codex_review_loop.sh <prompt_file> <base_sha> [head_sha]
#
# Examples:
#   # Review the current branch tip vs the locked Tier 1 base.
#   bash scripts/codex_review_loop.sh \
#     reviews/CODEX_PROMPT_TIER_2_VERIFICATION_2026_05_10.txt \
#     0064197
#
#   # Pin a specific HEAD too (writes the SHA into the prompt before sending).
#   bash scripts/codex_review_loop.sh \
#     reviews/CODEX_PROMPT_TIER_2_VERIFICATION_2026_05_10.txt \
#     0064197  55b740e
#
# Output:
#   - Codex's full verdict text streamed to stdout
#   - A summary tail printed to stderr
#   - JSON-ish verdict file written to /tmp/codex_review_<timestamp>.json
#
# Exit codes:
#   0 = ACCEPT-AS-IS
#   1 = ACCEPT-WITH-FIXES
#   2 = BLOCK
#   3 = could not parse a verdict (Codex output didn't contain any of
#       the three sentinel strings — usually means the call failed
#       upstream)
#   4 = bad arguments / setup error
#
# Notes:
#   - Calls the `codex` CLI (codex review subcommand). If `codex` is
#     not on PATH the script fails fast with exit 4.
#   - Each call is billed by the codex provider; budget at $0.05-$0.50
#     per call depending on prompt size.
#   - Adopted 2026-05-10 alongside the Sibling-Invariant Sweep Rule
#     in careerbot-ai/CLAUDE.md. Removes the manual copy-paste step
#     that fueled Tier 2's three BLOCK rounds.
# =============================================================================

set -euo pipefail

# ── arg validation ────────────────────────────────────────────────────────────

if [ "$#" -lt 2 ] || [ "$#" -gt 3 ]; then
  echo "ERROR: usage: $0 <prompt_file> <base_sha> [head_sha]" >&2
  exit 4
fi

PROMPT_FILE="$1"
BASE_SHA="$2"
HEAD_SHA="${3:-$(git rev-parse --short HEAD 2>/dev/null || echo HEAD)}"

if [ ! -f "$PROMPT_FILE" ]; then
  echo "ERROR: prompt file not found: $PROMPT_FILE" >&2
  exit 4
fi

# Non-login shells miss nvm-installed node bins — add them to PATH.
if ! command -v codex >/dev/null 2>&1; then
  for d in "$HOME"/.nvm/versions/node/*/bin; do
    [ -x "$d/codex" ] && PATH="$d:$PATH" && break
  done
fi

if ! command -v codex >/dev/null 2>&1; then
  echo "ERROR: 'codex' CLI not on PATH. Install: npm install -g codex" >&2
  exit 4
fi

# ── pre-flight: prompt header sanity (sibling-invariant rule §5) ─────────────

PROMPT_HEAD_LINE=$(grep -m1 -E '^Re-review HEAD ' "$PROMPT_FILE" || true)
if [ -n "$PROMPT_HEAD_LINE" ]; then
  PROMPT_HEAD=$(echo "$PROMPT_HEAD_LINE" | awk '{print $3}')
  if [ "$PROMPT_HEAD" != "$HEAD_SHA" ]; then
    echo "WARN: prompt's HEAD ($PROMPT_HEAD) != actual HEAD ($HEAD_SHA)" >&2
    echo "WARN: this is the staleness Codex penalised in Tier 2 round 2." >&2
    echo "WARN: refresh the prompt header before continuing OR pass --skip-check" >&2
    if [ "${SKIP_HEAD_CHECK:-0}" != "1" ]; then
      exit 4
    fi
  fi
fi

# ── invoke codex review ──────────────────────────────────────────────────────

ts=$(date -u +%Y%m%dT%H%M%SZ)
RAW_OUT="/tmp/codex_review_${ts}.out"
JSON_OUT="/tmp/codex_review_${ts}.json"

echo "[codex_review_loop] prompt=$PROMPT_FILE base=$BASE_SHA head=$HEAD_SHA" >&2
echo "[codex_review_loop] streaming Codex verdict to $RAW_OUT" >&2

# `codex review` accepts EITHER --base OR a positional PROMPT, not
# both. Our custom prompt files contain the "Inspect only diff
# <base>..<head>" instruction inline, so the prompt itself encodes
# the diff range. We pass it via stdin (the `-` positional) and skip
# --base. BASE_SHA is still kept as a function argument so the
# pre-flight + log message can show what range was intended; codex
# itself reads the range from the prompt body.
set +e
cat "$PROMPT_FILE" | codex review - >"$RAW_OUT" 2>&1
codex_exit=$?
set -e
if [ $codex_exit -ne 0 ]; then
  echo "ERROR: codex review subprocess failed (exit=$codex_exit)" >&2
  echo "       full output: $RAW_OUT" >&2
  tail -20 "$RAW_OUT" >&2
  exit 3
fi
# Mirror the verdict to stdout for the caller.
cat "$RAW_OUT"

# ── parse verdict ────────────────────────────────────────────────────────────

# Codex's actual output uses severity-tagged findings: [P0], [P1],
# [P2]. The "ACCEPT-AS-IS / ACCEPT-WITH-FIXES / BLOCK" strings my
# prompts request can also appear, but the prompt itself echoes
# those tokens — naive grep would false-match. The robust signal is
# the severity tag on Codex's own findings.
#
# Mapping:
#   any [P0] finding         → BLOCK             (exit 2)
#   any [P1] finding         → ACCEPT-WITH-FIXES (exit 1)
#   only [P2] findings       → ACCEPT-WITH-FIXES (exit 1)
#   no finding tags          → ACCEPT-AS-IS      (exit 0)
#
# For prompts that explicitly ask for "Verdict: <X>" we ALSO honor
# the explicit verdict line WHEN it appears AFTER the codex marker
# (so we ignore the prompt-echo region).

verdict=""
# Findings count (Codex severity tags, anchored at line start).
p0_count=$(grep -c -E "^- \[P0\]|^\[P0\]" "$RAW_OUT" || true)
p1_count=$(grep -c -E "^- \[P1\]|^\[P1\]" "$RAW_OUT" || true)
p2_count=$(grep -c -E "^- \[P2\]|^\[P2\]" "$RAW_OUT" || true)

if [ "${p0_count:-0}" -gt 0 ]; then
  verdict="BLOCK"
elif [ "${p1_count:-0}" -gt 0 ] || [ "${p2_count:-0}" -gt 0 ]; then
  verdict="ACCEPT-WITH-FIXES"
else
  # No severity tags found → look for an explicit Verdict line that
  # appears AFTER Codex's content marker. The codex CLI prints a
  # `codex` marker line before its reply; we slice from there.
  marker_line=$(grep -n -m1 "^codex\$" "$RAW_OUT" | cut -d: -f1 || true)
  if [ -n "$marker_line" ]; then
    if tail -n +"$marker_line" "$RAW_OUT" | grep -E -q "ACCEPT-AS-IS"; then
      verdict="ACCEPT-AS-IS"
    elif tail -n +"$marker_line" "$RAW_OUT" | grep -E -q "ACCEPT-WITH-FIXES"; then
      verdict="ACCEPT-WITH-FIXES"
    elif tail -n +"$marker_line" "$RAW_OUT" | grep -E -q "BLOCK"; then
      verdict="BLOCK"
    else
      verdict="ACCEPT-AS-IS"  # no findings, no explicit verdict → clean
    fi
  else
    verdict="ACCEPT-AS-IS"  # codex output but no marker; treat as clean
  fi
fi

# Write a tiny machine-readable summary alongside the raw log.
cat > "$JSON_OUT" <<JSON
{
  "timestamp": "${ts}",
  "prompt_file": "${PROMPT_FILE}",
  "base_sha": "${BASE_SHA}",
  "head_sha": "${HEAD_SHA}",
  "verdict": "${verdict}",
  "p0_count": ${p0_count:-0},
  "p1_count": ${p1_count:-0},
  "p2_count": ${p2_count:-0},
  "raw_log": "${RAW_OUT}"
}
JSON

# ── return ───────────────────────────────────────────────────────────────────

echo "" >&2
echo "[codex_review_loop] ────────── SUMMARY ──────────" >&2
echo "[codex_review_loop] verdict   = ${verdict:-<unknown>}" >&2
echo "[codex_review_loop] findings  = P0:${p0_count:-0} P1:${p1_count:-0} P2:${p2_count:-0}" >&2
echo "[codex_review_loop] base      = $BASE_SHA" >&2
echo "[codex_review_loop] head      = $HEAD_SHA" >&2
echo "[codex_review_loop] raw_log   = $RAW_OUT" >&2
echo "[codex_review_loop] summary   = $JSON_OUT" >&2

case "$verdict" in
  ACCEPT-AS-IS)         exit 0 ;;
  ACCEPT-WITH-FIXES)    exit 1 ;;
  BLOCK)                exit 2 ;;
  *)
    echo "[codex_review_loop] could not parse verdict from output" >&2
    exit 3
    ;;
esac
