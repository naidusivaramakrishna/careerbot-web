#!/usr/bin/env bash
# ============================================================================
# generate-codex-prompt.sh — assemble a Codex cross-check prompt
# ============================================================================
# Usage:
#   bash reviews/mobile/generate-codex-prompt.sh phase <N>            [--base <ref>] [--repo <path>]
#   bash reviews/mobile/generate-codex-prompt.sh commit <sha-or-ref>  [--lens security|compliance|contract|perf|default] [--repo <path>]
#   bash reviews/mobile/generate-codex-prompt.sh design <slug>        [--round <N>] [--repo <path>]
#
# Defaults:
#   --repo    parent dir's careerbot-mobile (sibling of careerbot-web-pr15)
#   --base    phase mode: prior phase tag or main; commit mode: HEAD~1
#   --lens    default
#   --round   design mode: auto-detected by counting existing round files
#
# Output:
#   reviews/mobile/codex-history/<phase-N|commit-shortsha|design-slug>-prompt-<YYYYMMDD>[-rN].md
#   reviews/mobile/codex-history/<phase-N|commit-shortsha>-diff-<YYYYMMDD>.patch  (phase/commit modes only)
#
# Then: review the generated prompt, fill the PART 0 section if Claude has not,
# and pipe into Codex CLI:    cat <prompt> | codex exec -
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/codex-templates"
HISTORY_DIR="$SCRIPT_DIR/codex-history"
ACCEPTANCE="$TEMPLATE_DIR/PHASE_ACCEPTANCE_CRITERIA.md"

mkdir -p "$HISTORY_DIR"

# ── parse args ──────────────────────────────────────────────────────────────
MODE=""
ARG=""
BASE_REF=""
LENS="default"
REPO_PATH=""
ROUND_OVERRIDE=""

if [ $# -lt 2 ]; then
  echo "ERROR: missing args. Usage: 'phase <N>' | 'commit <sha>' | 'design <slug>'." >&2
  exit 2
fi

MODE="$1"; shift
ARG="$1"; shift

# Helper: read a flag value safely, fail clean if missing.
need_value() {
  if [ $# -lt 2 ] || [ -z "${2:-}" ]; then
    echo "ERROR: $1 requires a value." >&2
    exit 2
  fi
}

while [ $# -gt 0 ]; do
  case "$1" in
    --base)  need_value "$1" "${2:-}"; BASE_REF="$2"; shift 2;;
    --lens)  need_value "$1" "${2:-}"; LENS="$2"; shift 2;;
    --repo)  need_value "$1" "${2:-}"; REPO_PATH="$2"; shift 2;;
    --round) need_value "$1" "${2:-}"; ROUND_OVERRIDE="$2"; shift 2;;
    *) echo "Unknown arg: $1. Valid: --base, --lens, --repo, --round." >&2; exit 2;;
  esac
done

# Default repo path = sibling careerbot-mobile
if [ -z "$REPO_PATH" ]; then
  REPO_PATH="$(cd "$SCRIPT_DIR/../../.." && pwd)/careerbot-mobile"
fi

if [ ! -d "$REPO_PATH/.git" ]; then
  echo "ERROR: --repo must be a git repo. Got: $REPO_PATH" >&2
  echo "       (Did you run install-mobile-repo.sh yet?)" >&2
  exit 1
fi

DATE="$(date +%Y%m%d)"

# ── round detection ─────────────────────────────────────────────────────────
detect_round() {
  local base="$1"
  if [ ! -f "$HISTORY_DIR/${base}-prompt-${DATE}.md" ]; then
    echo ""
    return
  fi
  # Compute max(existing round) + 1 across BOTH filename shapes.
  # Returns "" for r1 (no suffix), "-rN" for r2+. Handles gapped history
  # correctly (e.g. r1, r3, r4 existing → next is -r5, not -r2).
  local max_n=0
  shopt -s nullglob
  for f in "$HISTORY_DIR/${base}-prompt-${DATE}"-r*.md \
           "$HISTORY_DIR/${base}"-r*-prompt-${DATE}.md; do
    local fname; fname="$(basename "$f")"
    local n
    # Strip everything but the round number; tolerate either shape.
    n="$(echo "$fname" | grep -oE -- '-r[0-9]+' | head -1 | grep -oE '[0-9]+')"
    if [ -n "$n" ] && [ "$n" -gt "$max_n" ]; then
      max_n="$n"
    fi
  done
  shopt -u nullglob
  # If the r1 file (no suffix) exists, treat it as round 1 for the max.
  if [ -f "$HISTORY_DIR/${base}-prompt-${DATE}.md" ] && [ "$max_n" -lt 1 ]; then
    max_n=1
  fi
  if [ "$max_n" -eq 0 ]; then
    echo ""
  else
    local next=$((max_n + 1))
    echo "-r${next}"
  fi
}

# ── helpers ─────────────────────────────────────────────────────────────────
extract_phase_section() {
  local phase="$1"
  awk -v key="phase:$phase" '
    /^## phase:[0-9]+/ {
      capture = ($0 ~ "^## " key "$")
      if (capture) next
    }
    capture { print }
  ' "$ACCEPTANCE"
}

git_in_repo() { git -C "$REPO_PATH" "$@"; }

anchor_word_grep() {
  local diff_file="$1"
  grep -nE 'always|never|guaranteed|cannot|unreachable|impossible|source of truth|authoritative|verified|secure|safe|defensive|schema-aligned' "$diff_file" 2>/dev/null \
    | grep -v '^[+-][+-][+-]' \
    | head -50 \
    || true
}

# ── PHASE MODE ──────────────────────────────────────────────────────────────
if [ "$MODE" = "phase" ]; then
  PHASE_NUM="$ARG"
  if ! [[ "$PHASE_NUM" =~ ^[0-9]+$ ]]; then
    echo "ERROR: phase must be a number, got '$PHASE_NUM'." >&2
    exit 2
  fi

  if ! grep -q "^## phase:${PHASE_NUM}\$" "$ACCEPTANCE"; then
    echo "ERROR: no acceptance criteria for phase $PHASE_NUM in $ACCEPTANCE" >&2
    exit 1
  fi

  PHASE_LINE="$(grep -A1 "^## phase:${PHASE_NUM}\$" "$ACCEPTANCE" | tail -1)"
  PHASE_TITLE="$(echo "$PHASE_LINE" | sed -E 's/^\*\*Title:\*\*\s*//')"
  PHASE_GOAL="$(grep -A2 "^## phase:${PHASE_NUM}\$" "$ACCEPTANCE" | tail -1 | sed -E 's/^\*\*Goal:\*\*\s*//')"
  PHASE_CRITERIA="$(extract_phase_section "$PHASE_NUM")"

  # base ref: phase tag of prior phase, or main
  if [ -z "$BASE_REF" ]; then
    PRIOR="$((PHASE_NUM - 1))"
    if git_in_repo rev-parse "phase-${PRIOR}" >/dev/null 2>&1; then
      BASE_REF="phase-${PRIOR}"
    else
      BASE_REF="main"
    fi
  fi

  COMMIT_SHA="$(git_in_repo rev-parse HEAD)"
  COMMIT_SHORT="$(git_in_repo rev-parse --short HEAD)"
  BRANCH="$(git_in_repo rev-parse --abbrev-ref HEAD)"

  BASE_FILENAME="phase-${PHASE_NUM}"
  ROUND_SUFFIX="$(detect_round "$BASE_FILENAME")"
  DIFF_PATCH="$HISTORY_DIR/${BASE_FILENAME}-diff-${DATE}${ROUND_SUFFIX}.patch"
  PROMPT_OUT="$HISTORY_DIR/${BASE_FILENAME}-prompt-${DATE}${ROUND_SUFFIX}.md"

  git_in_repo diff "${BASE_REF}..HEAD" > "$DIFF_PATCH" || true
  DIFF_FILE_COUNT="$(git_in_repo diff --name-only "${BASE_REF}..HEAD" 2>/dev/null | wc -l | tr -d ' ')"
  DIFF_STATS="$(git_in_repo diff --shortstat "${BASE_REF}..HEAD" 2>/dev/null || echo '0 insertions(+), 0 deletions(-)')"
  DIFF_ADDED="$(echo "$DIFF_STATS" | grep -oE '[0-9]+ insertions?' | grep -oE '[0-9]+' || echo 0)"
  DIFF_REMOVED="$(echo "$DIFF_STATS" | grep -oE '[0-9]+ deletions?' | grep -oE '[0-9]+' || echo 0)"

  DIFF_BYTES="$(wc -c < "$DIFF_PATCH" | tr -d ' ')"
  INLINE_LIMIT=80000
  if [ "$DIFF_BYTES" -le "$INLINE_LIMIT" ]; then
    DIFF_BODY="$(cat "$DIFF_PATCH")"
  else
    DIFF_BODY="(diff too large to inline — $(($DIFF_BYTES / 1024))kB. Read full patch directly: $DIFF_PATCH)

Changed files:
$(git_in_repo diff --name-status "${BASE_REF}..HEAD")"
  fi

  ANCHOR_WORDS="$(anchor_word_grep "$DIFF_PATCH" | head -30 || echo '(no anchor words detected in diff)')"

  TEMPLATE="$(cat "$TEMPLATE_DIR/PHASE_END_PROMPT.md")"

  PART0_PLACEHOLDER='> **TODO Claude:** fill the 5-line PART 0 here BEFORE this prompt is sent to Codex.
>
> 1. Charter (1 sentence):
> 2. One above:
> 3. One below:
> 4. Files + lines: '"$DIFF_FILE_COUNT files, +$DIFF_ADDED / -$DIFF_REMOVED"'
> 5. Anchor words to challenge: (see §7 for grep results)'

  PHASE_RISK_PLACEHOLDER='(Pulled from PHASE_ACCEPTANCE_CRITERIA.md phase:'"$PHASE_NUM"' "Risk register" subsection — see §3 above for the full register.)'

  # Substitute using a here-doc approach (avoids sed escaping nightmare with /, &, etc.)
  python3 - "$TEMPLATE" "$PROMPT_OUT" <<PYEOF
import sys
template_str = sys.argv[1]
out_path = sys.argv[2]
import os
template = template_str if os.path.exists(template_str) else template_str
# Actually re-read template from file:
with open("$TEMPLATE_DIR/PHASE_END_PROMPT.md", "r", encoding="utf-8") as f:
    template = f.read()
subs = {
    "{{PHASE_NUM}}":               """$PHASE_NUM""",
    "{{PHASE_TITLE}}":             """$PHASE_TITLE""",
    "{{COMMIT_SHA}}":              """$COMMIT_SHA""",
    "{{COMMIT_SHORT}}":            """$COMMIT_SHORT""",
    "{{BRANCH}}":                  """$BRANCH""",
    "{{BASE_REF}}":                """$BASE_REF""",
    "{{DIFF_FILE_COUNT}}":         """$DIFF_FILE_COUNT""",
    "{{DIFF_LINES_ADDED}}":        """$DIFF_ADDED""",
    "{{DIFF_LINES_REMOVED}}":      """$DIFF_REMOVED""",
    "{{PHASE_GOAL}}":              """$PHASE_GOAL""",
    "{{PHASE_ACCEPTANCE_CRITERIA}}": """$PHASE_CRITERIA""",
    "{{PART_0_CHARTER}}":          """$PART0_PLACEHOLDER""",
    "{{DIFF_BODY}}":               """$DIFF_BODY""",
    "{{PHASE_RISK_REGISTER}}":     """$PHASE_RISK_PLACEHOLDER""",
    "{{ANCHOR_WORDS_TO_CHALLENGE}}": """$ANCHOR_WORDS""",
}
for k, v in subs.items():
    template = template.replace(k, v)
with open(out_path, "w", encoding="utf-8") as f:
    f.write(template)
PYEOF

  echo "✓ Phase $PHASE_NUM prompt written: $PROMPT_OUT"
  echo "  Diff patch:                     $DIFF_PATCH"
  echo "  Round:                          ${ROUND_SUFFIX:-r1}"
  echo ""
  echo "Next: open the prompt, fill PART 0, paste into Codex CLI."
  exit 0
fi

# ── COMMIT MODE ─────────────────────────────────────────────────────────────
if [ "$MODE" = "commit" ]; then
  REF="$ARG"
  if ! git_in_repo rev-parse "$REF" >/dev/null 2>&1; then
    echo "ERROR: not a git ref: $REF" >&2
    exit 1
  fi

  COMMIT_SHA="$(git_in_repo rev-parse "$REF")"
  COMMIT_SHORT="$(git_in_repo rev-parse --short "$REF")"
  BRANCH="$(git_in_repo rev-parse --abbrev-ref HEAD)"
  PR_TITLE="$(git_in_repo log -1 --format='%s' "$REF")"
  PR_BODY="$(git_in_repo log -1 --format='%b' "$REF")"

  if [ -z "$BASE_REF" ]; then
    BASE_REF="${REF}~1"
  fi

  # Trigger reason auto-detect
  CHANGED_FILES="$(git_in_repo diff --name-only "${BASE_REF}..${REF}" 2>/dev/null)"
  TRIGGER_REASON="(manual lens selection)"
  if echo "$CHANGED_FILES" | grep -qE '^src/api/client/'; then
    TRIGGER_REASON="src/api/client/ (HTTP/error/endpoints — security gate)"
    [ "$LENS" = "default" ] && LENS="security"
  elif echo "$CHANGED_FILES" | grep -qE '^src/features/auth/'; then
    TRIGGER_REASON="src/features/auth/ (auth gate)"
    [ "$LENS" = "default" ] && LENS="security"
  elif echo "$CHANGED_FILES" | grep -qE '^src/features/payments/'; then
    TRIGGER_REASON="src/features/payments/ (compliance gate)"
    [ "$LENS" = "default" ] && LENS="compliance"
  elif echo "$CHANGED_FILES" | grep -qE '^src/types/contracts/'; then
    TRIGGER_REASON="src/types/contracts/ (contract gate)"
    [ "$LENS" = "default" ] && LENS="contract"
  fi

  BASE_FILENAME="commit-${COMMIT_SHORT}"
  ROUND_SUFFIX="$(detect_round "$BASE_FILENAME")"
  DIFF_PATCH="$HISTORY_DIR/${BASE_FILENAME}-diff-${DATE}${ROUND_SUFFIX}.patch"
  PROMPT_OUT="$HISTORY_DIR/${BASE_FILENAME}-prompt-${DATE}${ROUND_SUFFIX}.md"

  git_in_repo diff "${BASE_REF}..${REF}" > "$DIFF_PATCH" || true
  DIFF_FILE_COUNT="$(echo "$CHANGED_FILES" | grep -c . || echo 0)"
  DIFF_STATS="$(git_in_repo diff --shortstat "${BASE_REF}..${REF}" 2>/dev/null || echo '0 insertions(+), 0 deletions(-)')"
  DIFF_ADDED="$(echo "$DIFF_STATS" | grep -oE '[0-9]+ insertions?' | grep -oE '[0-9]+' || echo 0)"
  DIFF_REMOVED="$(echo "$DIFF_STATS" | grep -oE '[0-9]+ deletions?' | grep -oE '[0-9]+' || echo 0)"

  DIFF_BYTES="$(wc -c < "$DIFF_PATCH" | tr -d ' ')"
  INLINE_LIMIT=80000
  if [ "$DIFF_BYTES" -le "$INLINE_LIMIT" ]; then
    DIFF_BODY="$(cat "$DIFF_PATCH")"
  else
    DIFF_BODY="(diff too large to inline — $(($DIFF_BYTES / 1024))kB. Read full patch directly: $DIFF_PATCH)

Changed files:
$(echo "$CHANGED_FILES")"
  fi

  ANCHOR_WORDS="$(anchor_word_grep "$DIFF_PATCH" | head -30 || echo '(no anchor words detected in diff)')"

  case "$LENS" in
    security)
      LENS_CHECKLIST="- Token storage: never in AsyncStorage, redux-persist plaintext, logs, error reports, analytics
- HTTPS guard: refuses http:// in production builds (test by simulating __DEV__=false)
- Deep links: validate host/path against allow-list before acting
- OAuth state + nonce verified, not just decoded
- JWT verified against JWKS (jose.jwtVerify), not just decoded
- Refresh token rotated server-side (old one invalidated)
- Sign-out clears SecureStore + axios Authorization header
- No secrets in EXPO_PUBLIC_* (those ship to the client)
- No log statements that could echo PII or tokens (logger.ts JWT redaction working)"
      ;;
    compliance)
      LENS_CHECKLIST="- Apple guideline 4.8 (Sign in with Apple required if Google/LinkedIn shown)
- Apple guideline 5.1.1.v (account deletion in-app must result in server-side deletion)
- iOS Privacy Manifest (PrivacyInfo.xcprivacy) accurate for required-reason APIs
- ATT prompt logic correct (or absent if no tracking SDK in use)
- GDPR Article 17 (right to erasure) flow returns confirmation
- GDPR Article 20 (data portability) format documented and human-readable
- DPDP consent receipt logged server-side with version, timestamp, IP
- Withdraw-consent flow visible from in-app settings
- Children's data: under-18 flow handled (parental consent or refusal)
- Apple/Google store privacy nutrition labels match actual data collection"
      ;;
    contract)
      LENS_CHECKLIST="- Sibling-invariant sweep: every consuming surface listed and patched in this commit
- src/types/contracts/ updated alongside src/features/ consumers
- @careerbot/api-contracts version bumped if shared
- Backend API contract change has corresponding mobile changes (and vice versa)
- Parametric test added covering all sibling surfaces
- Migration ledger row appended if porting from POC"
      ;;
    perf)
      LENS_CHECKLIST="- Benchmark methodology shown (cold start, warm start, sample size, device list)
- Memory delta measured, not just claimed
- List virtualization correct (FlatList/FlashList) with stable keys
- Image caching strategy explicit (cache key, eviction)
- Bundle size impact measured (npx expo-doctor or similar)"
      ;;
    *)
      LENS_CHECKLIST="(Apply 4-lens default: happy / failure / boundary / anchor-word.)"
      ;;
  esac

  TEMPLATE="$(cat "$TEMPLATE_DIR/COMMIT_PROMPT.md")"

  PART0_PLACEHOLDER='> **TODO Claude:** fill the 5-line PART 0 here BEFORE this prompt is sent to Codex.
>
> 1. Charter (1 sentence):
> 2. One above:
> 3. One below:
> 4. Files + lines: '"$DIFF_FILE_COUNT files, +$DIFF_ADDED / -$DIFF_REMOVED"'
> 5. Anchor words to challenge: (see §4 for grep results)'

  python3 - <<PYEOF
import os
with open("$TEMPLATE_DIR/COMMIT_PROMPT.md", "r", encoding="utf-8") as f:
    template = f.read()
subs = {
    "{{TRIGGER_REASON}}":              """$TRIGGER_REASON""",
    "{{PHASE_NUM}}":                   """(detect from branch/commit context)""",
    "{{PHASE_TITLE}}":                 """""",
    "{{COMMIT_SHA}}":                  """$COMMIT_SHA""",
    "{{BRANCH}}":                      """$BRANCH""",
    "{{LENS}}":                        """$LENS""",
    "{{PR_TITLE_AND_DESCRIPTION}}":    """$PR_TITLE\n\n$PR_BODY""",
    "{{DIFF_FILE_COUNT}}":             """$DIFF_FILE_COUNT""",
    "{{DIFF_LINES_ADDED}}":            """$DIFF_ADDED""",
    "{{DIFF_LINES_REMOVED}}":          """$DIFF_REMOVED""",
    "{{PART_0_CHARTER}}":              """$PART0_PLACEHOLDER""",
    "{{DIFF_BODY}}":                   """$DIFF_BODY""",
    "{{LENS_CHECKLIST}}":              """$LENS_CHECKLIST""",
    "{{ANCHOR_WORDS_TO_CHALLENGE}}":   """$ANCHOR_WORDS""",
}
for k, v in subs.items():
    template = template.replace(k, v)
with open("$PROMPT_OUT", "w", encoding="utf-8") as f:
    f.write(template)
PYEOF

  echo "✓ Commit prompt written: $PROMPT_OUT"
  echo "  Diff patch:            $DIFF_PATCH"
  echo "  Lens:                  $LENS"
  echo "  Trigger:               $TRIGGER_REASON"
  echo "  Round:                 ${ROUND_SUFFIX:-r1}"
  echo ""
  echo "Next: open the prompt, fill PART 0, paste into Codex CLI."
  exit 0
fi

# ── DESIGN MODE ─────────────────────────────────────────────────────────────
#
# Per §1.5 of the cross-check policy. Locates a design doc OR design note in the
# mobile repo (or the staged-design-docs/ in this worktree for pre-deploy drafts),
# loads DESIGN_REVIEW_PROMPT.md, fills placeholders, writes the prompt + diff,
# and prints next-step guidance. Caller runs:
#
#   bash reviews/mobile/generate-codex-prompt.sh design <slug>
#   bash reviews/mobile/generate-codex-prompt.sh design <slug> --round 2
#
if [ "$MODE" = "design" ]; then
  SLUG="$ARG"

  # Search candidate locations: live repo docs/design/, live repo docs/design/notes/,
  # and the worktree staged-design-docs/ (pre-deploy drafts).
  CANDIDATES=()
  if [ -d "$REPO_PATH/docs/design" ]; then
    CANDIDATES+=("$REPO_PATH"/docs/design/*"$SLUG"*.md)
    CANDIDATES+=("$REPO_PATH"/docs/design/notes/*"$SLUG"*.md)
  fi
  CANDIDATES+=("$SCRIPT_DIR/staged-design-docs/"*"$SLUG"*.md)

  DESIGN_DOC=""
  for cand in "${CANDIDATES[@]}"; do
    if [ -f "$cand" ]; then
      DESIGN_DOC="$cand"
      break
    fi
  done

  if [ -z "$DESIGN_DOC" ]; then
    echo "ERROR: no design doc matching '*${SLUG}*.md' found in:" >&2
    echo "  - $REPO_PATH/docs/design/" >&2
    echo "  - $REPO_PATH/docs/design/notes/" >&2
    echo "  - $SCRIPT_DIR/staged-design-docs/" >&2
    exit 1
  fi

  DESIGN_FILENAME="$(basename "$DESIGN_DOC")"
  DESIGN_TITLE="$SLUG"
  BASE_FILENAME="design-${SLUG}"

  # Round detection: --round overrides auto-detection. Otherwise count existing files.
  if [ -n "$ROUND_OVERRIDE" ]; then
    if ! [[ "$ROUND_OVERRIDE" =~ ^[0-9]+$ ]]; then
      echo "ERROR: --round must be a number, got '$ROUND_OVERRIDE'." >&2
      exit 2
    fi
    ROUND_NUM="$ROUND_OVERRIDE"
    if [ "$ROUND_NUM" -le 1 ]; then
      ROUND_SUFFIX=""
    else
      ROUND_SUFFIX="-r${ROUND_NUM}"
    fi
  else
    ROUND_SUFFIX="$(detect_round "$BASE_FILENAME")"
    ROUND_NUM=1
    if [ -n "$ROUND_SUFFIX" ]; then
      ROUND_NUM="$(echo "$ROUND_SUFFIX" | grep -oE '[0-9]+')"
    fi
  fi

  PROMPT_OUT="$HISTORY_DIR/${BASE_FILENAME}-prompt-${DATE}${ROUND_SUFFIX}.md"

  python3 - <<PYEOF
import os
with open("$TEMPLATE_DIR/DESIGN_REVIEW_PROMPT.md", "r", encoding="utf-8") as f:
    template = f.read()
with open("$DESIGN_DOC", "r", encoding="utf-8") as f:
    design_body = f.read()

part0 = """> **TODO Claude:** fill the PART 0 frame challenge here BEFORE this prompt is sent to Codex.
>
> 1. Charter (1 sentence): what is being decided?
> 2. One above: what next-layer-up consumes this decision?
> 3. One below: what does this decision rely on?
> 4. Files + lines: 1 design doc, sections, KB.
> 5. Anchor words to challenge in MY decision rationale: list each anchor word from §8 here.
"""

subs = {
    "{{DESIGN_TITLE}}":      """$DESIGN_TITLE""",
    "{{PHASE_NUM}}":         """(set by author)""",
    "{{PHASE_TITLE}}":       """(set by author)""",
    "{{AUTHOR_PERSONA}}":    """(set by author)""",
    "{{ROUND_NUMBER}}":      """$ROUND_NUM""",
    "{{DESIGN_FILENAME}}":   """$DESIGN_FILENAME""",
    "{{BACKEND_ASK}}":       """(N/A unless decision touches a backend coordination ask)""",
    "{{PART_0_CHARTER}}":    part0,
    "{{DESIGN_DOC_BODY}}":   design_body,
}
for k, v in subs.items():
    template = template.replace(k, v)
with open("$PROMPT_OUT", "w", encoding="utf-8") as f:
    f.write(template)
PYEOF

  echo "✓ Design review prompt written: $PROMPT_OUT"
  echo "  Source doc:                   $DESIGN_DOC"
  echo "  Round:                        ${ROUND_SUFFIX:-r1}"
  echo ""
  echo "Next:"
  echo "  1. Open the prompt, fill PART 0 honestly (do NOT skip)."
  echo "  2. Pipe to Codex CLI:"
  echo "       cat \"$PROMPT_OUT\" | codex exec -"
  echo "  3. Save Codex's response to:"
  echo "       reviews/mobile/codex-history/${BASE_FILENAME}-verdict-${DATE}${ROUND_SUFFIX}.md"
  exit 0
fi

echo "ERROR: unknown mode '$MODE'. Use 'phase', 'commit', or 'design'." >&2
exit 2
