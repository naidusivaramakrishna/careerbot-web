#!/usr/bin/env bash
# ============================================================================
# install-mobile-repo.sh — bootstrap the careerbot-mobile repo from staged-repo/
# ============================================================================
# What it does:
#   1. Copies reviews/mobile/staged-repo/ into a target directory.
#   2. Runs reviews/mobile/scaffold-mobile-repo.sh to create the empty stub tree.
#   3. Initializes git and creates the first commit.
#   4. Optionally creates the GitHub repo via `gh repo create` (org: intelicoreai).
#
# Run this from ANY directory. Default target is the careerbot-mobile sibling
# of careerbot-web-pr15. Override with --target <abs-path>.
#
# Usage:
#   bash reviews/mobile/install-mobile-repo.sh                              # default target
#   bash reviews/mobile/install-mobile-repo.sh --target /path/to/repo       # custom
#   bash reviews/mobile/install-mobile-repo.sh --gh-create                  # also create on GitHub
#
# After running, follow the "Next steps" printed at the end.
# ============================================================================
set -euo pipefail

# ── parse args ──────────────────────────────────────────────────────────────
TARGET=""
DO_GH_CREATE=0
DO_PUSH=0
while [ $# -gt 0 ]; do
  case "$1" in
    --target) TARGET="$2"; shift 2;;
    --gh-create) DO_GH_CREATE=1; shift;;
    --push) DO_PUSH=1; shift;;
    *) echo "Unknown arg: $1" >&2; exit 2;;
  esac
done

# Default target = sibling of the current worktree
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEFAULT_TARGET="$(cd "$SCRIPT_DIR/../../.." && pwd)/careerbot-mobile"
TARGET="${TARGET:-$DEFAULT_TARGET}"

STAGED="$SCRIPT_DIR/staged-repo"
SCAFFOLD="$SCRIPT_DIR/scaffold-mobile-repo.sh"

if [ ! -d "$STAGED" ]; then
  echo "ERROR: staged-repo not found at $STAGED" >&2
  exit 1
fi
if [ ! -f "$SCAFFOLD" ]; then
  echo "ERROR: scaffold script not found at $SCAFFOLD" >&2
  exit 1
fi

# ── safety check ────────────────────────────────────────────────────────────
if [ -d "$TARGET" ]; then
  if [ -n "$(ls -A "$TARGET" 2>/dev/null)" ]; then
    echo "ERROR: target $TARGET already exists and is non-empty." >&2
    echo "       Remove it or pass --target <fresh-path>." >&2
    exit 1
  fi
else
  mkdir -p "$TARGET"
fi

echo "=== installing into $TARGET ==="

# ── 1. copy staged-repo contents (including dotfiles) ───────────────────────
echo "→ copying staged-repo/."
cp -r "$STAGED/." "$TARGET/"

# ── 2. run scaffold to create remaining stub tree ───────────────────────────
echo "→ running scaffold-mobile-repo.sh"
( cd "$TARGET" && bash "$SCAFFOLD" )

# ── 3. assets placeholder so app.config.ts paths resolve ────────────────────
mkdir -p "$TARGET/assets/fonts" "$TARGET/assets/images"
# Stub icon + splash (1x1 transparent PNGs would be ideal; we leave plain
# touched files so the path resolves and the designer replaces with real assets).
touch "$TARGET/assets/icon.png" \
      "$TARGET/assets/adaptive-icon.png" \
      "$TARGET/assets/splash.png" \
      "$TARGET/assets/favicon.png"

# ── 4. init git + first commit ──────────────────────────────────────────────
echo "→ initializing git"
( cd "$TARGET" && \
  git init -q -b main && \
  git add . && \
  git -c user.name="CareerBot Dev" -c user.email="dev@careerbot.local" \
      commit -qm "chore: bootstrap careerbot-mobile from staged-repo

- Phase 0 scaffold per reviews/mobile/04_PHASE_PLAYBOOK.md
- 8 direct-port files from POC (carerbot/ @ v0.0.0-poc-archive)
- Bootstrap configs from reviews/mobile/05_REPO_BOOTSTRAP_KIT.md
- Migration ledger seeded (MIGRATION_LEDGER.md)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>" )

# ── 5. optional GitHub creation ─────────────────────────────────────────────
if [ "$DO_GH_CREATE" -eq 1 ]; then
  if ! command -v gh >/dev/null 2>&1; then
    echo "WARN: gh CLI not found; skipping GitHub creation." >&2
  else
    echo "→ creating GitHub repo intelicoreai/careerbot-mobile (private)"
    ( cd "$TARGET" && gh repo create "intelicoreai/careerbot-mobile" --private --source . --remote origin )
    if [ "$DO_PUSH" -eq 1 ]; then
      echo "→ pushing main branch"
      ( cd "$TARGET" && git push -u origin main )
    fi
  fi
fi

# ── 6. summary ──────────────────────────────────────────────────────────────
echo ""
echo "════════ DONE ════════"
echo "Repo at: $TARGET"
echo ""
echo "Next steps for the fresher:"
echo "  1. cd \"$TARGET\""
echo "  2. pnpm install      # or: npm install"
echo "  3. npx expo install --fix     # pin Expo-validated versions"
echo "  4. pnpm typecheck   (will FAIL on stubs — that's the TODO list)"
echo "  5. pnpm start       (boots Metro)"
echo ""
if [ "$DO_GH_CREATE" -ne 1 ]; then
  echo "When ready to push to GitHub:"
  echo "  cd \"$TARGET\""
  echo "  gh repo create intelicoreai/careerbot-mobile --private --source . --remote origin"
  echo "  git push -u origin main"
  echo ""
fi
echo "Then start Phase 1 (auth) per reviews/mobile/04_PHASE_PLAYBOOK.md."
