import { describe, expect, it } from "vitest";
import { mapParserOutputToBuilderData } from "@/utils/resumeMappers";

describe("education score mapping", () => {
  it("preserves a user-selected Percentage score type on reload", () => {
    const mapped = mapParserOutputToBuilderData({
      education: [{ id: "edu-1", school: "Example University", scoreType: "Percentage", scoreValue: "85" }],
    });

    expect(mapped.education?.[0]).toMatchObject({
      id: "edu-1",
      scoreType: "Percentage",
      scoreValue: "85",
    });
  });

  it.each([
    ["85%", "Percentage"],
    ["85", "Percentage"],
    ["8.5", "CGPA"],
    ["3.8", "GPA"],
    ["450/500", "Marks"],
    ["8.5/10", "CGPA"],
  ])("infers %s as %s when the type is absent", (grade, expectedType) => {
    const mapped = mapParserOutputToBuilderData({
      education: [{ school: "Example University", grade }],
    });

    expect(mapped.education?.[0].scoreType).toBe(expectedType);
  });

  it("uses an explicit percentage source field before numeric inference", () => {
    const mapped = mapParserOutputToBuilderData({
      education: [{ school: "Example University", percentage: "8" }],
    });

    expect(mapped.education?.[0]).toMatchObject({ scoreType: "Percentage", scoreValue: "8" });
  });

  it.each(["78%", "90", "90%"])(
    "corrects an impossible parser CGPA/value pair for %s",
    (scoreValue) => {
      const mapped = mapParserOutputToBuilderData({
        education: [{ school: "Example University", scoreType: "CGPA", scoreValue }],
      });

      expect(mapped.education?.[0]).toMatchObject({
        scoreType: "Percentage",
        scoreValue: scoreValue.replace("%", ""),
      });
    }
  );

  it("stores an explicit percentage value without a duplicate display suffix", () => {
    const mapped = mapParserOutputToBuilderData({
      education: [{ school: "Example University", scoreType: "Percentage", scoreValue: "90%" }],
    });

    expect(mapped.education?.[0]).toMatchObject({ scoreType: "Percentage", scoreValue: "90" });
  });
});

describe("enhancer latest-edit precedence", () => {
  it("prefers canonical user-edited sections over stale llm_data after reload", () => {
    const mapped = mapParserOutputToBuilderData({
      projects: [{ id: "project-1", title: "Latest project", description: "Latest text" }],
      workExperience: [{ id: "work-1", company: "Latest company", role: "Lead" }],
      education: [{ id: "edu-1", school: "Latest university", degree: "M.Tech" }],
      certifications: [{ id: "cert-1", name: "Latest certificate", issuer: "Issuer" }],
      llm_data: {
        projects: [{ id: "project-1", title: "First ATS fix", description: "Old text" }],
        experience: [{ id: "work-1", company: "Old company", role: "Engineer" }],
        education: [{ id: "edu-1", school: "Old university", degree: "B.Tech" }],
        certifications: [{ id: "cert-1", name: "Old certificate", issuer: "Old issuer" }],
      },
    });

    expect(mapped.projects?.[0].title).toBe("Latest project");
    expect(mapped.workExperience?.[0].company).toBe("Latest company");
    expect(mapped.education?.[0].school).toBe("Latest university");
    expect(mapped.certifications?.[0].name).toBe("Latest certificate");
  });

  it("keeps an explicit empty canonical list instead of reviving stale AI content", () => {
    const mapped = mapParserOutputToBuilderData({
      projects: [],
      llm_data: { projects: [{ title: "Deleted project" }] },
    });

    expect(mapped.projects).toEqual([]);
  });

  it("preserves a legacy _id so editing an existing project cannot append a duplicate", () => {
    const mapped = mapParserOutputToBuilderData({
      projects: [{ _id: "project-legacy-id", title: "Inventory System" }],
    });

    expect(mapped.projects?.[0]).toMatchObject({
      id: "project-legacy-id",
      title: "Inventory System",
    });
  });
});

describe("current-date mapping", () => {
  it("keeps unknown internship and work end dates blank", () => {
    const mapped = mapParserOutputToBuilderData({
      internships: [{ company: "Acme", role: "Intern", start_date: null, end_date: null }],
      experience: [{ company: "Acme", role: "Engineer", start_date: "Jan 2024", end_date: null }],
    });

    expect(mapped.internships?.[0]).toMatchObject({
      startDate: "",
      endDate: "",
      currentlyWorking: false,
    });
    expect(mapped.workExperience?.[0]).toMatchObject({
      startDate: "Jan 2024",
      endDate: "",
      currentlyWorking: false,
    });
  });

  it("shows Present only for an explicit current signal", () => {
    const mapped = mapParserOutputToBuilderData({
      internships: [{ company: "Acme", role: "Intern", end_date: "Present" }],
      experience: [{ company: "Acme", role: "Engineer", currently_working: true, end_date: null }],
    });

    expect(mapped.internships?.[0]).toMatchObject({ endDate: "Present", currentlyWorking: true });
    expect(mapped.workExperience?.[0]).toMatchObject({ endDate: "Present", currentlyWorking: true });
  });
});
describe("persisted custom section mapping", () => {
  it("restores saved list fields instead of falling back to parser metadata", () => {
    const mapped = mapParserOutputToBuilderData({
      customSections: [{
        id: "strengths-id",
        sectionName: "Strengths",
        fields: [{
          id: "strength-list",
          fieldName: "Core strengths",
          fieldType: "list",
          value: ["Java", "Python", "Playwright"],
        }],
      }],
      section_metadata: [{ original_name: "Stale parser section", mapped_to: "stale_parser_section" }],
      stale_parser_section: ["Do not use this"],
    });

    expect(mapped.customSections).toEqual([{
      id: "strengths-id",
      sectionName: "Strengths",
      fields: [{
        id: "strength-list",
        fieldName: "Core strengths",
        fieldType: "list",
        value: ["Java", "Python", "Playwright"],
      }],
    }]);
  });

  it("honors an explicit empty persisted collection instead of reviving stale parser data", () => {
    const mapped = mapParserOutputToBuilderData({
      customSections: [],
      section_metadata: [{ original_name: "Strengths", mapped_to: "strengths" }],
      strengths: ["Java", "Python", "Playwright"],
    });

    expect(mapped.customSections).toEqual([]);
  });
});

describe("core_competencies synthesized custom section", () => {
  // core_competencies is a dedicated top-level field, unlike Strengths-style
  // content which the backend writes into custom_sections and therefore
  // already round-trips through the persisted-sections branch above. Without
  // this synthesis it never appears anywhere once a resume has ANY persisted
  // customSections array, regardless of which template renders it.
  it("synthesizes a Core Competencies custom section from the top-level field", () => {
    const mapped = mapParserOutputToBuilderData({
      core_competencies: ["Stakeholder Management", "Mentoring", "Team Leadership"],
    });

    expect(mapped.customSections).toEqual([{
      id: expect.any(String),
      sectionName: "Core Competencies",
      source: "core_competencies",
      fields: [{
        id: expect.any(String),
        fieldName: "Core Competencies",
        fieldType: "list",
        value: ["Stakeholder Management", "Mentoring", "Team Leadership"],
      }],
    }]);
  });

  it("falls back to llm_data.core_competencies when the top-level field is absent", () => {
    const mapped = mapParserOutputToBuilderData({
      llm_data: { core_competencies: ["Cross-functional Collaboration"] },
    });

    expect(mapped.customSections).toEqual([{
      id: expect.any(String),
      sectionName: "Core Competencies",
      source: "core_competencies",
      fields: [{
        id: expect.any(String),
        fieldName: "Core Competencies",
        fieldType: "list",
        value: ["Cross-functional Collaboration"],
      }],
    }]);
  });

  it("does not resurrect Core Competencies after an explicitly recorded deletion", () => {
    const mapped = mapParserOutputToBuilderData({
      customSections: [],
      coreCompetenciesDismissed: true,
      core_competencies: ["Stakeholder Management"],
    });

    expect(mapped.customSections).toEqual([]);
  });

  it("honours the dismissed flag when other custom sections are saved", () => {
    // customSections: [] alone already suppresses the synthesis, so this is
    // the case where only coreCompetenciesDismissed can.
    const mapped = mapParserOutputToBuilderData({
      customSections: [{
        id: "strengths-id",
        sectionName: "Strengths",
        fields: [{ id: "f1", fieldName: "Strengths", fieldType: "list", value: ["Communication"] }],
      }],
      coreCompetenciesDismissed: true,
      core_competencies: ["Stakeholder Management"],
    });

    expect(mapped.customSections?.map(section => section.sectionName)).toEqual(["Strengths"]);
  });

  it("keeps Core Competencies alongside unrelated persisted custom sections", () => {
    const mapped = mapParserOutputToBuilderData({
      customSections: [{
        id: "strengths-id",
        sectionName: "Strengths",
        fields: [{ id: "f1", fieldName: "Strengths", fieldType: "list", value: ["Communication"] }],
      }],
      core_competencies: ["Stakeholder Management"],
    });

    expect(mapped.customSections).toEqual(expect.arrayContaining([
      expect.objectContaining({ sectionName: "Strengths" }),
      expect.objectContaining({ sectionName: "Core Competencies", source: "core_competencies" }),
    ]));
  });

  it("does not resurrect Core Competencies after the user renames its tagged section", () => {
    const mapped = mapParserOutputToBuilderData({
      customSections: [{
        id: "cc-id",
        sectionName: "Key Competencies",
        fields: [{ id: "f1", fieldName: "Key Competencies", fieldType: "list", value: ["User Edited Value"] }],
        source: "core_competencies",
      }],
      core_competencies: ["Stakeholder Management", "Mentoring"],
    });

    expect(mapped.customSections).toEqual([{
      id: "cc-id",
      sectionName: "Key Competencies",
      source: "core_competencies",
      fields: [{ id: "f1", fieldName: "Key Competencies", fieldType: "list", value: ["User Edited Value"] }],
    }]);
  });

  it("produces no section when core_competencies is absent or empty", () => {
    const mapped = mapParserOutputToBuilderData({ core_competencies: [] });
    expect(mapped.customSections).toEqual([]);
  });

  it("splits a single pipe-separated string into individual points instead of one blob", () => {
    const mapped = mapParserOutputToBuilderData({
      core_competencies: "Stakeholder Management | Mentoring | Team Leadership",
    });

    expect(mapped.customSections?.[0].fields[0].value).toEqual([
      "Stakeholder Management",
      "Mentoring",
      "Team Leadership",
    ]);
  });

  it("splits a single newline-separated string into individual points", () => {
    const mapped = mapParserOutputToBuilderData({
      core_competencies: "Stakeholder Management\nMentoring\nTeam Leadership",
    });

    expect(mapped.customSections?.[0].fields[0].value).toEqual([
      "Stakeholder Management",
      "Mentoring",
      "Team Leadership",
    ]);
  });

  it("splits a wrapped 'Label. Elaboration.' string into one point per label, ignoring mid-sentence word-wrap line breaks", () => {
    // Reproduces a real report: the raw string wraps mid-sentence (e.g. from
    // fixed-width text extraction), so a stray "\n" lands between
    // "enterprise" and "systems." -- naive newline-splitting turned that
    // into a bogus extra bullet ("systems." alone, wrongly read as its own
    // bold label) instead of keeping the point whole.
    const mapped = mapParserOutputToBuilderData({
      core_competencies:
        "Backend Engineering at Scale. Built scalable microservices and REST APIs with Java 17 and Spring Boot for high-volume enterprise\nsystems.\nMicroservices Migration. Led migration of legacy monoliths to microservices, improving scalability, maintainability, and\ndeployment flexibility.",
    });

    expect(mapped.customSections?.[0].fields[0].value).toEqual([
      "Backend Engineering at Scale. Built scalable microservices and REST APIs with Java 17 and Spring Boot for high-volume enterprise systems.",
      "Microservices Migration. Led migration of legacy monoliths to microservices, improving scalability, maintainability, and deployment flexibility.",
    ]);
  });

  it("keeps each array item as its own point when items are short keyword-style phrases with no period", () => {
    const mapped = mapParserOutputToBuilderData({
      core_competencies: ["Stakeholder Management", "Mentoring", "Team Leadership"],
    });

    expect(mapped.customSections?.[0].fields[0].value).toEqual([
      "Stakeholder Management",
      "Mentoring",
      "Team Leadership",
    ]);
  });

  it("re-splits a single array item that concatenates multiple 'Label. Elaboration.' competencies", () => {
    const mapped = mapParserOutputToBuilderData({
      core_competencies: [
        "Backend Engineering at Scale. Built scalable microservices and REST APIs for high-volume systems. Microservices Migration. Led migration of legacy monoliths to a microservices architecture.",
      ],
    });

    expect(mapped.customSections?.[0].fields[0].value).toEqual([
      "Backend Engineering at Scale. Built scalable microservices and REST APIs for high-volume systems.",
      "Microservices Migration. Led migration of legacy monoliths to a microservices architecture.",
    ]);
  });

  it("keeps an elaboration sentence shorter than the label-word limit attached to its label", () => {
    // Word count alone treated "Delivered systems." (2 words) as a new label
    // and emitted it as its own bullet, chopping one competency into two.
    const mapped = mapParserOutputToBuilderData({
      core_competencies:
        "Backend Engineering at Scale. Delivered systems. Event-Driven Messaging. Built Kafka pipelines.",
    });

    expect(mapped.customSections?.[0].fields[0].value).toEqual([
      "Backend Engineering at Scale. Delivered systems.",
      "Event-Driven Messaging. Built Kafka pipelines.",
    ]);
  });

  it("does not treat an abbreviation's period as a sentence boundary", () => {
    // "U.S." was split off as its own point, leaving "Market Expansion. Grew
    // revenue..." as a second bogus point.
    const mapped = mapParserOutputToBuilderData({
      core_competencies:
        "U.S. Market Expansion. Grew revenue 30 percent year over year across the western region territory.",
    });

    expect(mapped.customSections?.[0].fields[0].value).toEqual([
      "U.S. Market Expansion. Grew revenue 30 percent year over year across the western region territory.",
    ]);
  });

  it("still splits competencies whose labels are not title-cased", () => {
    // Labels are Title Case in the AI service's output, but a label that is
    // not must still start a new point once the previous point already has
    // its own label plus an elaboration.
    const mapped = mapParserOutputToBuilderData({
      core_competencies:
        "backend engineering. delivered systems. event-driven messaging. built kafka pipelines.",
    });

    expect(mapped.customSections?.[0].fields[0].value).toEqual([
      "backend engineering. delivered systems.",
      "event-driven messaging. built kafka pipelines.",
    ]);
  });

  it("keeps consecutive title-cased labels with no elaboration as separate points", () => {
    const mapped = mapParserOutputToBuilderData({
      core_competencies: "Stakeholder Management. Team Leadership. Data Analysis.",
    });

    expect(mapped.customSections?.[0].fields[0].value).toEqual([
      "Stakeholder Management.",
      "Team Leadership.",
      "Data Analysis.",
    ]);
  });
});

describe("technical_skills id backfill", () => {
  it("uses the top-level (id-stamped) technical_skills copy to fill in ids llm_data's copy is missing", () => {
    // The enhancer only ever stamps ids onto the TOP-LEVEL technical_skills
    // array (_ensure_enhanced_item_ids never reaches into llm_data), but the
    // mapper prefers llm_data.technical_skills for display whenever present.
    // Without the backfill, a parser-extracted skill's skill_id_map entry
    // would be missing, and deleting it would send the skill's own NAME as
    // a fake id -- which the backend's by-id delete endpoint always rejects.
    const mapped = mapParserOutputToBuilderData({
      llm_data: {
        technical_skills: [
          { skill: "Keen Attention To Detail", category: "Soft Skills" },
        ],
      },
      technical_skills: [
        { id: "skill-abc123", skill: "Keen Attention To Detail", category: "Soft Skills" },
      ],
    });

    const skillIdMap = mapped.categorizedSkills?.skill_id_map as Record<string, string>;
    expect(skillIdMap["Soft Skills:Keen Attention To Detail"]).toBe("skill-abc123");
  });

  it("does not overwrite an id llm_data's own copy already provides", () => {
    const mapped = mapParserOutputToBuilderData({
      llm_data: {
        technical_skills: [
          { id: "from-llm-data", skill: "Empathy", category: "Soft Skills" },
        ],
      },
      technical_skills: [
        { id: "from-top-level", skill: "Empathy", category: "Soft Skills" },
      ],
    });

    const skillIdMap = mapped.categorizedSkills?.skill_id_map as Record<string, string>;
    expect(skillIdMap["Soft Skills:Empathy"]).toBe("from-llm-data");
  });

  it("still finds the id via the primary pass alone when there is no llm_data.technical_skills at all", () => {
    // No llm_data present -- the primary loop's own `llm.technical_skills ||
    // p.technical_skills` fallback already reads the top-level array
    // directly, so the id is captured without ever reaching the backfill.
    const mapped = mapParserOutputToBuilderData({
      technical_skills: [
        { id: "skill-xyz", skill: "Docker", category: "Frameworks" },
      ],
    });

    const skillIdMap = mapped.categorizedSkills?.skill_id_map as Record<string, string>;
    expect(skillIdMap?.["Frameworks:Docker"]).toBe("skill-xyz");
  });
});

describe("dedicated top-level soft_skills field (AI v2.5 evidence shape)", () => {
  it("carries the id through into skill_id_map instead of dropping it via strArr()", () => {
    // Regression test for the actual reported bug: the AI service returns
    // soft skills as their own top-level array of {name, evidence_count,
    // evidence_sections} objects -- entirely separate from technical_skills
    // and the categorized skills dict. strArr() (used to build the display
    // list) only extracts each item's name, silently dropping any `id` --
    // so Skills.tsx's "Soft Skills" custom-category delete handler had
    // nothing to send and bailed out instead of deleting.
    const mapped = mapParserOutputToBuilderData({
      soft_skills: [
        { name: "Keen Attention To Detail", id: "skill-soft-1", evidence_count: 0, evidence_sections: [] },
      ],
    });

    const skillIdMap = mapped.categorizedSkills?.skill_id_map as Record<string, string>;
    expect(skillIdMap["Soft Skills:Keen Attention To Detail"]).toBe("skill-soft-1");
    const softSkillsCategory = mapped.categorizedSkills?.custom_categories?.find(c => c.name === "Soft Skills");
    expect(softSkillsCategory?.skills).toContain("Keen Attention To Detail");
  });

  it("still displays a soft skill with no id at all, just without a delete-by-id entry", () => {
    const mapped = mapParserOutputToBuilderData({
      soft_skills: [{ name: "Empathy", evidence_count: 0, evidence_sections: [] }],
    });

    const skillIdMap = mapped.categorizedSkills?.skill_id_map as Record<string, string>;
    expect(skillIdMap?.["Soft Skills:Empathy"]).toBeUndefined();
    const softSkillsCategory = mapped.categorizedSkills?.custom_categories?.find(c => c.name === "Soft Skills");
    expect(softSkillsCategory?.skills).toContain("Empathy");
  });

  it("handles plain-string soft_skills entries (no id to carry, but must not crash)", () => {
    const mapped = mapParserOutputToBuilderData({
      soft_skills: ["Leadership"],
    });

    const softSkillsCategory = mapped.categorizedSkills?.custom_categories?.find(c => c.name === "Soft Skills");
    expect(softSkillsCategory?.skills).toContain("Leadership");
  });
});

describe("core_competencies from parser section_metadata (no persisted customSections)", () => {
  // careerbot-ai's section_intelligence maps a "Core Competencies" heading to
  // mapped_to "core_competencies", and that key is in neither
  // STANDARD_MAPPED_KEYS nor SKIP_KEYS, so the metadata fallback already
  // builds a custom section from it. The synthesis must not add a second one.
  const points = ["Stakeholder Management", "Mentoring"];

  it("builds exactly one Core Competencies section when metadata already maps it", () => {
    const mapped = mapParserOutputToBuilderData({
      section_metadata: [{ original_name: "Core Competencies", mapped_to: "core_competencies" }],
      core_competencies: points,
    });

    const named = (mapped.customSections ?? []).filter(
      section => section.sectionName.trim().toLowerCase() === "core competencies",
    );
    expect(named).toHaveLength(1);
    expect(named[0].source).toBe("core_competencies");
  });

  it("does not add a second copy under the default name when the heading was renamed", () => {
    const mapped = mapParserOutputToBuilderData({
      section_metadata: [{ original_name: "Key Competencies", mapped_to: "core_competencies" }],
      core_competencies: points,
    });

    expect(mapped.customSections?.map(section => section.sectionName)).toEqual(["Key Competencies"]);
    expect(mapped.customSections?.[0].source).toBe("core_competencies");
  });

  it("control: unrelated metadata sections still sit beside the synthesized one", () => {
    const mapped = mapParserOutputToBuilderData({
      section_metadata: [{ original_name: "Strengths", mapped_to: "strengths" }],
      strengths: ["Communication"],
      core_competencies: points,
    });

    expect(mapped.customSections?.map(section => section.sectionName)).toEqual(["Strengths", "Core Competencies"]);
    expect(mapped.customSections?.[0].source).toBeUndefined();
  });
});

describe("core_competencies saved before the source tag existed", () => {
  // A metadata-built "Key Competencies" section was persisted as a plain
  // custom section (no source) by any earlier full-replace save. The parser's
  // section_metadata still says that heading is core_competencies.
  const points = ["Stakeholder Management", "Mentoring"];
  const saved = {
    id: "saved-kc",
    sectionName: "Key Competencies",
    fields: [{ id: "f1", fieldName: "Key Competencies", fieldType: "list", value: points }],
  };

  it("does not add a second copy beside a saved metadata-origin section", () => {
    const mapped = mapParserOutputToBuilderData({
      customSections: [saved],
      section_metadata: [{ original_name: "Key Competencies", mapped_to: "core_competencies" }],
      core_competencies: points,
    });

    expect(mapped.customSections?.map(section => section.sectionName)).toEqual(["Key Competencies"]);
    expect(mapped.customSections?.[0].source).toBe("core_competencies");
  });

  it("control: a saved section the metadata maps elsewhere stays untagged", () => {
    const mapped = mapParserOutputToBuilderData({
      customSections: [{ ...saved, sectionName: "Strengths" }],
      section_metadata: [{ original_name: "Strengths", mapped_to: "strengths" }],
      core_competencies: points,
    });

    expect(mapped.customSections?.map(section => section.sectionName)).toEqual(["Strengths", "Core Competencies"]);
    expect(mapped.customSections?.[0].source).toBeUndefined();
  });
});

describe("achievements mapping", () => {
  // Shape the AI parser stores for achievements on a real resume: objects with
  // the sentence under `text`, plus scoring metadata -- not plain strings.
  const parsedAchievements = [
    {
      text: 'Runner-up for the project "Proactive Dropout Mitigation" in 8th National Level IEEE Project Competition-2024 at GSSSIETW, Mysore.',
      tone: "unknown",
      claim_type: "vague",
      star_pattern: "S",
      id: "1d876a33-1841-4f4f-a4ee-38bf941aa1b7",
    },
    {
      text: "Runner-up for the project titled \"Cervical Cancer Prediction\" in Generative AI Hackathon at BNMIT, Bengaluru.",
      tone: "unknown",
      claim_type: "vague",
      star_pattern: "S",
      id: "fb822568-e1b7-4733-b325-946aae7603c4",
    },
  ];

  it("keeps the text of achievements the parser returns as { text, ... } objects", () => {
    const mapped = mapParserOutputToBuilderData({ achievements: parsedAchievements });

    expect(mapped.achievements).toHaveLength(2);
    expect(mapped.achievements?.map(item => item.title)).toEqual(parsedAchievements.map(item => item.text));
    expect(mapped.achievements?.[0].id).toBe("1d876a33-1841-4f4f-a4ee-38bf941aa1b7");
  });

  it("reads the same objects when they sit under llm_data", () => {
    const mapped = mapParserOutputToBuilderData({ llm_data: { achievements: parsedAchievements } });

    expect(mapped.achievements?.map(item => item.title)).toEqual(parsedAchievements.map(item => item.text));
  });

  it("still maps plain-string and { title } achievements the way it did", () => {
    const mapped = mapParserOutputToBuilderData({
      achievements: ["Niper JEE 2025.", { title: "Smart India Hackathon", date: "2024", description: "Finalist" }],
    });

    expect(mapped.achievements?.[0]).toMatchObject({ title: "Niper JEE 2025.", date: "", description: "" });
    expect(mapped.achievements?.[1]).toMatchObject({ title: "Smart India Hackathon", date: "2024", description: "Finalist" });
  });
});

describe("list sections keep entries the parser sends as plain strings or { text }", () => {
  // The parser's list sections are not always objects: awards and publications
  // are declared as plain strings, the rest as "any". An entry read as an object
  // used to map to blanks, so the preview drew the heading with nothing under it.
  const TEXT = "Sample Entry Text 2024";
  // section key -> the field the templates draw as that entry's main text
  const SECTIONS: Array<[string, string]> = [
    ["awards", "title"],
    ["publications", "title"],
    ["patents", "title"],
    ["hobbies", "name"],
    ["interests", "name"],
    ["volunteering", "organization"],
    ["references", "name"],
    ["certifications", "name"],
  ];

  it.each(SECTIONS)("%s: a plain string becomes an entry with its text in %s", (section, mainKey) => {
    const mapped = mapParserOutputToBuilderData({ [section]: [TEXT, "  "] } as never) as unknown as Record<string, Array<Record<string, string>>>;

    expect(mapped[section]).toHaveLength(1);
    expect(mapped[section][0][mainKey]).toBe(TEXT);
  });

  it.each(SECTIONS)("%s: a { text } object becomes an entry with its text in %s", (section, mainKey) => {
    const mapped = mapParserOutputToBuilderData({ [section]: [{ text: TEXT }] } as never) as unknown as Record<string, Array<Record<string, string>>>;

    expect(mapped[section]).toHaveLength(1);
    expect(mapped[section][0][mainKey]).toBe(TEXT);
  });

  it("reads hobbies and interests from the parser's hobbies_and_interests key", () => {
    const mapped = mapParserOutputToBuilderData({ hobbies_and_interests: ["Cycling", "Chess"] } as never);

    expect(mapped.hobbies?.map((h) => h.name)).toEqual(["Cycling", "Chess"]);
  });

  it("leaves entries that are already objects exactly as before", () => {
    const mapped = mapParserOutputToBuilderData({
      awards: [{ title: "Best Paper", issuedBy: "IEEE", year: "2024" }, { name: "Dean's List", organization: "JNTU", date: "2022" }],
      publications: [{ title: "Dropout Prediction", publisher: "IEEE", date: "2024" }],
      references: [{ name: "Dr. K. Rao", relation: "Professor", contact: "rao@example.com" }],
      certifications: [{ full_name: "AWS Solutions Architect", issuing_organization: "Amazon", year: "2023" }],
    } as never);

    expect(mapped.awards).toEqual([
      { title: "Best Paper", issuedBy: "IEEE", year: "2024" },
      { title: "Dean's List", issuedBy: "JNTU", year: "2022" },
    ]);
    expect(mapped.publications?.[0]).toMatchObject({ title: "Dropout Prediction", date: "2024" });
    expect(mapped.references?.[0]).toMatchObject({ name: "Dr. K. Rao", relation: "Professor", contact: "rao@example.com" });
    expect(mapped.certifications?.[0]).toMatchObject({ name: "AWS Solutions Architect", issuer: "Amazon", year: "2023" });
  });
});

describe("hobbies aliases", () => {
  it("reads hobbies_and_interests when hobbies is an empty list", () => {
    const mapped = mapParserOutputToBuilderData({
      contact: { name: "A" },
      hobbies: [],
      hobbies_and_interests: ["Chess", "Hiking"],
    } as never);
    expect((mapped.hobbies ?? []).map((h: { name?: string }) => h.name)).toEqual(["Chess", "Hiking"]);
  });

  it("uses a filled list alias when hobbies is a plain string the mapper cannot read", () => {
    const mapped = mapParserOutputToBuilderData({
      contact: { name: "A" },
      hobbies: "Reading, Chess",
      hobbies_and_interests: ["Cycling"],
    } as never);
    expect((mapped.hobbies ?? []).map((h: { name?: string }) => h.name)).toEqual(["Cycling"]);
  });
});
