'use client';

import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ChevronRight, Mic, BookOpen, Headphones,
  FileText, Video, Zap, BarChart2, AlignLeft, MessageSquare,
  ClipboardList, Timer, Brain, CheckSquare, Check,
  Sparkles, Clock, Users,
} from 'lucide-react';

const BRAND = '#2557a7';
const BRAND_HOVER = '#1e4a94';
const BRAND_LIGHT = 'rgba(37,87,167,0.06)';
const BRAND_BORDER = 'rgba(37,87,167,0.14)';

const cards = [
  {
    id: 'communication',
    href: '/communication',
    eyebrow: 'English Proficiency',
    badge: 'Recommended',
    title: 'Communication Assessment',
    tagline: 'Evaluate spoken English across 7 skill dimensions with AI-powered scoring.',
    stats: [
      { value: '44', label: 'Questions' },
      { value: '7',  label: 'Sections'  },
      { value: '20m',label: 'Duration'  },
    ],
    features: [
      { icon: Mic,           label: 'See & Repeat'        },
      { icon: Headphones,    label: 'Listen & Repeat'     },
      { icon: AlignLeft,     label: 'Jumbled Sentences'   },
      { icon: MessageSquare, label: 'Sentence Completion' },
      { icon: Headphones,    label: 'Listen & Correct'    },
      { icon: BookOpen,      label: 'Story Comprehension' },
    ],
    cta: 'Start Assessment',
    Icon: Mic,
  },
  {
    id: 'mock-test',
    href: '/mock-test',
    eyebrow: 'Timed Practice Test',
    badge: 'New',
    title: 'Mock Test',
    tagline: 'Simulate real exam conditions with timed MCQ sections scored instantly.',
    stats: [
      { value: '40', label: 'Questions' },
      { value: '4',  label: 'Sections'  },
      { value: '80m',label: 'Duration'  },
    ],
    features: [
      { icon: Brain,         label: 'Aptitude'         },
      { icon: ClipboardList, label: 'Reasoning'        },
      { icon: CheckSquare,   label: 'Domain Knowledge' },
      { icon: Timer,         label: 'Timed Sections'   },
      { icon: BarChart2,     label: 'Score Breakdown'  },
      { icon: Zap,           label: 'Instant Results'  },
    ],
    cta: 'Take Mock Test',
    Icon: ClipboardList,
  },
  {
    id: 'mock-interview',
    href: '/mock-interview',
    eyebrow: 'AI Interview Simulation',
    badge: 'Advanced',
    title: 'Mock Interview',
    tagline: 'A 5-stage guided journey — from prep notes to a live AI voice interview.',
    stats: [
      { value: '5',   label: 'Stages'   },
      { value: '10',  label: 'Practice' },
      { value: '60m', label: 'Duration' },
    ],
    features: [
      { icon: FileText, label: 'Interview Notes'    },
      { icon: BookOpen, label: 'English Essentials' },
      { icon: Mic,      label: 'Practice Rounds'    },
      { icon: Video,    label: 'Live AI Interview'  },
      { icon: BarChart2,label: 'Score Report'       },
      { icon: Zap,      label: 'AI Feedback'        },
    ],
    cta: 'Begin Preparation',
    Icon: Video,
  },
];

const steps = {
  communication: [
    'Open Sections Overview and click Start Assessment',
    'Complete each section — AI scores in real time',
    'Receive your full score report on completion',
  ],
  'mock-test': [
    'Select your test category and difficulty level',
    'Answer 40 questions across 4 auto-timed sections',
    'Review instant score breakdown and explanations',
  ],
  'mock-interview': [
    'Generate personalised notes from your resume',
    'Practice answers across 3 progressive rounds',
    'Pass the readiness gate → live AI voice interview',
  ],
};

const tableRows: [string, string, string, string][] = [
  ['Best for',      'English fluency',      'Aptitude & reasoning',  'Full interview sim'  ],
  ['Format',        '7 structured sections','4 timed MCQ sections',  '5-stage journey'     ],
  ['Duration',      '~20 min',              '~30 min',               '~45–60 min'          ],
  ['AI Evaluation', '✓',                    '—',                     '✓'                   ],
  ['Score Report',  '✓',                    '✓',                     '✓'                   ],
  ['Difficulty',    'Beginner → Advanced',  'Beginner → Advanced',   'Advanced'            ],
];

export default function InterviewPrepHub() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-5">

        {/* ── Back ─────────────────────────────────────────── */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft size={13} />
          Back
        </button>

        {/* ── Hero ─────────────────────────────────────────── */}
        <div className="mb-5">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white mb-2"
            style={{ backgroundColor: BRAND }}
          >
            <Sparkles size={9} />
            Interview Preparation
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">
            Choose Your Preparation Path
          </h1>
          <p className="text-sm text-gray-500 max-w-lg leading-relaxed">
            Three AI-powered tools to sharpen every dimension of your interview performance.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-4">
            {[
              { icon: Users, label: '3 Preparation Tools'   },
              { icon: Zap,   label: 'AI-Powered Evaluation' },
              { icon: Clock, label: 'Self-Paced'            },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <Icon size={12} style={{ color: BRAND }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {cards.map((card) => {
            const CardIcon = card.Icon;
            return (
              <div
                key={card.id}
                className="group bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Brand accent bar */}
                <div className="h-0.75 shrink-0" style={{ backgroundColor: BRAND }} />

                <div className="flex flex-col flex-1 p-4 gap-3">

                  {/* Row 1: icon + badge */}
                  <div className="flex items-center justify-between">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: BRAND_LIGHT }}
                    >
                      <CardIcon size={17} style={{ color: BRAND }} />
                    </div>
                    <span
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: BRAND }}
                    >
                      {card.badge}
                    </span>
                  </div>

                  {/* Row 2: title + tagline */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      {card.eyebrow}
                    </p>
                    <h2 className="text-[15px] font-extrabold text-gray-900 leading-snug mb-1.5">
                      {card.title}
                    </h2>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {card.tagline}
                    </p>
                  </div>

                  {/* Row 3: stats */}
                  <div
                    className="grid grid-cols-3 divide-x divide-[rgba(37,87,167,0.1)] rounded-xl overflow-hidden"
                    style={{ backgroundColor: BRAND_LIGHT }}
                  >
                    {card.stats.map(({ value, label }) => (
                      <div key={label} className="flex flex-col items-center py-2 px-1">
                        <span className="text-base font-extrabold text-gray-900 leading-none">{value}</span>
                        <span className="text-[9px] text-gray-400 font-semibold mt-0.5 uppercase tracking-wide">{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Row 4: features */}
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      What&apos;s Covered
                    </p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      {card.features.map(({ label }) => (
                        <div key={label} className="flex items-center gap-1.5">
                          <Check size={9} className="shrink-0" style={{ color: BRAND }} />
                          <span className="text-[11px] text-gray-600 truncate">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Row 5: CTA */}
                  <button
                    onClick={() => router.push(card.href)}
                    className="mt-auto w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm text-white transition-colors duration-150 active:scale-[0.98]"
                    style={{ backgroundColor: BRAND }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = BRAND_HOVER)}
                    onMouseOut={(e)  => (e.currentTarget.style.backgroundColor = BRAND)}
                  >
                    {card.cta}
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>

                </div>
              </div>
            );
          })}
        </div>

        {/* ── How it works ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
            How It Works
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {cards.map((card) => {
              const CardIcon = card.Icon;
              const cardSteps = steps[card.id as keyof typeof steps];
              return (
                <div key={card.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: BRAND_LIGHT }}
                    >
                      <CardIcon size={12} style={{ color: BRAND }} />
                    </div>
                    <p className="text-xs font-bold text-gray-800">{card.title}</p>
                  </div>
                  <ol className="space-y-1.5">
                    {cardSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span
                          className="shrink-0 w-4 h-4 rounded-full text-white text-[9px] font-extrabold flex items-center justify-center mt-0.5"
                          style={{ backgroundColor: BRAND }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-[11px] text-gray-500 leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Comparison table ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Side-by-Side Comparison
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 w-[28%]" />
                  {cards.map((c) => (
                    <th
                      key={c.id}
                      className="text-center px-4 py-2.5 text-xs font-bold w-[24%]"
                      style={{ color: BRAND }}
                    >
                      {c.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map(([attr, ...vals], i) => (
                  <tr key={attr} className={i % 2 === 0 ? 'bg-gray-50/60' : 'bg-white'}>
                    <td className="px-5 py-2 text-xs font-semibold text-gray-600">{attr}</td>
                    {vals.map((val, j) => (
                      <td key={j} className="px-4 py-2 text-xs text-center text-gray-500">
                        {val === '✓' ? (
                          <Check size={13} className="mx-auto" style={{ color: BRAND }} />
                        ) : val === '—' ? (
                          <span className="text-gray-300">—</span>
                        ) : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Guidance callout ─────────────────────────────── */}
        <div
          className="flex items-start gap-3.5 px-5 py-3.5 rounded-2xl border"
          style={{ backgroundColor: BRAND_LIGHT, borderColor: BRAND_BORDER }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: BRAND }}
          >
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 mb-0.5">Recommended learning path</p>
            <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
              Start with{' '}
              <span className="font-semibold" style={{ color: BRAND }}>Communication Assessment</span>
              {' '}→ then{' '}
              <span className="font-semibold" style={{ color: BRAND }}>Mock Test</span>
              {' '}→ finally the{' '}
              <span className="font-semibold" style={{ color: BRAND }}>Mock Interview</span>
              {' '}for the full interview experience with AI voice feedback.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
