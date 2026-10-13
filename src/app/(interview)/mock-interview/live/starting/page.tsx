"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createLiveSession } from "@/api/mockInterviewApi";
import { getInterviewerByIndex, isVoiceMatchedToGender } from "../../_lib/interviewers";
import { useMockInterview } from "../../_context/MockInterviewContext";
import { Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

interface SessionParams {
  session_type: "hr" | "technical" | "managerial";
  resume_id?: string;
  target_role?: string;
  // voice is presentation-only now (picks which avatar/name to show) — the
  // backend no longer accepts a voice field; the AI provider assigns its own.
  voice: string;
  interviewer_index: number;
  interviewer_slug?: string;
  interviewer_name: string;
  gender: string;
  session_type_label: string;
}

export default function LiveStartingPage() {
  const router = useRouter();
  const { setPendingAvatarSession } = useMockInterview();
  const [error, setError] = useState<string | null>(null);
  const calledRef = useRef(false);

  useEffect(() => {
    // Guard against StrictMode double-invoke
    if (calledRef.current) return;
    calledRef.current = true;

    const raw = sessionStorage.getItem("live_session_params");
    if (!raw) {
      router.replace("/mock-interview/live");
      return;
    }

    let params: SessionParams;
    try {
      params = JSON.parse(raw) as SessionParams;
    } catch {
      router.replace("/mock-interview/live");
      return;
    }

    sessionStorage.removeItem("live_session_params");
    const selectedInterviewer = getInterviewerByIndex(params.interviewer_index);
    const fallbackVoice = params.gender === "female" ? "nova" : "alloy";
    // voice is presentation-only (which avatar/name to render) — not sent to
    // the backend, which no longer accepts it and assigns its own AI voice.
    const voice = selectedInterviewer?.voice ?? (isVoiceMatchedToGender(params.voice, params.gender) ? params.voice : fallbackVoice);
    const interviewerName = selectedInterviewer?.name ?? params.interviewer_name;
    const interviewerGender = selectedInterviewer?.gender ?? params.gender;

    const onSuccess = (data: Awaited<ReturnType<typeof createLiveSession>>) => {
      // session_token is a live credential — mock-interview-simli-avatar.txt
      // says never store it (localStorage/sessionStorage/logs). Relay it
      // in-memory via context instead; everything else is fine in sessionStorage.
      const { avatar, ...storable } = data;
      setPendingAvatarSession(data.session_id, avatar);
      sessionStorage.setItem("live_session_data", JSON.stringify(storable));
      sessionStorage.setItem("live_session_type", params.session_type_label);
      sessionStorage.setItem(
        "live_session_interviewer",
        JSON.stringify({
          session_id: data.session_id,
          interviewer_index: params.interviewer_index,
          interviewer_name: interviewerName,
          gender: interviewerGender,
          voice,
        }),
      );
      router.replace(`/mock-interview/live/${data.session_id}`);
    };

    createLiveSession({
      session_type: params.session_type,
      resume_id: params.resume_id,
      target_role: params.target_role,
    })
      .then(onSuccess)
      .catch(() => {
        setError("Could not create the live interview. Please check your connection and try again.");
      });
  }, [router, setPendingAvatarSession]);

  return <main className="mi-session-state"><section className="mi-panel mi-state-card" aria-live="polite"><span className="mi-icon-tile">{error ? <AlertCircle size={28} /> : <Loader2 size={28} className="animate-spin" />}</span><p className="mi-eyebrow">YOUR INTERVIEW STUDIO</p><h1>{error ? "Let's get you back on track." : "Preparing your interview session"}</h1><p>{error || "Your room is coming together. We're connecting your AI interviewer and preparing to capture your conversation."}</p>{!error && <div className="mi-state-checks"><span><CheckCircle2 size={16} />Role selected</span><span><CheckCircle2 size={16} />Devices checked</span><span><Loader2 size={16} className="animate-spin" />Preparing room</span></div>}{error && <div className="mi-actions"><button className="mi-button" onClick={() => router.replace("/mock-interview/live")}>Go Back <ArrowRight size={17} /></button></div>}</section></main>;
}
