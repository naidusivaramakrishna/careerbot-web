"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createLiveSession } from "@/api/mockInterviewApi";
import { getInterviewerByIndex, isVoiceMatchedToGender } from "../../_lib/interviewers";
import { useMockInterview } from "../../_context/MockInterviewContext";
import { Loader2 } from "lucide-react";

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
      // livekit_client_token is a live credential — interview-avatar.txt says
      // never store it (localStorage/sessionStorage/logs). Relay it in-memory
      // via context instead; everything else is fine in sessionStorage as before.
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

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 bg-[#f6f8fb] px-4">
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm leading-6 text-gray-600">{error}</p>
        </div>
        <button
          onClick={() => router.replace("/mock-interview/live")}
          className="rounded-lg bg-[#2557a7] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e4a8f]"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#f6f8fb] px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-[#2557a7] text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2557a7]">Live room setup</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-gray-950">Preparing your interview session</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">Connecting the AI interviewer, transcript capture, and secure report pipeline.</p>
      </div>
    </div>
  );
}
