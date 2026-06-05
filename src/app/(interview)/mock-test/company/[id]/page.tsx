'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AlertTriangle, Play, Lock, CheckCircle, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMockTestCompanyById, generateMockTest, getProgressAnalytics, ProgressAnalytics } from '@/api/mockTestApi';
import LoadingScreen from '../../_components/LoadingScreen';
import HighlightBox from '../../_components/HighlightBox';
import { resolveCompanyId, resolveCompanyInfo } from '@/lib/mockTestConstants';

interface CompanyTemplate {
  name: string;
  totalQ: number;
  totalMin: number;
  navigation: string;
  negativeMarking: boolean;
  negativeValue: string | null;
  passing: string;
  lastVerified: string;
  confidence: string;
  rules: string[];
  tips: string[];
}

interface MockSection {
  name: string;
  questions: number;
  duration: number;
  description: string;
  difficulty: 'EASY' | 'MED' | 'HARD';
}

// IMPORTANT: question_count and duration here must match what the test runner
// at /mock-test/[id] actually delivers per section — see currentSection in
// app/(interview)/mock-test/[id]/page.tsx (10 questions each, 20/25/25/20 min).
// Drift between these and the runner causes the "Total: 55Q / 105min" header
// to disagree with the "40Q / 90min" stats strip and the test timer.
const MOCK_SECTIONS: MockSection[] = [
  { name: 'Arithmetic', questions: 10, duration: 20, description: 'Percentages, P&L, Time-Work, SI/CI',            difficulty: 'MED'  },
  { name: 'Aptitude',   questions: 10, duration: 20, description: 'Data interpretation, permutations, probability', difficulty: 'MED'  },
  { name: 'Reasoning',  questions: 10, duration: 20, description: 'Logical sequences, blood relations, coding',     difficulty: 'HARD' },
  { name: 'Technical',  questions: 10, duration: 20, description: 'Python · Java · DSA · SQL · OOP',                difficulty: 'HARD' },
];

// Practice-test totals — the ONE source of truth for what the user actually
// takes. Everything user-facing (stats strip, section-table total, footer,
// pre-flight tip) must read these so no two surfaces can disagree.
const PRACTICE_TOTAL_Q   = MOCK_SECTIONS.reduce((sum, s) => sum + s.questions, 0); // 40
const PRACTICE_TOTAL_MIN = MOCK_SECTIONS.reduce((sum, s) => sum + s.duration,  0); // 90

const companyTemplates: Record<string, CompanyTemplate> = {
  '1': {
    name: 'TCS NQT', totalQ: 92, totalMin: 190, navigation: 'locked',
    negativeMarking: true, negativeValue: '-1/3', passing: '50%',
    lastVerified: 'March 2026', confidence: 'approximate',
    rules: ['Section-locked: finish each section before moving on', 'Once submitted, you cannot revisit a section', 'Negative marking (-1/3) applies to Quant, Reasoning, and Programming', 'Unanswered questions score 0'],
    tips: ['Sectional time limits apply — manage time carefully', 'Skip questions you are unsure about (negative marking)', 'Verbal and Coding sections have no negative marking'],
  },
  '2': {
    name: 'IBM Aptitude Test', totalQ: 50, totalMin: 60, navigation: 'locked',
    negativeMarking: false, negativeValue: null, passing: '60%',
    lastVerified: 'March 2026', confidence: 'approximate',
    rules: ['Section-locked navigation', 'No negative marking', 'Minimum 60% overall to qualify'],
    tips: ['1 minute per question on average', 'Logical Reasoning section is most time-consuming', "Verbal questions are straightforward — don't overthink"],
  },
  '3': {
    name: 'Infosys InfyTQ', totalQ: 55, totalMin: 125, navigation: 'locked',
    negativeMarking: false, negativeValue: null, passing: '65%',
    lastVerified: 'March 2026', confidence: 'approximate',
    rules: ['Section-locked: cannot revisit previous sections', 'No negative marking in any section', 'Minimum 65% overall required to pass'],
    tips: ['InfyTQ requires 65%+ overall — aim high', 'Programming section is separately evaluated', 'Puzzle Solving tests spatial and logical thinking'],
  },
  '4': { name: 'Cognizant GenC',     totalQ: 60,  totalMin: 120, navigation: 'locked', negativeMarking: false, negativeValue: null, passing: '50%', lastVerified: 'March 2026', confidence: 'approximate', rules: ['Section-locked navigation', 'No negative marking'], tips: ['Verbal section is scoring — maximize here', 'Coding quality determines placement tier'] },
  '5': { name: 'L&T',                totalQ: 50,  totalMin: 75,  navigation: 'locked', negativeMarking: false, negativeValue: null, passing: '50%', lastVerified: 'March 2026', confidence: 'approximate', rules: ['Section-locked navigation', 'No negative marking'], tips: ['Technical questions are domain-specific', 'Aptitude and Reasoning are standard'] },
  '6': { name: 'Wipro NLTH',         totalQ: 60,  totalMin: 75,  navigation: 'free',   negativeMarking: false, negativeValue: null, passing: '50%', lastVerified: 'March 2026', confidence: 'approximate', rules: ['Free navigation: jump between sections anytime', 'No negative marking'], tips: ['Use free navigation to your advantage', 'No negative marking — attempt all questions'] },
};

function transformCompanyData(data: any): any {
  if (!data) return null;
  if (data.rules && data.tips) return data;
  return {
    name: data.name || data.company_name || 'Unknown',
    totalQ: data.total_questions || 50,
    totalMin: data.total_duration_minutes || 60,
    navigation: data.config?.navigation || 'locked',
    negativeMarking: data.config?.negative_marking ?? false,
    negativeValue: data.config?.negative_value || null,
    passing: data.config?.passing_score ? `${data.config.passing_score}%` : '50%',
    lastVerified: data.last_verified || 'March 2026',
    confidence: 'high',
    rules: data.rules || ['Section-locked navigation', `${data.config?.negative_marking ? 'Negative marking applies' : 'No negative marking'}`],
    tips: data.tips || [`${PRACTICE_TOTAL_Q} questions in ${PRACTICE_TOTAL_MIN} minutes`, 'Practice thoroughly before the test'],
  };
}

const DIFF_COLOR: Record<string, { bg: string; color: string }> = {
  EASY: { bg: '#d1fae5', color: '#065f46' },
  MED:  { bg: '#fef3c7', color: '#92400e' },
  HARD: { bg: '#fee2e2', color: '#991b1b' },
};

function getGrade(score: number): { label: string; bg: string; color: string } {
  if (score >= 80) return { label: 'GRADE A', bg: '#d1fae5', color: '#065f46' };
  if (score >= 70) return { label: 'GRADE B', bg: '#dbeafe', color: '#1e3a8a' };
  if (score >= 60) return { label: 'GRADE C', bg: '#fef3c7', color: '#92400e' };
  if (score >= 50) return { label: 'GRADE D', bg: '#fee2e2', color: '#991b1b' };
  return { label: 'GRADE F', bg: '#fee2e2', color: '#7f1d1d' };
}



export default function CompanyDetailPage() {
  const router   = useRouter();
  const params   = useParams();
  const companyId = params.id as string;

  const [loading, setLoading]         = useState(true);
  const [company, setCompany]         = useState<any>(null);
  const [startError, setStartError]   = useState<string | null>(null);
  const [starting, setStarting]       = useState(false);
  const [analytics, setAnalytics]     = useState<ProgressAnalytics | null>(null);
  const [rulesOpen, setRulesOpen]     = useState(false);
  const [tipsOpen, setTipsOpen]       = useState(false);

  useEffect(() => {
    getMockTestCompanyById(companyId)
      .then(data => setCompany(transformCompanyData(data)))
      .catch(() => { const f = companyTemplates[companyId]; if (f) setCompany(f); })
      .finally(() => setLoading(false));
    getProgressAnalytics().then(setAnalytics).catch(() => {});
  }, [companyId]);

  const template   = company || companyTemplates[companyId];
  const { logoPath, name: companyName, initials, color: companyColor } = resolveCompanyInfo(companyId);

  // Single source of truth — see PRACTICE_TOTAL_Q / PRACTICE_TOTAL_MIN.
  const totalSections = MOCK_SECTIONS.length;
  const totalQ        = PRACTICE_TOTAL_Q;
  const totalMin      = PRACTICE_TOTAL_MIN;
  const passMarkStr   = template?.passing?.replace(/[^0-9%]/g, '') ?? '60%';

  // Derived history values from analytics — only lastScore is read by the
  // JSX (Your best stat). The other analytics fields and getGrade() are
  // kept in case the brief is restored to its previous heavier layout.
  const lastScore = analytics?.latest_score ?? analytics?.best_score ?? null;

  if (loading) return <LoadingScreen label="Loading brief" />;

  if (!template) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6" style={{ background: '#F8F9FB' }}>
        <p className="text-sm" style={{ color: '#475569' }}>Company not found.</p>
        <button
          onClick={() => router.push('/mock-test')}
          className="text-sm font-medium hover:underline"
          style={{ color: '#1e3a8a' }}
        >
          ← Back to Mock Tests
        </button>
      </div>
    );
  }

  const handleBeginExam = async () => {
    setStartError(null);
    setStarting(true);
    try {
      const backendCompanyId = resolveCompanyId(companyId);
      const subs = ['percentages', 'time_and_work', 'profit_and_loss', 'ratios', 'number_systems'];
      const sub  = subs[Math.floor(Math.random() * subs.length)];
      const session = await generateMockTest(backendCompanyId, ['arithmetic'], [sub], undefined, 30000);
      router.push(`/mock-test/${companyId}?sessionId=${session.session_id}`);
    } catch (err: any) {
      const data = err?.response?.data;
      const backendError = data?.error;
      const is402 = err?.response?.status === 402 || backendError?.error_code === 'HTTP_402' || backendError?.details?.error === 'INSUFFICIENT_CREDITS';
      if (is402) { setStartError('Not enough credits.'); return; }
      if (backendError?.error_code === 'AI_SERVICE_UNAVAILABLE') {
        setStartError('AI service temporarily unavailable.');
      } else {
        setStartError(backendError?.message || 'Failed to start. Please try again.');
      }
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#F8F9FB' }}>
      <div className="max-w-5xl mx-auto px-6 md:px-10 pt-10 pb-16">

        {/* Breadcrumb — same shape as section intro */}
        <div className="mb-6 text-sm flex items-center gap-2">
          <button onClick={() => router.push('/mock-test')} style={{ color: '#64748B' }} className="hover:underline">Mock Tests</button>
          <span style={{ color: '#CBD5E1' }}>›</span>
          <span className="font-semibold" style={{ color: '#0F172A' }}>{companyName} — Brief</span>
        </div>

        {/* Main brief card — section-intro DNA */}
        <div
          className="bg-white rounded-2xl border p-8 md:p-10"
          style={{
            borderColor: '#E5E7EB',
            boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.06)',
          }}
        >
          {/* Header: logo + title + meta */}
          <div className="flex items-start justify-between gap-4 mb-7 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border"
                style={{ borderColor: '#E5E7EB', background: '#fff' }}>
                {logoPath ? (
                  <img src={logoPath} alt={template.name} className="w-full h-full object-contain p-1.5"
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                      const p = e.currentTarget.parentElement as HTMLElement;
                      p.style.background = companyColor;
                      const s = document.createElement('span');
                      s.style.cssText = 'color:white;font-weight:700;font-size:16px';
                      s.textContent = initials;
                      p.replaceChildren(s);
                    }}
                  />
                ) : (
                  <span className="font-bold text-lg text-white">{initials}</span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-1.5" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
                  {template.name} Recruitment Test
                </h2>
                <p className="text-sm max-w-xl leading-relaxed" style={{ color: '#64748B' }}>
                  Modeled on the live {template.name} hiring pattern. {totalSections} locked sections, section-locked navigation,{' '}
                  {template.negativeMarking ? `negative marking ${template.negativeValue}` : 'no negative marking'}.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase"
                style={{ background: '#dbeafe', color: '#1e3a8a', border: '1px solid #bfdbfe' }}>
                <Lock size={11} /> Section-locked
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase"
                style={{
                  background: template.negativeMarking ? '#fee2e2' : '#dcfce7',
                  color:      template.negativeMarking ? '#991b1b' : '#15803d',
                  border:     `1px solid ${template.negativeMarking ? '#fecaca' : '#bbf7d0'}`,
                }}>
                <CheckCircle size={11} /> {template.negativeMarking ? `Neg mark ${template.negativeValue}` : 'No neg mark'}
              </span>
            </div>
          </div>

          {/* Numbered section list — mirrors section intro instructions */}
          <p className="text-base font-bold mb-3" style={{ color: '#0F172A' }}>Sections:</p>
          <ol className="space-y-4 mb-7">
            {MOCK_SECTIONS.map((sec, i) => {
              const dc = DIFF_COLOR[sec.difficulty];
              const isFirst = i === 0;
              return (
                <li key={sec.name} className="flex gap-3 text-[15px] leading-relaxed">
                  <span className="font-semibold tabular-nums shrink-0 w-5" style={{ color: '#475569' }}>{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <span className="font-bold" style={{ color: '#000' }}>{sec.name}:</span>{' '}
                        <span style={{ color: '#2d2d2d' }}>{sec.description}</span>
                        {isFirst && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase"
                            style={{ background: '#1e3a8a', color: '#fff' }}>
                            Starts here
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-xs" style={{ color: '#64748B' }}>
                        <span><span className="font-bold tabular-nums" style={{ color: '#0F172A' }}>{sec.questions}</span> Q</span>
                        <span><span className="font-bold tabular-nums" style={{ color: '#0F172A' }}>{sec.duration}</span> min</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
                          style={{ background: dc.bg, color: dc.color }}>
                          {sec.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <HighlightBox>
            <p className="text-sm leading-relaxed" style={{ color: '#2d2d2d' }}>
              Pass mark <span className="font-bold" style={{ color: '#1e3a8a' }}>{passMarkStr}</span> · Window{' '}
              <span className="font-bold" style={{ color: '#0F172A' }}>{totalMin} min</span> · No pause
            </p>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>Total</p>
                <p className="text-2xl font-bold tabular-nums" style={{ color: '#1e3a8a' }}>
                  {totalQ}<span className="text-base font-bold" style={{ color: '#60a5fa' }}>/{totalMin}m</span>
                </p>
              </div>
              {lastScore != null && (
                <div className="text-right">
                  <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>Your best</p>
                  <p className="text-2xl font-bold tabular-nums" style={{ color: '#15803d' }}>{lastScore}<span className="text-base" style={{ color: '#94A3B8' }}>/100</span></p>
                </div>
              )}
            </div>
          </HighlightBox>
        </div>

        {/* Rules + Tips as accordion cards below the main card */}
        <div className="mt-5 space-y-3">
          <div
            className="bg-white rounded-2xl border overflow-hidden"
            style={{ borderColor: '#E5E7EB', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}
          >
            <button
              onClick={() => setRulesOpen(v => !v)}
              className="w-full flex items-center justify-between px-6 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: '#1e3a8a' }}>i</span>
                <span className="text-sm font-bold" style={{ color: '#0F172A' }}>Exam rules</span>
              </div>
              <ChevronDown size={16} style={{ color: '#94A3B8', transform: rulesOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            <AnimatePresence>
              {rulesOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <ol className="px-6 pb-5 space-y-3 border-t" style={{ borderColor: '#f3f4f6' }}>
                    {template.rules.map((rule: string, i: number) => (
                      <li key={i} className="flex gap-3 pt-3 text-sm leading-relaxed">
                        <span className="font-semibold tabular-nums shrink-0 w-5" style={{ color: '#475569' }}>{i + 1}.</span>
                        <span style={{ color: '#2d2d2d' }}>{rule}</span>
                      </li>
                    ))}
                  </ol>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div
            className="bg-white rounded-2xl border overflow-hidden"
            style={{ borderColor: '#E5E7EB', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}
          >
            <button
              onClick={() => setTipsOpen(v => !v)}
              className="w-full flex items-center justify-between px-6 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                  style={{ background: '#dbeafe', color: '#1e3a8a' }}>+</span>
                <span className="text-sm font-bold" style={{ color: '#0F172A' }}>Pre-flight tips</span>
              </div>
              <ChevronDown size={16} style={{ color: '#94A3B8', transform: tipsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            <AnimatePresence>
              {tipsOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <ol className="px-6 pb-5 space-y-3 border-t" style={{ borderColor: '#f3f4f6' }}>
                    {template.tips.map((tip: string, i: number) => (
                      <li key={i} className="flex gap-3 pt-3 text-sm leading-relaxed">
                        <span className="font-semibold tabular-nums shrink-0 w-5" style={{ color: '#475569' }}>{i + 1}.</span>
                        <span style={{ color: '#2d2d2d' }}>{tip}</span>
                      </li>
                    ))}
                  </ol>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom action row — section-intro DNA */}
        <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => router.push('/mock-test')}
            className="text-sm font-medium hover:underline"
            style={{ color: '#475569' }}
          >
            ← Back to Tests
          </button>

          <div className="flex items-center gap-3 flex-wrap">
            {startError && (
              <p className="text-xs font-semibold flex items-center gap-1" style={{ color: '#ef4444' }}>
                <AlertTriangle size={12} /> {startError}
              </p>
            )}
            <button
              disabled={starting}
              onClick={handleBeginExam}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_rgba(30,58,138,0.5)] disabled:opacity-60 disabled:hover:translate-y-0"
              style={{ background: '#1e3a8a', boxShadow: '0 4px 14px -4px rgba(30,58,138,0.35)' }}
            >
              {starting ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Starting…</>
              ) : (
                <><Play size={14} className="fill-white" /> Begin Exam <ChevronRight size={14} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
