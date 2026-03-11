"use client";

import { Send, Loader, X, HelpCircle, RotateCcw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import JobInsightCard from "./InsightCard";
import SkillGapAnalyzer from "./SkillGapAnalyzer";
import InterviewReadiness from "./InterviewReadiness";
import SmartSuggestions from "./SmartSuggestions";
import NancyGuideModal from "./NancyGuideModal";
import NancyBirdIconMinimal from "./NancyBirdIconMinimal";

interface Message {
  type: 'user' | 'bot';
  text: string;
  timestamp?: number;
  insightCard?: boolean;
  skillGap?: boolean;
  interviewReadiness?: boolean;
  suggestions?: boolean;
  messageId?: string;
  wordCount?: number;
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

// Helper function to generate unique message ID
const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to determine if message should show regenerate button
const shouldShowRegenerate = (msg: Message): boolean => {
  return msg.type === 'bot' && msg.wordCount && msg.wordCount > 30;
};

export default function NancyChat({
  job,
  onClose,
}: {
  job: JobType;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { type: 'bot', text: 'Hi! I\'m Nancy, your personal job assistant. How can I help you today?', timestamp: Date.now(), messageId: generateMessageId(), wordCount: 0 }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Optimized auto-scroll: runs once per message addition
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages.length]);

  // Generate dynamic quick actions based on job title
  const getDynamicQuickActions = () => {
    if (!job?.title) {
      return [
        'Give me a quick summary of this job role',
        'Find similar jobs that match my skills and preferences',
        'Generate interview questions I should prepare for this role',
        'Compare this job with my resume and highlight missing skills'
      ];
    }

    const title = job.title.toLowerCase();

    // Customize based on job title
    if (title.includes('frontend') || title.includes('react') || title.includes('javascript')) {
      return [
        'What are common frontend interview questions for this role?',
        'Frontend skill gaps - what should I improve?',
        'React best practices for this role',
        'Portfolio projects to impress this company'
      ];
    } else if (title.includes('backend') || title.includes('python') || title.includes('node')) {
      return [
        'Backend architecture questions for interviews?',
        'What database skills does this role require?',
        'API design questions they might ask',
        'Scaling challenges for this backend role'
      ];
    } else if (title.includes('full stack')) {
      return [
        'Full stack project ideas to prepare?',
        'Frontend vs Backend focus for this role?',
        'DevOps skills needed?',
        'System design questions for this role'
      ];
    } else if (title.includes('product') || title.includes('manager')) {
      return [
        'Product sense questions for interviews?',
        'How to structure my PM portfolio?',
        'Data analysis skills needed?',
        'Leadership qualities they\'re seeking'
      ];
    } else if (title.includes('design') || title.includes('ux') || title.includes('ui')) {
      return [
        'Design portfolio tips for this company?',
        'UX research methods they use?',
        'Design tools I should learn?',
        'Case study projects to showcase'
      ];
    } else {
      return [
        `Summary of ${job.title} role`,
        'Key skills required for this position',
        'Interview preparation tips',
        'How my background matches this role'
      ];
    }
  };

  const addMessage = (
    type: 'user' | 'bot',
    text: string,
    metadata?: Partial<Message>
  ) => {
    const wordCount = text.split(/\s+/).length;
    const messageId = generateMessageId();

    setMessages(prev => [
      ...prev,
      {
        type,
        text,
        timestamp: Date.now(),
        messageId,
        wordCount,
        ...metadata
      }
    ]);
  };

  const handleQuickAction = (action: string) => {
    addMessage('user', action);
    setIsTyping(true);

    // Minimum 700ms typing delay to feel natural
    const typingDuration = Math.max(700, Math.random() * 400 + 700);
    setTimeout(() => {
      setIsTyping(false);
      let response = '';
      let metadata: Partial<Message> = {};

      if (action.includes('summary')) {
        response = job ? `Here's a summary of the ${job.title} role at ${job.company}: ${job.description?.substring(0, 200)}...` : 'Please select a job first.';
        metadata = { insightCard: true };
      } else if (action.includes('similar')) {
        response = 'I can help find similar jobs. Based on your current job, here are some similar positions that match your profile.';
      } else if (action.includes('interview') || action.includes('question')) {
        response = 'Common interview questions for this role include:\n\n• Tell me about yourself and your experience\n• Why are you interested in this role?\n• What are your key strengths and achievements?\n• How do you handle challenges?\n• Where do you see yourself in 5 years?';
        metadata = { interviewReadiness: true };
      } else if (action.includes('compare') || action.includes('gap') || action.includes('skill')) {
        response = 'Based on the job description, here are areas to focus on:\n\n✓ Strong matches: Your experience aligns well\n⚠ Areas to improve: Consider developing these skills';
        metadata = { skillGap: true };
      } else if (action.includes('portfolio') || action.includes('project')) {
        response = 'Great question! Here are project ideas that showcase the skills this company values. Would you like me to elaborate on any specific project type?';
        metadata = { suggestions: true };
      } else if (action.includes('architecture') || action.includes('design') || action.includes('database')) {
        response = 'This role likely expects knowledge of:\n\n• System design principles\n• Database optimization\n• Scaling strategies\n• Performance considerations\n\nLet\'s dive deeper into any of these areas!';
      } else {
        response = 'I\'m here to help with job-related questions! Ask me anything about this role, interview prep, or your skills match.';
      }

      addMessage('bot', response, metadata);
    }, typingDuration);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    addMessage('user', input);
    setInput('');
    setIsTyping(true);

    // Minimum 700ms typing delay to feel natural (prevents jarring instant responses)
    const typingDuration = Math.max(700, Math.random() * 400 + 700);
    setTimeout(() => {
      setIsTyping(false);
      const response = input.toLowerCase().includes('resume')
        ? 'To compare with your resume, I\'d need to know more about your background. What\'s your main area of expertise?'
        : input.toLowerCase().includes('salary')
        ? 'Great question about compensation! This role typically offers competitive packages. Would you like tips on negotiation?'
        : 'Thanks for your question! Based on the job description and your interest, here\'s what I recommend...';

      addMessage('bot', response);
    }, typingDuration);
  };

  const handleRegenerate = () => {
    // Find the last bot message with regenerate capability
    const lastBotMsgIdx = messages.length - 1 - [...messages].reverse().findIndex(msg => shouldShowRegenerate(msg));
    if (lastBotMsgIdx === -1) return;

    const lastBotMsg = messages[lastBotMsgIdx];
    setIsRegenerating(true);

    // Simulate regeneration delay
    const typingDuration = Math.max(700, Math.random() * 400 + 700);
    setTimeout(() => {
      setIsRegenerating(false);

      const responses = [
        'Here\'s another perspective on this: Consider exploring different angles of this opportunity.',
        'Let me provide a different take: This role offers unique advantages you might not have considered.',
        'Another way to think about this: The key differentiators include strong team dynamics and growth potential.',
        'Fresh insights: This position aligns well with emerging trends in the industry.'
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      // Replace the bot message in-place instead of appending
      setMessages(prev => {
        const updatedMessages = [...prev];
        const targetIdx = updatedMessages.findIndex(msg => msg.messageId === lastBotMsg.messageId);
        if (targetIdx !== -1) {
          updatedMessages[targetIdx] = {
            ...updatedMessages[targetIdx],
            text: randomResponse,
            wordCount: randomResponse.split(/\s+/).length,
            timestamp: Date.now(),
          };
        }
        return updatedMessages;
      });

      // Scroll to updated message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }, typingDuration);
  };

  const quickActions = getDynamicQuickActions();

  return (
    <>
      <div className="w-96 h-[550px] bg-white flex flex-col overflow-hidden border-none">
        {/* HEADER - Minimal, Clean */}
        <div className="shrink-0 px-4 py-3 border-b border-gray-200 border-l-4 border-l-blue-600 bg-blue-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NancyBirdIconMinimal size={24} />
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm text-gray-900">Nancy</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-xs text-gray-500">Online</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">AI Career Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGuideOpen(true)}
              type="button"
              title="Open Nancy quick guidance"
              aria-label="Open Nancy quick guidance"
              className="px-3 py-1.5 rounded-md border border-gray-200 text-gray-900 text-xs font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-150 flex items-center gap-1.5"
            >
              <HelpCircle size={14} />
              Guide
            </button>
            <button
              onClick={onClose}
              type="button"
              title="Close Nancy chat"
              aria-label="Close Nancy chat"
              className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-150"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* CHAT BODY - Minimal, Clean */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          {/* Messages */}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 animate-fade-in-slide flex-col ${
                msg.type === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex gap-2 w-full items-end">
                {msg.type === 'bot' && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                    <NancyBirdIconMinimal size={16} />
                  </div>
                )}
                <div className={`max-w-xs px-4 py-2 rounded-lg whitespace-pre-wrap ${
                  msg.type === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-300/30'
                    : 'bg-blue-50 text-gray-900 border border-blue-200 rounded-bl-none shadow-sm shadow-blue-100/40'
                }`}>
                {msg.text}
              </div>
              </div>

              {/* Insight Cards */}
              {msg.insightCard && job && (
                <div className="w-full max-w-xs">
                  <JobInsightCard job={job} />
                </div>
              )}
              {msg.skillGap && job?.skills_required && (
                <div className="w-full max-w-xs">
                  <SkillGapAnalyzer skills={job.skills_required as string[]} />
                </div>
              )}
              {msg.interviewReadiness && (
                <div className="w-full max-w-xs">
                  <InterviewReadiness />
                </div>
              )}
              {msg.suggestions && (
                <div className="w-full max-w-xs">
                  <SmartSuggestions onSuggestionClick={handleQuickAction} />
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 animate-fade-in-slide">
              <div className="max-w-xs px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 shadow-sm shadow-blue-100/40 flex items-center gap-1.5">
                <span className="text-sm text-gray-600">Nancy is thinking</span>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-gray-400"
                      style={{
                        animation: `pulse 1.4s ease-in-out infinite`,
                        animationDelay: `${i * 0.2}s`,
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {!isTyping && messages.length <= 1 && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Quick Actions</p>
              <div className="space-y-2">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickAction(action)}
                    disabled={isTyping}
                    className="w-full text-left px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-md text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300/50 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT SECTION - Minimal */}
        <div className="shrink-0 px-3 py-2 border-t border-gray-200 bg-white">
          {/* Try Again Button - Smart Visibility */}
          {messages.length > 1 && shouldShowRegenerate(messages[messages.length - 1]) && (
            <div className="flex justify-center mb-2">
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating || isTyping}
                type="button"
                className="py-1.5 px-3 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-600 font-medium hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-150 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw size={12} />
                {isRegenerating ? 'Generating...' : 'Try Again'}
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              placeholder="Ask Nancy..."
              aria-label="Message Nancy"
              className="flex-1 bg-white border-2 border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-0 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />

            <button
              type="submit"
              aria-label="Send message"
              disabled={!input.trim() || isTyping}
              className="shrink-0 w-8 h-8 rounded-md bg-blue-600 text-white flex items-center justify-center hover:shadow-sm hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/30 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              {isTyping ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-1.5 text-center">Powered by AI</p>
        </div>
      </div>

      {/* Quick Guide Modal */}
      <NancyGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onPromptClick={handleQuickAction}
      />
    </>
  );
}
