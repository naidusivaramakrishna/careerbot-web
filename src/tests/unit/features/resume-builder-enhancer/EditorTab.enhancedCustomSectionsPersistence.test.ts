import { beforeEach, describe, expect, it, vi } from "vitest";

const autoSaveEnhancedResume = vi.hoisted(() => vi.fn());
const updateEnhancedResume = vi.hoisted(() => vi.fn());

vi.mock("@/api/enhancerApi", () => ({
  autoSaveEnhancedResume,
  updateEnhancedResume,
}));

import { persistEnhancedCustomSections } from "@/app/(resume)/builder/creation/_components/editor/EditorTab";

describe("enhanced custom-section persistence", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("uses full replacement through create, create, and delete so ids and removals survive", async () => {
    // Client-side ids use the production shape (`custom_<uuid>`, see EditorTab
    // and resumeMappers); transformCustomSectionsForBackend strips exactly that
    // prefix, so a not-yet-saved section is sent without an id.
    const firstClientSection = { id: "custom_first", sectionName: "First", fields: [] };
    const firstServerSection = { id: "server-first", sectionName: "First", fields: [] };
    const secondClientSection = { id: "custom_second", sectionName: "Second", fields: [] };
    const secondServerSection = { id: "server-second", sectionName: "Second", fields: [] };

    updateEnhancedResume
      .mockResolvedValueOnce({ enhanced_data: { customSections: [firstServerSection] } })
      .mockResolvedValueOnce({ enhanced_data: { customSections: [firstServerSection, secondServerSection] } })
      .mockResolvedValueOnce({ enhanced_data: { customSections: [secondServerSection] } });

    await expect(persistEnhancedCustomSections("enhanced-1", [firstClientSection]))
      .resolves.toEqual([firstServerSection]);
    await expect(persistEnhancedCustomSections("enhanced-1", [firstServerSection, secondClientSection]))
      .resolves.toEqual([firstServerSection, secondServerSection]);
    await expect(persistEnhancedCustomSections("enhanced-1", [secondServerSection]))
      .resolves.toEqual([secondServerSection]);

    expect(updateEnhancedResume).toHaveBeenNthCalledWith(1, "enhanced-1", {
      enhanced_sections: {
        customSections: [{ sectionName: "First", icon: "custom", items: [], fields: [] }],
      },
    });
    expect(updateEnhancedResume).toHaveBeenNthCalledWith(2, "enhanced-1", {
      enhanced_sections: {
        customSections: [
          { ...firstServerSection, icon: "custom", items: [] },
          { sectionName: "Second", icon: "custom", items: [], fields: [] },
        ],
      },
    });
    expect(updateEnhancedResume).toHaveBeenNthCalledWith(3, "enhanced-1", {
      enhanced_sections: {
        customSections: [{ ...secondServerSection, icon: "custom", items: [] }],
      },
    });
    expect(autoSaveEnhancedResume).not.toHaveBeenCalled();
  });

  // PR #148: deleting the synthesized Core Competencies section records
  // coreCompetenciesDismissed, which the backend flattens into enhanced_data
  // and resumeMappers reads so the section is not synthesized again on reload.
  it("sends coreCompetenciesDismissed with the full-replace snapshot when given", async () => {
    updateEnhancedResume.mockResolvedValueOnce({ enhanced_data: { customSections: [] } });

    await persistEnhancedCustomSections("enhanced-1", [], true);

    expect(updateEnhancedResume).toHaveBeenCalledWith("enhanced-1", {
      enhanced_sections: { customSections: [], coreCompetenciesDismissed: true },
    });
  });

  it("preserves the source tag that marks the synthesized section", async () => {
    updateEnhancedResume.mockResolvedValueOnce({ enhanced_data: { customSections: [] } });
    const section = {
      id: "server-cc",
      sectionName: "Core Competencies",
      fields: [],
      source: "core_competencies" as const,
    };

    await persistEnhancedCustomSections("enhanced-1", [section], false);

    expect(updateEnhancedResume).toHaveBeenCalledWith("enhanced-1", {
      enhanced_sections: {
        customSections: [{ ...section, icon: "custom", items: [] }],
        coreCompetenciesDismissed: false,
      },
    });
  });
});

describe("enhanced custom-section persistence reads the response like explicit Save (#166 P3)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("reads the nested enhanced_resume.enhanced_data shape that readSyncedCustomSections accepts", async () => {
    const server = [{ id: "server-1", sectionName: "Volunteer", fields: [] }];
    updateEnhancedResume.mockResolvedValueOnce({ enhanced_resume: { enhanced_data: { customSections: server } } });
    await expect(persistEnhancedCustomSections("enhanced-1", [{ id: "custom_x", sectionName: "Volunteer", fields: [] }]))
      .resolves.toEqual(server);
  });

  it("control: the top-level enhanced_data.custom_sections shape is still read", async () => {
    const server = [{ id: "server-2", sectionName: "Awards", fields: [] }];
    updateEnhancedResume.mockResolvedValueOnce({ enhanced_data: { custom_sections: server } });
    await expect(persistEnhancedCustomSections("enhanced-1", [{ id: "custom_y", sectionName: "Awards", fields: [] }]))
      .resolves.toEqual(server);
  });

  it("still reads the nested shape when #148's coreCompetenciesDismissed flag is passed", async () => {
    const server = [{ id: "server-3", sectionName: "Volunteer", fields: [] }];
    updateEnhancedResume.mockResolvedValueOnce({ enhanced_resume: { enhanced_data: { customSections: server } } });
    await expect(persistEnhancedCustomSections("enhanced-1", [], true)).resolves.toEqual(server);
    expect(updateEnhancedResume).toHaveBeenCalledWith("enhanced-1", {
      enhanced_sections: { customSections: [], coreCompetenciesDismissed: true },
    });
  });
});
