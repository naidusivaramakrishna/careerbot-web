#!/usr/bin/env bash
# ============================================================================
# scaffold-mobile-repo.sh — one-shot folder + stub-file generator for careerbot-mobile
# ============================================================================
# Run AFTER `pnpm create expo-app . --template tabs` in an empty repo.
# Creates the full folder tree + stub files with one-line header comments
# per the architecture blueprint §5. Safe to re-run (idempotent — won't
# overwrite existing files).
#
# Usage:
#   cd /path/to/careerbot-mobile     # the empty Expo repo
#   bash /path/to/scaffold-mobile-repo.sh
#
# Each stub file has a single-line `// <purpose>` header. Phase implementation
# fills in the body. See reviews/mobile/04_PHASE_PLAYBOOK.md.
# ============================================================================
set -euo pipefail

# ── safety: must be in an Expo project root ─────────────────────────────────
if [ ! -f "package.json" ] || ! grep -q '"expo"' package.json 2>/dev/null; then
  echo "ERROR: run this from the root of an Expo project (no package.json with expo dep found)" >&2
  exit 1
fi

# ── helpers ─────────────────────────────────────────────────────────────────
mk() { mkdir -p "$1"; }

# Create a stub file with a one-line header comment ONLY if file does not exist.
stub() {
  local path="$1"; local comment="$2"
  if [ -e "$path" ]; then
    echo "  skip (exists): $path"
    return
  fi
  case "$path" in
    *.ts|*.tsx) echo "// $comment" > "$path" ;;
    *.js)       echo "// $comment" > "$path" ;;
    *.md)       echo "# $comment"  > "$path" ;;
    *.sh)       echo "#!/usr/bin/env bash"   > "$path"
                echo "# $comment"           >> "$path"
                chmod +x "$path" ;;
    *.json)     echo "{}"                    > "$path" ;;
    *)          echo "# $comment" > "$path" ;;
  esac
  echo "  create:       $path"
}

echo "=== Creating folder tree ==="
# Routes (Expo Router file-based)
mk app/\(auth\)
mk app/\(tabs\)/home
mk app/\(tabs\)/ats/results
mk app/\(tabs\)/ats/preview
mk app/\(tabs\)/profile/_components
mk app/\(tabs\)/account
mk app/\(deeplinks\)

# src — domain split
mk src/api/client
mk src/api/auth
mk src/api/ats
mk src/api/profile
mk src/api/payments
mk src/api/notifications
mk src/api/devices

mk src/components/primitives
mk src/components/feedback
mk src/components/forms
mk src/components/pdf
mk src/components/ats
mk src/components/profile
mk src/components/nav

mk src/features/auth
mk src/features/ats
mk src/features/profile
mk src/features/payments
mk src/features/notifications

mk src/design
mk src/i18n
mk src/utils
mk src/constants
mk src/types
mk src/hooks
mk src/platform/ios
mk src/platform/android

# Tests
mk tests/unit/api
mk tests/unit/features
mk tests/unit/utils
mk tests/unit/hooks
mk tests/integration/auth
mk tests/integration/ats
mk tests/integration/profile
mk tests/e2e/flows
mk tests/e2e/fixtures
mk tests/e2e/config
mk tests/mocks/fixtures

mk scripts
mk docs/adr
mk docs/playbooks
mk docs/postmortems

# Husky
mk .husky

echo ""
echo "=== Creating stub files (one-line header per file) ==="

# ── app/ — routes ───────────────────────────────────────────────────────────
stub app/_layout.tsx                 "Root layout — Providers (Auth, Theme, QueryClient, ErrorBoundary), fonts, Sentry init"
stub app/index.tsx                   "Splash/route gate — decide auth vs onboarding vs home based on session"
stub app/+not-found.tsx              "Friendly 404 with go-home CTA"

stub app/\(auth\)/_layout.tsx        "Auth stack layout — no tab bar"
stub app/\(auth\)/signin.tsx         "Sign-in screen — email/password + Google + LinkedIn + Apple"
stub app/\(auth\)/signup.tsx         "Sign-up screen — same providers + terms acceptance"
stub app/\(auth\)/forgot.tsx         "Request password-reset email"
stub app/\(auth\)/reset.tsx          "Confirm new password (deep-link entry from email)"
stub app/\(auth\)/verify.tsx         "Verify email via token (deep-link entry from email)"

stub app/\(tabs\)/_layout.tsx        "Tab bar — Home / ATS / Profile / Account"
stub app/\(tabs\)/home/index.tsx     "Home dashboard — action cards (ATS Scan, Profile), recent activity"
stub app/\(tabs\)/ats/index.tsx      "ATS landing — upload prompt + How-it-works carousel"
stub app/\(tabs\)/ats/scan.tsx       "Active scan — upload + animated progress ring + step pills"
stub app/\(tabs\)/ats/results/\[id\].tsx   "Results — score arc + breakdown list + fix CTAs"
stub app/\(tabs\)/ats/preview/\[id\].tsx   "Resume PDF preview — Before/After toggle when fixes applied"
stub app/\(tabs\)/profile/index.tsx  "Profile hub — 8-tab chip bar + completeness ring"
stub app/\(tabs\)/profile/upload.tsx "Resume upload entry point (auto-fill via parse_resume)"
stub app/\(tabs\)/profile/_components/PersonalTab.tsx     "Personal info tab"
stub app/\(tabs\)/profile/_components/EducationTab.tsx    "Education list tab"
stub app/\(tabs\)/profile/_components/WorkTab.tsx         "Work experience list tab"
stub app/\(tabs\)/profile/_components/SkillsTab.tsx       "Skills tab"
stub app/\(tabs\)/profile/_components/CertificationsTab.tsx "Certifications list tab"
stub app/\(tabs\)/profile/_components/EmploymentTab.tsx   "Employment info tab"
stub app/\(tabs\)/profile/_components/ProjectsTab.tsx     "Projects list tab"
stub app/\(tabs\)/profile/_components/ResumeTab.tsx       "Resume upload + management tab"
stub app/\(tabs\)/account/index.tsx        "Account hub — plan summary, sign-out, devices link"
stub app/\(tabs\)/account/subscription.tsx "Read-only on iOS — Manage on web CTA opens web in expo-web-browser"
stub app/\(tabs\)/account/devices.tsx      "Active sessions — revoke device (calls api A2/A5 endpoint)"

stub app/\(deeplinks\)/reset.tsx     "Mirrors auth/reset.tsx — explicitly named for universal-link routing"
stub app/\(deeplinks\)/verify.tsx    "Mirrors auth/verify.tsx — explicitly named for universal-link routing"

# ── src/api/ ────────────────────────────────────────────────────────────────
stub src/api/client/http.ts          "Axios instance — base URL, headers, response interceptor for 401 -> refresh"
stub src/api/client/refresh.ts       "Single-flight refresh queue — concurrent calls during refresh"
stub src/api/client/correlation.ts   "Generate + attach X-Correlation-ID per request"
stub src/api/client/errors.ts        "extractApiErrorMessage — handles all FastAPI error shapes (ported from web)"

stub src/api/auth/index.ts           "Barrel re-exports"
stub src/api/auth/signin.ts          "POST /api/v1/auth/signin"
stub src/api/auth/signup.ts          "POST /api/v1/auth/signup"
stub src/api/auth/signout.ts         "POST /api/v1/auth/signout"
stub src/api/auth/refreshToken.ts    "POST /api/v1/auth/refresh — rotation-aware"
stub src/api/auth/passwordReset.ts   "POST /api/v1/auth/password/reset (request + confirm)"
stub src/api/auth/emailVerify.ts     "POST /api/v1/auth/email/verify"
stub src/api/auth/oauthGoogle.ts     "Google OAuth URL + callback"
stub src/api/auth/oauthLinkedIn.ts   "LinkedIn OAuth URL + callback"
stub src/api/auth/oauthApple.ts      "Apple OAuth URL + callback (new for guideline 4.8)"

stub src/api/ats/index.ts            "Barrel re-exports"
stub src/api/ats/parseResume.ts      "POST /api/v1/parser/parse_resume/ — multipart upload"
stub src/api/ats/enhance.ts          "POST /api/v1/resume/enhance — ATS scoring"
stub src/api/ats/applyFix.ts         "POST /api/v1/resume/enhance/apply — auto/manual fix"
stub src/api/ats/deleteFix.ts        "POST /api/v1/resume/enhance/delete-fix — revert single fix"
stub src/api/ats/deleteResume.ts     "DELETE /api/v1/resume/enhance/{id}"
stub src/api/ats/previewEnhanced.ts  "GET /api/v1/resume/enhance/{id}/preview — enhanced PDF"
stub src/api/ats/previewOriginal.ts  "GET /api/v1/parser/preview/{id} — original PDF"

stub src/api/profile/index.ts        "Barrel re-exports"
stub src/api/profile/getProfile.ts   "GET /api/v1/profile/"
stub src/api/profile/updateProfile.ts "PUT /api/v1/profile/update — personal tab"

stub src/api/payments/index.ts       "Barrel re-exports"
stub src/api/payments/getPlans.ts    "GET /api/v1/plans — same as web's getPlans()"
stub src/api/payments/currentSub.ts  "GET /api/v1/subscription/current — read-only on iOS"

stub src/api/notifications/index.ts  "Barrel re-exports"
stub src/api/notifications/list.ts   "GET /api/v1/notifications/"
stub src/api/notifications/streamToken.ts "GET /api/auth/stream-token — verified user_id for SSE"

stub src/api/devices/index.ts        "Barrel re-exports"
stub src/api/devices/revoke.ts       "POST /api/v1/me/devices/revoke — api A2/A5 endpoint"

# ── src/components/ ─────────────────────────────────────────────────────────
stub src/components/primitives/Button.tsx     "Variants primary/secondary/danger; size sm/md/lg; loading state"
stub src/components/primitives/Input.tsx      "Text input + label + helper + error; trailing icon slot"
stub src/components/primitives/Card.tsx       "Surface container — radius + shadow tokens"
stub src/components/primitives/Sheet.tsx      "Bottom-sheet primitive — Reanimated; drag handle; backdrop"
stub src/components/primitives/Pressable.tsx  "Cross-platform Pressable with feedback + a11y defaults"
stub src/components/primitives/Text.tsx       "Typography component reading design tokens"

stub src/components/feedback/Toast.tsx        "Toast notification — success/error/info; queued"
stub src/components/feedback/ToastProvider.tsx "Context provider — single host at root layout"
stub src/components/feedback/LoadingRing.tsx  "SVG circular progress arc — used by ATS scan loading state"
stub src/components/feedback/Skeleton.tsx     "Skeleton placeholder for list items / cards"
stub src/components/feedback/ErrorBoundary.tsx "Crash boundary — reports to Sentry, friendly fallback UI"

stub src/components/forms/AuthForm.tsx        "Shared layout for signin/signup forms"
stub src/components/forms/SocialButtons.tsx   "Google + LinkedIn + Apple side-by-side; respects platform availability"
stub src/components/forms/PasswordField.tsx   "Password input with show/hide toggle"
stub src/components/forms/TermsAcceptance.tsx "Required checkbox + linked-out legal URLs"

stub src/components/pdf/ResumePdfViewer.tsx   "Native react-native-pdf wrapper; props { uri, before, after }"
stub src/components/pdf/WebViewFallback.tsx   "pdf.js WebView fallback with 3-CDN cascade"
stub src/components/pdf/PdfToolbar.tsx        "Zoom / page nav / share controls"

stub src/components/ats/ScoreArc.tsx          "SVG score ring; color band by score band"
stub src/components/ats/ScoreBreakdown.tsx    "Per-section list with progress bar; capped scroll height"
stub src/components/ats/FixSheet.tsx          "Bottom sheet listing deductions per section"
stub src/components/ats/AppliedFixCard.tsx    "Green APPLIED card with delete (revert)"
stub src/components/ats/HowItWorks.tsx        "Horizontal snap-to-interval carousel + dot indicators"

stub src/components/profile/TabBar.tsx        "Horizontal chip bar for 8 tabs"
stub src/components/profile/ProfileField.tsx  "Labelled field — text/select/date"
stub src/components/profile/EntryCard.tsx     "List-tab entry preview card — edit + trash icons"
stub src/components/profile/EmptyState.tsx    "Friendly empty-state with action CTA"
stub src/components/profile/CompletenessRing.tsx "Profile completeness percent + badge text"

stub src/components/nav/AppBar.tsx            "Consistent header — title, back, optional actions"
stub src/components/nav/TabIcon.tsx           "Tab-bar icon with active/inactive states"

# ── src/features/ ───────────────────────────────────────────────────────────
stub src/features/auth/authStore.ts           "Zustand store — { status, user, tokens }"
stub src/features/auth/tokenStorage.ts        "SecureStore wrappers — store/load/clear tokens atomically"
stub src/features/auth/tokenRefresh.ts        "Schedule refresh 60s before expiry; cancel on sign-out"
stub src/features/auth/sessionRestore.ts      "On launch — read tokens + verify + refresh if needed"
stub src/features/auth/deepLink.ts            "Parse universal-link payloads; route to reset/verify"
stub src/features/auth/signOut.ts             "Clear tokens; cancel refresh timer; reset stores; navigate to auth"

stub src/features/ats/atsStore.ts             "Zustand — { status, result, appliedFixes }; explicit state machine"
stub src/features/ats/pickResume.ts           "expo-document-picker wrapper — PDF/DOC/DOCX, size cap"
stub src/features/ats/uploadResume.ts         "expo-file-system multipart with Promise.race 120s timeout"
stub src/features/ats/scoreBand.ts            "Score -> Excellent/Good/Fair/Poor (ported from web)"
stub src/features/ats/applyFix.ts             "Apply fix + optimistic UI update + rollback on api error"

stub src/features/profile/profileConfig.ts    "8-tab definitions (port from sandbox shape)"
stub src/features/profile/parseResumeToProfile.ts "Parse response -> profile state (REUSED — pure function)"
stub src/features/profile/mapApiProfileToValues.ts "GET /profile response -> profile state (REUSED)"
stub src/features/profile/trimEmpty.ts        "Merge: server values fill blanks, user edits win (REUSED)"
stub src/features/profile/completeness.ts     "Live percent + badge + missing-fields list (REUSED)"
stub src/features/profile/profileStore.ts     "Zustand — { values, dirty, saving }"

stub src/features/payments/purchaseGate.ts    "iOS — open web checkout via expo-web-browser; Android same; no IAP v1"
stub src/features/payments/quotaHandler.ts    "402 response handler — toast + Upgrade on web CTA"
stub src/features/payments/plansStore.ts      "Zustand — cached plans"

stub src/features/notifications/streamConnect.ts "SSE listener — uses /api/auth/stream-token verified user_id"
stub src/features/notifications/notifStore.ts    "Zustand — unread count + list cache"
# NOTE: pushToken.ts intentionally OMITTED from v1. Add in v1.1 alongside api A6.

# ── src/design/ ─────────────────────────────────────────────────────────────
stub src/design/tokens.ts            "Colors, spacing, radii, shadows (ported from web globals.css @theme)"
stub src/design/typography.ts        "Type scale, font weights (Inter + Montserrat — matches web)"
stub src/design/theme.ts             "Light / dark theme objects; useTheme() consumes"
stub src/design/fonts.ts             "expo-font registration — replaces next/font"
stub src/design/motion.ts            "Reanimated easings + durations + variant-specific"

# ── src/i18n/ ───────────────────────────────────────────────────────────────
stub src/i18n/index.ts               "i18next instance + lang detection"
stub src/i18n/en.json                "English strings — all UI copy"

# ── src/utils/ ──────────────────────────────────────────────────────────────
stub src/utils/logger.ts             "Dev-gated console replacement (port pattern from web)"
stub src/utils/formatDate.ts         "date-fns wrappers"
stub src/utils/safeUrl.ts            "http/https/mailto allowlist (REUSED from web sanitizeHtml pattern)"
stub src/utils/analytics.ts          "PostHog/Segment shim — same identity space as web"
stub src/utils/retry.ts              "Exponential backoff helper for transient failures"
stub src/utils/platform.ts           "isIOS / isAndroid / isTablet helpers"

# ── src/constants/ ──────────────────────────────────────────────────────────
stub src/constants/companies.ts      "Static company list (REUSED from web)"
stub src/constants/locations.ts      "(REUSED)"
stub src/constants/roles.ts          "(REUSED)"
stub src/constants/technologies.ts   "(REUSED)"
stub src/constants/env.ts            "EXPO_PUBLIC_* readers w/ defaults + validation"
stub src/constants/stores.ts         "Store IDs, deep-link prefixes, support URLs"

# ── src/types/ ──────────────────────────────────────────────────────────────
stub src/types/index.ts              "Barrel re-export of @careerbot/api-contracts"
stub src/types/navigation.ts         "Expo Router/RN Navigation params per stack/screen"
stub src/types/store.ts              "Zustand store typing helpers"
stub src/types/env.d.ts              "EXPO_PUBLIC_* declarations"

# ── src/hooks/ ──────────────────────────────────────────────────────────────
stub src/hooks/useAuth.ts            "Subscribe to authStore + helpers"
stub src/hooks/useApi.ts             "TanStack Query default options + auth-aware request"
stub src/hooks/useATS.ts             "Upload + scan + apply-fix flow as a single hook"
stub src/hooks/useProfile.ts         "Load + edit + save profile"
stub src/hooks/useNotifications.ts   "SSE + unread count"
stub src/hooks/useTheme.ts           "Read current theme + toggle"
stub src/hooks/useDeepLink.ts        "Wire up universal-link handler at app root"

# ── src/platform/ ───────────────────────────────────────────────────────────
stub src/platform/ios/ATT.ts                "App Tracking Transparency prompt"
stub src/platform/ios/appleSignIn.ts        "expo-apple-authentication wrapper"
stub src/platform/ios/webCheckout.ts        "Open web /pricing or /payments in expo-web-browser"
stub src/platform/android/permissions.ts    "POST_NOTIFICATIONS runtime permission (Android 13+)"
stub src/platform/android/intent.ts         "Custom intent filter helpers"

# ── tests/ ──────────────────────────────────────────────────────────────────
stub tests/mocks/handlers.ts         "MSW request handlers per api endpoint"
stub tests/mocks/server.ts           "MSW server setup"
stub tests/e2e/config/detox.config.js "Detox configuration"
stub tests/e2e/flows/signin.e2e.ts   "E2E signin happy path + invalid creds + reset"
stub tests/e2e/flows/atsScan.e2e.ts  "E2E upload -> scan -> apply fix -> preview"
stub tests/e2e/flows/profileEdit.e2e.ts "E2E auto-fill -> edit personal -> save"

# ── scripts/ ────────────────────────────────────────────────────────────────
stub scripts/codex-cross-check.sh    "Pipe a prompt to codex review/exec — mirrors careerbot-ai pattern"
stub scripts/pre-push.sh             "Husky pre-push — lint + typecheck + unit tests + e2e smoke"
stub scripts/release-notes.sh        "Generate CHANGELOG.md entry from conventional commits"
stub scripts/bump-version.sh         "Bump version in app.config.ts + create git tag"
stub scripts/ios-screenshots.sh      "Capture App Store screenshot set via fastlane snapshot"

# ── docs/ — ADRs + playbooks + postmortems ──────────────────────────────────
stub docs/adr/0001-react-native-expo.md          "ADR-001 React Native + Expo (managed workflow), SDK 52"
stub docs/adr/0002-separate-repo.md              "ADR-002 New separate repo careerbot-mobile"
stub docs/adr/0003-typescript-strict.md          "ADR-003 TypeScript strict from day 1"
stub docs/adr/0004-shared-api-contracts.md       "ADR-004 Shared @careerbot/api-contracts private package"
stub docs/adr/0005-expo-router.md                "ADR-005 Expo Router file-based routing"
stub docs/adr/0006-no-native-edits-v1.md         "ADR-006 No native code edits in v1"
stub docs/adr/0007-tanstack-query-zustand.md     "ADR-007 TanStack Query + Zustand"
stub docs/adr/0008-defer-monorepo.md             "ADR-008 Defer monorepo migration to Phase 6+"
stub docs/adr/0009-server-side-authz.md          "ADR-009 Tenant + role + entitlement enforced server-side"
stub docs/adr/0010-design-freeze-web-tokens.md   "ADR-010 Mobile design freezes current web tokens for v1"

stub docs/playbooks/RELEASE_RUNBOOK.md           "Release runbook — see reviews/mobile/06_ADRS_AND_RUNBOOKS.md"
stub docs/playbooks/INCIDENT_RUNBOOK.md          "Incident runbook — see reviews/mobile/06_ADRS_AND_RUNBOOKS.md"
stub docs/playbooks/REJECTION_RUNBOOK.md         "Apple/Play rejection runbook — see reviews/mobile/06_ADRS_AND_RUNBOOKS.md"

# ── root markdown ───────────────────────────────────────────────────────────
stub README.md                       "CareerBOT Mobile"
stub ARCHITECTURE.md                 "Architecture one-pager — points to careerbot-web-pr15/reviews/MOBILE_ARCHITECTURE_BLUEPRINT.md"
stub CHANGELOG.md                    "CareerBOT Mobile changelog"
stub CONTRIBUTING.md                 "Contributing guide"

# ── git ignore augmentations (only if .gitignore exists) ────────────────────
if [ -f .gitignore ]; then
  echo ""
  echo "=== Augmenting .gitignore ==="
  for line in ".env" ".env.local" ".env.production" "*.keystore" "*.p8" "*.p12" "*.mobileprovision" ".detox-artifacts/" "coverage/"; do
    if ! grep -Fqx "$line" .gitignore; then
      echo "$line" >> .gitignore
      echo "  add to .gitignore: $line"
    fi
  done
fi

echo ""
echo "=== Done ==="
echo ""
echo "Next steps:"
echo "  1. Paste configs from reviews/mobile/05_REPO_BOOTSTRAP_KIT.md into:"
echo "       package.json   tsconfig.json   app.config.ts"
echo "       eas.json       .eslintrc.cjs   .prettierrc"
echo "       babel.config.js   .husky/pre-push"
echo "  2. Run: npx expo install --fix"
echo "  3. Run: pnpm install"
echo "  4. Run: pnpm typecheck   (will fail on stubs — expected; phases fill them in)"
echo "  5. First commit: 'chore: bootstrap mobile repo scaffold'"
echo "  6. Start Phase 1 per reviews/mobile/04_PHASE_PLAYBOOK.md"
echo ""
echo "Note: Stubs have only a 1-line header comment. typecheck will fail until"
echo "      phases implement the bodies. That is by design — TypeScript errors"
echo "      list every unimplemented file, giving the team a precise TODO list."
