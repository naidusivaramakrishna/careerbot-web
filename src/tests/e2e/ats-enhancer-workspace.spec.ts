import { expect, test } from "@playwright/test";

const enhancedData = {
  personalInfo: { fullname: "Avery Candidate", email: "avery@example.com", location: "Bengaluru" },
  professionalSummary: { summary: "Frontend engineer", targetRole: "Frontend Engineer" },
  education: [{ id: "edu-1", school: "State University", degree: "B.Tech", startDate: "Aug 2021", endDate: "", scoreType: "Percentage", scoreValue: "86" }],
  projects: [], internships: [], workExperience: [], certifications: [], skills: [],
};

const atsScore = {
  final_score: 60,
  section_breakdown: {
    Education: {
      percentage: 40,
      weight: 10,
      deductions: [{ id: "education_issue_0", penalty: 4, after_example: "Education entry 1: Year of completion is missing." }],
    },
  },
};

const enhancedResponse = {
  success: true,
  enhanced_resume_id: "enhanced-e2e-1",
  revision: 1,
  enhanced_data: enhancedData,
  ats_score: atsScore,
  suggestions: [{
    id: "education_issue_0", section: "Education", fix_type: "manual",
    message: "Education entry 1: Year of completion is missing.",
  }],
  applied_fixes: [],
};

test.describe("ATS scan report", () => {
  test.beforeEach(async ({ page }) => {
    // The report is an authenticated workspace. Keep this browser test fully
    // local by stubbing the session probe as well as the enhancer endpoint;
    // otherwise the app redirects to the public landing page before its
    // report assertions execute.
    // Route protection happens in Next middleware, before browser request
    // interception or localStorage is available. Any non-empty user token is
    // enough for this local user-route test; backend calls remain stubbed.
    await page.context().addCookies([{
      name: "access_token",
      value: "e2e-session",
      domain: "localhost",
      path: "/",
    }]);

    const authenticatedProfile = {
      id: "e2e-user",
      email: "avery@example.com",
      full_name: "Avery Candidate",
    };
    await page.route("**/auth/profile**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(authenticatedProfile),
      });
    });
    // The shared app header probes this separate profile endpoint on mount.
    // Both probes must succeed or its auth interceptor navigates away during
    // page.goto(), aborting the report navigation before assertions run.
    await page.route("**/profile/", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(authenticatedProfile),
      });
    });

    await page.addInitScript((analysis) => {
      localStorage.setItem("atsAnalysisData", JSON.stringify(analysis));
      localStorage.setItem("current_resume_id", "enhanced-e2e-1");
      localStorage.setItem("enhanced_resume_ids", JSON.stringify(["enhanced-e2e-1"]));
      localStorage.setItem("tenant_id", "e2e-tenant");
    }, {
      resume_id: "source-e2e-1",
      enhanced_resume_id: "enhanced-e2e-1",
      enhanced_resume: enhancedData,
      ats_score: atsScore,
      ats_display: {
        score: 60,
        sections: [{
          name: "Education", score_pct: 40, weighted_pts: 4, max_pts: 10, is_not_applicable: false,
          fixes: [{
            id: "education_issue_0", fix_type: "manual", impact: "low", rank: 1, penalty_pts: 4,
            reason: "Education entry 1: Year of completion is missing.",
          }],
        }],
      },
    });

    await page.route("**/api/v1/resume/enhance/enhanced-e2e-1**", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(enhancedResponse) });
        return;
      }
      await route.continue();
    });
  });

  test("shows the score and the suggestions as a report, with no resume preview", async ({ page }) => {
    await page.goto("/atslogin/report?resume_id=source-e2e-1");

    // The first route visit may compile the client report chunk in dev mode.
    // Wait for the actual report boundary, rather than treating compilation
    // time as an ATS rendering failure.
    await expect(page.getByRole("heading", { name: "ATS Scan Report" })).toBeVisible({ timeout: 120_000 });
    await expect(page.getByTestId("ats-score")).toHaveText("60");
    // Suggestions are in impact tabs; High opens by itself and this scan's only suggestion is Low impact.
    await expect(page.getByText("Complete your education details")).toBeHidden();
    await page.getByRole("button", { name: /Low impact/ }).click();
    await expect(page.getByText("Complete your education details")).toBeVisible();
    await expect(page.getByText("Education entry 1: Year of completion is missing.")).toBeVisible();
    await expect(page.getByTestId("preview-panel")).toHaveCount(0);
  });

  test("Fix opens the enhancer on that section", async ({ page }) => {
    await page.goto("/atslogin/report?resume_id=source-e2e-1");

    // Fixes operate at a resume section, not on individual suggestion cards. The section is in the Low impact tab.
    await expect(page.getByRole("heading", { name: "ATS Scan Report" })).toBeVisible({ timeout: 120_000 });
    await page.getByRole("button", { name: /Low impact/ }).click();
    const fix = page.getByRole("button", { name: "Fix this section: Education" });
    await expect(fix).toBeEnabled();
    await fix.click();

    // In `next dev` the first client-side visit to a route compiles it (about 30 s for the builder), so wait longer than usual.
    await expect(page).toHaveURL(/\/builder\/creation\/enhanced-e2e-1\?.*open_section=Education/, { timeout: 120_000 });
  });

  test("offers an explicit path to scan a different resume", async ({ page }) => {
    await page.goto("/atslogin/report?resume_id=source-e2e-1");
    // The shared dashboard shell continuously reflows in `next dev`, which
    // prevents Playwright's normal stability check despite this visible,
    // enabled button being the active target. Force only the dispatch; the
    // assertion still verifies the user-visible route change.
    await page.getByRole("button", { name: /scan another resume/i }).click({ force: true });
    // The first client-side visit to /atslogin compiles it in `next dev` (about 30 s).
    await expect(page).toHaveURL(/\/atslogin$/, { timeout: 120_000 });
  });
});
