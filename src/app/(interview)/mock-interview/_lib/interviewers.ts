export type InterviewerGender = "male" | "female";
export type InterviewerVoice = "alloy" | "onyx" | "nova" | "fable";

export const INTERVIEWER_VOICES_BY_GENDER: Record<InterviewerGender, InterviewerVoice[]> = {
  male: ["alloy", "onyx"],
  female: ["nova", "fable"],
};

// Single interviewer identity, shown for every session type — the fallback
// avatar face (shown when the live LiveKit avatar video is unavailable/fails).
export const MOCK_INTERVIEWERS = [
  {
    slug: "ananya",
    name: "Ananya",
    role: "AI Interviewer",
    gender: "female",
    voice: "nova",
    src: "/images/avatar/ananya-fallback.png",
  },
] as const;

export type MockInterviewer = (typeof MOCK_INTERVIEWERS)[number];

export function getInterviewerByIndex(index: unknown): MockInterviewer | null {
  return isValidInterviewerIndex(index) ? MOCK_INTERVIEWERS[index] : null;
}

export function isVoiceMatchedToGender(voice: unknown, gender: unknown): voice is InterviewerVoice {
  if (gender !== "male" && gender !== "female") return false;
  return INTERVIEWER_VOICES_BY_GENDER[gender].includes(voice as InterviewerVoice);
}

export function isValidInterviewerIndex(index: unknown): index is number {
  return (
    typeof index === "number" &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < MOCK_INTERVIEWERS.length
  );
}

export function pickRandomInterviewerIndex() {
  return Math.floor(Math.random() * MOCK_INTERVIEWERS.length);
}

export function pickInterviewerIndex(sessionId: string) {
  if (!sessionId) return 0;

  let hash = 0;
  for (let i = 0; i < sessionId.length; i += 1) {
    hash = (hash + sessionId.charCodeAt(i) * (i + 1)) % MOCK_INTERVIEWERS.length;
  }

  return hash;
}
