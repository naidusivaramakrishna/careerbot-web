export const MOCK_INTERVIEWERS = [
  {
    name: "Arjun",
    role: "Senior HR Interviewer",
    src: "/images/ai-interviewer-room-male-01.png",
    gender: "male",
    voice: "alloy",
  },
  {
    name: "Rahul",
    role: "Technical Interview Panelist",
    src: "/images/ai-interviewer-room-male-02.png",
    gender: "male",
    voice: "onyx",
  },
  {
    name: "Meera",
    role: "Senior HR Interviewer",
    src: "/images/ai-interviewer-room-female-01.png",
    gender: "female",
    voice: "nova",
  },
  {
    name: "Nisha",
    role: "Product Engineering Interviewer",
    src: "/images/ai-interviewer-room-female-02.png",
    gender: "female",
    voice: "fable",
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
