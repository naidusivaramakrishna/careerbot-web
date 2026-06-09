"use client"
import { useState, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Check, Sparkles, ShieldCheck, LayoutTemplate, Zap, Printer, Target } from "lucide-react"
import AuthModal from "@/components/SignUpModal"
import { getAllResumes, createResumeWithAuth } from "@/api/resumeApi"
import { getProfile } from "@/api/userApi"
import { getSectionOrderByDomainAndCareer } from "@/app/(resume)/templates/_utils/domainSectionOrder"
import { logger } from "@/lib/logger"
import {
  FAMILY_TEMPLATES,
  DOMAIN_NAMES,
  DOMAIN_DISPLAY_NAMES,
  CAREER_LEVELS,
  FALLBACK_IMAGE,
} from "../../_data/constants"

interface PageProps {
  params: Promise<{ family: string; domain: string }>
}

const FEATURES = [
  { icon: LayoutTemplate, label: "Professional layout", color: "#2257a7", bg: "#e8f0fb" },
  { icon: Zap, label: "Easy to customize", color: "#7c3aed", bg: "#ede9fe" },
  { icon: ShieldCheck, label: "ATS optimized", color: "#059669", bg: "#d1fae5" },
  { icon: Printer, label: "Print friendly", color: "#d97706", bg: "#fef3c7" },
  { icon: Target, label: "Tailored for your career level", color: "#dc2626", bg: "#fee2e2" },
]

export default function TemplateDetailPage({ params }: PageProps) {
  const { family, domain } = use(params)
  const router = useRouter()

  const [selectedLevel, setSelectedLevel] = useState("Fresher")
  const [imgSrc, setImgSrc] = useState(FAMILY_TEMPLATES[family]?.image || FALLBACK_IMAGE)
  const [isApplying, setIsApplying] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  const domainName = DOMAIN_DISPLAY_NAMES[domain] || domain
  const familyName = DOMAIN_NAMES[family] || family
  const familyTpl = FAMILY_TEMPLATES[family]
  const description = familyTpl?.description || "Professional resume template"

  const applyTemplate = useCallback(async (careerLevel: string) => {
    setIsApplying(true)
    try {
      const [userProfile, resumes] = await Promise.all([
        getProfile({ skipAuthRedirect: true }).catch(() => null),
        getAllResumes().catch(() => null),
      ])

      let userEmail = ""
      if (userProfile?.email) {
        userEmail = userProfile.email
        localStorage.setItem("userEmail", userEmail)
      }

      const selectedTemplateKey = userEmail ? `selectedTemplateId_${userEmail}` : "selectedTemplateId"
      const careerLevelKey = userEmail ? `careerLevelTemplates_${userEmail}` : "careerLevelTemplates"
      const sectionOrderKey = userEmail ? `sectionOrder_${userEmail}` : "sectionOrder"

      if (familyTpl) {
        const selectedIdx = CAREER_LEVELS.indexOf(careerLevel)
        const templateId = `${familyTpl.id}-${selectedIdx + 1}`
        localStorage.setItem(selectedTemplateKey, templateId)

        const careerLevelData = CAREER_LEVELS.map((level, idx) => ({
          id: `${familyTpl.id}-${idx + 1}`,
          name: `${domainName} - ${level}`,
          preview_url: familyTpl.image,
          description: familyTpl.description,
          ats_friendly: true,
          domain_family: family,
          domain_display_name: domainName,
        }))
        localStorage.setItem(careerLevelKey, JSON.stringify(careerLevelData))

        const sectionOrder = getSectionOrderByDomainAndCareer(family, careerLevel.toLowerCase())
        localStorage.setItem(sectionOrderKey, JSON.stringify(sectionOrder))
        logger.info("Stored template info:", { family, domain, careerLevel })
      }

      let resumeId: string | undefined
      if (resumes && resumes.length > 0) {
        resumeId = resumes[0].id || (resumes[0] as unknown as Record<string, unknown>)._id as string
      } else {
        const newResume = await createResumeWithAuth()
        resumeId = newResume.id || (newResume as unknown as Record<string, unknown>)._id as string
      }

      if (!resumeId) resumeId = localStorage.getItem("current_resume_id") ?? undefined

      if (resumeId) {
        window.location.href = `/builder/creation/${resumeId}`
      } else {
        window.location.href = "/builder/start"
      }
    } catch (error) {
      logger.error("Error applying template:", error)
      const fallbackId = localStorage.getItem("current_resume_id")
      if (fallbackId) {
        window.location.href = `/builder/creation/${fallbackId}`
      } else {
        setIsApplying(false)
        throw error
      }
    }
  }, [family, domain, domainName, familyTpl])

  const handleApply = useCallback(async () => {
    let authenticated = false
    try {
      await getProfile({ skipAuthRedirect: true })
      authenticated = true
      await applyTemplate(selectedLevel)
    } catch {
      if (!authenticated) {
        localStorage.setItem("bt_pending_family", family)
        localStorage.setItem("bt_pending_domain", domain)
        localStorage.setItem("bt_pending_career_level", selectedLevel)
        localStorage.setItem("pendingTemplateFamily", family)
        setAuthOpen(true)
      }
    }
  }, [family, domain, selectedLevel, applyTemplate])

  const handlePostAuth = useCallback(async () => {
    const pendingFamily = localStorage.getItem("bt_pending_family")
    const pendingDomain = localStorage.getItem("bt_pending_domain")
    const pendingCareerLevel = localStorage.getItem("bt_pending_career_level")
    localStorage.removeItem("bt_pending_family")
    localStorage.removeItem("bt_pending_domain")
    localStorage.removeItem("bt_pending_career_level")
    if (!pendingFamily || !pendingDomain || !pendingCareerLevel) {
      const fallbackId = localStorage.getItem("current_resume_id")
      window.location.href = fallbackId ? `/builder/creation/${fallbackId}` : "/builder/start"
      return
    }
    try {
      await applyTemplate(pendingCareerLevel)
    } catch {
      const fallbackId = localStorage.getItem("current_resume_id")
      window.location.href = fallbackId ? `/builder/creation/${fallbackId}` : "/builder/start"
    }
  }, [applyTemplate])

  if (!familyTpl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Template not found</h1>
          <p className="text-slate-500 mb-6">We couldn&apos;t find a template for that category.</p>
          <button
            onClick={() => router.push("/browse-templates")}
            className="px-6 py-2.5 bg-[#2257a7] text-white rounded-lg font-semibold hover:bg-[#184284] transition"
          >
            Browse all templates
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes blob-drift {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33%       { transform: translate(30px, -20px) scale(1.05); }
          66%       { transform: translate(-20px, 15px) scale(0.96); }
        }
        @keyframes float-card {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .shimmer-btn {
          background: linear-gradient(270deg, #1a46a0, #2257a7, #1e7cdf, #2257a7, #1a46a0);
          background-size: 300% 100%;
          transition: background-position 0.4s ease, box-shadow 0.2s ease, transform 0.15s ease;
        }
        .shimmer-btn:hover {
          background-position: right center;
          box-shadow: 0 8px 30px rgba(34,87,167,0.45);
          transform: translateY(-1px);
        }
        .shimmer-btn:active { transform: translateY(0); }
        .card-hover {
          transition: box-shadow 0.25s ease, transform 0.25s ease;
        }
        .card-hover:hover {
          box-shadow: 0 20px 60px rgba(34,87,167,0.12);
          transform: translateY(-3px);
        }
        .level-card {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .level-card:hover { transform: scale(1.03); }
        .level-card.selected { transform: scale(1.04); }
        .preview-glow {
          animation: float-card 5s ease-in-out infinite;
        }
        .animate-fade-up {
          animation: fade-up 0.5s ease both;
        }
        .blob { animation: blob-drift 12s ease-in-out infinite; }
        .blob-2 { animation: blob-drift 15s ease-in-out infinite reverse; animation-delay: -4s; }
        .blob-3 { animation: blob-drift 18s ease-in-out infinite; animation-delay: -8s; }
        .gradient-border {
          background: linear-gradient(white, white) padding-box,
                      linear-gradient(135deg, #2257a7, #06b6d4, #8b5cf6) border-box;
          border: 2px solid transparent;
        }
      `}</style>

      <div className="min-h-screen bg-white relative overflow-x-hidden">

        {/* ── Decorative background blobs ── */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="blob absolute -top-32 -right-32 w-125 h-125 rounded-full bg-blue-100/60 blur-3xl" />
          <div className="blob-2 absolute top-1/3 -left-40 w-100 h-100 rounded-full bg-indigo-100/50 blur-3xl" />
          <div className="blob-3 absolute -bottom-32 right-1/4 w-120 h-120 rounded-full bg-teal-100/50 blur-3xl" />
        </div>

        {/* ── Loading overlay ── */}
        {isApplying && (
          <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-xl">
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute w-20 h-20 rounded-full border-4 border-blue-400/30 animate-ping" />
              <div className="absolute w-16 h-16 rounded-full border-4 border-blue-500/20 animate-ping" style={{ animationDelay: "0.2s" }} />
              <div className="w-12 h-12 rounded-full border-4 border-transparent border-t-blue-500 border-r-teal-400 animate-spin" />
            </div>
            <p className="text-white text-xl font-bold tracking-tight">Setting up your template</p>
            <p className="text-blue-300/80 text-sm mt-1">Opening Resume Builder…</p>
          </div>
        )}

        {/* ── Navbar ── */}
        <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-3.5 flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Image src="/assets/icons/Logo.png" alt="CareerBot" width={52} height={52} />
              <span className="text-lg font-bold text-gray-900 tracking-tight">CareerBot</span>
            </div>
            <button
              onClick={() => router.push("/browse-templates")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer hover:bg-blue-50"
              style={{ color: "#2257a7", border: "1.5px solid #bfdbfe" }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to templates
            </button>
          </div>
        </nav>

        {/* ── Hero ── */}
        <div className="relative pt-20 pb-14 overflow-hidden">
          {/* Same background as /browse-templates hero */}
          <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-white to-teal-50/60" />
          <div className="absolute -top-32 -right-32 w-[550px] h-[550px] bg-linear-to-bl from-blue-100/70 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-linear-to-tr from-teal-100/60 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-50/60 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-6 animate-fade-up">
              <button onClick={() => router.push("/browse-templates")} className="hover:text-[#2257a7] transition-colors cursor-pointer">
                Templates
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500">{familyName}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 font-semibold">{domainName}</span>
            </div>

            <div className="flex items-start gap-5 animate-fade-up" style={{ animationDelay: "0.05s" }}>
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
                style={{ background: "linear-gradient(135deg, #2257a7, #1e7cdf)" }}
              >
                <LayoutTemplate className="w-7 h-7 text-white" />
              </div>

              <div className="flex-1">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3 leading-tight">
                  <span className="text-gray-900">{domainName} </span>
                  <span style={{ background: "linear-gradient(135deg, #2257a7, #1a6abf, #0d9488)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Template
                  </span>
                </h1>
                <p className="text-slate-500 text-base max-w-2xl leading-relaxed mb-5">{description}</p>

                {/* Stat badges — same style as browse-templates trust badges */}
                <div className="flex flex-wrap items-center gap-5">
                  {["100% ATS Friendly", "5 Career Levels", "Instant Setup"].map((label) => (
                    <div key={label} className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* ── Left: large preview ── */}
            <div className="lg:col-span-3">
              <div className="sticky top-24 animate-fade-up" style={{ animationDelay: "0.1s" }}>
                <div className="preview-glow gradient-border rounded-2xl overflow-hidden p-5 bg-white shadow-2xl" style={{ boxShadow: "0 24px 80px rgba(34,87,167,0.15), 0 8px 24px rgba(0,0,0,0.06)" }}>
                  {/* Top bar */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                      style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)", color: "#065f46", border: "1px solid #6ee7b7" }}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      ATS Ready
                    </div>
                  </div>

                  <div className="relative rounded-xl overflow-hidden bg-slate-50">
                    <Image
                      src={imgSrc}
                      alt={domainName}
                      width={800}
                      height={1000}
                      className="w-full h-auto object-contain"
                      style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.10))" }}
                      onError={() => setImgSrc(FALLBACK_IMAGE)}
                      priority
                    />
                    {/* Subtle overlay gradient at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(248,250,252,0.8), transparent)" }} />
                  </div>

                  <div className="mt-4 flex items-center justify-between px-1">
                    <span className="text-sm font-semibold text-slate-600">{domainName} Template</span>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-lg"
                      style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                    >
                      {selectedLevel}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right: career levels + CTA ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Career level picker */}
              <div className="card-hover bg-white rounded-2xl shadow-lg border border-slate-100 p-5 animate-fade-up" style={{ animationDelay: "0.15s" }}>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-1 h-7 rounded-full" style={{ background: "linear-gradient(to bottom, #2257a7, #06b6d4)" }} />
                  <div>
                    <h2 className="text-base font-bold text-slate-900 leading-none">Select career level</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Choose the one that matches your experience</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 mb-1">
                  {CAREER_LEVELS.map((level, idx) => {
                    const isSelected = selectedLevel === level
                    return (
                      <div key={level} className={`flex flex-col items-center ${idx === 3 ? "col-start-1" : ""} ${idx === 4 ? "col-start-2" : ""}`}>
                        <button
                          onClick={() => setSelectedLevel(level)}
                          className={`level-card ${isSelected ? "selected" : ""} relative w-full rounded-xl overflow-hidden cursor-pointer`}
                          style={{
                            border: isSelected
                              ? "2px solid #2257a7"
                              : "2px solid #e2e8f0",
                            boxShadow: isSelected
                              ? "0 0 0 3px rgba(34,87,167,0.15), 0 4px 16px rgba(34,87,167,0.2)"
                              : "0 1px 4px rgba(0,0,0,0.06)",
                            background: isSelected
                              ? "linear-gradient(135deg, #eff6ff, #f0f9ff)"
                              : "#fafafa",
                            padding: "6px",
                          }}
                        >
                          <Image
                            src={imgSrc}
                            alt={level}
                            width={120}
                            height={150}
                            className="w-full h-auto object-contain rounded-lg"
                            style={{ opacity: isSelected ? 1 : 0.75, transition: "opacity 0.2s" }}
                            onError={() => setImgSrc(FALLBACK_IMAGE)}
                          />
                          {isSelected && (
                            <div
                              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white shadow"
                              style={{ background: "linear-gradient(135deg, #2257a7, #1e7cdf)" }}
                            >
                              <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            </div>
                          )}
                        </button>
                        <p
                          className="text-[11px] font-semibold mt-1.5 text-center transition-colors leading-tight"
                          style={{ color: isSelected ? "#2257a7" : "#64748b" }}
                        >
                          {level}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Template details + CTA */}
              <div className="card-hover bg-white rounded-2xl shadow-lg border border-slate-100 p-5 animate-fade-up" style={{ animationDelay: "0.2s" }}>
                <h3 className="text-lg font-black text-slate-900 leading-tight mb-1">
                  {domainName}
                  <span className="text-[#2257a7]"> · {selectedLevel}</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4">Pre-built for your career path</p>

                {/* ATS badge */}
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-5"
                  style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)", color: "#065f46", border: "1px solid #6ee7b7" }}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  100% ATS Friendly
                </div>

                {/* Features */}
                <div className="space-y-2.5 mb-6">
                  {FEATURES.map(({ icon: Icon, label, color, bg }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: bg }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <span className="text-sm text-slate-700 font-medium">{label}</span>
                    </div>
                  ))}
                </div>

                {/* CTA buttons */}
                <div className="space-y-2.5">
                  <button
                    onClick={handleApply}
                    disabled={isApplying}
                    className="shimmer-btn w-full text-white font-bold py-3.5 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isApplying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Applying…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Use This Template
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => router.push("/browse-templates")}
                    disabled={isApplying}
                    className="w-full py-2.5 rounded-xl cursor-pointer text-sm font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all duration-200 disabled:opacity-50"
                  >
                    Browse other templates
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialFormType="signin"
        onSuccess={handlePostAuth}
      />
    </>
  )
}
