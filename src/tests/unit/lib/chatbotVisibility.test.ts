import { describe, it, expect } from 'vitest';
import { isChatbotAllowedOnPage } from '@/lib/chatbotVisibility';

/**
 * The chatbot widget must never render on exam/assessment/test/coding-test
 * pages — it can't just be CSS-hidden there, since that would still let it
 * intercept clicks or overlap timers/submit controls. isChatbotAllowedOnPage
 * is the single source of truth ClientLayout uses to decide whether to
 * mount <ChatbotWidget /> at all, so its rules need to stay correct.
 */
describe('isChatbotAllowedOnPage', () => {
  it('hides the chatbot on the live mock-test attempt page', () => {
    expect(isChatbotAllowedOnPage('/mock-test/abc123')).toBe(false);
  });

  it('shows the chatbot on mock-test browsing/results pages', () => {
    expect(isChatbotAllowedOnPage('/mock-test/results/1')).toBe(true);
    expect(isChatbotAllowedOnPage('/mock-test/browse')).toBe(true);
    expect(isChatbotAllowedOnPage('/mock-test/company/1')).toBe(true);
    expect(isChatbotAllowedOnPage('/mock-test')).toBe(true);
  });

  it('hides the chatbot on the live coding-test challenge page', () => {
    expect(isChatbotAllowedOnPage('/coding-test/two-sum')).toBe(false);
  });

  it('shows the chatbot on coding-test browsing pages', () => {
    expect(isChatbotAllowedOnPage('/coding-test/playground')).toBe(true);
    expect(isChatbotAllowedOnPage('/coding-test/problems')).toBe(true);
    expect(isChatbotAllowedOnPage('/coding-test/history')).toBe(true);
    expect(isChatbotAllowedOnPage('/coding-test')).toBe(true);
  });

  it('hides the chatbot during a live AI mock interview session', () => {
    expect(isChatbotAllowedOnPage('/mock-interview/live/xyz')).toBe(false);
    expect(isChatbotAllowedOnPage('/mock-interview/live/starting')).toBe(false);
  });

  it('shows the chatbot on mock-interview pages that are not a live session', () => {
    expect(isChatbotAllowedOnPage('/mock-interview')).toBe(true);
    expect(isChatbotAllowedOnPage('/mock-interview/history')).toBe(true);
  });

  it('shows the chatbot on communication results pages, hides it on live exercises', () => {
    expect(isChatbotAllowedOnPage('/communication/feedback')).toBe(true);
    expect(isChatbotAllowedOnPage('/communication/report')).toBe(true);
    expect(isChatbotAllowedOnPage('/communication/see-and-repeat')).toBe(false);
    expect(isChatbotAllowedOnPage('/communication')).toBe(true);
  });

  it('hides the chatbot on its own full-page route and admin/recruiter tooling', () => {
    expect(isChatbotAllowedOnPage('/chatbot')).toBe(false);
    expect(isChatbotAllowedOnPage('/admin/dashboard')).toBe(false);
    expect(isChatbotAllowedOnPage('/recruiter/candidates')).toBe(false);
  });

  it('defaults to allowed for ordinary pages and a missing pathname', () => {
    expect(isChatbotAllowedOnPage('/dashboard')).toBe(true);
    expect(isChatbotAllowedOnPage(null)).toBe(true);
    expect(isChatbotAllowedOnPage(undefined)).toBe(true);
  });
});
