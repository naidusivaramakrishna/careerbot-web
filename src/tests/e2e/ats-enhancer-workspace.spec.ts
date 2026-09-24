import { expect, test } from "@playwright/test";

const canonicalPendingEducation = {
  success: true,
  enhanced_resume_id: "enhanced-e2e-1",
  revision: 1,
  enhanced_data: {
    personalInfo: { fullname: "Avery Candidate", email: "avery@example.com", location: "Bengaluru" },
    professionalSummary: { summary: "Frontend engineer", targetRole: "Frontend Engineer" },
    education: [{ id: "edu-1", school: "State University", degree: "B.Tech", startDate: "Aug 2021", endDate: "", scoreType: "Percentage", scoreValue: "86" }],
    projects: [], internships: [], workExperience: [], certifications: [], skills: [],
  },
  ats_score: {
    final_score: 60,
    section_breakdown: {
      Education: {
        percentage: 40,
        weight: 10,
        deductions: [{ id: "education_issue_0", penalty: 4, after_example: "Education entry 1: Year of completion is missing." }],
      },
    },
  },
  suggestions: [{
    id: "education_issue_0", section: "Education", fix_type: "manual",
    message: "Education entry 1: Year of completion is missing.",
  }],
  applied_fixes: [],
};

test.describe("ATS enhancer workspace", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((analysis) => {
      localStorage.setItem("atsAnalysisData", JSON.stringify(analysis));
      localStorage.setItem("current_resume_id", "enhanced-e2e-1");
      localStorage.setItem("enhanced_resume_ids", JSON.stringify(["enhanced-e2e-1"]));
    }, {
      resume_id: "source-e2e-1",
      enhanced_resume_id: "enhanced-e2e-1",
      enhanced_resume: canonicalPendingEducation.enhanced_data,
      ats_score: canonicalPendingEducation.ats_score,
    });

    await page.route("**/api/v1/resume/enhance/enhanced-e2e-1**", async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(canonicalPendingEducation) });
        return;
      }
      await route.continue();
    });
  });

  test("loads the canonical pending Education issue and uses Save-based fixing", async ({ page }) => {
    await page.goto("/atslogin/report?resume_id=source-e2e-1&source=enhanced");

    await expect(page.getByText("ATS resume editor")).toBeVisible();
    await expect(page.getByText("Improvement score")).toBeVisible();
    await expect(page.getByText("Education entry 1: Year of completion is missing.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit & save" })).toBeVisible();
    await expect(page.getByRole("button", { name: /mark as done/i })).toHaveCount(0);
  });

  test("offers an explicit path to scan a different resume", async ({ page }) => {
    await page.goto("/atslogin/report?resume_id=source-e2e-1&source=enhanced");
    await page.getByRole("button", { name: /scan another resume/i }).click();
    await expect(page).toHaveURL(/\/atslogin$/);
  });
});
