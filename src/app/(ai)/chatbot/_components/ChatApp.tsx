'use client';

import React, { useState, useRef, useEffect } from 'react';
import './ChatApp.css';
import { sendChatMessage, escalateToSupport, getSupportTickets, sendTicketOtp, verifyTicketOtp } from '@/api/chatbotApi';
import type { SupportTicket } from '@/api/chatbotApi';
import { isUserAuthenticated, classifyQuery, canGuestAnswer, getAuthRequiredMessage } from '@/api/chatbotAuth';
import { getProfile } from '@/api/userApi';
import {
  LoginIcon,
  ResumeBuilderIcon,
  ResumeParserIcon,
  ResumeEnhancerIcon,
  CoverLetterIcon,
  JobSearchIcon,
  JobMatchIcon,
  MockInterviewIcon,
  MockTestIcon,
  BrowserExtensionIcon,
  ChatbotIcon,
  PaymentBillingIcon,
  AccountOrganizationIcon,
} from './FeatureIcons';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
  sources?: string[];
  relatedQuestions?: string[];
  ticket?: TicketInfo;
}

interface ChatSession {
  id: string;
  title: string;
  date: Date;
  preview: string;
  // Full transcript, so a saved conversation can be restored as-is rather
  // than as a title/preview summary. Optional so sessions saved before this
  // field existed (already sitting in users' localStorage) still load.
  messages?: Message[];
  // Owner's email for per-user isolation
  userEmail?: string;
}

interface TicketInfo {
  id: string;
  subject: string;
  status: string;
  priority: number;
  created_at: string;
  contact_email?: string;
  // Already returned by the backend (SupportTicket) but not always present —
  // older localStorage-cached tickets were saved before these were carried
  // through, so treat them as optional rather than assuming they exist.
  description?: string;
  affected_feature?: string;
  updated_at?: string;
  user_name?: string | null;
}

type SidebarTab = 'history' | 'tickets';

type StoredMessage = Omit<Message, 'timestamp'> & { timestamp: string };
type StoredChatSession = Omit<ChatSession, 'date' | 'messages'> & {
  date: string;
  messages?: StoredMessage[];
};

const describeError = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

const getHttpStatus = (error: unknown): number | undefined =>
  typeof error === 'object' && error !== null && 'response' in error
    ? (error as { response?: { status?: number } }).response?.status
    : undefined;

// KB answers arrive as **bold**-style markdown; the chat bubble renders
// plain text, so strip the markers instead of showing literal asterisks.
const stripMarkdown = (text: string): string => text.replace(/\*\*(.+?)\*\*/g, '$1').trim();

// Collapsed preview: the first sentence, not an arbitrary character cut —
// so it reads as a clean summary instead of trailing off mid-word.
// Require minimum length to avoid truncating abbreviations like "e.g." or numbered lists like "1."
const firstSentence = (text: string): string => {
  const firstLine = text.split('\n')[0];

  // Try to find sentence ending within first line (. ! or ?)
  // Require at least 20 chars before the punctuation
  const match = firstLine.match(/^.{20,}?[.!?](?=\s|$)/);
  if (match) {
    return match[0].trim();
  }

  // Fallback: use first line if it's at least 20 chars
  if (firstLine.length >= 20) {
    return firstLine.trim();
  }

  // Last resort: truncate at word boundary around 160 chars
  if (text.length > 160) {
    const truncated = text.substring(0, 160);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 20) {
      return truncated.substring(0, lastSpace).trim() + '…';
    }
  }

  return text.trim();
};

const FEATURE_ISSUE_TYPES: Record<string, { value: string; label: string }[]> = {
  'login-issues': [
    { value: 'forgot_password', label: 'Forgot Password' },
    { value: 'unable_to_login', label: 'Unable to Login' },
    { value: 'password_reset_issue', label: 'Password Reset Issue' },
    { value: 'email_verification_issue', label: 'Email Verification Issue' },
    { value: 'two_fa_issue', label: '2FA / Authentication Issue' },
    { value: 'account_locked', label: 'Account Locked / Suspended' },
    { value: 'other_login_issue', label: 'Other Login/Access Issue' },
  ],
  'ai-resume-builder': [
    { value: 'resume_creation_failed', label: 'Resume creation failed' },
    { value: 'template_not_loading', label: 'Template not loading' },
    { value: 'generation_error', label: 'Resume generation error' },
    { value: 'ats_formatting', label: 'ATS formatting issue' },
    { value: 'content_generation', label: 'Content generation issue' },
    { value: 'download_export', label: 'Resume download/export issue' },
    { value: 'formatting_layout', label: 'Formatting/layout issue' },
    { value: 'slow_response', label: 'Slow response' },
    { value: 'not_accessible', label: 'Feature not accessible' },
    { value: 'other', label: 'Other' },
  ],
  'resume-parser': [
    { value: 'upload_failed', label: 'Resume upload failed' },
    { value: 'parsing_failed', label: 'Resume parsing failed' },
    { value: 'incorrect_extraction', label: 'Incorrect information extracted' },
    { value: 'missing_info', label: 'Missing information' },
    { value: 'section_mapping', label: 'Incorrect section mapping' },
    { value: 'parsing_slow', label: 'Parsing taking too long' },
    { value: 'unsupported_format', label: 'Unsupported resume format' },
    { value: 'not_accessible', label: 'Feature not accessible' },
    { value: 'other', label: 'Other' },
  ],
  'resume-enhancer': [
    { value: 'enhancement_failed', label: 'Enhancement failed' },
    { value: 'incorrect_suggestions', label: 'Incorrect suggestions' },
    { value: 'missing_suggestions', label: 'Missing suggestions' },
    { value: 'poor_recommendations', label: 'Poor/irrelevant recommendations' },
    { value: 'enhancement_slow', label: 'Enhancement taking too long' },
    { value: 'content_changed', label: 'Resume content changed incorrectly' },
    { value: 'not_accessible', label: 'Feature not accessible' },
    { value: 'other', label: 'Other' },
  ],
  'ai-cover-letter': [
    { value: 'generation_failed', label: 'Cover letter generation failed' },
    { value: 'incorrect_job_info', label: 'Incorrect job information' },
    { value: 'incorrect_personalization', label: 'Incorrect personalization' },
    { value: 'content_generation', label: 'Content generation issue' },
    { value: 'formatting_issue', label: 'Formatting issue' },
    { value: 'download_export', label: 'Download/export issue' },
    { value: 'slow_response', label: 'Slow response' },
    { value: 'not_accessible', label: 'Feature not accessible' },
    { value: 'other', label: 'Other' },
  ],
  'job-search': [
    { value: 'jobs_not_loading', label: 'Jobs not loading' },
    { value: 'no_results', label: 'Search not returning results' },
    { value: 'incorrect_results', label: 'Incorrect job results' },
    { value: 'filters_not_working', label: 'Filters not working' },
    { value: 'job_details_incorrect', label: 'Job details incorrect' },
    { value: 'job_link_broken', label: 'Job link not working' },
    { value: 'duplicate_jobs', label: 'Duplicate jobs' },
    { value: 'location_filter', label: 'Location filter issue' },
    { value: 'performance_issue', label: 'Search performance issue' },
    { value: 'not_accessible', label: 'Feature not accessible' },
    { value: 'other', label: 'Other' },
  ],
  'job-match': [
    { value: 'matching_failed', label: 'Job matching failed' },
    { value: 'incorrect_matches', label: 'Incorrect job matches' },
    { value: 'poor_results', label: 'Poor match results' },
    { value: 'skills_not_matched', label: 'Skills not matched correctly' },
    { value: 'experience_matching', label: 'Experience matching issue' },
    { value: 'match_score_issue', label: 'Match score issue' },
    { value: 'missing_matches', label: 'Missing job matches' },
    { value: 'slow_response', label: 'Slow response' },
    { value: 'not_accessible', label: 'Feature not accessible' },
    { value: 'other', label: 'Other' },
  ],
  'mock-interview': [
    { value: 'interview_not_starting', label: 'Interview not starting' },
    { value: 'question_generation', label: 'Question generation issue' },
    { value: 'incorrect_questions', label: 'Incorrect questions' },
    { value: 'voice_audio_issue', label: 'Voice/audio issue' },
    { value: 'answer_evaluation', label: 'Answer evaluation issue' },
    { value: 'feedback_issue', label: 'Feedback issue' },
    { value: 'session_interrupted', label: 'Interview session interrupted' },
    { value: 'results_not_generated', label: 'Results not generated' },
    { value: 'not_accessible', label: 'Feature not accessible' },
    { value: 'other', label: 'Other' },
  ],
  'mock-test': [
    { value: 'test_not_starting', label: 'Test not starting' },
    { value: 'questions_not_loading', label: 'Questions not loading' },
    { value: 'incorrect_questions', label: 'Incorrect questions' },
    { value: 'answer_submission', label: 'Answer submission issue' },
    { value: 'timer_issue', label: 'Timer issue' },
    { value: 'test_interrupted', label: 'Test interrupted' },
    { value: 'results_not_generated', label: 'Results not generated' },
    { value: 'score_issue', label: 'Score issue' },
    { value: 'not_accessible', label: 'Feature not accessible' },
    { value: 'other', label: 'Other' },
  ],
  'browser-extension': [
    { value: 'installation_issue', label: 'Extension installation issue' },
    { value: 'extension_not_working', label: 'Extension not working' },
    { value: 'job_not_detected', label: 'Job description not detected' },
    { value: 'extraction_failed', label: 'Job description extraction failed' },
    { value: 'incorrect_extraction', label: 'Incorrect extracted content' },
    { value: 'resume_integration', label: 'Resume integration issue' },
    { value: 'cover_letter_integration', label: 'Cover letter integration issue' },
    { value: 'job_match_integration', label: 'Job Match integration issue' },
    { value: 'browser_compatibility', label: 'Browser compatibility issue' },
    { value: 'other', label: 'Other' },
  ],
  'chatbot': [
    { value: 'not_responding', label: 'Chatbot not responding' },
    { value: 'incorrect_answer', label: 'Incorrect answer' },
    { value: 'irrelevant_answer', label: 'Irrelevant answer' },
    { value: 'slow_response', label: 'Slow response' },
    { value: 'voice_assistant', label: 'Voice assistant issue' },
    { value: 'document_upload', label: 'Document upload issue' },
    { value: 'document_processing', label: 'Document processing issue' },
    { value: 'document_qa', label: 'Document question-answering issue' },
    { value: 'suggested_questions', label: 'Suggested questions issue' },
    { value: 'history_issue', label: 'Conversation history issue' },
    { value: 'other', label: 'Other' },
  ],
  'payment-billing': [
    { value: 'payment_failed', label: 'Payment failed' },
    { value: 'payment_declined', label: 'Payment declined' },
    { value: 'payment_deducted_not_activated', label: 'Payment deducted but subscription not activated' },
    { value: 'payment_status_not_updated', label: 'Payment status not updated' },
    { value: 'duplicate_payment', label: 'Duplicate payment' },
    { value: 'refund_request', label: 'Refund request' },
    { value: 'refund_not_received', label: 'Refund not received' },
    { value: 'invoice_not_generated', label: 'Invoice not generated' },
    { value: 'invoice_incorrect', label: 'Invoice incorrect' },
    { value: 'invoice_download', label: 'Invoice download issue' },
    { value: 'billing_amount_incorrect', label: 'Billing amount incorrect' },
    { value: 'subscription_plan', label: 'Subscription plan issue' },
    { value: 'subscription_renewal', label: 'Subscription renewal issue' },
    { value: 'subscription_cancellation', label: 'Subscription cancellation issue' },
    { value: 'upgrade_plan', label: 'Upgrade plan issue' },
    { value: 'downgrade_plan', label: 'Downgrade plan issue' },
    { value: 'tax_info', label: 'Tax/GST information issue' },
    { value: 'payment_method', label: 'Payment method issue' },
    { value: 'billing_history', label: 'Billing history issue' },
    { value: 'usage_balance', label: 'Usage/credit balance issue' },
    { value: 'other', label: 'Other' },
  ],
  'account-organization': [
    { value: 'login_issue', label: 'Login issue' },
    { value: 'account_access', label: 'Account access issue' },
    { value: 'organization_access', label: 'Organization access issue' },
    { value: 'user_invitation', label: 'User invitation issue' },
    { value: 'user_removal', label: 'User removal issue' },
    { value: 'role_permission', label: 'Role/permission issue' },
    { value: 'org_profile', label: 'Organization profile issue' },
    { value: 'password_reset', label: 'Password/reset issue' },
    { value: 'email_verification', label: 'Email verification issue' },
    { value: 'account_suspension', label: 'Account suspension issue' },
    { value: 'feature_access', label: 'Feature access/permission issue' },
    { value: 'other', label: 'Other' },
  ],
  'other': [
    { value: 'other_issue', label: 'Other issue' },
  ],
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: 'status-open' },
  in_progress: { label: 'In Progress', color: 'status-progress' },
  resolved: { label: 'Resolved', color: 'status-resolved' },
  closed: { label: 'Closed', color: 'status-closed' },
};

interface UserSettings {
  // Chat Preferences
  language: 'english' | 'spanish' | 'french' | 'german' | 'chinese';
  responseStyle: 'concise' | 'balanced' | 'detailed';
  responseLength: 'short' | 'medium' | 'long';
  showSources: boolean;
  typingIndicator: boolean;
  enterToSend: boolean;

  // Appearance
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  compactChat: boolean;

  // Voice
  enableVoiceInput: boolean;
  enableVoiceOutput: boolean;
  voiceLanguage: 'english' | 'spanish' | 'french' | 'german' | 'chinese';
  autoPlayResponses: boolean;

  // Documents
  enableDocumentUpload: boolean;
  useDocumentContext: boolean;

  // Conversation
  saveChatHistory: boolean;
  autoSave: boolean;

  // Notifications
  enableNotifications: boolean;
  enableSound: boolean;
  browserNotifications: boolean;

  // Accessibility
  reduceMotion: boolean;
  largerText: boolean;

  // Other
  showSuggestedQuestions: boolean;
}

const MessageIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    stroke="white"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 8C6 6.89543 6.89543 6 8 6H24C25.1046 6 26 6.89543 26 8V18C26 19.1046 25.1046 20 24 20H10L6 24V8Z" />
    <line x1="10" y1="12" x2="18" y2="12" />
    <line x1="10" y1="16" x2="14" y2="16" />
  </svg>
);

const ChatApp: React.FC = () => {
  const hasOpenedRef = useRef(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isClosed, setIsClosed] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('history');
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const [activeNavTab, setActiveNavTab] = useState<'chat' | 'history'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [tickets, setTickets] = useState<TicketInfo[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketInfo | null>(null);
  const [expandedMessageIds, setExpandedMessageIds] = useState<Set<string>>(new Set());
  const [messageFeedback, setMessageFeedback] = useState<Map<string, 'yes' | 'no'>>(new Map());
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isProcessingRef = useRef(false);  // Prevent concurrent requests
  const cachedEmailRef = useRef<string | null>(null);  // Cache email to avoid silent loss on getProfile() failure
  const selectedApp = 'CareerBot';
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showTicketSuccess, setShowTicketSuccess] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketFeature, setTicketFeature] = useState<string | null>(null);
  const [ticketIssueType, setTicketIssueType] = useState<string>('');
  const [ticketStepsToReproduce, setTicketStepsToReproduce] = useState('');
  const [ticketAttachments, setTicketAttachments] = useState<File[]>([]);
  const [ticketId, setTicketId] = useState('');
  const [ticketPriority, setTicketPriority] = useState<1 | 2>(1);
  const [ticketTransactionId, setTicketTransactionId] = useState('');
  const [ticketInvoiceNumber, setTicketInvoiceNumber] = useState('');
  const [ticketPaymentDate, setTicketPaymentDate] = useState('');
  const [ticketName, setTicketName] = useState('');
  const [ticketEmail, setTicketEmail] = useState('');
  const [ticketUserType, setTicketUserType] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [userName, setUserName] = useState('');
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false);
  const [isLocallyAuthenticated, setIsLocallyAuthenticated] = useState(isUserAuthenticated());

  // OTP Verification for unauthenticated users
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState(0);
  const otpCooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<UserSettings>({
    // Chat Preferences
    language: 'english',
    responseStyle: 'balanced',
    responseLength: 'medium',
    showSources: false,
    typingIndicator: true,
    enterToSend: true,

    // Appearance
    theme: 'system',
    fontSize: 'medium',
    compactChat: false,

    // Voice
    enableVoiceInput: false,
    enableVoiceOutput: false,
    voiceLanguage: 'english',
    autoPlayResponses: false,

    // Documents
    enableDocumentUpload: true,
    useDocumentContext: false,

    // Conversation
    saveChatHistory: true,
    autoSave: true,

    // Notifications
    enableNotifications: true,
    enableSound: true,
    browserNotifications: false,

    // Accessibility
    reduceMotion: false,
    largerText: false,

    // Other
    showSuggestedQuestions: true,
  });
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Backend API is now called via chatbotApi service
  // No need to manually construct URLs - httpClient handles baseURL and authentication

  // Text-to-speech readout for the settings.enableVoiceOutput toggle. The
  // interactive voice-mode UI (live transcript, listening indicator) that
  // used to drive speech *input* here was removed along with its state;
  // this is just the output half, still wired to that one setting.
  const playVoiceResponse = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  };


  const careerBotFeatures = [
    {
      id: 'login-issues',
      title: 'Login Issues',
      icon: LoginIcon,
      description: 'Account login and authentication problems',
      questions: [
        'Why am I unable to log in to my account?',
        'I forgot my password, how do I reset it?',
        'I\'m getting an authentication error, what should I do?',
        'How do I enable two-factor authentication?',
        'Why is my account locked?',
        'How do I create a new account?',
        'I\'m having trouble with Google/social login, what can I do?',
        'How do I update my email address?',
      ],
    },
    {
      id: 'ai-resume-builder',
      title: 'AI Resume Builder',
      icon: ResumeBuilderIcon,
      description: 'Create ATS-friendly resumes',
      questions: [
        'How can I create a resume using CareerBOT?',
        'How can I create an ATS-friendly resume?',
        'Which resume template should I choose?',
        'What information should I include in my resume?',
        'How can I customize my resume?',
        'How can I improve my resume for a specific job?',
      ],
    },
    {
      id: 'resume-parser',
      title: 'Resume Parser',
      icon: ResumeParserIcon,
      description: 'Extract resume data instantly',
      questions: [
        'How can I parse my resume?',
        'What information can CareerBOT extract from my resume?',
        'How accurate is resume parsing?',
        'What resume formats are supported?',
        'How can I review the parsed resume information?',
        'Can I edit the parsed resume data?',
      ],
    },
    {
      id: 'resume-enhancer',
      title: 'Resume Enhancer',
      icon: ResumeEnhancerIcon,
      description: 'Improve content and impact',
      questions: [
        'How can I improve my resume?',
        'How can I make my resume more professional?',
        'How can I improve my resume content?',
        'How can I make my resume ATS-friendly?',
        'Can CareerBOT suggest improvements to my resume?',
        'How can I tailor my resume for a specific job?',
      ],
    },
    {
      id: 'ai-cover-letter',
      title: 'AI Cover Letter',
      icon: CoverLetterIcon,
      description: 'Generate personalized cover letters',
      questions: [
        'How can I create a cover letter?',
        'Can CareerBOT create a cover letter for a specific job?',
        'How can I customize my cover letter?',
        'What information should I include in a cover letter?',
        'How can I make my cover letter more effective?',
        'Can I use my resume to generate a cover letter?',
      ],
    },
    {
      id: 'job-search',
      title: 'Job Search',
      icon: JobSearchIcon,
      description: 'Find active job openings',
      questions: [
        'How can I search for jobs?',
        'How can I find jobs matching my skills?',
        'Can I filter jobs by location?',
        'How can I find jobs for freshers?',
        'How can I search for jobs by role?',
        'How frequently are job listings updated?',
      ],
    },
    {
      id: 'job-match',
      title: 'Job Match',
      icon: JobMatchIcon,
      description: 'AI-powered job matching',
      questions: [
        'How does CareerBOT match jobs with my profile?',
        'How are my skills matched with job requirements?',
        'Why was a particular job recommended to me?',
        'How can I improve my job matches?',
        'What factors are considered for job matching?',
        'Can I see my match score for a job?',
      ],
    },
    {
      id: 'mock-interview',
      title: 'Mock Interview',
      icon: MockInterviewIcon,
      description: 'Practice with AI interviewers',
      questions: [
        'How can I start a mock interview?',
        'How does the mock interview work?',
        'What types of interviews can I practice?',
        'How do I get feedback after an interview?',
        'Can I practice interviews for a specific role?',
        'How can I improve my interview performance?',
      ],
    },
    {
      id: 'mock-test',
      title: 'Mock Test',
      icon: MockTestIcon,
      description: 'Role-based skill assessments',
      questions: [
        'How can I start a mock test?',
        'What types of mock tests are available?',
        'How are mock tests evaluated?',
        'Can I take a test for a specific role?',
        'How can mock tests help me prepare for jobs?',
        'Can I retake a mock test?',
      ],
    },
    {
      id: 'browser-extension',
      title: 'Browser Extension',
      icon: BrowserExtensionIcon,
      description: 'Extract job descriptions',
      questions: [
        'How can I use the CareerBOT browser extension?',
        'How can I extract a job description from a website?',
        'How can I use an extracted job description with my resume?',
        'Can I use the extension for Resume, Cover Letter, and Job Match?',
        'How do I install or use the browser extension?',
        'Which browsers are supported?',
      ],
    },
    {
      id: 'chatbot',
      title: 'Chatbot / AI Support',
      icon: ChatbotIcon,
      description: 'AI-powered support chatbot',
      questions: [
        'How do I start a conversation with the chatbot?',
        'Can I upload documents to the chatbot for analysis?',
        'How does the voice input feature work?',
        'Can I save my chat conversations?',
        'How can I get better and more accurate answers?',
        'What file formats are supported for document uploads?',
        'Can I export my chat history?',
        'How do I use suggested questions?',
      ],
    },
    {
      id: 'payment-billing',
      title: 'Payment & Billing',
      icon: PaymentBillingIcon,
      description: 'Subscription and payment management',
      questions: [
        'How do I make a payment or subscribe to a plan?',
        'What payment methods are supported?',
        'How do I upgrade or downgrade my subscription?',
        'How do I view my billing history and invoices?',
        'Can I cancel my subscription anytime?',
        'How are refunds handled?',
        'Is there a free trial available?',
        'How do I manage multiple organization subscriptions?',
        'What are the different pricing plans available?',
        'Can I pay annually instead of monthly?',
      ],
    },
    {
      id: 'account-organization',
      title: 'Account / Organization',
      icon: AccountOrganizationIcon,
      description: 'Account and organization settings',
      questions: [
        'How do I create and manage my account?',
        'How do I invite team members to my organization?',
        'What user roles and permissions are available?',
        'How do I update my organization profile and settings?',
        'Can I have multiple organizations on one account?',
        'How do I remove a user from my organization?',
        'How do I change my password or reset my account?',
        'Is single sign-on (SSO) available for my organization?',
        'How do I manage organization billing and subscriptions?',
        'Can I transfer organization ownership to another user?',
      ],
    },
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    // Only initialize chat when it's first opened
    if (isMinimized || hasOpenedRef.current) return;
    hasOpenedRef.current = true;

    const initializeApp = async () => {
      await ensureToken();
      await initializeChat();
      loadChatHistory();
      // Load tickets for both authenticated and unauthenticated users
      await loadTickets();

      if (isUserAuthenticated()) {
        // Load user's name for authenticated users
        try {
          const profile = await getProfile();
          if (profile?.full_name) {
            console.log('Setting userName to:', profile.full_name);
            setUserName(profile.full_name);
          }
          // Record who this initial load was for — otherwise checkAuthStatus's
          // userEmailRef stays null until its next tick/visibility/storage
          // event, and if a different account logs in on another tab during
          // that window, the switch goes undetected and this account's
          // history/tickets stay on screen under the new login.
          if (profile?.email) {
            userEmailRef.current = profile.email;
          }
        } catch (error) {
          console.error('Failed to load user profile:', error);
        }
      } else {
        console.log('User not authenticated, skipping profile load');
      }
    };

    initializeApp();
  }, [isMinimized]);

  // Track current user email to detect account switches
  // IMPORTANT: This MUST use getProfile().email (real email), NOT localStorage.user_email (fake guest email)
  const userEmailRef = useRef<string | null>(null);

  // Detect logout, login, or account switch
  useEffect(() => {
    const checkAuthStatus = async () => {
      // Nothing to reconcile until the widget has actually been opened —
      // skip the otherwise-unconditional profile refetch on every mount,
      // visibility change, and 30s tick, for every visitor on every page.
      if (!hasOpenedRef.current) return;

      const currentAuth = isUserAuthenticated();

      // Get REAL user email from profile for authenticated users
      // NEVER use localStorage.user_email which is a fake guest email
      let currentUserEmail: string | null = null;
      if (currentAuth) {
        try {
          const profile = await getProfile();
          currentUserEmail = profile?.email || null;
        } catch (error) {
          console.error('Failed to get current user profile:', error);
        }
      }

      // Initialize ref on first check
      if (!userEmailRef.current && currentUserEmail) {
        userEmailRef.current = currentUserEmail;
      }

      // Detect account switch (different REAL user email from profile)
      if (userEmailRef.current && currentUserEmail && userEmailRef.current !== currentUserEmail) {
        // User switched to a different account
        console.log('Account switch detected from', userEmailRef.current, 'to', currentUserEmail);
        userEmailRef.current = currentUserEmail;
        // Stale cache from the previous account must not be used as a
        // fallback owner for this account's saves (see the logout branch).
        cachedEmailRef.current = null;
        setUserName('');
        setTickets([]);
        setChatSessions([]);
        setIsLocallyAuthenticated(true);

        // Reload user profile and history for new account
        try {
          const userProfile = await getProfile();
          console.log('Loaded new account profile:', userProfile?.full_name);
          if (userProfile?.full_name) {
            setUserName(userProfile.full_name);
          }
          // Reload history and tickets for the new user (using real profile email)
          await loadChatHistory(currentUserEmail);
          await loadTickets(currentUserEmail);
        } catch (error) {
          console.error('Failed to load new account profile:', error);
        }
        return;
      }

      if (isLocallyAuthenticated && !currentAuth) {
        // Logout detected
        console.log('Logout detected, clearing auth state');
        userEmailRef.current = null;
        // Without this, a save that fails to refetch the profile after a
        // next-user login would silently fall back to the previous
        // account's cached email and write into their history instead.
        cachedEmailRef.current = null;
        setIsLocallyAuthenticated(false);
        setUserName('');
        setTickets([]);
        setChatSessions([]);
      } else if (!isLocallyAuthenticated && currentAuth) {
        // Login detected
        console.log('Login detected');
        userEmailRef.current = currentUserEmail;
        setIsLocallyAuthenticated(true);

        // Load user profile and history
        try {
          const userProfile = await getProfile();
          console.log('Loaded user profile:', userProfile?.full_name);
          if (userProfile?.full_name) {
            setUserName(userProfile.full_name);
          }
          // Reload history and tickets for the logged-in user (using real profile email)
          if (currentUserEmail) {
            await loadChatHistory(currentUserEmail);
            await loadTickets(currentUserEmail);
          }
        } catch (error) {
          console.error('Failed to load user profile:', error);
        }
      }
    };

    // Check on visibility change - ALWAYS refresh user data
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Window became visible, checking auth status');
        checkAuthStatus();
      }
    };

    // Check on storage change (tokens cleared or user changed)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'user_email' || e.key === 'token_last_refreshed_at') {
        console.log('Storage changed:', e.key);
        checkAuthStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    // Check immediately
    checkAuthStatus();

    // Check every 30 seconds instead of 3 seconds to reduce API load
    const interval = setInterval(checkAuthStatus, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [isLocallyAuthenticated]);

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem('careerbot-settings');
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (err) {
      console.log('Failed to load settings');
    }
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      localStorage.setItem('careerbot-settings', JSON.stringify(updated));
    } catch (err) {
      console.log('Failed to save settings');
    }
  };

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  };

  /**
   * KB Mapping: Maps natural-language questions to answers
   * Used as fallback when backend doesn't recognize the question
   */
  const getAnswerForQuestion = (question: string): string | null => {
    const q = question.toLowerCase().trim();

    // Question-to-answer mapping for all supported natural-language questions
    const questionAnswerMap: Record<string, string> = {
      // Products & Features
      'how can i create a resume?': '✨ Create ATS-friendly resumes in minutes with smart templates, AI content suggestions, and instant preview. Download as PDF, Word, or Text.',
      'how can i improve my resume?': '💡 Get AI suggestions to improve bullet points, add keywords, and increase your resume strength score instantly.',
      'what does resume parser do?': '📋 Upload your resume and we extract your experience, skills, and education automatically. Works with PDF, Word, and Text files.',
      'how can i create a cover letter?': '📝 Create personalized cover letters in 2 minutes tailored to each job description with multiple templates.',
      'how can i search for jobs?': '🔍 Access thousands of job listings filtered by role, location, and experience level with company ratings and trends.',
      'how does job match work?': '🎯 Get AI-powered job recommendations with match scores (0-100%) and skill gap analysis for each role.',
      'how does mock interview work?': '🎤 Practice interviews with AI feedback, real-time suggestions, and performance tracking to build confidence.',
      'what is mock test?': '📊 Take role-specific skill assessments with detailed results, benchmarking, and learning resources.',
      'how can careerbot help me with my resume?': '✨ CareerBot provides AI-powered tools to create, parse, and optimize your resume. Use our Resume Builder, Parser, and Enhancer for professional results.',
      'what features are available in careerbot?': '🚀 CareerBot offers Resume Builder, Resume Parser, Resume Enhancer, Cover Letter Generator, Job Search, Job Match, Mock Interview, and Skill Assessments.',

      // Subscription & Pricing
      'what is included in the free plan?': '✅ Resume Parser (2/month), Basic Job Search, Chatbot (limited), Job Match (Top 5), 1 Mock Test. Perfect to explore CareerBot!',
      'what features are available in the premium plan?': '💎 ₹299/month or ₹2,990/year (Save 17%). Unlimited access to all tools: Resume, Job Search, Mock Interviews, Alerts, and Priority Support. Free 7-day trial!',
      'what does the enterprise plan include?': '🏢 Custom pricing for teams & organizations. Includes everything in Premium + Team Dashboard, Bulk Licenses, Dedicated Manager, API Access, and 24/7 Support.',
      'what are the differences between the plans?': 'Free: Limited features | Premium (₹299/mo): Unlimited tools + Priority Support | Enterprise: Custom + Dedicated Manager. Choose what fits your needs!',
      'how can i upgrade my plan?': '1️⃣ Click "Upgrade" in settings | 2️⃣ Select plan & payment method | 3️⃣ Instant activation! Use code "START50" for 50% off first month.',
      'what is the refund policy?': '💯 7-day free trial, 30-day money-back guarantee with no questions asked. Cancel anytime. Refunds processed in 5-7 business days.',
      'how much does the premium plan cost?': '💰 Premium Plan: ₹299/month or ₹2,990/year (saves 17%). Includes unlimited access to all features and priority support.',
      'can i cancel my subscription?': '❌ Yes, you can cancel anytime with no penalties. Your access continues until the end of your billing period.',
      'can i change my subscription plan?': '🔄 Yes, you can upgrade or downgrade your plan anytime from your account settings. Changes take effect at your next billing cycle.',

      // Career Improvement
      'how can i optimize my resume?': '✨ Use our Builder, Parser & Enhancer to create ATS-friendly resumes with keywords, achievements, and professional formatting. Stand out to recruiters!',
      'how can i prepare for an interview?': '🎤 Practice with AI mock interviews, get real-time feedback, review recordings, and learn from 500+ Q&A. Build confidence before your real interview!',
      'how can i improve my job search strategy?': '🔍 Get AI-powered Job Match recommendations, smart alerts, and application tracking. Focus on 80%+ match roles, not just apply everywhere.',
      'how can i improve my skills?': '🧠 Assess skill gaps, get curated learning paths, find top courses for your target roles, and track progress with certifications.',
      'how can careerbot help me plan my career?': '🗺️ Map your career path with clear goals, identify skills to develop, discover adjacent roles, and plan your next move strategically.',
      'how can i improve my professional networking?': '🤝 Build professional connections with LinkedIn optimization, informational interview templates, and networking strategies to find hidden job opportunities.',
      'how can i prepare for my next job?': '🚀 Use Mock Interview practice, resume optimization, and skill assessments to prepare comprehensively for your next opportunity.',
      'how can i improve my chances of getting a job?': '⭐ Combine a strong resume, tailored applications, mock interview practice, and targeted job search. Focus on quality over quantity.',

      // Login & Account
      'how can i reset my password?': '🔑 Go to login page and click "Forgot Password?". Enter your email, check for the reset link (wait 2-3 minutes), click it, and create a new password.',
      'why can\'t i log in to my account?': '⚠️ Check your email/password spelling, verify Caps Lock is OFF, clear browser cache, try a different browser, or reset your password if forgotten.',
      'how can i get help with otp verification?': '📧 Check your spam folder, wait 2-3 minutes for the code, or request a new OTP. Codes expire after 10 minutes.',
      'what should i do if my account is locked?': '🔒 Account locked after multiple failed login attempts for security. Wait 15 minutes or reset your password to unlock immediately.',
      'how can i edit my profile?': '👤 Click Profile Icon → Settings → Edit your name, photo, bio, and contact info → Save Changes. Updates reflect instantly!',
      'how can i change my password?': '🔐 Settings → Security → Enter current password → Create new password (min 8 chars) → Confirm. Use strong, unique passwords!',
      'why am i not receiving the otp?': '❌ Check spam/junk folder, wait 2-3 minutes, verify correct email, or request a new OTP. Contact support if still having issues.',
      'how can i access my account?': '🔓 Visit the login page, enter your registered email and password. If you forgot your password, click "Forgot Password?" for reset instructions.',

      // Career Advice & Resume Enhancement
      'how do i make my resume stand out to recruiters?': '✨ Use strong action verbs, quantify achievements with numbers, tailor content to job descriptions, and ensure ATS compatibility. Focus on impact and results, not just responsibilities.',
      'what are the best resume templates and formats?': '📄 Use clean, modern formats with clear sections. Stick to 1-2 pages maximum. Popular options: chronological (most common), functional (emphasize skills), or hybrid. Avoid graphics that ATS readers can\'t parse.',
      'how do i highlight achievements with numbers and impact?': '🎯 Use metrics and results: "Increased sales by 25%", "Reduced costs by $50K", "Led team of 8 people". Replace vague descriptions with concrete numbers, percentages, and measurable outcomes.',
      'how does ats screening work with my resume?': '🤖 ATS (Applicant Tracking Systems) scans resumes for keywords matching job descriptions. To optimize: use standard formatting, include relevant keywords from the job posting, use standard section headers, and avoid graphics or tables.',
      'what skills are most in-demand in my field?': '⭐ This varies by industry. Focus on: technical skills specific to your field, soft skills (communication, leadership), and emerging technologies. Use job postings and industry reports to identify trending skills.',
      'how do i assess my skill gaps accurately?': '📊 Compare your current skills to job requirements in your target roles. Use self-assessment, get feedback from colleagues, take skill assessments, or use tools like CareerBot\'s skill analyzer.',
      'what courses should i take to improve skills?': '📈 Identify which skills are most needed for your target role, then look for courses on platforms like Coursera, Udemy, LinkedIn Learning, or industry-specific certifications. Prioritize high-demand skills.',
      'how do i prioritize which skills to learn?': '🧠 Focus on skills that: (1) are in high demand in your target roles, (2) align with your career goals, (3) have high ROI for your time investment, and (4) complement your existing expertise.',
      'what jobs match my skills and experience?': '💼 Use job search platforms and CareerBot\'s Job Match feature to find roles that align with your background. Look for positions requiring 70-100% of your current skills.',
      'how do i find entry-level or internship positions?': '🔍 Check job boards (LinkedIn, Indeed, Glassdoor), company career pages, university career centers, and networking events. Filter by experience level and apply directly to companies you admire.',
      'how do i customize my application for each job?': '📋 Tailor your resume and cover letter to each position by: using keywords from the job description, highlighting relevant experience, addressing specific requirements, and showing knowledge of the company.',
      'what is my skill match score for this role?': '🎯 Skill match scores compare your background to job requirements. A score of 70%+ generally indicates you\'re well-qualified. Use CareerBot\'s Job Match to see your score and skill gaps.',
      'what careers align with my background?': '💼 Analyze your skills, experience, and interests, then research similar roles. Use career assessment tools and informational interviews to explore adjacent opportunities.',
      'how accurate is job matching?': '📊 Job matching uses keyword and skill matching to identify roles. Accuracy improves when job descriptions are detailed and your profile is complete. Use it as a guide, not the only factor.',
      'what factors affect my job match score?': '🎯 Factors include: degree/education, years of experience, technical skills, soft skills, industry experience, certifications, and keyword matches with the job description.',
      'what roles should i target next?': '🎯 Analyze your skills, experience, and interests to identify adjacent roles. Look for positions that: (1) build on your current expertise, (2) have high market demand, (3) align with your career goals, and (4) offer growth potential. Use CareerBot\'s Job Match to discover suitable opportunities.',
      'what is a realistic career progression path for me?': '🚀 Map progression by analyzing: current role requirements, skills needed for next level, typical tenure in current role, and growth opportunities. Talk to people in target roles for realistic timelines.',
      'how do i plan my 5-year career strategy?': '📊 Set clear goals for skills, seniority, and industry. Create milestones: Year 1 (skills), Year 2-3 (increased responsibility), Year 4-5 (leadership/specialization). Review and adjust annually.',
      'should i transition to a different industry?': '🎯 Evaluate: transferable skills, market demand, salary expectations, required retraining, and your motivation. Consider lateral moves or bridge roles that leverage your current expertise.',
      'what are emerging roles in my field?': '💡 Research industry trends through LinkedIn, job boards, industry reports, and professional communities. Look for roles combining traditional skills with new technologies.',
      'where can i find internships in my field?': '🔍 Check LinkedIn, Indeed, company career pages, university career centers, professional associations, and networking events. Apply early and highlight relevant coursework.',
      'how do i write a strong internship application?': '📋 Highlight relevant coursework, projects, and skills. Write a compelling cover letter showing enthusiasm for the role and company. Customize each application.',
      'how do i network for internship opportunities?': '🤝 Attend industry events, connect on LinkedIn, reach out to alumni, informational interviews, and ask professors for referrals. Personal connections often lead to opportunities.',
      'what internships lead to full-time offers?': '📚 Internships in high-growth companies, strategic roles, and competitive industries often convert to offers. Perform well, show initiative, and express interest in full-time opportunities.',
      'how do i build a professional network?': '🤝 Attend industry events, connect on LinkedIn, reach out to colleagues, join professional groups, and offer value to others. Networking is mutual relationship-building.',
      'how do i reach out to professionals in my field?': '💼 Use LinkedIn, professional associations, alumni networks, or mutual connections. Personalize outreach, be specific about why you\'re reaching out, and offer value.',
      'what is appropriate networking etiquette?': '📧 Be professional and genuine. Research before reaching out, be respectful of people\'s time, follow up appropriately, and always thank people for their help.',
      'how do i leverage linkedin for job search?': '🔗 Optimize profile with keywords, connect strategically, engage with industry content, use LinkedIn\'s job search feature, and reach out to recruiters. Stay active and visible.',
      'what certifications are valuable in my field?': '📚 Research industry-standard certifications relevant to your target role. Focus on those recognized by employers and industry leaders in your field.',
      'where can i find quality online courses?': '🧠 Platforms like Coursera, Udemy, LinkedIn Learning, edX, and industry-specific sites offer quality courses. Read reviews and check instructor credentials.',
      'how do i balance education with job searching?': '🎓 Prioritize: allocate specific hours for learning, job search, and interviews. Focus on high-impact activities and keep both running concurrently to maximize your time.',
      'how long do popular certifications take?': '⏱️ Varies widely: some are 4-6 weeks, others take months or years. Factor in study time (10-20 hours/week), exam prep, and hands-on projects. Dedicate consistent time for best results.',

      // Interview & Mock Interview Questions
      'what are common behavioral interview questions?': '🎤 Common ones include: "Tell me about a challenge you overcame", "Describe a time you failed", "How do you handle conflict?", "Give an example of teamwork", "Describe your leadership style". Use STAR format (Situation, Task, Action, Result) for answers.',
      'how do i prepare for technical/coding interviews?': '💼 Practice data structures and algorithms, solve coding problems on LeetCode or HackerRank, review system design concepts, mock interview with peers, and practice explaining your thought process while coding.',
      'can i practice mock interviews with you?': '🎭 Yes! CareerBot offers Mock Interview feature where you can practice with AI feedback. Practice common behavioral questions, technical questions, and get real-time suggestions. Review recordings to improve.',
      'how do i answer difficult questions confidently?': '💬 Pause and think before answering, use STAR method for behavioral questions, be honest about limitations, stay calm, and practice extensively. Confidence comes from preparation and practice.',
      'what interview questions should i practice?': '🎤 Practice: behavioral (STAR format), technical (relevant to role), situational (how you handle scenarios), and cultural fit questions. Use CareerBot\'s mock interview to practice real scenarios.',
      'how do i improve my interview performance?': '💼 Record yourself answering questions, practice with mock interviews, get feedback from peers, research the company thoroughly, prepare thoughtful questions, and review your performance after each interview.',
      'how long is a typical mock interview session?': '⏱️ Most mock interviews last 30-60 minutes, similar to real interviews. This includes introduction, 4-6 questions, and closing. Practice sessions can be shorter (15-30 min) for focused skill building.',
      'how is my interview performance scored?': '📊 CareerBot scores based on: answer quality, structure (STAR format), confidence, clarity, relevance, and engagement. Get detailed feedback on each question and overall performance areas to improve.',
    };

    // Try exact match first
    if (questionAnswerMap[q]) {
      return questionAnswerMap[q];
    }

    // Try normalized match (remove punctuation, emoji, and special chars - match relatedMap normalization)
    const normalizedQ = q.toLowerCase().replace(/[^\w\s]/g, '').trim();
    for (const [mappedQ, answer] of Object.entries(questionAnswerMap)) {
      const normalizedMapped = mappedQ.toLowerCase().replace(/[^\w\s]/g, '').trim();
      if (normalizedQ === normalizedMapped) {
        return answer;
      }
    }

    return null;
  };

  const getRelatedQuestions = (userQuery: string, previousQuestions: string[] = []): string[] => {
    const query = userQuery.toLowerCase();
    const normalizedCurrent = userQuery.toLowerCase().replace(/[^\w\s]/g, '').trim();

    // Generate related questions based on user query keywords
    const relatedMap: Record<string, string[]> = {
      resume: [
        '✨ How do I make my resume stand out to recruiters?',
        '📄 What are the best resume templates and formats?',
        '🎯 How do I highlight achievements with numbers and impact?',
        '🤖 How does ATS screening work with my resume?',
      ],
      interview: [
        '🎤 What are common behavioral interview questions?',
        '💼 How do I prepare for technical/coding interviews?',
        '🎭 Can I practice mock interviews with you?',
        '💬 How do I answer difficult questions confidently?',
      ],
      mock: [
        '🎤 What interview questions should I practice?',
        '💼 How do I improve my interview performance?',
        '⏱️ How long is a typical mock interview session?',
        '📊 How is my interview performance scored?',
      ],
      skills: [
        '⭐ What skills are most in-demand in my field?',
        '📊 How do I assess my skill gaps accurately?',
        '📈 What courses should I take to improve skills?',
        '🧠 How do I prioritize which skills to learn?',
      ],
      job: [
        '💼 What jobs match my skills and experience?',
        '🔍 How do I find entry-level or internship positions?',
        '📋 How do I customize my application for each job?',
        '🎯 What is my skill match score for this role?',
      ],
      match: [
        '💼 What careers align with my background?',
        '📊 How accurate is job matching?',
        '🎯 What factors affect my job match score?',
        '🚀 What roles should I target next?',
      ],
      career: [
        '🚀 What is a realistic career progression path for me?',
        '📊 How do I plan my 5-year career strategy?',
        '🎯 Should I transition to a different industry?',
        '💡 What are emerging roles in my field?',
      ],
      internship: [
        '🔍 Where can I find internships in my field?',
        '📋 How do I write a strong internship application?',
        '🤝 How do I network for internship opportunities?',
        '📚 What internships lead to full-time offers?',
      ],
      network: [
        '🤝 How do I build a professional network?',
        '💼 How do I reach out to professionals in my field?',
        '📧 What is appropriate networking etiquette?',
        '🔗 How do I leverage LinkedIn for job search?',
      ],
      education: [
        '📚 What certifications are valuable in my field?',
        '🧠 Where can I find quality online courses?',
        '🎓 How do I balance education with job searching?',
        '⏱️ How long do popular certifications take?',
      ],
    };

    // Find matching related questions
    let candidateQuestions: string[] = [];
    for (const [keyword, questions] of Object.entries(relatedMap)) {
      if (query.includes(keyword)) {
        candidateQuestions = questions;
        break;
      }
    }

    if (candidateQuestions.length === 0) {
      return [];
    }

    // Filter out: current question, previously asked questions, and duplicates
    const filtered = candidateQuestions.filter((q) => {
      const normalizedQ = q.toLowerCase().replace(/[^\w\s]/g, '').trim();

      // Don't repeat the current question
      if (normalizedQ === normalizedCurrent) return false;

      // Don't repeat previously asked questions
      if (previousQuestions.some(prev => {
        const normalizedPrev = prev.toLowerCase().replace(/[^\w\s]/g, '').trim();
        return normalizedPrev === normalizedQ;
      })) return false;

      return true;
    });

    // Fisher-Yates shuffle to avoid bias from Math.random() - 0.5
    const shuffled = [...filtered];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 4);
  };

  const ensureToken = () => {
    let token = localStorage.getItem('access_token');
    if (!token) {
      const email = `guest-${Date.now()}@careerbot.local`;
      token = btoa(JSON.stringify({
        email,
        timestamp: Date.now(),
      }));
      localStorage.setItem('access_token', token);
      localStorage.setItem('user_email', email);
      localStorage.setItem('user_id', email.split('@')[0]);
    }
  };

  // Authentication is now handled by httpClient via httpOnly cookies
  // No need for manual authHeaders

  const initializeChat = async () => {
    // Create a new session ID - backend will accept it on first message
    const newSessionId = `chat-session-${Date.now()}`;
    setSessionId(newSessionId);

    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'assistant',
      text: `Hi! I'm CareerBot. 🤖 How can I help you today?`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const loadChatHistory = async (authedEmail?: string) => {
    // Only load chat history for authenticated users
    if (!isUserAuthenticated()) {
      setChatSessions([]);
      return;
    }

    // Get user email from profile for security - prevent one user from accessing another's history
    // ALWAYS use getProfile().email, NEVER use localStorage.user_email (which is a fake guest email)
    let userEmail = authedEmail;
    if (!userEmail) {
      try {
        const profile = await getProfile();
        userEmail = profile?.email;
      } catch {
        console.error('Failed to get profile for history loading');
        setChatSessions([]);
        return;
      }
    }

    if (!userEmail) {
      setChatSessions([]);
      return;
    }

    // Load from global storage key and filter by current user
    try {
      const savedSessions = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
      if (savedSessions) {
        const allSessions: StoredChatSession[] = JSON.parse(savedSessions);

        // Filter to only this user's sessions. Include sessions without userEmail (backward compat for older entries)
        const userSessions = allSessions.filter((s) => s.userEmail === userEmail || !s.userEmail);

        if (userSessions.length === 0) {
          // No sessions for this user
          setChatSessions([]);
          return;
        }

        // Unowned sessions stay visible to every account (backward compat
        // for entries saved before userEmail existed) but are never stamped
        // with whoever happens to load history first — that would silently
        // and permanently hand one account's legacy chats to a different
        // account on a shared device, with no way back. `userEmail` below
        // is set only on the in-memory copy used to render this screen.

        // Load user's sessions
        const loadedSessions: ChatSession[] = userSessions.map((s) => ({
          ...s,
          userEmail,
          date: new Date(s.date),
          messages: s.messages?.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
        }));
        setChatSessions(loadedSessions);
        return;
      }
    } catch (error) {
      console.error('Failed to load saved chat sessions:', error);
    }

    // No saved sessions - show empty history
    setChatSessions([]);
  };

  // Load messages for a specific session
  const loadSessionMessages = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (!session) return;

    const restoredNotice: Message = {
      id: `${sessionId}-restored`,
      type: 'system',
      text: RESTORED_NOTICE_TEXT,
      timestamp: new Date(),
    };

    if (session.messages && session.messages.length > 0) {
      // Full transcript was saved — restore the actual conversation as-is.
      setMessages([...session.messages, restoredNotice]);
    } else {
      // Backward compatibility: sessions saved before the full transcript
      // was persisted only have a title/preview snapshot — fall back to that.
      // Older saves could set title === preview, so only show the preview
      // when it actually adds something beyond the title.
      const hasDistinctPreview = session.preview && session.preview.trim() !== session.title.trim();
      const sessionMessages: Message[] = [
        {
          id: `${sessionId}-1`,
          type: 'assistant',
          text: hasDistinctPreview ? `📋 ${session.title}\n\n${session.preview}` : `📋 ${session.title}`,
          timestamp: session.date,
        },
        restoredNotice,
      ];
      setMessages(sessionMessages);
    }

    setIsHistoryOpen(false);
    setSessionId(sessionId);
  };

  const loadTickets = async (authedEmail?: string) => {
    const isAuth = isUserAuthenticated();
    console.log('[loadTickets] Starting - is authenticated:', isAuth);

    // Try to load from backend for authenticated users
    if (isAuth) {
      try {
        const data = await getSupportTickets();
        const backendTickets: TicketInfo[] = (data.data || []).map((ticket: SupportTicket) => ({
          id: ticket.ticket_id || `ticket-${Date.now()}-${Math.random()}`,
          subject: ticket.subject,
          status: ticket.status,
          // Backend priority is 'normal' | 'urgent'; the UI flags 2 as urgent.
          priority: ticket.priority === 'urgent' ? 2 : 1,
          created_at: ticket.created_at,
          contact_email: ticket.user_email,
          description: ticket.description,
          affected_feature: ticket.affected_feature,
          updated_at: ticket.updated_at,
          user_name: ticket.user_name,
        }));

        // If backend returns tickets, use them and save to localStorage
        if (backendTickets.length > 0) {
          setTickets(backendTickets);
          localStorage.setItem('saved_tickets', JSON.stringify(backendTickets));
          return;
        } else {
          // Backend returned empty, try localStorage as backup
          console.log('[loadTickets] Backend returned empty, checking localStorage');
        }
      } catch (error) {
        console.error('[loadTickets] Backend failed, trying localStorage:', error);
      }
    }

    // Try to load saved tickets from localStorage (for both auth and guest users)
    try {
      const savedTickets = localStorage.getItem('saved_tickets');
      const guestEmail = localStorage.getItem('guest_ticket_email');

      // IMPORTANT: For authenticated users, get real email from profile, NOT fake localStorage email
      let ownerEmail = authedEmail;
      if (!ownerEmail && isAuth) {
        try {
          const profile = await getProfile();
          ownerEmail = profile?.email || undefined;
        } catch (error) {
          console.error('[loadTickets] Failed to get profile email:', error);
        }
      }

      if (savedTickets) {
        const tickets: TicketInfo[] = JSON.parse(savedTickets);

        // Filter for guest users only
        if (!isAuth) {
          if (guestEmail) {
            const guestTickets = tickets.filter((t) => t.contact_email === guestEmail);
            setTickets(guestTickets);
            return;
          }
        } else {
          // For authenticated users, show only their own tickets. If the real
          // owner email could not be resolved (profile fetch failed above),
          // show NOTHING rather than the unfiltered list: 'saved_tickets' is a
          // single device-wide key, so the unfiltered list would leak another
          // user's ticket subjects/descriptions to whoever is logged in on a
          // shared device.
          const userTickets = ownerEmail ? tickets.filter((t) => t.contact_email === ownerEmail) : [];
          console.log('[loadTickets] Authenticated - showing user tickets from localStorage');
          setTickets(userTickets);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to load saved tickets from localStorage:', error);
    }

    console.log('[loadTickets] No tickets found, setting empty');
    setTickets([]);
  };

  const handleSendMessage = async (text?: string) => {
    // Prevent concurrent requests (especially from double-clicks on related questions)
    if (isProcessingRef.current) {
      console.warn('Request already in progress, ignoring duplicate click');
      return;
    }

    const messageText = text || inputValue;
    if (!messageText.trim() || !sessionId) return;

    // Mark that we're processing a request
    isProcessingRef.current = true;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Check if user is authenticated
      const isAuthenticated = isUserAuthenticated();

      // Classify the query
      const queryType = classifyQuery(messageText);

      // Check if guest user can answer this query
      if (!isAuthenticated && !canGuestAnswer(queryType)) {
        // Guest user asking an authenticated query
        const authMessage = getAuthRequiredMessage(queryType);
        const loginPromptMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          text: `${authMessage}\n\n[Please log in to continue]`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, loginPromptMessage]);

        if (settings.enableVoiceOutput) {
          playVoiceResponse(authMessage);
        }
      } else {
        // PHASE 1: Check if we have a frontend KB answer (skip API call if we do)
        const frontendAnswer = getAnswerForQuestion(messageText);

        if (frontendAnswer) {
          // Use frontend KB answer directly - no API call needed
          // Get previous user questions to avoid duplication
          const previousQuestions = messages
            .filter(m => m.type === 'user')
            .map(m => m.text);

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            text: frontendAnswer,
            timestamp: new Date(),
            sources: [],
            relatedQuestions: getRelatedQuestions(messageText, previousQuestions),
          };
          setMessages((prev) => [...prev, assistantMessage]);

          if (settings.enableVoiceOutput) {
            playVoiceResponse(frontendAnswer);
          }
        } else {
          // PHASE 2: No frontend KB answer - try backend API
          const data = await sendChatMessage(messageText, sessionId);

          // Check if we got a confident answer from the backend KB
          const hasConfidentAnswer = data.answer && data.confidence >= 0.7;

          // Get previous user questions to avoid duplication
          const previousQuestions = messages
            .filter(m => m.type === 'user')
            .map(m => m.text);

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            text: hasConfidentAnswer ? data.answer : "❌ I couldn't find an answer to that question in our knowledge base. Please raise a support ticket and our team will help you!",
            timestamp: new Date(),
            sources: data.sources || [],
            relatedQuestions: hasConfidentAnswer ? getRelatedQuestions(messageText, previousQuestions) : [],
          };
          setMessages((prev) => [...prev, assistantMessage]);

          if (settings.enableVoiceOutput) {
            playVoiceResponse(assistantMessage.text);
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);

      const responseText = error instanceof Error ? error.message : 'Failed to get response from chatbot';

      const demoMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        text: responseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, demoMessage]);

      if (settings.enableVoiceOutput) {
        playVoiceResponse(responseText);
      }
    } finally {
      setIsLoading(false);
      // Mark that we're done processing
      isProcessingRef.current = false;
    }
  };

  // Handle menu option selection with response
  const handleStartVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        // In a real app, you'd send audioChunksRef.current to a speech-to-text API
        const text = `[Voice message recorded - ${new Date().toLocaleTimeString()}]`;
        handleSendMessage(text);
        audioChunksRef.current = [];
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start voice recording:', error);
      alert('Microphone permission denied. Please enable microphone access.');
    }
  };

  const handleStopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };



  const startNewChat = () => {
    // Save current chat to history only for authenticated users
    if (messages.length > 1 && isUserAuthenticated()) {
      // Filter out the restored-session notice (UI-only marker)
      const filteredMessages = messages.filter((m) => m.text !== RESTORED_NOTICE_TEXT);

      // Guard: don't save if nothing was added since restore (e.g., opened an old session and immediately started new chat)
      const nothingNewSinceRestore = filteredMessages.length === 0;
      if (nothingNewSinceRestore) {
        setMessages([]);
        setInputValue('');
        setIsHistoryOpen(false);
        initializeChat();
        return;
      }

      // Build title and preview from filtered messages (not raw messages with restored notice)
      const nonSystemMessages = filteredMessages.filter((m) => m.type !== 'system');
      const userMessages = nonSystemMessages.filter((m) => m.type === 'user');
      const assistantMessages = nonSystemMessages.filter((m) => m.type === 'assistant');

      const newSession: ChatSession = {
        id: sessionId || `session-${Date.now()}`,
        // Use user's first question as title
        title: userMessages[0]?.text?.substring(0, 50) || 'New Chat',
        date: new Date(),
        // Preview the second assistant message if available, otherwise first
        preview: assistantMessages[1]?.text?.substring(0, 100) || assistantMessages[0]?.text?.substring(0, 100) || 'New conversation...',
        messages: filteredMessages,
      };

      // Get real user email from profile (NOT fake localStorage email) and save
      // IMPORTANT: Use getProfile().email, NEVER localStorage.user_email which is a fake guest email
      getProfile()
        .then((profile) => {
          if (profile?.email) {
            cachedEmailRef.current = profile.email;
            // saveSessionToStorage returns the user's visible sessions after save
            const visibleSessions = saveSessionToStorage(newSession, profile.email);
            setChatSessions(visibleSessions);
          }
        })
        .catch((error) => {
          console.error('Failed to save chat session:', error);
          // Use cached email if getProfile fails (prevents silent loss)
          if (cachedEmailRef.current) {
            const visibleSessions = saveSessionToStorage(newSession, cachedEmailRef.current);
            setChatSessions(visibleSessions);
          }
        });
    }

    setMessages([]);
    setInputValue('');
    setIsHistoryOpen(false);
    initializeChat();
  };

  const openTicketModal = async (prefillSubject?: string) => {
    setTicketSubject(prefillSubject || '');
    setTicketDescription('');
    setTicketFeature(null);
    setTicketIssueType('');
    setTicketStepsToReproduce('');
    setTicketAttachments([]);
    setTicketTransactionId('');
    setTicketInvoiceNumber('');
    setTicketPaymentDate('');
    setTicketPriority(1);
    setTicketName('');
    setTicketEmail('');
    // A verification belongs to one email and one ticket: never carry it over.
    setIsOtpVerified(false);
    setVerificationToken(null);
    setOtpCode('');
    setShowOtpVerification(false);
    setOtpMessage('');
    setOtpError('');

    // Auto-populate Name and Email for authenticated users
    if (isUserAuthenticated()) {
      try {
        const userProfile = await getProfile();
        setTicketName(userProfile.full_name || '');
        setTicketEmail(userProfile.email || '');
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Continue anyway, fields will be empty
      }
    }

    setShowTicketModal(true);
  };

  const handleAttachmentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setTicketAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setTicketAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendOtp = async () => {
    setOtpError('');
    setOtpMessage('');

    // Check if cooldown is active
    if (otpCooldownSeconds > 0) {
      setOtpError(`Please wait ${otpCooldownSeconds} seconds before requesting a new OTP`);
      return;
    }

    if (!ticketEmail.trim()) {
      setOtpError('Please enter your email address');
      return;
    }

    setIsSendingOtp(true);
    try {
      const response = await sendTicketOtp({ email: ticketEmail });
      setOtpMessage('OTP sent to your email! Check your inbox.');
      setShowOtpVerification(true);
      setOtpCode('');

      // Start 60-second cooldown after successful OTP send
      setOtpCooldownSeconds(60);
      if (otpCooldownTimerRef.current) {
        clearInterval(otpCooldownTimerRef.current);
      }
      otpCooldownTimerRef.current = setInterval(() => {
        setOtpCooldownSeconds((prev) => {
          if (prev <= 1) {
            if (otpCooldownTimerRef.current) {
              clearInterval(otpCooldownTimerRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: unknown) {
      const errorMessage = describeError(error, 'Failed to send OTP');

      // Parse cooldown time from error message (e.g., "Please wait 12 seconds...")
      const cooldownMatch = errorMessage.match(/(\d+)\s*second/);
      // Use backend's cooldown time from error, or default to 30 seconds
      const cooldownTime = cooldownMatch ? parseInt(cooldownMatch[1], 10) : 30;

      // Only show error if it's not a rate limit error (rate limit is shown in button countdown)
      if (!cooldownMatch) {
        setOtpError(errorMessage);
      } else {
        // For rate limit errors, show brief message then auto-dismiss
        setOtpError(`⏳ Please wait ${cooldownTime} seconds`);
        setTimeout(() => {
          setOtpError('');
        }, 2000);
      }

      // Start cooldown on error (use backend's cooldown time or default 15 seconds)
      setOtpCooldownSeconds(cooldownTime);
      if (otpCooldownTimerRef.current) {
        clearInterval(otpCooldownTimerRef.current);
      }
      otpCooldownTimerRef.current = setInterval(() => {
        setOtpCooldownSeconds((prev) => {
          if (prev <= 1) {
            if (otpCooldownTimerRef.current) {
              clearInterval(otpCooldownTimerRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError('');
    setOtpMessage('');

    if (!otpCode.trim()) {
      setOtpError('Please enter the OTP');
      return;
    }

    if (otpCode.length !== 6) {
      setOtpError('OTP must be 6 digits');
      return;
    }

    setIsSendingOtp(true);
    try {
      const response = await verifyTicketOtp({
        email: ticketEmail,
        otp: otpCode,
      });

      if (response.verified) {
        setIsOtpVerified(true);
        setVerificationToken(response.token || null);
        setOtpMessage('✓ Email verified successfully!');
        setShowOtpVerification(false);
      } else {
        setOtpError('OTP verification failed. Please try again.');
      }
    } catch (error: unknown) {
      setOtpError(describeError(error, 'Invalid OTP'));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const submitTicket = async () => {
    // Determine feature based on auth status
    const featureToSubmit = isUserAuthenticated() ? ticketFeature : 'login-issues';

    // Validate required fields
    if (!ticketSubject.trim() || !ticketDescription.trim() || !sessionId) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate title length (minimum 5 characters)
    if (ticketSubject.trim().length < 5) {
      alert('Issue title must be at least 5 characters long');
      return;
    }

    // Validate description length (minimum 20 characters)
    if (ticketDescription.trim().length < 20) {
      alert('Issue description must be at least 20 characters long');
      return;
    }

    // For authenticated users, require feature selection
    if (isUserAuthenticated() && !featureToSubmit) {
      alert('Please select an affected feature');
      return;
    }

    // For unauthenticated users, Name, Email, and User Type are required
    if (!isUserAuthenticated()) {
      if (!ticketName.trim() || !ticketEmail.trim() || !ticketUserType.trim()) {
        alert('Please provide your name, email, and user type to raise a support ticket');
        return;
      }

      // Require OTP verification for unauthenticated users
      if (!isOtpVerified) {
        alert('Please verify your email with OTP before submitting the ticket');
        return;
      }

      // Require issue type for non-auth users
      if (!ticketIssueType.trim()) {
        alert('Please select an issue type');
        return;
      }
    }

    setIsSubmittingTicket(true);

    try {
      const escalationData = await escalateToSupport({
        // featureToSubmit is only null when unauthenticated (where it's
        // hardcoded to 'login-issues' above) or when the guard above this
        // try block already returned for a missing authenticated selection.
        issue_category: featureToSubmit || 'login-issues',
        issue_title: ticketSubject,
        issue_description: ticketDescription,
        session_id: sessionId,
        contact_email: ticketEmail || undefined,
        issue_details: {
          feature: featureToSubmit,
          issue_type: ticketIssueType,
          steps_to_reproduce: ticketStepsToReproduce,
          priority: ticketPriority,
          requester_name: ticketName || undefined,
          requester_email: ticketEmail || undefined,
          user_type: ticketUserType || undefined,
          verification_token: verificationToken || undefined,
          ...(featureToSubmit === 'payment-billing' && {
            transaction_id: ticketTransactionId,
            invoice_number: ticketInvoiceNumber,
            payment_date: ticketPaymentDate,
          }),
        },
      });

      const ticket: TicketInfo = {
        id: escalationData.ticket_id,
        subject: ticketSubject,
        status: escalationData.status,
        priority: ticketPriority,
        created_at: new Date().toISOString(),
        contact_email: ticketEmail, // Include email for guest ticket filtering
      };

      setTicketId(escalationData.ticket_id);
      setTickets((prev) => {
        const updated = [ticket, ...prev];
        // Save to localStorage for persistence
        localStorage.setItem('saved_tickets', JSON.stringify(updated));
        return updated;
      });

      // Save guest email to localStorage if not authenticated
      if (!isUserAuthenticated()) {
        localStorage.setItem('guest_ticket_email', ticketEmail);
      }
      setShowTicketModal(false);
      setShowTicketSuccess(true);
    } catch (error: unknown) {
      console.error('Failed to create ticket:', error);

      const status = getHttpStatus(error);

      // Guest: 403 means the email verification token is missing, expired or
      // does not match the email. Make them verify again instead of failing.
      if (status === 403 && !isUserAuthenticated()) {
        setIsOtpVerified(false);
        setVerificationToken(null);
        setOtpMessage('');
        alert('Your email verification has expired or does not match this email. Please verify your email again (Send OTP), then resubmit.');
        return;
      }

      // For auth errors, show a helpful message
      if (status === 401 || status === 403) {
        alert('❌ Your session has expired.\n\nPlease log in again to raise a support ticket.\n\nAlternatively, you can contact us directly at support@careerbot.com');
        setShowTicketModal(false);
        return;
      }

      // Nothing was created: say so and keep the modal (and what the user
      // typed) open so they can retry. Never show a confirmation here.
      alert(describeError(error, 'Failed to create ticket. Please try again.'));
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  if (isClosed) {
    return (
      <div className="chatbot-root">
        <div className="chat-minimized">
          <button className="restore-btn" onClick={() => { setIsClosed(false); setIsMinimized(false); }} title="Open CareerBot Support">
            <span className="restore-avatar">
              <span className="bot-glyph">🤖</span>
              <span className="status-dot" />
            </span>
            <span className="restore-label">
              <strong>{selectedApp} Support</strong>
              <small>We&apos;re online</small>
            </span>
          </button>
        </div>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="chatbot-root">
        <div className="launcher-container launcher-with-gap">
          <div className="launcher-tooltip-wrapper">
            {/* Authenticated users only get the bare launcher button (no
                auto-shown bubble) — the chat must never pop open on its own
                after login, only on explicit click. Guests keep the existing
                greeting bubble. */}
            {!isLocallyAuthenticated && (
              <div className="greeting-bubble-tooltip">
                <div className="bubble-left-icon">
                  <span className="bubble-bot-icon">🤖</span>
                  <span className="bubble-status-dot" />
                </div>
                <div className="bubble-content">
                  <h3 className="bubble-title">{selectedApp} Support</h3>
                  <p className="bubble-subtitle">How can we help?</p>
                </div>
                <div className="bubble-pointer" />
              </div>
            )}

            <button
              className="floating-chat-button"
              onClick={() => setIsMinimized(false)}
              title="Chatbot Support"
              aria-label="Chatbot Support"
            >
              <MessageIcon />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chatbot-root">
      <div className="widget-panel">
      <div className="ambient-blob blob-a" />
      <div className="ambient-blob blob-b" />

      {/* Sidebar */}
      <aside className={`chat-sidebar ${isHistoryOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          {isLocallyAuthenticated && (
            <div className="user-profile-section" style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Logged in as</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{userName || 'User'}</div>
            </div>
          )}
          <div className="sidebar-header-row">
            {isLocallyAuthenticated && (
              <div className="sidebar-tabs">
                <button
                  className={`tab-btn ${sidebarTab === 'history' ? 'active' : ''}`}
                  onClick={() => setSidebarTab('history')}
                >
                  💬 History
                </button>
                <button
                  className={`tab-btn ${sidebarTab === 'tickets' ? 'active' : ''}`}
                  onClick={() => setSidebarTab('tickets')}
                >
                  🎫 Tickets
                  {tickets.length > 0 && <span className="tab-count">{tickets.length}</span>}
                </button>
              </div>
            )}
            <button className="close-btn" onClick={() => setIsHistoryOpen(false)}>✕</button>
          </div>
        </div>

        {isLocallyAuthenticated ? (
          <>
            {sidebarTab === 'history' ? (
              <div className="sessions-list">
                {chatSessions.length === 0 ? (
                  <div className="empty-tickets">
                    <span className="empty-tickets-icon">💬</span>
                    <p>No messages</p>
                    <small>No chat history available. Your past conversations will show up here.</small>
                  </div>
                ) : (
                  chatSessions.map((session) => (
                    <div
                      key={session.id}
                      className="session-item"
                      onClick={() => loadSessionMessages(session.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="session-title">{session.title}</div>
                      <div className="session-preview">{session.preview}</div>
                      <div className="session-date">
                        {session.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="sessions-list">
                {tickets.length === 0 ? (
                  <div className="empty-tickets">
                    <span className="empty-tickets-icon">🎫</span>
                    <p>No tickets yet</p>
                    <small>Raise one when you need human help</small>
                  </div>
                ) : (
                  tickets.map((ticket, index) => {
                    const meta = STATUS_META[ticket.status] || STATUS_META.open;
                    return (
                      <div
                        key={ticket.id || `ticket-${index}`}
                        className="ticket-card"
                        onClick={() => setSelectedTicket(ticket)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="ticket-card-top">
                          <span className={`status-pill ${meta.color}`}>{meta.label}</span>
                          {ticket.priority === 2 && <span className="priority-flag">🔥 Urgent</span>}
                        </div>
                        <div className="ticket-card-subject">{ticket.subject}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                          <div className="ticket-card-id">#{(ticket.id || 'N/A').toString().slice(-8)}</div>
                          <span style={{ fontSize: '10px', color: '#4ade80', fontWeight: 600 }}>Notified</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            <button className="new-chat-btn" onClick={startNewChat}>
              ✨ New Conversation
            </button>
          </>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            <p style={{ fontSize: '14px', marginBottom: '10px' }}>📝 Chat history is available only for logged-in users</p>
            <p style={{ fontSize: '12px' }}>Please sign in to view your conversation history and tickets</p>
          </div>
        )}
      </aside>

      {isHistoryOpen && <div className="sidebar-scrim" onClick={() => setIsHistoryOpen(false)} />}

      {/* Main Chat Area */}
      <main className="chat-main">
        {/* Header */}
        <header className="chat-header">
          <div className="header-content">
            {isLocallyAuthenticated && (
              <button
                className="sidebar-toggle"
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                title="Toggle History"
              >
                ☰
              </button>
            )}
            <div className="header-avatar">
              <span className="bot-glyph">🤖</span>
              <span className="status-dot" />
            </div>
            <div className="app-title">
              <h1>{selectedApp} Support</h1>
              <p>{isLocallyAuthenticated ? `👤 ${userName || 'User'}` : 'Online · Replies in seconds'}</p>
            </div>
          </div>

          <div className="header-actions">
            <button className="minimize-btn" onClick={() => setIsMinimized(true)} title="Minimize (collapse and keep conversation)">
              ↙↗
            </button>

            <button className="close-btn-header" onClick={() => { setMessages([]); setInputValue(''); setIsMinimized(true); }} title="Close (exit to launcher and clear conversation)">
              ×
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="messages-container" ref={messagesContainerRef}>
          {(messages.length <= 5 || showSuggestionsPanel) && settings.showSuggestedQuestions && (
            <div className="top-suggestions">
              <div className="top-suggestions-title">How can we help?</div>
              <div className="top-suggestions-questions help-questions">
                <button
                  className="feature-question-btn help-question"
                  onClick={() => setExpandedMenu(expandedMenu === 'features' ? null : 'features')}
                  style={{position: 'relative'}}
                >
                  {expandedMenu === 'features' ? '▼' : '▶'} I want to know more about the products and features
                </button>
                {expandedMenu === 'features' && (
                  <div className="features-grid">
                    <button onClick={() => handleSendMessage('How can I create a resume?')} className="feature-card">📄 How can I create a resume?</button>
                    <button onClick={() => handleSendMessage('How can I improve my resume?')} className="feature-card">💡 How can I improve my resume?</button>
                    <button onClick={() => handleSendMessage('What does Resume Parser do?')} className="feature-card">📋 What does Resume Parser do?</button>
                    <button onClick={() => handleSendMessage('How can I create a cover letter?')} className="feature-card">📝 How can I create a cover letter?</button>
                    <button onClick={() => handleSendMessage('How can I search for jobs?')} className="feature-card">🔍 How can I search for jobs?</button>
                    <button onClick={() => handleSendMessage('How does Job Match work?')} className="feature-card">🎯 How does Job Match work?</button>
                    <button onClick={() => handleSendMessage('How does Mock Interview work?')} className="feature-card">🎤 How does Mock Interview work?</button>
                    <button onClick={() => handleSendMessage('What is Mock Test?')} className="feature-card">📊 What is Mock Test?</button>
                    <button onClick={() => handleSendMessage('How can CareerBot help me with my resume?')} className="feature-card">✨ How can CareerBot help with my resume?</button>
                    <button onClick={() => handleSendMessage('What features are available in CareerBot?')} className="feature-card">💬 What features are available?</button>
                  </div>
                )}
                <button
                  className="feature-question-btn help-question"
                  onClick={() => setExpandedMenu(expandedMenu === 'pricing' ? null : 'pricing')}
                  style={{position: 'relative'}}
                >
                  {expandedMenu === 'pricing' ? '▼' : '▶'} Tell me about subscription plans and pricing
                </button>
                {expandedMenu === 'pricing' && (
                  <div className="features-grid">
                    <button onClick={() => handleSendMessage('What is included in the Free Plan?')} className="feature-card">✅ What is included in the Free Plan?</button>
                    <button onClick={() => handleSendMessage('What features are available in the Premium Plan?')} className="feature-card">💎 What features are in the Premium Plan?</button>
                    <button onClick={() => handleSendMessage('What does the Enterprise Plan include?')} className="feature-card">🏢 What does the Enterprise Plan include?</button>
                    <button onClick={() => handleSendMessage('What are the differences between the plans?')} className="feature-card">📊 What are the differences between plans?</button>
                    <button onClick={() => handleSendMessage('How can I upgrade my plan?')} className="feature-card">⬆️ How can I upgrade my plan?</button>
                    <button onClick={() => handleSendMessage('What is the refund policy?')} className="feature-card">💯 What is the refund policy?</button>
                    <button onClick={() => handleSendMessage('How much does the Premium Plan cost?')} className="feature-card">💰 How much does Premium cost?</button>
                    <button onClick={() => handleSendMessage('Can I cancel my subscription?')} className="feature-card">❌ Can I cancel my subscription?</button>
                    <button onClick={() => handleSendMessage('Can I change my subscription plan?')} className="feature-card">🔄 Can I change my plan?</button>
                  </div>
                )}
                <button
                  className="feature-question-btn help-question"
                  onClick={() => setExpandedMenu(expandedMenu === 'career-help' ? null : 'career-help')}
                  style={{position: 'relative'}}
                >
                  {expandedMenu === 'career-help' ? '▼' : '▶'} How can CareerBot help me improve my career?
                </button>
                {expandedMenu === 'career-help' && (
                  <div className="features-grid">
                    <button onClick={() => handleSendMessage('How can I optimize my resume?')} className="feature-card">✨ How can I optimize my resume?</button>
                    <button onClick={() => handleSendMessage('How can I prepare for an interview?')} className="feature-card">🎤 How can I prepare for an interview?</button>
                    <button onClick={() => handleSendMessage('How can I improve my job search strategy?')} className="feature-card">🔍 How can I improve my job search?</button>
                    <button onClick={() => handleSendMessage('How can I improve my skills?')} className="feature-card">🧠 How can I improve my skills?</button>
                    <button onClick={() => handleSendMessage('How can CareerBot help me plan my career?')} className="feature-card">🗺️ How can I plan my career?</button>
                    <button onClick={() => handleSendMessage('How can I improve my professional networking?')} className="feature-card">🤝 How can I improve networking?</button>
                    <button onClick={() => handleSendMessage('How can I prepare for my next job?')} className="feature-card">🚀 How can I prepare for my next job?</button>
                    <button onClick={() => handleSendMessage('How can I improve my chances of getting a job?')} className="feature-card">⭐ How can I improve my job chances?</button>
                  </div>
                )}
                <button
                  className="feature-question-btn help-question"
                  onClick={() => setExpandedMenu(expandedMenu === 'help-login-account' ? null : 'help-login-account')}
                  style={{position: 'relative'}}
                >
                  {expandedMenu === 'help-login-account' ? '▼' : '▶'} Login & Account
                </button>
                {expandedMenu === 'help-login-account' && (
                  <div className="features-grid">
                    <button onClick={() => handleSendMessage('How can I reset my password?')} className="feature-card">🔑 How can I reset my password?</button>
                    <button onClick={() => handleSendMessage('Why can\'t I log in to my account?')} className="feature-card">⚠️ Why can&apos;t I log in?</button>
                    <button onClick={() => handleSendMessage('How can I get help with OTP verification?')} className="feature-card">📧 How can I get help with OTP?</button>
                    <button onClick={() => handleSendMessage('What should I do if my account is locked?')} className="feature-card">🔒 What if my account is locked?</button>
                    <button onClick={() => handleSendMessage('How can I edit my profile?')} className="feature-card">👤 How can I edit my profile?</button>
                    <button onClick={() => handleSendMessage('How can I change my password?')} className="feature-card">🔐 How can I change my password?</button>
                    <button onClick={() => handleSendMessage('Why am I not receiving the OTP?')} className="feature-card">❌ Why am I not receiving OTP?</button>
                    <button onClick={() => handleSendMessage('How can I access my account?')} className="feature-card">🔓 How can I access my account?</button>
                  </div>
                )}
              </div>
            </div>
          )}
          {messages.map((message) => {
            if (message.type === 'system' && message.ticket) {
              const meta = STATUS_META[message.ticket.status] || STATUS_META.open;
              return (
                <div key={message.id} className="ticket-confirmation">
                  <div className="ticket-confirmation-icon">🎉</div>
                  <div className="ticket-confirmation-body">
                    <strong style={{ display: 'block', marginBottom: '8px' }}>{message.text}</strong>

                    <div className="ticket-confirmation-meta">
                      <span className={`status-pill ${meta.color}`}>{meta.label}</span>
                      <span className="ticket-confirmation-id">Ticket #{(message.ticket.id || 'N/A').toString().slice(-8)}</span>
                    </div>

                    <div className="ticket-confirmation-subject">
                      {message.ticket.subject}
                    </div>

                    <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b', borderTop: '1px solid rgba(100, 116, 139, 0.2)', paddingTop: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span>✅ Confirmation email sent</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>⏳ Expect response within 24 hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-avatar">
                  {message.type === 'user' ? (
                    <span className="avatar-circle user-avatar">👤</span>
                  ) : (
                    <span className="avatar-circle bot-avatar">🤖</span>
                  )}
                </div>
                <div className="message-content">
                  {(() => {
                    // User messages are displayed in full, never shortened
                    if (message.type !== 'assistant') {
                      return <div className="message-text">{message.text}</div>;
                    }

                    // Assistant messages can be summarized
                    const cleanText = stripMarkdown(message.text);
                    const summary = firstSentence(cleanText);
                    const isLong = cleanText.length > 180 && summary.length < cleanText.length;
                    const isExpanded = expandedMessageIds.has(message.id);
                    return (
                      <>
                        <div className="message-text">
                          {isLong && !isExpanded ? summary : cleanText}
                        </div>
                        {isLong && (
                          <button
                            className="message-expand-toggle"
                            onClick={() =>
                              setExpandedMessageIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(message.id)) next.delete(message.id);
                                else next.add(message.id);
                                return next;
                              })
                            }
                          >
                            {isExpanded ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </>
                    );
                  })()}
                  {message.sources && message.sources.length > 0 && (
                    <div className="message-sources">
                      <small>Sources: {message.sources.join(', ')}</small>
                    </div>
                  )}
                  {message.relatedQuestions && message.relatedQuestions.length > 0 && (
                    <div className="related-questions">
                      <div className="related-questions-label">Related questions:</div>
                      <div className="related-questions-list">
                        {message.relatedQuestions.map((question, idx) => (
                          <button
                            key={idx}
                            className="related-question-btn"
                            onClick={() => handleSendMessage(question)}
                            disabled={isLoading}
                            title={isLoading ? 'Please wait for the previous response' : 'Click to ask this question'}
                            style={{ opacity: isLoading ? 0.5 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {message.type === 'assistant' && message.id !== 'welcome' && message.id !== 'error' && (
                    <div className="message-feedback">
                      {!messageFeedback.has(message.id) ? (
                        <div className="feedback-question">
                          <span className="feedback-text">Was this helpful?</span>
                          <button
                            className="feedback-btn feedback-yes"
                            onClick={() => setMessageFeedback((prev) => new Map([...prev, [message.id, 'yes']]))}
                            title="Mark as helpful"
                          >
                            👍 Yes
                          </button>
                          <button
                            className="feedback-btn feedback-no"
                            onClick={() => setMessageFeedback((prev) => new Map([...prev, [message.id, 'no']]))}
                            title="Mark as not helpful"
                          >
                            👎 No
                          </button>
                        </div>
                      ) : messageFeedback.get(message.id) === 'no' ? (
                        <div className="feedback-not-helpful">
                          <p>Sorry, I couldn&apos;t help with that.</p>
                          <p>
                            <button className="link-btn" onClick={() => openTicketModal(firstSentence(message.text))}>
                              Raise a support ticket →
                            </button>
                          </p>
                        </div>
                      ) : (
                        <div className="feedback-thanks">✓ Thanks for your feedback!</div>
                      )}
                    </div>
                  )}
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="message assistant">
              <div className="message-avatar">
                <span className="avatar-circle bot-avatar">🤖</span>
              </div>
              <div className="message-content">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          {messages.length > 5 && !showSuggestionsPanel && (
            <div
              style={{
                position: 'sticky',
                bottom: '16px',
                display: 'flex',
                justifyContent: 'center',
                zIndex: 10,
                marginTop: '16px',
                pointerEvents: 'none',
              }}
            >
              <button
                onClick={() => setShowSuggestionsPanel(true)}
                style={{
                  pointerEvents: 'auto',
                  padding: '10px 20px',
                  backgroundColor: '#0066cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(0, 102, 204, 0.3)',
                  whiteSpace: 'nowrap',
                }}
              >
                ✨ Show Suggestions
              </button>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="input-section">
          <div className="input-controls-row">
            <div className="input-wrapper">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && settings.enterToSend) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your question..."
                className="message-input"
                disabled={isLoading}
              />
            </div>
            <button
              className="send-message-btn"
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              title="Send"
            >
              ➤
            </button>
          </div>

          {/* Bottom Navigation Tabs */}
          <div className="bottom-nav">
            <button
              className={`nav-tab ${activeNavTab === 'chat' ? 'active' : ''}`}
              onClick={() => { setActiveNavTab('chat'); setIsHistoryOpen(false); }}
              title="Chat"
            >
              <svg className="nav-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Chat</span>
            </button>
            {isLocallyAuthenticated && isUserAuthenticated() && (
              <button
                className={`nav-tab ${activeNavTab === 'history' ? 'active' : ''}`}
                onClick={() => { setActiveNavTab('history'); setIsHistoryOpen(true); }}
                title="History"
              >
                <svg className="nav-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>History</span>
              </button>
            )}
          </div>

          <p className="input-footer">
            Can&apos;t find an answer? <button className="link-btn" onClick={() => openTicketModal()}>Raise a support ticket</button>
          </p>
        </div>
      </main>

      {/* Ticket Modal */}
      {showTicketModal && (
        <div className="modal-overlay" onClick={() => setShowTicketModal(false)}>
          <div className="ticket-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ticket-modal-header">
              <div>
                <h2>🎫 Raise a Support Ticket</h2>
                <p>Our team typically responds within 24 hours</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowTicketModal(false)}>✕</button>
            </div>

            <div className="ticket-modal-body">
              {!isUserAuthenticated() && (
                <>
                  <label className="field-label">Subject <span className="required">*</span></label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Enter your issue"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                  />
                  <p style={{ fontSize: '12px', color: ticketSubject.length >= 5 ? '#10b981' : '#ef4444', marginTop: '4px', marginBottom: '16px' }}>
                    {ticketSubject.length}/5 min
                  </p>

                  <label className="field-label">Email <span className="required">*</span></label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input
                      type="email"
                      className="field-input"
                      placeholder="Enter your email"
                      value={ticketEmail}
                      onChange={(e) => setTicketEmail(e.target.value)}
                      disabled={isOtpVerified}
                      style={{ flex: 1 }}
                    />
                    {!isOtpVerified && (
                      <button
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || !ticketEmail.trim() || otpCooldownSeconds > 0}
                        style={{
                          padding: '11px 16px',
                          backgroundColor: (isSendingOtp || otpCooldownSeconds > 0) ? '#cbd5e1' : '#1f5fb7',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: (isSendingOtp || otpCooldownSeconds > 0) ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '14px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isSendingOtp ? 'Sending...' : otpCooldownSeconds > 0 ? `Resend OTP (${otpCooldownSeconds}s)` : 'Send OTP'}
                      </button>
                    )}
                  </div>

                  {isOtpVerified && (
                    <div style={{ padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #10b981', borderRadius: '8px', marginBottom: '16px', color: '#10b981', fontWeight: '600' }}>
                      ✓ Email verified
                    </div>
                  )}

                  {otpMessage && (
                    <div style={{ padding: '12px', backgroundColor: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: '8px', marginBottom: '16px', color: '#0ea5e9', fontSize: '14px' }}>
                      {otpMessage}
                    </div>
                  )}

                  <label className="field-label">Full Name <span className="required">*</span></label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Your full name"
                    value={ticketName}
                    onChange={(e) => setTicketName(e.target.value)}
                    disabled={isUserAuthenticated()}
                  />

                  <label className="field-label">User Type <span className="required">*</span></label>
                  <select
                    className="field-input"
                    value={ticketUserType}
                    onChange={(e) => setTicketUserType(e.target.value)}
                  >
                    <option value="">Select your user type...</option>
                    <option value="student">Student</option>
                    <option value="professional">Professional</option>
                    <option value="organization">Organization</option>
                    <option value="other">Other</option>
                  </select>

                  <label className="field-label">Issue Type <span className="required">*</span></label>
                  <select
                    className="field-input"
                    value={ticketIssueType}
                    onChange={(e) => setTicketIssueType(e.target.value)}
                  >
                    <option value="">Select an issue type...</option>
                    {(FEATURE_ISSUE_TYPES['login-issues'] || []).map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {isUserAuthenticated() && (
                <>
                  <label className="field-label">Subject</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Brief summary of your issue"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                  />
                  <p style={{ fontSize: '12px', color: ticketSubject.length >= 5 ? '#10b981' : '#ef4444', marginTop: '4px', marginBottom: '16px' }}>
                    {ticketSubject.length}/5 min
                  </p>

                  <label className="field-label">Affected Feature <span className="required">*</span></label>
                  <div className="feature-grid">
                    {careerBotFeatures.map((feature) => {
                      const IconComponent = feature.icon;
                      return (
                        <button
                          key={feature.id}
                          className={`feature-chip ${ticketFeature === feature.id ? 'active' : ''}`}
                          onClick={() => {
                            setTicketFeature(feature.id);
                            setTicketIssueType('');
                          }}
                        >
                          <IconComponent size={20} />
                          <span>{feature.title}</span>
                        </button>
                      );
                    })}
                    <button
                      className={`feature-chip ${ticketFeature === 'other' ? 'active' : ''}`}
                      onClick={() => {
                        setTicketFeature('other');
                        setTicketIssueType('');
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>❓</span>
                      <span>Other</span>
                    </button>
                  </div>

                  <label className="field-label">Issue Type <span className="required">*</span></label>
                  <select
                    className="field-input"
                    value={ticketIssueType}
                    onChange={(e) => setTicketIssueType(e.target.value)}
                    disabled={!ticketFeature}
                  >
                    <option value="">
                      {ticketFeature ? 'Select an issue type...' : 'Please select an affected feature first'}
                    </option>
                    {ticketFeature && (FEATURE_ISSUE_TYPES[ticketFeature] || FEATURE_ISSUE_TYPES['other']).map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <label className="field-label">Priority</label>
              <div className="priority-toggle">
                <button
                  className={`priority-btn ${ticketPriority === 1 ? 'active' : ''}`}
                  onClick={() => setTicketPriority(1)}
                >
                  Normal
                </button>
                <button
                  className={`priority-btn urgent ${ticketPriority === 2 ? 'active' : ''}`}
                  onClick={() => setTicketPriority(2)}
                >
                  🔥 Urgent
                </button>
              </div>

              <label className="field-label">Description <span className="required">*</span></label>
              <textarea
                className="field-textarea"
                placeholder={!isUserAuthenticated() ? 'Please provide enough details for our support team to understand the login or account access issue.' : 'Describe what happened, what you expected, and what actually happened...'}
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <p className="field-helper">Please provide enough details for our support team to understand {!isUserAuthenticated() ? 'the login or account access issue.' : 'and reproduce the issue.'}</p>
                <p style={{ fontSize: '12px', color: ticketDescription.length >= 20 ? '#10b981' : '#ef4444', marginTop: 0 }}>
                  {ticketDescription.length}/20 min
                </p>
              </div>

              {isUserAuthenticated() && (
                <>
                  <label className="field-label">Steps to Reproduce <span className="optional">(Optional)</span></label>
                  <textarea
                    className="field-textarea"
                    placeholder="Describe the steps that caused the issue (e.g., 1. Open Resume Parser 2. Upload a resume 3. Click Parse Resume)"
                    value={ticketStepsToReproduce}
                    onChange={(e) => setTicketStepsToReproduce(e.target.value)}
                    rows={3}
                  />

                  {ticketFeature === 'payment-billing' && (
                    <>
                      <label className="field-label">Transaction ID <span className="optional">(Optional)</span></label>
                      <input
                        type="text"
                        className="field-input"
                        placeholder="e.g., TXN123456"
                        value={ticketTransactionId}
                        onChange={(e) => setTicketTransactionId(e.target.value)}
                      />

                      <label className="field-label">Invoice Number <span className="optional">(Optional)</span></label>
                      <input
                        type="text"
                        className="field-input"
                        placeholder="e.g., INV-2026-0012"
                        value={ticketInvoiceNumber}
                        onChange={(e) => setTicketInvoiceNumber(e.target.value)}
                      />

                      <label className="field-label">Payment Date <span className="optional">(Optional)</span></label>
                      <input
                        type="date"
                        className="field-input"
                        value={ticketPaymentDate}
                        onChange={(e) => setTicketPaymentDate(e.target.value)}
                      />
                    </>
                  )}
                </>
              )}

              <label className="field-label">Attachments <span className="optional">(Optional)</span></label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAttachmentUpload}
                accept=".png,.jpg,.jpeg,.pdf"
                multiple
                style={{ display: 'none' }}
              />
              <button
                className="attachment-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                📎 Upload Screenshot/File
              </button>
              {ticketAttachments.length > 0 && (
                <div className="attachment-list">
                  {ticketAttachments.map((file, index) => (
                    <div key={index} className="attachment-item">
                      <span>{file.name}</span>
                      <button
                        className="remove-attachment-btn"
                        onClick={() => removeAttachment(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="ticket-modal-footer">
              <button className="modal-cancel-btn" onClick={() => setShowTicketModal(false)}>
                Cancel
              </button>
              <button
                className="modal-submit-btn"
                onClick={submitTicket}
                disabled={
                  !ticketSubject.trim() ||
                  !ticketDescription.trim() ||
                  (!isUserAuthenticated() && (!ticketName.trim() || !ticketEmail.trim() || !ticketUserType.trim() || !ticketIssueType.trim() || !isOtpVerified)) ||
                  (isUserAuthenticated() && !ticketFeature) ||
                  isSubmittingTicket
                }
              >
                {isSubmittingTicket ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpVerification && (
        <div className="modal-overlay" onClick={() => setShowOtpVerification(false)}>
          <div className="ticket-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="ticket-modal-header">
              <div>
                <h2>🔐 Verify Your Email</h2>
                <p>Enter the OTP sent to {ticketEmail}</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowOtpVerification(false)}>✕</button>
            </div>

            <div className="ticket-modal-body">
              <label className="field-label">OTP Code <span className="required">*</span></label>
              <input
                type="text"
                className="field-input"
                placeholder="Enter 6-digit OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                disabled={isSendingOtp}
                style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '18px', fontWeight: '600' }}
              />

              {otpError && (
                <div style={{ padding: '12px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#dc2626', fontSize: '14px', marginTop: '12px' }}>
                  {otpError}
                </div>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={isSendingOtp || otpCode.length !== 6}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  marginTop: '20px',
                  backgroundColor: isSendingOtp || otpCode.length !== 6 ? '#cbd5e1' : '#1f5fb7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: isSendingOtp || otpCode.length !== 6 ? 'not-allowed' : 'pointer',
                }}
              >
                {isSendingOtp ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button
                onClick={handleSendOtp}
                disabled={isSendingOtp || otpCooldownSeconds > 0}
                style={{
                  width: '100%',
                  padding: '10px 24px',
                  marginTop: '12px',
                  backgroundColor: isSendingOtp || otpCooldownSeconds > 0 ? '#f3f4f6' : '#fff',
                  color: isSendingOtp || otpCooldownSeconds > 0 ? '#9ca3af' : '#1f5fb7',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: isSendingOtp || otpCooldownSeconds > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {isSendingOtp ? 'Sending...' : otpCooldownSeconds > 0 ? `Resend OTP (${otpCooldownSeconds}s)` : 'Resend OTP'}
              </button>

              {otpMessage && (
                <div style={{ padding: '12px', backgroundColor: '#dbeafe', border: '1px solid #7dd3fc', borderRadius: '8px', color: '#0284c7', fontSize: '14px', marginTop: '12px', textAlign: 'center' }}>
                  {otpMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ticket Success Modal */}
      {showTicketSuccess && (
        <div className="modal-overlay" onClick={() => setShowTicketSuccess(false)}>
          <div className="ticket-success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon">✓</div>
            <h2>Ticket Submitted Successfully</h2>
            <p>Your support request has been received by the CareerBOT Support Team.</p>

            <div className="ticket-id-box">
              <label>Ticket ID:</label>
              <p className="ticket-id">{ticketId}</p>
            </div>

            <div className="ticket-email-box">
              <label>Confirmation Email:</label>
              <p className="ticket-email">{ticketEmail || 'your registered email'}</p>
            </div>

            <p className="success-message">Our support team will review your request and contact you at <strong>{ticketEmail || 'your registered email address'}</strong>.</p>

            <div className="success-modal-footer">
              <button
                className="modal-submit-btn"
                onClick={() => setShowTicketSuccess(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (() => {
        const meta = STATUS_META[selectedTicket.status] || STATUS_META.open;
        return (
          <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
            <div className="ticket-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ticket-modal-header">
                <div>
                  <h2>🎫 Ticket #{(selectedTicket.id || 'N/A').toString().slice(-8)}</h2>
                  <p>{selectedTicket.subject}</p>
                </div>
                <button className="modal-close-btn" onClick={() => setSelectedTicket(null)}>✕</button>
              </div>

              <div className="ticket-modal-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span className={`status-pill ${meta.color}`}>{meta.label}</span>
                  {selectedTicket.priority === 2 && <span className="priority-flag">🔥 Urgent</span>}
                </div>

                <label className="field-label">Subject</label>
                <p style={{ marginBottom: '16px' }}>{selectedTicket.subject}</p>

                {selectedTicket.description && (
                  <>
                    <label className="field-label">Description</label>
                    <p style={{ marginBottom: '16px', whiteSpace: 'pre-wrap' }}>{selectedTicket.description}</p>
                  </>
                )}

                {selectedTicket.affected_feature && (
                  <>
                    <label className="field-label">Category</label>
                    <p style={{ marginBottom: '16px' }}>{selectedTicket.affected_feature}</p>
                  </>
                )}

                <label className="field-label">Created</label>
                <p style={{ marginBottom: '16px' }}>
                  {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString() : 'N/A'}
                </p>

                {selectedTicket.updated_at && (
                  <>
                    <label className="field-label">Last Updated</label>
                    <p style={{ marginBottom: '16px' }}>{new Date(selectedTicket.updated_at).toLocaleString()}</p>
                  </>
                )}

                {selectedTicket.contact_email && (
                  <>
                    <label className="field-label">Contact Email</label>
                    <p style={{ marginBottom: '16px' }}>{selectedTicket.contact_email} <span style={{ fontSize: '10px', color: '#4ade80', fontWeight: 600 }}>· Notified</span></p>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h2>⚙️ Settings & Preferences</h2>
              <button className="modal-close-btn" onClick={() => setShowSettingsModal(false)}>✕</button>
            </div>

            <div className="settings-modal-body">
              {/* CHAT PREFERENCES */}
              <div className="settings-section">
                <h3 className="section-title">💬 Chat Preferences</h3>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Language</span>
                  </div>
                  <select
                    className="setting-select"
                    value={settings.language}
                    onChange={(e) => updateSetting('language', e.target.value as UserSettings['language'])}
                  >
                    <option value="english">English</option>
                    <option value="spanish">Spanish</option>
                    <option value="french">French</option>
                    <option value="german">German</option>
                    <option value="chinese">Chinese</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Response Style</span>
                  </div>
                  <select
                    className="setting-select"
                    value={settings.responseStyle}
                    onChange={(e) => updateSetting('responseStyle', e.target.value as UserSettings['responseStyle'])}
                  >
                    <option value="concise">Concise</option>
                    <option value="balanced">Balanced</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Response Length</span>
                  </div>
                  <select
                    className="setting-select"
                    value={settings.responseLength}
                    onChange={(e) => updateSetting('responseLength', e.target.value as UserSettings['responseLength'])}
                  >
                    <option value="short">Short</option>
                    <option value="medium">Medium</option>
                    <option value="long">Long</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Show Sources</span>
                    <span className="setting-description">Display references used in responses</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.showSources}
                      onChange={(e) => updateSetting('showSources', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Typing Indicator</span>
                    <span className="setting-description">Show loading animation while chatbot responds</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.typingIndicator}
                      onChange={(e) => updateSetting('typingIndicator', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Enter to Send</span>
                    <span className="setting-description">Press Enter to send messages</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.enterToSend}
                      onChange={(e) => updateSetting('enterToSend', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              {/* APPEARANCE */}
              <div className="settings-section">
                <h3 className="section-title">🎨 Appearance</h3>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Theme</span>
                  </div>
                  <select
                    className="setting-select"
                    value={settings.theme}
                    onChange={(e) => updateSetting('theme', e.target.value as UserSettings['theme'])}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Font Size</span>
                  </div>
                  <select
                    className="setting-select"
                    value={settings.fontSize}
                    onChange={(e) => updateSetting('fontSize', e.target.value as UserSettings['fontSize'])}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Compact Chat</span>
                    <span className="setting-description">Use compact layout</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.compactChat}
                      onChange={(e) => updateSetting('compactChat', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              {/* VOICE */}
              <div className="settings-section">
                <h3 className="section-title">🎤 Voice</h3>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Voice Input</span>
                    <span className="setting-description">Enable microphone input for questions</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.enableVoiceInput}
                      onChange={(e) => updateSetting('enableVoiceInput', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Voice Output</span>
                    <span className="setting-description">Listen to chatbot responses with audio</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.enableVoiceOutput}
                      onChange={(e) => updateSetting('enableVoiceOutput', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Voice Language</span>
                  </div>
                  <select
                    className="setting-select"
                    value={settings.voiceLanguage}
                    onChange={(e) => updateSetting('voiceLanguage', e.target.value as UserSettings['voiceLanguage'])}
                  >
                    <option value="english">English</option>
                    <option value="spanish">Spanish</option>
                    <option value="french">French</option>
                    <option value="german">German</option>
                    <option value="chinese">Chinese</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Auto-play Responses</span>
                    <span className="setting-description">Automatically play voice responses</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.autoPlayResponses}
                      onChange={(e) => updateSetting('autoPlayResponses', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              {/* DOCUMENTS */}
              <div className="settings-section">
                <h3 className="section-title">📄 Documents</h3>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Document Upload</span>
                    <span className="setting-description">Upload documents for context</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.enableDocumentUpload}
                      onChange={(e) => updateSetting('enableDocumentUpload', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Use Document Context</span>
                    <span className="setting-description">Include uploaded documents in responses</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.useDocumentContext}
                      onChange={(e) => updateSetting('useDocumentContext', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

              </div>

              {/* CONVERSATION */}
              <div className="settings-section">
                <h3 className="section-title">💭 Conversation</h3>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Save Chat History</span>
                    <span className="setting-description">Save conversations for later</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.saveChatHistory}
                      onChange={(e) => updateSetting('saveChatHistory', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Auto Save</span>
                    <span className="setting-description">Automatically save conversations</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.autoSave}
                      onChange={(e) => updateSetting('autoSave', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-action">
                  <button className="action-btn">Export Conversation</button>
                </div>

                <div className="setting-action">
                  <button className="action-btn">Clear Current Chat</button>
                </div>

                <div className="setting-action">
                  <button className="action-btn action-destructive">Delete All Conversations</button>
                </div>
              </div>

              {/* NOTIFICATIONS */}
              <div className="settings-section">
                <h3 className="section-title">🔔 Notifications</h3>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Chat Notifications</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.enableNotifications}
                      onChange={(e) => updateSetting('enableNotifications', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Message Sound</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.enableSound}
                      onChange={(e) => updateSetting('enableSound', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Browser Notifications</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.browserNotifications}
                      onChange={(e) => updateSetting('browserNotifications', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              {/* PRIVACY & DATA */}
              <div className="settings-section">
                <h3 className="section-title">🔒 Privacy & Data</h3>

                <div className="setting-description-box">
                  <p>Control how your conversations are stored and managed.</p>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Chat History</span>
                    <span className="setting-description">{settings.saveChatHistory ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>

                <div className="setting-action">
                  <button className="action-btn">Download My Data</button>
                </div>

                <div className="setting-action">
                  <button className="action-btn action-destructive">Delete All Conversations</button>
                </div>
              </div>

              {/* ACCESSIBILITY */}
              <div className="settings-section">
                <h3 className="section-title">♿ Accessibility</h3>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Reduce Motion</span>
                    <span className="setting-description">Minimize animations and transitions</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.reduceMotion}
                      onChange={(e) => updateSetting('reduceMotion', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <span className="setting-name">Larger Text</span>
                    <span className="setting-description">Increase font size throughout</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.largerText}
                      onChange={(e) => updateSetting('largerText', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              {/* HELP & SUPPORT */}
              <div className="settings-section">
                <h3 className="section-title">❓ Help & Support</h3>

                <div className="help-links">
                  <button className="help-link-btn">Help Center</button>
                  <button className="help-link-btn">Report a Problem</button>
                  <button className="help-link-btn">Contact Support</button>
                </div>

                <div className="settings-footer-info">
                  <p>CareerBot Support Chatbot v2.0</p>
                  <div className="footer-links">
                    <button className="footer-link" onClick={() => { }}>Privacy Policy</button>
                    <span className="separator">·</span>
                    <button className="footer-link" onClick={() => { }}>Terms of Service</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-modal-footer">
              <button
                className="settings-close-btn"
                onClick={() => setShowSettingsModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

// Storage constants and helpers
// Single localStorage key holding EVERY account's sessions on this device.
// Per-user isolation is by the `userEmail` field on each session (filtered in
// loadChatHistory and in saveSessionToStorage's return value), NOT by the key.
export const CHAT_SESSIONS_STORAGE_KEY = 'saved_chat_sessions';
const MAX_STORED_SESSIONS = 50;
const MAX_MESSAGES_PER_SESSION = 500;
// Text of the "restored" system notice injected by loadSessionMessages. It is a
// UI-only marker, so saveChat filters it out before persisting a transcript —
// otherwise each restore+save cycle bakes another copy into the stored session.
const RESTORED_NOTICE_TEXT = 'Previous conversation loaded. Feel free to continue or start a new chat.';

/**
 * Cap sessions per owner to MAX_STORED_SESSIONS (or custom max)
 * Keep the most recent sessions, discard oldest
 */
export const capSessionsPerOwner = (sessions: ChatSession[], maxPerOwner: number = MAX_STORED_SESSIONS): ChatSession[] => {
  // Group sessions by owner and cap each owner's sessions
  const byOwner = new Map<string | undefined, ChatSession[]>();

  for (const session of sessions) {
    const owner = session.userEmail || 'guest';
    if (!byOwner.has(owner)) {
      byOwner.set(owner, []);
    }
    byOwner.get(owner)!.push(session);
  }

  // Cap each owner's sessions and flatten back
  const result: ChatSession[] = [];
  for (const ownerSessions of byOwner.values()) {
    result.push(...ownerSessions.slice(0, maxPerOwner));
  }

  return result;
};

/**
 * Save a single session to localStorage with per-user isolation
 * Prevents duplicates and enforces size limits
 * Returns only the sessions visible to the saving user
 */
export const saveSessionToStorage = (newSession: ChatSession, userEmail: string | null): ChatSession[] => {
  // Don't persist guest sessions to localStorage
  if (!userEmail) {
    return [];
  }

  // Add userEmail to session for storage
  const sessionWithOwner = { ...newSession, userEmail };

  // Load all sessions (across all users in global key - for migration/integrity)
  let allSessions: ChatSession[] = [];
  try {
    const globalSessions = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
    if (globalSessions) {
      const parsed = JSON.parse(globalSessions);
      allSessions = parsed.map((s: StoredChatSession) => ({
        ...s,
        date: new Date(s.date),
        messages: s.messages?.map((m: StoredMessage) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
      }));
    }
  } catch (error) {
    console.error('Failed to read existing chat sessions before saving:', error);
    allSessions = [];
  }

  // Update or add the session: moved to front on update so it stays recent
  allSessions = [sessionWithOwner, ...allSessions.filter(s => s.id !== sessionWithOwner.id)];

  // Cap messages per session
  allSessions = allSessions.map((session) => ({
    ...session,
    messages: session.messages?.slice(-MAX_MESSAGES_PER_SESSION),
  }));

  // Cap sessions per owner
  allSessions = capSessionsPerOwner(allSessions, MAX_STORED_SESSIONS);

  // Persist. A write failure (quota exceeded, storage blocked in private mode)
  // must NOT empty the caller's History list: it assigns this return value
  // straight into chatSessions state, and the already-stored sessions are
  // still on disk. Report the failure and return the computed view.
  try {
    localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(allSessions));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded - chat session not persisted:', error);
    } else {
      console.error('Failed to save session to storage:', error);
    }
  }

  // Return only the sessions visible to this user. Include sessions without userEmail (backward compat for older entries)
  return allSessions.filter((s) => s.userEmail === userEmail || !s.userEmail);
};

export type { Message, ChatSession };

export default ChatApp;
