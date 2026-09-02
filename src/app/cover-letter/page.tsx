"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  FileCheck2,
  Layers3,
  LockKeyhole,
  PenLine,
  Sparkles,
  Target,
  UploadCloud,
  WandSparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import LandingFooter from "@/app/(landing)/_components/LandingFooter";
import LandingNavbar from "@/app/(landing)/_components/LandingNavbar";
import SignUpModal from "@/components/SignUpModal";
import { useTenant } from "@/contexts/TenantContext";
import { sanitizeAuthRedirect } from "@/lib/authRedirect";

const assetBase = "/images/cover-letter";

const trustItems = [
  { icon: Sparkles, label: "AI-Powered Writing" },
  { icon: Target, label: "Role-Specific Content" },
  { icon: FileCheck2, label: "ATS-Optimized Format" },
  { icon: BadgeCheck, label: "Recruiter Approved" },
];

const features = [
  {
    icon: Target,
    title: "Tailored to the Role",
    text: "CareerBot reads the job description and builds content that highlights what matters most.",
    tone: "blue",
  },
  {
    icon: FileCheck2,
    title: "Built on Real Evidence",
    text: "We use your actual projects, achievements, and experience to tell your story credibly.",
    tone: "blue",
  },
  {
    icon: Layers3,
    title: "Premium Layouts",
    text: "Choose from modern, ATS-friendly templates designed to impress recruiters.",
    tone: "purple",
  },
  {
    icon: LockKeyhole,
    title: "Private & Secure",
    text: "Your data stays private and secure. We never share your information or content.",
    tone: "blue",
  },
];

const templates = [
  {
    name: "Classic",
    description: "Traditional formatting with clean structure.",
    accent: "bg-[#111827]",
    widthSet: [74, 92, 84, 68, 88, 58],
  },
  {
    name: "Modern",
    description: "Balanced design with subtle style.",
    accent: "bg-[#2557a7]",
    widthSet: [52, 86, 78, 96, 64, 46],
  },
  {
    name: "Compact",
    description: "Concise layout for quick readability.",
    accent: "bg-[#2563eb]",
    widthSet: [62, 76, 92, 72, 88, 54],
  },
  {
    name: "Executive",
    description: "Strong presence for senior professionals.",
    accent: "bg-[#0f172a]",
    widthSet: [86, 72, 96, 82, 64, 76],
  },
  {
    name: "Minimal",
    description: "Clean and simple with focus on content.",
    accent: "bg-[#334155]",
    widthSet: [70, 82, 76, 92, 58, 84],
  },
  {
    name: "Signature",
    description: "Creative touch for personal branding.",
    accent: "bg-[#0f766e]",
    widthSet: [78, 68, 90, 74, 62, 84],
  },
];

const workflowSteps = [
  {
    icon: UploadCloud,
    label: "Select Resume",
    text: "Upload your resume or choose from your saved CareerBot resumes.",
    tone: "purple",
  },
  {
    icon: BriefcaseBusiness,
    label: "Add Job Details",
    text: "Paste the job description and align your letter with the role and company.",
    tone: "blue",
  },
  {
    icon: WandSparkles,
    label: "Generate & Refine",
    text: "AI creates your draft. Review, customize, and export when ready.",
    tone: "green",
  },
];

const benefits = [
  "Personalized for every application",
  "ATS-friendly and recruiter-approved",
  "Saves time, delivers results",
];

export default function CoverLetterPage() {
  const [showModal, setShowModal] = useState(false);
  const [initialFormType, setInitialFormType] = useState<"signup" | "signin">("signup");
  const [authRedirectTo, setAuthRedirectTo] = useState<string | undefined>();
  const { setActiveTenant } = useTenant();

  const openSignup = () => {
    setInitialFormType("signup");
    setShowModal(true);
  };

  const openSignin = () => {
    setInitialFormType("signin");
    setShowModal(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tenantId = params.get("tenant_id");

    if (tenantId) setActiveTenant(tenantId);

    if (params.get("showLogin") === "true") {
      setAuthRedirectTo(sanitizeAuthRedirect(params.get("next")));
      setTimeout(() => openSignin(), 0);
      if (params.get("verified") === "true") {
        sessionStorage.setItem("emailVerified", "true");
      }
      window.history.replaceState({}, "", "/cover-letter");
    }

    const handleOpenLogin = () => openSignin();
    window.addEventListener("openLoginModal", handleOpenLogin);
    return () => window.removeEventListener("openLoginModal", handleOpenLogin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <LandingNavbar onOpenSignup={openSignup} onOpenSignin={openSignin} />
      <main className="min-h-screen bg-white text-[#0f172a]">
        <HeroSection />
        <FeatureCards />
        <TemplateGallery />
        <WorkflowSection />
        <BenefitsSection />
        <SampleOutputSection />
        <FinalCTA />
      </main>
      <LandingFooter
        cta={{
          title: "Ready to send a stronger cover letter?",
          description: "Create a tailored draft from your resume and target role in minutes.",
          href: "/cover-letter/new",
          label: "Create My Cover Letter",
        }}
      />
      <SignUpModal
        open={showModal}
        onClose={() => setShowModal(false)}
        initialFormType={initialFormType}
        redirectTo={authRedirectTo}
      />
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-[#e5e7eb] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
      <div className="mx-auto grid min-h-[680px] max-w-7xl items-center gap-10 px-5 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-14 xl:min-h-[720px]">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#bcd0f3] bg-white px-4 py-2 text-[13px] font-bold uppercase tracking-[0.06em] text-[#2557a7] shadow-sm">
            <Sparkles className="h-4 w-4" />
            AI powered cover letters that get you hired
          </div>
          <h1 className="mt-7 text-[40px] font-bold leading-[1.06] tracking-tight text-[#0f172a] lg:text-[48px] xl:text-[56px]">
            Build a cover letter that <span className="text-[#2557a7]">gets you noticed.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base font-medium leading-7 text-[#334155] xl:text-lg xl:leading-8">
            Create personalized, professional cover letters in minutes. AI-powered content,
            recruiter-approved templates, and tailored to your target role.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/cover-letter/new"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#2557a7] px-6 text-sm font-bold text-white shadow-[0_16px_30px_rgba(37,87,167,0.25)] transition hover:-translate-y-0.5 hover:bg-[#1d4d99]"
            >
              Create My Cover Letter
              <PenLine className="h-4 w-4" />
            </Link>
            <a
              href="#templates"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#cbd5e1] bg-white px-6 text-sm font-bold text-[#2557a7] shadow-sm transition hover:-translate-y-0.5 hover:border-[#2557a7] hover:bg-[#f8fbff]"
            >
              Compare Templates
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-10 grid max-w-lg grid-cols-2 gap-5 sm:grid-cols-4">
            {trustItems.map((item) => (
              <div key={item.label} className="text-center">
                <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-[#d8e6fb] bg-white text-[#2557a7] shadow-sm">
                  <item.icon className="h-[18px] w-[18px]" strokeWidth={2.15} />
                </span>
                <p className="mt-3 text-xs font-bold leading-4 text-[#1e293b]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative min-h-[560px]">
      <div className="absolute left-[-4%] top-4 z-10 w-[58%]">
        <Image
          src={`${assetBase}/hero-illustration-hq-trimmed.png`}
          alt="Applicant holding a resume illustration"
          width={900}
          height={781}
          priority
          className="h-auto w-full object-contain drop-shadow-[0_24px_45px_rgba(37,87,167,0.08)]"
        />
      </div>

      <div className="absolute bottom-[78px] left-[3%] z-20 w-[245px] rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_22px_55px_rgba(37,87,167,0.16)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2557a7]">Input quality</p>
        <p className="mt-2 text-sm font-bold text-[#0f172a]">Resume + Target Role</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#dbe7f5]">
            <div className="h-full w-[94%] rounded-full bg-[#22c55e]" />
          </div>
          <span className="text-sm font-bold text-[#64748b]">94%</span>
        </div>
        <p className="mt-4 text-sm font-medium leading-5 text-[#334155]">
          The draft is grounded in real experience, not generic filler.
        </p>
      </div>

      <div className="absolute right-0 top-0 w-[46%] rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-[0_28px_70px_rgba(37,87,167,0.14)]">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2557a7]">Builder preview</p>
          <span className="rounded-full bg-[#e7f8ef] px-3 py-1 text-xs font-bold text-[#22c55e]">Ready</span>
        </div>
        <h2 className="mt-8 text-xl font-bold text-[#0f172a]">Application letter</h2>
        <PremiumLetterPreview />
        <div className="mt-5 grid grid-cols-2 gap-3">
          <PreviewMetric label="JD Keywords" value="Matched" />
          <PreviewMetric label="Tone" value="Professional" />
        </div>
        <div className="mt-4 rounded-lg border border-[#e5e7eb] bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef4ff] text-[#2557a7]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0f172a]">AI Enhancement</p>
              <p className="mt-1 text-xs font-medium leading-5 text-[#64748b]">
                Smart, relevant & recruiter focused content.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function PremiumIcon({
  icon: Icon,
  tone,
  size,
}: {
  icon: LucideIcon;
  tone: string;
  size: "md" | "lg";
}) {
  const styles = {
    blue: {
      shell: "from-[#eaf2ff] via-white to-[#d8e7ff]",
      glow: "bg-[#2557a7]/18",
      icon: "from-[#4f8df7] to-[#2557a7]",
    },
    purple: {
      shell: "from-[#f1edff] via-white to-[#e4dcff]",
      glow: "bg-[#7c3aed]/16",
      icon: "from-[#9b7cff] to-[#4f46e5]",
    },
    green: {
      shell: "from-[#e9fbf3] via-white to-[#d8f8ea]",
      glow: "bg-[#10b981]/16",
      icon: "from-[#57e5b2] to-[#10b981]",
    },
  }[tone] ?? {
    shell: "from-[#eaf2ff] via-white to-[#d8e7ff]",
    glow: "bg-[#2557a7]/18",
    icon: "from-[#4f8df7] to-[#2557a7]",
  };

  const shellSize = size === "lg" ? "h-24 w-24 rounded-[22px]" : "h-16 w-16 rounded-2xl";
  const iconSize = size === "lg" ? "h-11 w-11" : "h-8 w-8";

  return (
    <span
      className={`relative flex ${shellSize} items-center justify-center overflow-hidden border border-white bg-gradient-to-br ${styles.shell} shadow-[0_18px_35px_rgba(37,87,167,0.12)]`}
    >
      <span className={`absolute -right-3 -top-3 h-10 w-10 rounded-full ${styles.glow}`} />
      <span className={`absolute -bottom-4 -left-4 h-12 w-12 rounded-full ${styles.glow}`} />
      <span className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br ${styles.icon} p-3 text-white shadow-[0_14px_24px_rgba(37,87,167,0.2)]`}>
        <Icon className={iconSize} strokeWidth={2.15} />
      </span>
    </span>
  );
}

function FeatureCards() {
  return (
    <section className="bg-white py-8 lg:py-10">
      <div className="mx-auto grid max-w-7xl gap-5 px-5 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {features.map((feature) => (
          <Link
            key={feature.title}
            href="/cover-letter/new"
            className="group rounded-lg border border-[#e5e7eb] bg-white p-8 shadow-[0_16px_45px_rgba(37,87,167,0.06)] transition hover:-translate-y-1 hover:border-[#c7d7f2] hover:shadow-[0_24px_60px_rgba(37,87,167,0.12)]"
          >
            <PremiumIcon icon={feature.icon} tone={feature.tone} size="lg" />
            <h3 className="mt-7 text-lg font-bold text-[#0f172a]">{feature.title}</h3>
            <p className="mt-3 text-sm font-medium leading-6 text-[#334155]">{feature.text}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function TemplateGallery() {
  return (
    <section id="templates" className="border-y border-[#edf2f7] bg-[#f8fafc] py-12 lg:py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2557a7]">Professional templates</p>
            <h2 className="mt-4 text-[30px] font-bold leading-tight tracking-tight text-[#0f172a] lg:text-[36px]">
              Choose a template that fits your story.
            </h2>
            <p className="mt-3 text-base font-medium text-[#64748b]">
              Pick a style that matches your role, company tone, and level of formality.
            </p>
          </div>
          <Link
            href="/cover-letter/new"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#cbd5e1] bg-white px-5 text-sm font-bold text-[#2557a7] shadow-sm transition hover:border-[#2557a7] hover:bg-[#f8fbff]"
          >
            View All Templates
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {templates.map((template) => (
            <Link
              key={template.name}
              href="/cover-letter/new"
              className="group rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_16px_45px_rgba(37,87,167,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(37,87,167,0.13)]"
            >
              <MiniTemplate accent={template.accent} widths={template.widthSet} />
              <p className="mt-4 text-sm font-bold text-[#0f172a]">{template.name}</p>
              <p className="mt-2 text-xs font-medium leading-5 text-[#334155]">{template.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section className="bg-white py-12 lg:py-14">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div className="max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2557a7]">Smart workflow</p>
          <h2 className="mt-4 text-[30px] font-bold leading-tight tracking-tight text-[#0f172a] lg:text-[36px]">
            From blank page to polished letter in 3 steps.
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-[#64748b]">
            Our guided flow helps you create a powerful cover letter that aligns with the job and company in just a few clicks.
          </p>
          <Link
            href="/cover-letter/new"
            className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2557a7] px-5 text-sm font-bold text-white shadow-[0_14px_28px_rgba(37,87,167,0.2)] transition hover:-translate-y-0.5 hover:bg-[#1d4d99]"
          >
            Start Building Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {workflowSteps.map((step, index) => (
            <div key={step.label} className="relative">
              {index > 0 && (
                <span className="absolute -left-5 top-1/2 hidden h-px w-5 border-t border-dashed border-[#b8cdf0] md:block" />
              )}
              <div className="min-h-[260px] rounded-lg border border-[#e5e7eb] bg-white p-7 text-center shadow-[0_16px_45px_rgba(37,87,167,0.06)]">
                <div className="flex justify-center">
                  <PremiumIcon icon={step.icon} tone={step.tone} size="md" />
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[#2557a7]">Step {index + 1}</p>
                <h3 className="mt-3 text-lg font-bold text-[#0f172a]">{step.label}</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-[#334155]">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="border-y border-[#edf2f7] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] py-12 lg:py-14">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="relative min-h-[360px] overflow-hidden">
          <Image
            src={`${assetBase}/benefits-illustration-hq-trimmed.png`}
            alt="Applicant shortlisted for an interview illustration"
            fill
            sizes="(max-width: 1024px) 100vw, 560px"
            className="object-contain"
          />
        </div>

        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2557a7]">Get hired faster</p>
          <h2 className="mt-4 text-[30px] font-bold leading-tight tracking-tight text-[#0f172a] lg:text-[38px]">
            Stand out. Get shortlisted. Land more interviews.
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-[#334155]">
            A well-written cover letter shows initiative, personality, and professionalism. Everything recruiters look for.
          </p>
          <ul className="mt-6 space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-sm font-semibold text-[#334155]">
                <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />
                {benefit}
              </li>
            ))}
          </ul>
          <Link
            href="/cover-letter/new"
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#2557a7] px-7 text-sm font-bold text-white shadow-[0_16px_30px_rgba(37,87,167,0.22)] transition hover:-translate-y-0.5 hover:bg-[#1d4d99]"
          >
            Create My Cover Letter
            <PenLine className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function SampleOutputSection() {
  return (
    <section className="bg-white py-12 lg:py-14">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2557a7]">Sample output</p>
          <h2 className="mt-4 text-[30px] font-bold leading-tight tracking-tight text-[#0f172a] lg:text-[40px]">
            Preview the kind of draft CareerBot can create.
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-[#334155]">
            See how a targeted letter can connect your experience to employer priorities before you refine and export.
          </p>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-4">
            <HeroStat value="2 min" label="first draft" />
            <HeroStat value="6" label="templates" />
            <HeroStat value="1 flow" label="write to export" />
          </div>
        </div>

        <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fbff]/80 p-5 shadow-[0_28px_70px_rgba(37,87,167,0.12)]">
          <GeneratedDraft />
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="overflow-hidden bg-[linear-gradient(135deg,#061a40_0%,#08285f_100%)] px-5 py-12 text-white sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">Create your cover letter now</p>
          <h2 className="mt-4 max-w-3xl text-[30px] font-bold leading-tight tracking-tight lg:text-[40px]">
            Turn one resume and one job post into a letter you can send with confidence.
          </h2>
          <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-blue-100">
            Start with your resume, add the job description, review the AI draft, and export your final letter from one focused workflow.
          </p>
        </div>
        <div className="relative min-h-[220px]">
          <Image
            src={`${assetBase}/final-cta-illustration-hq.png`}
            alt="Completed cover letter illustration"
            width={540}
            height={280}
            className="ml-auto h-auto w-full max-w-[430px] object-contain"
          />
          <Link
            href="/cover-letter/new"
            className="absolute bottom-8 right-10 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-[#2557a7] shadow-[0_18px_40px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 hover:bg-blue-50"
          >
            Build Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PremiumLetterPreview() {
  return (
    <div className="mt-5 rounded-lg border border-[#e5e7eb] bg-white p-4">
      <div className="flex items-start justify-between gap-4 border-b border-[#e5e7eb] pb-4">
        <div className="min-w-0 flex-1">
          <div className="h-3 w-32 rounded-full bg-[#0f172a]" />
          <div className="mt-3 h-2 w-24 rounded-full bg-[#e2e8f0]" />
        </div>
        <div className="rounded-lg bg-[#2557a7] px-3 py-2 text-xs font-bold text-white">CS</div>
      </div>
      <div className="mt-5 space-y-3">
        {[88, 96, 72, 84, 78, 92, 66].map((width) => (
          <div key={width} className="h-2 rounded-full bg-[#e2e8f0]" style={{ width: `${width}%` }} />
        ))}
      </div>
      <div className="mt-6 flex items-center gap-3">
        <div className="h-2 w-24 rounded-full bg-[#2557a7]" />
        <div className="h-px flex-1 bg-[#e5e7eb]" />
        <PenLine className="h-4 w-4 text-[#2557a7]" />
      </div>
    </div>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-4">
      <p className="text-xs font-bold text-[#2557a7]">{label}</p>
      <p className="mt-2 text-sm font-bold text-[#0f172a]">{value}</p>
    </div>
  );
}

function MiniTemplate({ accent, widths }: { accent: string; widths: number[] }) {
  return (
    <div className="mx-auto min-h-[160px] max-w-[112px] rounded-md border border-[#e5e7eb] bg-white px-4 py-5 shadow-sm transition group-hover:scale-[1.03]">
      <div className={`h-2 w-12 rounded-full ${accent}`} />
      <div className="mt-3 space-y-2">
        {widths.map((width) => (
          <div key={width} className="h-1.5 rounded-full bg-[#e2e8f0]" style={{ width: `${width}%` }} />
        ))}
      </div>
      <div className={`mt-5 h-1.5 w-9 rounded-full ${accent}`} />
    </div>
  );
}

function GeneratedDraft() {
  return (
    <div className="rounded-lg bg-white p-7 shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-[#e5e7eb] pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2557a7]">Generated draft</p>
          <h3 className="mt-3 text-2xl font-bold text-[#0f172a]">Product Analyst Cover Letter</h3>
        </div>
        <span className="rounded-full bg-[#e8f6ef] px-3 py-1 text-xs font-bold text-[#22c55e]">Editable</span>
      </div>
      <div className="mt-6 space-y-4 text-sm font-medium leading-7 text-[#334155]">
        <p>Dear Hiring Manager,</p>
        <p>
          I am excited to apply for the Product Analyst role. Your job description emphasizes SQL,
          experimentation, and cross-functional reporting, which closely matches my recent work building
          dashboards and turning product data into roadmap decisions.
        </p>
        <p>
          In my last role, I reduced weekly reporting time by 35% and partnered with product managers to
          identify activation drop-offs. I would welcome the chance to bring the same analytical discipline
          to your team.
        </p>
      </div>
      <div className="mt-6 flex items-center gap-3 border-t border-[#e5e7eb] pt-5">
        <Sparkles className="h-5 w-5 text-[#2557a7]" />
        <p className="text-sm font-bold text-[#0f172a]">Tone, length, and template can be refined before export.</p>
      </div>
    </div>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white px-5 py-4 shadow-sm">
      <p className="text-2xl font-bold text-[#0f172a]">{value}</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#64748b]">{label}</p>
    </div>
  );
}
