import React from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";

// mock-interview-simli-avatar.txt — dedicated coverage for the Simli avatar
// integration (joinAvatar, the audio-relay rule, the mute guard, and
// cleanup), kept separate from the main live-session WS protocol suite.

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  params: { sessionId: "live-session-123" } as Record<string, string>,
  setPendingAvatarSession: vi.fn(),
  consumePendingAvatarSession: vi.fn(() => null as unknown),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace, prefetch: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  usePathname: () => "/mock-interview/live",
  useParams: () => mocks.params,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/app/(interview)/mock-interview/_context/MockInterviewContext", () => ({
  useMockInterview: () => ({
    stageState: { notes_generated: false, english_read: false, practice_answered: 0, practice_total: 0, readiness_passed: false, history_count: 0 },
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
    // In-memory relay from the "starting" page — each test sets a return
    // value for consumePendingAvatarSession to control whether an avatar
    // session is handed off on mount.
    setPendingAvatarSession: mocks.setPendingAvatarSession,
    consumePendingAvatarSession: mocks.consumePendingAvatarSession,
  }),
}));

vi.mock("@/api/mockInterviewApi", () => ({
  createLiveSession: vi.fn(),
  getReport: vi.fn(),
  downloadReportPdf: vi.fn(),
  buildWsUrl: vi.fn((url: string) => `ws://test.local${url}`),
}));

type ImageMockProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  priority?: boolean;
  fill?: boolean;
  unoptimized?: boolean;
};
vi.mock("next/image", () => ({
  default: (props: ImageMockProps) => {
    const imgProps: React.ImgHTMLAttributes<HTMLImageElement> = { ...props };
    delete (imgProps as ImageMockProps).priority;
    delete (imgProps as ImageMockProps).fill;
    delete (imgProps as ImageMockProps).unoptimized;
    return React.createElement("img", imgProps);
  },
}));

// Fakes the real simli-client SDK shape (constructor args, .on/.start/.stop/
// .sendAudioData) so joinAvatar's dynamic import("simli-client") resolves to
// this instead of the real WebRTC client.
class MockSimliClient {
  static instances: MockSimliClient[] = [];
  // When set, the NEXT client's start() returns this pending promise so a test
  // can reject it at a moment of its choosing (after asserting "connecting").
  static pendingStart: { promise: Promise<void>; reject: (e: Error) => void } | null = null;
  listeners = new Map<string, Array<(...args: unknown[]) => void>>();
  start = vi.fn(() => MockSimliClient.pendingStart?.promise ?? Promise.resolve());
  stop = vi.fn(() => Promise.resolve());
  sendAudioData = vi.fn();
  constructor(
    public session_token: string,
    public videoElement: HTMLVideoElement,
    public audioElement: HTMLAudioElement,
    public iceServers: unknown,
    public logLevel: unknown,
    public transport: string,
  ) {
    MockSimliClient.instances.push(this);
  }
  on(event: string, cb: (...args: unknown[]) => void) {
    const list = this.listeners.get(event) ?? [];
    list.push(cb);
    this.listeners.set(event, list);
  }
  emit(event: string, ...args: unknown[]) {
    this.listeners.get(event)?.forEach((cb) => cb(...args));
  }
}

vi.mock("simli-client", () => ({
  SimliClient: MockSimliClient,
  LogLevel: { DEBUG: 0, INFO: 1, ERROR: 2, CRITICAL: 3 },
}));

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

// Covers the mic-capture pipeline and the PCM interviewer-audio player that
// the live session page also spins up regardless of avatar provider.
class MockAudioContext {
  static scriptProcessors: { onaudioprocess: null | ((event: unknown) => void) }[] = [];
  // Each interviewer_audio_delta played locally (playDelta) creates exactly
  // one buffer source — count of these is how tests verify whether playDelta
  // ran for a given delta, without caring about the decoded sample content.
  static bufferSourcesCreated = 0;
  state: string = "running";
  destination = {};
  currentTime = 0;
  sampleRate: number;
  constructor(options?: { sampleRate?: number }) { this.sampleRate = options?.sampleRate ?? 48000; }
  createOscillator() { return { type: "sine", frequency: { value: 0 }, connect: vi.fn(), start: vi.fn(), stop: vi.fn() }; }
  createGain() { return { gain: { value: 1 }, connect: vi.fn() }; }
  createAnalyser() { return { fftSize: 0, smoothingTimeConstant: 0, frequencyBinCount: 32, connect: vi.fn(), getByteFrequencyData: vi.fn((data: Uint8Array) => data.fill(20)) }; }
  createMediaStreamSource() { return { connect: vi.fn() }; }
  createScriptProcessor() {
    const processor = { connect: vi.fn(), disconnect: vi.fn(), onaudioprocess: null as ((event: unknown) => void) | null };
    MockAudioContext.scriptProcessors.push(processor);
    return processor;
  }
  createBuffer(_channels: number, length: number, sampleRate: number) {
    return { getChannelData: () => new Float32Array(length), duration: length / sampleRate };
  }
  createBufferSource() {
    MockAudioContext.bufferSourcesCreated += 1;
    return { buffer: null as unknown, connect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null as (() => void) | null };
  }
  resume() { return Promise.resolve(); }
  close() { return Promise.resolve(); }
}

function mediaStream() {
  return { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
}

function simliAvatarSession(overrides = {}) {
  return {
    provider: "simli" as const,
    session_token: "sim-token-1",
    face_id: "face-1",
    transport: "simli-client" as const,
    audio_input_format: "pcm16;rate=16000",
    max_session_length: 1200,
    max_idle_time: 300,
    ...overrides,
  };
}

const importLiveSessionPage = async () => (await import("@/app/(interview)/mock-interview/live/[sessionId]/page")).default;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.params = { sessionId: "live-session-123" };
  mocks.consumePendingAvatarSession.mockReturnValue(null);
  MockWebSocket.instances = [];
  MockSimliClient.instances = [];
  MockSimliClient.pendingStart = null;
  MockAudioContext.scriptProcessors = [];
  MockAudioContext.bufferSourcesCreated = 0;
  vi.stubGlobal("WebSocket", MockWebSocket);
  vi.stubGlobal("AudioContext", MockAudioContext);
  vi.stubGlobal("ResizeObserver", class { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn(); });
  Object.defineProperty(window, "sessionStorage", { configurable: true, value: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() } });
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { enumerateDevices: vi.fn().mockResolvedValue([{ kind: "audioinput", deviceId: "mic-1", label: "Studio Mic" }, { kind: "videoinput", deviceId: "cam-1", label: "Webcam" }]), getUserMedia: vi.fn().mockResolvedValue(mediaStream()) } });
  Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
  Object.defineProperty(document.documentElement, "requestFullscreen", { configurable: true, value: vi.fn(() => Promise.resolve()) });
  Object.defineProperty(HTMLMediaElement.prototype, "srcObject", {
    configurable: true,
    get() { return (this as HTMLMediaElement & { __srcObject?: MediaStream | null }).__srcObject ?? null; },
    set(value: MediaStream | null) { (this as HTMLMediaElement & { __srcObject?: MediaStream | null }).__srcObject = value; },
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Simli avatar integration", () => {
  it("never constructs a Simli client when avatar is null — stays on the static fallback", async () => {
    mocks.consumePendingAvatarSession.mockReturnValue(null);
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    act(() => { MockWebSocket.instances[0].open(); MockWebSocket.instances[0].emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 }); });

    expect(screen.getByAltText("Ananya, AI interviewer")).toBeInTheDocument();
    expect(MockSimliClient.instances).toHaveLength(0);
  });

  it("connects with the session's Simli fields and goes live on the SDK's start event", async () => {
    mocks.consumePendingAvatarSession.mockReturnValue(simliAvatarSession());
    const LiveSessionPage = await importLiveSessionPage();
    const { container } = render(<LiveSessionPage />);
    act(() => { MockWebSocket.instances[0].open(); MockWebSocket.instances[0].emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 }); });

    await waitFor(() => expect(MockSimliClient.instances).toHaveLength(1));
    const client = MockSimliClient.instances[0];

    // ALWAYS branch on avatar.provider — constructor args match the real
    // session_token/videoElement/audioElement/iceServers/logLevel/transport
    // signature (mock-interview-simli-avatar.txt §4).
    expect(client.session_token).toBe("sim-token-1");
    expect(client.videoElement).toBe(container.querySelector("video"));
    expect(client.audioElement).toBe(container.querySelector("audio"));
    expect(client.iceServers).toBeNull();
    expect(client.transport).toBe("livekit");

    expect(screen.getByAltText("Ananya, AI interviewer")).toBeInTheDocument();
    act(() => { client.emit("start"); });
    expect(screen.queryByAltText("Ananya, AI interviewer")).not.toBeInTheDocument();
  });

  it("falls back to the static photo if the Simli SDK reports an error mid-session", async () => {
    mocks.consumePendingAvatarSession.mockReturnValue(simliAvatarSession());
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    act(() => { MockWebSocket.instances[0].open(); MockWebSocket.instances[0].emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 }); });

    await waitFor(() => expect(MockSimliClient.instances).toHaveLength(1));
    const client = MockSimliClient.instances[0];
    act(() => { client.emit("start"); });
    expect(screen.queryByAltText("Ananya, AI interviewer")).not.toBeInTheDocument();

    // No reconnect path for Simli — an error just falls back silently, same
    // as any other avatar-unavailable path (mock-interview-simli-avatar.txt §6).
    act(() => { client.emit("error", "stream_lost"); });
    expect(screen.getByAltText("Ananya, AI interviewer")).toBeInTheDocument();
  });

  it("falls back, re-mutes and stops the client if client.start() rejects", async () => {
    let rejectStart!: (e: Error) => void;
    const promise = new Promise<void>((_, reject) => { rejectStart = reject; });
    promise.catch(() => {});
    MockSimliClient.pendingStart = { promise, reject: (e) => rejectStart(e) };
    mocks.consumePendingAvatarSession.mockReturnValue(simliAvatarSession());
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    act(() => { MockWebSocket.instances[0].open(); MockWebSocket.instances[0].emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 }); });

    await waitFor(() => expect(MockSimliClient.instances).toHaveLength(1));
    const client = MockSimliClient.instances[0];
    // Still connecting: the overlay is up (so the assertion below is not vacuous).
    expect(screen.getByText("Connecting avatar…")).toBeInTheDocument();

    await act(async () => { MockSimliClient.pendingStart!.reject(new Error("connect failed")); });

    await waitFor(() => expect(screen.queryByText("Connecting avatar…")).not.toBeInTheDocument());
    expect(screen.getByAltText("Ananya, AI interviewer")).toBeInTheDocument();
    expect(client.stop).toHaveBeenCalledTimes(1);
    expect(client.audioElement.muted).toBe(true);
  });

  it("stops the Simli client when the SDK reports an error", async () => {
    mocks.consumePendingAvatarSession.mockReturnValue(simliAvatarSession());
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    act(() => { MockWebSocket.instances[0].open(); MockWebSocket.instances[0].emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 }); });

    await waitFor(() => expect(MockSimliClient.instances).toHaveLength(1));
    const client = MockSimliClient.instances[0];
    act(() => { client.emit("start"); });
    act(() => { client.emit("error", "stream_lost"); });
    expect(client.stop).toHaveBeenCalledTimes(1);
  });

  it("stops the Simli client when the socket drops mid-interview (abnormal close)", async () => {
    mocks.consumePendingAvatarSession.mockReturnValue(simliAvatarSession());
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    act(() => { MockWebSocket.instances[0].open(); MockWebSocket.instances[0].emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 }); });

    await waitFor(() => expect(MockSimliClient.instances).toHaveLength(1));
    const client = MockSimliClient.instances[0];
    act(() => { client.emit("start"); });
    act(() => { MockWebSocket.instances[0].onclose?.({ code: 1006 } as CloseEvent); });
    expect(client.stop).toHaveBeenCalledTimes(1);
  });

  it("always forwards interviewer_audio_delta into the Simli client, live or not (the audio-relay rule)", async () => {
    mocks.consumePendingAvatarSession.mockReturnValue(simliAvatarSession());
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    act(() => { MockWebSocket.instances[0].open(); MockWebSocket.instances[0].emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 }); });

    await waitFor(() => expect(MockSimliClient.instances).toHaveLength(1));
    const client = MockSimliClient.instances[0];

    // Before "start": Simli still needs the audio to render lip-sync once it
    // comes up, even though its own output isn't the audible source yet.
    act(() => { MockWebSocket.instances[0].emit({ type: "interviewer_audio_delta", audio_base64: "AAABAA==" }); });
    expect(client.sendAudioData).toHaveBeenCalledTimes(1);
    expect(client.sendAudioData.mock.calls[0][0]).toBeInstanceOf(Uint8Array);

    // After "start": still forwarded, now as the sole source of what the
    // candidate actually hears.
    act(() => { client.emit("start"); });
    act(() => { MockWebSocket.instances[0].emit({ type: "interviewer_audio_delta", audio_base64: "AAABAA==" }); });
    expect(client.sendAudioData).toHaveBeenCalledTimes(2);
  });

  it("plays locally via playDelta before Simli is live, then switches to Simli's own rendered audio once live (the one audio rule, same as the old HeyGen/LiveAvatar integration)", async () => {
    mocks.consumePendingAvatarSession.mockReturnValue(simliAvatarSession());
    const LiveSessionPage = await importLiveSessionPage();
    const { container } = render(<LiveSessionPage />);
    act(() => { MockWebSocket.instances[0].open(); MockWebSocket.instances[0].emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 }); });

    await waitFor(() => expect(MockSimliClient.instances).toHaveLength(1));
    const client = MockSimliClient.instances[0];
    const audioEl = container.querySelector("audio") as HTMLAudioElement;
    expect(audioEl.muted).toBe(true);

    // Not live yet — playDelta is the audible source.
    act(() => { MockWebSocket.instances[0].emit({ type: "interviewer_audio_delta", audio_base64: "AAABAA==" }); });
    expect(MockAudioContext.bufferSourcesCreated).toBe(1);

    // Simli goes live — its own rendered audio becomes the source, unmuted,
    // and playDelta is skipped for every delta from here on.
    act(() => { client.emit("start"); });
    expect(audioEl.muted).toBe(false);

    act(() => { MockWebSocket.instances[0].emit({ type: "interviewer_audio_delta", audio_base64: "AAABAA==" }); });
    expect(MockAudioContext.bufferSourcesCreated).toBe(1); // unchanged — not played locally
  });

  it("falls back to playDelta and re-mutes Simli's audio if the SDK errors mid-session", async () => {
    mocks.consumePendingAvatarSession.mockReturnValue(simliAvatarSession());
    const LiveSessionPage = await importLiveSessionPage();
    const { container } = render(<LiveSessionPage />);
    act(() => { MockWebSocket.instances[0].open(); MockWebSocket.instances[0].emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 }); });

    await waitFor(() => expect(MockSimliClient.instances).toHaveLength(1));
    const client = MockSimliClient.instances[0];
    const audioEl = container.querySelector("audio") as HTMLAudioElement;

    act(() => { client.emit("start"); });
    expect(audioEl.muted).toBe(false);

    act(() => { client.emit("error", "stream_lost"); });
    expect(audioEl.muted).toBe(true);

    act(() => { MockWebSocket.instances[0].emit({ type: "interviewer_audio_delta", audio_base64: "AAABAA==" }); });
    expect(MockAudioContext.bufferSourcesCreated).toBe(1); // playDelta resumed
  });

  it("mirrors the candidate's mute toggle onto Simli's audio element once it's live", async () => {
    mocks.consumePendingAvatarSession.mockReturnValue(simliAvatarSession());
    const LiveSessionPage = await importLiveSessionPage();
    const { container } = render(<LiveSessionPage />);
    act(() => { MockWebSocket.instances[0].open(); MockWebSocket.instances[0].emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 }); });

    await waitFor(() => expect(MockSimliClient.instances).toHaveLength(1));
    const client = MockSimliClient.instances[0];
    const audioEl = container.querySelector("audio") as HTMLAudioElement;

    act(() => { client.emit("start"); });
    expect(audioEl.muted).toBe(false);

    const muteButton = screen.getByRole("button", { name: /mute interviewer audio/i });
    act(() => { muteButton.click(); });
    expect(audioEl.muted).toBe(true);

    act(() => { screen.getByRole("button", { name: /unmute interviewer audio/i }).click(); });
    expect(audioEl.muted).toBe(false);
  });

  it("stops the Simli client on unmount", async () => {
    mocks.consumePendingAvatarSession.mockReturnValue(simliAvatarSession());
    const LiveSessionPage = await importLiveSessionPage();
    const { unmount } = render(<LiveSessionPage />);
    act(() => { MockWebSocket.instances[0].open(); MockWebSocket.instances[0].emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 }); });

    await waitFor(() => expect(MockSimliClient.instances).toHaveLength(1));
    const client = MockSimliClient.instances[0];
    unmount();
    expect(client.stop).toHaveBeenCalledTimes(1);
  });

  it("stops the Simli client when the interview completes", async () => {
    mocks.consumePendingAvatarSession.mockReturnValue(simliAvatarSession());
    const LiveSessionPage = await importLiveSessionPage();
    render(<LiveSessionPage />);
    act(() => { MockWebSocket.instances[0].open(); MockWebSocket.instances[0].emit({ type: "session_ready", session_id: "live-session-123", total_questions: 6, estimated_duration_m: 20 }); });

    await waitFor(() => expect(MockSimliClient.instances).toHaveLength(1));
    const client = MockSimliClient.instances[0];

    act(() => { MockWebSocket.instances[0].emit({ type: "interview_complete", report_id: "r1", overall_score: 80 }); });
    expect(client.stop).toHaveBeenCalledTimes(1);
  });
});
