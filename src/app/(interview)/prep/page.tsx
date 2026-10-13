"use client";

import Image from "next/image";
import Link from "next/link";
import LandingNavbar from "@/app/(landing)/_components/LandingNavbar";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  FileText,
  Mic,
  ShieldCheck,
  Users,
} from "lucide-react";

const proofPoints = [
  "Resume-aware answers",
  "English phrasing support",
  "Voice practice with feedback",
  "Managerial, technical, and HR coverage",
];

const workflow = [
  {
    title: "Generate from your resume",
    body: "CareerBOT reads your resume context and turns it into interview-ready notes, not generic sample answers.",
  },
  {
    title: "Refine your speaking structure",
    body: "Use clear scripts, transitions, power phrases, and recovery lines before moving into spoken practice.",
  },
  {
    title: "Practice with less guidance",
    body: "Move from full notes to keywords-only recall so your answers sound prepared without sounding memorized.",
  },
  {
    title: "Improve after every answer",
    body: "Record your response and review feedback for clarity, structure, coverage, confidence, and timing.",
  },
];

const modules = [
  {
    title: "Interview Notes",
    description: "Self-introduction, project explanations, HR answers, strengths, weaknesses, and role-specific talking points.",
    href: "/notes/generate",
    icon: FileText,
  },
  {
    title: "English Essentials",
    description: "Clean openers, transitions, recovery phrases, closing lines, and interview-safe English patterns.",
    href: "/notes/english",
    icon: BookOpen,
  },
  {
    title: "Managerial Practice",
    description: "Leadership, ownership, conflict, ambiguity, stakeholder decisions, and STAR-style storytelling.",
    href: "/notes/managerial",
    icon: Mic,
  },
  {
    title: "Technical Practice",
    description: "Approach, assumptions, constraints, trade-offs, edge cases, and precise technical explanations.",
    href: "/notes/technical",
    icon: Code2,
  },
  {
    title: "HR Practice",
    description: "Recruiter screens, motivation, culture fit, teamwork, salary readiness, and final-fit conversations.",
    href: "/notes/hr",
    icon: Users,
  },
];

const answerSystem = [
  "What to say first",
  "Which proof point to use",
  "How to structure the answer",
  "What the interviewer should remember",
  "Where your answer sounds weak",
  "How to make it sound more natural",
];

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2557a7]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black leading-tight text-gray-950 sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base font-medium leading-7 text-gray-600">{body}</p>
    </div>
  );
}

export default function NotesLandingPage() {
  return (
    <>
      <LandingNavbar />
      <main className="bg-white text-gray-950">
        <section className="relative isolate overflow-hidden border-b border-gray-200 bg-white">
          <Image
            src="/images/landing/mock-interview-promo.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="pointer-events-none -z-10 object-cover opacity-[0.08] grayscale"
          />
          <div className="absolute inset-0 -z-10 bg-white/88" />
          <div className="mx-auto flex min-h-[calc(100vh-96px)] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#2557a7]/20 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#2557a7] shadow-sm">
                <ShieldCheck size={14} />
                Interview notes and answer practice
              </div>

              <h1 className="max-w-5xl text-4xl font-black leading-[1.02] tracking-normal text-gray-950 sm:text-6xl lg:text-[74px]">
                Interview notes that turn your resume into confident answers.
              </h1>

              <p className="mt-6 max-w-3xl text-lg font-medium leading-8 text-gray-600 sm:text-xl">
                Build role-aware scripts, improve your English phrasing, and practice managerial, technical, and HR answers before the real interview.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/notes/generate"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#2557a7] px-6 text-sm font-black text-white shadow-[0_18px_38px_rgba(37,87,167,0.24)] transition hover:bg-[#1f4b91]"
                >
                  Generate my notes
                  <ArrowRight size={17} />
                </Link>
                <Link
                  href="/notes/english"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-gray-300 bg-white px-6 text-sm font-black text-gray-800 transition hover:border-[#2557a7]/45 hover:text-[#2557a7]"
                >
                  View English essentials
                </Link>
              </div>
            </div>

            <div className="mt-12 grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {proofPoints.map((point) => (
                <div key={point} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <CheckCircle2 size={17} className="shrink-0 text-[#2557a7]" />
                  <p className="text-sm font-bold text-gray-700">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-gray-200 bg-gray-50">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="flex flex-col justify-center">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2557a7]">Why notes matter</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-gray-950 sm:text-4xl">
                Most candidates do not fail because they lack experience.
              </h2>
              <p className="mt-4 text-base font-medium leading-7 text-gray-600">
                They fail because their answers are scattered, too generic, too long, or hard to believe under pressure. Notes gives your experience a structure you can actually speak.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Before</p>
                <h3 className="mt-3 text-xl font-black text-gray-950">Unstructured preparation</h3>
                <ul className="mt-5 space-y-3 text-sm font-medium leading-6 text-gray-600">
                  <li>Generic answers copied from examples</li>
                  <li>Strong experience hidden behind weak delivery</li>
                  <li>No clear way to practice recall</li>
                  <li>Answers that drift beyond the question</li>
                </ul>
              </div>
              <div className="rounded-xl border border-[#2557a7]/25 bg-white p-5 shadow-[0_18px_45px_rgba(37,87,167,0.10)]">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2557a7]">After</p>
                <h3 className="mt-3 text-xl font-black text-gray-950">Resume-backed answer system</h3>
                <ul className="mt-5 space-y-3 text-sm font-medium leading-6 text-gray-700">
                  <li>Role-aware scripts based on your background</li>
                  <li>Clear structure for each common interview area</li>
                  <li>Voice practice with notes, then keywords only</li>
                  <li>Feedback that improves the next attempt</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="How it works"
              title="A focused workflow from resume to spoken answer."
              body="The product is designed around one outcome: helping you explain your experience clearly when an interviewer asks."
            />

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {workflow.map((step, index) => (
                <div key={step.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#2557a7] text-sm font-black text-white">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-black text-gray-950">{step.title}</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-gray-600">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-gray-200 bg-gray-50">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:px-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
              <div className="border-b border-gray-200 pb-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2557a7]">Generated note</p>
                <h3 className="mt-2 text-2xl font-black text-gray-950">Tell me about yourself</h3>
              </div>
              <div className="space-y-4 py-5">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Opening</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-gray-700">
                    Start with your current role, strongest technical area, and the kind of problems you have solved.
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Proof</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-gray-700">
                    Mention one project, one measurable outcome, and one skill that connects directly to the target role.
                  </p>
                </div>
                <div className="rounded-xl border border-[#2557a7]/20 bg-[#2557a7]/5 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2557a7]">Practice cue</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-gray-950">
                    Keep it under 90 seconds. End with why this role is the natural next step.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2557a7]">What you get</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-gray-950 sm:text-4xl">
                More than notes. A system for answering under pressure.
              </h2>
              <p className="mt-4 text-base font-medium leading-7 text-gray-600">
                Each section is built to help you know what to say, why it matters, and how to make it sound credible in your own voice.
              </p>
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {answerSystem.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
                    <CheckCircle2 size={16} className="shrink-0 text-[#2557a7]" />
                    <p className="text-sm font-bold text-gray-800">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Practice coverage"
              title="Prepare for every high-signal interview conversation."
              body="Use one connected notes workspace across English, managerial, technical, and HR interview preparation."
            />

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <Link
                    key={module.title}
                    href={module.href}
                    className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:border-[#2557a7]/35 hover:shadow-[0_18px_44px_rgba(15,23,42,0.08)]"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2557a7]/8 text-[#2557a7]">
                        <Icon size={19} />
                      </div>
                      <ArrowRight size={16} className="text-gray-300 transition group-hover:text-[#2557a7]" />
                    </div>
                    <h3 className="text-base font-black text-gray-950">{module.title}</h3>
                    <p className="mt-3 text-sm font-medium leading-6 text-gray-600">{module.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-gray-950 px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-300">Start prepared</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Walk into your next interview with answers you can trust.
            </h2>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-gray-300">
              Generate your notes first, then practice until your answers sound clear, specific, and natural.
            </p>
            <Link
              href="/notes/generate"
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#2557a7] px-6 text-sm font-black text-white transition hover:bg-[#1f4b91]"
            >
              Generate interview notes
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
