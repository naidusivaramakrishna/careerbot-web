"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowRight, Sparkles, Download, Zap, Shield, ChevronLeft, ChevronRight } from "lucide-react"
import AuthModal from "@/components/SignUpModal"

const CATALOGUES = [
  {
    name: 'Eclipse',
    subtitle: 'Classic & Formal',
    description: 'Centered header with highlighted section backgrounds — a structured, formal look for any industry.',
    features: ['Formal design', 'Professional tone', 'Corporate appeal', 'Structured layout'],
    bgGradient: 'from-blue-50 to-blue-100',
    accentGradient: 'from-blue-600 to-blue-700'
  },
  {
    name: 'Crimson',
    subtitle: 'Executive & Bold',
    description: 'Executive-style header with bold red accents and strong typography — commands attention at every level.',
    features: ['Bold presentation', 'Executive styling', 'Strong typography', 'Eye-catching design'],
    bgGradient: 'from-red-50 to-red-100',
    accentGradient: 'from-red-600 to-red-700'
  },
  {
    name: 'Galaxy',
    subtitle: 'Modern & Tech-Focused',
    description: 'Sleek two-column header with bold name and clean section lines — great for tech and finance roles.',
    features: ['Modern design', 'Tech-friendly', 'Clean layout', 'Professional hierarchy'],
    bgGradient: 'from-indigo-50 to-indigo-100',
    accentGradient: 'from-indigo-600 to-indigo-700'
  },
  {
    name: 'Forest',
    subtitle: 'Calm & Credible',
    description: 'Stacked classic layout with earthy green tones — a calm, credible look for healthcare, education, and research.',
    features: ['Warm tones', 'Credible design', 'Calm aesthetic', 'Research-friendly'],
    bgGradient: 'from-emerald-50 to-emerald-100',
    accentGradient: 'from-emerald-600 to-emerald-700'
  },
  {
    name: 'Ocean',
    subtitle: 'Corporate & Professional',
    description: 'Compact side-by-side header with cool blue accents — perfect for corporate and operations roles.',
    features: ['Corporate style', 'Cool accents', 'Compact design', 'Operations-focused'],
    bgGradient: 'from-cyan-50 to-cyan-100',
    accentGradient: 'from-cyan-600 to-cyan-700'
  },
  {
    name: 'Slate',
    subtitle: 'Timeless & Recruiter-Friendly',
    description: 'Understated slate tones with a clean divider layout — timeless and recruiter-friendly for any profession.',
    features: ['Timeless design', 'Clean dividers', 'Universal appeal', 'Recruiter-friendly'],
    bgGradient: 'from-slate-50 to-slate-100',
    accentGradient: 'from-slate-600 to-slate-700'
  },
  {
    name: 'Amber',
    subtitle: 'Elegant & Sophisticated',
    description: 'Elegant serif font with warm accent tones — ideal for business, consulting, and management profiles.',
    features: ['Serif typography', 'Warm tones', 'Sophisticated feel', 'Executive-grade'],
    bgGradient: 'from-amber-50 to-amber-100',
    accentGradient: 'from-amber-600 to-amber-700'
  },
  {
    name: 'Aether',
    subtitle: 'Minimalist & Content-Focused',
    description: 'Ultra-minimal with ruled section dividers — no distraction, just content. Great for design and research roles.',
    features: ['Minimal design', 'Ruled dividers', 'Content-focused', 'Distraction-free'],
    bgGradient: 'from-gray-50 to-gray-100',
    accentGradient: 'from-gray-600 to-gray-700'
  },
  {
    name: 'Pillar',
    subtitle: 'Bold & Structured',
    description: 'Strong left accent bar with bold section titles — visually striking and structured for leadership and tech roles.',
    features: ['Accent bar design', 'Strong hierarchy', 'Leadership-style', 'Visually striking'],
    bgGradient: 'from-purple-50 to-purple-100',
    accentGradient: 'from-purple-600 to-purple-700'
  },
  {
    name: 'Ember',
    subtitle: 'Creative & Energetic',
    description: 'Right-aligned name and contact block with warm orange highlights — energetic and distinctive for creative fields.',
    features: ['Creative design', 'Warm highlights', 'Energetic feel', 'Distinctive layout'],
    bgGradient: 'from-orange-50 to-orange-100',
    accentGradient: 'from-orange-600 to-orange-700'
  }
]

const INDUSTRIES = [
  { name: 'Software Engineering', templates: 12 },
  { name: 'Healthcare & Medical', templates: 8 },
  { name: 'Finance & Accounting', templates: 10 },
  { name: 'Legal & Law', templates: 6 },
  { name: 'Education & Academia', templates: 7 },
  { name: 'Product & Leadership', templates: 9 },
  { name: 'Sales & Business Dev', templates: 8 },
  { name: 'Marketing & Creative', templates: 8 },
  { name: 'Operations & Management', templates: 7 },
  { name: 'Human Resources', templates: 6 },
  { name: 'Cybersecurity', templates: 5 },
  { name: 'Engineering & Core Tech', templates: 9 },
]

const CAREER_LEVELS = [
  { title: 'Fresher', description: 'Entry-level professionals with 0-1 years of experience' },
  { title: 'Early Career', description: 'Professionals with 1-3 years of relevant experience' },
  { title: 'Mid-Level', description: 'Established professionals with 4-7 years in the field' },
  { title: 'Senior Level', description: 'Experienced professionals with 8+ years of expertise' },
  { title: 'Lead / Manager', description: 'Leadership roles with team management experience' },
  { title: 'Architect / Director / VP', description: 'Director, VP, and C-suite leadership positions' }
]

const BENEFITS = [
  {
    icon: Shield,
    title: 'ATS Optimized',
    description: 'Guaranteed to pass Applicant Tracking Systems'
  },
  {
    icon: Download,
    title: 'Instant Download',
    description: 'PDF, DOCX, or Google Docs formats'
  },
  {
    icon: Sparkles,
    title: 'Industry-Tailored',
    description: 'Customized for 18+ professional fields'
  },
  {
    icon: Zap,
    title: 'Live Customization',
    description: 'Real-time preview with instant changes'
  }
]

export default function BrowseTemplatesPage() {
  const router = useRouter()
  const [authOpen, setAuthOpen] = useState(false)
  const [initialFormType, setInitialFormType] = useState<"signup" | "signin">("signup")
  const [currentCatalogueIndex, setCurrentCatalogueIndex] = useState(0)

  const handleAuthSuccess = () => {
    window.location.href = "/builder"
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCatalogueIndex((prev) => (prev + 1) % CATALOGUES.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex justify-between items-center">
          <button onClick={() => router.push('/')} className="flex items-center gap-3 group">
            <Image src="/assets/icons/Logo.png" alt="CareerBot" width={44} height={44} priority className="group-hover:scale-110 transition-transform" />
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">CareerBot</span>
              <p className="text-xs text-gray-500 font-medium">Resume Builder</p>
            </div>
          </button>
          <button
            onClick={() => router.push('/')}
            className="group px-6 py-2.5 bg-gray-100 text-gray-900 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-300 flex items-center gap-2"
          >
            <span>← Back</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 lg:px-8 pt-24 pb-40 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-200/40 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-teal-200/30 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-indigo-200/20 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200/50 rounded-full mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">AI-Powered Resume Builder</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-tight mb-8 tracking-tight">
            Land Your Dream Job with
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">Perfect Resumes</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mb-12 font-light">
            Choose from 100+ professionally designed templates. Each crafted for 18+ industries with 10 stunning styles and 9 career levels to match your expertise.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-20">
            <button
              onClick={() => router.push('/templates')}
              className="group px-8 py-5 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-bold rounded-2xl shadow-2xl shadow-blue-500/40 hover:shadow-3xl hover:shadow-blue-500/60 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <Sparkles className="w-5 h-5" />
              <span>Start Exploring Now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => { setInitialFormType("signup"); setAuthOpen(true) }}
              className="px-8 py-5 border-2 border-gray-200 text-gray-900 font-bold rounded-2xl hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-300 backdrop-blur-sm"
            >
              Get Started Free
            </button>
          </div>

          {/* Stats - Inline Display */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-20">
            {[
              { value: '100+', label: 'Professional Templates' },
              { value: '18+', label: 'Industries' },
              { value: '9', label: 'Career Levels' },
              { value: '10', label: 'Style Catalogues' }
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform">
                  {stat.value}
                </div>
                <p className="text-gray-700 font-semibold text-sm md:text-base group-hover:text-blue-600 transition-colors">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-6 lg:px-8 py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Why Professionals Trust Us</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">Everything you need to create a standout resume that gets noticed</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((benefit, i) => {
              const Icon = benefit.icon
              return (
                <div key={i} className="group relative p-8 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-teal-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-teal-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{benefit.title}</h3>
                    <p className="text-gray-600 font-light leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Catalogues Section - Featured Carousel */}
      <section className="px-6 lg:px-8 py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/30 to-transparent" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">10 Premium Style Catalogues</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">Each style is meticulously crafted for different industries and career levels</p>
          </div>

          {/* Featured Catalogue Showcase */}
          <div className="relative mb-16">
            {/* Main Featured Display */}
            <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-200 shadow-2xl">
              <div className={`absolute inset-0 bg-gradient-to-br ${CATALOGUES[currentCatalogueIndex].bgGradient}`} />
              <div className={`absolute inset-0 bg-gradient-to-br ${CATALOGUES[currentCatalogueIndex].accentGradient} opacity-5`} />

              <div className="relative p-12 md:p-16 min-h-[320px] flex flex-col justify-between">
                {/* Catalogue Number */}
                <div className="inline-flex w-fit items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full mb-8 border border-gray-200/50">
                  <span className={`text-sm font-bold bg-gradient-to-r ${CATALOGUES[currentCatalogueIndex].accentGradient} bg-clip-text text-transparent`}>
                    Style {currentCatalogueIndex + 1} of {CATALOGUES.length}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">{CATALOGUES[currentCatalogueIndex].name}</h3>
                  <p className={`text-lg md:text-xl font-semibold bg-gradient-to-r ${CATALOGUES[currentCatalogueIndex].accentGradient} bg-clip-text text-transparent mb-6`}>
                    {CATALOGUES[currentCatalogueIndex].subtitle}
                  </p>
                  <p className="text-gray-700 text-base md:text-lg font-light leading-relaxed max-w-2xl">
                    {CATALOGUES[currentCatalogueIndex].description}
                  </p>

                  {/* Features List */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-200/50">
                    {CATALOGUES[currentCatalogueIndex].features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${CATALOGUES[currentCatalogueIndex].accentGradient}`} />
                        <span className="text-sm font-semibold text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={() => setCurrentCatalogueIndex((prev) => (prev - 1 + CATALOGUES.length) % CATALOGUES.length)}
              className="absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full border border-gray-200 shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center text-gray-900 hover:bg-gray-50 z-20"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentCatalogueIndex((prev) => (prev + 1) % CATALOGUES.length)}
              className="absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full border border-gray-200 shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center text-gray-900 hover:bg-gray-50 z-20"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Catalogue Selector - Horizontal Scrollable Thumbnails */}
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {CATALOGUES.map((catalogue, i) => (
              <button
                key={i}
                onClick={() => setCurrentCatalogueIndex(i)}
                className={`flex-shrink-0 px-5 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${
                  i === currentCatalogueIndex
                    ? `bg-gradient-to-r ${catalogue.accentGradient} text-white shadow-lg`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {catalogue.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section - Horizontal Bar Chart */}
      <section className="px-6 lg:px-8 py-24 relative overflow-hidden bg-gradient-to-b from-white via-blue-50/20 to-white">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Trusted by 18+ Industries</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">From Fortune 500s to startups, professionals across every field choose CareerBot</p>
          </div>

          {/* Industry Bar Chart */}
          <div className="space-y-6">
            {INDUSTRIES.map((industry, i) => {
              const colors = [
                'from-blue-600 to-blue-700',
                'from-purple-600 to-purple-700',
                'from-emerald-600 to-emerald-700',
                'from-orange-600 to-orange-700',
                'from-pink-600 to-pink-700',
                'from-cyan-600 to-cyan-700',
                'from-red-600 to-red-700',
                'from-indigo-600 to-indigo-700',
                'from-teal-600 to-teal-700',
                'from-violet-600 to-violet-700',
                'from-amber-600 to-amber-700',
                'from-lime-600 to-lime-700',
              ]
              const color = colors[i % colors.length]
              const maxTemplates = Math.max(...INDUSTRIES.map(ind => ind.templates))
              const percentage = (industry.templates / maxTemplates) * 100

              return (
                <div
                  key={i}
                  className="group"
                  style={{
                    animationDelay: `${i * 40}ms`,
                  }}
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-32 flex-shrink-0">
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-2">{industry.name}</h3>
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200/50 rounded-full overflow-hidden backdrop-blur-sm border border-gray-200/30">
                        <div
                          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700 ease-out`}
                          style={{
                            width: `${percentage}%`,
                            animation: `expandWidth 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
                            animationDelay: `${i * 40}ms`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-16 flex-shrink-0 text-right">
                      <span className={`text-lg font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                        {industry.templates}
                      </span>
                      <p className="text-xs text-gray-500 font-medium">templates</p>
                    </div>
                  </div>
                  <div className="h-px bg-gradient-to-r from-gray-200/50 via-gray-200/30 to-transparent group-hover:from-gray-300 transition-all" />
                </div>
              )
            })}
          </div>
        </div>

        <style>{`
          @keyframes expandWidth {
            from {
              width: 0;
            }
            to {
              width: var(--target-width);
            }
          }
        `}</style>
      </section>

      {/* Career Levels - Linear Progression Timeline */}
      <section className="px-6 lg:px-8 py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Perfect for Every Career Stage</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">From your first job to executive leadership</p>
          </div>

          {/* Vertical Timeline */}
          <div className="max-w-3xl mx-auto">
            {CAREER_LEVELS.map((level, i) => (
              <div key={i} className="relative group">
                {/* Timeline Line */}
                {i !== CAREER_LEVELS.length - 1 && (
                  <div className="absolute left-8 top-24 w-1 h-20 bg-gradient-to-b from-blue-400 to-blue-200 group-hover:from-blue-600 group-hover:to-blue-400 transition-all" />
                )}

                {/* Timeline Item */}
                <div className="flex gap-6 mb-12 group/item hover:scale-102 transition-transform">
                  {/* Circle Number */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover/item:shadow-2xl group-hover/item:shadow-blue-500/50 transition-all group-hover/item:scale-110 relative z-10">
                      {i + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <h3 className="text-2xl font-black text-gray-900 mb-2 group-hover/item:text-blue-600 transition-colors">
                      {level.title}
                    </h3>
                    <p className="text-gray-600 font-light leading-relaxed">
                      {level.description}
                    </p>

                    {/* Bottom Line Accent */}
                    <div className="mt-4 h-1 w-0 bg-gradient-to-r from-blue-600 to-teal-600 group-hover/item:w-32 transition-all duration-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 lg:px-8 py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600" />
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">Ready to Transform Your Resume?</h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Join thousands of job seekers who have landed interviews with our professional templates. Start exploring now — completely free.
          </p>

          <button
            onClick={() => router.push('/templates')}
            className="group px-10 py-6 bg-white text-blue-600 font-bold rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-95 transition-all duration-300 inline-flex items-center gap-3 text-lg"
          >
            <Sparkles className="w-6 h-6" />
            Browse All Templates
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="mt-12 flex items-center justify-center gap-6 flex-wrap text-white/80 text-sm font-light">
            <div className="flex items-center gap-2">✓ Free to explore</div>
            <div className="flex items-center gap-2">✓ No credit card</div>
            <div className="flex items-center gap-2">✓ Instant download</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white font-bold mb-3">CareerBot</p>
          <p className="mb-4 font-light">Create professional, ATS-optimized resumes for every industry and career level.</p>
          <p className="text-sm">© 2024 CareerBot. Crafted with ❤️ for your success.</p>
        </div>
      </footer>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialFormType={initialFormType}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}