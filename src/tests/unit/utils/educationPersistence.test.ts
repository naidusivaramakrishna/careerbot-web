import { describe, expect, it } from "vitest";
import {
  mergeEducationDegree,
  prepareEducationForPersistence,
} from "@/utils/educationPersistence";
import { mapParserOutputToBuilderData } from "@/utils/resumeMappers";

describe("Education autosave persistence", () => {
  it("does not compound degree, field of study, or score aliases across reloads", () => {
    const imported = {
      id: "edu-1",
      school: "Example University",
      institution: "Stale Parser University",
      degree: "B.Tech",
      field_of_study: "Computer Science",
      cgpa: "8.5",
      start_date: "Aug 2017",
      startDate: "Aug 2018",
      end_date: "May 2021",
      endDate: "May 2022",
    };

    const firstLoad = mapParserOutputToBuilderData({ education: [imported] }).education![0];
    expect(firstLoad).toMatchObject({
      school: "Example University",
      degree: "B.Tech Computer Science",
      startDate: "Aug 2018",
      endDate: "May 2022",
      scoreType: "CGPA",
      scoreValue: "8.5",
    });

    const firstAutosave = prepareEducationForPersistence([firstLoad])[0];
    expect(firstAutosave).toMatchObject({
      degree: "B.Tech Computer Science",
      scoreType: "CGPA",
      scoreValue: "8.5",
      field_of_study: "",
      cgpa: "",
    });

    // Simulate the API's id-based item merge, then a second load/autosave.
    const persisted = { ...imported, ...firstAutosave };
    const secondLoad = mapParserOutputToBuilderData({ education: [persisted] }).education![0];
    const secondAutosave = prepareEducationForPersistence([secondLoad])[0];

    expect(secondLoad).toEqual(firstLoad);
    expect(secondAutosave).toEqual(firstAutosave);
  });

  it("repairs an already-compounded field-of-study suffix", () => {
    expect(
      mergeEducationDegree(
        "B.Tech Computer Science Computer Science Computer Science",
        "Computer Science",
      ),
    ).toBe("B.Tech Computer Science");
  });

  it("does not mutate the editor's Education state while preparing a payload", () => {
    const entry = { id: "edu-1", degree: "MBA", scoreValue: "82" };
    const [prepared] = prepareEducationForPersistence([entry]);

    expect(entry).toEqual({ id: "edu-1", degree: "MBA", scoreValue: "82" });
    expect(prepared).not.toBe(entry);
  });

  it("clears parser grade-percentage aliases on autosave and explicit save", () => {
    const imported = {
      id: "edu-1",
      school: "Chalapathi Institute of Technology",
      degree: "Bachelor of Technology",
      scoreType: "Marks",
      scoreValue: "98.4/100",
      grade_percentage: "98.4",
      gradePercentage: "98.4",
      grade: "7.8",
      grade_type: "CGPA",
    };

    const autosave = prepareEducationForPersistence([imported])[0];
    const explicitSave = prepareEducationForPersistence([autosave])[0];

    expect(explicitSave).toMatchObject({
      scoreType: "Marks",
      scoreValue: "98.4/100",
      grade_percentage: "",
      gradePercentage: "",
      grade: "",
      grade_type: "",
    });
    expect(prepareEducationForPersistence([explicitSave])[0]).toEqual(explicitSave);
  });
});

