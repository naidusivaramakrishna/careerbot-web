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
});