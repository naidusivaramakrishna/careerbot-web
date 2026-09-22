import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  pathname: "/mock-interview/live",
  params: { sessionId: "live-session-123" } as Record<string, string>,
  stageState: {
    notes_generated: false,
    english_read: false,
    practice_answered: 0,
    practice_total: 0,
    readiness_passed: false,
    history_count: 0,
  },
  createLiveSession: vi.fn(),
  getReport: vi.fn(),
  shareReport: vi.fn(),
  downloadReportPdf: vi.fn(),
  getLiveSessionState: vi.fn(),
  buildWsUrl: vi.fn((url: string) => `ws://test.local${url}`),
  isAuthenticated: false,
  authLoading: false,
  setPendingAvatarSession: vi.fn(),
  consumePendingAvatarSession: vi.fn(() => null as unknown),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace, prefetch: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  usePathname: () => mocks.pathname,
  useParams: () => mocks.params,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/app/(interview)/mock-interview/_context/MockInterviewContext", () => ({
  useMockInterview: () => ({
    stageState: mocks.stageState,
    activeSession: null,
    dismissActiveSession: vi.fn(),
    userProgress: null,
    progressLoading: false,
    userId: "user-123",
    setNotesGenerated: vi.fn(),
    setEnglishRead: vi.fn(),
    setPracticeAnswered: vi.fn(),
    setPracticeTotal: vi.fn(),
    setReadinessPassed: vi.fn(),
    // Avatar (interview-avatar.txt) — in-memory relay from the "starting"
    // page to the session page. No avatar session by default in these tests.
    setPendingAvatarSession: mocks.setPendingAvatarSession,
    consumePendingAvatarSession: mocks.consumePendingAvatarSession,
  }),
}));

vi.mock("@/api/mockInterviewApi", () => ({
  createLiveSession: mocks.createLiveSession,
  getReport: mocks.getReport,
  shareReport: mocks.shareReport,
  downloadReportPdf: mocks.downloadReportPdf,
  getLiveSessionState: mocks.getLiveSessionState,
  buildWsUrl: mocks.buildWsUrl,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: mocks.isAuthenticated,
    isLoading: mocks.authLoading,
    logout: vi.fn(),
  }),
}));

vi.mock("@/components/SignUpModal", () => ({
  default: ({ open, initialFormType, redirectTo }: { open: boolean; initialFormType?: string; redirectTo?: string }) =>
    open ? <div role="dialog" aria-label="Sign in required">Auth modal {initialFormType} {redirectTo}</div> : null,
}));

type MotionMockProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode;
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
  whileInView?: unknown;
  viewport?: unknown;
  whileHover?: unknown;
  variants?: unknown;
};

type ImageMockProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  priority?: boolean;
  fill?: boolean;
  unoptimized?: boolean;
};

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: new Proxy({}, {
    get: (_target, tag: string) => ({ children, ...props }: MotionMockProps) => {
      const domProps = { ...props };
      delete domProps.initial;
      delete domProps.animate;
      delete domProps.exit;
      delete domProps.transition;
      delete domProps.whileInView;
      delete domProps.viewport;
      delete domProps.whileHover;
      delete domProps.variants;
      return React.createElement(tag, domProps, children);
    },
  }),
}));
vi.mock("next/image", () => ({
  default: (props: ImageMockProps) => {
    const imgProps: React.ImgHTMLAttributes<HTMLImageElement> = { ...props };
    delete (imgProps as ImageMockProps).priority;
    delete (imgProps as ImageMockProps).fill;
    delete (imgProps as ImageMockProps).unoptimized;
    return React.createElement("img", imgProps);
  },
}));

class MockAudio {
  static instances: MockAudio[] = [];
  volume = 1;
  currentTime = 0;
  onended: null | (() => void) = null;
  onerror: null | (() => void) = null;
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
  constructor(public src = "") { MockAudio.instances.push(this); }
}

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;
  readyState = 0;
  onopen: null | (() => void) = null;
  onmessage: null | ((event: MessageEvent) => void) = null;
  onclose: null | ((event: CloseEvent) => void) = null;
  onerror: null | (() => void) = null;
  send = vi.fn();
  close = vi.fn(() => { this.readyState = 3; this.onclose?.({ code: 1000 } as CloseEvent); });
  constructor(public url: string) { MockWebSocket.instances.push(this); }
  open() { this.readyState = MockWebSocket.OPEN; this.onopen?.(); }
  emit(data: unknown) { this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent); }
}

// Covers both the continuous mic-capture pipeline (createScriptProcessor,
// createMediaStreamSource, createAnalyser) and the PCM interviewer-audio
// streaming player (createBuffer, createBufferSource, createGain).
class MockAudioContext {
  static gainInstances: { gain: { value: number }; connect: ReturnType<typeof vi.fn> }[] = [];
  state = "running";
  destination = {};
  currentTime = 0;
  sampleRate: number;
  constructor(options?: { sampleRate?: number }) { this.sampleRate = options?.sampleRate ?? 48000; }
  createOscillator() { return { type: "sine", frequency: { value: 0 }, connect: vi.fn(), start: vi.fn(), stop: vi.fn() }; }
  createGain() {
    const gainNode = { gain: { value: 1 }, connect: vi.fn() };
    MockAudioContext.gainInstances.push(gainNode);
    return gainNode;
  }
  createAnalyser() { return { fftSize: 0, smoothingTimeConstant: 0, frequencyBinCount: 32, connect: vi.fn(), getByteFrequencyData: vi.fn((data: Uint8Array) => data.fill(20)) }; }
  createMediaStreamSource() { return { connect: vi.fn() }; }
  createScriptProcessor() { return { connect: vi.fn(), disconnect: vi.fn(), onaudioprocess: null as ((event: unknown) => void) | null }; }
  createBuffer(_channels: number, length: number, sampleRate: number) {
    return { getChannelData: () => new Float32Array(length), duration: length / sampleRate };
  }
  createBufferSource() {
    return { buffer: null as unknown, connect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null as (() => void) | null };
  }
  resume() { return Promise.resolve(); }
  close() { return Promise.resolve(); }
}

function mediaStream() {
  return { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
}

function report(overrides = {}) {
  return {
    report_id: "report-123",
    session_id: "live-session-123",
    user_id: "user-123",
    type: "HR",
    overall_score: 8.1,
    scores: { overall: 8.1, communication: 8, confidence: 7.5 },
    answers: [{ question_text: "Tell me about teamwork.", score: 8, feedback: "Clear structure.", key_points_hit: 3, key_points_total: 4, transcript: "I aligned the team.", duration_s: 64, filler_count: 1 }],
    recommendations: ["Use more metrics."],
    pressure_tag: null,
    grade: "A",
    performance_summary: "Strong interview performance.",
    strengths: ["Structured answer"],
    improvement_areas: ["Add quantified impact"],
    created_at: "2026-07-17T09:00:00Z",
    duration_min: 18,
    question_count: 1,
    action_plan: ["Practice concise openings."],
    ...overrides,
  };
}

const importMockSidebar = async () => (await import("@/app/(interview)/mock-interview/_components/MockSidebar")).default;
const importReadinessGate = async () => (await import("@/app/(interview)/mock-interview/_components/ReadinessGate")).default;
const importMockInterviewPage = async () => (await import("@/app/(interview)/mock-interview/page")).default;
const importLiveSetupPage = async () => (await import("@/app/(interview)/mock-interview/live/page")).default;
const importLiveStartingPage = async () => (await import("@/app/(interview)/mock-interview/live/starting/page")).default;
const importLiveSessionPage = async () => (await import("@/app/(interview)/mock-interview/live/[sessionId]/page")).default;
const importReportPage = async () => (await import("@/app/(interview)/mock-interview/report/[sessionId]/page")).default;

beforeEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  mocks.pathname = "/mock-interview/live";
  mocks.params = { sessionId: "live-session-123" };
  mocks.isAuthenticated = false;
  mocks.authLoading = false;
  mocks.stageState = { notes_generated: false, english_read: false, practice_answered: 0, practice_total: 0, readiness_passed: false, history_count: 0 };
  mocks.buildWsUrl.mockImplementation((url: string) => `ws://test.local${url}`);
  MockAudio.instances = [];
  MockWebSocket.instances = [];
  MockAudioContext.gainInstances = [];
  vi.stubGlobal("Audio", MockAudio);
  vi.stubGlobal("WebSocket", MockWebSocket);
  vi.stubGlobal("ResizeObserver", class { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn(); });
  vi.stubGlobal("AudioContext", MockAudioContext);
  Object.defineProperty(window, "sessionStorage", { configurable: true, value: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() } });
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { enumerateDevices: vi.fn().mockResolvedValue([{ kind: "audioinput", deviceId: "mic-1", label: "Studio Mic" }, { kind: "videoinput", deviceId: "cam-1", label: "Webcam" }]), getUserMedia: vi.fn().mockResolvedValue(mediaStream()) } });
  Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
  Object.defineProperty(document.documentElement, "requestFullscreen", { configurable: true, value: vi.fn(() => Promise.resolve()) });
  Object.defineProperty(HTMLMediaElement.prototype, "srcObject", {
    configurable: true,
    get() { return (this as HTMLMediaElement & { __srcObject?: MediaStream | null }).__srcObject ?? null; },
    set(value: MediaStream | null) { (this as HTMLMediaElement & { __srcObject?: MediaStream | null }).__srcObject = value; },
  });
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:mock-audio") });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("MockInterviewPage", () => {
  it("asks unauthenticated users to sign in before starting the live interview", async () => {
    const MockInterviewPage = await importMockInterviewPage();
    render(<MockInterviewPage />);

    fireEvent.click(screen.getAllByRole("button", { name: /start mock interview/i })[0]);

    expect(mocks.push).not.toHaveBeenCalledWith("/mock-interview/live");
    expect(screen.getByRole("dialog", { name: /sign in required/i })).toHaveTextContent("signin /mock-interview/live");
  });

  it("navigates authenticated users directly to the live interview setup", async () => {
    mocks.isAuthenticated = true;
    const MockInterviewPage = await importMockInterviewPage();
    render(<MockInterviewPage />);

    fireEvent.click(screen.getAllByRole("button", { name: /start mock interview/i })[0]);

    expect(mocks.push).toHaveBeenCalledWith("/mock-interview/live");
    expect(screen.queryByRole("dialog", { name: /sign in required/i })).not.toBeInTheDocument();
  });

  it("does not open sign-in or navigate while auth status is still loading", async () => {
    mocks.authLoading = true;
    const MockInterviewPage = await importMockInterviewPage();
    render(<MockInterviewPage />);

    const startButtons = screen.getAllByRole("button", { name: /checking sign in/i });
    expect(startButtons.length).toBeGreaterThan(0);
    expect(startButtons[0]).toBeDisabled();

    fireEvent.click(startButtons[0]);

    expect(mocks.push).not.toHaveBeenCalledWith("/mock-interview/live");
    expect(screen.queryByRole("dialog", { name: /sign in required/i })).not.toBeInTheDocument();
  });
});

describe("MockSidebar", () => {
  it("hides on the public landing route", async () => {
    mocks.pathname = "/mock-interview";
    const MockSidebar = await importMockSidebar();
    const { container } = render(<MockSidebar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders compact rail actions and optional prep without practice gating", async () => {
    mocks.stageState = { ...mocks.stageState, history_count: 2 };
    const MockSidebar = await importMockSidebar();
    render(<MockSidebar />);
    expect(screen.getByRole("navigation", { name: /mock interview navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /01 mock interview/i })).toHaveAttribute("title", "Mock Interview");
    expect(screen.getByRole("button", { name: /02 history & reports/i })).toHaveAttribute("title", "History & Reports");
    fireEvent.click(screen.getByRole("button", { name: /01 mock interview/i }));
    fireEvent.click(screen.getByRole("button", { name: /02 history & reports/i }));
    fireEvent.click(screen.getByRole("button", { name: /optional prep notes and practice/i }));
    expect(mocks.push).toHaveBeenCalledWith("/mock-interview/live");
    expect(mocks.push).toHaveBeenCalledWith("/mock-interview/history");
    expect(mocks.push).toHaveBeenCalledWith("/notes/generate");
  });
});

describe("ReadinessGate", () => {
  it("keeps live interview available when practice score is weak", async () => {
    const ReadinessGate = await importReadinessGate();
    const onPracticeMore = vi.fn();
    render(<ReadinessGate isReady={false} avgScore={3.2} reasons={["Needs stronger examples"]} weakQuestions={[{ question_id: "q1", question_text: "Describe a conflict.", score: 3.5 }]} onPracticeMore={onPracticeMore} />);
    expect(screen.getByText("Live Interview Is Available")).toBeInTheDocument();
    expect(screen.getByText(/practice is optional/i)).toBeInTheDocument();
    expect(screen.getByText("Describe a conflict.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /start live interview/i }));
    fireEvent.click(screen.getByRole("button", { name: /practice weak questions/i }));
    expect(mocks.push).toHaveBeenCalledWith("/mock-interview/live");
    expect(onPracticeMore).toHaveBeenCalledTimes(1);
  });

  it("shows strong-practice state while more practice remains optional", async () => {
    const ReadinessGate = await importReadinessGate();
    const onPracticeMore = vi.fn();
    render(<ReadinessGate isReady avgScore={8.8} reasons={[]} weakQuestions={[]} onPracticeMore={onPracticeMore} />);
    expect(screen.getByText("Practice Looks Strong")).toBeInTheDocument();
    expect(screen.getByText("Average score: 8.8/10")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /practice more \(optional\)/i }));
    expect(onPracticeMore).toHaveBeenCalledTimes(1);
  });
});

// Info screen -> device-check screen -> role-selection screen. The consent
// gate from the old flow is gone entirely (POST /consent "no longer gates
// anything" per live-interview.txt) — there's no decline/cancel step anymore.
async function completePreflight() {
  fireEvent.click(screen.getByRole("button", { name: /continue to room check/i }));
  fireEvent.click(screen.getByRole("button", { name: /test microphone/i }));
  await waitFor(() => expect(screen.getByText(/microphone is available/i)).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: /test camera/i }));
  await waitFor(() => expect(screen.getByText(/camera preview is working/i)).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: /test speaker/i }));
  await waitFor(() => expect(screen.getByText(/speaker test completed/i)).toBeInTheDocument());
  fireEvent.click(screen.getByLabelText(/quiet environment confirmed/i));
  fireEvent.click(screen.getByRole("button", { name: /continue to interview setup/i }));
}

describe("LiveSetupPage", () => {
  it("runs device checks, then opens the role-confirmation modal", async () => {
    const LiveSetupPage = await importLiveSetupPage();
    render(<LiveSetupPage />);
    expect(screen.getByRole("heading", { name: /mock interview room information/i })).toBeInTheDocument();
    await completePreflight();

    expect(screen.getByText("Choose your interview role.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Frontend Developer" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Frontend Developer");
    // Start Interview stays disabled until an interview type is chosen.
    expect(within(dialog).getByRole("button", { name: /start interview/i })).toBeDisabled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Technical" }));
    expect(within(dialog).getByRole("button", { name: /start interview/i })).toBeEnabled();
  });

  it("stores the single fixed interviewer identity before starting", async () => {
    const LiveSetupPage = await importLiveSetupPage();
    render(<LiveSetupPage />);
    await completePreflight();

    fireEvent.click(screen.getByRole("button", { name: "Frontend Developer" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Technical" }));
    fireEvent.click(within(dialog).getByRole("button", { name: /start interview/i }));

    expect(mocks.createLiveSession).not.toHaveBeenCalled();
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith("live_session_params", JSON.stringify({
      session_type: "technical",
      resume_id: undefined,
      target_role: "Frontend Developer",
      voice: "nova",
      interviewer_index: 0,
      interviewer_slug: "ananya",
      interviewer_name: "Ananya",
      gender: "female",
      session_type_label: "Technical",
    }));
    expect(mocks.push).toHaveBeenCalledWith("/mock-interview/live/starting");
  }, 15_000);

  it("creates the live session and relays the avatar session in memory, never through storage", async () => {
    mocks.createLiveSession.mockResolvedValue({
      session_id: "created-session",
      ticket_id: "ticket-1",
      ticket_expires_at: "2026-07-17T10:00:00Z",
      ws_url: "/ws",
      avatar: { livekit_url: "wss://avatar.test", livekit_client_token: "secret-token", avatar_id: "a1", provider_session_id: "p1", mode: "LITE" },
    });
    vi.mocked(window.sessionStorage.getItem).mockImplementation((key: string) => key === "live_session_params" ? JSON.stringify({
      session_type: "technical",
      resume_id: "resume-1",
      target_role: "Frontend Developer",
      voice: "nova",
      interviewer_index: 0,
      interviewer_slug: "ananya",
      interviewer_name: "Ananya",
      gender: "female",
      session_type_label: "Technical",
    }) : null);

    const LiveStartingPage = await importLiveStartingPage();
    render(<LiveStartingPage />);

    // Only the documented fields go over the wire — enable_streaming_stt,
    // voice and use_orchestrator are retired per live-interview.txt.
    await waitFor(() => expect(mocks.createLiveSession).toHaveBeenCalledWith({
      session_type: "technical",
      resume_id: "resume-1",
      target_role: "Frontend Developer",
    }));

    // livekit_client_token is a live credential — never persisted, only
    // relayed in-memory via the context.
    expect(mocks.setPendingAvatarSession).toHaveBeenCalledWith(
      "created-session",
      { livekit_url: "wss://avatar.test", livekit_client_token: "secret-token", avatar_id: "a1", provider_session_id: "p1", mode: "LITE" }
    );
    const storedSessionData = vi.mocked(window.sessionStorage.setItem).mock.calls.find(([key]) => key === "live_session_data")?.[1];
    expect(storedSessionData).toBeDefined();
    expect(JSON.parse(storedSessionData as string)).not.toHaveProperty("avatar");

    expect(window.sessionStorage.setItem).toHaveBeenCalledWith("live_session_interviewer", JSON.stringify({
      session_id: "created-session",
      interviewer_index: 0,
      interviewer_name: "Ananya",
      gender: "female",
      voice: "nova",
    }));
    expect(mocks.replace).toHaveBeenCalledWith("/mock-interview/live/created-session");
  });

  it("surfaces create-session failure", async () => {
    mocks.createLiveSession.mockRejectedValue(new Error("network"));
    vi.mocked(window.sessionStorage.getItem).mockImplementation((key: string) => key === "live_session_params" ? JSON.stringify({
      session_type: "hr",
      interviewer_index: 0,
      interviewer_slug: "ananya",
      interviewer_name: "Ananya",
      gender: "female",
      voice: "nova",
      session_type_label: "HR",
    }) : null);

    const LiveStartingPage = await importLiveStartingPage();
    render(<LiveStartingPage />);

    expect(await screen.findByText(/could not create the live interview/i)).toBeInTheDocument();
  });
});

describe("LiveInterviewSessionPage", () => {
  it("opens websocket from stored setup data and always shows the single fixed interviewer", async () => {
    // A stale higher interviewer_index (from before interviewers collapsed to
    // one entry) must safely fall back to Ananya, not crash or show garbage.
    vi.mocked(window.sessionStorage.getItem).mockImplementation((key: string) => key === "live_session_data" ? JSON.stringify({ session_id: "live-session-123", ticket_id: "ticket-1", ws_url: "/live/ws-ticket" }) : key === "live_session_type" ? "HR" : key === "live_session_interviewer" ? JSON.stringify({ session_id: "live-session-123", interviewer_index: 2, interviewer_name: "Meera", gender: "female", voice: "nova" }) : null);
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    expect(MockWebSocket.instances[0].url).toBe("ws://test.local/live/ws-ticket?ticket=ticket-1");
    act(() => { MockWebSocket.instances[0].open(); MockWebSocket.instances[0].emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 }); });
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
    expect(screen.getByText("1/6")).toBeInTheDocument();
    expect(screen.getByText("Ananya, AI Interviewer")).toBeInTheDocument();
  }, 15_000);

  it("streams the interviewer's question via transcript deltas, then enters listening on turn_complete", async () => {
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    const ws = MockWebSocket.instances[0];
    act(() => {
      ws.open();
      ws.emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 });
    });
    expect(screen.getByText(/interviewer speaking/i)).toBeInTheDocument();

    act(() => {
      ws.emit({ type: "interviewer_transcript_delta", text: "Tell me " });
      ws.emit({ type: "interviewer_transcript_delta", text: "about a difficult project." });
      // currentQuestion (what non-streaming phases render) is only set once
      // the final frame arrives — the delta stream alone drives visibleQuestionText.
      ws.emit({ type: "interviewer_transcript_final", text: "Tell me about a difficult project." });
    });
    expect(screen.getByText("Tell me about a difficult project.")).toBeInTheDocument();

    act(() => { ws.emit({ type: "turn_complete" }); });
    expect(screen.queryByText(/interviewer speaking/i)).not.toBeInTheDocument();
    expect(screen.getByText(/ananya is listening/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /done speaking/i })).not.toBeInTheDocument();
  });

  it("streams live transcript while listening and finalizes it when the candidate's turn closes, without sending a retired end_answer", async () => {
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    const ws = MockWebSocket.instances[0];
    act(() => {
      ws.open();
      ws.emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 });
      ws.emit({ type: "turn_complete" });
      ws.emit({ type: "candidate_turn_open" });
      ws.emit({ type: "transcript_partial", text: "I worked with a cross functional team" });
    });
    expect(screen.getByText("I worked with a cross functional team")).toBeInTheDocument();

    act(() => { ws.emit({ type: "candidate_turn_closed" }); });
    expect(screen.getByText(/reviewing answer/i)).toBeInTheDocument();
    expect(screen.getByText("Your answer")).toBeInTheDocument();
    expect(screen.getByText("I worked with a cross functional team")).toBeInTheDocument();
    expect(ws.send).not.toHaveBeenCalledWith(JSON.stringify({ type: "end_answer" }));
  });

  it("handles mic and camera failures with visible recovery", async () => {
    vi.mocked(navigator.mediaDevices.getUserMedia).mockImplementation((constraints) => {
      if ((constraints as MediaStreamConstraints).video) return Promise.reject(new Error("camera denied"));
      if ((constraints as MediaStreamConstraints).audio) return Promise.reject(new Error("mic denied"));
      return Promise.resolve(mediaStream());
    });
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    const ws = MockWebSocket.instances[0];
    act(() => { ws.open(); ws.emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 }); });
    expect(await screen.findByText(/camera unavailable/i)).toBeInTheDocument();
    expect(await screen.findByText(/microphone permission needs attention/i)).toBeInTheDocument();
    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(mediaStream());
    fireEvent.click(screen.getByRole("button", { name: /retry mic/i }));
    await waitFor(() => expect(screen.queryByText(/microphone permission needs attention/i)).not.toBeInTheDocument());
  });

  it("confirms end interview before sending end_interview, then routes to history not a report", async () => {
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    const ws = MockWebSocket.instances[0];
    act(() => { ws.open(); ws.emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 }); });
    fireEvent.click(screen.getByRole("button", { name: "End" }));
    const dialog = screen.getByRole("dialog", { name: /end interview early/i });
    expect(dialog).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "End" }));
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ type: "end_interview" }));
    expect(mocks.push).toHaveBeenCalledWith("/mock-interview/history");
  });

  it("uses backend report_id when interview completes", async () => {
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    act(() => { MockWebSocket.instances[0].open(); MockWebSocket.instances[0].emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 }); MockWebSocket.instances[0].emit({ type: "interview_complete", report_id: "report-from-backend", overall_score: 8.4 }); });
    fireEvent.click(screen.getByRole("button", { name: /view my report/i }));
    expect(mocks.push).toHaveBeenCalledWith("/mock-interview/report/report-from-backend");
  });

  it("recovers the room when the backend resumes a paused session", async () => {
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    const ws = MockWebSocket.instances[0];
    act(() => {
      ws.open();
      ws.emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 });
      ws.emit({ type: "session_paused", reason: "network", reconnect_token: "retry-token" });
    });

    expect(screen.getByRole("dialog", { name: /connection lost/i })).toBeInTheDocument();

    act(() => {
      ws.emit({ type: "session_resumed", session_id: "live-session-123", questions_asked: 2, total_questions: 6, current_question: "Next question" });
    });

    expect(screen.queryByRole("dialog", { name: /connection lost/i })).not.toBeInTheDocument();
    expect(screen.getByText("3/6")).toBeInTheDocument();
  });

  it("reconnects with a recovery ticket when the connection is interrupted", async () => {
    mocks.getLiveSessionState.mockResolvedValue({
      session_id: "live-session-123",
      status: "active",
      current_question: 2,
      questions_asked: 1,
      time_elapsed_s: 90,
      can_reconnect: true,
      reconnect_token: "reconnect-token",
    });
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    const ws = MockWebSocket.instances[0];
    act(() => {
      ws.open();
      ws.emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 });
      ws.onclose?.({ code: 1006 } as CloseEvent);
    });

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    await waitFor(() => expect(mocks.getLiveSessionState).toHaveBeenCalledWith("live-session-123"));
    expect(MockWebSocket.instances[1].url).toBe("ws://test.local/api/v1/mock-interview/live/live-session-123?ticket=reconnect-token");
  });

  it("shows and dismisses backend error messages without ending the room", async () => {
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    act(() => {
      MockWebSocket.instances[0].open();
      MockWebSocket.instances[0].emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 });
      MockWebSocket.instances[0].emit({ type: "error", code: "STT_TIMEOUT", message: "Speech service timed out. Please continue." });
    });

    expect(screen.getByText("Speech service timed out. Please continue.")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Speech service timed out. Please continue.").closest("div")!.querySelector("button")!);
    expect(screen.queryByText("Speech service timed out. Please continue.")).not.toBeInTheDocument();
  });

  it("mutes and unmutes interviewer audio by adjusting the persistent player's gain, without tearing it down", async () => {
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    const ws = MockWebSocket.instances[0];
    act(() => {
      ws.open();
      ws.emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 });
      // Base64 for two Int16 PCM samples — enough to create the player.
      ws.emit({ type: "interviewer_audio_delta", audio_base64: "AAABAA==" });
    });

    const gainNode = MockAudioContext.gainInstances.at(-1)!;
    expect(gainNode.gain.value).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: /mute interviewer audio/i }));
    expect(gainNode.gain.value).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: /unmute interviewer audio/i }));
    expect(gainNode.gain.value).toBe(1);
  });
});

describe("ReportPage", () => {
  it("loads completed report with summary, transcript and actions", async () => {
    mocks.params = { sessionId: "report-123" };
    mocks.getReport.mockResolvedValue(report());
    const ReportPage = await importReportPage();
    render(<ReportPage />);
    expect(await screen.findByText("Mock Interview Report")).toBeInTheDocument();
    expect(screen.getByText("Strong interview performance.")).toBeInTheDocument();
    expect(screen.getByText("Tell me about teamwork.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /share report/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download pdf/i })).toBeInTheDocument();
  });

  it("retries delayed report and then shows final not-found state", async () => {
    vi.useFakeTimers();
    mocks.params = { sessionId: "missing-report" };
    mocks.getReport.mockRejectedValue(new Error("404"));
    const ReportPage = await importReportPage();
    render(<ReportPage />);
    expect(screen.getByText(/preparing report/i)).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(7_500); });
    expect(screen.getByText("Report Not Found")).toBeInTheDocument();
    expect(mocks.getReport).toHaveBeenCalledTimes(6);
    fireEvent.click(screen.getByRole("button", { name: /view history/i }));
    expect(mocks.push).toHaveBeenCalledWith("/mock-interview/history");
  });

  it("recovers when delayed report succeeds and supports PDF/share actions", async () => {
    mocks.params = { sessionId: "eventual-report" };
    mocks.getReport.mockRejectedValueOnce(new Error("404")).mockResolvedValueOnce(report({ report_id: "eventual-report" }));
    mocks.downloadReportPdf.mockResolvedValue(undefined);
    mocks.shareReport.mockResolvedValue({ share_url: "https://careerbot.test/shared/report-token", token: "report-token", expires_at: "2026-07-24T00:00:00Z" });
    const ReportPage = await importReportPage();
    render(<ReportPage />);
    expect(await screen.findByText("Mock Interview Report", {}, { timeout: 2500 })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /download pdf/i }));
    await waitFor(() => expect(mocks.downloadReportPdf).toHaveBeenCalledWith("eventual-report"));
    fireEvent.click(screen.getByRole("button", { name: /share report/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /generate link/i }));
    await waitFor(() => expect(mocks.shareReport).toHaveBeenCalledWith("eventual-report"));
  });
});
