'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import SignUpModal from '@/components/SignUpModal';
import { sanitizeAuthRedirect } from '@/lib/authRedirect';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Headphones,
  Languages,
  Lock,
  Mic2,
  MonitorCheck,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Waves,
} from 'lucide-react';

const heroStats = [
  { value: '7', label: 'assessment sections' },
  { value: '44', label: 'communication signals' },
  { value: '20', label: 'minute assessment' },
];

const readinessMetrics = [
  { label: 'Pronunciation clarity', value: '92%', width: '92%' },
  { label: 'Listening accuracy', value: '88%', width: '88%' },
  { label: 'Grammar control', value: '84%', width: '84%' },
];

const assessmentCards = [
  { icon: Waves, title: 'Pronunciation Readiness', copy: 'Measure clarity, pace, and spoken response confidence through guided voice tasks.' },
  { icon: Headphones, title: 'Listening Accuracy', copy: 'Check recall, comprehension, and ability to repeat workplace-style prompts.' },
  { icon: Languages, title: 'Grammar Control', copy: 'Evaluate sentence construction, word choice, and correction skills.' },
  { icon: FileText, title: 'Comprehension Profile', copy: 'Use story and fact-based questions to validate understanding under time pressure.' },
  { icon: Mic2, title: 'Situational Speaking', copy: 'Assess how clearly candidates structure open-ended professional responses.' },
  { icon: BarChart3, title: 'Final Readiness Report', copy: 'Turn section performance into a concise communication-readiness profile.' },
];

const integrityFeatures = [
  { icon: MonitorCheck, title: 'Fullscreen session control', copy: 'Keeps the assessment environment focused while the test is active.' },
  { icon: UserCheck, title: 'Camera and microphone checks', copy: 'Confirms the candidate has the required devices before voice sections begin.' },
  { icon: Lock, title: 'Account-bound attempt', copy: 'Links generated tests and sessions back to the authenticated CareerBot profile.' },
  { icon: ShieldCheck, title: 'Tab-switch guardrails', copy: 'Flags candidate movement away from the active assessment experience.' },
];

const experienceFeatures = [
  { title: 'Guided setup', copy: 'Candidates start with a simple account and difficulty confirmation before the test is generated.' },
  { title: 'Sequential flow', copy: 'Sections are completed in order so the experience feels focused and predictable.' },
  { title: 'Voice plus MCQ balance', copy: 'The assessment combines spoken tasks with structured comprehension and grammar checks.' },
  { title: 'Report-ready output', copy: 'Results can support interview preparation, screening readiness, and communication coaching.' },
];

const assessmentSections = [
  'See & Repeat',
  'Listen & Repeat',
  'Jumbled Sentence',
  'Sentence Completion',
  'Listen & Correct',
  'Story Listen Facts',
  'Describe Situation',
];

const platformSignals = ['Speaking clarity', 'Listening recall', 'Grammar control', 'Comprehension', 'Structured response'];

export default function CommunicationLandingPage() {
  const [showModal, setShowModal] = useState(false);
  const [initialFormType, setInitialFormType] = useState<'signup' | 'signin'>('signup');
  const [authRedirectTo, setAuthRedirectTo] = useState('/communication/start');

  const openSignup = () => {
    setInitialFormType('signup');
    setAuthRedirectTo('/communication/start');
    setShowModal(true);
  };

  const openSignin = () => {
    setInitialFormType('signin');
    setAuthRedirectTo('/communication/start');
    setShowModal(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('showLogin') === 'true') {
      setInitialFormType('signin');
      setAuthRedirectTo(sanitizeAuthRedirect(params.get('next'), '/communication/start'));
      setShowModal(true);
      window.history.replaceState({}, '', '/communication');
    }
  }, []);

  return (
    <>
    <main className="min-h-[calc(100vh-3rem)] bg-white text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10 xl:px-12" aria-label="Communication landing navigation">
          <Link href="/communication" className="flex min-w-0 items-center gap-2.5" aria-label="CareerBot Communication home">
            <Image
              src="/assets/icons/Logo.png"
              alt="CareerBot"
              width={44}
              height={44}
              className="shrink-0 object-contain"
              priority
            />
            <p className="text-base font-black leading-none text-[#2557a7] sm:text-lg">CareerBot</p>
          </Link>

          <div className="hidden items-center gap-6 lg:flex">
            <a href="#assessments" className="text-sm font-bold text-slate-600 transition hover:text-[#2557a7]">Assessments</a>
            <a href="#integrity" className="text-sm font-bold text-slate-600 transition hover:text-[#2557a7]">Integrity</a>
            <a href="#experience" className="text-sm font-bold text-slate-600 transition hover:text-[#2557a7]">Experience</a>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={openSignin} className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#2557a7]/30 hover:text-[#2557a7] focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:ring-offset-2">Sign In</button>
            <button type="button" onClick={openSignup} className="hidden items-center justify-center gap-2 rounded-full bg-[#2557a7] px-5 py-2.5 text-sm font-black text-white shadow-md shadow-[#2557a7]/20 transition hover:bg-[#1e4a94] focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:ring-offset-2 sm:inline-flex">Start Free<ArrowRight size={16} /></button>
          </div>
        </nav>
      </header>

      <section className="px-5 py-8 sm:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[32px] border border-slate-200 bg-[#f8fbff] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="relative grid grid-cols-1 gap-8 overflow-hidden px-6 py-10 sm:px-10 lg:grid-cols-[0.92fr_1.08fr] lg:px-12 lg:py-14">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-80"
              style={{
                background:
                  'linear-gradient(135deg, rgba(37,87,167,0.12) 0%, rgba(255,255,255,0) 45%, rgba(37,87,167,0.08) 100%)',
              }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(37,87,167,0.1) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />

            <div className="relative flex flex-col justify-center">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#2557a7]/15 bg-white px-3 py-1.5 text-xs font-black text-[#2557a7] shadow-sm">
                  <Sparkles size={14} />
                  AI communication readiness
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 shadow-sm">
                  <ShieldCheck size={14} />
                  Proctored candidate flow
                </span>
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-[1.05] text-slate-950 sm:text-5xl lg:text-6xl">
                Communication readiness, measured with hiring-grade precision
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Evaluate spoken English, listening, grammar, and comprehension through a structured assessment experience designed for serious interview preparation and candidate screening.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={openSignup} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2557a7] px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-[#2557a7]/20 transition hover:bg-[#1e4a94] focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:ring-offset-2">Start readiness check<ArrowRight size={17} /></button>
                <a
                  href="#assessments"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3.5 text-sm font-black text-slate-700 shadow-sm transition hover:border-[#2557a7]/30 hover:text-[#2557a7] focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:ring-offset-2"
                >
                  Explore assessment
                </a>
              </div>

              <div className="mt-10 grid max-w-2xl grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
                {heroStats.map((item) => (
                  <div key={item.label} className="px-4 py-4">
                    <p className="text-3xl font-black leading-none text-[#2557a7]">{item.value}</p>
                    <p className="mt-2 text-xs font-bold leading-4 text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex items-center justify-center lg:justify-end">
              <div className="w-full max-w-[660px] rounded-[28px] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/80">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <p className="text-xs font-black uppercase text-slate-400">Candidate profile</p>
                      <h2 className="mt-1 text-xl font-black text-slate-950">Communication Readiness</h2>
                    </div>
                    <span className="rounded-full border border-[#2557a7]/15 bg-white px-3 py-1 text-xs font-black text-[#2557a7]">
                      In progress
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[0.86fr_1.14fr]">
                    <div className="rounded-2xl border border-[#2557a7]/10 bg-white p-5 shadow-sm">
                      <p className="text-xs font-black uppercase text-slate-400">Readiness score</p>
                      <div className="mt-4 flex items-end gap-2">
                        <span className="text-6xl font-black leading-none text-[#2557a7]">88</span>
                        <span className="pb-1 text-sm font-black text-slate-500">/100</span>
                      </div>
                      <div className="mt-6 space-y-4">
                        {readinessMetrics.map((metric) => (
                          <div key={metric.label}>
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span className="font-bold text-slate-700">{metric.label}</span>
                              <span className="font-black text-slate-950">{metric.value}</span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-[#2557a7]" style={{ width: metric.width }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {platformSignals.map((signal, index) => (
                        <div key={signal} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2557a7]/5 text-[#2557a7]">
                            {index === 0 ? <Mic2 size={18} /> : index === 1 ? <Headphones size={18} /> : index === 2 ? <Languages size={18} /> : index === 3 ? <FileText size={18} /> : <ClipboardCheck size={18} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-slate-950">{signal}</p>
                            <p className="text-xs font-semibold text-slate-500">Measured during assessment</p>
                          </div>
                          <CheckCircle2 size={17} className="text-[#2557a7]" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 sm:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto -mt-3 grid max-w-7xl grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-xl shadow-slate-200/70 md:grid-cols-[260px_1fr] md:items-center">
          <div className="border-b border-slate-200 pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-6">
            <p className="text-sm font-black text-slate-950">Built for readiness decisions</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">A compact profile across core communication dimensions.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {platformSignals.map((signal) => (
              <div key={signal} className="rounded-xl bg-[#2557a7]/5 px-3 py-3 text-center text-xs font-black text-[#2557a7]">
                {signal}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="assessments" className="bg-[#f8fbff] px-5 py-16 sm:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-wide text-[#2557a7]">Assessment coverage</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
              A complete communication profile without a noisy test experience
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Each module is focused, measurable, and easy for candidates to understand before they begin.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {assessmentCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#2557a7]/30 hover:shadow-xl hover:shadow-slate-200/80">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2557a7]/5 text-[#2557a7] transition group-hover:bg-[#2557a7] group-hover:text-white">
                    <Icon size={24} />
                  </div>
                  <h3 className="mt-5 text-lg font-black text-slate-950">{card.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{card.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="integrity" className="px-5 py-16 sm:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-[#2557a7]">Integrity and control</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
              Enterprise-grade guardrails for remote communication assessments
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              The test experience is designed to keep candidates focused, protect session quality, and reduce avoidable setup friction before spoken responses begin.
            </p>
            <button type="button" onClick={openSignup} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#2557a7] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#2557a7]/20 transition hover:bg-[#1e4a94]">Generate assessment<ArrowRight size={17} /></button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {integrityFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2557a7]/5 text-[#2557a7]">
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-4 text-base font-black text-slate-950">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="experience" className="bg-[#f8fbff] px-5 py-16 sm:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-wide text-[#2557a7]">Candidate experience</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
              Serious assessment quality with a simple candidate path
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {experienceFeatures.map((feature, index) => (
              <article key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2557a7]/5 text-sm font-black text-[#2557a7]">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3 className="mt-5 text-base font-black text-slate-950">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{feature.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="assessment-map" className="px-5 py-16 sm:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-[#2557a7]">Assessment map</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
              Seven sections, one coherent readiness journey
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
              {assessmentSections.map((section, index) => (
                <article key={section} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-sm font-black ${index % 2 === 0 ? 'border-[#2557a7]/10 bg-[#2557a7]/5 text-[#2557a7]' : 'border-slate-200 bg-slate-50 text-slate-900'}`}>
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-950">{section}</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Sequential communication checkpoint</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
              <div className="border-b border-[#2557a7]/10 bg-[#eef4ff] p-6 text-slate-950">
                <p className="text-xs font-black uppercase text-[#2557a7]">Ready when you are</p>
                <h2 className="mt-2 text-2xl font-black leading-tight">Generate your communication test</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Sign in to create a fresh assessment and continue into the existing setup flow.
                </p>
              </div>

              <div className="space-y-5 p-6">
                {[
                  'Auto-fills your CareerBot account email',
                  'Lets you choose Easy, Medium, or Hard',
                  'Generates a fresh assessment before section review',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#2557a7]" />
                    <p className="text-sm font-semibold leading-6 text-slate-700">{item}</p>
                  </div>
                ))}

                <button type="button" onClick={openSignup} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#2557a7] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-[#2557a7]/20 transition hover:bg-[#1e4a94] focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:ring-offset-2">Continue to setup<ArrowRight size={17} /></button>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/70 sm:p-10">
          <p className="text-sm font-black uppercase tracking-wide text-[#2557a7]">Final readiness snapshot</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
            Turn communication practice into a measurable profile before the next interview
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {heroStats.map((item) => (
              <div key={item.label} className="rounded-2xl bg-[#2557a7]/5 px-5 py-6">
                <p className="text-4xl font-black text-[#2557a7]">{item.value}</p>
                <p className="mt-2 text-sm font-bold text-slate-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>      </main>
      <SignUpModal
        open={showModal}
        onClose={() => setShowModal(false)}
        initialFormType={initialFormType}
        redirectTo={authRedirectTo}
      />
    </>
  );
}