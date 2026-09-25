/**
 * Unit tests for classifyQuery / canGuestAnswer in src/api/chatbotAuth.ts
 *
 * Regression for the #117 AI review P1: keywords were matched with
 * String.includes, so 'pro' matched "improve"/"professional"/"progression"
 * and guests were refused the bot's own suggested follow-up questions.
 */
import { describe, it, expect } from 'vitest';
import { classifyQuery, canGuestAnswer } from '@/api/chatbotAuth';

// Every follow-up question ChatApp's getRelatedQuestions() (relatedMap) offers.
// A guest who got an answer must be able to ask any of them.
const RELATED_QUESTIONS = [
  '✨ How do I make my resume stand out to recruiters?',
  '📄 What are the best resume templates and formats?',
  '🎯 How do I highlight achievements with numbers and impact?',
  '🤖 How does ATS screening work with my resume?',
  '🎤 What are common behavioral interview questions?',
  '💼 How do I prepare for technical/coding interviews?',
  '🎭 Can I practice mock interviews with you?',
  '💬 How do I answer difficult questions confidently?',
  '🎤 What interview questions should I practice?',
  '💼 How do I improve my interview performance?',
  '⏱️ How long is a typical mock interview session?',
  '📊 How is my interview performance scored?',
  '⭐ What skills are most in-demand in my field?',
  '📊 How do I assess my skill gaps accurately?',
  '📈 What courses should I take to improve skills?',
  '🧠 How do I prioritize which skills to learn?',
  '💼 What jobs match my skills and experience?',
  '🔍 How do I find entry-level or internship positions?',
  '📋 How do I customize my application for each job?',
  '🎯 What is my skill match score for this role?',
  '💼 What careers align with my background?',
  '📊 How accurate is job matching?',
  '🎯 What factors affect my job match score?',
  '🚀 What roles should I target next?',
  '🚀 What is a realistic career progression path for me?',
  '📊 How do I plan my 5-year career strategy?',
  '🎯 Should I transition to a different industry?',
  '💡 What are emerging roles in my field?',
  '🔍 Where can I find internships in my field?',
  '📋 How do I write a strong internship application?',
  '🤝 How do I network for internship opportunities?',
  '📚 What internships lead to full-time offers?',
  '🤝 How do I build a professional network?',
  '💼 How do I reach out to professionals in my field?',
  '📧 What is appropriate networking etiquette?',
  '🔗 How do I leverage LinkedIn for job search?',
  '📚 What certifications are valuable in my field?',
  '🧠 Where can I find quality online courses?',
  '🎓 How do I balance education with job searching?',
  '⏱️ How long do popular certifications take?',
];

describe('classifyQuery', () => {
  it.each(RELATED_QUESTIONS)('lets a guest ask the suggested follow-up %s', (question) => {
    const type = classifyQuery(question);
    expect(type).toBe('PUBLIC');
    expect(canGuestAnswer(type)).toBe(true);
  });

  it.each([
    ['I forgot my password', 'PUBLIC'],
    ['I did not get the OTP email', 'PUBLIC'],
    ['What does the Pro plan cost?', 'PUBLIC'],
    ['What are your pricing plans?', 'PUBLIC'],
    ['What is your refund policy?', 'PUBLIC'],
    ['What enterprise roles should I target next?', 'PUBLIC'],
    ['How do I get credit for an internship on my resume?', 'PUBLIC'],
    ['Show my invoices', 'ACCOUNT'],
    ['What is my subscription status?', 'ACCOUNT'],
    ['How many credits are left in my account?', 'ACCOUNT'],
    ['I want a refund for my payment', 'BILLING'],
    ['Where is my receipt?', 'BILLING'],
    ['Why is my plan still showing Free?', 'BILLING'],
    ['I want to raise ticket about a bug', 'SUPPORT_TICKET'],
    ['Please escalate this', 'SUPPORT_TICKET'],
  ] as const)('classifies %j as %s', (question, expected) => {
    expect(classifyQuery(question)).toBe(expected);
  });

  it('only gates personal-data queries for guests', () => {
    expect(canGuestAnswer(classifyQuery('Show my invoices'))).toBe(false);
    expect(canGuestAnswer(classifyQuery('I want a refund for my payment'))).toBe(false);
    expect(canGuestAnswer(classifyQuery('How do I improve my resume?'))).toBe(true);
  });
});
