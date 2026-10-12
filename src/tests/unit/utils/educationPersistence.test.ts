import { describe, expect, it } from "vitest";
import {
  mergeEducationDegree,
  normalizeEducationForBuilder,
  prepareEducationForPersistence,
} from "@/utils/educationPersistence";
import { mapParserOutputToBuilderData } from "@/utils/resumeMappers";

describe("Education autosave persistence", () => {
  it("does not compound degree, field of study, or score aliases across reloads", () => {
    // One key per field. mapParserOutputToBuilderData prefers the parser
    // aliases (institution / start_date / end_date) over the builder's own
    // school / startDate / endDate, which is pre-existing behaviour and NOT
    // what this test is about -- supplying both would make it assert that
    // precedence instead of the alias compounding it is named for.
    const imported = {
      id: "edu-1",
      school: "Example University",
      degree: "B.Tech",
      field_of_study: "Computer Science",
      cgpa: "8.5",
      startDate: "Aug 2018",
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

  it("normalizes raw builder aliases before they enter editor state", () => {
    const rawBuilderEntry = {
      id: "edu-1",
      degree: "B.Tech",
      field_of_study: "CSE",
      cgpa: 8.6,
    };

    const [loaded] = normalizeEducationForBuilder([rawBuilderEntry]);

    expect(loaded).toMatchObject({
      degree: "B.Tech CSE",
      scoreType: "CGPA",
      scoreValue: "8.6",
      field_of_study: "",
      cgpa: "",
    });
    expect(prepareEducationForPersistence([loaded])[0]).toEqual(loaded);
    expect(rawBuilderEntry).toEqual({
      id: "edu-1",
      degree: "B.Tech",
      field_of_study: "CSE",
      cgpa: 8.6,
    });
  });

  it("does not restore aliases after a user clears canonical degree and score", () => {
    const editedImportedEntry = {
      id: "edu-1",
      degree: "B.Tech",
      field_of_study: "CSE",
      scoreType: "CGPA",
      scoreValue: "",
      cgpa: 8.6,
    };

    const [prepared] = prepareEducationForPersistence([editedImportedEntry]);

    expect(prepared).toMatchObject({
      degree: "B.Tech",
      scoreType: "CGPA",
      scoreValue: "",
      field_of_study: "",
      cgpa: "",
    });
  });

  it("only falls back to aliases when a canonical field is undefined", () => {
    const [prepared] = prepareEducationForPersistence([{
      id: "edu-1",
      degree: undefined,
      field_of_study: "CSE",
      scoreValue: undefined,
      cgpa: 8.6,
    }]);

    expect(prepared).toMatchObject({
      degree: "CSE",
      scoreType: "CGPA",
      scoreValue: "8.6",
    });
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

  /**
   * #166 (follow-up to #144), P2: the alias projection also inferred a Score
   * Type from the user's OWN scoreValue, so "8.5" with Score Type left blank
   * was saved as CGPA ("85" as Percentage) while the editor showed no type.
   */
  it("does not infer a Score Type from the user's own scoreValue (persistence)", () => {
    for (const scoreValue of ["8.5", "85", "3.8"]) {
      const [prepared] = prepareEducationForPersistence([{ id: "edu-1", degree: "MBA", scoreValue, scoreType: undefined }]);
      expect(prepared.scoreType).toBeUndefined();
      expect(prepared.scoreValue).toBe(scoreValue);
    }
  });

  it("does not infer a Score Type from a stored scoreValue on builder load either", () => {
    const [loaded] = normalizeEducationForBuilder([{ id: "edu-1", degree: "MBA", scoreValue: "8.5" }]);
    expect(loaded.scoreType).toBeUndefined();
    expect(loaded.scoreValue).toBe("8.5");
    expect(prepareEducationForPersistence([loaded])[0].scoreType).toBeUndefined();
  });

  it("control: an alias-only score still gets its type inferred (persistence and load)", () => {
    expect(prepareEducationForPersistence([{ id: "edu-1", scoreValue: undefined, percentage: "85%" }])[0])
      .toMatchObject({ scoreType: "Percentage", scoreValue: "85" });
    expect(prepareEducationForPersistence([{ id: "edu-1", scoreValue: undefined, grade: "8.5" }])[0])
      .toMatchObject({ scoreType: "CGPA", scoreValue: "8.5" });
    expect(normalizeEducationForBuilder([{ id: "edu-1", gpa: "3.8" }])[0])
      .toMatchObject({ scoreType: "GPA", scoreValue: "3.8" });
  });

  it("opposite state: an explicit type alias still applies to the user's scoreValue", () => {
    expect(prepareEducationForPersistence([{ id: "edu-1", scoreValue: "85", score_type: "percentage" }])[0])
      .toMatchObject({ scoreType: "Percentage", scoreValue: "85" });
  });
});
