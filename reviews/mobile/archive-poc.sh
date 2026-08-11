#!/usr/bin/env bash
# ============================================================================
# archive-poc.sh — archive the POC carerbot/ sandbox before Phase 1 opens
# ============================================================================
# Per reviews/mobile/08_MIGRATION_GOVERNANCE.md §4:
#   - Tag the POC at its HEAD as v0.0.0-poc-archive (read-only forever).
#   - Add ARCHIVED.md explaining the cutover (separate from existing README so
#     in-progress changes the fresher hasn't committed are NOT touched).
#   - Commit ONLY ARCHIVED.md (no auto-commit of fresher's WIP).
#
# Run this AFTER the new careerbot-mobile repo's first commit lands, and
# BEFORE Phase 1 (auth) work starts in the new repo.
#
# Usage:
#   bash reviews/mobile/archive-poc.sh
#   bash reviews/mobile/archive-poc.sh --poc /custom/path/to/carerbot
# ============================================================================
set -euo pipefail

# Default POC path. WSL form of:
#   C:\Users\admin\Desktop\CareerBOT_Project\careerbot-mobile (1)\carerbot
POC_DEFAULT="/mnt/c/Users/admin/Desktop/CareerBOT_Project/careerbot-mobile (1)/carerbot"
POC="${POC_DEFAULT}"

while [ $# -gt 0 ]; do
  case "$1" in
    --poc) POC="$2"; shift 2;;
    *) echo "Unknown arg: $1" >&2; exit 2;;
  esac
done

if [ ! -d "$POC" ]; then
  echo "ERROR: POC directory not found: $POC" >&2
  exit 1
fi
if [ ! -d "$POC/.git" ]; then
  echo "ERROR: POC is not a git repo: $POC" >&2
  exit 1
fi

echo "=== POC: $POC ==="
echo "Current HEAD:"
git -C "$POC" log --oneline -1
echo ""

# ── 1. create the archive tag at HEAD (committed state, not WIP) ────────────
echo "→ tagging v0.0.0-poc-archive"
if git -C "$POC" rev-parse v0.0.0-poc-archive >/dev/null 2>&1; then
  echo "   tag already exists — skipping"
else
  # Annotated tag requires committer identity — inject in case POC repo
  # has no user.name/user.email set (POC was fresher's local-only sandbox).
  git -C "$POC" \
    -c user.name="CareerBot Dev" \
    -c user.email="dev@careerbot.local" \
    tag -a v0.0.0-poc-archive -m "POC archive — superseded by careerbot-mobile production repo"
fi

# ── 2. write ARCHIVED.md (does not touch existing README in case it's WIP) ──
ARCHIVED_PATH="$POC/ARCHIVED.md"
cat > "$ARCHIVED_PATH" <<'EOF'
# carerbot/ — ARCHIVED

This repository was the **proof-of-concept** for the CareerBOT mobile app.

Production work has moved to: **`careerbot-mobile/`** (separate repo).

## Why archived

The POC validated the React Native + Expo stack and produced several
production-quality patterns (logger, HTTPS guard, pdf 3-CDN fallback, error
parsers, profile mappers). The architecture (hand-rolled navigation, JavaScript,
mega-screens) is being rebuilt in the new repo with TypeScript + Expo Router
+ proper test infrastructure.

See `reviews/mobile/08_MIGRATION_GOVERNANCE.md` in the careerbot-web repo for
the migration rules.

## Reference, not source

- This repo's contents at the `v0.0.0-poc-archive` tag are the **frozen
  reference** for porting decisions.
- The new repo's `MIGRATION_LEDGER.md` cites this tag for every port.
- **No further commits should be accepted on this repo.**

## Snapshot

- Tag: `v0.0.0-poc-archive`
- Archive date: 2026-06-02
EOF

# ── 3. commit ONLY ARCHIVED.md ──────────────────────────────────────────────
echo "→ committing ARCHIVED.md (other WIP untouched)"
git -C "$POC" add -- "$ARCHIVED_PATH"

if git -C "$POC" diff --cached --quiet; then
  echo "   nothing to commit — ARCHIVED.md already in place"
else
  git -C "$POC" \
    -c user.name="CareerBot Dev" \
    -c user.email="dev@careerbot.local" \
    commit -qm "chore: archive POC — production work moved to careerbot-mobile

Tagged v0.0.0-poc-archive. See ARCHIVED.md.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
fi

# ── 4. summary ──────────────────────────────────────────────────────────────
echo ""
echo "════════ DONE ════════"
echo "POC tagged at v0.0.0-poc-archive:"
git -C "$POC" log -1 --oneline v0.0.0-poc-archive
echo ""
echo "Verify:"
echo "  git -C \"$POC\" tag -l v0.0.0-poc-archive"
echo "  git -C \"$POC\" show v0.0.0-poc-archive:src/utils/logger.js  # any file"
echo ""
echo "POC has NO GitHub remote — local-only archive is sufficient."
echo "If/when POC gets pushed to GitHub later, archive the repo via:"
echo "  gh repo archive intelicoreai/<poc-repo-name>"
echo ""
echo "Fresher's uncommitted work in the POC was NOT touched."
echo "If he wants to discard it: cd into POC and run 'git checkout -- .'"
echo "If he wants to keep it as a stash: 'git stash push -u'"
