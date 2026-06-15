export default function PRSummary() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-mono">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Header */}
        <div className="border border-indigo-500 rounded-xl p-6 bg-indigo-950/30">
          <h1 className="text-2xl font-bold text-indigo-300 tracking-widest uppercase mb-4">
            What I Built &amp; Changed — PR Summary
          </h1>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-400">Developer</span>
            <span className="text-white font-semibold">Sivaprasad</span>
            <span className="text-gray-400">Branch</span>
            <span className="text-indigo-300">feature/all-updated-features</span>
            <span className="text-gray-400">Period</span>
            <span className="text-white">June 8 – June 11, 2026</span>
          </div>
        </div>

        {/* Section: Newly Created */}
        <Section title="Newly Created Components & Files">

          {/* Job Match */}
          <Feature
            number={1}
            title="Job Match — Analysis Panel"
            route="/jobmatch"
          >
            <ComponentRow
              name="ScoreBreakdown"
              path="analysis/ScoreBreakdown.tsx"
              description="Visual ATS score breakdown with weighted section scores, progress bars, and colour-coded indicators per category. Shows overall score summary and per-section contribution."
            />
            <ComponentRow
              name="MatchPenalties"
              path="analysis/MatchPenalties.tsx"
              description="Displays penalty reasons actively hurting the match score. Grouped by severity with expandable detail rows."
            />
            <ComponentRow
              name="AnalysisContent"
              path="analysis/AnalysisContent.tsx"
              description="Updated container integrating ScoreBreakdown and MatchPenalties side-by-side. Replaced the previous flat score display."
            />
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
              <span><span className="text-gray-500">Hooks:</span> useJobMatch (existing)</span>
              <span><span className="text-gray-500">Utils:</span> normalizeMatchScore (existing)</span>
            </div>
          </Feature>

          {/* ATS */}
          <Feature
            number={2}
            title="ATS — Code Quality Refactor"
            route="/ats  /atslogin  /atslogin/report"
          >
            <ComponentRow
              name="helpers.ts"
              path="src/app/(resume)/ats/utils/helpers.ts — UPDATED"
              description="Added shared utilities used by both ATS flows."
            />
            <div className="ml-4 mt-2 space-y-1 text-xs text-gray-400">
              <p><span className="text-indigo-300">ATS_UPLOAD_KEYS</span> — all localStorage keys in one place</p>
              <p><span className="text-indigo-300">clearAtsUploadStorage()</span> — clears all ATS localStorage entries</p>
              <p><span className="text-indigo-300">validateResumeFile()</span> — validates extension + optional size check</p>
              <p><span className="text-indigo-300">extractErrorMessage()</span> — normalises unknown errors to readable strings</p>
            </div>
            <ComponentRow
              name="ATSLoginPage.tsx"
              path="— UPDATED"
              description="Replaced 28-line inline error modal with <ErrorModal>. validateAndSetFile calls shared validateResumeFile(). FilePreview uses shared formatFileSize(). catch block uses extractErrorMessage()."
            />
            <ComponentRow
              name="ResumeUpload.tsx"
              path="— UPDATED"
              description="Removed local ATS_UPLOAD_KEYS and clearAtsUploadStorage(). onFileChange uses shared validateResumeFile(). viewReport() calls buildAtsReportRoute()."
            />
            <div className="mt-3">
              <p className="text-xs text-red-400 font-semibold mb-1">Deleted (dead code)</p>
              <div className="ml-4 space-y-1 text-xs text-gray-400">
                <p><span className="line-through text-gray-500">LoadingModal.tsx</span> — never imported anywhere</p>
                <p><span className="line-through text-gray-500">src/app/api/backend/score/route.ts</span> — stub never called, returned zeros</p>
              </div>
            </div>
          </Feature>
        </Section>

        {/* Section: Changed Files */}
        <Section title="Changed / Updated Files">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <ChangeGroup title="Job Match">
              <ChangeItem file="Overview.tsx" note="Wired ScoreBreakdown and MatchPenalties. Replaced flat score numbers with visual breakdown." />
              <ChangeItem file="JobMatchSectionEditor.tsx" note="Updated section editor inside the job match resume editing flow." />
              <ChangeItem file="JobMatchTemplateThree.tsx" note="Minor template rendering fix." />
            </ChangeGroup>

            <ChangeGroup title="Jobs Listing">
              <ChangeItem file="JobsContents.tsx" note="Layout and filter improvements." />
              <ChangeItem file="JobCard.tsx" note="Minor styling fix." />
              <ChangeItem file="JobsRightSidebar.tsx" note="Improved section layout." />
            </ChangeGroup>

            <ChangeGroup title="ATS API Layer">
              <ChangeItem
                file="parserApi.ts"
                note="Extracted patchResumeSkills, patchMatcherSkill helpers. Added MATCHER_SKILL_ERRORS constant. Extracted handleDuplicateJd — removed triplicated catch block."
              />
              <ChangeItem
                file="resumeatsapi.ts"
                note="Removed unused deleteResume (DELETE /resumes/{id}, never imported)."
              />
            </ChangeGroup>

          </div>
        </Section>

        {/* Section: Tests */}
        <Section title="Test Files Created">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-3">Unit Tests</p>
              <div className="space-y-3">
                <TestFile
                  file="features/ats/ATSHomePage.test.tsx"
                  lines={268}
                  assertions={[
                    "File upload drag-and-drop",
                    "File type validation",
                    "Error state rendering",
                    "localStorage read/write",
                  ]}
                />
                <TestFile
                  file="features/ats/ATSLoginPage.test.tsx"
                  lines={375}
                  assertions={[
                    "Guest upload flow",
                    "File validation (PDF/DOCX/DOC/size)",
                    "ErrorModal retry behaviour",
                    "processResumeComplete success + failure",
                    "Route redirect after scan",
                  ]}
                />
                <TestFile
                  file="features/jobs/JobCard.test.tsx"
                  lines={334}
                  assertions={[
                    "Card render with full/partial data",
                    "Apply button, save/unsave toggle",
                    "Salary display formatting",
                  ]}
                />
                <TestFile
                  file="features/jobs/JobsContents.test.tsx"
                  lines={434}
                  assertions={[
                    "Job list render, search filter",
                    "Pagination, empty state",
                    "Sidebar filter interaction",
                  ]}
                />
              </div>
            </div>

            <div>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-3">Integration Tests</p>
              <div className="space-y-3">
                <TestFile
                  file="features/ats/ats-flow.integration.test.ts"
                  lines={269}
                  assertions={[
                    "Full parse → enhance → score flow (MSW)",
                    "Cache hit path — skips enhance call",
                    "Credit exhaustion error normalisation",
                    "localStorage persistence after complete flow",
                  ]}
                />
                <TestFile
                  file="features/jobs/jobs-flow.integration.test.ts"
                  lines={436}
                  assertions={[
                    "Job search → filter → apply flow (MSW)",
                    "Pagination across pages",
                    "Error handling on network failure",
                  ]}
                />
                <div className="border border-gray-700 rounded-lg p-3 bg-gray-900">
                  <p className="text-xs text-yellow-400 font-semibold mb-2">Shared MSW Setup</p>
                  <div className="space-y-1 text-xs text-gray-400">
                    <p>shared/api-mocks.ts <span className="text-gray-600">— 162 lines</span></p>
                    <p>shared/msw-handlers.ts <span className="text-gray-600">— 94 lines</span></p>
                    <p>shared/msw-server.ts</p>
                  </div>
                </div>
                <div className="border border-gray-700 rounded-lg p-3 bg-gray-900">
                  <p className="text-xs text-yellow-400 font-semibold mb-2">Vitest Setup</p>
                  <div className="space-y-1 text-xs text-gray-400">
                    <p>vitest.config.ts — jsdom, @/* alias, v8 coverage, PostCSS disabled</p>
                    <p>vitest.setup.ts — clipboard, matchMedia, IntersectionObserver, ResizeObserver mocks</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </Section>

        {/* Summary */}
        <Section title="Summary">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard label="New Components" value="3" color="indigo" />
            <StatCard label="Updated Components" value="8" color="blue" />
            <StatCard label="API Files Refactored" value="2" color="violet" />
            <StatCard label="Shared Utilities Added" value="4" color="cyan" />
            <StatCard label="Dead Files Deleted" value="3" color="red" />
            <StatCard label="Unit Test Files" value="4" color="emerald" />
            <StatCard label="Integration Test Files" value="2" color="green" />
            <StatCard label="Total Assertions" value="350+" color="yellow" />
          </div>
        </Section>

      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="h-px flex-1 bg-gray-700" />
        <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400 whitespace-nowrap">
          {title}
        </h2>
        <div className="h-px flex-1 bg-gray-700" />
      </div>
      {children}
    </div>
  );
}

function Feature({
  number,
  title,
  route,
  children,
}: {
  number: number;
  title: string;
  route: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-700 rounded-xl p-5 bg-gray-900 mb-4">
      <div className="flex items-start gap-3 mb-4">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
          {number}
        </span>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-indigo-400 mt-0.5">{route}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ComponentRow({
  name,
  path,
  description,
}: {
  name: string;
  path: string;
  description: string;
}) {
  return (
    <div className="border border-gray-800 rounded-lg p-3 bg-gray-950">
      <div className="flex flex-wrap items-baseline gap-2 mb-1">
        <span className="text-sm font-semibold text-indigo-300">{name}</span>
        <span className="text-xs text-gray-500">{path}</span>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function ChangeGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ChangeItem({ file, note }: { file: string; note: string }) {
  return (
    <div className="border border-gray-800 rounded-lg p-3 bg-gray-900">
      <p className="text-xs font-semibold text-white mb-1">{file}</p>
      <p className="text-xs text-gray-400 leading-relaxed">{note}</p>
    </div>
  );
}

function TestFile({
  file,
  lines,
  assertions,
}: {
  file: string;
  lines: number;
  assertions: string[];
}) {
  return (
    <div className="border border-gray-700 rounded-lg p-3 bg-gray-900">
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-semibold text-white leading-snug">{file}</p>
        <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">{lines} lines</span>
      </div>
      <ul className="space-y-0.5">
        {assertions.map((a) => (
          <li key={a} className="text-xs text-gray-400 flex items-start gap-1.5">
            <span className="text-emerald-500 mt-0.5">✓</span>
            {a}
          </li>
        ))}
      </ul>
    </div>
  );
}

const colorMap: Record<string, string> = {
  indigo:  "border-indigo-600 bg-indigo-950/40 text-indigo-300",
  blue:    "border-blue-600 bg-blue-950/40 text-blue-300",
  violet:  "border-violet-600 bg-violet-950/40 text-violet-300",
  cyan:    "border-cyan-600 bg-cyan-950/40 text-cyan-300",
  red:     "border-red-600 bg-red-950/40 text-red-300",
  emerald: "border-emerald-600 bg-emerald-950/40 text-emerald-300",
  green:   "border-green-600 bg-green-950/40 text-green-300",
  yellow:  "border-yellow-600 bg-yellow-950/40 text-yellow-300",
};

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`border rounded-xl p-4 text-center ${colorMap[color] ?? colorMap.indigo}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-1 opacity-80">{label}</p>
    </div>
  );
}
