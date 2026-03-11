import { degrees, streams } from "@/utils/education-data";

export function normalizeDegree(parsed: string | null): string | "" {
    if (!parsed) return "";

    const clean = parsed.toLowerCase();

    const degreeMap: Record<string, string> = {
        "bachelor of technology": "Bachelor’s Degree",
        "btech": "Bachelor’s Degree",
        "B-Tech": "Bachelor’s Degree",
        "B.Tech": "Bachelor’s Degree",
        "bachelor degree": "Bachelor’s Degree",
        "b tech": "Bachelor’s Degree",

        "intermediate": "Higher Secondary / Intermediate (12th)",
        "higher secondary": "Higher Secondary / Intermediate (12th)",
        "12th": "Higher Secondary / Intermediate (12th)",
        "hsc": "Higher Secondary / Intermediate (12th)",

        "secondary school": "Secondary School (10th)",
        "10th": "Secondary School (10th)",
        "ssc": "Secondary School (10th)",

        "diploma": "Diploma / Polytechnic",
    };

    for (const key in degreeMap) {
        if (clean.includes(key.toLowerCase())) return degreeMap[key];
    }

    // fallback: if parsed exactly matches dropdown
    return degrees.find((d) => d.toLowerCase() === clean) || "";
}

export function normalizeStream(parsed: string | null): string | "" {
    if (!parsed) return "";

    const clean = parsed.toLowerCase();

    const streamMap: Record<string, string> = {
        "computer science": "Computer Science Engineering",
        "computer science and engineering": "Computer Science Engineering",
        "cse": "Computer Science Engineering",
        "it": "Information Technology",
        "electronics": "Electronics and Communication",
        "eit": "Electronics and Communication",

        "maths, physics, chemistry": "Science (MPC)",
        "mpc": "Science (MPC)",
        "bpc": "Science (BPC)",
    };

    for (const key in streamMap) {
        if (clean.includes(key.toLowerCase())) return streamMap[key];
    }

    return streams.find((s) => s.toLowerCase() === clean) || "";
}
