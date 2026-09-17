"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createLiveSession } from "@/api/mockInterviewApi";
import { getInterviewerByIndex, isVoiceMatchedToGender } from "../../_lib/interviewers";
import { Loader2 } from "lucide-react";

interface SessionParams {
  session_type: "hr" | "technical" | "managerial" | "technical_coding";
  resume_id?: string;
  target_role?: string;
  enable_streaming_stt: boolean;
  voice: string;
  use_orchestrator: boolean;
  interviewer_index: number;
  interviewer_slug?: string;
  interviewer_name: string;
  gender: string;
  session_type_label: string;
}

export default function LiveStartingPage() {
  const router = useRouter();
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
    const voice = selectedInterviewer?.voice ?? (isVoiceMatchedToGender(params.voice, params.gender) ? params.voice : fallbackVoice);
    const interviewerName = selectedInterviewer?.name ?? params.interviewer_name;
    const interviewerGender = selectedInterviewer?.gender ?? params.gender;

    const basePayload = {
      session_type: params.session_type,
      resume_id: params.resume_id,
      target_role: params.target_role,
      enable_streaming_stt: params.enable_streaming_stt,
      voice,
    };

    const onSuccess = (data: Awaited<ReturnType<typeof createLiveSession>>) => {
      sessionStorage.setItem("live_session_data", JSON.stringify(data));
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

    createLiveSession({ ...basePayload, use_orchestrator: true })
      .then(onSuccess)
      .catch(() => {
        setError("Could not create the live interview. Please check your connection and try again.");
      });
  }, [router]);

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 bg-background">
        <p className="text-destructive text-center max-w-sm">{error}</p>
        <button
          onClick={() => router.replace("/mock-interview/live")}
          className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">Setting up your interview session…</p>
    </div>
  );
}
