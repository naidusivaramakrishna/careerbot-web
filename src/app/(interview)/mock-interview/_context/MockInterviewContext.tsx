"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { getProfile } from "@/api/userApi";
import { recoverSession, getUserProgress, ActiveSession, UserProgress, LiveAvatarSession } from "@/api/mockInterviewApi";
import { getNotes } from "@/api/interviewPrepApi";
import logger from "@/lib/logger";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MockStageState {
  notes_generated: boolean;
  english_read: boolean;
  practice_answered: number;
  practice_total: number;
  readiness_passed: boolean;
  history_count: number;
}

interface MockInterviewContextValue {
  stageState: MockStageState;
  setNotesGenerated: (v: boolean) => void;
  setEnglishRead: (v: boolean) => void;
  setPracticeAnswered: (count: number) => void;
  setPracticeTotal: (count: number) => void;
  setReadinessPassed: (v: boolean) => void;
  // User identity
  userId: string | null;
  // Session recovery
  activeSession: ActiveSession | null;
  dismissActiveSession: () => void;
  // Consent (DPDP compliance)
  // Progress summary
  userProgress: UserProgress | null;
  progressLoading: boolean;
  // In-memory-only relay for the LiveAvatar session (livekit_client_token is a
  // live credential — interview-avatar.txt says never store it in
  // localStorage/sessionStorage/logs). Set by the "starting" page right after
  // POST /live/create, consumed once by the session page on mount.
  setPendingAvatarSession: (sessionId: string, avatar: LiveAvatarSession | null) => void;
  consumePendingAvatarSession: (sessionId: string) => LiveAvatarSession | null;
}

// ─── Default state ────────────────────────────────────────────────────────────

const DEFAULT_STATE: MockStageState = {
  notes_generated: false,
  english_read: false,
  practice_answered: 0,
  practice_total: 0,
  readiness_passed: false,
  history_count: 0,
};

// ─── Context ──────────────────────────────────────────────────────────────────

const MockInterviewContext = createContext<MockInterviewContextValue | null>(null);

export function MockInterviewProvider({ children }: { children: ReactNode }) {
  const [stageState, setStageState] = useState<MockStageState>(DEFAULT_STATE);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(true);

  // ── Bootstrap: fetch user id + session recovery + progress ──
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setProgressLoading(true);
      try {
        // Fetch in parallel — independent calls
        const [profile, sessionData, progress] = await Promise.allSettled([
          getProfile(),
          recoverSession(),
          getUserProgress(),
        ]);

        if (cancelled) return;

        let resolvedUserId: string | null = null;
        if (profile.status === "fulfilled") {
          resolvedUserId = profile.value.id ?? null;
          setUserId(resolvedUserId);
          logger.debug("🔑 Mock interview user id:", resolvedUserId);
        }

        // Check if notes already exist for this resume so sidebar unlocks Practice/Technical
        const resumeId = localStorage.getItem("current_resume_id");
        if (resumeId) {
          getNotes(resumeId)
            .then((record) => {
              if (!cancelled && record?.notes) {
                setStageState((s) => ({ ...s, notes_generated: true }));
              }
            })
            .catch(() => { /* 404 = no notes yet, stay false */ });
        }

        if (sessionData.status === "fulfilled") {
          setActiveSession(sessionData.value.active_session);
          if (sessionData.value.active_session) {
            logger.info("🔄 Active session found:", sessionData.value.active_session.session_id);
          }
        }

        if (progress.status === "fulfilled") {
          setUserProgress(progress.value);
          const p = progress.value;
          // If there's an active practice session, derive answered count from
          // questions_remaining so the sidebar shows real progress, not a historical 10/10
          const activeS = sessionData.status === "fulfilled" ? sessionData.value.active_session : null;
          const isPractice = activeS && !activeS.type.startsWith("live");
          const practiceTotal = 10; // practice sessions always have 10 questions (API default)
          const practiceAnswered = isPractice
            ? Math.max(0, practiceTotal - (activeS.questions_remaining ?? 0))
            : p.practice_rounds > 0 ? practiceTotal : 0;

          setStageState((s) => ({
            ...s,
            practice_answered: practiceAnswered,
            practice_total: p.practice_rounds > 0 || isPractice ? practiceTotal : 0,
            history_count: p.total_sessions,
          }));
        }
      } catch (err) {
        logger.error("❌ MockInterviewContext bootstrap error:", err);
      } finally {
        if (!cancelled) setProgressLoading(false);
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, []);

  const setNotesGenerated = useCallback((v: boolean) =>
    setStageState((s) => ({ ...s, notes_generated: v })), []);

  const setEnglishRead = useCallback((v: boolean) =>
    setStageState((s) => ({ ...s, english_read: v })), []);

  const setPracticeAnswered = useCallback((count: number) =>
    setStageState((s) => ({ ...s, practice_answered: count })), []);

  const setPracticeTotal = useCallback((count: number) =>
    setStageState((s) => ({ ...s, practice_total: count })), []);

  const setReadinessPassed = useCallback((v: boolean) =>
    setStageState((s) => ({ ...s, readiness_passed: v })), []);

  const dismissActiveSession = useCallback(() => setActiveSession(null), []);

  // Ref, not state: this never needs to trigger a render, and keeping it out
  // of state avoids it ever being logged/persisted alongside the rest.
  const pendingAvatarRef = useRef<{ sessionId: string; avatar: LiveAvatarSession | null } | null>(null);

  const setPendingAvatarSession = useCallback((sessionId: string, avatar: LiveAvatarSession | null) => {
    pendingAvatarRef.current = { sessionId, avatar };
  }, []);

  const consumePendingAvatarSession = useCallback((sessionId: string) => {
    const pending = pendingAvatarRef.current;
    if (!pending || pending.sessionId !== sessionId) return null;
    pendingAvatarRef.current = null; // one-time use
    return pending.avatar;
  }, []);

  return (
    <MockInterviewContext.Provider
      value={{
        stageState,
        setNotesGenerated,
        setEnglishRead,
        setPracticeAnswered,
        setPracticeTotal,
        setReadinessPassed,
        userId,
        activeSession,
        dismissActiveSession,
        userProgress,
        progressLoading,
        setPendingAvatarSession,
        consumePendingAvatarSession,
      }}
    >
      {children}
    </MockInterviewContext.Provider>
  );
}

export function useMockInterview(): MockInterviewContextValue {
  const ctx = useContext(MockInterviewContext);
  if (!ctx) throw new Error("useMockInterview must be used inside MockInterviewProvider");
  return ctx;
}
