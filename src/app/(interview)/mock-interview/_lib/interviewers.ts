export interface InterviewerMouthAnchor {
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  minWidthPx: number;
  maxWidthPx: number;
  rotationDeg?: number;
}

export const MOCK_INTERVIEWERS = [
  {
    slug: "arjun",
    name: "Arjun",
    role: "Senior HR Interviewer",
    src: "/images/ai-interviewer-room-male-01.png",
    gender: "male",
    voice: "alloy",
    mouthSpriteBasePath: "/images/interviewers/arjun",
    mouthAnchor: { xPercent: 50.1, yPercent: 42.8, widthPercent: 7.8, minWidthPx: 42, maxWidthPx: 74 },
  },
  {
    slug: "rahul",
    name: "Rahul",
    role: "Technical Interview Panelist",
    src: "/images/ai-interviewer-room-male-02.png",
    gender: "male",
    voice: "onyx",
    mouthSpriteBasePath: "/images/interviewers/rahul",
    mouthAnchor: { xPercent: 50, yPercent: 41.6, widthPercent: 8.1, minWidthPx: 44, maxWidthPx: 78 },
  },
  {
    slug: "meera",
    name: "Meera",
    role: "Senior HR Interviewer",
    src: "/images/ai-interviewer-room-female-01.png",
    gender: "female",
    voice: "nova",
    mouthSpriteBasePath: "/images/interviewers/meera",
    mouthAnchor: { xPercent: 50.2, yPercent: 42.7, widthPercent: 7.3, minWidthPx: 40, maxWidthPx: 70 },
  },
  {
    slug: "nisha",
    name: "Nisha",
    role: "Product Engineering Interviewer",
    src: "/images/ai-interviewer-room-female-02.png",
    gender: "female",
    voice: "fable",
    mouthSpriteBasePath: "/images/interviewers/nisha",
    mouthAnchor: { xPercent: 50.1, yPercent: 42.9, widthPercent: 7.1, minWidthPx: 38, maxWidthPx: 68 },
  },
] as const;

export type MockInterviewer = (typeof MOCK_INTERVIEWERS)[number];

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
