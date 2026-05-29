import Link from "next/link";
import {
  Upload,
  Brain,
  Download,
  Target,
  CheckCircle2,
  Zap,
  BarChart2,
  Sparkles,
  ArrowRight,
  PenLine,
  LayoutTemplate,
  TrendingUp,
  Clock,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import StatsBar from "@/components/landing/StatsBar";
import HowItWorks from "@/components/landing/HowItWorks";
import FeatureGrid from "@/components/landing/FeatureGrid";
import CTASection from "@/components/landing/CTASection";

export default function ResumeLandingPage() {
  return (
    <main
      className="min-h-screen bg-white"
      style={{ fontFamily: "var(--font-montserrat, Montserrat, sans-serif)" }}
    >
      {/* ── 1. HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #2d5f7f 50%, #2557a7 100%)",
        }}
      >
        <div
          className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full opacity-10 pointer-events-none -translate-y-1/2 translate-x-1/3"
          style={{ backgroundColor: "#5896d7" }}
        />
        <div
          className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-10 pointer-events-none translate-y-1/2 -translate-x-1/4"
          style={{ backgroundColor: "#5896d7" }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-20 lg:py-28">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-full w-fit text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                AI Resume Enhancement &amp; Builder
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                Your Resume,{" "}
                <span className="text-yellow-300">Supercharged by AI</span>
              </h1>

              <p className="text-lg text-blue-100 leading-relaxed max-w-xl">
                Already have a resume? Let AI fix, rewrite, and optimise it in seconds.
                Starting fresh? Build a professional, ATS-ready resume with our guided builder
                — both completely free.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  href="/builder/start?action=enhance"
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-white font-bold text-sm transition-opacity hover:opacity-90 shadow-lg"
                  style={{ color: "#2557a7" }}
                >
                  <Sparkles className="w-4 h-4" />
                  Enhance My Resume — Free
                </Link>
                <Link
                  href="/builder/start"
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl font-semibold text-sm border-2 border-white/40 text-white hover:bg-white/10 transition-colors"
                >
                  <PenLine className="w-4 h-4" />
                  Build New Resume
                </Link>
              </div>

              <p className="text-xs text-blue-200">
                No credit card required · PDF &amp; DOCX · Results in under 60 seconds
              </p>
            </div>

            {/* Right: before/after teaser */}
            <div className="flex-shrink-0 flex flex-col gap-3 w-full max-w-sm">
              <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-red-400">
                <span className="text-xs font-bold text-red-500 uppercase tracking-wide">Before</span>
                <p className="mt-2 text-sm text-gray-600 italic leading-relaxed">
                  &ldquo;I am passinate to learn new things and want to work in a good company.&rdquo;
                </p>
              </div>
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shadow" style={{ backgroundColor: "#2557a7" }}>
                  <ArrowRight className="w-4 h-4 text-white rotate-90" />
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-green-500">
                <span className="text-xs font-bold text-green-600 uppercase tracking-wide">After AI Enhancement</span>
                <p className="mt-2 text-sm text-gray-800 font-medium leading-relaxed">
                  &ldquo;Results-driven engineer with proven AI/ML expertise, reducing processing time by 40%.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. STATS BAR ── */}
      <StatsBar
        items={[
          { icon: Users,      value: "50K+",   label: "resumes enhanced and built on CareerBot" },
          { icon: TrendingUp, value: "3×",     label: "more interview callbacks with an AI-optimised resume" },
          { icon: Clock,      value: "60 sec", label: "average time to get a fully enhanced resume" },
        ]}
      />

      {/* ── 3. TWO PATHS ── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Two Ways to a Better Resume</h2>
            <p className="mt-3 text-gray-500 text-base">Start where you are — we handle the rest</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enhance card */}
            <div className="bg-white rounded-2xl shadow-md border border-blue-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-blue-50" style={{ backgroundColor: "#eff6ff" }}>
                <div className="flex items-center gap-3 mb-1">
                  <Sparkles className="w-5 h-5" style={{ color: "#2557a7" }} />
                  <span className="text-sm font-black text-gray-900 uppercase tracking-wide">Enhance Existing Resume</span>
                </div>
                <p className="text-xs text-gray-500">Already have a resume? AI rewrites it in 60 seconds.</p>
              </div>
              <div className="p-6 flex flex-col gap-3">
                {[
                  "Upload PDF or DOCX — we parse it instantly",
                  "AI fixes grammar, typos, and weak language",
                  "Missing ATS keywords added automatically",
                  "Quantified achievements injected for impact",
                  "Download polished PDF, ready to submit",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-green-500" />
                    {item}
                  </div>
                ))}
                <Link
                  href="/builder/start?action=enhance"
                  className="mt-4 inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#2557a7" }}
                >
                  <Sparkles className="w-4 h-4" />
                  Enhance My Resume
                </Link>
              </div>
            </div>

            {/* Build card */}
            <div className="bg-white rounded-2xl shadow-md border border-purple-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-purple-50" style={{ backgroundColor: "#f5f3ff" }}>
                <div className="flex items-center gap-3 mb-1">
                  <PenLine className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-black text-gray-900 uppercase tracking-wide">Build New Resume</span>
                </div>
                <p className="text-xs text-gray-500">Starting from scratch? Our guided builder has you covered.</p>
              </div>
              <div className="p-6 flex flex-col gap-3">
                {[
                  "Choose from 5 professional, ATS-friendly templates",
                  "Guided section-by-section editor",
                  "Live ATS score updates as you type",
                  "AI suggestions on bullet points and summary",
                  "One-click PDF export — no watermarks",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-purple-500" />
                    {item}
                  </div>
                ))}
                <Link
                  href="/builder/start"
                  className="mt-4 inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl font-bold text-sm border-2 transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#7c3aed", color: "#7c3aed" }}
                >
                  <PenLine className="w-4 h-4" />
                  Build New Resume
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS ── */}
      <HowItWorks
        heading="How It Works"
        subheading="Enhance or build — three steps either way"
        steps={[
          {
            icon: Upload,
            title: "Upload or Start Fresh",
            desc: "Upload your existing PDF/DOCX to enhance it, or start the guided builder to create one from scratch.",
          },
          {
            icon: Brain,
            title: "AI Analyses & Rewrites",
            desc: "Our AI fixes language, adds keywords, quantifies achievements, and scores your ATS compatibility.",
          },
          {
            icon: Download,
            title: "Download & Apply",
            desc: "Get your polished, ATS-optimised resume as a professional PDF — ready to submit in minutes.",
          },
        ]}
      />

      {/* ── 5. FEATURE GRID ── */}
      <FeatureGrid
        heading="Everything Included — Free"
        subheading="Professional resume tools that used to cost hundreds"
        features={[
          {
            icon: Sparkles,
            title: "AI Rewriting",
            desc: "Full section rewrites: summary, experience bullets, skills — all upgraded by AI instantly.",
          },
          {
            icon: Target,
            title: "ATS Keywords",
            desc: "Injects industry keywords so your resume clears automated screening every time.",
          },
          {
            icon: CheckCircle2,
            title: "Grammar & Spelling",
            desc: "Catches every typo, grammar error, and inconsistency before recruiters see them.",
          },
          {
            icon: LayoutTemplate,
            title: "5 Pro Templates",
            desc: "Classic, Modern, Minimal, Creative, Executive — all ATS-friendly and recruiter-approved.",
          },
          {
            icon: BarChart2,
            title: "Live ATS Score",
            desc: "Real-time compatibility score updates as you apply fixes — see your improvement instantly.",
          },
          {
            icon: Zap,
            title: "PDF Export",
            desc: "Download a pixel-perfect, print-ready PDF with one click. No watermarks, ever.",
          },
        ]}
      />

      {/* ── 6. BEFORE / AFTER DEMO ── */}
      <section
        className="py-20"
        style={{ background: "linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%)" }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">See the Difference</h2>
            <p className="mt-3 text-gray-500 text-base">Real AI-powered improvements on a sample resume</p>
          </div>

          <div className="relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
              <Badge variant="warning" className="shadow-md px-4">Demo Preview</Badge>
            </div>
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
              <div className="p-6 sm:p-8">
                <div
                  className="rounded-xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  style={{ backgroundColor: "#eff6ff" }}
                >
                  <div>
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">ATS Score Improvement</p>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-black text-red-500">45</span>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                      <span className="text-3xl font-black text-green-600">89</span>
                      <Badge variant="success" className="ml-2">+44 pts</Badge>
                    </div>
                  </div>
                  <div className="flex gap-4 text-center">
                    <div>
                      <p className="text-2xl font-black" style={{ color: "#2557a7" }}>31</p>
                      <p className="text-xs text-gray-500">improvements</p>
                    </div>
                    <div className="w-px bg-blue-200" />
                    <div>
                      <p className="text-2xl font-black text-green-600">10</p>
                      <p className="text-xs text-gray-500">ATS fixes</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-red-100 overflow-hidden">
                    <div className="px-4 py-2 bg-red-50 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Before</span>
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                      <div>
                        <p className="text-xs text-gray-400 uppercase mb-1 font-semibold">Summary</p>
                        <p className="text-xs text-gray-600 italic bg-red-50 border border-red-100 rounded px-2 py-1.5">
                          I am passinate to learn new things and work in a good company.
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase mb-1 font-semibold">Skills</p>
                        <p className="text-xs text-gray-600 italic bg-red-50 border border-red-100 rounded px-2 py-1.5">
                          Python, some javascript, Databases, etc.
                        </p>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        <Badge variant="destructive" className="text-[10px]">Typos</Badge>
                        <Badge variant="destructive" className="text-[10px]">Weak language</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-green-100 overflow-hidden">
                    <div className="px-4 py-2 bg-green-50 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs font-bold text-green-600 uppercase tracking-wide">After AI</span>
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                      <div>
                        <p className="text-xs text-gray-400 uppercase mb-1 font-semibold">Summary</p>
                        <p className="text-xs text-gray-800 font-medium bg-green-50 border border-green-100 rounded px-2 py-1.5">
                          Results-driven engineer with AI/ML expertise, reducing processing time by 40%.
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase mb-1 font-semibold">Skills</p>
                        <p className="text-xs text-gray-800 font-medium bg-green-50 border border-green-100 rounded px-2 py-1.5">
                          Python, JavaScript (ES6+), PostgreSQL, MongoDB, Docker
                        </p>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        <Badge variant="success" className="text-[10px]">Fixed</Badge>
                        <Badge variant="success" className="text-[10px]">ATS keywords</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. FINAL CTA ── */}
      <CTASection
        heading="Ready for a Resume That Gets You Hired?"
        subtext="Join 50,000+ job seekers who used CareerBot to enhance or build their resume and landed more interviews. Start free — no credit card needed."
        buttonText="Get Started Free"
        buttonHref="/enhancer/start"
        buttonIcon={Sparkles}
        note="Enhance existing · Build from scratch · PDF export · No credit card"
      />
    </main>
  );
}