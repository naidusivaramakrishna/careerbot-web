"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  LayoutTemplate,
  PenLine,
  ScanSearch,
  Sparkles,
  Target,
  Upload,
  Wand2,
} from "lucide-react";
import LandingFooter from "@/app/_components/LandingFooter";
import SignUpModal from "@/components/SignUpModal";

const proofStats = [
  { value: "12,400+", label: "job seekers" },
  { value: "18+", label: "ATS templates" },
  { value: "PDF", label: "export ready" },
  { value: "Free", label: "plan available" },
];

const paths = [
  {
    icon: Upload,
    title: "Enhance an existing resume",
    description: "Upload your resume, fix weak wording, improve ATS readability, and get a cleaner version faster.",
    cta: "Enhance My Resume",
    href: "/builder/start?action=enhance",
    accent: "from-[#2557a7] to-[#0f766e]",
    checks: ["Upload PDF or DOCX", "AI rewrites weak bullets", "Keyword and formatting guidance"],
  },
  {
    icon: PenLine,
    title: "Build a new resume",
    description: "Start from an ATS-friendly template and follow guided sections with AI suggestions as you write.",
    cta: "Build New Resume",
    href: "/builder/start",
    accent: "from-[#2557a7] to-[#1e4a94]",
    checks: ["Guided resume sections", "Template-first workflow", "Ready-to-export document"],
  },
];

const improvementCards = [
  {
    icon: Wand2,
    title: "AI bullet rewrites",
    description: "Turns generic responsibilities into stronger achievement-focused bullets.",
  },
  {
    icon: ScanSearch,
    title: "ATS readability",
    description: "Checks sections, formatting, missing details, and resume structure before export.",
  },
  {
    icon: Target,
    title: "Role relevance",
    description: "Helps align your summary, skills, and experience with the job you want.",
  },
  {
    icon: LayoutTemplate,
    title: "Professional templates",
    description: "Start with clean role-based layouts built for recruiter scanning.",
  },
  {
    icon: BarChart3,
    title: "Live score signals",
    description: "See what improved and what still needs attention while you work.",
  },
  {
    icon: Download,
    title: "Export ready",
    description: "Download a polished resume when you are ready to apply.",
  },
];

const steps = [
  {
    icon: Upload,
    title: "Start with upload or template",
    description: "Bring an existing resume or create one from scratch with a guided builder.",
  },
  {
    icon: Sparkles,
    title: "Improve with AI suggestions",
    description: "Fix weak wording, missing details, formatting issues, and low-impact bullets.",
  },
  {
    icon: Download,
    title: "Export and apply",
    description: "Finish with a recruiter-ready resume that is easier to scan and submit.",
  },
];

const navItems = [
  { id: "overview", label: "Overview" },
  { id: "choose-path", label: "Build or Enhance" },
  { id: "quality-checks", label: "Quality Checks" },
];

function HeroMock() {
  return (
    <div className="relative mx-auto w-full max-w-[500px]">
      <div className="absolute -left-4 -top-4 hidden rounded-full border border-white bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-lg sm:flex">
        ATS-ready structure
      </div>
      <div className="absolute -bottom-4 -right-4 hidden rounded-full border border-white bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-lg sm:flex">
        AI suggestions included
      </div>

      <div className="overflow-hidden rounded-3xl border border-white bg-white shadow-2xl shadow-blue-200/70 ring-1 ring-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-slate-900">Resume workspace</span>
          </div>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#2557a7]">
            Live review
          </span>
        </div>

        <div className="grid grid-cols-1 gap-0 sm:grid-cols-[190px_1fr]">
          <div className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white p-4 sm:border-b-0 sm:border-r">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
              <div className="relative aspect-[3/4]">
                <Image
                  src="/assets/templates/software_engineering.png"
                  alt="Resume template preview"
                  fill
                  className="object-cover object-top"
                  sizes="190px"
                  priority
                />
              </div>
            </div>
          </div>

          <div className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AI resume review</p>
            <div className="mt-3 flex items-end gap-1">
              <span className="text-5xl font-black leading-none text-[#2557a7]">87</span>
              <span className="pb-1 text-lg font-semibold text-slate-400">/100</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-[#2557a7] to-emerald-500" />
            </div>

            <div className="mt-5 space-y-3">
              {[
                ["Keywords", "92%", "bg-emerald-500"],
                ["Format", "78%", "bg-amber-400"],
                ["Impact", "89%", "bg-[#2557a7]"],
              ].map(([label, value, color]) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-16 text-xs font-medium text-slate-600">{label}</span>
                  <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${color}`} style={{ width: value }} />
                  </div>
                  <span className="w-9 text-right text-xs font-semibold text-slate-700">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-3">
              <p className="text-xs font-semibold text-blue-900">Suggested rewrite</p>
              <p className="mt-1 text-xs leading-relaxed text-blue-700">
                Add measurable delivery outcomes to make this experience stronger.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResumeLandingPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [showSignin, setShowSignin] = useState(false);

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    const updateActiveSection = () => {
      const current = sections
        .map((section) => ({
          id: section.id,
          distance: Math.abs(section.getBoundingClientRect().top - 96),
          isPastTop: section.getBoundingClientRect().top <= 120,
        }))
        .filter((section) => section.isPastTop)
        .sort((a, b) => a.distance - b.distance)[0];

      if (current) {
        setActiveSection(current.id);
      } else {
        setActiveSection("overview");
      }
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  return (
    <>
    <main className="min-h-screen bg-white" style={{ fontFamily: "var(--font-montserrat, Montserrat, sans-serif)" }}>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-1.5 transition-opacity hover:opacity-80" aria-label="CareerBot home">
            <Image
              src="/assets/icons/Logo.png"
              alt="CareerBot"
              width={46}
              height={46}
              className="shrink-0"
              style={{ filter: "hue-rotate(8deg) saturate(130%) brightness(68%)" }}
              priority
            />
            <span className="text-lg font-black tracking-tight text-[#2557a7]">CareerBOT</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={`#${item.id}`}
                aria-current={activeSection === item.id ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                  activeSection === item.id
                    ? "bg-blue-50 text-[#2557a7]"
                    : "text-slate-700 hover:bg-blue-50 hover:text-[#2557a7]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSignin(true)}
              className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-[#2557a7] sm:inline-flex"
            >
              Sign In
            </button>
            <Link
              href="/builder/start"
              className="inline-flex items-center gap-2 rounded-full bg-[#2557a7] px-4 py-2 text-sm font-bold text-white shadow-[0_6px_18px_rgba(37,87,167,0.22)] transition-all hover:bg-[#1e4a94] active:scale-95"
            >
              Start Free
              <ArrowRight size={14} />
            </Link>
          </div>
        </nav>
      </header>

      <section id="overview" className="relative scroll-mt-20 overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#eef6ff_48%,#eaf7f5_100%)] pb-20 pt-10 lg:pb-24 lg:pt-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(37,87,167,0.08) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#2557a7] shadow-sm">
                <Sparkles size={14} />
                AI Resume Builder & Enhancer
              </div>

              <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Build or improve your resume with{" "}
                <span className="bg-gradient-to-r from-[#2557a7] to-teal-600 bg-clip-text text-transparent">
                  AI that feels practical
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
                Start from a template or enhance your current resume. CareerBot helps you improve structure,
                wording, ATS readability, and export readiness in one focused workflow.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/builder/start"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2557a7] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-[#1e4a94]"
                >
                  Start Free
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/#template-gallery"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 transition-all hover:border-[#2557a7] hover:bg-blue-50 hover:text-[#2557a7]"
                >
                  View Templates
                </Link>
              </div>

              <p className="mt-3 text-xs font-medium text-slate-500">
                Free plan available. No credit card required. PDF export ready.
              </p>
            </div>

            <HeroMock />
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-10 pb-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 md:grid-cols-4">
          {proofStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white bg-white/90 p-4 text-center shadow-lg shadow-blue-100/70 ring-1 ring-blue-100/70 backdrop-blur">
              <p className="bg-gradient-to-r from-[#2557a7] to-teal-600 bg-clip-text text-2xl font-black text-transparent">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="choose-path" className="scroll-mt-20 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] pb-24 pt-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <span className="rounded-full border border-blue-100 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#2557a7] shadow-sm">
                Choose Your Path
              </span>
              <h2 className="mt-5 bg-gradient-to-r from-slate-950 via-[#2557a7] to-teal-600 bg-clip-text text-3xl font-black tracking-tight text-transparent md:text-4xl">
                Start where your resume is today
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-relaxed text-slate-500 lg:justify-self-end">
              This page should not repeat the homepage. It should make one product decision easy:
              enhance what you have, or build a clean resume from scratch.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {paths.map((path) => {
              const Icon = path.icon;
              return (
                <div key={path.title} className="group overflow-hidden rounded-3xl border border-white bg-white shadow-xl shadow-slate-200/70 ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-100/70">
                  <div className={`bg-gradient-to-r ${path.accent} p-6 text-white`}>
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                      <Icon size={22} />
                    </div>
                    <h3 className="text-2xl font-black">{path.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/85">{path.description}</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {path.checks.map((check) => (
                        <div key={check} className="flex items-center gap-2.5 text-sm text-slate-700">
                          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                          {check}
                        </div>
                      ))}
                    </div>
                    <Link
                      href={path.href}
                      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-[#2557a7]"
                    >
                      {path.cta}
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="quality-checks" className="scroll-mt-20 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#eef6ff_100%)] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="rounded-full border border-blue-100 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#2557a7] shadow-sm">
                Resume Quality Checks
              </span>
              <h2 className="mt-5 max-w-2xl bg-gradient-to-r from-slate-950 via-[#2557a7] to-teal-600 bg-clip-text text-3xl font-black tracking-tight text-transparent md:text-4xl">
                A cleaner resume, not just prettier formatting
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-500">
              These cards are specific to the builder/enhancer workflow, so the page has its own purpose beyond the homepage pitch.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {improvementCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-2xl border border-white bg-white p-6 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-100/60">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#2557a7]">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-950">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <span className="rounded-full border border-blue-100 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#2557a7] shadow-sm">
                Builder Flow
              </span>
              <h2 className="mt-5 bg-gradient-to-r from-slate-950 via-[#2557a7] to-teal-600 bg-clip-text text-3xl font-black tracking-tight text-transparent md:text-4xl">
                Simple enough to start, structured enough to finish
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-500">
                Move from messy resume to ready-to-apply document without switching tools or guessing what to fix next.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="flex gap-4 rounded-2xl border border-white bg-gradient-to-br from-white to-slate-50 p-5 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200/80">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2557a7] to-teal-600 text-white shadow-md">
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Step {index + 1}</p>
                      <h3 className="mt-1 text-base font-bold text-slate-950">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-[#2557a7] via-[#173b73] to-[#0f766e] py-24">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <div className="rounded-3xl border border-white/20 bg-white/10 px-6 py-12 shadow-2xl shadow-blue-950/20 backdrop-blur">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
              <FileText size={22} />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              Ready to build a resume you can actually use?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-blue-100">
              Start free, choose your path, and move into the builder when you are ready.
            </p>
            <Link
              href="/builder/start"
              className="mt-8 inline-flex items-center gap-2.5 rounded-xl bg-white px-10 py-4 text-base font-bold text-[#2557a7] shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              Start Free
              <ArrowRight size={17} />
            </Link>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-blue-100">
              <Clock size={14} />
              Free plan available. No credit card required.
            </p>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
    <SignUpModal open={showSignin} onClose={() => setShowSignin(false)} initialFormType="signin" />
    </>
  );
}
