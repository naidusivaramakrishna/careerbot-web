'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AlertTriangle, Play, Clock, BookOpen, Calculator, Brain, Code, Lightbulb,
         Lock, CheckCircle, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMockTestCompanyById, generateMockTest, getProgressAnalytics, ProgressAnalytics } from '@/api/mockTestApi';
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
  icon: React.ElementType;
  questions: number;
  duration: number;
  description: string;
  difficulty: 'EASY' | 'MED' | 'HARD';
}

const MOCK_SECTIONS: MockSection[] = [
  { name: 'Arithmetic', icon: Calculator, questions: 10, duration: 20, description: 'Percentages, P&L, Time-Work, SI/CI',            difficulty: 'MED'  },
  { name: 'Aptitude',   icon: BookOpen,   questions: 15, duration: 25, description: 'Data interpretation, permutations, probability', difficulty: 'MED'  },
  { name: 'Reasoning',  icon: Brain,      questions: 15, duration: 25, description: 'Logical sequences, blood relations, coding',     difficulty: 'HARD' },
  { name: 'Technical',  icon: Code,       questions: 15, duration: 35, description: 'Python · Java · DSA · SQL · OOP',                difficulty: 'HARD' },
];

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
    tips: data.tips || [`${data.total_questions || 50} questions in ${data.total_duration_minutes || 60} minutes`, 'Practice thoroughly before the test'],
  };
}

const DIFF_COLOR: Record<string, { bg: string; color: string }> = {
  EASY: { bg: '#d1fae5', color: '#065f46' },
  MED:  { bg: '#fef3c7', color: '#92400e' },
  HARD: { bg: '#fee2e2', color: '#991b1b' },
};

function getSectionIcon(name: string): React.ElementType {
  const n = name.toLowerCase();
  if (n.includes('arithmetic') || n.includes('math') || n.includes('quant')) return Calculator;
  if (n.includes('aptitude') || n.includes('verbal'))   return BookOpen;
  if (n.includes('reasoning') || n.includes('logical')) return Brain;
  if (n.includes('technical') || n.includes('coding'))  return Code;
  return Lightbulb;
}

function getGrade(score: number): { label: string; bg: string; color: string } {
  if (score >= 80) return { label: 'GRADE A', bg: '#d1fae5', color: '#065f46' };
  if (score >= 70) return { label: 'GRADE B', bg: '#dbeafe', color: '#2557a7' };
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

  const totalSections = MOCK_SECTIONS.length;
  const totalQ        = 40;
  const totalMin      = 90;
  const passMarkStr   = template?.passing?.replace(/[^0-9%]/g, '') ?? '60%';

  // Derived history values from analytics
  const lastScore   = analytics?.latest_score ?? analytics?.best_score ?? null;
  const avgAcc      = analytics?.average_accuracy ?? analytics?.average_score ?? null;
  const totalTests  = analytics?.total_tests ?? 0;

  const grade = lastScore != null ? getGrade(lastScore) : null;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F4F2EC' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#009980', borderTopColor: 'transparent', borderWidth: 3 }} />
          <p className="text-sm font-semibold" style={{ color: '#2d2d2d' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F4F2EC' }}>
        <div className="text-center">
          <p className="text-sm mb-3" style={{ color: '#2d2d2d' }}>Company not found.</p>
          <button onClick={() => router.push('/mock-test')} className="text-sm font-black" style={{ color: '#009980' }}>
            Back to Mock Tests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F4F2EC' }}>

      {/* ── Breadcrumb ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 pt-5 pb-0">
        <div className="flex items-center gap-1.5 text-xs font-bold tracking-widest" style={{ color: '#2d2d2d', opacity: 0.5 }}>
          <button onClick={() => router.push('/mock-test')} className="hover:opacity-80 transition">MOCK TESTS</button>
          <ChevronRight size={10} />
          <span style={{ color: '#2557a7', opacity: 1 }}>{companyName.toUpperCase()}</span>
          <ChevronRight size={10} />
          <span>BRIEF</span>
        </div>
        <span className="text-xs font-semibold" style={{ color: '#2d2d2d', opacity: 0.45 }}>
          last reviewed {template.lastVerified}
        </span>
      </div>

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-4 pb-3"
      >
        <div className="flex items-start justify-between gap-6">
          {/* Left: logo + title + desc */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border"
              style={{ borderColor: '#e5e7eb', background: '#fff' }}>
              {logoPath ? (
                <img src={logoPath} alt={template.name} className="w-full h-full object-contain p-1.5"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                    const p = e.currentTarget.parentElement as HTMLElement;
                    p.style.background = companyColor;
                    p.innerHTML = `<span style="color:white;font-weight:900;font-size:16px">${initials}</span>`;
                  }}
                />
              ) : (
                <span className="font-black text-lg text-white">{initials}</span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest mb-1" style={{ color: '#2d2d2d', opacity: 0.45 }}>
                COMPANY MOCK · TIER 1 IT SERVICES
              </p>
              <h1 className="text-2xl font-black mb-1" style={{ color: '#000', letterSpacing: '-0.5px' }}>
                {template.name} Recruitment Test
              </h1>
              <p className="text-sm max-w-lg leading-relaxed mb-4" style={{ color: '#2d2d2d', opacity: 0.7 }}>
                Modeled on the live {template.name} hiring pattern. {totalSections} locked sections,{' '}
                {template.negativeMarking ? `negative marking ${template.negativeValue}` : 'no negative marking'},{' '}
                section-locked navigation. Pass mark{' '}
                <span className="font-black" style={{ color: '#2557a7' }}>{passMarkStr}</span>.
              </p>

              {/* Inline stats strip */}
              <div className="flex items-center gap-0 rounded-xl overflow-hidden border w-fit" style={{ borderColor: '#e5e7eb' }}>
                {[
                  { label: 'TOTAL QUESTIONS', value: String(totalQ),        suffix: '',    accent: false },
                  { label: 'TOTAL TIME',       value: String(totalMin),      suffix: 'min', accent: false },
                  { label: 'SECTIONS',         value: String(totalSections), suffix: '',    accent: false },
                  { label: 'PASS MARK',        value: passMarkStr,           suffix: '',    accent: true  },
                ].map((stat, i, arr) => (
                  <div
                    key={stat.label}
                    className="px-5 py-3 text-center bg-white"
                    style={{ borderRight: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none' }}
                  >
                    <div className="flex items-baseline justify-center gap-0.5 font-black" style={{ color: stat.accent ? '#2557a7' : '#000', fontSize: 22 }}>
                      {stat.value}
                      {stat.suffix && <span className="text-xs font-semibold ml-0.5" style={{ color: '#2d2d2d', opacity: 0.5 }}>{stat.suffix}</span>}
                    </div>
                    <div className="text-xs font-semibold mt-0.5" style={{ color: '#2d2d2d', opacity: 0.5 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: badges in one row */}
          <div className="flex items-center gap-2 flex-shrink-0 pt-1">
            <span className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full"
              style={{ background: '#1e3a5f', color: '#93c5fd' }}>
              <Lock size={10} /> SECTION-LOCKED
            </span>
            <span className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full"
              style={{ background: template.negativeMarking ? '#7f1d1d' : '#064e3b', color: template.negativeMarking ? '#fca5a5' : '#6ee7b7' }}>
              <CheckCircle size={10} /> {template.negativeMarking ? `NEG MARK ${template.negativeValue}` : 'NO NEG MARK'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Main two-column body ───────────────────────────────────────────────── */}
      <div className="flex gap-5 px-6">

        {/* Left column */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Section table */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border overflow-hidden"
            style={{ borderColor: '#e5e7eb' }}
          >
            {/* Table title row */}
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: '#f3f4f6' }}>
              <p className="text-sm font-black" style={{ color: '#000' }}>Section-by-section breakdown</p>
              <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#2d2d2d', opacity: 0.45 }}>
                <Lock size={10} /> SEQUENTIAL · LOCKED
              </div>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-12 px-5 py-2.5" style={{ background: '#f9fafb' }}>
              {[['SEQ',1,'center'],['SECTION',4,'left'],['QS',1,'center'],['MIN',1,'center'],['DIFF',2,'center'],['YOUR AVG',2,'right']] .map(([h, span, align]) => (
                <span key={h as string}
                  className={`text-xs font-black tracking-widest col-span-${span}`}
                  style={{ color: '#2d2d2d', opacity: 0.4, textAlign: align as any }}>
                  {h}
                </span>
              ))}
            </div>

            {MOCK_SECTIONS.map((sec, i) => {
              const Icon  = getSectionIcon(sec.name);
              const dc    = DIFF_COLOR[sec.difficulty];
              const isFirst = i === 0;
              return (
                <div key={sec.name}
                  className="grid grid-cols-12 items-center px-5 py-4 border-b last:border-0"
                  style={{ borderColor: '#f9fafb' }}
                >
                  <span className="col-span-1 text-center text-xs font-black" style={{ color: '#2d2d2d', opacity: 0.35 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="col-span-4 flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#f3f4f6' }}>
                      <Icon size={13} style={{ color: '#2557a7' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-black" style={{ color: '#000' }}>{sec.name}</p>
                        {isFirst && (
                          <span className="text-xs font-black px-1.5 py-0.5 rounded"
                            style={{ background: '#2557a7', color: '#fff' }}>
                            STARTS HERE
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: '#2d2d2d', opacity: 0.55 }}>{sec.description}</p>
                    </div>
                  </div>
                  <span className="col-span-1 text-center text-sm font-black" style={{ color: '#000' }}>{sec.questions}</span>
                  <span className="col-span-1 text-center text-sm font-black" style={{ color: '#000' }}>{sec.duration}</span>
                  <div className="col-span-2 flex justify-center">
                    <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: dc.bg, color: dc.color }}>
                      {sec.difficulty}
                    </span>
                  </div>
                  <span className="col-span-2 text-right text-sm font-black" style={{ color: '#2d2d2d', opacity: 0.35 }}>
                    —
                  </span>
                </div>
              );
            })}

            {/* Footer totals */}
            <div className="grid grid-cols-12 items-center px-5 py-3 border-t" style={{ background: '#eef3ff', borderColor: '#c7d7f4' }}>
              <span className="col-span-1" />
              <span className="col-span-4 text-xs font-black" style={{ color: '#2557a7' }}>TOTAL</span>
              <span className="col-span-1 text-center text-xs font-black" style={{ color: '#2557a7' }}>{totalQ}</span>
              <span className="col-span-1 text-center text-xs font-black" style={{ color: '#2557a7' }}>{totalMin}</span>
              <span className="col-span-2" />
              <span className="col-span-2 text-right text-xs font-black" style={{ color: '#2557a7' }}>—</span>
            </div>
          </motion.div>

          {/* Exam Rules accordion */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border overflow-hidden"
            style={{ borderColor: '#e5e7eb' }}
          >
            <button
              onClick={() => setRulesOpen(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black text-white"
                  style={{ background: '#2557a7' }}>i</div>
                <span className="text-sm font-black" style={{ color: '#000' }}>Exam rules</span>
              </div>
              <ChevronDown size={15} style={{ color: '#2d2d2d', opacity: 0.4, transform: rulesOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            <AnimatePresence>
              {rulesOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <ul className="px-5 pb-5 space-y-3 border-t" style={{ borderColor: '#f3f4f6' }}>
                    {template.rules.map((rule: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 pt-3 first:pt-3">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black mt-0.5"
                          style={{ background: '#eef3ff', color: '#2557a7' }}>{i + 1}</span>
                        <span className="text-sm leading-relaxed" style={{ color: '#2d2d2d' }}>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Pre-flight tips accordion */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border overflow-hidden"
            style={{ borderColor: '#e5e7eb' }}
          >
            <button
              onClick={() => setTipsOpen(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black"
                  style={{ background: '#ecfdf5', color: '#009980' }}>+</div>
                <span className="text-sm font-black" style={{ color: '#000' }}>Pre-flight tips</span>
              </div>
              <ChevronDown size={15} style={{ color: '#2d2d2d', opacity: 0.4, transform: tipsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            <AnimatePresence>
              {tipsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <ol className="px-5 pb-5 space-y-3 border-t" style={{ borderColor: '#f3f4f6' }}>
                    {template.tips.map((tip: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 pt-3">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black mt-0.5 text-white"
                          style={{ background: '#009980' }}>{i + 1}</span>
                        <span className="text-sm leading-relaxed" style={{ color: '#2d2d2d' }}>{tip}</span>
                      </li>
                    ))}
                  </ol>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>

        {/* Right column */}
        <div className="w-64 flex-shrink-0 space-y-4">

          {/* History panel */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border overflow-hidden"
            style={{ borderColor: '#e5e7eb' }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: '#f3f4f6' }}>
              <p className="text-xs font-black tracking-widest" style={{ color: '#2d2d2d', opacity: 0.45 }}>
                YOUR HISTORY WITH {companyName.toUpperCase()}
              </p>
            </div>

            {lastScore != null ? (
              <div className="p-4 space-y-4">
                {/* Last score */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold" style={{ color: '#2d2d2d', opacity: 0.5 }}>LAST · {totalTests} ATTEMPT{totalTests !== 1 ? 'S' : ''}</span>
                    {grade && (
                      <span className="text-xs font-black px-2 py-0.5 rounded"
                        style={{ background: grade.bg, color: grade.color }}>{grade.label}</span>
                    )}
                  </div>
                  <p className="font-black leading-none" style={{ color: '#000', fontSize: 36 }}>
                    {lastScore}<span className="text-base font-semibold" style={{ color: '#2d2d2d', opacity: 0.4 }}>/100</span>
                  </p>
                  {avgAcc != null && (
                    <p className="text-xs mt-1" style={{ color: '#2d2d2d', opacity: 0.55 }}>
                      {totalMin} min · {Math.round(avgAcc)}% accuracy
                    </p>
                  )}
                </div>

              </div>
            ) : (
              <div className="p-4">
                <div className="text-center py-5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: '#f3f4f6' }}>
                    <Clock size={18} style={{ color: '#2d2d2d', opacity: 0.3 }} />
                  </div>
                  <p className="text-xs font-semibold" style={{ color: '#2d2d2d', opacity: 0.6 }}>No history yet</p>
                  <p className="text-xs mt-1" style={{ color: '#2d2d2d', opacity: 0.35 }}>Complete a test to see stats</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Disclaimer */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl p-3 border flex items-start gap-2.5"
            style={{ background: '#fffbeb', borderColor: '#fde68a' }}
          >
            <AlertTriangle size={13} style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs leading-relaxed" style={{ color: '#92400e' }}>
              Pattern {template.confidence === 'high' ? 'verified' : 'approximate'} as of {template.lastVerified}. Verify with official sources before your actual exam.
            </p>
          </motion.div>

        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-52 right-0 z-30 border-t px-6 py-3 flex items-center justify-between gap-4"
        style={{ background: '#ffffff', borderColor: '#e5e7eb' }}
      >
        {/* Left info strips */}
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs font-bold tracking-widest" style={{ color: '#2d2d2d', opacity: 0.45 }}>PASS MARK</p>
            <p className="text-sm font-black" style={{ color: '#2557a7' }}>{passMarkStr}</p>
          </div>
          <div className="w-px h-8" style={{ background: '#e5e7eb' }} />
          <div>
            <p className="text-xs font-bold tracking-widest" style={{ color: '#2d2d2d', opacity: 0.45 }}>WINDOW</p>
            <p className="text-sm font-black" style={{ color: '#000' }}>
              {totalMin} MIN · <span style={{ color: '#2d2d2d', opacity: 0.55, fontWeight: 600 }}>NO PAUSE</span>
            </p>
          </div>
          {lastScore != null && (
            <>
              <div className="w-px h-8" style={{ background: '#e5e7eb' }} />
              <div>
                <p className="text-xs font-bold tracking-widest" style={{ color: '#2d2d2d', opacity: 0.45 }}>YOUR BEST</p>
                <p className="text-sm font-black" style={{ color: '#000' }}>{lastScore}/100</p>
              </div>
            </>
          )}
        </div>

        {/* Right buttons */}
        <div className="flex items-center gap-3">
          {startError && (
            <p className="text-xs font-semibold flex items-center gap-1" style={{ color: '#ef4444' }}>
              <AlertTriangle size={12} /> {startError}
            </p>
          )}
          <button
            disabled={starting}
            onClick={async () => {
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
                const is402 = err?.response?.status === 402 || data?.error_code === 'HTTP_402' || data?.details?.error === 'INSUFFICIENT_CREDITS';
                if (is402) { setStartError('Not enough credits.'); return; }
                if (data?.error_code === 'AI_SERVICE_UNAVAILABLE') {
                  setStartError('AI service temporarily unavailable.');
                } else {
                  setStartError(data?.message || 'Failed to start. Please try again.');
                }
              } finally {
                setStarting(false);
              }
            }}
            className="flex items-center gap-2 font-black px-7 py-2.5 rounded-xl text-white text-sm tracking-wide transition disabled:opacity-60"
            style={{ background: '#2557a7' }}
          >
            {starting ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> STARTING...</>
            ) : (
              <><Play size={14} className="fill-white" /> BEGIN EXAM <ChevronRight size={14} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
