#!/usr/bin/env bash
# =============================================================================
# split-pr.sh  —  Careerbot PR split: 500-file mega-PR → 8 reviewable PRs
#
# Usage:  bash scripts/split-pr.sh
#
# Each branch is created from origin/develop2.
# Files are cherry-picked from feature/all-updated-features.
# Run from the repo root.  Requires a clean working tree.
# =============================================================================
set -euo pipefail

SOURCE="feature/all-updated-features"
BASE="origin/develop2"

# ── safety check ──────────────────────────────────────────────────────────────
if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERROR: working tree is dirty. Commit or stash changes first."
  exit 1
fi

checkout_files() {
  # $1 = branch name (new)
  # remaining args = files/globs to bring in from SOURCE
  local branch="$1"; shift
  local files=("$@")

  echo ""
  echo "════════════════════════════════════════"
  echo "  Creating $branch"
  echo "════════════════════════════════════════"

  git checkout -B "$branch" "$BASE"

  for f in "${files[@]}"; do
    # expand globs against the SOURCE tree
    while IFS= read -r file; do
      # skip files that don't exist in SOURCE
      if git ls-tree -r --name-only "$SOURCE" | grep -qF "$file"; then
        git checkout "$SOURCE" -- "$file" 2>/dev/null || true
      fi
    done < <(git ls-tree -r --name-only "$SOURCE" | grep -F "$f" || true)
  done
}

commit_and_log() {
  local msg="$1"
  git add -A
  if git diff --cached --quiet; then
    echo "  (nothing to commit)"
  else
    git commit -m "$msg"
    echo "  ✓ committed"
  fi
}

# ══════════════════════════════════════════════════════════════════════════════
# PR 1 — chore/baseline-cleanup
# CI workflows · .gitignore · next.config.ts · packages · shared lib/types/
#   hooks/components that every other PR depends on · user-facing shell pages
# ══════════════════════════════════════════════════════════════════════════════
BASELINE_FILES=(
  # CI / repo hygiene
  ".github/workflows/frontend-ci.yml"
  ".github/workflows/security-scan.yml"
  "next.config.ts"
  "eslint.config.mjs"
  "package.json"
  "package-lock.json"

  # Remove large binary/archive artifacts tracked by git
  # (handled via git rm after checkout — see below)

  # Foundation lib
  "src/lib/http.ts"
  "src/lib/logger.ts"
  "src/lib/tracing.ts"
  "src/lib/utils.ts"
  "src/lib/correlationId.ts"
  "src/lib/setSafeInnerHTML.ts"

  # Shared types
  "src/types/api.types.ts"
  "src/types/dashboard.types.ts"
  "src/types/mespeak.d.ts"
  "src/types/onboarding.types.ts"
  "src/types/quota.types.ts"
  "src/types/subscription.types.ts"

  # Shared contexts
  "src/contexts/DashboardContext.tsx"

  # Shared hooks (credits, subscription, notifications, token)
  "src/hooks/useCreditsBalance.ts"
  "src/hooks/useCreditsUsageHistory.ts"
  "src/hooks/useCurrentSubscription.ts"
  "src/hooks/useSubscriptionPlans.ts"
  "src/hooks/useCreditCheck.tsx"
  "src/hooks/useTokenRefresh.ts"
  "src/hooks/useNotificationStream.ts"
  "src/hooks/useNotificationsList.ts"
  "src/hooks/useUnreadNotificationsCount.ts"
  "src/hooks/useAIDescriptionGenerator.ts"

  # Shared API layer
  "src/api/authApi.ts"
  "src/api/userApi.ts"
  "src/api/creditsApi.ts"
  "src/api/subscriptionApi.ts"
  "src/api/notificationsApi.ts"
  "src/api/dashboardApi.ts"
  "src/api/quotaApi.ts"
  "src/api/jobsApi.ts"

  # Layout / shell components
  "src/components/layout/Header.tsx"
  "src/components/layout/NotificationsPanel.tsx"
  "src/components/layout/UserMenuDropdown.tsx"
  "src/components/layout/Sidebar.tsx"

  # Credits UI
  "src/components/credits/CreditBadge.tsx"
  "src/components/credits/CreditConfirmModal.tsx"
  "src/components/credits/CreditCostLabel.tsx"
  "src/components/credits/InsufficientCreditsModal.tsx"
  "src/components/credits/UpgradePrompt.tsx"

  # Common UI primitives
  "src/components/common/Card.tsx"
  "src/components/common/Modal.tsx"
  "src/components/common/MultiSelectAutocomplete.tsx"
  "src/components/common/SafeHTML.tsx"
  "src/components/common/Tabs.tsx"
  "src/components/common/CustomDropdown.tsx"
  "src/components/common/ToggleSwitch.tsx"
  "src/components/common/index.ts"
  "src/components/ui/Alert.tsx"
  "src/components/ui/Badge.tsx"
  "src/components/ui/Button.tsx"
  "src/components/ui/Progress.tsx"
  "src/components/ui/Skeleton.tsx"

  # Shared page components
  "src/components/EmailSentScreen.tsx"
  "src/components/EmailVerificationBanner.tsx"
  "src/components/ErrorBoundary.tsx"
  "src/components/ErrorPopupModal.tsx"
  "src/components/SearchableCombobox.tsx"
  "src/components/SignUpModal.tsx"
  "src/components/SocialLoginButtons.tsx"

  # App shell
  "src/app/globals.css"
  "src/app/ClientLayout.tsx"
  "src/app/page.tsx"

  # Auth pages (login/signup flows)
  "src/app/auth/google/success/page.tsx"
  "src/app/auth/linkedin/success/page.tsx"
  "src/app/forgot-password/page.tsx"
  "src/app/verify-email/page.tsx"
  "src/app/resend-verification/page.tsx"
  "src/app/reset-password/page.tsx"

  # Settings + Pricing + Notifications
  "src/app/settings/layout.tsx"
  "src/app/settings/page.tsx"
  "src/app/settings/subscription/_components/BillingHistory.tsx"
  "src/app/settings/subscription/_components/CurrentPlanCard.tsx"
  "src/app/settings/subscription/_components/UsageHistoryTable.tsx"
  "src/app/settings/subscription/page.tsx"
  "src/app/(pricing)/pricing/_components/PlanCard.tsx"
  "src/app/(pricing)/pricing/layout.tsx"
  "src/app/(pricing)/pricing/page.tsx"
  "src/app/(notification)/alerts/page.tsx"
  "src/app/(notification)/center/page.tsx"
  "src/app/(notification)/layout.tsx"

  # User Dashboard + Profile
  "src/app/(user)/dashboard/ClientLayout.tsx"
  "src/app/(user)/dashboard/_components/CreditBalanceCard.tsx"
  "src/app/(user)/dashboard/_components/FirstTimeDashboard.tsx"
  "src/app/(user)/dashboard/_components/PlanStatusCard.tsx"
  "src/app/(user)/dashboard/_components/ProfileCompletenessCard.tsx"
  "src/app/(user)/dashboard/_components/QuickActionCard.tsx"
  "src/app/(user)/dashboard/_components/QuickActionsGrid.tsx"
  "src/app/(user)/dashboard/_components/RecentActivityPanel.tsx"
  "src/app/(user)/dashboard/_components/RecommendedNextStep.tsx"
  "src/app/(user)/dashboard/_components/ScoreSummaryPanel.tsx"
  "src/app/(user)/dashboard/_components/skeletons/ActivityScoreSkeleton.tsx"
  "src/app/(user)/dashboard/_components/skeletons/NextStepSkeleton.tsx"
  "src/app/(user)/dashboard/_components/skeletons/QuickActionsSkeleton.tsx"
  "src/app/(user)/dashboard/_components/skeletons/StatsRowSkeleton.tsx"
  "src/app/(user)/dashboard/jobs/page.tsx"
  "src/app/(user)/dashboard/layout.tsx"
  "src/app/(user)/dashboard/page.tsx"
  "src/app/(user)/dashboard/recent-activity/page.tsx"
  "src/app/(user)/dashboard/resume/_components/AddResumeModal.tsx"
  "src/app/(user)/dashboard/resume/_components/DeleteConfirmModal.tsx"
  "src/app/(user)/dashboard/resume/_components/DownloadModal.tsx"
  "src/app/(user)/dashboard/resume/_components/EmptyState.tsx"
  "src/app/(user)/dashboard/resume/_components/ResumeProgressBar.tsx"
  "src/app/(user)/dashboard/resume/_components/ResumeTableRow.tsx"
  "src/app/(user)/dashboard/resume/page.tsx"
  "src/app/(user)/dashboard/profile/_components/certifications/CertificationForm.tsx"
  "src/app/(user)/dashboard/profile/page.tsx"
  "src/app/(user)/feedback/page.tsx"
  "src/app/(user)/onboarding/_components/ProgressIndicator.tsx"
  "src/app/(user)/onboarding/_components/Step1PersonalInfo.tsx"
  "src/app/(user)/onboarding/_components/Step2ResumeUpload.tsx"
  "src/app/(user)/onboarding/_components/Step3WelcomeSummary.tsx"
  "src/app/(user)/onboarding/layout.tsx"
  "src/app/(user)/onboarding/page.tsx"
  "src/app/(user)/portfolio/page.tsx"
  "src/app/(user)/profile/ClientLayout.tsx"
  "src/app/(user)/profile/_components/ConfirmDeleteModal.tsx"
  "src/app/(user)/profile/_components/EmploymentInfoSection.tsx"
  "src/app/(user)/profile/_components/LinkedinImportModal.tsx"
  "src/app/(user)/profile/_components/MainSection.tsx"
  "src/app/(user)/profile/_components/PersonalInfoSection.tsx"
  "src/app/(user)/profile/_components/ProfileTabs.tsx"
  "src/app/(user)/profile/_components/RightSection.tsx"
  "src/app/(user)/profile/_components/SkillsSection.tsx"
  "src/app/(user)/profile/_components/certifications/CertificationCard.tsx"
  "src/app/(user)/profile/_components/certifications/CertificationEmptyState.tsx"
  "src/app/(user)/profile/_components/certifications/CertificationForm.tsx"
  "src/app/(user)/profile/_components/certifications/CertificationList.tsx"
  "src/app/(user)/profile/_components/certifications/CertificationsSection.tsx"
  "src/app/(user)/profile/_components/education/EducationCard.tsx"
  "src/app/(user)/profile/_components/education/EducationEmptyState.tsx"
  "src/app/(user)/profile/_components/education/EducationForm.tsx"
  "src/app/(user)/profile/_components/education/EducationList.tsx"
  "src/app/(user)/profile/_components/education/EducationSection.tsx"
  "src/app/(user)/profile/_components/employmentInfo/EmploymentInfoCard.tsx"
  "src/app/(user)/profile/_components/employmentInfo/EmploymentInfoEmptyState.tsx"
  "src/app/(user)/profile/_components/employmentInfo/EmploymentInfoForm.tsx"
  "src/app/(user)/profile/_components/employmentInfo/EmploymentInfoList.tsx"
  "src/app/(user)/profile/_components/employmentInfo/EmploymentInfoSection.tsx"
  "src/app/(user)/profile/_components/experience/ExperienceCard.tsx"
  "src/app/(user)/profile/_components/experience/ExperienceEmptyState.tsx"
  "src/app/(user)/profile/_components/experience/ExperienceForm.tsx"
  "src/app/(user)/profile/_components/experience/ExperienceList.tsx"
  "src/app/(user)/profile/_components/experience/WorkExperienceSection.tsx"
  "src/app/(user)/profile/_components/projects/ProjectsCard.tsx"
  "src/app/(user)/profile/_components/projects/ProjectsEmptyState.tsx"
  "src/app/(user)/profile/_components/projects/ProjectsForm.tsx"
  "src/app/(user)/profile/_components/projects/ProjectsList.tsx"
  "src/app/(user)/profile/_components/projects/ProjectsSection.tsx"
  "src/app/(user)/profile/_types/PersonalInfoRef.ts"
  "src/app/(user)/profile/_types/ProfileData.ts"
  "src/app/(user)/profile/_types/certification-types.ts"
  "src/app/(user)/profile/_types/education-types.ts"
  "src/app/(user)/profile/_types/experience-types.ts"
  "src/app/(user)/profile/_types/resume.ts"
  "src/app/(user)/profile/_utils/autoFillHelper.ts"
  "src/app/(user)/profile/_utils/education-normalizer.ts"
  "src/app/(user)/profile/_utils/employmentData.ts"
  "src/app/(user)/profile/_utils/linkedinMapper.ts"
  "src/app/(user)/profile/_utils/resumeMapper.ts"
  "src/app/(user)/profile/_utils/skillsData.ts"
  "src/app/(user)/profile/context/ProfileContext.tsx"
  "src/app/(user)/profile/layout.tsx"
  "src/app/(user)/profile/page.tsx"

  # AI assistant
  "src/app/(ai)/assistant/page.tsx"
  "src/app/(ai)/career/page.tsx"
  "src/app/(ai)/chatbot/page.tsx"
  "src/app/(saas)/portal/page.tsx"
  "src/app/(analytics)/resume/page.tsx"

  # Mocks + utils
  "src/__mocks__/dashboardMock.ts"
  "src/__mocks__/quotaMock.ts"
  "src/utils/navigationOptimization.ts"
  "src/utils/storage.ts"
  "src/utils/sectionRouter.ts"

  # Public assets
  "public/assets/icons/Logo.png"
  "public/assets/images/atslogin.png"
)

git checkout -B "chore/baseline-cleanup" "$BASE"

# Checkout the baseline files from source
for f in "${BASELINE_FILES[@]}"; do
  git checkout "$SOURCE" -- "$f" 2>/dev/null || true
done

# Remove tracked binary/archive artifacts
git rm -f "src/app/(employer)/recruiter/posted-jobs.zip" 2>/dev/null || true
git rm -f "src/app/(user)/dashboard.zip" 2>/dev/null || true
git rm -f "CAREERBOT_LATEST_PR_DEEP_ANALYSIS.txt" 2>/dev/null || true
git rm -f "CAREERBOT_USER_DASHBOARD_DESIGN_V3.txt" 2>/dev/null || true
git rm -f "DASHBOARD_BACKEND_API_SPEC.txt" 2>/dev/null || true
git rm -f "ENGLISH_ASSESSMENT_ENTERPRISE_CHALLENGES_AND_SOLUTIONS.txt" 2>/dev/null || true
git rm -f "Errors.txt" 2>/dev/null || true
git rm -f "MOCK_INTERVIEW_COMPLETE_BLUEPRINT_V3_1.txt" 2>/dev/null || true
git rm -f "docs/ats-enhancer-spec.txt" 2>/dev/null || true
git rm -f "docs/resume-merge-analysis.txt" 2>/dev/null || true
git rm -f ".claude/settings.local.json" 2>/dev/null || true

git add -A
git commit -m "$(cat <<'EOF'
chore: baseline cleanup — CI, shared lib, credits system, user dashboard

- Add GitHub Actions workflows (frontend-ci, security-scan)
- next.config.ts: reactStrictMode=true, remove ignoreBuildErrors
- package.json: remove idb-keyval (unused dep)
- Foundation: lib/http fail-closed for prod, lib/logger, lib/tracing
- Shared types, contexts, hooks (credits, subscription, notifications)
- Layout: Header split into NotificationsPanel + UserMenuDropdown
- Credits UI components and hooks with real API integration
- User dashboard, profile, onboarding, settings, pricing, notifications
- Remove tracked binaries: posted-jobs.zip, dashboard.zip, analysis .txt files

Depends-on: nothing (base of all subsequent PRs)
EOF
)"

echo "✓ chore/baseline-cleanup done"

# ══════════════════════════════════════════════════════════════════════════════
# PR 2 — fix/security-xss
# Depends on: chore/baseline-cleanup (for SafeHTML + setSafeInnerHTML)
# ══════════════════════════════════════════════════════════════════════════════
git checkout -B "fix/security-xss" "$BASE"

# Bring in the security foundation from baseline-cleanup as a merge base
git merge --no-edit "chore/baseline-cleanup" 2>/dev/null || true

XSS_FILES=(
  "src/lib/setSafeInnerHTML.ts"
  "src/components/common/SafeHTML.tsx"
  # Builder section editors with innerHTML sinks
  "src/app/(resume)/builder/creation/_components/editor/sections/Achievements.tsx"
  "src/app/(resume)/builder/creation/_components/editor/sections/Hobbies.tsx"
  "src/app/(resume)/builder/creation/_components/editor/sections/Interests.tsx"
  "src/app/(resume)/builder/creation/_components/editor/sections/Internships.tsx"
  "src/app/(resume)/builder/creation/_components/editor/sections/ProfessionalSummary.tsx"
  "src/app/(resume)/builder/creation/_components/editor/sections/Projects.tsx"
  "src/app/(resume)/builder/creation/_components/editor/sections/WorkExperience.tsx"
  # Enhancer section editors
  "src/app/(resume)/enhancer/_components/section-editors/RichTextEditorField.tsx"
  "src/app/(resume)/enhancer/_components/section-editors/AchievementsEditor.tsx"
  "src/app/(resume)/enhancer/_components/section-editors/HobbiesEditor.tsx"
  "src/app/(resume)/enhancer/_components/section-editors/InterestsEditor.tsx"
  "src/app/(resume)/enhancer/_components/section-editors/InternshipsEditor.tsx"
  "src/app/(resume)/enhancer/_components/section-editors/ProjectsEditor.tsx"
  # Extension popup avatar XSS
  "extension/popup/popup.js"
  "extension/popup/popup.html"
  "extension/popup/popup.css"
  "extension/manifest.json"
)

for f in "${XSS_FILES[@]}"; do
  git checkout "$SOURCE" -- "$f" 2>/dev/null || true
done

git add -A
git commit -m "$(cat <<'EOF'
fix(security): eliminate XSS sinks in contenteditable editors and extension popup

P0 — Stop-Ship fixes:
- Add src/lib/setSafeInnerHTML.ts: centralized DOMPurify sanitizer for
  contenteditable .innerHTML writes (allowlist: b/i/em/strong/p/ul/ol/li/br)
- SafeHTML.tsx: replace async useState pattern with synchronous
  isomorphic-dompurify to eliminate SSR race condition / hydration flash
- Replace 9 raw .innerHTML = value sinks in resume builder section editors
  with setSafeInnerHTML(el, value)
- Replace 5 raw .innerHTML sinks in enhancer section editors
- extension/popup/popup.js: replace innerHTML avatar injection with
  DOM API (createElement + src assignment) to prevent script injection

All DOMPurify configs use explicit ALLOWED_TAGS/ALLOWED_ATTR allowlists.

Closes: P0-1, P0-2, P0-4
Depends-on: chore/baseline-cleanup
EOF
)"

echo "✓ fix/security-xss done"

# ══════════════════════════════════════════════════════════════════════════════
# PR 3 — fix/api-auth-hardening
# Depends on: chore/baseline-cleanup
# ══════════════════════════════════════════════════════════════════════════════
git checkout -B "fix/api-auth-hardening" "$BASE"
git merge --no-edit "chore/baseline-cleanup" 2>/dev/null || true

AUTH_FILES=(
  "src/middleware.ts"
  "src/app/api/rasa/route.ts"
  "src/app/api/ats-score/route.ts"
  "src/app/api/auth/callback/google/route.ts"
  "src/app/api/backend/enhance-keywords/[resumeId]/route.ts"
  "src/app/api/backend/get-ats-score/[resume_id]/route.ts"
  "src/app/api/backend/get-ats-score/ats-score/route.ts"
  "src/app/api/backend/get-keyword-analysis/[resumeId]/route.ts"
  "src/app/api/generate-description/route.ts"
  "src/app/admin/_hooks/useAdminAccess.ts"
  "src/api/recruiterAuthApiMain.ts"
  "src/api/adminAuthApi.ts"
)

for f in "${AUTH_FILES[@]}"; do
  git checkout "$SOURCE" -- "$f" 2>/dev/null || true
done

# Bring in service-health route if it exists
git checkout "$SOURCE" -- "src/app/api/backend/service-health/route.ts" 2>/dev/null || true

git add -A
git commit -m "$(cat <<'EOF'
fix(security): harden API routes — auth checks, error masking, CORS, middleware roles

P0:
- src/app/api/rasa/route.ts: CAREERBOT_AI_URL env var (fail-closed),
  cookie auth guard, NEXT_PUBLIC_FRONTEND_URL CORS lock, 1 MB body cap

P1:
- src/app/api/ats-score/route.ts: cookie auth + 1 MB content-length cap
- src/app/api/backend/service-health/route.ts: cookie auth + strip backend
  internals from response (returns only { status: 'ok' })
- src/app/api/auth/login/route.ts: generic 500 message to client,
  actual error logged server-side only
- src/middleware.ts: role-based path routing (/admin/* → admin/login,
  /recruiter/* → recruiter/auth) when session cookie absent
- src/app/admin/_hooks/useAdminAccess.ts: 60s TTL on cached admin role
  (admin_role_at timestamp key) — prevents stale privilege escalation
- src/api/adminAuthApi.ts + recruiterAuthApiMain.ts: production
  fail-closed guard on NEXT_PUBLIC_BASE_URL

Closes: P0-3, P1-3, P1-4, P1-6, P1-8, P1-9, P1-15
Depends-on: chore/baseline-cleanup
EOF
)"

echo "✓ fix/api-auth-hardening done"

# ══════════════════════════════════════════════════════════════════════════════
# PR 4 — feat/recruiter-surfaces
# Depends on: chore/baseline-cleanup, fix/api-auth-hardening
# ══════════════════════════════════════════════════════════════════════════════
git checkout -B "feat/recruiter-surfaces" "$BASE"
git merge --no-edit "fix/api-auth-hardening" 2>/dev/null || true

RECRUITER_FILES=(
  "src/app/(employer)/recruiter/auth/page.tsx"
  "src/app/(employer)/recruiter/candidates/[id]/page.tsx"
  "src/app/(employer)/recruiter/candidates/_components/ScheduleInterviewModal.tsx"
  "src/app/(employer)/recruiter/candidates/page.tsx"
  "src/app/(employer)/recruiter/dashboard/_components/DashboardLayout.tsx"
  "src/app/(employer)/recruiter/dashboard/page.tsx"
  "src/app/(employer)/recruiter/edit-job/[id]/page.tsx"
  "src/app/(employer)/recruiter/interviews/[id]/page.tsx"
  "src/app/(employer)/recruiter/interviews/_components/RescheduleInterviewModal.tsx"
  "src/app/(employer)/recruiter/interviews/page.tsx"
  "src/app/(employer)/recruiter/job-post/page.tsx"
  "src/app/(employer)/recruiter/messages/page.tsx"
  "src/app/(employer)/recruiter/posted-jobs/[id]/page.tsx"
  "src/app/(employer)/recruiter/posted-jobs/_components/AIChat.tsx"
  "src/app/(employer)/recruiter/posted-jobs/page.tsx"
  "src/app/(employer)/recruiter/settings/page.tsx"
  "src/types/recruiterAuthTypes.ts"
  "src/api/extensionApi.ts"
  # Public assets for recruiter tabs
  "public/assets/Candidates_Tab_icons/Reject.svg"
  "public/assets/Candidates_Tab_icons/Schedule_interview.svg"
  "public/assets/Candidates_Tab_icons/Shortlist.svg"
  "public/assets/Candidates_Tab_icons/View_details.svg"
  "public/assets/Interview_Tab_icons/Cancel_interview.svg"
  "public/assets/Interview_Tab_icons/Reschedule_interview_icon.svg"
  "public/assets/Interview_Tab_icons/View_interview_details.svg"
  # Jobs surfaces
  "src/app/(jobs)/analytics/page.tsx"
  "src/app/(jobs)/job-parser/page.tsx"
  "src/app/(jobs)/jobmatch/_components/Overview.tsx"
  "src/app/(jobs)/jobmatch/_components/OverviewClient.tsx"
  "src/app/(jobs)/jobmatch/_components/_hooks/useMatchAnalysis.ts"
  "src/app/(jobs)/jobmatch/_components/_hooks/useResumePDF.ts"
  "src/app/(jobs)/jobmatch/_components/_hooks/useSkillUpdate.ts"
  "src/app/(jobs)/jobmatch/_components/_lib/_types.ts"
  "src/app/(jobs)/jobmatch/_components/_lib/api/match.ts"
  "src/app/(jobs)/jobmatch/_components/_lib/services/matchService.ts"
  "src/app/(jobs)/jobmatch/_components/_lib/utils/constants.ts"
  "src/app/(jobs)/jobmatch/_components/_lib/utils/helpers.ts"
  "src/app/(jobs)/jobmatch/_components/_lib/utils/highlighter.ts"
  "src/app/(jobs)/jobmatch/_components/_styles/docx-preview.css"
  "src/app/(jobs)/jobmatch/_components/_types/index.ts"
  "src/app/(jobs)/jobmatch/_components/_types/match.ts"
  "src/app/(jobs)/jobmatch/_components/_types/skills.ts"
  "src/app/(jobs)/jobmatch/_components/analysis/AnalysisContent.tsx"
  "src/app/(jobs)/jobmatch/_components/analysis/PDFPreviewError.tsx"
  "src/app/(jobs)/jobmatch/_components/analysis/TopAnalysisBar.tsx"
  "src/app/(jobs)/jobmatch/_components/highlighter/JDHeader.tsx"
  "src/app/(jobs)/jobmatch/_components/highlighter/JDHighlighter.tsx"
  "src/app/(jobs)/jobmatch/_components/resume/JobMatchSectionEditor.tsx"
  "src/app/(jobs)/jobmatch/_components/resume/JobMatchTemplate.tsx"
  "src/app/(jobs)/jobmatch/_components/resume/ResumeHeader.tsx"
  "src/app/(jobs)/jobmatch/_components/resume/ResumePreview.tsx"
  "src/app/(jobs)/jobmatch/_components/skills/ListSection.tsx"
  "src/app/(jobs)/jobmatch/_components/skills/MissingSoftSkillsCard.tsx"
  "src/app/(jobs)/jobmatch/_components/skills/MissingTechnicalSkillsCard.tsx"
  "src/app/(jobs)/jobmatch/_components/skills/TokenPill.tsx"
  "src/app/(jobs)/jobmatch/_components/ui/Card.tsx"
  "src/app/(jobs)/jobmatch/_components/ui/LoadingAnimation.tsx"
  "src/app/(jobs)/jobmatch/_components/ui/Tab.tsx"
  "src/app/(jobs)/jobmatch/layout.tsx"
  "src/app/(jobs)/jobmatch/loading.tsx"
  "src/app/(jobs)/jobmatch/page.tsx"
  "src/app/(jobs)/jobs/[id]/JobDetailsClient.tsx"
  "src/app/(jobs)/jobs/[id]/page.tsx"
  "src/app/(jobs)/jobs/_components/JobApplicationModal.tsx"
  "src/app/(jobs)/jobs/_components/JobSkeleton.tsx"
  "src/app/(jobs)/jobs/_components/JobsContents.tsx"
  "src/app/(jobs)/jobs/_components/JobsHeaderSection.tsx"
  "src/app/(jobs)/jobs/_components/JobsTabs.tsx"
  "src/app/(jobs)/jobs/_components/LeftSidebar.tsx"
  "src/app/(jobs)/jobs/_components/Pagination.tsx"
  "src/app/(jobs)/jobs/_components/SearchBar.tsx"
  "src/app/(jobs)/jobs/_components/SortSelect.tsx"
  "src/app/(jobs)/jobs/_components/chat/InsightCard.tsx"
  "src/app/(jobs)/jobs/_components/chat/InterviewReadiness.tsx"
  "src/app/(jobs)/jobs/_components/chat/NancyBirdIconMinimal.tsx"
  "src/app/(jobs)/jobs/_components/chat/NancyBirdIconPremium.tsx"
  "src/app/(jobs)/jobs/_components/chat/NancyChat.tsx"
  "src/app/(jobs)/jobs/_components/chat/NancyGuideModal.tsx"
  "src/app/(jobs)/jobs/_components/chat/PromptCard.tsx"
  "src/app/(jobs)/jobs/_components/chat/SkillGapAnalyzer.tsx"
  "src/app/(jobs)/jobs/_components/chat/SmartSuggestions.tsx"
  "src/app/(jobs)/jobs/_components/filters/QuickFilters.tsx"
  "src/app/(jobs)/jobs/_components/job-cards/ApplicationModal.tsx"
  "src/app/(jobs)/jobs/_components/job-cards/JobCard.tsx"
  "src/app/(jobs)/jobs/_components/job-cards/JobPageBanner.tsx"
  "src/app/(jobs)/jobs/_components/job-cards/JobSkeleton.tsx"
  "src/app/(jobs)/jobs/_components/job-cards/MatchScoreCircle.tsx"
  "src/app/(jobs)/jobs/_components/sidebar/CareerTip.tsx"
  "src/app/(jobs)/jobs/_components/sidebar/JobList.tsx"
  "src/app/(jobs)/jobs/_components/sidebar/SalaryInsights.tsx"
  "src/app/(jobs)/jobs/_components/sidebar/TopPickCard.tsx"
  "src/app/(jobs)/jobs/applications/[id]/page.tsx"
  "src/app/(jobs)/jobs/data/jobs.ts"
  "src/app/(jobs)/jobs/layout.tsx"
  "src/app/(jobs)/jobs/page.tsx"
  "src/app/(jobs)/jobs/tracking/_components/JobTracker.tsx"
  "src/app/(jobs)/jobs/tracking/_components/mockTrackerData.ts"
  "src/app/(jobs)/jobs/tracking/_hooks/useJobTracker.ts"
  "src/app/(jobs)/jobs/tracking/page.tsx"
  "src/app/(jobs)/tracker/_components/JobTracker.tsx"
  "src/app/(jobs)/tracker/layout.tsx"
  "src/app/(jobs)/tracker/page.tsx"
  # Job utils
  "src/utils/jobApplication.ts"
  "src/utils/jobIdHelper.ts"
  "src/utils/jobLevelUtils.ts"
  "src/utils/jobTracking.ts"
  "src/utils/resumeSkillInjector.ts"
)

for f in "${RECRUITER_FILES[@]}"; do
  git checkout "$SOURCE" -- "$f" 2>/dev/null || true
done

git add -A
git commit -m "$(cat <<'EOF'
feat: recruiter portal surfaces + job search, match, and tracking

New recruiter portal:
- Auth, dashboard, candidates, interviews, job-post, posted-jobs,
  messages, settings pages under (employer)/recruiter/
- Public SVG assets for Candidates/Interview tab icons

Job surfaces:
- Job search (jobs/page, job cards, filters, sidebar, chat/Nancy AI)
- Job match analysis (jobmatch with JD highlighter, skill gap, PDF preview)
- Job tracking board (tracker, applications)
- Job parser page

Utils: jobApplication, jobIdHelper, jobLevelUtils, jobTracking,
       resumeSkillInjector

Accessibility: interactive divs in JobMatchSectionEditor and Overview
  now have role=button + tabIndex + keyboard handlers

Depends-on: fix/api-auth-hardening
EOF
)"

echo "✓ feat/recruiter-surfaces done"

# ══════════════════════════════════════════════════════════════════════════════
# PR 5 — feat/resume-editor-v2
# Depends on: fix/security-xss (for setSafeInnerHTML + sanitized editors)
# ══════════════════════════════════════════════════════════════════════════════
git checkout -B "feat/resume-editor-v2" "$BASE"
git merge --no-edit "fix/security-xss" 2>/dev/null || true

RESUME_FILES=(
  # API layer
  "src/api/resumeApi.ts"
  "src/api/resumeatsapi.ts"
  "src/api/enhancerApi.ts"
  "src/api/resumeParsingApi.ts"

  # ATS
  "src/app/(resume)/ats/_components/report/DetailedReport.tsx"
  "src/app/(resume)/ats/layout.tsx"
  "src/app/(resume)/atslogin/_components/ATSLoginPage.tsx"
  "src/app/(resume)/atslogin/_components/ErrorModal.tsx"
  "src/app/(resume)/atslogin/_components/LoadingModal.tsx"
  "src/app/(resume)/atslogin/layout.tsx"
  "src/app/(resume)/atslogin/page.tsx"
  "src/app/(resume)/atslogin/report/page.tsx"

  # Builder
  "src/app/(resume)/builder/creation/_components/Header.tsx"
  "src/app/(resume)/builder/creation/_components/PreviewPanel.tsx"
  "src/app/(resume)/builder/creation/_components/editor/AutocompleteInput.tsx"
  "src/app/(resume)/builder/creation/_components/editor/CircularProgress.tsx"
  "src/app/(resume)/builder/creation/_components/editor/CustomSectionEditor.tsx"
  "src/app/(resume)/builder/creation/_components/editor/EditorTab.tsx"
  "src/app/(resume)/builder/creation/_components/editor/SectionItem.tsx"
  "src/app/(resume)/builder/creation/_components/editor/TechnologyChipsInput.tsx"
  "src/app/(resume)/builder/creation/_components/editor/sections/Achievements.tsx"
  "src/app/(resume)/builder/creation/_components/editor/sections/Awards.tsx"
  "src/app/(resume)/builder/creation/_components/editor/sections/Certifications.tsx"
  "src/app/(resume)/builder/creation/_components/editor/sections/Education.tsx"
  "src/app/(resume)/builder/creation/_components/editor/sections/Hobbies.tsx"
  "src/app/(resume)/builder/creation/_components/editor/sections/Interests.tsx"
  "src/app/(resume)/builder/creation/_components/editor/sections/Internships.tsx"
  "src/app/(resume)/builder/creation/_components/editor/sections/Languages.tsx"
  "src/app/(resume)/builder/creation/_components/editor/sections/PersonalInfo.tsx"
  "src/app/(resume)/builder/creation/_components/editor/sections/ProfessionalSummary.tsx"
  "src/app/(resume)/builder/creation/_components/editor/sections/Projects.tsx"
  "src/app/(resume)/builder/creation/_components/editor/sections/Publications.tsx"
  "src/app/(resume)/builder/creation/_components/editor/sections/References.tsx"
  "src/app/(resume)/builder/creation/_components/editor/sections/Volunteering.tsx"
  "src/app/(resume)/builder/creation/_components/editor/sections/WorkExperience.tsx"
  "src/app/(resume)/builder/creation/_components/resumeGPT/ResumeGPTTab.tsx"
  "src/app/(resume)/builder/creation/_components/resumeSidebar/ResumeSide.tsx"
  "src/app/(resume)/builder/creation/_components/score/BackgroundScoreCalculator.tsx"
  "src/app/(resume)/builder/creation/_components/score/ScoreTab.tsx"
  "src/app/(resume)/builder/creation/_components/templates/AutoPaginator.tsx"
  "src/app/(resume)/builder/creation/_components/templates/TemplateFour.tsx"
  "src/app/(resume)/builder/creation/_components/templates/TemplateOne.tsx"
  "src/app/(resume)/builder/creation/_components/templates/TemplateThree.tsx"
  "src/app/(resume)/builder/creation/_components/templates/TemplateTwo.tsx"
  "src/app/(resume)/builder/creation/_components/templates/TemplatesTab.tsx"
  "src/app/(resume)/builder/creation/_context/ResumeContext.tsx"
  "src/app/(resume)/builder/creation/_context/ScoreContext.tsx"
  "src/app/(resume)/builder/creation/_hooks/useAISuggestions.ts"
  "src/app/(resume)/builder/creation/_hooks/useATSScore.ts"
  "src/app/(resume)/builder/creation/_utils/sectionsConfig.ts"
  "src/app/(resume)/builder/creation/layout.tsx"
  "src/app/(resume)/builder/start/_components/AddResumeModal.tsx"
  "src/app/(resume)/builder/start/_components/EmptyState.tsx"
  "src/app/(resume)/builder/start/_components/ResumeTableRow.tsx"
  "src/app/(resume)/builder/start/layout.tsx"
  "src/app/(resume)/builder/start/list/page.tsx"
  "src/app/(resume)/builder/start/page.tsx"

  # Enhancer
  "src/app/(resume)/enhancer/_components/AISuggestionsModal.tsx"
  "src/app/(resume)/enhancer/_components/AutoPaginator.tsx"
  "src/app/(resume)/enhancer/_components/EnhancerPage.tsx"
  "src/app/(resume)/enhancer/_components/ExportModal.tsx"
  "src/app/(resume)/enhancer/_components/LoadingModal.tsx"
  "src/app/(resume)/enhancer/_components/ResumeContext.tsx"
  "src/app/(resume)/enhancer/_components/ResumeTemplate.tsx"
  "src/app/(resume)/enhancer/_components/SectionEditorModal.tsx"
  "src/app/(resume)/enhancer/_components/TemplateSelectionModal.tsx"
  "src/app/(resume)/enhancer/_components/_hooks/useEnhancer.ts"
  "src/app/(resume)/enhancer/_components/enchancepage.tsx"
  "src/app/(resume)/enhancer/_components/section-editors/AchievementsEditor.tsx"
  "src/app/(resume)/enhancer/_components/section-editors/EducationEditor.tsx"
  "src/app/(resume)/enhancer/_components/section-editors/ExperienceEditor.tsx"
  "src/app/(resume)/enhancer/_components/section-editors/HobbiesEditor.tsx"
  "src/app/(resume)/enhancer/_components/section-editors/InterestsEditor.tsx"
  "src/app/(resume)/enhancer/_components/section-editors/InternshipsEditor.tsx"
  "src/app/(resume)/enhancer/_components/section-editors/LanguagesEditor.tsx"
  "src/app/(resume)/enhancer/_components/section-editors/PersonalInfoEditor.tsx"
  "src/app/(resume)/enhancer/_components/section-editors/ProjectsEditor.tsx"
  "src/app/(resume)/enhancer/_components/section-editors/RichTextEditorField.tsx"
  "src/app/(resume)/enhancer/_components/section-editors/SkillsEditor.tsx"
  "src/app/(resume)/enhancer/_components/section-editors/SummaryEditor.tsx"
  "src/app/(resume)/enhancer/_components/section-editors/VolunteeringEditor.tsx"
  "src/app/(resume)/enhancer/_components/templates/TemplateFive.tsx"
  "src/app/(resume)/enhancer/_components/templates/TemplateFour.tsx"
  "src/app/(resume)/enhancer/_components/templates/TemplateOne.tsx"
  "src/app/(resume)/enhancer/_components/templates/TemplateThree.tsx"
  "src/app/(resume)/enhancer/_components/templates/TemplateTwo.tsx"
  "src/app/(resume)/enhancer/_utils/cleanResumeData.ts"
  "src/app/(resume)/enhancer/builder/page.tsx"
  "src/app/(resume)/enhancer/layout.tsx"
  "src/app/(resume)/enhancer/page.tsx"
  "src/app/(resume)/match/page.tsx"
  "src/app/(resume)/parser/page.tsx"
  "src/app/(resume)/templates/page.tsx"

  # Resume utils
  "src/utils/audioUtils.ts"
  "src/utils/convertDocxHeader.ts"
  "src/utils/injectDocxHeaderIntoBody.ts"
)

for f in "${RESUME_FILES[@]}"; do
  git checkout "$SOURCE" -- "$f" 2>/dev/null || true
done

git add -A
git commit -m "$(cat <<'EOF'
feat: resume builder v2, enhancer, ATS scoring, and parser

Resume Builder:
- 4 templates (TemplateOne–Four) with AutoPaginator
- 15 section editors with DOMPurify-sanitized contenteditable writes
  (Achievements, WorkExperience, Projects, etc.)
- ResumeGPT conversational builder tab
- Background score calculator with localStorage resume caching
- ScoreContext: remove redundant typeof window guards in useEffect
- ResumeContext: isMounted pattern for createPortal, remove useCallback import

Enhancer:
- SectionEditorModal with 5 template variants (TemplateFive added)
- enchancepage: fix suggestion.message.toLowerCase() (Improvement type)
- All section editors sanitized via setSafeInnerHTML

ATS / Parser:
- ATSLoginPage, ATS report, parser page
- resumeatsapi: fetchAtsScore now delegates to parserApi.calculateATS
  (removes duplicate raw-fetch implementation)
- ats-score route: cookie auth + content-length cap

API:
- resumeApi.ts: fix 3 as-any hotspots (proper type narrowing)
- resumeatsapi.ts: success/false as const for discriminated union

Depends-on: fix/security-xss
EOF
)"

echo "✓ feat/resume-editor-v2 done"

# ══════════════════════════════════════════════════════════════════════════════
# PR 6 — feat/interview-ws
# Depends on: chore/baseline-cleanup
# ══════════════════════════════════════════════════════════════════════════════
git checkout -B "feat/interview-ws" "$BASE"
git merge --no-edit "chore/baseline-cleanup" 2>/dev/null || true

INTERVIEW_FILES=(
  "src/api/communicationApi.ts"
  "src/app/(interview)/communication/components/AssessmentSidebar.tsx"
  "src/app/(interview)/communication/components/AssessmentSummaryPanel.tsx"
  "src/app/(interview)/communication/components/AudioRecorder.tsx"
  "src/app/(interview)/communication/components/AudioUploadStatus.tsx"
  "src/app/(interview)/communication/components/CommunicationHeader.tsx"
  "src/app/(interview)/communication/components/CustomAudioPlayer.tsx"
  "src/app/(interview)/communication/components/QuestionProgressBar.tsx"
  "src/app/(interview)/communication/components/SectionStartModal.tsx"
  "src/app/(interview)/communication/components/StoryAudioPlayer.tsx"
  "src/app/(interview)/communication/components/TextToSpeechPlayer.tsx"
  "src/app/(interview)/communication/describe-situation/page.tsx"
  "src/app/(interview)/communication/feedback/page.tsx"
  "src/app/(interview)/communication/jumbled-sentences/page.tsx"
  "src/app/(interview)/communication/layout.tsx"
  "src/app/(interview)/communication/listen-and-correct/page.tsx"
  "src/app/(interview)/communication/listen-and-repeat/page.tsx"
  "src/app/(interview)/communication/page.tsx"
  "src/app/(interview)/communication/report/page.tsx"
  "src/app/(interview)/communication/sections/page.tsx"
  "src/app/(interview)/communication/see-and-repeat/page.tsx"
  "src/app/(interview)/communication/sentence-completion/page.tsx"
  "src/app/(interview)/communication/situation-explaining/page.tsx"
  "src/app/(interview)/communication/story-listen-facts/page.tsx"
  "src/app/(interview)/communication/story-listening/page.tsx"
  "src/app/(interview)/live/_components/TTSAudioPlayer.tsx"
  "src/app/(interview)/live/_hooks/useWebsocketInterview.ts"
  "src/app/(interview)/live/page.tsx"
  "src/app/(interview)/mock/_components/AudioRecorder.tsx"
  "src/app/(interview)/mock/page.tsx"
  "src/app/(interview)/mock/practice/page.tsx"
  "src/app/(interview)/mock/report/page.tsx"
  "src/app/(interview)/prep/page.tsx"
  "src/app/(interview)/scheduler/page.tsx"
  "src/types/onboarding.types.ts"
  "src/utils/audioUtils.ts"
)

for f in "${INTERVIEW_FILES[@]}"; do
  git checkout "$SOURCE" -- "$f" 2>/dev/null || true
done

git add -A
git commit -m "$(cat <<'EOF'
feat: communication assessment + live WebSocket interview + mock interview

Communication Assessment (V3.1):
- 10 section pages: describe-situation, listen-and-correct, listen-and-repeat,
  see-and-repeat, jumbled-sentences, sentence-completion, situation-explaining,
  story-listen-facts, story-listening, feedback, report
- Components: AudioRecorder (testId prop), CustomAudioPlayer, StoryAudioPlayer,
  TextToSpeechPlayer, AssessmentSidebar, QuestionProgressBar, SectionStartModal
- communicationApi.ts: full assessment session, Q&A, upload, evaluation API

Live AI Interview (WebSocket):
- useWebsocketInterview: add missing WebSocketMessageType variants
  (audio_chunk, end_answer, end_interview)
- Fail-closed: reject if no JWT token or NEXT_PUBLIC_WS_URL unset in prod
- TTSAudioPlayer for streaming audio responses

Mock Interview:
- Practice, report pages + AudioRecorder component

Depends-on: chore/baseline-cleanup
EOF
)"

echo "✓ feat/interview-ws done"

# ══════════════════════════════════════════════════════════════════════════════
# PR 7 — feat/admin-panel
# Depends on: fix/api-auth-hardening
# ══════════════════════════════════════════════════════════════════════════════
git checkout -B "feat/admin-panel" "$BASE"
git merge --no-edit "fix/api-auth-hardening" 2>/dev/null || true

ADMIN_FILES=(
  "src/api/adminAuthApi.ts"
  "src/api/adminDashboardOverviewApi.ts"
  "src/api/adminJobsApi.ts"
  "src/api/adminManagementApi.ts"
  "src/api/adminPlansApi.ts"
  "src/api/userManagementApi.ts"
  "src/app/admin/_components/AdminSidebar.tsx"
  "src/app/admin/_components/FilterModal.tsx"
  "src/app/admin/_components/jobDetailsModal.tsx"
  "src/app/admin/_hooks/useAdminAccess.ts"
  "src/app/admin/dashboard/_components/RealtimeStats.tsx"
  "src/app/admin/dashboard/admin-management/_components/AdminDetailsModal.tsx"
  "src/app/admin/dashboard/admin-management/_hooks/useAdminManagement.ts"
  "src/app/admin/dashboard/admin-management/page.tsx"
  "src/app/admin/dashboard/header/page.tsx"
  "src/app/admin/dashboard/job-management/_components/AddNewJobForm.tsx"
  "src/app/admin/dashboard/job-management/_components/job-form/AddNewJobForm.tsx"
  "src/app/admin/dashboard/job-management/_components/job-form/ApplicationSettings.tsx"
  "src/app/admin/dashboard/job-management/_components/job-form/JobFormBasicFields.tsx"
  "src/app/admin/dashboard/job-management/_components/job-form/JobFormSkills.tsx"
  "src/app/admin/dashboard/job-management/_components/job-form/JobFormTextFields.tsx"
  "src/app/admin/dashboard/job-management/_components/job-form/LogoUpload.tsx"
  "src/app/admin/dashboard/job-management/_components/job-form/PreviewJobPage.tsx"
  "src/app/admin/dashboard/job-management/_hooks/useJobForm.ts"
  "src/app/admin/dashboard/job-management/_hooks/useJobManagement.ts"
  "src/app/admin/dashboard/job-management/_types/jobFormTypes.ts"
  "src/app/admin/dashboard/job-management/page.tsx"
  "src/app/admin/dashboard/page.tsx"
  "src/app/admin/dashboard/settings/_components/AddPlanModal.tsx"
  "src/app/admin/dashboard/settings/_components/SecurityTab.tsx"
  "src/app/admin/dashboard/settings/hooks/usePlans.ts"
  "src/app/admin/dashboard/settings/page.tsx"
  "src/app/admin/dashboard/settings/types/index.ts"
  "src/app/admin/dashboard/system-monitoring/_components/ApiRequestsSection.tsx"
  "src/app/admin/dashboard/system-monitoring/_components/CpuUsageSection.tsx"
  "src/app/admin/dashboard/system-monitoring/_components/MemoryUsageSection.tsx"
  "src/app/admin/dashboard/system-monitoring/page.tsx"
  "src/app/admin/dashboard/user-management/_components/user-details/TabContents.tsx"
  "src/app/admin/dashboard/user-management/_components/user-details/UserDetailsModal.tsx"
  "src/app/admin/dashboard/user-management/_components/user-details/UserEditForm.tsx"
  "src/app/admin/dashboard/user-management/_hooks/useUserDetails.ts"
  "src/app/admin/dashboard/user-management/_hooks/useUserManagement.ts"
  "src/app/admin/dashboard/user-management/page.tsx"
  "src/app/admin/login/page.tsx"
)

for f in "${ADMIN_FILES[@]}"; do
  git checkout "$SOURCE" -- "$f" 2>/dev/null || true
done

git add -A
git commit -m "$(cat <<'EOF'
feat: admin panel — user/job/admin management, system monitoring, RBAC

Admin dashboard (4 roles: Super Admin > Admin > Moderator > Support):
- User management: list, details modal, edit form, tabbed view
- Job management: full job-form with basic fields, skills, application
  settings, logo upload, preview page
- Admin management: admin details modal
- System monitoring: CPU, memory, API request charts
- Settings: plan management (AddPlanModal), security tab

Auth:
- useAdminAccess: 60s role cache TTL (see fix/api-auth-hardening)
- adminAuthApi: 2FA support, production fail-closed for base URL

API layer: adminDashboardOverviewApi, adminJobsApi, adminManagementApi,
           adminPlansApi, userManagementApi

Depends-on: fix/api-auth-hardening
EOF
)"

echo "✓ feat/admin-panel done"

# ══════════════════════════════════════════════════════════════════════════════
# PR 8 — feat/browser-extension
# Depends on: fix/security-xss (popup XSS fix already in that PR;
#             this PR ships the full extension)
# ══════════════════════════════════════════════════════════════════════════════
git checkout -B "feat/browser-extension" "$BASE"
git merge --no-edit "fix/security-xss" 2>/dev/null || true

EXTENSION_FILES=(
  "extension/README.md"
  "extension/background/service-worker.js"
  "extension/content-scripts/banner.css"
  "extension/content-scripts/foundit-scraper.js"
  "extension/content-scripts/glassdoor-scraper.js"
  "extension/content-scripts/greenhouse-scraper.js"
  "extension/content-scripts/indeed-scraper.js"
  "extension/content-scripts/internshala-scraper.js"
  "extension/content-scripts/lever-scraper.js"
  "extension/content-scripts/linkedin-scraper.js"
  "extension/content-scripts/naukri-scraper.js"
  "extension/content-scripts/shine-scraper.js"
  "extension/content-scripts/timesjobs-scraper.js"
  "extension/content-scripts/wellfound-scraper.js"
  "extension/content-scripts/ziprecruiter-scraper.js"
  "extension/icons/generate-icons.js"
  "extension/icons/icon128.png"
  "extension/icons/icon16.png"
  "extension/icons/icon48.png"
  "extension/icons/logo.png"
  "extension/icons/robot.svg"
  "extension/manifest.json"
  "extension/popup/popup.css"
  "extension/popup/popup.html"
  "extension/popup/popup.js"
  "src/api/extensionApi.ts"
)

for f in "${EXTENSION_FILES[@]}"; do
  git checkout "$SOURCE" -- "$f" 2>/dev/null || true
done

git add -A
git commit -m "$(cat <<'EOF'
feat: browser extension v1.1 — 12 job-board scrapers + security hardening

Content scripts for: LinkedIn, Naukri, Indeed, Glassdoor, Shine, TimesJobs,
Internshala, Foundit (in/sg/my/ph), ZipRecruiter, Wellfound/AngelList,
Greenhouse, Lever

Security hardening:
- manifest.json: web_accessible_resources.matches narrowed from <all_urls>
  to explicit 25 job-board domains (removed wildcard)
- service-worker.js: sender.id validation on chrome.runtime.onMessage
  (rejects messages not from the extension's own ID)
- popup.js: DOM API avatar injection (no innerHTML) — see fix/security-xss

Host permissions: explicit allowlist (no <all_urls>)
Permissions: storage, tabs, activeTab only

Depends-on: fix/security-xss
EOF
)"

echo "✓ feat/browser-extension done"

# ══════════════════════════════════════════════════════════════════════════════
# Return to original branch
# ══════════════════════════════════════════════════════════════════════════════
git checkout "feature/all-updated-features"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  All 8 branches created successfully!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "  Branch             → Target PR"
echo "  ─────────────────────────────────────────────────────────"
echo "  chore/baseline-cleanup    → base for all others"
echo "  fix/security-xss          → after baseline-cleanup"
echo "  fix/api-auth-hardening    → after baseline-cleanup"
echo "  feat/recruiter-surfaces   → after api-auth-hardening"
echo "  feat/resume-editor-v2     → after security-xss"
echo "  feat/interview-ws         → after baseline-cleanup"
echo "  feat/admin-panel          → after api-auth-hardening"
echo "  feat/browser-extension    → after security-xss"
echo ""
echo "  Merge order (dependency DAG):"
echo "    1. chore/baseline-cleanup"
echo "    2. fix/security-xss  (parallel with #3)"
echo "    3. fix/api-auth-hardening"
echo "    4. feat/browser-extension  (after #2)"
echo "    5. feat/interview-ws       (after #1)"
echo "    6. feat/resume-editor-v2  (after #2)"
echo "    7. feat/recruiter-surfaces (after #3)"
echo "    8. feat/admin-panel        (after #3)"
echo ""
echo "  Push all branches:"
echo "    git push origin chore/baseline-cleanup fix/security-xss \\"
echo "      fix/api-auth-hardening feat/recruiter-surfaces \\"
echo "      feat/resume-editor-v2 feat/interview-ws \\"
echo "      feat/admin-panel feat/browser-extension"
