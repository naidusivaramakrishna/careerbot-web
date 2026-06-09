"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { LayoutTemplate, Search, Sparkles, ArrowRight } from "lucide-react"
import AuthModal from "@/components/SignUpModal"
import { STYLE_CATALOGUES } from "@/app/(resume)/builder/creation/_utils/templateStyles"
import CategorySidebar from "@/app/(resume)/templates/_components/CategorySidebar"
import DomainCard from "@/app/(resume)/templates/_components/DomainCard"
import CatalogueThumbnail, { CATALOGUE_PALETTES, CODE_THUMBNAIL_CATALOGUES } from "./_components/CatalogueThumbnail"
import {
  FAMILY_TEMPLATES,
  FAMILY_DOMAINS,
  DOMAIN_NAMES,
  DOMAIN_DISPLAY_NAMES,
  CAREER_LEVELS,
  FALLBACK_IMAGE,
} from "./_data/constants"

const TRUST_BADGES = ['100% ATS Friendly', '14+ Industries', 'Free to browse']
const QUICK_SEARCHES = ['Software Engineer', 'Healthcare', 'Finance', 'Legal', 'Education']
const STEPS = [
  { num: '1', label: 'Choose style', active: true },
  { num: '2', label: 'Enter details', active: false },
  { num: '3', label: 'Download', active: false },
]

export default function BrowseTemplatesPage() {
  const router = useRouter()
  const [authOpen, setAuthOpen] = useState(false)
  const [initialFormType, setInitialFormType] = useState<"signup" | "signin">("signup")
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedCatalogue, setSelectedCatalogue] = useState('galaxy')
  const [searchQuery, setSearchQuery] = useState('')
  const [hoverBg, setHoverBg] = useState<Record<string, string | undefined>>({})
  const [selectedBg, setSelectedBg] = useState<Record<string, string | undefined>>(() => {
    if (typeof window === 'undefined') return {}
    const result: Record<string, string | undefined> = {}
    for (const key of Object.keys(CATALOGUE_PALETTES)) {
      const saved = localStorage.getItem(`selected_color_${key}`)
      if (saved) result[key] = saved
    }
    const legacy = localStorage.getItem('selected_section_bg')
    if (legacy && !result.eclipse) result.eclipse = legacy
    return result
  })

  const persistColorForBuilder = (catalogueKey: string, color: string | undefined) => {
    if (catalogueKey === 'eclipse') {
      if (color) localStorage.setItem('selected_section_bg', color)
      else localStorage.removeItem('selected_section_bg')
    }
  }

  const handleCatalogueSelect = (key: string) => {
    setSelectedCatalogue(key)
    localStorage.setItem('selected_catalogue', key)
    persistColorForBuilder(key, selectedBg[key])
  }

  const handleColorPick = (catalogueKey: string, color: string) => {
    setSelectedCatalogue(catalogueKey)
    setSelectedBg(prev => ({ ...prev, [catalogueKey]: color }))
    localStorage.setItem('selected_catalogue', catalogueKey)
    localStorage.setItem(`selected_color_${catalogueKey}`, color)
    persistColorForBuilder(catalogueKey, color)
  }

  const handleDomainSelect = (family: string, domain: string) => {
    localStorage.setItem('selected_catalogue', selectedCatalogue)
    router.push(`/browse-templates/${family}/${domain}`)
  }

  const handleAuthSuccess = () => {
    window.location.href = "/builder"
  }

  const getFilteredDomains = (family: string, domains: string[]) => {
    if (!searchQuery) return domains
    const q = searchQuery.toLowerCase()
    return domains.filter(domain => {
      const displayName = (DOMAIN_DISPLAY_NAMES[domain] || domain).toLowerCase()
      const familyName = (DOMAIN_NAMES[family] || family).toLowerCase()
      return displayName.includes(q) || familyName.includes(q)
    })
  }

  const baseFamilies = selectedCategory === 'All'
    ? Object.keys(FAMILY_DOMAINS)
    : (FAMILY_DOMAINS[selectedCategory] ? [selectedCategory] : [])

  const visibleFamilies = searchQuery
    ? baseFamilies.filter(f => getFilteredDomains(f, FAMILY_DOMAINS[f] || []).length > 0)
    : baseFamilies

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 overflow-x-hidden">

      {/* ── Navigation ────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Image src="/assets/icons/Logo.png" alt="CareerBot" width={52} height={52} />
            <span className="text-lg font-bold text-gray-900 tracking-tight">CareerBot</span>
          </div>

          {/* Step indicator */}
          <div className="hidden lg:flex items-center gap-2 text-sm">
            {STEPS.map((step, i) => (
              <div key={step.num} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step.active
                      ? 'bg-linear-to-br from-[#2257a7] to-[#1a6abf] text-white shadow-md shadow-blue-400/30'
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                  }`}>
                    {step.num}
                  </div>
                  <span className={`font-medium ${step.active ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-16 mx-1 rounded-full ${step.active ? 'bg-linear-to-r from-[#2257a7] to-gray-200' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden pt-28 pb-16 px-6">
        {/* Background layers */}
        <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-white to-teal-50/60" />
        <div className="absolute -top-32 -right-32 w-[550px] h-[550px] bg-linear-to-bl from-blue-100/70 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-linear-to-tr from-teal-100/60 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-50/60 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-xs font-semibold text-[#2257a7] mb-5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            ATS-Optimized · Professional · Free to browse
          </div>

          <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight mb-5 leading-[1.08]">
            <span className="text-gray-900">Find your </span>
            <span className="bg-linear-to-r from-[#2257a7] via-[#1a6abf] to-[#0d9488] bg-clip-text text-transparent">
              perfect resume style
            </span>
          </h1>

          <p className="text-lg text-slate-500 max-w-xl leading-relaxed mb-7">
            Beautiful templates for every industry and career level. Pick a colour theme, select your domain, and build in minutes.
          </p>

          <div className="flex flex-wrap items-center gap-5">
            {TRUST_BADGES.map(badge => (
              <div key={badge} className="flex items-center gap-2 text-sm text-slate-500">
                <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                {badge}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Catalogue style picker ─────────────────────────────── */}
      <div className="px-6 py-14 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#2257a7] bg-blue-50 px-3 py-1 rounded-full border border-blue-100 mb-3">
                <span className="w-1.5 h-1.5 bg-[#2257a7] rounded-full animate-pulse" />
                Step 1 of 2
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900">Choose a Style</h2>
              <p className="text-slate-500 mt-1.5 text-sm max-w-md leading-relaxed">
                Pick a colour theme — it will apply automatically when you open the builder.
              </p>
            </div>

            {selectedCatalogue && STYLE_CATALOGUES[selectedCatalogue] && (
              <div className="hidden md:flex items-center gap-2.5 px-4 py-2.5 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl text-sm font-semibold text-[#2257a7] shadow-sm">
                <span>{STYLE_CATALOGUES[selectedCatalogue].label}</span>
                <span className="text-blue-300">selected</span>
              </div>
            )}
          </div>

          {/* Catalogue grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {Object.entries(STYLE_CATALOGUES).map(([key, catalogue]) => {
              const isSelected = selectedCatalogue === key
              const hasCodeThumbnail = CODE_THUMBNAIL_CATALOGUES.has(key)
              const paletteInfo = CATALOGUE_PALETTES[key]
              const colorForThumbnail = hoverBg[key] ?? selectedBg[key] ?? paletteInfo?.defaultColor
              const primarySwatch = catalogue.swatches[0]

              return (
                <div key={key} className="group flex flex-col">
                  <div
                    className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
                    style={{
                      boxShadow: isSelected
                        ? `0 0 0 2.5px ${primarySwatch}, 0 16px 48px ${primarySwatch}30`
                        : '0 1px 6px rgba(0,0,0,0.07)',
                      transform: isSelected ? 'translateY(-3px)' : undefined,
                    }}
                    onClick={() => handleCatalogueSelect(key)}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-full bg-slate-50 p-3 group-hover:bg-slate-100/80 transition-colors duration-200">
                      <div
                        className="relative w-full bg-white rounded-xl shadow-sm overflow-hidden transition-transform duration-300 group-hover:scale-[1.01]"
                        style={{ aspectRatio: '3/4' }}
                      >
                        <CatalogueThumbnail catalogueKey={key} fallbackImage={FALLBACK_IMAGE} customColor={colorForThumbnail} />
                      </div>

                      {/* Selected checkmark */}
                      {isSelected && (
                        <div
                          className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg"
                          style={{ backgroundColor: primarySwatch }}
                        >
                          ✓
                        </div>
                      )}

                      {/* Hover overlay label */}
                      <div className="absolute inset-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-3 pointer-events-none">
                        <div
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
                          style={{ backgroundColor: isSelected ? primarySwatch : '#1e293b' }}
                        >
                          {isSelected ? '✓ Selected' : 'Select Style'}
                        </div>
                      </div>
                    </div>

                    {/* Card footer */}
                    <div className="px-3 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                      {hasCodeThumbnail && paletteInfo ? (
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          {paletteInfo.palette.slice(0, 5).map(color => {
                            const isSel = selectedBg[key] === color || (!selectedBg[key] && color === paletteInfo.defaultColor)
                            return (
                              <button
                                key={color}
                                aria-label={`Select colour ${color}`}
                                onMouseEnter={() => setHoverBg(prev => ({ ...prev, [key]: color }))}
                                onMouseLeave={() => setHoverBg(prev => ({ ...prev, [key]: undefined }))}
                                onClick={e => { e.stopPropagation(); handleColorPick(key, color) }}
                                className={`w-4 h-4 rounded-full cursor-pointer transition-all duration-150 ${
                                  isSel
                                    ? 'ring-2 ring-[#2257a7] ring-offset-1 scale-110'
                                    : 'ring-1 ring-slate-200 hover:scale-110 hover:ring-slate-400'
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            )
                          })}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Monochrome</span>
                      )}
                      <div className="flex gap-1 shrink-0">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-600">PDF</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-600">DOCX</span>
                      </div>
                    </div>
                  </div>

                  {/* Label + description below card */}
                  <div className="mt-3 px-0.5">
                    <p className={`text-xl font-bold tracking-tight transition-colors duration-200 ${isSelected ? 'text-[#2257a7]' : 'text-slate-900 group-hover:text-slate-700'}`}>
                      {catalogue.label}
                    </p>
                    <p className="text-xs text-[#2e404a] mt-1 leading-relaxed line-clamp-2">{catalogue.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Search ────────────────────────────────────────────── */}
      <div className="px-6 py-8 bg-linear-to-b from-white to-[#f8fafc] border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#2257a7] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              <span className="w-1.5 h-1.5 bg-[#2257a7] rounded-full animate-pulse" />
              Step 2 of 2
            </div>
            <span className="text-sm font-semibold text-slate-700">Select your industry &amp; career level</span>
          </div>

          <div className="relative group max-w-2xl">
            <div className="absolute inset-0 bg-linear-to-r from-blue-400/15 to-teal-400/15 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-lg -m-1" />
            <div className="relative flex items-center bg-white rounded-xl shadow-sm ring-1 ring-slate-200 group-focus-within:ring-[#2257a7]/50 group-focus-within:shadow-md transition-all duration-200">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400 group-focus-within:text-[#2257a7] transition-colors" />
              <input
                type="text"
                placeholder="Search by role, industry, or template..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-transparent border-0 rounded-xl focus:outline-none text-slate-900 placeholder-slate-400 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs text-slate-400 font-medium">Try:</span>
            {QUICK_SEARCHES.map(q => (
              <button
                key={q}
                onClick={() => setSearchQuery(q)}
                className="text-xs px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-600 hover:border-[#2257a7] hover:text-[#2257a7] hover:bg-blue-50 transition-all duration-150 font-medium shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content: sidebar + grid ────────────────────────────── */}
      <div className="flex gap-6 px-6 py-10 max-w-7xl mx-auto">
        <div className="shrink-0">
          <CategorySidebar
            categories={Object.keys(FAMILY_DOMAINS)}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            loading={false}
          />
        </div>

        <div className="flex-1 min-w-0 space-y-10">
          {selectedCategory === 'All' ? (
            visibleFamilies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <LayoutTemplate className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No templates found</h3>
                <p className="text-slate-400 text-sm max-w-xs">Try a different search term or select a different industry.</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-5 text-sm text-[#2257a7] font-semibold hover:underline flex items-center gap-1.5"
                >
                  Clear search
                </button>
              </div>
            ) : visibleFamilies.map(family => {
              const domains = getFilteredDomains(family, FAMILY_DOMAINS[family] || [])
              return (
                <div key={family} className="scroll-mt-20">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-1 h-7 rounded-full bg-linear-to-b from-[#2257a7] to-[#0d9488]" />
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                      {DOMAIN_NAMES[family] || family}
                    </h2>
                    <span className="px-2.5 py-0.5 bg-blue-50 text-[#2257a7] text-xs font-semibold rounded-full ring-1 ring-blue-200">
                      {domains.length} templates
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {domains.map(domain => (
                      <DomainCard
                        key={domain}
                        domainName={DOMAIN_DISPLAY_NAMES[domain] || domain}
                        templateCount={CAREER_LEVELS.length}
                        previewImage={FAMILY_TEMPLATES[family]?.image || FALLBACK_IMAGE}
                        onClick={() => handleDomainSelect(family, domain)}
                      />
                    ))}
                  </div>
                </div>
              )
            })
          ) : (
            (() => {
              const domains = getFilteredDomains(selectedCategory, FAMILY_DOMAINS[selectedCategory] || [])
              return (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-1 h-7 rounded-full bg-linear-to-b from-[#2257a7] to-[#0d9488]" />
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                      {DOMAIN_NAMES[selectedCategory] || selectedCategory}
                    </h2>
                    <span className="px-2.5 py-0.5 bg-blue-50 text-[#2257a7] text-xs font-semibold rounded-full ring-1 ring-blue-200">
                      {domains.length} templates
                    </span>
                  </div>
                  {domains.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                        <LayoutTemplate className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-700 mb-2">No templates found</h3>
                      <p className="text-slate-400 text-sm">Try selecting a different industry.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {domains.map(domain => (
                        <DomainCard
                          key={domain}
                          domainName={DOMAIN_DISPLAY_NAMES[domain] || domain}
                          templateCount={CAREER_LEVELS.length}
                          previewImage={FAMILY_TEMPLATES[selectedCategory]?.image || FALLBACK_IMAGE}
                          onClick={() => handleDomainSelect(selectedCategory, domain)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })()
          )}
        </div>
      </div>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 px-6 mt-4">
        <div className="absolute inset-0 bg-linear-to-br from-[#162d5c] via-[#1e4fa0] to-[#163d6b]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,_#2257a730_0%,_transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_80%,_#0d948830_0%,_transparent_70%)]" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/[0.03] rounded-full -translate-y-1/3 translate-x-1/4 border border-white/10" />
        <div className="absolute bottom-0 left-0 w-52 h-52 bg-white/[0.03] rounded-full translate-y-1/3 -translate-x-1/4 border border-white/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[1px] bg-linear-to-r from-transparent via-white/10 to-transparent" />

        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-xs font-semibold text-white/80 mb-6 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            No credit card required
          </div>

          <h2 className="text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight text-white leading-[1.1]">
            Ready to land your <br />
            <span className="bg-linear-to-r from-teal-300 to-blue-300 bg-clip-text text-transparent">dream job?</span>
          </h2>

          <p className="text-blue-100/70 mb-9 leading-relaxed max-w-lg mx-auto">
            Create a professional, ATS-optimized resume in minutes. Free to start — no sign-up needed to browse.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => { setInitialFormType("signup"); setAuthOpen(true) }}
              className="group flex items-center gap-2.5 px-8 py-3.5 bg-white text-[#2257a7] rounded-xl font-bold text-sm shadow-xl shadow-black/20 hover:bg-blue-50 hover:scale-[1.02] transition-all duration-200"
            >
              <Sparkles className="w-4 h-4 text-[#2257a7]" />
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => { setInitialFormType("signin"); setAuthOpen(true) }}
              className="px-8 py-3.5 border border-white/25 text-white rounded-xl font-semibold text-sm hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
            >
              Sign in
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
            {['Free forever', 'ATS-optimized', 'PDF + DOCX download'].map(f => (
              <div key={f} className="flex items-center gap-1.5 text-xs text-blue-200/60">
                <div className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialFormType={initialFormType}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}
