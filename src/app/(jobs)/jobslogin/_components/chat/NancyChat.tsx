"use client";

import { Send, Loader, X, HelpCircle, Sparkles, Lock } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import NancyGuideModal from "./NancyGuideModal";
import { chatAboutJob } from "@/api/jobsApi";
import type { JobChatSuggestedAction } from "@/api/jobsApi";

function BotAvatar() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/ac4923bc-9ee8-4734-ad60-fc93e8935797.png"
      alt="Nancy"
      className="h-full w-full object-cover"
    />
  );
}

interface Message {
  type: "user" | "bot";
  text: string;
  timestamp: number;
  intent_type?: "free" | "premium" | "unknown";
  suggestedAction?: JobChatSuggestedAction;
}

export interface JobType {
  id?: string;
  title?: string;
  company?: string;
  description?: string;
  experience_level?: string;
  salary?: { min?: number; max?: number; currency?: string };
  skills_required?: string[];
  job_type?: string;
  [key: string]: unknown;
}

const FREE_ACTIONS = [
  "Do I qualify for this role?",
  "What skills am I missing?",
  "What are the key requirements?",
  "How can I improve my match score?",
  "Is my experience enough?",
  "What education is required?",
  "What's the salary for this role?",
  "Is this remote or onsite?",
  "Tell me about the company",
  "How does this compare to other jobs?",
];


export default function NancyChat({
  job,
  onClose,
}: {
  job: JobType;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "bot",
      text: `Hi! I'm Nancy, your AI job assistant. Ask me anything about the ${job?.title || "this"} role — I can check your qualification, skill gaps, requirements, and more.`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [usedActions, setUsedActions] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages.length]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    if (FREE_ACTIONS.includes(trimmed)) {
      setUsedActions((prev) => new Set([...prev, trimmed]));
    }
    setMessages((prev) => [...prev, { type: "user", text: trimmed, timestamp: Date.now() }]);
    setInput("");
    setIsTyping(true);

    try {
      const jobId = job?.id as string;
      if (!jobId) throw new Error("Job ID missing");

      const result = await chatAboutJob(jobId, trimmed, sessionId);

      if (result.session_id) setSessionId(result.session_id);

      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: result.response,
          timestamp: Date.now(),
          intent_type: result.intent_type,
          suggestedAction: result.suggested_action ?? undefined,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: "Sorry, I couldn't process that. Please try again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      <div className="flex h-full w-full flex-col overflow-hidden rounded-none bg-white">
        {/* HEADER */}
        <div className="relative shrink-0 overflow-hidden bg-[linear-gradient(145deg,#0f1d33_0%,#173463_55%,#4F46E5_100%)] px-5 py-4">
          <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
          <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white p-0.5 shadow-[0_10px_24px_rgba(15,23,42,0.25)] ring-1 ring-white/40">
              <BotAvatar />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-extrabold text-white">Nancy</p>
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-300" />
                  <span className="text-[11px] text-white/70">Online</span>
                </div>
              </div>
              <p className="text-[11px] font-medium text-white/60">AI career assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGuideOpen(true)}
              type="button"
              title="Open Nancy quick guidance"
              aria-label="Open Nancy quick guidance"
              className="flex items-center gap-1.5 rounded-xl border border-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-150 hover:bg-white/10 focus:outline-none"
            >
              <HelpCircle size={13} />
              Guide
            </button>
            <button
              onClick={onClose}
              type="button"
              title="Close Nancy chat"
              aria-label="Close Nancy chat"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white/80 transition-all duration-150 hover:bg-white/10 hover:text-white focus:outline-none"
            >
              <X size={17} />
            </button>
          </div>
          </div>
        </div>

        {/* Job context strip */}
        {job?.title && (
          <div className="shrink-0 border-b border-[#dce8ff] bg-[#f5f8ff] px-5 py-2.5">
            <p className="truncate text-[11px] font-semibold text-[#4F46E5]">
              Chatting about: <span className="font-bold">{job.title}</span>
              {job.company ? ` · ${job.company}` : ""}
            </p>
          </div>
        )}

        {/* CHAT BODY */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#eef3f8_100%)] px-4 pb-4 pt-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col gap-1.5 ${msg.type === "user" ? "items-end" : "items-start"}`}
            >
              <div className="flex gap-2 w-full items-end">
                {msg.type === "bot" && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#c7d9ff] bg-white p-0.5 shadow-sm">
                    <BotAvatar />
                  </div>
                )}
                <div
                  className={`max-w-[320px] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.type === "user"
                      ? "rounded-br-sm bg-[#4F46E5] text-white shadow-md shadow-[#4F46E5]/20"
                      : "rounded-bl-sm border border-white bg-white text-gray-800 shadow-[0_10px_24px_rgba(15,23,42,0.07)]"
                  }`}
                >
                  {msg.text}
                </div>
              </div>

              {/* Premium feature upgrade card */}
              {msg.type === "bot" &&
                msg.intent_type === "premium" &&
                msg.suggestedAction && (
                  <div className="ml-9 max-w-75 w-full bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Lock size={13} className="text-amber-600" />
                      <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                        Premium Feature
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 mb-3">
                      Costs{" "}
                      <strong className="text-amber-900">
                        {msg.suggestedAction.credits} credits
                      </strong>
                    </p>
                    <a
                      href="/pricing"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                    >
                      <Sparkles size={12} />
                      Upgrade to Unlock
                    </a>
                  </div>
                )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-2 items-end">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#c7d9ff] bg-white p-0.5 shadow-sm">
                <BotAvatar />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-white bg-white px-4 py-2.5 shadow-[0_10px_24px_rgba(15,23,42,0.07)]">
                <span className="text-sm text-gray-500">Nancy is thinking</span>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-gray-400"
                      style={{
                        animation: "pulse 1.4s ease-in-out infinite",
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick actions — show remaining unused suggestions after every bot reply */}
          {!isTyping && (() => {
            const remaining = FREE_ACTIONS.filter((a) => !usedActions.has(a));
            if (remaining.length === 0) return null;
            return (
              <div className="mt-1 space-y-4">
                <div>
                  <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Ask Nancy — Free
                  </p>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {remaining.map((action, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => sendMessage(action)}
                        disabled={isTyping}
                        className="rounded-xl border border-white bg-white px-3 py-2 text-left text-[12px] text-gray-700 shadow-[0_8px_18px_rgba(15,23,42,0.05)] transition-all duration-150 hover:border-[#4F46E5]/30 hover:bg-[#f0f4ff] hover:text-[#4F46E5] focus:outline-none active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3">
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              placeholder="Ask Nancy anything..."
              aria-label="Message Nancy"
              className="flex-1 rounded-full border border-gray-200 bg-[#f8f9fc] px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-[#4F46E5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/10 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!input.trim() || isTyping}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4F46E5] text-white transition-all duration-150 hover:bg-[#4338CA] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#4F46E5] disabled:hover:shadow-none"
            >
              {isTyping ? <Loader size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </form>
          <p className="text-[11px] text-gray-400 mt-1.5 text-center">Powered by AI · Free answers from your profile</p>
        </div>
      </div>

      <NancyGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onPromptClick={sendMessage}
      />
    </>
  );
}
