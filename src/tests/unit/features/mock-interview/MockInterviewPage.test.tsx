import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  pathname: "/mock-interview/live",
  params: { sessionId: "live-session-123" } as Record<string, string>,
  consentGiven: true,
  setConsentGiven: vi.fn(),
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
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), prefetch: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  usePathname: () => mocks.pathname,
  useParams: () => mocks.params,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/app/(interview)/mock-interview/_context/MockInterviewContext", () => ({
  useMockInterview: () => ({
    stageState: mocks.stageState,
    consentGiven: mocks.consentGiven,
    setConsentGiven: mocks.setConsentGiven,
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

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, { get: (_target, tag: string) => ({ children, ...props }: any) => React.createElement(tag, props, children) }),
}));

vi.mock("next/image", () => ({
  default: ({ priority, fill, sizes, ...props }: any) => React.createElement("img", props),
}));

class MockAudio {
  static instances: MockAudio[] = [];
  volume = 1;
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
const importLiveSetupPage = async () => (await import("@/app/(interview)/mock-interview/live/page")).default;
const importLiveSessionPage = async () => (await import("@/app/(interview)/mock-interview/live/[sessionId]/page")).default;
const importReportPage = async () => (await import("@/app/(interview)/mock-interview/report/[sessionId]/page")).default;

beforeEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  mocks.pathname = "/mock-interview/live";
  mocks.params = { sessionId: "live-session-123" };
  mocks.consentGiven = true;
  mocks.stageState = { notes_generated: false, english_read: false, practice_answered: 0, practice_total: 0, readiness_passed: false, history_count: 0 };
  mocks.buildWsUrl.mockImplementation((url: string) => `ws://test.local${url}`);
  MockAudio.instances = [];
  MockWebSocket.instances = [];
  vi.stubGlobal("Audio", MockAudio);
  vi.stubGlobal("WebSocket", MockWebSocket);
  vi.stubGlobal("ResizeObserver", class { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn(); });
  vi.stubGlobal("AudioContext", class { state = "running"; destination = {}; createOscillator() { return { type: "sine", frequency: { value: 0 }, connect: vi.fn(), start: vi.fn(), stop: vi.fn() }; } createGain() { return { gain: { value: 0 }, connect: vi.fn() }; } createAnalyser() { return { fftSize: 0, smoothingTimeConstant: 0, frequencyBinCount: 32, connect: vi.fn(), getByteFrequencyData: vi.fn((data: Uint8Array) => data.fill(20)) }; } createMediaStreamSource() { return { connect: vi.fn() }; } createMediaElementSource() { return { connect: vi.fn() }; } resume() { return Promise.resolve(); } close() { return Promise.resolve(); } });
  Object.defineProperty(window, "sessionStorage", { configurable: true, value: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() } });
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { enumerateDevices: vi.fn().mockResolvedValue([{ kind: "audioinput", deviceId: "mic-1", label: "Studio Mic" }, { kind: "videoinput", deviceId: "cam-1", label: "Webcam" }]), getUserMedia: vi.fn().mockResolvedValue(mediaStream()) } });
  Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
  Object.defineProperty(document.documentElement, "requestFullscreen", { configurable: true, value: vi.fn(() => Promise.resolve()) });
  Object.defineProperty(HTMLMediaElement.prototype, "srcObject", { configurable: true, get() { return (this as any).__srcObject ?? null; }, set(value) { (this as any).__srcObject = value; } });
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:mock-audio") });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
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
    expect(screen.getByLabelText("Session progress 0 of 2")).toHaveTextContent("0/2");
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

describe("LiveSetupPage", () => {
  it("requires consent before preflight and returns to landing on decline", async () => {
    mocks.consentGiven = false;
    const LiveSetupPage = await importLiveSetupPage();
    render(<LiveSetupPage />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mocks.push).toHaveBeenCalledWith("/mock-interview");
  });

  it("runs device checks before setup", async () => {
    const LiveSetupPage = await importLiveSetupPage();
    render(<LiveSetupPage />);
    fireEvent.click(screen.getByRole("button", { name: /test microphone/i }));
    await waitFor(() => expect(screen.getByText(/microphone is available/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /test camera/i }));
    await waitFor(() => expect(screen.getByText(/camera preview is working/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /test speaker/i }));
    await waitFor(() => expect(screen.getByText(/speaker test completed/i)).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText(/quiet environment confirmed/i));
    fireEvent.click(screen.getByRole("button", { name: /continue to interview setup/i }));
    expect(screen.getByRole("button", { name: /start interview now/i })).toBeInTheDocument();
  });

  it("starts direct live interview and stores session data", async () => {
    mocks.createLiveSession.mockResolvedValue({ session_id: "created-session", ticket_id: "ticket-1", ticket_expires_at: "2026-07-17T10:00:00Z", ws_url: "/ws" });
    const LiveSetupPage = await importLiveSetupPage();
    render(<LiveSetupPage />);
    fireEvent.click(screen.getByRole("button", { name: /test microphone/i }));
    await waitFor(() => expect(screen.getByText(/microphone is available/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /test camera/i }));
    await waitFor(() => expect(screen.getByText(/camera preview is working/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /test speaker/i }));
    await waitFor(() => expect(screen.getByText(/speaker test completed/i)).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText(/quiet environment confirmed/i));
    fireEvent.click(screen.getByRole("button", { name: /continue to interview setup/i }));
    fireEvent.click(screen.getByRole("button", { name: "Technical" }));
    fireEvent.click(screen.getByRole("button", { name: /start interview now/i }));
    await waitFor(() => expect(mocks.createLiveSession).toHaveBeenCalledWith({ session_type: "technical", enable_streaming_stt: true }));
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith("live_session_type", "Technical");
    expect(mocks.push).toHaveBeenCalledWith("/mock-interview/live/created-session");
  });

  it("surfaces create-session failure", async () => {
    mocks.createLiveSession.mockRejectedValue(new Error("network"));
    const LiveSetupPage = await importLiveSetupPage();
    render(<LiveSetupPage />);
    fireEvent.click(screen.getByRole("button", { name: /test microphone/i }));
    await waitFor(() => expect(screen.getByText(/microphone is available/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /test camera/i }));
    await waitFor(() => expect(screen.getByText(/camera preview is working/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /test speaker/i }));
    await waitFor(() => expect(screen.getByText(/speaker test completed/i)).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText(/quiet environment confirmed/i));
    fireEvent.click(screen.getByRole("button", { name: /continue to interview setup/i }));
    fireEvent.click(screen.getByRole("button", { name: /start interview now/i }));
    expect(await screen.findByText(/we could not create the live interview/i)).toBeInTheDocument();
  });
});

describe("LiveInterviewSessionPage", () => {
  it("opens websocket from stored setup data", async () => {
    vi.mocked(window.sessionStorage.getItem).mockImplementation((key: string) => key === "live_session_data" ? JSON.stringify({ session_id: "live-session-123", ticket_id: "ticket-1", ws_url: "/live/ws-ticket" }) : key === "live_session_type" ? "HR" : null);
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    expect(MockWebSocket.instances[0].url).toBe("ws://test.local/live/ws-ticket?ticket=ticket-1");
    act(() => { MockWebSocket.instances[0].open(); MockWebSocket.instances[0].emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 }); });
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
    expect(screen.getByText("1/6")).toBeInTheDocument();
  });

  it("reveals question word by word, then enters listening mode", async () => {
    vi.useFakeTimers();
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    act(() => { MockWebSocket.instances[0].open(); MockWebSocket.instances[0].emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 }); MockWebSocket.instances[0].emit({ type: "question_audio", question_number: 1, text: "Tell me about a difficult project you handled.", audio: null, time_limit_s: 60 }); });
    expect(screen.getByText(/interviewer speaking/i)).toBeInTheDocument();
    expect(screen.queryByText("Tell me about a difficult project you handled.")).not.toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(115); });
    expect(screen.getByText(/^Tell\s*$/)).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(2_000); });
    expect(screen.getByText("Tell me about a difficult project you handled.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /done speaking/i })).toBeInTheDocument();
  });

  it("shows transcript updates and sends end_answer", async () => {
    vi.useFakeTimers();
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    const ws = MockWebSocket.instances[0];
    act(() => { ws.open(); ws.emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 }); ws.emit({ type: "question_audio", question_number: 1, text: "Tell me about teamwork.", audio: null, time_limit_s: 60 }); vi.advanceTimersByTime(1_600); ws.emit({ type: "partial_transcript", text: "I worked with a cross functional team" }); });
    expect(screen.getByText("I worked with a cross functional team")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /done speaking/i }));
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ type: "end_answer" }));
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
    act(() => { ws.open(); ws.emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 }); ws.emit({ type: "question_audio", question_number: 1, text: "Answer this.", audio: null, time_limit_s: 60 }); });
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 1600)); });
    expect(await screen.findByText(/camera unavailable/i)).toBeInTheDocument();
    expect(await screen.findByText(/microphone permission needs attention/i)).toBeInTheDocument();
    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(mediaStream());
    fireEvent.click(screen.getByRole("button", { name: /retry mic/i }));
    await waitFor(() => expect(screen.queryByText(/microphone access is unavailable/i)).not.toBeInTheDocument());
  });

  it("confirms end interview before sending end_interview", async () => {
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    const ws = MockWebSocket.instances[0];
    act(() => { ws.open(); ws.emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 }); });
    fireEvent.click(screen.getByRole("button", { name: /^end$/i }));
    expect(screen.getByRole("dialog", { name: /end interview early/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /end & get report/i }));
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ type: "end_interview" }));
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

  it("auto-submits the answer when the question timer reaches zero", async () => {
    vi.useFakeTimers();
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    const ws = MockWebSocket.instances[0];
    act(() => {
      ws.open();
      ws.emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 });
      ws.emit({ type: "question_audio", question_number: 1, text: "Keep it concise.", audio: null, time_limit_s: 2 });
      vi.advanceTimersByTime(1_600);
    });

    expect(screen.getByRole("timer", { name: /time remaining: 2 seconds/i })).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(2_000); });

    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ type: "end_answer" }));
    expect(screen.getByText(/reviewing answer/i)).toBeInTheDocument();
  });

  it("pauses and resumes interviewer audio from the speaker control", async () => {
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    act(() => {
      MockWebSocket.instances[0].open();
      MockWebSocket.instances[0].emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 });
      MockWebSocket.instances[0].emit({ type: "question_audio", question_number: 1, text: "Can you introduce yourself?", audio: "AA==", time_limit_s: 60 });
    });

    const audio = MockAudio.instances.at(-1)!;
    fireEvent.click(screen.getByRole("button", { name: /mute interviewer audio/i }));
    expect(audio.pause).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /unmute interviewer audio/i }));
    expect(audio.play).toHaveBeenCalledTimes(2);
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
