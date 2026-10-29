'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './ChatApp.css';
import {
  sendChatMessage,
  escalateToSupport,
  uploadTicketAttachment,
  getSupportTickets,
  getTicketDetails,
  cancelTicket,
  sendTicketOtp,
  verifyTicketOtp,
  createChatSession,
  sendSessionMessage,
  getChatSession,
  deleteChatSession,
} from '@/api/chatbotApi';
import type { SupportTicket, ChatSessionSummary, TicketAttachmentSummary } from '@/api/chatbotApi';
import { isUserAuthenticated, classifyQuery, canGuestAnswer, getAuthRequiredMessage } from '@/api/chatbotAuth';
import { getProfile } from '@/api/userApi';
import { onAccountChanged } from '@/lib/accountChange';
import { FEATURE_ISSUE_TYPES, TICKET_STATUS_META, CANCELLABLE_TICKET_STATUSES } from '@/lib/ticketCategories';
import TicketAttachmentLink from '@/components/common/TicketAttachmentLink';
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
import {
  MAX_TICKET_ATTACHMENTS,
  MAX_TICKET_ATTACHMENT_BYTES,
  MAX_TICKET_SUBJECT_CHARS,
  MAX_TICKET_QA_CHARS,
  TICKET_CONTEXT_PARAM,
  stashTicketContext,
} from '@/lib/ticketCategories';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
  sources?: string[];
  relatedQuestions?: string[];
  ticket?: TicketInfo;
  actionLink?: ActionLink;
  // Progressive guided-menu options attached to this message (see
  // GuidedMenuAction below) -- e.g. the welcome message's initial 3
  // choices, a topic's question list, or the post-answer follow-up.
  // Undefined for ordinary typed messages and KB answers.
  menuOptions?: GuidedMenuOption[];
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
  // Which store this row came from. 'backend' rows are MongoDB-persisted
  // (the source of truth going forward) and never carry `messages` inline.
  // 'local' rows are legacy localStorage entries saved before backend
  // persistence existed; they already carry their full transcript (or a
  // preview fallback) and are never written to again. Undefined for
  // sessions created before this field existed -- treated as 'local' for
  // restore purposes, same as today.
  source?: 'backend' | 'local';
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
  attachments?: TicketAttachmentSummary[];
}

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

// Only this small, explicit allowlist of href schemes may become a live,
// clickable link -- everything else (most notably javascript:, data:,
// vbscript:, etc.) renders as plain text instead. renderMarkdownText runs
// on backend-sourced text with no further sanitization -- the KB answer
// itself (data.answer), restored session messages, and raw error.message --
// so a malicious or merely compromised value here must never become a
// script-executing href. React does not block javascript: URLs; it only
// logs a console warning and still renders the link.
// A same-site path starts with exactly one '/': '//host' and '/\host' are
// protocol-relative URLs that browsers resolve to another site, and the URL
// parser drops tabs/newlines first ('/\t/host' -> '//host'), so a path may
// not contain whitespace or control characters either.
const isSafeLinkHref = (href: string): boolean =>
  /^\/(?![\/\\])[^\s\x00-\x1f\x7f]*$/.test(href) || /^https:\/\//i.test(href) || /^mailto:/i.test(href);

// KB answers may contain **bold** and [link](action:login) markdown.
// Parse and render these as JSX elements for proper interaction.
const renderMarkdownText = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Pattern: [text](action:login) or [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const boldRegex = /\*\*([^*]+)\*\*/g;

  // First, find all links and bold sections with their positions
  const links: Array<{ start: number; end: number; text: string; href: string }> = [];
  const bolds: Array<{ start: number; end: number; text: string }> = [];

  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    links.push({ start: match.index, end: match.index + match[0].length, text: match[1], href: match[2] });
  }

  boldRegex.lastIndex = 0;
  while ((match = boldRegex.exec(text)) !== null) {
    bolds.push({ start: match.index, end: match.index + match[0].length, text: match[1] });
  }

  // Sort all by position. Explicit union type so the `'href' in item` check
  // below actually narrows -- inferred from the spread alone, TS widens
  // `href` to `unknown` instead of discriminating on it.
  type TextPart =
    | { start: number; end: number; text: string; href: string }
    | { start: number; end: number; text: string };
  const all: TextPart[] = [...links, ...bolds].sort((a, b) => a.start - b.start);

  // Build JSX nodes
  for (const item of all) {
    if (item.start > lastIndex) {
      parts.push(text.substring(lastIndex, item.start));
    }

    if ('href' in item) {
      // Link
      if (item.href === 'action:login') {
        parts.push(
          <button
            key={`link-${item.start}`}
            className="link-btn"
            onClick={() => {
              // Trigger login action (requires handler in parent component)
              const event = new CustomEvent('chatbot:action', { detail: { action: 'login' } });
              window.dispatchEvent(event);
            }}
            style={{ cursor: 'pointer', textDecoration: 'underline', color: '#0066cc', background: 'none', border: 'none', padding: 0 }}
          >
            {item.text}
          </button>,
        );
      } else if (isSafeLinkHref(item.href)) {
        parts.push(
          <a
            key={`link-${item.start}`}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'underline', color: '#0066cc' }}
          >
            {item.text}
          </a>,
        );
      } else {
        // Unsafe scheme -- never render as a live link, just the label text.
        parts.push(item.text);
      }
    } else {
      // Bold
      parts.push(<strong key={`bold-${item.start}`}>{item.text}</strong>);
    }

    lastIndex = item.end;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

// Progressive guided-menu flow: each navigation step is one of these
// actions, attached to a message's `menuOptions` and resolved by
// handleGuidedMenuSelect. 'question' is the only leaf action -- it's the
// only one that reaches the real backend, via the exact same
// handleSendMessage() every typed message already goes through.
type GuidedTopicKey = 'features' | 'pricing' | 'help-login-account' | 'help-payment';

type GuidedMenuAction =
  | { kind: 'topic'; topic: GuidedTopicKey }
  | { kind: 'support-menu' }
  | { kind: 'initial-menu' }
  | { kind: 'question'; question: string; topic: GuidedTopicKey }
  // "I have more questions" lands here first now, instead of jumping
  // straight back to the 3 initial topics -- see buildContinueOrExploreOptions.
  | { kind: 'continue-or-explore'; topic: GuidedTopicKey }
  // Re-shows the same topic's remaining (not-yet-asked) questions.
  | { kind: 'continue-topic'; topic: GuidedTopicKey }
  | { kind: 'contact-support' }
  | { kind: 'all-set' };

// 'follow-up': the "Is there anything else" prompt after a KB answer.
// 'navigation': the next step of a choice already made (its menu is
// already collapsed), so it must never be silently dropped.
type GuidedStepKind = 'follow-up' | 'navigation';

interface GuidedMenuOption {
  label: string;
  action: GuidedMenuAction;
}

// Leaf question lists for each topic, extracted verbatim (same wording,
// same emoji, same auth-aware split) from the always-visible quick-menu
// this guided flow replaces -- label is the button text shown, question is
// the exact string handed to handleSendMessage (unchanged from before; the
// two differ for several pricing questions where the label was shortened
// for button width, e.g. "How much does Premium cost?" vs the real
// question "How much does the Premium Plan cost?").
const GUIDED_TOPIC_QUESTIONS: Record<
  GuidedTopicKey,
  { authenticated: Array<{ label: string; question: string }>; guest: Array<{ label: string; question: string }> }
> = {
  features: {
    authenticated: [
      { label: '📄 How can I create or update my resume?', question: 'How can I create or update my resume?' },
      { label: '🎯 How can I check my resume match for a specific job?', question: 'How can I check my resume match for a specific job?' },
      { label: '🎤 How can I start a Mock Interview and review my feedback?', question: 'How can I start a Mock Interview and review my feedback?' },
      { label: '📊 Where can I take a Mock Test and see my results?', question: 'Where can I take a Mock Test and see my results?' },
      { label: '💻 Where can I practice coding problems and review my performance?', question: 'Where can I practice coding problems and review my performance?' },
      { label: '🗣️ How can I take an English Assessment and review my performance?', question: 'How can I take an English Assessment and review my performance?' },
    ],
    guest: [
      { label: '📄 What can CareerBot help me do with my resume?', question: 'What can CareerBot help me do with my resume?' },
      { label: '🎯 How does Job Match help me find suitable jobs?', question: 'How does Job Match help me find suitable jobs?' },
      { label: '🎤 What is a Mock Interview, and how does it work?', question: 'What is a Mock Interview, and how does it work?' },
      { label: '📊 What is a Mock Test, and what can I practice?', question: 'What is a Mock Test, and what can I practice?' },
      { label: '💻 How can CareerBot help me assess my coding skills?', question: 'How can CareerBot help me assess my coding skills?' },
      { label: '🗣️ What is the English Assessment and how does it work?', question: 'What is the English Assessment and how does it work?' },
    ],
  },
  pricing: {
    // Same questions regardless of auth state -- both branches point at
    // the same list rather than special-casing "all" elsewhere.
    authenticated: [
      { label: '✅ What is included in the Free Plan?', question: 'What is included in the Free Plan?' },
      { label: '💎 What features are in the Premium Plan?', question: 'What features are available in the Premium Plan?' },
      { label: '🏢 What does the Enterprise Plan include?', question: 'What does the Enterprise Plan include?' },
      { label: '📊 What are the differences between plans?', question: 'What are the differences between the plans?' },
      { label: '⬆️ How can I upgrade my plan?', question: 'How can I upgrade my plan?' },
      { label: '💯 What is the refund policy?', question: 'What is the refund policy?' },
      { label: '💰 How much does Premium cost?', question: 'How much does the Premium Plan cost?' },
      { label: '❌ Can I cancel my subscription?', question: 'Can I cancel my subscription?' },
      { label: '🔄 Can I change my plan?', question: 'Can I change my subscription plan?' },
    ],
    guest: [
      { label: '✅ What is included in the Free Plan?', question: 'What is included in the Free Plan?' },
      { label: '💎 What features are in the Premium Plan?', question: 'What features are available in the Premium Plan?' },
      { label: '🏢 What does the Enterprise Plan include?', question: 'What does the Enterprise Plan include?' },
      { label: '📊 What are the differences between plans?', question: 'What are the differences between the plans?' },
      { label: '⬆️ How can I upgrade my plan?', question: 'How can I upgrade my plan?' },
      { label: '💯 What is the refund policy?', question: 'What is the refund policy?' },
      { label: '💰 How much does Premium cost?', question: 'How much does the Premium Plan cost?' },
      { label: '❌ Can I cancel my subscription?', question: 'Can I cancel my subscription?' },
      { label: '🔄 Can I change my plan?', question: 'Can I change my subscription plan?' },
    ],
  },
  'help-login-account': {
    authenticated: [
      { label: '👤 How can I update my profile information?', question: 'How can I update my profile information?' },
      { label: '🔐 How can I change my password?', question: 'How can I change my password?' },
      { label: '📧 How can I update my registered email address?', question: 'How can I update my registered email address?' },
      { label: '🚪 How do I sign out of my account?', question: 'How do I sign out of my account?' },
      { label: '🔄 Why do I keep getting signed out unexpectedly?', question: 'Why do I keep getting signed out unexpectedly?' },
    ],
    guest: [
      { label: "⚠️ Why can't I log in to my account?", question: "Why can't I log in to my account?" },
      { label: '🔑 I forgot my password. How can I reset it?', question: 'I forgot my password. How can I reset it?' },
      { label: '📧 Why am I not receiving the OTP?', question: 'Why am I not receiving the OTP?' },
      { label: '🔒 My account is locked. How can I unlock it?', question: 'My account is locked. How can I unlock it?' },
      { label: '🆔 Why are my login credentials not being accepted?', question: 'Why are my login credentials not being accepted?' },
    ],
  },
  'help-payment': {
    authenticated: [
      { label: '📊 How can I check my payment status?', question: 'How can I check my payment status?' },
      { label: '⚠️ Why was money deducted but payment not confirmed?', question: 'Why was money deducted but my payment is not confirmed?' },
      { label: '💰 Why were my credits not added after payment?', question: 'Why were my credits not added after payment?' },
      { label: '🚨 How can I report an unauthorized payment?', question: 'How can I report an unauthorized payment?' },
      { label: '🆘 How can I get help with a payment issue?', question: 'How can I get help with a payment issue?' },
    ],
    guest: [
      { label: '📊 How can I check my payment status?', question: 'How can I check my payment status?' },
      { label: '⚠️ Why was money deducted but payment not confirmed?', question: 'Why was money deducted but my payment is not confirmed?' },
      { label: '💰 Why were my credits not added after payment?', question: 'Why were my credits not added after payment?' },
      { label: '🚨 How can I report an unauthorized payment?', question: 'How can I report an unauthorized payment?' },
      { label: '🆘 How can I get help with a payment issue?', question: 'How can I get help with a payment issue?' },
    ],
  },
};

const GUIDED_TOPIC_PROMPTS: Record<GuidedTopicKey, string> = {
  features: 'Great! Here are some things I can help with:',
  pricing: 'Here are some common subscription & pricing questions:',
  'help-login-account': 'Here are some common login & account questions:',
  'help-payment': 'Here are some common payment support questions:',
};

const buildInitialMenuOptions = (): GuidedMenuOption[] => [
  { label: 'I want to know about products and features', action: { kind: 'topic', topic: 'features' } },
  { label: 'I need help with subscription or payment', action: { kind: 'topic', topic: 'pricing' } },
  { label: "I'm a customer and need support", action: { kind: 'support-menu' } },
];

const buildSupportMenuOptions = (): GuidedMenuOption[] => [
  { label: 'Login & Account', action: { kind: 'topic', topic: 'help-login-account' } },
  { label: 'Subscription & Pricing', action: { kind: 'topic', topic: 'pricing' } },
  { label: 'Payment Support', action: { kind: 'topic', topic: 'help-payment' } },
  { label: 'Contact Support', action: { kind: 'contact-support' } },
];

const buildTopicQuestionOptions = (topic: GuidedTopicKey, isAuthenticated: boolean): GuidedMenuOption[] => {
  const entries = isAuthenticated ? GUIDED_TOPIC_QUESTIONS[topic].authenticated : GUIDED_TOPIC_QUESTIONS[topic].guest;
  return entries.map(({ label, question }) => ({ label, action: { kind: 'question', question, topic } }));
};

// Shown after "I have more questions" instead of jumping straight back to
// the 3 initial topics -- lets the user stay on the topic they were just
// in (continue-topic, reusing the exact same buildTopicQuestionOptions
// data minus whatever's already been asked) or back out to the top level
// (initial-menu -- the same action/handler the old direct jump used).
const buildContinueOrExploreOptions = (topic: GuidedTopicKey): GuidedMenuOption[] => [
  { label: 'Ask another question', action: { kind: 'continue-topic', topic } },
  { label: 'Explore a different topic', action: { kind: 'initial-menu' } },
];

const buildFollowUpOptions = (topic: GuidedTopicKey): GuidedMenuOption[] => [
  { label: 'I have more questions', action: { kind: 'continue-or-explore', topic } },
  { label: "I'm all set", action: { kind: 'all-set' } },
];

// A navigation affordance appended inline inside a KB answer's own text,
// when (and only when) a real page exists for it -- see getActionLink.
// Rendered as "{sentence}{linkText}." inline within the same paragraph as
// the answer, not as a separate button/block -- `sentence` is the lead-in
// clause, `linkText` is the anchor text ("click here"), `href` is the
// destination. `requiresLogin` marks a guest-only login-trigger link so
// the backend category reported is not what decides the link type twice.
interface ActionLink {
  sentence: string;
  linkText: string;
  href: string;
  requiresLogin?: boolean;
}

// Both spellings are listed because the backend's category field is either
// the hardcoded LoginIntent enum's .value (the fast-path keyword cascade)
// or a JSON knowledge-base topic's own `intent` slug (the KB_TOPIC_MATCH
// similarity-search path) -- the two were verified independently against
// app/services/support_escalation/login_chatbot_service.py's LoginIntent
// enum and the login_support_kb.json topic list, since the same real-world
// topic (e.g. "forgot password") carries a different spelling on each path.
// Excluded even though a real reset page exists: password_new_rejected /
// new_password_rejected (its answer is about password REQUIREMENTS, never
// recommends resetting) and login_invalid_credentials / invalid_credentials
// (its answer mentions 'Forgot Password?' in passing, but the likely cause
// is often a typo'd email or Caps Lock, not a password that needs
// resetting -- a prominent reset link would overstate the fix).
const PASSWORD_RESET_CATEGORIES = new Set([
  'forgot_password', 'password_forgot_or_change',
  'reset_email_not_received', 'password_reset_email_not_received',
  'reset_link_not_working', 'password_reset_link_not_working',
  'reset_link_expired', 'password_reset_link_expired',
  'password_change_not_working', 'password_changed_still_cant_login',
  'account_locked', 'account_locked_or_blocked', 'account_temporarily_blocked',
]);

// signup_update_registered_email's own KB answer explicitly says "Update
// your registered email from account/profile settings once signed in" --
// /profile is the real destination for that too, not a separate page.
const PROFILE_CATEGORIES = new Set(['profile_building', 'signup_update_registered_email']);

// Real routes confirmed against src/middleware.ts's publicRoutes /
// publicLandingPages arrays and the actual page tree under src/app/ (each
// bare landing path, e.g. /jobmatch or /mock-interview, is public -- only
// its feature sub-path, e.g. /jobmatch/app, is protected). coding_test is
// additionally forced through the login-trigger for guests as a deliberate
// CHATBOT-ONLY policy -- see the comment at its usage site.
//
// Two real features were deliberately left OUT of this map, not forgotten:
// smart_match and resume_enhancer have no dedicated page of their own --
// Smart Match is ranking logic embedded directly in the /jobslogin feed,
// and Resume Enhancer's AI-suggestion capability lives inline on the
// /atslogin/report page rather than its own route (resume_enhancer below
// links there since that genuinely is where the capability lives, but
// smart_match has nowhere accurate to send anyone, so it gets no link).
const PROTECTED_FEATURE_LINKS: Record<string, { route: string; sentence: string }> = {
  resume_builder: { route: '/builder/start', sentence: 'To get started, ' },
  // resume_optimization is the hardcoded composite topic the GUEST
  // Products & Features main question resolves to (distinct from
  // resume_builder, which the authenticated one resolves to) -- same
  // real destination either way.
  resume_optimization: { route: '/builder/start', sentence: 'To get started, ' },
  coding_test: { route: '/coding-test', sentence: 'To start practicing, ' },
  job_match: { route: '/jobmatch/app', sentence: 'To run it on your resume, ' },
  mock_interview_live: { route: '/mock-interview/live', sentence: 'To start a session, ' },
  mock_test: { route: '/mock-test', sentence: 'To take one, ' },
  english_assessment: { route: '/communication/start', sentence: 'To take the assessment, ' },
  job_search: { route: '/jobslogin', sentence: 'To browse and apply, ' },
  resume_parser: { route: '/atslogin', sentence: 'To upload your resume, ' },
  resume_enhancer: { route: '/atslogin/report', sentence: 'To see AI suggestions, ' },
};

// cover_letter's /cover-letter route is fully public end-to-end (verified
// in publicRoutes) -- unlike the protected features above, guests go
// straight there too, no login-trigger needed.
const PUBLIC_FEATURE_LINKS: Record<string, { route: string; sentence: string }> = {
  cover_letter: { route: '/cover-letter', sentence: 'To get started, ' },
};

const buildLoginTriggerHref = (destination: string): string =>
  `/?showLogin=true&next=${encodeURIComponent(destination)}`;

// Ticket ids look like CB-00001. A ?ticket= value with anything else in it
// ('/', '.', '%', ...; e.g. '../admin') is rejected before any request.
const isValidTicketId = (id: string): boolean => /^[A-Za-z0-9_-]{1,64}$/.test(id);

/**
 * Pure function, no rendering -- derives the inline action link (if any)
 * for a KB-answered category, given the current auth state. Returns null
 * when no real destination page exists for the topic, so no link should
 * be shown at all.
 */
export const getActionLink = (category: string, isAuthenticated: boolean): ActionLink | null => {
  const publicFeature = PUBLIC_FEATURE_LINKS[category];
  if (publicFeature) {
    return { sentence: publicFeature.sentence, linkText: 'click here', href: publicFeature.route };
  }

  if (PASSWORD_RESET_CATEGORIES.has(category)) {
    return { sentence: 'To reset your password, ', linkText: 'click here', href: '/forgot-password' };
  }

  if (PROFILE_CATEGORIES.has(category)) {
    return isAuthenticated
      ? { sentence: 'To view or edit your profile, ', linkText: 'click here', href: '/profile' }
      : {
          sentence: 'To view or edit your profile, please log in -- ',
          linkText: 'click here',
          href: buildLoginTriggerHref('/profile'),
          requiresLogin: true,
        };
  }

  const protectedFeature = PROTECTED_FEATURE_LINKS[category];
  if (protectedFeature) {
    return isAuthenticated
      ? { sentence: protectedFeature.sentence, linkText: 'click here', href: protectedFeature.route }
      : {
          sentence: `${protectedFeature.sentence}please log in -- `,
          linkText: 'click here',
          href: buildLoginTriggerHref(protectedFeature.route),
          requiresLogin: true,
        };
  }

  return null;
};

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

// FEATURE_ISSUE_TYPES moved to src/lib/ticketCategories.ts -- shared with
// the dedicated guest support portal (/support/tickets/new) so the two
// forms' issue-type options never drift apart.

// Status label/color map and the cancellable-status set now live in
// src/lib/ticketCategories.ts -- shared with the dashboard's Support &
// History page so both surfaces render ticket status identically.
const STATUS_META = TICKET_STATUS_META;

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

const MessageIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    stroke="white"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* The original single-bubble icon, duplicated (not a new shape) --
        one copy offset up-left and dimmed to read as "behind", the other
        at its normal position in front. */}
    <g opacity="0.55" transform="translate(-3, -3)">
      <path d="M6 8C6 6.89543 6.89543 6 8 6H24C25.1046 6 26 6.89543 26 8V18C26 19.1046 25.1046 20 24 20H10L6 24V8Z" />
      <line x1="10" y1="12" x2="18" y2="12" />
      <line x1="10" y1="16" x2="14" y2="16" />
    </g>
    <g transform="translate(2, 2)">
      <path d="M6 8C6 6.89543 6.89543 6 8 6H24C25.1046 6 26 6.89543 26 8V18C26 19.1046 25.1046 20 24 20H10L6 24V8Z" />
      <line x1="10" y1="12" x2="18" y2="12" />
      <line x1="10" y1="16" x2="14" y2="16" />
    </g>
  </svg>
);

const ChatApp: React.FC = () => {
  const router = useRouter();
  const hasOpenedRef = useRef(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isClosed, setIsClosed] = useState(false);
  // Generic "this message's interactive option group has been resolved"
  // tracker -- shared by every kind of chatbot choice (guided-flow
  // menuOptions: welcome/topic/subtopic/leaf-question/follow-up, AND a KB
  // answer's relatedQuestions). One click from a group marks its owning
  // message id here; the render layer below hides that whole group the
  // moment its id is in this set, and the click handlers use it to reject
  // a second click on an already-resolved group (old step re-clicked, or a
  // rapid double-click), so nothing can fire its action twice.
  const [answeredOptionGroupIds, setAnsweredOptionGroupIds] = useState<Set<string>>(new Set());
  // The single in-flight "next bot message" delay (see
  // scheduleGuidedMessage) -- cleared before scheduling a new one and on
  // unmount, so a rapid-fire second click can't double-schedule and a
  // closed/unmounted widget can't append a message after the fact.
  const guidedMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // What that pending timer will run, and whether it is the post-answer
  // follow-up prompt (droppable) or a navigation step the user already
  // chose (a menu, the Contact Support redirect) -- see handleSendMessage.
  const pendingGuidedStepRef = useRef<{ run: () => void; kind: GuidedStepKind } | null>(null);
  // Date.now() alone can collide between two guided messages created within
  // the same millisecond (e.g. a scheduled bot message landing right as the
  // next user click echoes) -- a real bug, not just a timing fluke: an ID
  // collision with an already-answered message would make the new one look
  // pre-answered too (answeredOptionGroupIds is keyed by message id), so a
  // freshly-revealed menu could silently render as permanently disabled.
  // This counter guarantees uniqueness regardless of timing.
  const guidedMessageSeqRef = useRef(0);
  // Bumped by initializeChat (New Chat, Close, account switch): a guided
  // leaf question whose KB request was still in flight across that reset
  // must not schedule its follow-up into the fresh conversation.
  const guidedConversationEpochRef = useRef(0);
  // Dismissible proactive greeting popup shown to guests on the launcher
  // before they open the widget (see the isMinimized render branch) --
  // local UI state, not persisted, so it reappears on the next full visit.
  const [guestGreetingDismissed, setGuestGreetingDismissed] = useState(false);
  // Set when a popup option is clicked (before the widget/session is even
  // initialized) -- consumed by the effect below once the welcome
  // message's options actually exist, to carry that selection into the
  // guided flow instead of just opening to the bare welcome screen.
  const [pendingLauncherSelection, setPendingLauncherSelection] = useState<GuidedMenuOption | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  // True once `sessionId` is a real MongoDB-backed session (created via
  // createChatSession, or opened from a backend history row). Guests, and
  // authenticated users for whom session creation failed, keep this false
  // and fall through to the original stateless sendChatMessage() path --
  // this is a fallback, never a hard dependency.
  const [isBackendSession, setIsBackendSession] = useState(false);
  const [tickets, setTickets] = useState<TicketInfo[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketInfo | null>(null);
  // Populated once, from ?ticket= in the URL -- the deep link the
  // support-team notification email's "View Tickets" button now points at
  // (see getTicketDetails / the effect below). Not re-read on navigation
  // within the widget; it only ever drives the one auto-open on load.
  const [deepLinkTicketId] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('ticket')
  );
  // Populated once, from ?chat_session= in the URL -- the deep link the
  // dashboard's Support History page's "Continue conversation" button
  // points at (see getChatSession / the effect below). Not ?session=:
  // other pages own that (e.g. /cover-letter/new's extension hand-off).
  const [deepLinkSessionId] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('chat_session')
  );
  // Populated once, from ?chat=new in the URL -- the dashboard's Support
  // History page's "New Conversation" button points here. Guarded by
  // deepLinkNewChatHandledRef so it fires startNewChat exactly once, not on
  // every re-render after hasInitialized flips true.
  const [deepLinkNewChat] = useState<boolean>(() =>
    typeof window === 'undefined' ? false : new URLSearchParams(window.location.search).get('chat') === 'new'
  );
  const deepLinkNewChatHandledRef = useRef(false);
  // Set once initializeApp (below) finishes its own setMessages([welcomeMessage])
  // reset -- the deep-link effect must not race that reset with its own
  // setMessages call, or whichever one lands second wins and silently
  // drops the other's message.
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isCancellingTicket, setIsCancellingTicket] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState<Map<string, 'yes' | 'no'>>(new Map());
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isProcessingRef = useRef(false);  // Prevent concurrent requests
  const cachedEmailRef = useRef<string | null>(null);  // Cache email to avoid silent loss on getProfile() failure
  // Bumped on every sign-out / account switch: a request started for the
  // previous account must not apply its result after that (sending,
  // History, tickets, ticket submit), and the ?ticket= deep link re-runs
  // for the new one.
  const accountGenerationRef = useRef(0);
  const [accountGeneration, setAccountGeneration] = useState(0);
  const startNewAccountGeneration = () => {
    accountGenerationRef.current += 1;
    setAccountGeneration(accountGenerationRef.current);
  };
  const selectedApp = 'CareerBot';
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showTicketSuccess, setShowTicketSuccess] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  // The exact question/answer pair this ticket was raised from (e.g. via
  // "Raise a support ticket" under an unhelpful reply) -- kept separate
  // from ticketSubject/ticketDescription (see openTicketModal) so the
  // chatbot's answer never overwrites or gets mistaken for the customer's
  // own question. Empty when a ticket is raised with no prior Q&A.
  const [ticketOriginalQuestion, setTicketOriginalQuestion] = useState('');
  const [ticketChatbotAnswer, setTicketChatbotAnswer] = useState('');
  const [ticketFeature, setTicketFeature] = useState<string | null>(null);
  const [ticketIssueType, setTicketIssueType] = useState<string>('');
  const [ticketStepsToReproduce, setTicketStepsToReproduce] = useState('');
  const [ticketAttachments, setTicketAttachments] = useState<File[]>([]);
  // Picker message, for files over the count/size limit.
  const [attachmentNotice, setAttachmentNotice] = useState('');
  const [ticketId, setTicketId] = useState('');
  // Drives the "View Attachment" link(s) in the just-submitted success
  // modal only -- populated with guest view_urls when present (see
  // submitTicket), separate from `tickets`/`selectedTicket` state.
  const [successTicketAttachments, setSuccessTicketAttachments] = useState<TicketAttachmentSummary[]>([]);
  // Filenames that failed to upload and so were never attached -- shown in
  // the success modal so a failed attachment is never silently missing with
  // no explanation (the ticket itself still goes out without it).
  const [failedTicketAttachmentNames, setFailedTicketAttachmentNames] = useState<string[]>([]);
  const [ticketPriority, setTicketPriority] = useState<1 | 2>(1);
  const [ticketTransactionId, setTicketTransactionId] = useState('');
  const [ticketInvoiceNumber, setTicketInvoiceNumber] = useState('');
  const [ticketPaymentDate, setTicketPaymentDate] = useState('');
  const [ticketName, setTicketName] = useState('');
  const [ticketEmail, setTicketEmail] = useState('');
  const [ticketUserType, setTicketUserType] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [userName, setUserName] = useState('');
  // Must start false, matching what isUserAuthenticated() always returns
  // during SSR (it short-circuits on `typeof window === 'undefined'') --
  // initializing from the real client-side value here caused a hydration
  // mismatch (server renders the guest bubble, client immediately wants
  // the bare authenticated launcher) on any fresh top-level page load by
  // an already-authenticated visitor, e.g. clicking the ?ticket= email
  // link straight into /chatbot. Corrected to the real value in the
  // mount-only effect below, immediately after hydration.
  const [isLocallyAuthenticated, setIsLocallyAuthenticated] = useState(false);

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
  const lastMessageRef = useRef<HTMLDivElement>(null);

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

  // Carries a launcher-popup option click (see the isMinimized render
  // branch) into the guided flow once the widget has actually opened and
  // initializeChat has set the welcome message's options -- the click
  // itself only opens the widget; this is what makes that click also land
  // the user directly on the chosen path instead of just the bare welcome
  // screen.
  //
  // Waits for the conversation to exist (initializeChat's welcome message,
  // or the one kept across a minimize) and for any in-flight send or
  // pending guided step to land first -- this re-runs when they do
  // (messages / isLoading change) -- so a popup pick is never dropped:
  // not when 'welcome' was already answered before a minimize, and not
  // when showSuggestedQuestions is off (the welcome has no menuOptions).
  useEffect(() => {
    if (!pendingLauncherSelection) return;
    if (messages.length === 0) return;
    if (isProcessingRef.current || guidedMenuTimeoutRef.current) return;
    const selection = pendingLauncherSelection;
    setPendingLauncherSelection(null);
    handleGuidedMenuSelect('welcome', selection, { fromLauncher: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, pendingLauncherSelection, isLoading]);

  // Guards against the guided-flow's delayed "next message" firing after
  // the widget (or the whole component) has gone away -- e.g. closed mid-delay.
  useEffect(() => {
    return () => {
      pendingGuidedStepRef.current = null;
      if (guidedMenuTimeoutRef.current) {
        clearTimeout(guidedMenuTimeoutRef.current);
        guidedMenuTimeoutRef.current = null;
      }
    };
  }, []);

  // Runs once, immediately after hydration, to correct isLocallyAuthenticated
  // from its forced SSR-safe `false` to the real client-side value -- see
  // the comment on that state. Deliberately NOT gated on hasOpenedRef (unlike
  // checkAuthStatus below): an authenticated visitor's minimized launcher
  // must show the right bubble even if they never open the widget.
  useEffect(() => {
    setIsLocallyAuthenticated(isUserAuthenticated());
  }, []);

  useEffect(() => {
    // Only initialize chat when it's first opened
    if (isMinimized || hasOpenedRef.current) return;
    hasOpenedRef.current = true;

    const initializeApp = async () => {
      await ensureToken();
      await initializeChat();
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

      setHasInitialized(true);
    };

    initializeApp();
  }, [isMinimized]);

  // Track current user email to detect account switches
  // IMPORTANT: This MUST use getProfile().email (real email), NOT localStorage.user_email (fake guest email)
  const userEmailRef = useRef<string | null>(null);
  // Numbers each auth check. A check may act only if no newer check has
  // already acted on a definite answer (signed out, or a profile): an older,
  // slower one would "switch back" to the account its request saw.
  const authCheckSeqRef = useRef(0);
  const answeredAuthCheckRef = useRef(0);

  // Detect logout, login, or account switch
  useEffect(() => {
    const checkAuthStatus = async () => {
      // Nothing to reconcile until the widget has actually been opened —
      // skip the otherwise-unconditional profile refetch on every mount,
      // visibility change, and 30s tick, for every visitor on every page.
      if (!hasOpenedRef.current) return;

      const currentAuth = isUserAuthenticated();
      const checkSeq = ++authCheckSeqRef.current;

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
      if (checkSeq < answeredAuthCheckRef.current) return;
      if (!currentAuth || currentUserEmail) answeredAuthCheckRef.current = checkSeq;

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
        setSelectedTicket(null);
        setIsLocallyAuthenticated(true);
        // The open conversation (and its backend session) belongs to the
        // previous account: start a fresh one for this account.
        startNewAccountGeneration();
        const generation = accountGenerationRef.current;
        initializeChat();

        // Reload user profile and history for new account
        try {
          const userProfile = await getProfile();
          // Switched again (or signed out) while this loaded: that change owns the screen now.
          if (generation !== accountGenerationRef.current) return;
          // Yet another account signed in while this loaded (its own check may
          // have failed, so nothing bumped the generation): load nothing for
          // the email this check saw; the next check switches to the new one.
          if (userProfile?.email !== currentUserEmail) return;
          console.log('Loaded new account profile:', userProfile?.full_name);
          if (userProfile?.full_name) {
            setUserName(userProfile.full_name);
          }
          // Reload tickets for the new user (using real profile email)
          await loadTickets(currentUserEmail, generation);
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
        // Never let a guest keep writing into the signed-out user's backend
        // session, or see their conversation.
        startNewAccountGeneration();
        initializeChat();
      } else if (!isLocallyAuthenticated && currentAuth) {
        // Login detected
        console.log('Login detected');
        userEmailRef.current = currentUserEmail;
        setIsLocallyAuthenticated(true);
        const generation = accountGenerationRef.current;

        // Load user profile and tickets
        try {
          const userProfile = await getProfile();
          if (generation !== accountGenerationRef.current) return;
          // As in the switch branch above, and drop the guest's ticket list.
          // (No email from this check's first request: nothing is loaded
          // below, only the name is shown.)
          if (currentUserEmail && userProfile?.email !== currentUserEmail) {
            setTickets([]);
            return;
          }
          console.log('Loaded user profile:', userProfile?.full_name);
          if (userProfile?.full_name) {
            setUserName(userProfile.full_name);
          }
          // Reload tickets for the logged-in user (using real profile email)
          if (currentUserEmail) {
            await loadTickets(currentUserEmail, generation);
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

    // Same-tab credential sign-in / sign-out announces
    // 'careerbot-account-changed' (src/lib/accountChange.ts), not a storage
    // event. Deferred one task: signIn() announces before SignUpModal
    // stamps token_last_refreshed_at, which isUserAuthenticated() reads.
    // A never-opened widget has nothing to reconcile but its launcher
    // (guest popup vs bare button), so it only re-reads the auth state.
    let accountChangedTimer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribeAccountChanged = onAccountChanged(() => {
      if (accountChangedTimer) clearTimeout(accountChangedTimer);
      accountChangedTimer = setTimeout(() => {
        accountChangedTimer = null;
        if (!hasOpenedRef.current) {
          setIsLocallyAuthenticated(isUserAuthenticated());
          return;
        }
        checkAuthStatus();
      }, 0);
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    // Check immediately
    checkAuthStatus();

    // Check every 30 seconds instead of 3 seconds to reduce API load
    const interval = setInterval(checkAuthStatus, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      unsubscribeAccountChanged();
      if (accountChangedTimer) clearTimeout(accountChangedTimer);
      clearInterval(interval);
    };
  }, [isLocallyAuthenticated]);

  // Fired by renderMarkdownText's action:login buttons (e.g. the "[click
  // here](action:login)" link getAuthRequiredMessage now appends to
  // guest auth-prompt text) -- a plain DOM CustomEvent rather than a prop
  // callback since renderMarkdownText is a module-level function with no
  // access to this component's handlers.
  useEffect(() => {
    const handleChatbotAction = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.action === 'login') {
        // Redirect to home page with login modal, then back to this page.
        window.location.href = buildLoginTriggerHref(window.location.pathname + window.location.search);
      }
    };

    window.addEventListener('chatbot:action', handleChatbotAction);
    return () => window.removeEventListener('chatbot:action', handleChatbotAction);
  }, []);

  // ?ticket= deep link from the support-team email's "View Tickets" button.
  // Reuses the existing /chatbot page and ticket-detail modal -- no new
  // frontend page. Opening the widget is split into its own effect, separate
  // from the fetch-or-prompt logic below, because that logic must not run
  // until AFTER initializeApp's own setMessages([welcomeMessage]) reset.
  useEffect(() => {
    if (!deepLinkTicketId) return;
    setIsMinimized(false);
  }, [deepLinkTicketId]);

  // Re-runs when auth state changes so a staff member who follows the link
  // while logged out gets prompted to log in, then lands on the same ticket
  // once they're back (buildLoginTriggerHref's `next` round-trips this exact
  // URL). Gated on hasInitialized -- see the comment on that state.
  useEffect(() => {
    if (!deepLinkTicketId || !hasInitialized) return;

    if (!isValidTicketId(deepLinkTicketId)) {
      setMessages((prev) => prev.some((m) => m.id === 'deep-link-invalid') ? prev : [
        ...prev,
        { id: 'deep-link-invalid', type: 'assistant', text: 'That link is not a valid ticket link.', timestamp: new Date() },
      ]);
      return;
    }

    if (!isLocallyAuthenticated) {
      const loginHref = buildLoginTriggerHref(`/chatbot?ticket=${encodeURIComponent(deepLinkTicketId)}`);
      setMessages((prev) => [
        ...prev,
        {
          id: `deep-link-login-${deepLinkTicketId}`,
          type: 'assistant',
          text: `Please log in to view ticket ${deepLinkTicketId}.`,
          timestamp: new Date(),
          actionLink: { sentence: '', linkText: 'Log in to continue', href: loginHref, requiresLogin: true },
        },
      ]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const ticket = await getTicketDetails(deepLinkTicketId);
        if (cancelled) return;
        setSelectedTicket({
          id: ticket.ticket_id,
          subject: ticket.subject,
          status: ticket.status,
          priority: ticket.priority === 'urgent' ? 2 : 1,
          created_at: ticket.created_at,
          contact_email: ticket.user_email,
          description: ticket.description,
          affected_feature: ticket.affected_feature,
          updated_at: ticket.updated_at,
          user_name: ticket.user_name,
          attachments: ticket.attachments,
        });
      } catch (error) {
        if (cancelled) return;
        console.error(`Failed to load deep-linked ticket ${deepLinkTicketId}:`, error);
        const status = (error as { response?: { status?: number } })?.response?.status;
        const text =
          status === 404
            ? `Ticket ${deepLinkTicketId} was not found.`
            : status === 403
              ? `You don't have permission to view ticket ${deepLinkTicketId}.`
              : `Couldn't load ticket ${deepLinkTicketId}. Please try again.`;
        setMessages((prev) => [
          ...prev,
          { id: `deep-link-error-${deepLinkTicketId}`, type: 'assistant', text, timestamp: new Date() },
        ]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [deepLinkTicketId, isLocallyAuthenticated, hasInitialized, accountGeneration]);

  // Mirrors the ?ticket= deep link above, for "Continue conversation" on
  // the dashboard's Support & History page. Fetches the session directly
  // via getChatSession -- the widget itself keeps no local session list to
  // look it up in (History/conversation listing lives entirely on that
  // dashboard page now).
  useEffect(() => {
    if (!deepLinkSessionId) return;
    setIsMinimized(false);
  }, [deepLinkSessionId]);

  // The account generation this deep link was actually fetched under --
  // set on the first run that gets past the login gate below, never
  // reassigned after. Lets a later switch skip re-fetching (or reusing)
  // this session under the new account entirely, rather than just
  // cancelling the in-flight request: the session was never the new
  // account's to begin with, so there's nothing to retry it as.
  const deepLinkSessionGenerationRef = useRef<number | null>(null);

  // Re-runs when auth state OR the account itself changes, same reasoning
  // as the ticket deep link above: a signed-out user who follows the link
  // gets prompted to log in, then lands on the same conversation once
  // they're back. accountGeneration in the dependency array is what makes
  // this safe across an account switch specifically -- without it, a
  // switch mid-fetch doesn't re-run this effect, so `cancelled` is never
  // set, and the OLD account's session detail can still land (restoring
  // its messages, and setting sessionId/isBackendSession to ITS session)
  // after the new account is already active.
  useEffect(() => {
    if (!deepLinkSessionId || !hasInitialized) return;

    if (!isLocallyAuthenticated) {
      // A logout (which bumps accountGeneration, see startNewAccountGeneration
      // in the "Logout detected" branch above) is a fresh start, not a
      // "switch to guard against" -- without this reset, logging back in
      // afterward (even as the SAME account) would permanently look like
      // a later, unrelated generation to the check below and never fetch
      // again. Signing in is what the message/link just below exists for.
      deepLinkSessionGenerationRef.current = null;
      const loginHref = buildLoginTriggerHref(`/chatbot?chat_session=${encodeURIComponent(deepLinkSessionId)}`);
      setMessages((prev) => [
        ...prev,
        {
          id: `deep-link-login-${deepLinkSessionId}`,
          type: 'assistant',
          text: `Please log in to continue this conversation.`,
          timestamp: new Date(),
          actionLink: { sentence: '', linkText: 'Log in to continue', href: loginHref, requiresLogin: true },
        },
      ]);
      return;
    }

    if (deepLinkSessionGenerationRef.current === null) {
      deepLinkSessionGenerationRef.current = accountGeneration;
    } else if (deepLinkSessionGenerationRef.current !== accountGeneration) {
      // A later account's re-run of this effect, with no intervening
      // logout (that resets the ref above) -- the cleanup below, from the
      // generation that actually owns this fetch, already cancels it.
      // Nothing here belongs to the new account.
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const detail = await getChatSession(deepLinkSessionId);
        if (cancelled) return;
        const restoredMessages: Message[] = detail.messages.map((m) => ({
          id: m.message_id,
          type: m.role,
          text: m.content,
          timestamp: new Date(m.timestamp),
        }));
        if (detail.status === 'closed') {
          // The transcript is still worth showing, but NOT as the active
          // session: a follow-up message into a closed session 409s. Leave
          // sessionId/isBackendSession alone so "New Chat"/sending a message
          // starts a fresh session instead of retrying the closed one.
          setMessages([
            ...restoredMessages,
            {
              id: `${deepLinkSessionId}-closed`,
              type: 'system',
              text: 'This conversation is closed. Start a new chat to continue.',
              timestamp: new Date(),
            },
          ]);
          return;
        }
        setMessages([
          ...restoredMessages,
          { id: `${deepLinkSessionId}-restored`, type: 'system', text: RESTORED_NOTICE_TEXT, timestamp: new Date() },
        ]);
        setSessionId(deepLinkSessionId);
        setIsBackendSession(true);
      } catch (error) {
        if (cancelled) return;
        console.error(`Failed to load deep-linked session ${deepLinkSessionId}:`, error);
        setMessages((prev) => [
          ...prev,
          {
            id: `deep-link-error-${deepLinkSessionId}`,
            type: 'assistant',
            text: "Sorry, I couldn't load that conversation. Please try again.",
            timestamp: new Date(),
          },
        ]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [deepLinkSessionId, isLocallyAuthenticated, hasInitialized, accountGeneration]);

  // ?chat=new -- the dashboard's "New Conversation" button. Just opens the
  // widget onto a fresh chat; startNewChat already handles archiving
  // whatever was open before (a no-op here since nothing has been sent yet).
  useEffect(() => {
    if (!deepLinkNewChat) return;
    setIsMinimized(false);
  }, [deepLinkNewChat]);

  useEffect(() => {
    if (!deepLinkNewChat || !hasInitialized || deepLinkNewChatHandledRef.current) return;
    deepLinkNewChatHandledRef.current = true;
    startNewChat();
  }, [deepLinkNewChat, hasInitialized]);

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
    if (!container) return;

    // Scroll so the TOP of the newest message lands at the top of the
    // scrollable area, rather than always jumping to scrollHeight. A long
    // suggested-question list (or any message taller than the visible
    // area) would otherwise have its top -- and the just-echoed selection
    // right above it -- scrolled past and out of view, with only its
    // bottommost edge visible. Falls back to the old bottom-jump when
    // there's no last-message element yet (e.g. the isLoading typing dots,
    // which aren't part of `messages`).
    const lastMessageEl = lastMessageRef.current;
    if (lastMessageEl) {
      // getBoundingClientRect (not offsetTop) so this is correct regardless
      // of which ancestor ends up as the positioned offsetParent.
      const containerRect = container.getBoundingClientRect();
      const messageRect = lastMessageEl.getBoundingClientRect();
      const target = container.scrollTop + (messageRect.top - containerRect.top);
      container.scrollTo({ top: target, behavior: 'smooth' });
      return;
    }

    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  };

  // Keyed off the backend's own topic classification (`category`), not the
  // user's raw question text. Matching against free-text was both
  // inconsistent (most phrasings hit no keyword at all, so no suggestions
  // showed) and wrong (a keyword could appear in an unrelated question and
  // pull in an unrelated topic's suggestions). The backend's classification
  // is already authoritative for what this answer is about -- piggyback on
  // it instead of re-guessing.
  //
  // Every key below is a REAL category this backend returns -- discovered
  // by probing /api/v1/chat/message with representative questions per
  // domain and reading back the `category` field it actually classified
  // them as (not guessed/invented). `unknown_login_issue` is deliberately
  // excluded: it's the backend's generic "can you describe what's
  // happening" clarifying fallback, always below the 0.7 confidence gate
  // this function is only called behind -- it isn't a real topic, so there
  // is nothing relevant to suggest for it. Each entry's questions are
  // phrased to land back on one of this same set of categories, so a click
  // leads to another real, confidently-answered topic rather than a
  // dead end.
  const getRelatedQuestions = (category: string, currentQuestion: string, previousQuestions: string[] = [], isAuthenticated: boolean = false): string[] => {
    const normalizedCurrent = currentQuestion.toLowerCase().replace(/[^\w\s]/g, '').trim();

    // Pre-login cross-links ("why can't I log in" / "reset my password")
    // make no sense to suggest to someone already signed in -- verified live
    // that each of these routes to a distinct topic, none circular back to
    // profile_building/signup_update_registered_email themselves.
    const profileBuildingRelated = isAuthenticated
      ? [
          '📧 How can I update my name or email address?',
          '🚪 How do I sign out of my account?',
          '🔄 Why do I keep getting signed out unexpectedly?',
        ]
      : [
          '📧 How do I update my email address?',
          '✅ What is included in the free plan?',
          '🔑 How can I reset my password?',
        ];
    const signupUpdateEmailRelated = isAuthenticated
      ? [
          '👤 Where can I edit my profile details?',
          '🚪 How do I sign out of my account?',
          '🔄 Why do I keep getting signed out unexpectedly?',
        ]
      : [
          '🔑 How can I reset my password?',
          '👤 How can I edit my profile?',
          '📧 How can I get help with OTP verification?',
        ];
    const signoutNotWorkingRelated = [
      '🔄 Why do I keep getting signed out unexpectedly?',
      '👤 How can I update my profile information?',
      '📧 How can I update my registered email address?',
    ];
    const sessionUnexpectedSignoutRelated = [
      '🚪 How do I sign out of my account?',
      '👤 How can I update my profile information?',
      '📧 How can I update my registered email address?',
    ];

    // Products & Features -- auth-aware sub-questions for the 6 main
    // topics (Resume Building, Job Match, Mock Interview, Mock Test,
    // Coding Assessment, English Assessment). Every phrase below was
    // verified live against the backend to resolve to its intended,
    // non-self-referencing, non-duplicate topic before being added.
    //
    // The guest main question for Resume Building resolves to
    // resume_optimization (a hardcoded composite overview), while the
    // authenticated one resolves to resume_builder (the specific KB
    // topic) -- both are made auth-aware below, since either topic can
    // also be reached directly via typed text regardless of auth state.
    //
    // Mock Interview, Mock Test, Coding Assessment, and English Assessment
    // have NO sibling KB topics of their own (verified: every candidate
    // "what topics are covered" / "how do I view my results" style
    // sub-question either fails to route at all, or resolves back to the
    // same topic as its own main question). Their sub-questions instead
    // cross-link to each other -- a real, verified, non-duplicate
    // "assessment cluster" -- rather than inventing granular sub-topics
    // the KB does not have.
    const resumeOptimizationRelated = isAuthenticated
      ? [
          '💡 How can I improve my existing resume?',
          '📝 How can I create a cover letter?',
          '📋 How can I upload my resume to get an ATS score?',
        ]
      : [
          '✨ How can I create a resume?',
          '💡 How can I improve my resume?',
          '📝 Can CareerBot help me create a cover letter?',
        ];
    const resumeBuilderRelated = isAuthenticated
      ? [
          '💡 How can I improve my existing resume?',
          '📝 How can I create a cover letter?',
          '📋 How can I upload my resume to get an ATS score?',
        ]
      : [
          '💡 How can I improve my resume?',
          '📝 Can CareerBot help me create a cover letter?',
          '📋 How can I upload my resume to get an ATS score?',
        ];
    const jobMatchRelated = isAuthenticated
      ? [
          '💼 How can I improve my match for a job?',
          '🔍 How can I search for jobs that match my skills?',
          '✨ How can I get AI suggestions to improve my resume?',
        ]
      : [
          '💼 What does my job match score mean?',
          '🔍 How can I search for jobs that match my skills?',
          '✨ How can I get AI suggestions to improve my resume?',
        ];
    const mockInterviewLiveRelated = isAuthenticated
      ? [
          '🎭 How can I practice for another interview?',
          '📊 Where can I take a Mock Test and see my results?',
          '💻 Where can I practice coding problems and review my performance?',
        ]
      : [
          '🎭 What types of interview questions can I practice?',
          '📊 How do I take a mock test and check my results?',
          '💻 How can I practice coding problems to assess my skills?',
        ];
    const mockTestRelated = isAuthenticated
      ? [
          '🎤 How can I start a Mock Interview and review my feedback?',
          '💻 Where can I practice coding problems and review my performance?',
          '🗣️ How can I take an English Assessment and review my performance?',
        ]
      : [
          '🎤 How do I start a mock interview?',
          '💻 How can I practice coding problems to assess my skills?',
          '🗣️ Can I take an English assessment to check my speaking and writing skills?',
        ];
    const codingTestRelated = isAuthenticated
      ? [
          '📊 Where can I take a Mock Test and see my results?',
          '🎤 How can I start a Mock Interview and review my feedback?',
          '🗣️ How can I take an English Assessment and review my performance?',
        ]
      : [
          '📊 How do I take a mock test and check my results?',
          '🎤 How do I start a mock interview?',
          '🗣️ Can I take an English assessment to check my speaking and writing skills?',
        ];
    const englishAssessmentRelated = isAuthenticated
      ? [
          '💻 Where can I practice coding problems and review my performance?',
          '📊 Where can I take a Mock Test and see my results?',
          '🎤 How can I start a Mock Interview and review my feedback?',
        ]
      : [
          '💻 How can I practice coding problems to assess my skills?',
          '📊 How do I take a mock test and check my results?',
          '🎤 How do I start a mock interview?',
        ];

    const relatedMap: Record<string, string[]> = {
      // Login & Account
      forgot_password: [
        "⚠️ Why can't I log in to my account?",
        '🔒 What should I do if my account is locked?',
        '📧 How can I get help with OTP verification?',
      ],
      social_signin_not_linking: [
        '🔑 How can I reset my password?',
        '🔒 What should I do if my account is locked?',
        '👤 How do I update my email address?',
      ],
      otp_not_received: [
        '🔑 How can I reset my password?',
        '📧 How do I verify my email address?',
        "⚠️ Why can't I log in to my account?",
      ],
      account_locked: [
        '🔑 How can I reset my password?',
        "⚠️ Why can't I log in to my account?",
        '👤 How can I edit my profile?',
      ],
      otp_verification_not_completing: [
        '📧 How can I get help with OTP verification?',
        '🔑 How can I reset my password?',
        '👤 How do I update my email address?',
      ],
      account_access_general_issue: [
        '📧 Why am I not receiving the OTP?',
        '🔑 How can I reset my password?',
        '👤 How can I edit my profile?',
      ],
      signup_update_registered_email: signupUpdateEmailRelated,
      profile_building: profileBuildingRelated,
      signout_not_working: signoutNotWorkingRelated,
      session_unexpected_signout: sessionUnexpectedSignoutRelated,

      // Subscription & Billing
      subscription_plans: [
        '1️⃣ How can I upgrade my plan?',
        '❌ Can I cancel my subscription?',
        '💯 What is the refund policy?',
      ],
      refund_request: [
        '💳 What payment methods do you accept?',
        '❌ Can I cancel my subscription?',
        '✅ What is included in the free plan?',
      ],
      upgrade_downgrade_plan: [
        '✅ What is included in the free plan?',
        '💳 What payment methods do you accept?',
        '❌ Can I cancel my subscription?',
      ],
      cancel_subscription: [
        '💯 What is the refund policy?',
        '1️⃣ How can I upgrade my plan?',
        '✅ What is included in the free plan?',
      ],
      payment_methods: [
        '💰 I was charged twice, what do I do?',
        '💯 What is the refund policy?',
        '1️⃣ How can I upgrade my plan?',
      ],
      billing_dispute: [
        '💳 What payment methods do you accept?',
        '💯 What is the refund policy?',
        '👤 What is my subscription plan?',
      ],
      account_subscription: [
        '✅ What is included in the free plan?',
        '❌ Can I cancel my subscription?',
        '1️⃣ How can I upgrade my plan?',
      ],

      // Product Features
      //
      // '🎯 How does job match work?' used to appear as a cross-link in
      // several buckets below -- it actually resolves to the smart_match
      // topic (a different, free feature), not job_match, verified live.
      // A later attempted fix ('✨ What is Smart Match and how is it
      // different?') was never itself verified and turned out to resolve
      // to unknown_login_issue -- a complete miss. The replacement below
      // ('✨ What is Smart Match and how does it rank jobs for me?') is the
      // one phrase that was actually confirmed live to resolve to
      // smart_match at HIGH confidence; it now replaces every mislabeled
      // occurrence consistently (products_features, job_search, job_match).
      products_features: [
        '✨ How can I create a resume?',
        '✨ What is Smart Match and how does it rank jobs for me?',
        '🎤 What is mock interview?',
      ],
      // resume_optimization is the hardcoded composite topic the guest
      // main question ("What can CareerBot help me do with my resume?")
      // resolves to; resume_builder is the specific KB topic the
      // authenticated main question resolves to. Both made auth-aware
      // above (resumeOptimizationRelated / resumeBuilderRelated) since
      // either can also be reached directly via typed text.
      resume_optimization: resumeOptimizationRelated,
      resume_builder: resumeBuilderRelated,
      resume_enhancer: [
        '✨ How can I create a resume?',
        '📋 What does resume parser do?',
        '📝 How can I create a cover letter?',
      ],
      resume_parser: [
        '✨ How can I create a resume?',
        '💡 How can I improve my resume?',
        '📝 How can I create a cover letter?',
      ],
      // Both spellings -- "cover_letter" is the JSON KB topic intent,
      // "cover_letter_help" is the hardcoded LoginIntent spelling hit by
      // the guest sub-question "Can CareerBot help me create a cover
      // letter?" -- verified live, same duality pattern as elsewhere.
      cover_letter: [
        '✨ How can I create a resume?',
        '💡 How can I improve my resume?',
        '🔍 How can I search for jobs?',
      ],
      cover_letter_help: [
        '✨ How can I create a resume?',
        '💡 How can I improve my resume?',
        '🔍 How can I search for jobs?',
      ],
      job_search: [
        '✨ What is Smart Match and how does it rank jobs for me?',
        '💼 What jobs match my skills and experience?',
        '✨ How can I create a resume?',
      ],
      smart_match: [
        '💼 What jobs match my skills and experience?',
        '🔍 How can I search for jobs?',
        '💡 How can I improve my resume?',
      ],
      job_match: jobMatchRelated,
      mock_interview_live: mockInterviewLiveRelated,
      mock_test: mockTestRelated,
      interview_prep: [
        '🎤 What is mock interview?',
        '📊 What is mock test?',
        '💡 How can I improve my resume?',
      ],
      coding_test: codingTestRelated,
      english_assessment: englishAssessmentRelated,
    };

    const candidateQuestions = relatedMap[(category || '').toLowerCase()] || [];

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
    // Every bucket above has exactly 3 entries by design -- this just
    // guards that invariant rather than relying on it silently.
    return shuffled.slice(0, 3);
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
    // Client-generated placeholder id -- what every conversation starts
    // with, guest or authenticated. The backend MongoDB session is created
    // lazily, on the first real message (see handleSendMessage), not here --
    // creating it on widget-open (or on "New Conversation") produced an
    // empty "New Chat" row in History for every user who opened the widget
    // and sent nothing.
    const newSessionId = `chat-session-${Date.now()}`;
    setSessionId(newSessionId);
    setIsBackendSession(false);

    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'assistant',
      text: `Hi! I'm CareerBot. 🤖 How can I help you today?`,
      timestamp: new Date(),
      // Same setting that used to gate the old always-visible quick-menu --
      // off means a plain welcome message with no guided options, as before.
      menuOptions: settings.showSuggestedQuestions ? buildInitialMenuOptions() : undefined,
    };
    setMessages([welcomeMessage]);
    setAnsweredOptionGroupIds(new Set());
    guidedConversationEpochRef.current += 1;
    pendingGuidedStepRef.current = null;
    if (guidedMenuTimeoutRef.current) {
      clearTimeout(guidedMenuTimeoutRef.current);
      guidedMenuTimeoutRef.current = null;
    }
  };

  // Read AFTER a ticket load's last request, before anything is
  // shown or saved for `expected` (the account the load is for). null: the
  // account changed meanwhile -- signed out / switched (new generation), or
  // the profile names another account (it signed in and no auth check has
  // acted on that yet, e.g. its check's request failed). The load then shows
  // and saves nothing; the next auth check switches and loads again.
  // Otherwise the profile's email (undefined if that request failed).
  const confirmedOwnerEmail = async (expected: string | null, generation: number) => {
    if (generation !== accountGenerationRef.current) return null;
    let email: string | undefined;
    try {
      email = (await getProfile())?.email || undefined;
    } catch (error) {
      console.error('Failed to get profile to confirm the account:', error);
    }
    if (generation !== accountGenerationRef.current) return null;
    if (expected && email && email !== expected) return null;
    return email;
  };

  // `generation`: the account this load is for (default: the current one).
  // A load whose account is no longer signed in writes nothing.
  const loadTickets = async (authedEmail?: string, generation = accountGenerationRef.current) => {
    const isAuth = isUserAuthenticated();
    console.log('[loadTickets] Starting - is authenticated:', isAuth);
    // The account this load is for: the given email, else the one the auth
    // check last confirmed.
    let expectedEmail = authedEmail ?? userEmailRef.current;
    if (isAuth && !expectedEmail) {
      try {
        expectedEmail = (await getProfile())?.email || null;
      } catch (error) {
        // Whose tickets these would be is unknown: show none (as History).
        console.error('[loadTickets] Failed to get profile email:', error);
        if (generation === accountGenerationRef.current) setTickets([]);
        return;
      }
      if (generation !== accountGenerationRef.current) return;
    }

    // Try to load from backend for authenticated users
    if (isAuth) {
      try {
        const data = await getSupportTickets();
        if (generation !== accountGenerationRef.current) return;
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
          attachments: ticket.attachments,
        }));

        // If backend returns tickets, use them and save to localStorage
        if (backendTickets.length > 0) {
          // Shown only for a confirmed account: otherwise show none (as
          // History and the fallback below).
          const owner = await confirmedOwnerEmail(expectedEmail, generation);
          if (!owner) {
            if (generation === accountGenerationRef.current) setTickets([]);
            return;
          }
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

    // Signed out / switched account while the backend call failed: the
    // fallback below would show this (previous) account's saved tickets.
    if (generation !== accountGenerationRef.current) return;

    // Try to load saved tickets from localStorage (for both auth and guest users)
    try {
      // IMPORTANT: For authenticated users, get real email from profile, NOT fake localStorage email
      // Read the profile even when the caller passed the email: the ticket
      // request above may have run after another account signed in.
      let ownerEmail: string | undefined;
      if (isAuth) {
        const confirmed = await confirmedOwnerEmail(expectedEmail, generation);
        if (confirmed === null) {
          if (generation === accountGenerationRef.current) setTickets([]);
          return;
        }
        ownerEmail = confirmed;
      }
      const savedTickets = localStorage.getItem('saved_tickets');
      const guestEmail = localStorage.getItem('guest_ticket_email');

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

    // A guided step still waiting on its delay would otherwise land between
    // this question and its answer. The post-answer follow-up prompt is
    // dropped (this send replaces it); a navigation step the user already
    // chose (its menu is collapsed) runs now, ahead of this question.
    if (guidedMenuTimeoutRef.current) {
      clearTimeout(guidedMenuTimeoutRef.current);
      guidedMenuTimeoutRef.current = null;
      const pending = pendingGuidedStepRef.current;
      pendingGuidedStepRef.current = null;
      if (pending?.kind === 'navigation') pending.run();
    }

    // Mark that we're processing a request
    isProcessingRef.current = true;
    // A sign-out / account switch while this is in flight: drop the result
    // instead of showing it (or installing its session) for the next user.
    const generation = accountGenerationRef.current;
    const accountChanged = () => generation !== accountGenerationRef.current;

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
          text: authMessage,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, loginPromptMessage]);

        if (settings.enableVoiceOutput) {
          playVoiceResponse(authMessage);
        }
      } else {
        // Lazily create the backend session on the first real message of an
        // authenticated conversation -- not on widget-open (see
        // initializeChat). Local variables, not the isBackendSession/
        // sessionId state, so this call uses the freshly-created id
        // immediately regardless of React's state-flush timing; the
        // isProcessingRef guard at the top of this function already
        // prevents a second call from racing this one and double-creating.
        let activeSessionId = sessionId;
        // A backend session belongs to the account that created it: a
        // sign-out the 30 s auth check hasn't noticed yet must not send this
        // guest message into it.
        let activeIsBackendSession = isBackendSession && isAuthenticated;
        if (isBackendSession && !isAuthenticated) {
          activeSessionId = `chat-session-${Date.now()}`;
          setSessionId(activeSessionId);
          setIsBackendSession(false);
        }
        // A session THIS call created (as opposed to one already open from
        // an earlier message or a restored conversation) has no messages in
        // it yet. If posting the first message into it then fails, the
        // session is left behind as an empty "New Chat" / 0-messages row in
        // History forever -- closing it here instead (see
        // cleanupOrphanedSession below) means only a session with at least
        // one real message ever shows up there.
        let justCreatedSessionId: string | null = null;
        const startBackendSession = async () => {
          const created = await createChatSession();
          if (accountChanged()) return;
          activeSessionId = created.session_id;
          activeIsBackendSession = true;
          justCreatedSessionId = created.session_id;
          setSessionId(activeSessionId);
          setIsBackendSession(true);
        };
        if (isAuthenticated && !activeIsBackendSession) {
          try {
            await startBackendSession();
          } catch (error) {
            console.error('Failed to create backend chat session, falling back to stateless chat:', error);
          }
        }
        if (accountChanged()) return;
        const askSession = (id: string) =>
          sendSessionMessage(id, messageText).then((r) => ({
            answer: r.content,
            confidence: r.confidence,
            category: r.category,
            sources: [] as string[],
          }));
        const cleanupOrphanedSession = async (id: string) => {
          if (justCreatedSessionId !== id) return;
          try {
            await deleteChatSession(id);
          } catch (cleanupError) {
            console.error('Failed to clean up an empty chat session after a failed first message:', cleanupError);
          }
        };

        // Always answer from the backend's real knowledge base -- never the
        // hardcoded frontend question/answer map, which duplicates backend
        // content and silently drifts out of sync with it (e.g. help text
        // changing on the backend without this file being updated to match).
        // Persisted sessions go through the new session-message endpoint
        // (loads context, calls the same chatbot/KB service, saves both
        // sides); everything else (guests, or a failed session create)
        // keeps using the original stateless endpoint unchanged. Both
        // responses are normalized to the same {answer, confidence,
        // sources} shape so the rest of this branch doesn't need to know
        // which one answered.
        let data;
        if (activeIsBackendSession && activeSessionId) {
          try {
            data = await askSession(activeSessionId);
          } catch (error) {
            // 409: the session was closed ("Remove from history");
            // 403/404: it belongs to another account (a switch not yet
            // noticed) or is gone. Continue in a new session of this account.
            const status = getHttpStatus(error);
            if (status !== 409 && status !== 403 && status !== 404) {
              await cleanupOrphanedSession(activeSessionId);
              throw error;
            }
            let replaced = false;
            try {
              await startBackendSession();
              replaced = true;
            } catch (createError) {
              if (accountChanged()) return;
              // Same fallback as the first create: stateless chat, and drop
              // the dead session so the next message doesn't hit it again.
              console.error('Failed to create a new backend session, falling back to stateless chat:', createError);
              activeSessionId = `chat-session-${Date.now()}`;
              setSessionId(activeSessionId);
              setIsBackendSession(false);
            }
            if (accountChanged()) return;
            try {
              data = replaced
                ? await askSession(activeSessionId)
                : await sendChatMessage(messageText, activeSessionId);
            } catch (sendError) {
              if (replaced) await cleanupOrphanedSession(activeSessionId);
              throw sendError;
            }
            if (accountChanged()) return;
            setMessages((prev) => [...prev, {
              id: `${activeSessionId}-continued`,
              type: 'system',
              text: 'That conversation is no longer available, so your message continued in a new conversation.',
              timestamp: new Date(),
            }]);
          }
        } else {
          data = await sendChatMessage(messageText, activeSessionId ?? undefined);
        }
        if (accountChanged()) return;
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
          relatedQuestions: hasConfidentAnswer ? getRelatedQuestions(data.category, messageText, previousQuestions, isLocallyAuthenticated) : [],
          actionLink: hasConfidentAnswer ? getActionLink(data.category, isLocallyAuthenticated) ?? undefined : undefined,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (settings.enableVoiceOutput) {
          playVoiceResponse(assistantMessage.text);
        }
      }
    } catch (error) {
      if (accountChanged()) return;
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

  // A KB answer's relatedQuestions are their own interactive option group
  // (same lifecycle as a guided-flow menu): marking the owning message
  // answered here, synchronously before handleSendMessage's own
  // isProcessingRef guard would even run, is what makes the render layer
  // hide the rest of that group immediately -- and rejects a second click
  // on the same group (rapid double-click, or clicking a different
  // sibling after the first already answered).
  const handleRelatedQuestionSelect = (messageId: string, question: string) => {
    if (answeredOptionGroupIds.has(messageId) || isProcessingRef.current) {
      return;
    }
    setAnsweredOptionGroupIds((prev) => new Set(prev).add(messageId));
    handleSendMessage(question);
  };

  const appendGuidedMessage = (text: string, menuOptions?: GuidedMenuOption[]) => {
    const message: Message = {
      id: `guided-bot-${Date.now()}-${guidedMessageSeqRef.current++}`,
      type: 'assistant',
      text,
      timestamp: new Date(),
      menuOptions,
    };
    setMessages((prev) => [...prev, message]);
  };

  // Schedules the next guided-flow bot message after a short, natural-feeling
  // delay instead of popping it in instantly. Clears any already-pending
  // timer first (defensive -- handleGuidedMenuSelect's own busy guard should
  // already prevent two ever being in flight at once) so a message can never
  // be appended twice from an overlapping schedule.
  const scheduleGuidedMessage = (run: () => void, delayMs: number = 1200, kind: GuidedStepKind = 'navigation') => {
    if (guidedMenuTimeoutRef.current) {
      clearTimeout(guidedMenuTimeoutRef.current);
    }
    pendingGuidedStepRef.current = { run, kind };
    guidedMenuTimeoutRef.current = setTimeout(() => {
      guidedMenuTimeoutRef.current = null;
      pendingGuidedStepRef.current = null;
      run();
    }, delayMs);
  };

  // Resolves one click on a guided-flow menu option. 'question' is the only
  // leaf action that reaches the backend -- it goes through the exact same
  // handleSendMessage() every typed message already uses, unchanged, so KB
  // answers, confidence gating, sources, and related questions all work
  // identically to a typed question. Every other action is pure navigation:
  // echoes the user's choice as its own message, then reveals the next
  // step's message (and that step's options) after a short delay.
  // fromLauncher: a launcher-popup pick (see the pendingLauncherSelection
  // effect) is a fresh choice, not a re-click -- it may arrive after the
  // welcome menu was already answered (picked, minimized, picked again).
  const handleGuidedMenuSelect = async (
    messageId: string,
    option: GuidedMenuOption,
    { fromLauncher = false }: { fromLauncher?: boolean } = {},
  ) => {
    // Blocks: (1) re-clicking a menu that already produced its next step,
    // (2) clicking while a KB call from a typed/leaf question is already in
    // flight, (3) clicking while an earlier guided click's delayed message
    // hasn't landed yet -- all three would otherwise risk duplicate or
    // out-of-order messages.
    if ((!fromLauncher && answeredOptionGroupIds.has(messageId)) || isProcessingRef.current || guidedMenuTimeoutRef.current) {
      return;
    }
    setAnsweredOptionGroupIds((prev) => new Set(prev).add(messageId));

    const { action, label } = option;

    if (action.kind === 'question') {
      const { topic } = action;
      const epoch = guidedConversationEpochRef.current;
      const generation = accountGenerationRef.current;
      await handleSendMessage(action.question);
      // New Chat / Close / account switch while the answer loaded: that
      // conversation is gone, so no follow-up for it.
      if (epoch !== guidedConversationEpochRef.current || generation !== accountGenerationRef.current) return;
      scheduleGuidedMessage(() => {
        appendGuidedMessage('Is there anything else I can help with?', buildFollowUpOptions(topic));
      }, 1200, 'follow-up');
      return;
    }

    // Every remaining action is navigation, not a real question -- echo the
    // user's choice as its own chat bubble (handleSendMessage does this
    // itself for 'question'; the rest need it done explicitly here).
    const userEcho: Message = {
      id: `guided-user-${Date.now()}-${guidedMessageSeqRef.current++}`,
      type: 'user',
      text: label,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userEcho]);

    switch (action.kind) {
      case 'topic': {
        const topic = action.topic;
        scheduleGuidedMessage(() => {
          appendGuidedMessage(GUIDED_TOPIC_PROMPTS[topic], buildTopicQuestionOptions(topic, isLocallyAuthenticated));
        });
        break;
      }
      case 'support-menu':
        scheduleGuidedMessage(() => {
          appendGuidedMessage('Sure — what do you need help with?', buildSupportMenuOptions());
        });
        break;
      case 'initial-menu':
        scheduleGuidedMessage(() => {
          appendGuidedMessage('No problem! What would you like to know?', buildInitialMenuOptions());
        });
        break;
      case 'continue-or-explore': {
        const topic = action.topic;
        scheduleGuidedMessage(() => {
          appendGuidedMessage(
            'Would you like to continue with this topic, or explore something different?',
            buildContinueOrExploreOptions(topic),
          );
        });
        break;
      }
      case 'continue-topic': {
        const topic = action.topic;
        // Reuses the exact same KB question data as the initial topic
        // list (buildTopicQuestionOptions), just filtered against what's
        // already been asked this conversation -- captured now, from the
        // current messages, not re-read inside the delayed callback below,
        // so a later message landing in between can't change this list
        // out from under the decision the user just made.
        const alreadyAsked = new Set(messages.filter((m) => m.type === 'user').map((m) => m.text));
        const remaining = buildTopicQuestionOptions(topic, isLocallyAuthenticated).filter(
          (opt) => opt.action.kind !== 'question' || !alreadyAsked.has(opt.action.question),
        );
        scheduleGuidedMessage(() => {
          if (remaining.length === 0) {
            appendGuidedMessage("You've already asked about everything in this topic! What would you like to know?", buildInitialMenuOptions());
          } else {
            appendGuidedMessage('Sure — here are the remaining questions on this topic:', remaining);
          }
        });
        break;
      }
      case 'contact-support':
        // Shorter delay -- just a beat after the echoed choice before the
        // redirect, rather than an instant, jarring navigation.
        scheduleGuidedMessage(() => {
          redirectToTicketPage();
        }, 600);
        break;
      case 'all-set':
        scheduleGuidedMessage(() => {
          appendGuidedMessage('Glad I could help! Feel free to start a new conversation anytime. 😊');
        });
        break;
    }
  };

  // A guest clicked one of the 3 options directly on the launcher's
  // proactive greeting popup, before the widget was even open. Opens the
  // widget (same as clicking the launcher bubble itself) and remembers the
  // choice; the effect watching pendingLauncherSelection carries it into
  // the guided flow once initializeChat has actually set up the welcome
  // message to click "through".
  const handleLauncherOptionSelect = (option: GuidedMenuOption) => {
    setPendingLauncherSelection(option);
    setIsMinimized(false);
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
    // Archive to localStorage only as a fallback: when isBackendSession is
    // true, every message in this conversation was already persisted to
    // MongoDB in real time (see handleSendMessage), so saving it again here
    // would just create a second, stale copy -- exactly the "two competing
    // sources of truth" this migration is meant to avoid. This path only
    // runs for authenticated users whose backend session creation failed
    // (or who are continuing a legacy local session), so a backend hiccup
    // still doesn't lose the conversation.
    if (messages.length > 1 && isUserAuthenticated() && !isBackendSession) {
      // Filter out the restored-session notice (UI-only marker)
      const filteredMessages = messages.filter((m) => m.text !== RESTORED_NOTICE_TEXT);

      // Guard: don't save if nothing was added since restore (e.g., opened an old session and immediately started new chat)
      const nothingNewSinceRestore = filteredMessages.length === 0;
      if (nothingNewSinceRestore) {
        setMessages([]);
        setInputValue('');
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
      // This conversation belongs to the account the auth check last
      // confirmed (`owner`; none yet: not saved): save it only under that
      // account, and show the saved History only while it is still on screen.
      const owner = userEmailRef.current;
      const generation = accountGenerationRef.current;
      getProfile()
        .then((profile) => {
          if (!owner || profile?.email !== owner) return;
          if (profile?.email) {
            saveSessionToStorage(newSession, profile.email);
            cachedEmailRef.current = profile.email;
          }
        })
        .catch((error) => {
          console.error('Failed to save chat session:', error);
          if (generation !== accountGenerationRef.current) return;
          if (!owner || cachedEmailRef.current !== owner) return;
          // Use cached email if getProfile fails (prevents silent loss)
          if (cachedEmailRef.current) {
            saveSessionToStorage(newSession, cachedEmailRef.current);
          }
        });
    }

    setMessages([]);
    setInputValue('');
    initializeChat();
  };

  // Every "raise a ticket" entry point in the widget (the guided flow's
  // Contact Support option, the "Raise a support ticket →" link under an
  // unhelpful answer, and the input-footer link) sends the user to the real
  // ticketing page instead of popping the in-widget modal open -- guests to
  // the dedicated guest portal, authenticated users to the dashboard's
  // Support Center, which carries its own full ticket list/history
  // alongside ticket creation. The original Q&A travels along so the
  // destination can prefill the ticket subject and send it to the backend,
  // same as the old modal did. Both routes get it via sessionStorage (see
  // stashTicketContext, ?ctx=) rather than the URL, which would land in
  // browser history and access logs and, at 2 x MAX_TICKET_QA_CHARS, can
  // exceed proxy URL limits; ?question=&answer= are only the fallback when
  // sessionStorage fails. (The in-widget modal below, openTicketModal/
  // submitTicket, is left in place but no longer opened.)
  const redirectToTicketPage = (context?: { originalQuestion?: string; chatbotAnswer?: string }) => {
    const { originalQuestion, chatbotAnswer } = context || {};
    // Capped here, at the source, same limit the backend enforces on
    // original_question/chatbot_answer -- an uncapped KB answer could run
    // to several thousand characters and the receiving form must not have
    // to guess whether to trust what showed up in the URL.
    const question = (originalQuestion || '').slice(0, MAX_TICKET_QA_CHARS);
    const answer = (chatbotAnswer || '').slice(0, MAX_TICKET_QA_CHARS);

    // The widget stays mounted globally, but both destination pages are
    // full-screen and chatbot-excluded -- minimizing first avoids a flash
    // of the open panel before the navigation actually lands.
    setIsMinimized(true);

    const params = new URLSearchParams();
    const signedIn = isUserAuthenticated();
    if (signedIn) {
      params.set('tab', 'tickets');
      params.set('raise', '1');
    }
    // Out of the URL when sessionStorage works (see stashTicketContext).
    const contextId = question || answer ? stashTicketContext(question, answer) : null;
    if (contextId) params.set(TICKET_CONTEXT_PARAM, contextId);
    else {
      if (question) params.set('question', question);
      if (answer) params.set('answer', answer);
    }
    const query = params.toString();
    const destination = signedIn ? '/dashboard/support-history' : '/support/tickets/new';
    router.push(`${destination}${query ? `?${query}` : ''}`);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- legacy modal, kept (see redirectToTicketPage)
  const openTicketModal = async (context?: { originalQuestion?: string; chatbotAnswer?: string }) => {
    const { originalQuestion, chatbotAnswer } = context || {};
    // Subject is a concise issue title describing what the customer asked
    // about, never the chatbot's (potentially long) solution text -- so it
    // comes from originalQuestion, not chatbotAnswer. With no prior
    // question (e.g. the generic "Raise a support ticket" link), the user
    // types their own subject; the field just starts blank.
    setTicketSubject(originalQuestion ? firstSentence(originalQuestion).slice(0, MAX_TICKET_SUBJECT_CHARS) : '');
    setTicketDescription('');
    setTicketOriginalQuestion(originalQuestion || '');
    setTicketChatbotAnswer(chatbotAnswer || '');
    setTicketFeature(null);
    setTicketIssueType('');
    setTicketStepsToReproduce('');
    setTicketAttachments([]);
    setAttachmentNotice('');
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
      const generation = accountGenerationRef.current;
      let userProfile: Awaited<ReturnType<typeof getProfile>> | null = null;
      try {
        userProfile = await getProfile();
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Continue anyway, fields will be empty
      }
      // Signed out / switched account meanwhile: never open the form with
      // the previous account's details (or the question it was raised from).
      if (generation !== accountGenerationRef.current) return;
      if (userProfile) {
        setTicketName(userProfile.full_name || '');
        setTicketEmail(userProfile.email || '');
      }
    }

    setShowTicketModal(true);
  };

  // The nearest prior user message before an assistant reply at `index` --
  // i.e. the exact question that reply answered. Used so "Raise a support
  // ticket" under an unhelpful reply can send the customer's real question,
  // not the chatbot's answer, as the ticket's original_question.
  const findPrecedingUserQuestion = (index: number): string | undefined => {
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].type === 'user') {
        return messages[i].text;
      }
    }
    return undefined;
  };

  const handleAttachmentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const picked = Array.from(files);
      const tooLarge = picked.filter((f) => f.size > MAX_TICKET_ATTACHMENT_BYTES);
      const fitting = picked.filter((f) => f.size <= MAX_TICKET_ATTACHMENT_BYTES);
      const room = Math.max(0, MAX_TICKET_ATTACHMENTS - ticketAttachments.length);
      const overCount = fitting.slice(room);
      const notes: string[] = [];
      if (tooLarge.length > 0) {
        notes.push(`Not attached (larger than 5 MB): ${tooLarge.map((f) => f.name).join(', ')}.`);
      }
      if (overCount.length > 0) {
        notes.push(`You can attach up to ${MAX_TICKET_ATTACHMENTS} files. Not attached: ${overCount.map((f) => f.name).join(', ')}.`);
      }
      setAttachmentNotice(notes.join(' '));
      setTicketAttachments((prev) => [...prev, ...fitting.slice(0, room)]);
      // Lets the user pick the same file again after removing it.
      event.target.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setTicketAttachments((prev) => prev.filter((_, i) => i !== index));
    setAttachmentNotice('');
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
    }

    setIsSubmittingTicket(true);

    try {
      // Upload attachments BEFORE creating the ticket, but never let an
      // upload failure block the ticket itself -- a screenshot is always
      // optional (Promise.allSettled, not Promise.all). Each successful
      // upload is a standalone record on the backend (not yet linked to
      // any ticket), so it's immediately included in the ticket-create
      // call below rather than needing a second round-trip to attach it.
      const generation = accountGenerationRef.current;
      let uploadedAttachments: TicketAttachmentSummary[] = [];
      let failedAttachmentNames: string[] = [];
      if (ticketAttachments.length > 0) {
        const results = await Promise.allSettled(
          ticketAttachments.map((file) => uploadTicketAttachment(file))
        );
        uploadedAttachments = results
          .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof uploadTicketAttachment>>> => r.status === 'fulfilled')
          .map((r) => ({ attachment_id: r.value.attachment_id, filename: r.value.filename }));
        // A failed upload must never silently vanish -- the ticket still
        // goes out without it (resilience), but the success modal below
        // tells the submitter which file(s) didn't make it, not just the
        // console.
        failedAttachmentNames = results
          .map((r, i) => (r.status === 'rejected' ? ticketAttachments[i].name : null))
          .filter((name): name is string => name !== null);
        if (failedAttachmentNames.length > 0) {
          console.error(`${failedAttachmentNames.length} of ${ticketAttachments.length} attachment(s) failed to upload; continuing without them`);
        }
      }
      // Signed out / switched account during the uploads: never create the
      // ticket under the new account with the previous one's details.
      if (generation !== accountGenerationRef.current) {
        alert('Your account changed while this ticket was being sent, so it was not created. Please check the form and submit again.');
        return;
      }
      const attachmentIds = uploadedAttachments.map((a) => a.attachment_id);

      const escalationData = await escalateToSupport({
        // featureToSubmit is only null when unauthenticated (where it's
        // hardcoded to 'login-issues' above) or when the guard above this
        // try block already returned for a missing authenticated selection.
        issue_category: featureToSubmit || 'login-issues',
        issue_title: ticketSubject,
        issue_description: ticketDescription,
        session_id: sessionId,
        contact_email: ticketEmail || undefined,
        attachment_ids: attachmentIds.length > 0 ? attachmentIds : undefined,
        issue_details: {
          feature: featureToSubmit,
          // Issue Type is an authenticated-only field -- there's no UI for
          // a guest to set it, so never send it (not even empty) for them.
          issue_type: isUserAuthenticated() ? ticketIssueType : undefined,
          steps_to_reproduce: ticketStepsToReproduce,
          priority: ticketPriority,
          requester_name: ticketName || undefined,
          requester_email: ticketEmail || undefined,
          user_type: ticketUserType || undefined,
          verification_token: verificationToken || undefined,
          original_question: ticketOriginalQuestion.slice(0, MAX_TICKET_QA_CHARS) || undefined,
          chatbot_answer: ticketChatbotAnswer.slice(0, MAX_TICKET_QA_CHARS) || undefined,
          ...(featureToSubmit === 'payment-billing' && {
            transaction_id: ticketTransactionId,
            invoice_number: ticketInvoiceNumber,
            payment_date: ticketPaymentDate,
          }),
        },
      });

      // Guest tickets get a view_url back per attachment (a single-use,
      // login-free link -- see EscalationResponse.attachments);
      // authenticated tickets get an empty array since they already have a
      // working owner-authorized URL via getTicketAttachmentUrl. Merge by
      // attachment_id rather than replacing the list outright, so a
      // response with no attachments (e.g. an older backend) still shows
      // whatever this client just uploaded.
      // The ticket was created for the previous account; don't show it (or
      // add it to the list) under the account that is signed in now. It
      // does exist, though: say so and close the form, so it isn't sent twice.
      if (generation !== accountGenerationRef.current) {
        setShowTicketModal(false);
        alert(`Ticket ${escalationData.ticket_id} was created for the account that was signed in before.`);
        return;
      }

      const viewUrlByAttachmentId = new Map(
        (escalationData.attachments || []).map((a) => [a.attachment_id, a.view_url])
      );
      const attachmentsWithViewUrls = uploadedAttachments.map((a) => ({
        ...a,
        view_url: viewUrlByAttachmentId.get(a.attachment_id),
      }));

      // description/affected_feature/updated_at are already available right
      // here in local state/response -- the create endpoint itself only
      // returns {ticket_id, status, created_at} (see EscalationResponse),
      // so without this the ticket details modal would silently render
      // this ticket as missing Description/Category/Last Updated the
      // moment it's created, only "fixing itself" once the user later
      // reloads the ticket list from the backend.
      const createdAt = new Date().toISOString();
      const ticket: TicketInfo = {
        id: escalationData.ticket_id,
        subject: ticketSubject,
        status: escalationData.status,
        priority: ticketPriority,
        created_at: createdAt,
        updated_at: createdAt,
        contact_email: ticketEmail, // Include email for guest ticket filtering
        description: ticketDescription,
        affected_feature: featureToSubmit || 'login-issues',
        attachments: attachmentsWithViewUrls.length > 0 ? attachmentsWithViewUrls : undefined,
      };

      setTicketId(escalationData.ticket_id);
      setSuccessTicketAttachments(attachmentsWithViewUrls);
      setFailedTicketAttachmentNames(failedAttachmentNames);
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

  // Only the owner may cancel (the backend checks user_id): a ticket in this
  // account's own list, or one whose email is this account's. Staff opening
  // a customer's ticket from the ?ticket= link, and guests, get no button.
  const isOwnTicket = (ticket: TicketInfo): boolean =>
    isLocallyAuthenticated &&
    (tickets.some((t) => t.id === ticket.id) ||
      (!!userEmailRef.current && ticket.contact_email?.toLowerCase() === userEmailRef.current.toLowerCase()));

  const handleCancelTicket = async (ticketId: string) => {
    if (!window.confirm('Cancel this ticket? This cannot be undone.')) {
      return;
    }

    setIsCancellingTicket(true);
    try {
      const updated = await cancelTicket(ticketId);

      // Reflect the new status everywhere this ticket is shown: the open
      // detail modal, the list/card view, and the localStorage cache
      // submitTicket() and loadTickets() both read/write.
      setSelectedTicket((prev) => (prev && prev.id === ticketId ? { ...prev, status: updated.status } : prev));
      setTickets((prev) => {
        const next = prev.map((t) => (t.id === ticketId ? { ...t, status: updated.status } : t));
        localStorage.setItem('saved_tickets', JSON.stringify(next));
        return next;
      });
    } catch (error: unknown) {
      alert(describeError(error, 'Failed to cancel ticket. Please try again.'));
    } finally {
      setIsCancellingTicket(false);
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
        {/* Authenticated users only get the bare launcher button (no
            auto-shown popup) — the chat must never pop open on its own
            after login, only on explicit click. Guests get a proactive
            greeting popup with the same 3 options the chat itself opens
            with, so picking one here jumps straight into that path
            (handleLauncherOptionSelect) instead of requiring an extra
            "open chat, then pick an option" step. */}
        {!isLocallyAuthenticated && !guestGreetingDismissed && (
          <div className="greeting-popup-card">
            <button
              className="greeting-popup-close"
              onClick={() => setGuestGreetingDismissed(true)}
              aria-label="Dismiss"
              title="Dismiss"
            >
              ✕
            </button>
            <div className="greeting-popup-header">
              <span className="greeting-popup-icon">🤖</span>
              <span className="greeting-popup-title">{selectedApp} Support</span>
            </div>
            <div className="greeting-popup-scroll">
              <p className="greeting-popup-text">
                Welcome! Whether you&apos;re exploring our features or need specific help, we&apos;re here for you.
              </p>
              <p className="greeting-popup-question">How can I help you today?</p>
              <div className="greeting-popup-options">
                {buildInitialMenuOptions().map((option, idx) => (
                  <button
                    key={idx}
                    className="greeting-popup-option-btn"
                    onClick={() => handleLauncherOptionSelect(option)}
                    title={option.label}
                  >
                    <span className="option-label">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="launcher-container launcher-single">
          <button
            className="floating-chat-button"
            onClick={() => setIsMinimized(false)}
            title="Chatbot Support"
            aria-label="Chatbot Support"
          >
            <MessageIcon className={!isLocallyAuthenticated ? 'message-icon-rotate' : undefined} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chatbot-root">
      <div className="widget-panel">
      <div className="ambient-blob blob-a" />
      <div className="ambient-blob blob-b" />

      {/* Main Chat Area */}
      <main className="chat-main">
        {/* Header */}
        <header className="chat-header">
          <div className="header-content">
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

            <button className="close-btn-header" onClick={() => { startNewChat(); setIsMinimized(true); }} title="Close (saves conversation and returns to launcher)">
              ×
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="messages-container" ref={messagesContainerRef}>
          {messages.map((message, messageIndex) => {
            const isLastMessage = messageIndex === messages.length - 1;

            if (message.type === 'system' && message.ticket) {
              const meta = STATUS_META[message.ticket.status] || STATUS_META.open;
              return (
                <div key={message.id} className="ticket-confirmation" ref={isLastMessage ? lastMessageRef : undefined}>
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
              <div key={message.id} className={`message ${message.type}`} ref={isLastMessage ? lastMessageRef : undefined}>
                <div className="message-avatar">
                  {message.type === 'user' ? (
                    <span className="avatar-circle user-avatar">👤</span>
                  ) : (
                    <span className="avatar-circle bot-avatar">🤖</span>
                  )}
                </div>
                <div className="message-content">
                  {(() => {
                    // Always show the complete message -- both user and
                    // assistant. Chatbot answers (KB-sourced or account data)
                    // are already concise by design; collapsing them to just
                    // their first sentence hid real content (e.g. the actual
                    // steps in a "how do I cancel my subscription" answer)
                    // behind a button most users never clicked.
                    if (message.type !== 'assistant') {
                      return <div className="message-text">{message.text}</div>;
                    }

                    // renderMarkdownText handles **bold** and inline
                    // [text](url) markdown embedded directly in the
                    // backend's answer text (e.g. getAuthRequiredMessage's
                    // "[click here](action:login)"). message.actionLink is
                    // separate, structured data attached to the message
                    // object by getActionLink -- not markdown in the text
                    // itself -- so it's still appended independently below.
                    return (
                      <div className="message-text">
                        {renderMarkdownText(message.text)}
                        {message.actionLink && (
                          <>
                            {' '}
                            {message.actionLink.sentence}
                            {/* Plain <a>, not next/link's <Link> -- Link does
                                client-side "soft" navigation, which silently
                                fails to open the sign-in modal for
                                requiresLogin links when the widget is already
                                open on "/" itself (page.tsx's modal-opening
                                effect is mount-only, it doesn't re-run on a
                                query-string-only soft navigation). A plain
                                <a> forces a full navigation every time, so
                                the modal reliably opens regardless of which
                                page the widget was open on. */}
                            <a href={message.actionLink.href} className="inline-action-link">
                              {message.actionLink.linkText}
                            </a>
                            .
                          </>
                        )}
                      </div>
                    );
                  })()}
                  {message.sources && message.sources.length > 0 && (
                    <div className="message-sources">
                      <small>Sources: {message.sources.join(', ')}</small>
                    </div>
                  )}
                  {/* Every interactive option group (relatedQuestions here,
                      menuOptions below) collapses entirely -- not just
                      disables -- the instant its owning message is marked
                      answered, at every conversation level (initial
                      welcome, topic, subtopic, leaf KB question, related
                      questions, follow-up). The message keeps its data
                      either way (only rendering is gated), so a fresh
                      instance of the same group reappearing later --
                      "I have more questions", revisiting a topic -- is its
                      own new message, unaffected by this one collapsing. */}
                  {message.relatedQuestions && message.relatedQuestions.length > 0 && !answeredOptionGroupIds.has(message.id) && (
                    <div className="related-questions">
                      <div className="related-questions-label">Related questions:</div>
                      <div className="related-questions-list">
                        {message.relatedQuestions.map((question, idx) => (
                          <button
                            key={idx}
                            className="related-question-btn"
                            onClick={() => handleRelatedQuestionSelect(message.id, question)}
                            disabled={isLoading}
                            // The visible label is CSS-truncated to one line
                            // (text-overflow: ellipsis) -- title surfaces the
                            // full question on hover so nothing is lost; a
                            // screen reader already gets the full text from
                            // the button's own content regardless of the
                            // visual clipping.
                            title={isLoading ? 'Please wait for the previous response' : question}
                            style={{ opacity: isLoading ? 0.5 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
                          >
                            <span className="option-label">{question}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {message.menuOptions && message.menuOptions.length > 0 && !answeredOptionGroupIds.has(message.id) && (
                    <div className="guided-menu-options">
                      {message.menuOptions.map((option, idx) => (
                        <button
                          key={idx}
                          className="guided-menu-btn"
                          onClick={() => handleGuidedMenuSelect(message.id, option)}
                          disabled={isLoading}
                          // Same reasoning as related-question-btn's title
                          // above -- full text available on hover once the
                          // label is CSS-truncated to a single line.
                          title={option.label}
                        >
                          <span className="option-label">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {message.type === 'assistant' && message.id !== 'welcome' && message.id !== 'error' && !message.menuOptions && (
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
                            <button
                              className="link-btn"
                              onClick={() => redirectToTicketPage({
                                originalQuestion: findPrecedingUserQuestion(messageIndex),
                                chatbotAnswer: message.text,
                              })}
                            >
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

          {/* Bottom Navigation Tabs -- New Chat starts a fresh conversation
              in place; History leaves the widget entirely for the
              dashboard's Support & History page, which now owns both
              conversation history and ticket management (see that page's
              own file for the listing/raise-ticket UI this replaced here). */}
          <div className="bottom-nav">
            <button
              className="nav-tab"
              onClick={startNewChat}
              title="New Chat"
            >
              <svg className="nav-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>New Chat</span>
            </button>
            {isLocallyAuthenticated && isUserAuthenticated() && (
              <button
                className="nav-tab"
                onClick={() => {
                  // Support & History is a full page, not a widget view --
                  // collapse the floating panel first so it doesn't sit on
                  // top of that page obstructing it.
                  setIsMinimized(true);
                  router.push('/dashboard/support-history');
                }}
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
            Can&apos;t find an answer? <button className="link-btn" onClick={() => redirectToTicketPage()}>Raise a support ticket</button>
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
                    maxLength={MAX_TICKET_SUBJECT_CHARS}
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
                    maxLength={MAX_TICKET_SUBJECT_CHARS}
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
              {attachmentNotice && (
                <p role="alert" style={{ fontSize: '12px', color: '#b45309', marginTop: '6px' }}>{attachmentNotice}</p>
              )}
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
                  (!isUserAuthenticated() && (!ticketName.trim() || !ticketEmail.trim() || !ticketUserType.trim() || !isOtpVerified)) ||
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

            {successTicketAttachments.length > 0 && (
              <div className="ticket-attachments-box">
                <label>Attachment{successTicketAttachments.length > 1 ? 's' : ''}:</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {successTicketAttachments.map((att) => (
                    <TicketAttachmentLink key={att.attachment_id} ticketId={ticketId} attachment={att} />
                  ))}
                </div>
              </div>
            )}

            {failedTicketAttachmentNames.length > 0 && (
              <div className="ticket-attachments-box" style={{ color: '#b45309' }}>
                <label>
                  {failedTicketAttachmentNames.length === 1 ? "Couldn't attach this file" : "Couldn't attach these files"}:
                </label>
                <p style={{ marginTop: '6px' }}>
                  {failedTicketAttachmentNames.join(', ')} -- the ticket was submitted without{' '}
                  {failedTicketAttachmentNames.length === 1 ? 'it' : 'them'}. Reply to the confirmation email to send{' '}
                  {failedTicketAttachmentNames.length === 1 ? 'it' : 'them'} another way.
                </p>
              </div>
            )}

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

                <label className="field-label">Ticket ID</label>
                <p style={{ marginBottom: '16px' }}>{selectedTicket.id || 'N/A'}</p>

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

                <label className="field-label">Priority</label>
                <p style={{ marginBottom: '16px' }}>{selectedTicket.priority === 2 ? '🔥 Urgent' : 'Normal'}</p>

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

                {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                  <>
                    <label className="field-label">Attachments</label>
                    <div style={{ marginBottom: '16px' }}>
                      {isLocallyAuthenticated ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {selectedTicket.attachments.map((att) => (
                            <TicketAttachmentLink key={att.attachment_id} ticketId={selectedTicket.id} attachment={att} />
                          ))}
                        </div>
                      ) : (
                        // Guests can never view ticket content by ID at all
                        // (same policy as get_ticket_details and the
                        // confirmation-email link) -- a link here would
                        // just 403, so show the filename without one
                        // rather than an attachment that looks clickable
                        // but isn't.
                        selectedTicket.attachments.map((att) => (
                          <div key={att.attachment_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span>📎 {att.filename}</span>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Sign in to view</span>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}

                {CANCELLABLE_TICKET_STATUSES.has(selectedTicket.status) && isOwnTicket(selectedTicket) && (
                  <button
                    className="link-btn"
                    disabled={isCancellingTicket}
                    onClick={() => handleCancelTicket(selectedTicket.id)}
                  >
                    {isCancellingTicket ? 'Cancelling…' : 'Cancel Ticket'}
                  </button>
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
// saveSessionToStorage's return value), NOT by the key.
export const CHAT_SESSIONS_STORAGE_KEY = 'saved_chat_sessions';
const MAX_STORED_SESSIONS = 50;
const MAX_MESSAGES_PER_SESSION = 500;
// Text of the "restored" system notice injected when a session is reopened
// via the ?session= deep link from the dashboard's Support & History page. It is a
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
  // must NOT be treated as data loss: the already-stored sessions are still
  // on disk. Report the failure and return the computed view.
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
