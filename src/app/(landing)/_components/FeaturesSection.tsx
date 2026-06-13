'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

/* ─── Feature data ─────────────────────────────────────────────────── */
const features = [
  {
    id: 'ats-score',
    eyebrow: 'ATS Scan with Score',
    headline: 'Know your ATS score before you apply',
    description:
      "Most resumes never reach a human — they're filtered out by Applicant Tracking Systems. Upload your resume and get an instant ATS compatibility score with a clear breakdown of what to fix.",
    bullets: [
      'Instant 0–100 ATS compatibility score',
      'Pinpoints missing keywords that cost you interviews',
      'Actionable fix list ranked by impact',
    ],
    cta: 'Scan My Resume',
    href: '/ats',
    visualRight: false,
    bgWhite: false,
    Visual: AtsScoreMock,
  },
  {
    id: 'ats-jd',
    eyebrow: 'ATS Scan with Job Description',
    headline: 'Tailor your resume to every job description',
    description:
      "Paste the job description and we'll compare it line by line against your resume. See exactly which required skills, role keywords, and qualifications are present — and which ones are missing.",
    bullets: [
      'Side-by-side JD vs resume keyword match analysis',
      'Identifies must-have vs nice-to-have skill gaps',
      'Boosts your relevance score for each specific role',
    ],
    cta: 'Match to a Job',
    href: '/ats',
    visualRight: true,
    bgWhite: true,
    Visual: AtsJdMock,
  },
  {
    id: 'job-match',
    eyebrow: 'Job Match',
    headline: 'Find jobs that actually match your resume',
    description:
      "Stop applying blindly. Our smart matching engine reads your resume and surfaces roles where your skills, experience level, and domain are a strong fit — so you spend time on applications that convert.",
    bullets: [
      'Resume-aware matching across 5 lakh+ live jobs',
      'Match percentage shown for every listing before you apply',
      'Filter by fit score, location, salary, and work mode',
    ],
    cta: 'Find Matching Jobs',
    href: '/jobmatch',
    visualRight: false,
    bgWhite: false,
    Visual: JobMatchMock,
  },
  {
    id: 'mock-interview',
    eyebrow: 'Mock Interview',
    headline: 'Practice interviews with AI before the real round',
    description:
      'Our AI interviewer asks role-specific technical and behavioural questions, listens to your answers, and gives you structured feedback on clarity, completeness, and communication — just like a real recruiter would.',
    bullets: [
      'Role-specific question banks for 50+ domains',
      'Instant AI feedback on every answer with improvement tips',
      'Build confidence through repetition, not anxiety',
    ],
    cta: 'Start Interview Practice',
    href: '/mock-interview',
    visualRight: true,
    bgWhite: true,
    Visual: MockInterviewMock,
  },
  {
    id: 'mock-test',
    eyebrow: 'Mock Test',
    headline: 'Ace company aptitude and technical tests',
    description:
      "Practice the exact types of assessments top companies use — quantitative aptitude, logical reasoning, verbal ability, and domain tests. Timed, scored, and tailored to the company or role you're targeting.",
    bullets: [
      'Company-style test patterns for TCS, Infosys, Wipro, and more',
      'Timed sections with instant score and percentile',
      'Detailed solution walkthroughs for every question',
    ],
    cta: 'Take a Mock Test',
    href: '/mock-test',
    visualRight: false,
    bgWhite: false,
    Visual: MockTestMock,
  },
];

/* ─── UI Mockups (Tailwind-only, no external images) ────────────────── */

function AtsScoreMock() {
  return (
    <div className="relative flex items-center justify-center p-8 lg:p-12">
      <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-br from-[#2557a7] to-[#183f7d] p-6 shadow-2xl shadow-blue-900/30">
        <div className="flex flex-col items-center">
          <div className="relative flex h-32 w-32 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="white" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52 * 0.96} ${2 * Math.PI * 52}`} />
            </svg>
            <div className="text-center">
              <p className="text-4xl font-black text-white">96</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-200">ATS Score</p>
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold text-blue-100">Strong match — minor gaps found</p>
        </div>
        <div className="mt-5 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Missing Keywords</p>
          <div className="flex flex-wrap gap-2">
            {['Agile', 'Scrum', 'CI/CD'].map((k) => (
              <span key={k} className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">{k}</span>
            ))}
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Matched Keywords</p>
          <div className="flex flex-wrap gap-2">
            {['Python', 'REST APIs', 'Docker', 'Git'].map((k) => (
              <span key={k} className="rounded-full bg-white/25 px-3 py-1 text-xs font-semibold text-white">{k}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AtsJdMock() {
  const rows = [
    { skill: 'Python', jd: true, resume: true },
    { skill: 'Machine Learning', jd: true, resume: true },
    { skill: 'TensorFlow', jd: true, resume: false },
    { skill: 'Data Pipeline', jd: true, resume: false },
    { skill: 'SQL', jd: true, resume: true },
    { skill: 'Spark', jd: false, resume: true },
  ];
  return (
    <div className="relative flex items-center justify-center p-8 lg:p-12">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#2557a7] to-[#183f7d] opacity-10" />
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-blue-900/15">
        <div className="flex items-center gap-2 rounded-t-2xl bg-[#2557a7] px-5 py-3.5">
          <span className="text-xs font-semibold text-white/90">JD Match Analysis</span>
          <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-white">78% Match</span>
        </div>
        <div className="p-4">
          <div className="mb-2 grid grid-cols-[1fr_56px_64px] gap-2 px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Keyword</span>
            <span className="text-center text-[10px] font-bold uppercase tracking-wider text-[#2557a7]">JD</span>
            <span className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">Resume</span>
          </div>
          <div className="divide-y divide-slate-100">
            {rows.map((r) => (
              <div key={r.skill} className="grid grid-cols-[1fr_56px_64px] items-center gap-2 py-2 px-1">
                <span className="text-xs font-medium text-slate-700">{r.skill}</span>
                <div className="flex justify-center">
                  {r.jd && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2557a7]/15">
                      <span className="block h-2 w-2 rounded-full bg-[#2557a7]" />
                    </span>
                  )}
                </div>
                <div className="flex justify-center">
                  {r.resume ? (
                    <CheckCircle2 size={14} className="text-[#2557a7]" />
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-[11px] font-medium text-[#2557a7]">
            Add TensorFlow &amp; Data Pipeline to boost match to 94%
          </div>
        </div>
      </div>
    </div>
  );
}

function JobMatchMock() {
  const jobs = [
    { title: 'Senior Data Engineer', company: 'Infosys', match: 94, location: 'Bangalore' },
    { title: 'ML Engineer', company: 'Wipro', match: 81, location: 'Hyderabad' },
    { title: 'Backend Developer', company: 'TCS', match: 76, location: 'Chennai' },
  ];
  return (
    <div className="relative flex items-center justify-center p-8 lg:p-12">
      <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-br from-[#2557a7] to-[#183f7d] p-5 shadow-2xl shadow-blue-900/30">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-blue-300">Jobs matched to your resume</p>
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.title} className="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 text-lg font-black text-white">
                {job.company[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{job.title}</p>
                <p className="text-[11px] text-blue-200">{job.company} · {job.location}</p>
              </div>
              <span
                className="shrink-0 rounded-full px-2.5 py-1 text-xs font-black"
                style={{
                  background: job.match >= 90 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
                  color: job.match >= 90 ? '#2557a7' : 'white',
                }}
              >
                {job.match}%
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl bg-white/10 p-3 text-center text-xs font-semibold text-blue-100">
          5,00,000+ live jobs indexed
        </div>
      </div>
    </div>
  );
}

function MockInterviewMock() {
  return (
    <div className="relative flex items-center justify-center p-8 lg:p-12">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#2557a7] to-[#183f7d] opacity-10" />
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-blue-900/15">
        <div className="flex items-center gap-2 rounded-t-2xl bg-[#2557a7] px-5 py-3.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
            <span className="text-[10px] font-bold text-white">AI</span>
          </div>
          <span className="text-xs font-semibold text-white/90">Mock Interview — SDE II</span>
          <span className="ml-auto rounded-full bg-green-400/80 px-2 py-0.5 text-[10px] font-bold text-white">● Live</span>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2557a7] text-[10px] font-bold text-white">AI</div>
            <div className="rounded-2xl rounded-tl-none bg-blue-50 px-3.5 py-2.5">
              <p className="text-xs leading-relaxed text-slate-700">
                Tell me about a time you had to optimise a slow database query in production. What was your approach?
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <div className="rounded-2xl rounded-tr-none bg-[#2557a7] px-3.5 py-2.5">
              <p className="text-xs leading-relaxed text-white">We had an N+1 query issue in our orders API…</p>
            </div>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-[#2557a7]">You</div>
          </div>
          <div className="rounded-xl bg-blue-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#2557a7]">AI Feedback</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">Good structure. Add the quantified impact — e.g. &quot;reduced p95 latency by 60%&quot;.</p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2557a7] shadow-lg shadow-blue-700/30">
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4Zm6.5 10.5a.5.5 0 0 1 1 0A7.5 7.5 0 0 1 12 19v2h3a.5.5 0 0 1 0 1H9a.5.5 0 0 1 0-1h3v-2a7.5 7.5 0 0 1-7.5-7.5.5.5 0 0 1 1 0 6.5 6.5 0 0 0 13 0Z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-slate-500">Tap to answer next question</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockTestMock() {
  return (
    <div className="relative flex items-center justify-center p-8 lg:p-12">
      <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-br from-[#2557a7] to-[#183f7d] p-5 shadow-2xl shadow-blue-900/30">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Quantitative Aptitude · Q 7/25</span>
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold text-white">12:34</span>
        </div>
        <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
          <p className="text-sm font-semibold leading-relaxed text-white">
            A train 240 m long passes a pole in 24 seconds. What is its speed in km/h?
          </p>
        </div>
        <div className="mt-4 space-y-2.5">
          {[
            { label: 'A', text: '32 km/h', selected: false },
            { label: 'B', text: '36 km/h', selected: true },
            { label: 'C', text: '40 km/h', selected: false },
            { label: 'D', text: '44 km/h', selected: false },
          ].map((opt) => (
            <div
              key={opt.label}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 ${
                opt.selected ? 'bg-white text-[#2557a7] shadow-lg' : 'bg-white/10 text-white'
              }`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${opt.selected ? 'bg-[#2557a7] text-white' : 'bg-white/20 text-white'}`}>
                {opt.label}
              </span>
              <span className="text-sm font-medium">{opt.text}</span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white" style={{ width: '28%' }} />
          </div>
          <p className="mt-1 text-right text-[10px] text-blue-300">7 of 25 answered</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Individual section ─────────────────────────────────────────────── */

function FeatureSection({ feature }: { feature: (typeof features)[number] }) {
  const { Visual } = feature;
  const textFirst = feature.visualRight;

  const textCol = (
    <motion.div
      className="flex flex-col justify-center"
      initial={{ opacity: 0, x: textFirst ? -28 : 28 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: 'easeOut', delay: 0.05 }}
    >
      <span className="inline-flex w-fit items-center rounded-full border border-[#2557a7]/30 bg-blue-50 px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#2557a7]">
        {feature.eyebrow}
      </span>
      <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-4xl">
        {feature.headline}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-slate-500 md:text-lg">
        {feature.description}
      </p>
      <ul className="mt-6 space-y-3">
        {feature.bullets.map((b) => (
          <li key={b} className="flex items-start gap-3">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#2557a7]" strokeWidth={2.5} />
            <span className="text-sm leading-relaxed text-slate-600">{b}</span>
          </li>
        ))}
      </ul>
      <Link
        href={feature.href}
        className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-[#2557a7] px-6 py-3 text-sm font-bold text-white shadow-[0_6px_20px_rgba(37,87,167,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#1e4a94] hover:shadow-[0_8px_28px_rgba(37,87,167,0.32)] active:scale-95"
      >
        {feature.cta}
        <ArrowRight size={15} />
      </Link>
    </motion.div>
  );

  const visualCol = (
    <motion.div
      initial={{ opacity: 0, x: textFirst ? 28 : -28 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: 'easeOut', delay: 0.12 }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Visual />
      </motion.div>
    </motion.div>
  );

  return (
    <section
      id={feature.id}
      className={`py-20 md:py-28 ${feature.bgWhite ? 'bg-white' : 'bg-[#EFF6FF]'}`}
    >
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className={textFirst ? 'lg:order-1' : 'lg:order-2'}>{textCol}</div>
          <div className={textFirst ? 'lg:order-2' : 'lg:order-1'}>{visualCol}</div>
        </div>
      </div>
    </section>
  );
}

/* ─── Section header ─────────────────────────────────────────────────── */

function SectionHeader() {
  return (
    <div className="bg-white py-20 pb-0">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="inline-flex items-center rounded-full border border-[#2557a7]/25 bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#2557a7]">
            Complete Career Platform
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
            Every tool you need to land your next job
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">
            From building a standout resume to acing the final interview — CareerBot covers every step of your job search in one place.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Root export ────────────────────────────────────────────────────── */

export default function FeaturesSection() {
  return (
    <div id="features">
      <SectionHeader />
      {features.map((feature) => (
        <FeatureSection key={feature.id} feature={feature} />
      ))}
    </div>
  );
}
