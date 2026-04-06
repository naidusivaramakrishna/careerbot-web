/**
 * Determines seniority level based on experience
 * @param experience - Experience string (e.g., "0-1 years", "3-5 years", "Fresher")
 * @returns Object with level and label
 */
export function getSeniorityLevel(experience: string | undefined) {
  if (!experience || experience.trim() === "") {
    return { level: "unknown", label: null };
  }
 
  const exp = experience.toLowerCase().trim();
 
  // Intern / Entry Level (0-2 years)
  if (
    exp.includes("0-1") ||
    exp.includes("fresher") ||
    exp.includes("intern") ||
    exp.includes("entry level") ||
    exp.includes("0 year") ||
    exp === "0+ years" ||
    exp === "0+ years exp" ||
    exp === "0 years" ||
    exp.includes("0-2") ||
    /^[0-2]\s*year/i.test(exp)
  ) {
    return { level: "entry", label: "Entry Level" };
  }
 
  // Mid Level (2-7 years)
  if (
    exp.includes("1-3") ||
    exp.includes("2-3") ||
    exp.includes("3-5") ||
    exp.includes("2-4") ||
    exp.includes("3-4") ||
    exp.includes("4-6") ||
    exp.includes("5-6") ||
    exp.includes("2-5") ||
    exp.includes("3-7") ||
    exp.includes("4-7") ||
    /^[2-7]\s*year/i.test(exp)
  ) {
    return { level: "mid", label: "Mid Level" };
  }
 
  // Senior Level (7+ years)
  if (
    exp.includes("5-7") ||
    exp.includes("7-10") ||
    exp.includes("8-10") ||
    exp.includes("10+") ||
    exp.includes("senior") ||
    exp.includes("lead") ||
    exp.includes("principal") ||
    /^([7-9]|10\+?|[1-9]\d+)\s*year/i.test(exp)
  ) {
    return { level: "senior", label: "Senior Level" };
  }
 
  // If we have any experience string that wasn't matched, default to mid-level
  return { level: "mid", label: "Mid Level" };
}
 
/**
 * Gets the badge color based on seniority level
 */
export function getSeniorityBadgeColor(level: string) {
  switch (level) {
    case "entry":
      return "bg-blue-100 text-blue-700";
    case "mid":
      return "bg-purple-100 text-purple-700";
    case "senior":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}