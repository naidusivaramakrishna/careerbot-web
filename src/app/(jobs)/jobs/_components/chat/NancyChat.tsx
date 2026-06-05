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
      src="/assets/images/login_bot.svg"
      alt="Nancy"
      className="w-full h-full object-contain"
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
      <div className="w-full h-full bg-white flex flex-col overflow-hidden rounded-none">
        {/* HEADER */}
        <div className="shrink-0 px-5 py-3.5 bg-linear-to-r from-[#2557a7] to-[#1a409e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center ring-2 ring-white/30 overflow-hidden shadow-md p-0.5">
              <BotAvatar />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-white">Nancy</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-300" />
                  <span className="text-[11px] text-white/70">Online</span>
                </div>
              </div>
              <p className="text-[11px] text-white/60">AI Career Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGuideOpen(true)}
              type="button"
              title="Open Nancy quick guidance"
              aria-label="Open Nancy quick guidance"
              className="px-3 py-1.5 rounded-lg border border-white/20 text-white text-xs font-medium hover:bg-white/10 focus:outline-none transition-all duration-150 flex items-center gap-1.5"
            >
              <HelpCircle size={13} />
              Guide
            </button>
            <button
              onClick={onClose}
              type="button"
              title="Close Nancy chat"
              aria-label="Close Nancy chat"
              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white focus:outline-none transition-all duration-150"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Job context strip */}
        {job?.title && (
          <div className="shrink-0 px-5 py-2 bg-[#f0f4ff] border-b border-[#dce8ff]">
            <p className="text-[11px] text-[#2557a7] font-medium truncate">
              Chatting about: <span className="font-bold">{job.title}</span>
              {job.company ? ` · ${job.company}` : ""}
            </p>
          </div>
        )}

        {/* CHAT BODY */}
        <div className="flex-1 overflow-y-auto px-4 pt-0 pb-4 space-y-3 bg-[#f8f9fc]">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col gap-1.5 ${msg.type === "user" ? "items-end" : "items-start"}`}
            >
              <div className="flex gap-2 w-full items-end">
                {msg.type === "bot" && (
                  <div className="w-10 h-10 rounded-full bg-[#e8f0fe] border border-[#c7d9ff] flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1">
                    <BotAvatar />
                  </div>
                )}
                <div
                  className={`max-w-[320px] px-4 py-2.5 rounded-2xl whitespace-pre-wrap text-sm leading-relaxed ${
                    msg.type === "user"
                      ? "bg-[#2557a7] text-white rounded-br-sm shadow-md shadow-[#2557a7]/20"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm"
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
              <div className="w-10 h-10 rounded-full bg-[#e8f0fe] border border-[#c7d9ff] flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1">
                <BotAvatar />
              </div>
              <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white border border-gray-100 shadow-sm flex items-center gap-2">
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
                  <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest px-1">
                    Ask Nancy — Free
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {remaining.map((action, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => sendMessage(action)}
                        disabled={isTyping}
                        className="text-left px-3 py-2 bg-white border border-gray-100 rounded-xl text-[12px] text-gray-700 hover:bg-[#f0f4ff] hover:border-[#2557a7]/30 hover:text-[#2557a7] shadow-sm focus:outline-none active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="shrink-0 px-4 py-3 border-t border-gray-100 bg-white">
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              placeholder="Ask Nancy anything..."
              aria-label="Message Nancy"
              className="flex-1 bg-[#f8f9fc] border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2557a7] focus:bg-white focus:ring-2 focus:ring-[#2557a7]/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!input.trim() || isTyping}
              className="shrink-0 w-9 h-9 rounded-full bg-[#2557a7] text-white flex items-center justify-center hover:bg-[#1f4e98] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#2557a7]/30 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#2557a7] disabled:hover:shadow-none"
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
