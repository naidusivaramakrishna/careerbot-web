export interface InterviewerMouthAnchor {
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  minWidthPx: number;
  maxWidthPx: number;
  rotationDeg?: number;
}

export type InterviewerGender = "male" | "female";
export type InterviewerVoice = "alloy" | "onyx" | "nova" | "fable";

export const INTERVIEWER_VOICES_BY_GENDER: Record<InterviewerGender, InterviewerVoice[]> = {
  male: ["alloy", "onyx"],
  female: ["nova", "fable"],
};

export const MOCK_INTERVIEWERS = [
  {
    slug: "arjun",
    name: "Arjun",
    role: "Senior HR Interviewer",
    src: "/images/ai-interviewer-room-male-01.png",
    gender: "male",
    voice: "alloy",
    mouthSpriteBasePath: "/images/interviewers/arjun",
    mouthAnchor: { xPercent: 50.1, yPercent: 33.3, widthPercent: 6.1, minWidthPx: 36, maxWidthPx: 62 },
  },
  {
    slug: "rahul",
    name: "Rahul",
    role: "Technical Interview Panelist",
    src: "/images/ai-interviewer-room-male-02.png",
    gender: "male",
    voice: "onyx",
    mouthSpriteBasePath: "/images/interviewers/rahul",
    mouthAnchor: { xPercent: 50, yPercent: 35.2, widthPercent: 6.4, minWidthPx: 38, maxWidthPx: 66 },
  },
  {
    slug: "meera",
    name: "Meera",
    role: "Senior HR Interviewer",
    src: "/images/ai-interviewer-room-female-01.png",
    gender: "female",
    voice: "nova",
    mouthSpriteBasePath: "/images/interviewers/meera",
    mouthAnchor: { xPercent: 50.1, yPercent: 35.7, widthPercent: 5.8, minWidthPx: 34, maxWidthPx: 58 },
  },
  {
    slug: "nisha",
    name: "Nisha",
    role: "Product Engineering Interviewer",
    src: "/images/ai-interviewer-room-female-02.png",
    gender: "female",
    voice: "fable",
    mouthSpriteBasePath: "/images/interviewers/nisha",
    mouthAnchor: { xPercent: 50, yPercent: 35.9, widthPercent: 5.7, minWidthPx: 34, maxWidthPx: 58 },
  },
] as const;

/**
 * MockInterviewer keeps the literal `as const` shape (slug unions, exact
 * numbers) but widens mouthAnchor to the DECLARED interface.
 *
 * Without this, mouthAnchor's type is inferred purely from the array literals.
 * No entry sets the optional `rotationDeg`, so it is absent from the inferred
 * union and `mouthAnchor.rotationDeg` is a type error at the one call site
 * that reads it — even though InterviewerMouthAnchor declares the field and
 * the call site already guards with `?? 0`. Declaring an optional property
 * that the derived type then discards is the drift; this closes it.
 */
export type MockInterviewer = Omit<(typeof MOCK_INTERVIEWERS)[number], "mouthAnchor"> & {
  mouthAnchor: InterviewerMouthAnchor;
};

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
