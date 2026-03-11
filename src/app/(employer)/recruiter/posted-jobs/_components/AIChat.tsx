'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Users,
  Calendar,
  CheckCircle,
  TrendingUp,
  Mail,
  MessageSquare,
  Zap,
  ChevronRight,
  Loader2,
  Star,
  Clock,
  Building2,
  Target,
  Filter
} from 'lucide-react';

type Role = 'ai' | 'user';

interface Message {
  id: number;
  role: Role;
  text: string;
  timestamp: Date;
  actions?: ActionButton[];
  cards?: CandidateCard[];
}

interface ActionButton {
  label: string;
  value: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

interface CandidateCard {
  id?: string;
  name: string;
  role: string;
  score: number;
  experience: string;
  skills: string[];
  email?: string;
  phone?: string;
  location?: string;
}

interface Applicant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  resume?: string;
  coverLetter?: string;
  experience?: string;
  skills?: string[];
  location?: string;
  appliedDate: string;
}

interface AIChatProps {
  jobId?: string | number;
  jobTitle?: string;
  applicants?: Applicant[];
}

type FlowState =
  | 'IDLE'
  | 'SCREENING'
  | 'SCREENING_CRITERIA'
  | 'RANKING'
  | 'RANKING_RESULTS'
  | 'ASSESSMENT_TYPE'
  | 'INTERVIEW_SCHEDULE'
  | 'EMAIL_TYPE'
  | 'EMAIL_DRAFT'
  | null;

export default function AIChat({ jobId, jobTitle = 'this position', applicants = [] }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [flowState, setFlowState] = useState<FlowState>('IDLE');
  const [isTyping, setIsTyping] = useState(false);
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateCard[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  // Convert applicants to candidate cards with AI scoring
  useEffect(() => {
    if (applicants && applicants.length > 0) {
      const candidates: CandidateCard[] = applicants.map((applicant, index) => ({
        id: applicant.id,
        name: applicant.name,
        role: jobTitle,
        score: calculateScore(applicant),
        experience: applicant.experience || 'Not specified',
        skills: applicant.skills || [],
        email: applicant.email,
        phone: applicant.phone,
        location: applicant.location
      }));

      // Sort by score
      candidates.sort((a, b) => b.score - a.score);
      setFilteredCandidates(candidates);
    }
  }, [applicants, jobTitle]);

  // Calculate AI score based on applicant data
  const calculateScore = (applicant: Applicant): number => {
    let score = 50; // Base score

    // Add points for having resume
    if (applicant.resume) score += 15;

    // Add points for cover letter
    if (applicant.coverLetter) score += 10;

    // Add points for skills
    if (applicant.skills && applicant.skills.length > 0) {
      score += Math.min(applicant.skills.length * 3, 15);
    }

    // Add points for experience
    if (applicant.experience) {
      const years = parseInt(applicant.experience);
      if (!isNaN(years)) {
        score += Math.min(years * 2, 10);
      }
    }

    // Ensure score is between 0-100
    return Math.min(Math.max(score, 0), 100);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const totalApplicants = applicants?.length || 0;
      setMessages([{
        id: Date.now() + Math.random(),
        role: 'ai',
        text: `Hi there! 👋\n\nI'm your AI recruiting assistant. I'm here to help you find, evaluate, and hire the best talent faster.\n\n${
          totalApplicants > 0
            ? `You have **${totalApplicants} applicant${totalApplicants > 1 ? 's' : ''}** for ${jobTitle}. What would you like to do?`
            : `What would you like to do today?`
        }`,
        timestamp: new Date(),
        actions: [
          { label: 'Find top candidates', value: 'screening', icon: <Target size={14} /> },
          { label: 'Rank applicants', value: 'ranking', icon: <TrendingUp size={14} /> },
          { label: 'Schedule interviews', value: 'interviews', icon: <Calendar size={14} /> },
          { label: 'Send outreach', value: 'email', icon: <Mail size={14} /> }
        ]
      }]);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushAI = (text: string, actions?: ActionButton[], cards?: CandidateCard[]) => {
    setMessages(prev => [
      ...prev,
      { id: Date.now() + Math.random(), role: 'ai', text, timestamp: new Date(), actions, cards }
    ]);
    setIsTyping(false);
  };

  const pushUser = (text: string) => {
    setMessages(prev => [
      ...prev,
      { id: Date.now() + Math.random(), role: 'user', text, timestamp: new Date() }
    ]);
  };

  const simulateTyping = (callback: () => void, delay = 600) => {
    setIsTyping(true);
    setTimeout(callback, delay);
  };

  const getTopCandidates = (count: number = 5): CandidateCard[] => {
    return filteredCandidates.slice(0, count);
  };

  const handleActionClick = (value: string, label: string) => {
    pushUser(label);

    simulateTyping(() => {
      switch (value) {
        case 'screening':
          setFlowState('SCREENING');
          const totalCount = applicants?.length || 0;

          if (totalCount === 0) {
            pushAI(
              `I don't see any applicants for this position yet.\n\nOnce candidates start applying, I can help you screen and filter them based on various criteria.`,
              [
                { label: 'Start over', value: 'reset' }
              ]
            );
          } else {
            pushAI(
              `Great! Let's find your ideal candidates.\n\nI'll screen applicants based on your criteria. What's most important for this role?`,
              [
                { label: 'Skills & experience', value: 'criteria_skills', icon: <CheckCircle size={14} /> },
                { label: 'Culture fit', value: 'criteria_culture', icon: <Users size={14} /> },
                { label: 'Location & availability', value: 'criteria_location', icon: <Building2 size={14} /> },
                { label: 'All of the above', value: 'criteria_all', icon: <Filter size={14} />, variant: 'primary' }
              ]
            );
          }
          break;

        case 'criteria_skills':
        case 'criteria_culture':
        case 'criteria_location':
        case 'criteria_all':
          setFlowState('SCREENING_CRITERIA');
          const total = applicants?.length || 0;
          const highQuality = filteredCandidates.filter(c => c.score >= 80).length;
          const exceptional = filteredCandidates.filter(c => c.score >= 90).length;

          pushAI(
            `Perfect! I'm analyzing all applicants now...\n\nFound ${total} candidate${total !== 1 ? 's' : ''}. After applying your filters:\n\n✓ ${filteredCandidates.length} match requirements\n✓ ${highQuality} are highly qualified\n✓ ${exceptional} are exceptional matches\n\nShould I show you the top matches?`,
            [
              { label: 'Show top 5', value: 'show_top', variant: 'primary' },
              { label: 'Adjust filters', value: 'adjust_filters' }
            ]
          );
          break;

        case 'show_top':
          const topCandidates = getTopCandidates(5);

          if (topCandidates.length === 0) {
            pushAI(
              `No candidates available to display yet.\n\nOnce applicants apply to this job, I'll be able to show you the top matches.`,
              [
                { label: 'Start over', value: 'reset' }
              ]
            );
          } else {
            pushAI(
              `Here are your top ${topCandidates.length} candidate${topCandidates.length !== 1 ? 's' : ''}:`,
              [
                { label: 'Rank these candidates', value: 'ranking', icon: <TrendingUp size={14} /> },
                { label: 'Schedule interviews', value: 'interviews', icon: <Calendar size={14} /> },
                { label: 'Send outreach email', value: 'email', icon: <Mail size={14} /> }
              ],
              topCandidates
            );
          }
          break;

        case 'ranking':
          setFlowState('RANKING');

          if (filteredCandidates.length === 0) {
            pushAI(
              `No candidates available to rank yet.\n\nOnce applicants apply to this job, I'll be able to rank them based on AI scoring.`,
              [
                { label: 'Start over', value: 'reset' }
              ]
            );
            break;
          }

          pushAI(
            `I'll rank candidates using our AI-powered scoring system.\n\nRanking criteria:\n• Technical skills match (35%)\n• Experience level (25%)\n• Profile completeness (20%)\n• Application quality (20%)\n\nProcessing...`,
            []
          );

          setTimeout(() => {
            simulateTyping(() => {
              const topRanked = getTopCandidates(3);
              pushAI(
                `Ranking complete! 🎯\n\nTop ${topRanked.length} candidate${topRanked.length !== 1 ? 's' : ''} ready for next steps:`,
                [
                  { label: `Schedule interviews with top ${topRanked.length}`, value: 'schedule_top_3', variant: 'primary' },
                  { label: 'View detailed reports', value: 'view_reports' },
                  { label: 'Adjust ranking weights', value: 'adjust_weights' }
                ],
                topRanked
              );
            }, 1500);
          }, 100);
          break;

        case 'schedule_top_3':
        case 'interviews':
          setFlowState('INTERVIEW_SCHEDULE');

          if (filteredCandidates.length === 0) {
            pushAI(
              `No candidates available to schedule yet.\n\nOnce you have applicants, I can help schedule interviews automatically.`,
              [
                { label: 'Start over', value: 'reset' }
              ]
            );
          } else {
            pushAI(
              `Let's schedule interviews! 📅\n\nI can:\n• Find mutual availability across your team's calendars\n• Send calendar invites automatically\n• Create video meeting links\n• Send reminders 24h before\n\nWhen would you like to interview candidates?`,
              [
                { label: 'This week', value: 'schedule_this_week' },
                { label: 'Next week', value: 'schedule_next_week' },
                { label: 'Custom dates', value: 'schedule_custom' }
              ]
            );
          }
          break;

        case 'schedule_this_week':
        case 'schedule_next_week':
          const scheduleCandidates = getTopCandidates(3);
          const scheduleText = scheduleCandidates.length > 0
            ? scheduleCandidates.map((c, i) => {
                const days = ['Tomorrow', 'Thu', 'Fri'];
                const times = ['2:00 PM', '10:00 AM', '3:30 PM'];
                return `• ${c.name} - ${days[i] || 'This week'}, ${times[i] || '2:00 PM'} (45 min)`;
              }).join('\n')
            : '• No candidates to schedule yet';

          pushAI(
            `Perfect! I found optimal time slots. ✅\n\n📅 Scheduled interviews:\n\n${scheduleText}\n\nCalendar invites sent! All candidates confirmed.`,
            [
              { label: 'Send prep materials', value: 'send_prep', variant: 'primary' },
              { label: 'View interview schedule', value: 'view_schedule' },
              { label: 'Done', value: 'done' }
            ]
          );
          break;

        case 'email':
          setFlowState('EMAIL_TYPE');
          pushAI(
            `What type of email would you like to send?\n\nI can help you with:`,
            [
              { label: 'Candidate outreach', value: 'email_outreach', icon: <Mail size={14} /> },
              { label: 'Interview invitation', value: 'email_interview', icon: <Calendar size={14} /> },
              { label: 'Offer letter', value: 'email_offer', icon: <Star size={14} /> },
              { label: 'Rejection (polite)', value: 'email_rejection', icon: <MessageSquare size={14} /> }
            ]
          );
          break;

        case 'email_outreach':
          setFlowState('EMAIL_DRAFT');
          const topCandidate = getTopCandidates(1)[0];
          const candidateName = topCandidate?.name || '[Candidate Name]';
          const candidateSkills = topCandidate?.skills?.slice(0, 2).join(' and ') || 'relevant skills';

          pushAI(
            `I've drafted a personalized outreach email:\n\n━━━━━━━━━━━━━━━━━━━━\n\n**Subject:** Exciting opportunity at [Your Company]\n\n**Hi ${candidateName},**\n\nI came across your profile and was impressed by your experience with ${candidateSkills}. Your background aligns perfectly with what we're looking for in our ${jobTitle} role.\n\nWe're building [product description] and looking for talented professionals to join our growing team. The role offers:\n\n• Competitive salary & benefits\n• Remote-first culture\n• Professional growth opportunities\n• Work on cutting-edge projects\n\nWould you be open to a quick 15-min chat?\n\nBest regards,\n[Your name]\n\n━━━━━━━━━━━━━━━━━━━━\n\nWhat would you like to do?`,
            [
              { label: `Send to ${candidateName}`, value: 'send_email', variant: 'primary' },
              { label: 'Edit draft', value: 'edit_email' },
              { label: 'Send to all top 5', value: 'send_bulk' }
            ]
          );
          break;

        case 'send_email':
        case 'send_bulk':
          const sendCount = value === 'send_bulk' ? Math.min(getTopCandidates(5).length, 5) : 1;
          pushAI(
            `Email${sendCount > 1 ? 's' : ''} sent! 📧 ✓\n\nYour outreach has been delivered to ${sendCount} candidate${sendCount > 1 ? 's' : ''}. I'll notify you when they respond.\n\nAnything else I can help with?`,
            [
              { label: 'Schedule follow-ups', value: 'schedule_followup' },
              { label: 'View analytics', value: 'analytics' },
              { label: 'Start over', value: 'reset' }
            ]
          );
          break;

        case 'done':
        case 'reset':
          setFlowState('IDLE');
          const currentApplicants = applicants?.length || 0;
          pushAI(
            `Great! What else can I help you with?${
              currentApplicants > 0 ? `\n\nYou have ${currentApplicants} applicant${currentApplicants > 1 ? 's' : ''} waiting.` : ''
            }`,
            [
              { label: 'Find top candidates', value: 'screening', icon: <Target size={14} /> },
              { label: 'Rank applicants', value: 'ranking', icon: <TrendingUp size={14} /> },
              { label: 'Schedule interviews', value: 'interviews', icon: <Calendar size={14} /> },
              { label: 'Send outreach', value: 'email', icon: <Mail size={14} /> }
            ]
          );
          break;

        default:
          pushAI(
            `Got it! I'm working on that now...`,
            [
              { label: 'Start over', value: 'reset' }
            ]
          );
      }
    });
  };

  const handleSend = () => {
    if (!input.trim()) return;

    pushUser(input);
    const userInput = input.toLowerCase();
    setInput('');

    simulateTyping(() => {
      pushAI(
        `I understand you want to: "${userInput}"\n\nLet me help you with that. Here are some quick actions:`,
        [
          { label: 'Find candidates', value: 'screening', icon: <Target size={14} /> },
          { label: 'Rank applicants', value: 'ranking', icon: <TrendingUp size={14} /> },
          { label: 'Schedule interviews', value: 'interviews', icon: <Calendar size={14} /> }
        ]
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
      {/* HEADER - Paradox Style */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/30">
              <Sparkles className="text-white" size={24} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-white text-xl">AI Assistant</h2>
            <p className="text-white/80 text-sm">
              Recruiting Assistant • {applicants?.length || 0} Applicant{applicants?.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-20 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map(msg => (
            <div key={msg.id} className="space-y-4">
              <div
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'ai' && (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Bot size={20} className="text-white" />
                  </div>
                )}

                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  <div
                    className={`rounded-2xl px-5 py-3 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                        : 'bg-white text-gray-800 shadow-md border border-gray-100'
                    }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-line">
                      {msg.text}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-1 px-2">
                    <Clock size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-gray-600" />
                  </div>
                )}
              </div>

              {/* CANDIDATE CARDS */}
              {msg.cards && msg.cards.length > 0 && (
                <div className="ml-12 space-y-3">
                  {msg.cards.map((card, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{card.name}</h4>
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              <Star size={12} fill="currentColor" />
                              {card.score}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{card.role}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                            <span className="flex items-center gap-1">
                              <Building2 size={12} />
                              {card.experience}
                            </span>
                            {card.location && (
                              <span className="flex items-center gap-1">
                                📍 {card.location}
                              </span>
                            )}
                          </div>
                          {card.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {card.skills.slice(0, 4).map((skill, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                              {card.skills.length > 4 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                                  +{card.skills.length - 4} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="text-gray-400 group-hover:text-indigo-600 transition-colors" size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ACTION BUTTONS - Paradox Style */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="ml-12 flex flex-wrap gap-2">
                  {msg.actions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleActionClick(action.value, action.label)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow-md ${
                        action.variant === 'primary'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                          : 'bg-white text-gray-700 border border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                      }`}
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* TYPING INDICATOR */}
          {isTyping && (
            <div className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Bot size={20} className="text-white" />
              </div>
              <div className="bg-white rounded-2xl px-5 py-4 shadow-md border border-gray-100">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" />
                  <div
                    className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.15s' }}
                  />
                  <div
                    className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.3s' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* INPUT AREA - Wellfound Style */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything or choose an option above..."
                className="w-full px-5 py-3.5 pr-12 border-2 border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all text-sm bg-gray-50 focus:bg-white"
              />
              <Zap size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3.5 rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
            >
              {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Powered by AI • Responses may vary
          </p>
        </div>
      </div>
    </div>
  );
}
