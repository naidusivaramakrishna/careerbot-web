/**
 * Regression test for #83 review P1-2: the delete-vs-in-flight-autosave guard
 * only covered Certifications.
 *
 * If a section's debounced autosave PATCH is already in flight when the user
 * deletes an item, the PATCH (a pre-delete snapshot) can reach the backend
 * after the DELETE and bring the item back. Every item-delete handler must
 * therefore dispatch "resume-item-deleted" for its OWN section name (the
 * name EditorTab compares against openModalSection) and await the in-flight
 * autosave EditorTab hands back before calling the delete API.
 *
 * The listener here is EditorTab's real one (handleStaleSectionAutosaveEvent),
 * configured as if the section's modal is open with an autosave in flight.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type React from "react";
import { render, fireEvent, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useResume } from "@/app/(resume)/builder/creation/_context/ResumeContext";
import { useValidation } from "@/app/(resume)/builder/creation/_hooks/useValidation";
import { deleteResumeSectionItem } from "@/api/resumeApi";
import { handleStaleSectionAutosaveEvent } from "@/app/(resume)/builder/creation/_components/editor/EditorTab";
import Achievements from "@/app/(resume)/builder/creation/_components/editor/sections/Achievements";
import Awards from "@/app/(resume)/builder/creation/_components/editor/sections/Awards";
import BarAdmissionsAndLicenses from "@/app/(resume)/builder/creation/_components/editor/sections/BarAdmissionsAndLicenses";
import CertificatesAndClearances from "@/app/(resume)/builder/creation/_components/editor/sections/CertificatesAndClearances";
import Certifications from "@/app/(resume)/builder/creation/_components/editor/sections/Certifications";
import ConferencePresentations from "@/app/(resume)/builder/creation/_components/editor/sections/ConferencePresentations";
import EditorialActivities from "@/app/(resume)/builder/creation/_components/editor/sections/EditorialActivities";
import Education from "@/app/(resume)/builder/creation/_components/editor/sections/Education";
import Hobbies from "@/app/(resume)/builder/creation/_components/editor/sections/Hobbies";
import Interests from "@/app/(resume)/builder/creation/_components/editor/sections/Interests";
import Internships from "@/app/(resume)/builder/creation/_components/editor/sections/Internships";
import Languages from "@/app/(resume)/builder/creation/_components/editor/sections/Languages";
import Licenses from "@/app/(resume)/builder/creation/_components/editor/sections/Licenses";
import MaritimeCertifications from "@/app/(resume)/builder/creation/_components/editor/sections/MaritimeCertifications";
import Patents from "@/app/(resume)/builder/creation/_components/editor/sections/Patents";
import PortsExperience from "@/app/(resume)/builder/creation/_components/editor/sections/PortsExperience";
import Projects from "@/app/(resume)/builder/creation/_components/editor/sections/Projects";
import Publications from "@/app/(resume)/builder/creation/_components/editor/sections/Publications";
import References from "@/app/(resume)/builder/creation/_components/editor/sections/References";
import ResearchGrants from "@/app/(resume)/builder/creation/_components/editor/sections/ResearchGrants";
import SeaServiceRecord from "@/app/(resume)/builder/creation/_components/editor/sections/SeaServiceRecord";
import ServiceRecord from "@/app/(resume)/builder/creation/_components/editor/sections/ServiceRecord";
import VesselsOperated from "@/app/(resume)/builder/creation/_components/editor/sections/VesselsOperated";
import Volunteering from "@/app/(resume)/builder/creation/_components/editor/sections/Volunteering";
import WorkExperience from "@/app/(resume)/builder/creation/_components/editor/sections/WorkExperience";

vi.mock("@/app/(resume)/builder/creation/_context/ResumeContext", () => ({
  useResume: vi.fn(),
}));
vi.mock("@/app/(resume)/builder/creation/_hooks/useValidation", () => ({
  useValidation: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => null }),
}));
vi.mock("@/api/resumeApi", () => ({
  deleteResumeSectionItem: vi.fn(),
}));
vi.mock("@/api/enhancerApi", () => ({
  deleteSectionItemFromEnhancedResume: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

type SectionComponent = React.FC<Record<string, unknown>>;

// [builder section name (EditorTab's openModalSection), component,
//  resumeData key, delete-API section key]
const SECTIONS: Array<[string, SectionComponent, string, string]> = [
  ["Achievements", Achievements as SectionComponent, "achievements", "achievements"],
  ["Awards", Awards as SectionComponent, "awards", "awards"],
  ["Bar Admissions and Licenses", BarAdmissionsAndLicenses as SectionComponent, "barAdmissionsAndLicenses", "bar_admissions_and_licenses"],
  ["Certificates and Clearances", CertificatesAndClearances as SectionComponent, "certificatesAndClearances", "certificates_and_clearances"],
  ["Certifications", Certifications as SectionComponent, "certifications", "certifications"],
  ["Conference Presentations", ConferencePresentations as SectionComponent, "conferencePresentations", "conference_presentations"],
  ["Editorial Activities", EditorialActivities as SectionComponent, "editorialActivities", "editorial_activities"],
  ["Education", Education as SectionComponent, "education", "education"],
  ["Hobbies", Hobbies as SectionComponent, "hobbies", "hobbies"],
  ["Interests", Interests as SectionComponent, "interests", "interests"],
  ["Internships", Internships as SectionComponent, "internships", "internships"],
  ["Languages", Languages as SectionComponent, "languages", "languages"],
  ["Licenses and Credentials", Licenses as SectionComponent, "licenses", "licenses"],
  ["Maritime Certifications", MaritimeCertifications as SectionComponent, "maritimeCertifications", "maritime_certifications"],
  ["Patents", Patents as SectionComponent, "patents", "patents"],
  ["Ports Experience", PortsExperience as SectionComponent, "portsExperience", "ports_experience"],
  ["Projects", Projects as SectionComponent, "projects", "projects"],
  ["Publications", Publications as SectionComponent, "publications", "publications"],
  ["References", References as SectionComponent, "references", "references"],
  ["Research Grants", ResearchGrants as SectionComponent, "researchGrants", "research_grants"],
  ["Sea Service Record", SeaServiceRecord as SectionComponent, "seaServiceRecord", "sea_service_record"],
  ["Service Record", ServiceRecord as SectionComponent, "serviceRecord", "service_record"],
  ["Vessels Operated", VesselsOperated as SectionComponent, "vesselsOperated", "vessels_operated"],
  ["Volunteering", Volunteering as SectionComponent, "volunteering", "volunteering"],
  ["Work Experience", WorkExperience as SectionComponent, "workExperience", "work_experience"],
];

// One saved item with the fields the sections render; unknown keys are ignored.
const savedItem = {
  id: "item-1",
  name: "Item", title: "Item", school: "State University", degree: "BS",
  company: "Acme", role: "Engineer", position: "Engineer", organization: "Acme",
  issuedBy: "Issuer", year: "2024", proficiency: "Fluent", language: "French",
  description: "Did things", startDate: "Jan 20", endDate: "Jan 21", technologies: [],
  publicationName: "Journal", certificateType: "STCW", issuingAuthority: "DG Shipping",
  portName: "Mumbai", grantTitle: "Grant", fundingAgency: "NSF", currentRank: "Master",
  vesselType: "Tanker", activityType: "Reviewer", organizationJournal: "Journal", service: "IAS",
};

const mockedUseResume = vi.mocked(useResume);
const mockedUseValidation = vi.mocked(useValidation);
const mockedDelete = vi.mocked(deleteResumeSectionItem);

function getDeleteButton(container: HTMLElement): HTMLButtonElement {
  const match = Array.from(container.querySelectorAll("button"))
    .find((btn) => btn.querySelector("svg.lucide-trash-2"));
  if (!match) throw new Error("Delete button (Trash2 icon) not found");
  return match;
}

describe.each(SECTIONS)("%s delete — waits for an in-flight autosave before DELETE (P1-2)", (sectionName, Component, dataKey, apiKey) => {
  let resolveAutosave: () => void = () => {};
  let listener: (event: Event) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("current_resume_id", "resume-123");
    mockedUseResume.mockReturnValue({
      resumeData: { [dataKey]: [{ ...savedItem }] },
      setResumeData: vi.fn(),
      resumeSource: "builder",
    } as never);
    mockedUseValidation.mockReturnValue({
      errors: {},
      validateRequired: vi.fn(() => true),
      clearError: vi.fn(),
      clearErrors: vi.fn(),
      clearSectionIndexErrors: vi.fn(),
      reindexErrors: vi.fn(),
      setFieldError: vi.fn(),
    } as never);
    mockedDelete.mockResolvedValue(undefined as never);

    // EditorTab's real listener, with this section's modal open and an
    // autosave PATCH still awaiting its response.
    const inFlight = new Promise<void>((resolve) => { resolveAutosave = resolve; });
    const ctx = {
      openModalSection: sectionName,
      skipNextAutoSaveForSectionRef: { current: null as string | null },
      autoSaveTimerRef: { current: null as NodeJS.Timeout | null },
      autoSaveInFlightRef: { current: inFlight as Promise<void> | null },
    };
    listener = (event: Event) => handleStaleSectionAutosaveEvent(event, ctx);
    window.addEventListener("resume-item-deleted", listener);
  });

  afterEach(() => {
    window.removeEventListener("resume-item-deleted", listener);
    cleanup();
  });

  it("does not call the delete API until the in-flight autosave settles", async () => {
    const { container } = render(<Component formData={{}} errors={{}} onChange={vi.fn()} onBlur={vi.fn()} />);
    fireEvent.click(getDeleteButton(container));

    for (let i = 0; i < 5; i += 1) await Promise.resolve();
    expect(mockedDelete).not.toHaveBeenCalled();

    resolveAutosave();
    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith("resume-123", apiKey, "item-1"));
  });
});
