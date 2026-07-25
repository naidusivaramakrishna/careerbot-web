"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart2,
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronRight,
  Clock,
  Cloud,
  Code2,
  Filter,
  Flame,
  IndianRupee,
  MapPin,
  PenTool,
  PieChart,
  Puzzle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import SignUpModal from "@/components/SignUpModal";
import LandingNavbar from "@/app/(landing)/_components/LandingNavbar";
import LandingFooter from "@/app/(landing)/_components/LandingFooter";
import { useAuth } from "@/hooks/useAuth";

/* ────────────────────────────────────────────────────────────────────────
   Sample content — static previews shown on the marketing home page only.
   The real, live-data experience lives at /jobslogin.
──────────────────────────────────────────────────────────────────────── */

const SEARCH_SUGGESTIONS = [
  // Languages, frameworks & tools (skills)
  "Python", "Python Developer", "Python Development", "Python Framework", "Django", "Django Framework",
  "Django REST Framework", "Flask", "FastAPI", "Celery", "Pyramid", "Pandas", "NumPy", "SciPy",
  "Java", "JavaScript", "TypeScript", "React", "React Developer", "Node.js", "Node.js Developer",
  "Angular", "Vue.js", "Next.js", "SQL", "MySQL", "PostgreSQL", "MongoDB", "AWS", "Azure", "GCP",
  "Docker", "Kubernetes", "Git", "Linux", "C++", "C#", "Go", "Rust", "Swift", "Kotlin",
  "Flutter", "React Native", "Spring Boot", "GraphQL", "REST API", "Microservices", "DevOps",
  "Machine Learning", "Deep Learning", "Data Science", "Artificial Intelligence", "NLP", "Computer Vision",
  "TensorFlow", "PyTorch", "Power BI", "Tableau", "Excel", "SAP", "Salesforce", "ServiceNow",
  "Figma", "Adobe XD", "Photoshop", "Illustrator", "AutoCAD", "MATLAB", "R Programming", "Scala",
  "Hadoop", "Spark", "Kafka", "Selenium", "Jest", "Cypress", "Jenkins", "CI/CD", "Terraform",
  "Ansible", "Redis", "Elasticsearch", "RabbitMQ", "Spoken English", "Data Entry", "Typing",
  "Computer Operating", "Computer Science", "Laptop", "Internet",
  // Job titles / roles
  "Software Engineer", "Software Developer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Python Software Developer", "Java Developer", "Android Developer", "iOS Developer", "Mobile Developer",
  "DevOps Engineer", "Cloud Engineer", "Data Engineer", "Data Scientist", "Data Analyst", "Business Analyst",
  "Product Manager", "Project Manager", "Scrum Master", "UI/UX Designer", "Graphic Designer",
  "QA Engineer", "Test Engineer", "Network Engineer", "System Administrator", "Database Administrator",
  "Security Engineer", "Cybersecurity Analyst", "Machine Learning Engineer", "AI Engineer",
  "Solutions Architect", "Technical Lead", "Engineering Manager", "HR Manager", "Recruiter",
  "Talent Acquisition", "Marketing Manager", "Digital Marketing", "SEO Specialist", "Content Writer",
  "Sales Executive", "Business Development Manager", "Operations Manager", "Supply Chain", "Logistics",
  "Customer Support", "Technical Support", "Team Lead", "Analyst", "Consultant", "Fresher", "Intern",
  "Trainee", "Remote jobs",
];

const POPULAR_SUGGESTIONS = [
  "Software Engineer", "Python Developer", "React Developer", "Data Analyst", "Product Manager",
  "Java Developer", "DevOps Engineer", "Data Scientist", "UI/UX Designer", "Full Stack Developer",
  "Business Analyst", "Digital Marketing",
];

const POPULAR_LOCATIONS = [
  "Remote", "Bangalore", "Hyderabad", "Mumbai", "Delhi", "Chennai", "Pune", "Kolkata",
  "Noida", "Gurgaon", "Ahmedabad", "Jaipur", "Kochi", "Indore", "Chandigarh",
];

// Must match the canonical experience label taxonomy used by the real filter
// sidebar (src/app/(jobs)/jobslogin/_components/JobsFilterSidebar.tsx — see
// "EXP_HELP") character-for-character, or the /jobslogin filter system will
// silently match nothing.
const EXPERIENCE_OPTIONS = [
  "Fresher", "1 yr", "2 yrs", "3 yrs", "4 yrs", "5 yrs", "6 yrs", "7 yrs", "8 yrs", "9 yrs",
  "10 yrs", "11+ yrs",
];

const MODE_STYLES: Record<string, string> = {
  Remote: "bg-violet-50 text-violet-600",
  Hybrid: "bg-blue-50 text-blue-600",
  "On-site": "bg-emerald-50 text-emerald-600",
};

const JOB_PREVIEWS = [
  { title: "Senior Data Scientist", company: "Google", location: "Hyderabad, India", mode: "Remote", salary: "₹18 - 28 LPA", rating: "4.8", match: "92%", posted: "2h ago", brand: "#4285F4", logo: "/assets/icons/google-icon.svg" },
  { title: "Product Designer", company: "Microsoft", location: "Bengaluru, India", mode: "Hybrid", salary: "₹12 - 20 LPA", rating: "4.5", match: "89%", posted: "5h ago", brand: "#00A4EF", logo: "/assets/icons/microsoft-icon.svg" },
  { title: "Backend Engineer", company: "Amazon", location: "Pune, India", mode: "Remote", salary: "₹15 - 24 LPA", rating: "4.6", match: "91%", posted: "1d ago", brand: "#FF9900", logo: null },
  { title: "Marketing Analyst", company: "HubSpot", location: "Bengaluru, India", mode: "On-site", salary: "₹8 - 14 LPA", rating: "4.4", match: "87%", posted: "1d ago", brand: "#FF7A59", logo: null },
];

const POPULAR_ROLES = [
  { title: "Software Engineer", count: "3.2K+", icon: Code2, tint: "bg-violet-50", iconBg: "bg-violet-100 text-violet-600", tagIcon: Flame, tagText: "Most in demand", tagColor: "text-violet-600" },
  { title: "Data Analyst", count: "1.8K+", icon: BarChart2, tint: "bg-blue-50", iconBg: "bg-blue-100 text-blue-600", tagIcon: TrendingUp, tagText: "High growth", tagColor: "text-blue-600" },
  { title: "Product Manager", count: "920+", icon: Briefcase, tint: "bg-orange-50", iconBg: "bg-orange-100 text-orange-600", tagIcon: Star, tagText: "Top companies hiring", tagColor: "text-orange-600" },
  { title: "UI/UX Designer", count: "1.3K+", icon: PenTool, tint: "bg-emerald-50", iconBg: "bg-emerald-100 text-emerald-600", tagIcon: Sparkles, tagText: "Creative roles", tagColor: "text-emerald-600" },
  { title: "DevOps Engineer", count: "1.1K+", icon: Cloud, tint: "bg-violet-50", iconBg: "bg-violet-100 text-violet-600", tagIcon: Zap, tagText: "High demand", tagColor: "text-violet-600" },
  { title: "Business Analyst", count: "1.6K+", icon: PieChart, tint: "bg-blue-50", iconBg: "bg-blue-100 text-blue-600", tagIcon: ShieldCheck, tagText: "Stable career", tagColor: "text-blue-600" },
];

const BOTTOM_STATS = [
  { icon: Briefcase, iconBg: "bg-violet-100 text-violet-600", value: "50K+", label: "Active Jobs", sub: "Updated daily" },
  { icon: Building2, iconBg: "bg-blue-100 text-blue-600", value: "15K+", label: "Top Companies", sub: "Hiring now" },
  { icon: Users, iconBg: "bg-violet-100 text-violet-600", value: "10L+", label: "Job Seekers", sub: "Building careers" },
  { icon: ShieldCheck, iconBg: "bg-emerald-100 text-emerald-600", value: "98%", label: "Satisfaction Rate", sub: "From our users" },
];

const FEATURES = [
  {
    icon: Target,
    iconBg: "bg-blue-50 text-blue-600",
    title: "Resume-Aware Matching",
    desc: "See a match score for every job based on your resume, powered by Smart Match.",
  },
  {
    icon: Filter,
    iconBg: "bg-violet-50 text-violet-600",
    title: "Smart Filters",
    desc: "Narrow results by location, salary, experience, source, and posting date in one click.",
  },
  {
    icon: Bookmark,
    iconBg: "bg-emerald-50 text-emerald-600",
    title: "Save & Track",
    desc: "Bookmark roles you like and track every application from one dashboard.",
  },
  {
    icon: Bell,
    iconBg: "bg-amber-50 text-amber-600",
    title: "New Job Alerts",
    desc: "Get notified as soon as roles matching your profile are posted.",
  },
  {
    icon: Briefcase,
    iconBg: "bg-cyan-50 text-cyan-600",
    title: "Live Job Feed",
    desc: "Fresh listings pulled from top job portals and company career pages, updated continuously.",
  },
  {
    icon: Puzzle,
    iconBg: "bg-indigo-50 text-indigo-600",
    title: "Browser Extension",
    desc: "Capture any job description from the web directly into your workflow.",
  },
];

export default function JobsHomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authFormType, setAuthFormType] = useState<"signup" | "signin">("signup");
  const [pendingSearchUrl, setPendingSearchUrl] = useState<string | undefined>();
  const [searchValue, setSearchValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState("");
  const [showExperienceDropdown, setShowExperienceDropdown] = useState(false);
  const reduceMotion = useReducedMotion();
  const locationRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<HTMLDivElement>(null);

  // The term currently being typed is whatever comes after the last comma —
  // lets suggestions match the in-progress term while earlier picks stay put.
  const currentTerm = useMemo(() => {
    const parts = searchValue.split(",");
    return parts[parts.length - 1].trim();
  }, [searchValue]);

  const suggestions = useMemo(() => {
    const q = currentTerm.toLowerCase();
    const alreadyPicked = new Set(
      searchValue.split(",").map((p) => p.trim().toLowerCase()).filter(Boolean)
    );
    if (!q) {
      return POPULAR_SUGGESTIONS.filter((s) => !alreadyPicked.has(s.toLowerCase())).slice(0, 12);
    }
    const startsWith = SEARCH_SUGGESTIONS.filter((s) => s.toLowerCase().startsWith(q));
    const contains = SEARCH_SUGGESTIONS.filter(
      (s) => !s.toLowerCase().startsWith(q) && s.toLowerCase().includes(q)
    );
    return [...startsWith, ...contains]
      .filter((s) => !alreadyPicked.has(s.toLowerCase()))
      .slice(0, 12);
  }, [currentTerm, searchValue]);

  // Appends the picked suggestion as its own comma-separated term instead of
  // replacing the whole field, so multiple skills/titles can be stacked
  // (e.g. "Frontend, Data Entry, Data Entry Operation") before searching.
  const pickSuggestion = (s: string) => {
    const lastComma = searchValue.lastIndexOf(",");
    const before = lastComma >= 0 ? searchValue.slice(0, lastComma + 1) + " " : "";
    const next = `${before}${s}, `;
    setSearchValue(next);
    setShowSuggestions(true);
    // Move the caret to the end so the user can keep typing the next term.
    requestAnimationFrame(() => {
      const el = searchInputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(next.length, next.length);
      }
    });
  };

  // Locations filtered by the in-progress locationSearch term — same
  // case-insensitive "starts with" then "contains" pattern used for the
  // job-title suggestions above.
  const filteredLocations = useMemo(() => {
    const q = locationSearch.trim().toLowerCase();
    if (!q) return POPULAR_LOCATIONS;
    const startsWith = POPULAR_LOCATIONS.filter((l) => l.toLowerCase().startsWith(q));
    const contains = POPULAR_LOCATIONS.filter(
      (l) => !l.toLowerCase().startsWith(q) && l.toLowerCase().includes(q)
    );
    return [...startsWith, ...contains];
  }, [locationSearch]);

  const goToSearch = (query?: string) => {
    setShowSuggestions(false);
    const cleaned = query?.replace(/,\s*$/, "").trim();
    const params = new URLSearchParams();
    if (cleaned) params.set("q", cleaned);
    if (selectedLocation) params.set("location", selectedLocation);
    if (selectedExperience) params.set("years", selectedExperience);
    const qs = params.toString();
    const url = qs ? `/jobslogin?${qs}` : "/jobslogin";
    if (isAuthenticated) {
      router.push(url);
    } else {
      setPendingSearchUrl(url);
      setAuthFormType("signin");
      setShowAuthModal(true);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowLocationDropdown(false);
      }
      if (experienceRef.current && !experienceRef.current.contains(e.target as Node)) {
        setShowExperienceDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openSignup = () => {
    setAuthFormType("signup");
    setShowAuthModal(true);
  };
  const openSignin = () => {
    setAuthFormType("signin");
    setShowAuthModal(true);
  };

  return (
    <>
      <LandingNavbar onOpenSignup={openSignup} onOpenSignin={openSignin} />

      {/* HERO — full-height, illustration-led */}
      <section className="relative isolate flex min-h-[calc(100svh-88px)] items-center overflow-hidden bg-[radial-gradient(circle_at_82%_21%,rgba(125,211,252,0.28),transparent_30%),radial-gradient(circle_at_74%_76%,rgba(99,102,241,0.13),transparent_34%),radial-gradient(circle_at_21%_62%,rgba(219,234,254,0.52),transparent_38%),linear-gradient(135deg,#ffffff_0%,#f8fbff_45%,#f1f7ff_100%)] py-9 sm:py-10 xl:py-12">
        {/* Background — soft gradient wash */}
        <div
          className="pointer-events-none absolute inset-0 -z-20"
          style={{ background: "transparent" }}
        />
        {/* Blurred decorative circles */}
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-45">
          <div className="absolute -left-28 bottom-5 h-72 w-[620px] rotate-[-17deg] rounded-[999px] bg-[linear-gradient(90deg,rgba(219,234,254,0),rgba(147,197,253,0.36),rgba(255,255,255,0))] blur-2xl" />
          <div className="absolute bottom-20 right-[-7%] h-40 w-[760px] rotate-[-5deg] rounded-[999px] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(79,70,229,0.22),rgba(14,165,233,0.2),rgba(255,255,255,0))] blur-xl" />
          <div className="absolute left-[45%] top-[38%] h-px w-[680px] -rotate-[21deg] bg-gradient-to-r from-transparent via-white/90 to-transparent" />
        </div>
        {/* Dot pattern */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(37,87,167,0.18) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            WebkitMaskImage: "radial-gradient(ellipse 85% 60% at 50% 25%, black 35%, transparent 85%)",
            maskImage: "radial-gradient(ellipse 85% 60% at 50% 25%, black 35%, transparent 85%)",
          }}
        />
        {/* Floating sparkles — minimal, low-opacity accents */}
        {[
          { top: "12%", left: "6%", size: 12, duration: 4.5 },
          { top: "22%", left: "44%", size: 9, duration: 5.2 },
          { top: "68%", left: "9%", size: 10, duration: 3.8 },
          { top: "78%", left: "48%", size: 8, duration: 4.8 },
          { top: "16%", left: "92%", size: 10, duration: 4.2 },
        ].map((s, i) => (
          <motion.span
            key={i}
            className="pointer-events-none absolute -z-10 text-[#9fc3ff]"
            style={{ top: s.top, left: s.left }}
            animate={{ y: [0, -10, 0], opacity: [0.25, 0.6, 0.25] }}
            transition={{ duration: s.duration, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
          >
            <Sparkles size={s.size} fill="currentColor" />
          </motion.span>
        ))}

        <div className="relative mx-auto w-full max-w-[1728px] px-5 sm:px-8 lg:px-10 2xl:px-[60px]">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[43%_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[44%_minmax(0,1fr)] xl:gap-8 2xl:grid-cols-[46%_minmax(0,1fr)] 2xl:gap-10">
            {/* LEFT — copy + search bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="min-w-0"
            >
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#cfe0ff] bg-white/70 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#0b55d9] shadow-[0_10px_28px_rgba(37,87,167,0.08)] backdrop-blur">
                <Sparkles size={13} />
                AI Career Intelligence
              </div>

              <h1 className="max-w-[760px] text-[clamp(34px,3.6vw,58px)] font-black leading-[1.08] tracking-[-0.045em] text-[#06113f]">
                Your next opportunity,
                <br />
                <span className="bg-gradient-to-r from-[#0b55d9] via-[#176cf0] to-[#4d91ff] bg-clip-text text-transparent">
                  intelligently matched.
                </span>
              </h1>

              <p className="mt-5 max-w-[540px] text-[clamp(14px,1.2vw,16px)] leading-7 text-[#3e5076] xl:mt-6">
                Discover roles aligned with your skills, ambitions, and salary goals—so you can move forward with clarity.
              </p>

              {/* Search bar */}
              <div className="mt-7 flex flex-col gap-0 divide-y divide-slate-100 rounded-2xl border border-white/80 bg-white/92 p-2 shadow-[0_20px_48px_rgba(37,87,167,0.13)] backdrop-blur-md transition-shadow focus-within:border-[#bcd6f7] focus-within:shadow-[0_22px_54px_rgba(13,91,225,0.2)] sm:flex-row sm:flex-wrap sm:items-center sm:divide-x sm:divide-y-0 xl:grid xl:grid-cols-[minmax(125px,1fr)_auto_auto_auto] 2xl:grid-cols-[minmax(145px,1fr)_auto_auto_auto]">
                <div ref={searchRef} className="relative flex min-w-0 flex-1 items-center gap-2 px-4 py-3.5 md:min-w-[150px] md:py-0">
                  <Search size={17} className="shrink-0 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    value={searchValue}
                    onChange={(e) => { setSearchValue(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={(e) => { if (e.key === "Enter") goToSearch(searchValue); }}
                    placeholder="Job title or skills"
                    className="w-full min-w-0 bg-transparent text-[13.5px] text-slate-700 outline-none placeholder:text-slate-400"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 top-full z-30 mt-2 max-h-80 w-full min-w-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            pickSuggestion(s);
                          }}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          <Search size={12} className="shrink-0 text-slate-300" />
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div ref={locationRef} className="relative flex shrink-0 items-center">
                  <button
                    type="button"
                    onClick={() => { setShowLocationDropdown((v) => !v); setShowExperienceDropdown(false); }}
                    className="flex shrink-0 items-center gap-2 px-3 py-3.5 md:py-0"
                  >
                    <MapPin size={16} className="shrink-0 text-slate-400" />
                    <span
                      className={`whitespace-nowrap text-[13px] ${
                        selectedLocation ? "font-semibold text-slate-700" : "text-slate-500"
                      }`}
                    >
                      {selectedLocation || "Location"}
                    </span>
                  </button>
                  {selectedLocation && (
                    <button
                      type="button"
                      onClick={() => setSelectedLocation("")}
                      aria-label="Clear location"
                      className="mr-1 shrink-0 text-slate-400 hover:text-slate-600"
                    >
                      ×
                    </button>
                  )}
                  {showLocationDropdown && (
                    <div className="absolute left-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                      <div className="border-b border-slate-100 p-2">
                        <input
                          autoFocus
                          value={locationSearch}
                          onChange={(e) => setLocationSearch(e.target.value)}
                          placeholder="Search location"
                          className="w-full rounded-lg bg-slate-50 px-3 py-2 text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto py-1">
                        {filteredLocations.length > 0 ? (
                          filteredLocations.map((loc) => (
                            <button
                              key={loc}
                              type="button"
                              onClick={() => {
                                setSelectedLocation(loc);
                                setShowLocationDropdown(false);
                                setLocationSearch("");
                              }}
                              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-slate-700 transition-colors hover:bg-slate-50"
                            >
                              <MapPin size={12} className="shrink-0 text-slate-300" />
                              {loc}
                            </button>
                          ))
                        ) : (
                          <p className="px-4 py-3 text-center text-[13px] text-slate-400">
                            No locations found
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div ref={experienceRef} className="relative flex shrink-0 items-center">
                  <button
                    type="button"
                    onClick={() => { setShowExperienceDropdown((v) => !v); setShowLocationDropdown(false); }}
                    className="flex shrink-0 items-center gap-2 px-3 py-3.5 md:py-0"
                  >
                    <Briefcase size={16} className="shrink-0 text-slate-400" />
                    <span
                      className={`whitespace-nowrap text-[13px] ${
                        selectedExperience ? "font-semibold text-slate-700" : "text-slate-500"
                      }`}
                    >
                      {selectedExperience || "Experience"}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`shrink-0 text-slate-400 transition-transform ${
                        showExperienceDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {showExperienceDropdown && (
                    <div className="absolute left-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                      <div className="max-h-72 overflow-y-auto py-1">
                        {EXPERIENCE_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setSelectedExperience(opt);
                              setShowExperienceDropdown(false);
                            }}
                            className="flex w-full items-center px-4 py-2.5 text-left text-[13px] text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <motion.button
                  onClick={() => goToSearch(searchValue)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0b55d9] px-4 py-3 text-[13px] font-bold text-white shadow-[0_14px_28px_rgba(13,91,225,0.24)] transition-colors hover:bg-[#0848ba] sm:ml-auto sm:w-auto sm:whitespace-nowrap lg:ml-0"
                >
                  Search jobs
                  <ArrowRight size={17} className="shrink-0" />
                </motion.button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-[#607397]">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#0b55d9]" />
                  Verified employers
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#0b55d9]" />
                  Matches tailored to you
                </span>
              </div>

            </motion.div>

            {/* RIGHT — cinematic animated-style career visual */}
            {true && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.15 }}
              className="relative mx-auto w-full min-w-0 max-w-[650px] py-3 lg:-mr-1"
            >
              <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[44px] bg-[radial-gradient(circle_at_55%_44%,rgba(76,145,255,0.26),transparent_66%)] blur-2xl" />
              <motion.div
                className="relative aspect-[4/3] overflow-hidden rounded-[30px] border-[8px] border-white/90 bg-[#0c3e9b] shadow-[0_30px_78px_rgba(31,92,180,0.22)]"
                initial={reduceMotion ? false : { scale: 0.985 }}
                animate={{ scale: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  className="absolute inset-0"
                  animate={reduceMotion ? undefined : { scale: [1, 1.035, 1], x: [0, -5, 0], y: [0, -3, 0] }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Image
                    src="/images/jobs/career-match-workspace-v1.png"
                    alt="Animated illustration of a professional using AI to match their skills with the right opportunity"
                    fill
                    priority
                    sizes="(min-width: 1024px) 44vw, 92vw"
                    className="object-cover object-center"
                  />
                </motion.div>
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),transparent_34%,rgba(3,22,70,0.12))]" />
                <div className="absolute bottom-5 left-5 rounded-full border border-white/35 bg-[#061b4c]/55 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-lg backdrop-blur-md">
                  Skills matched to opportunity
                </div>
              </motion.div>
            </motion.div>
            )}

          </div>

        </div>
      </section>

      {/* JOBS YOU MAY BE INTERESTED IN — horizontal preview row */}
      <section className="bg-[#f6f7fb] py-10">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-[24px] border border-[#dce8fb] bg-white p-6 shadow-[0_18px_44px_rgba(37,87,167,0.07)] sm:p-8"
          >
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-[19px] font-black text-[#08143f] sm:text-[21px]">
                  <Sparkles size={18} className="text-[#0d5be1]" />
                  Jobs you may be interested in
                </h2>
                <p className="mt-1 text-[13px] text-slate-500">Top picks matched to your profile and career goals</p>
              </div>
              <button
                onClick={() => goToSearch()}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-[12.5px] font-bold text-slate-700 shadow-sm transition-colors hover:border-[#2557a7]/30 hover:text-[#2557a7]"
              >
                View all jobs
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {JOB_PREVIEWS.map((job, i) => (
                <motion.button
                  key={job.title}
                  onClick={() => goToSearch(job.title)}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  className="group flex min-h-[250px] flex-col rounded-[18px] border border-[#dce8fb] bg-white p-5 text-left shadow-[0_8px_24px_rgba(37,87,167,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#b9d2f4] hover:shadow-[0_18px_38px_rgba(37,87,167,0.12)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-[#e3ebf7] bg-white shadow-sm">
                      {job.logo ? (
                        <Image src={job.logo} alt={`${job.company} logo`} width={25} height={25} />
                      ) : (
                        <Building2 size={22} style={{ color: job.brand }} />
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock size={11} />
                      {job.posted}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10.5px] font-bold ${MODE_STYLES[job.mode]}`}>
                      {job.mode}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10.5px] font-bold text-emerald-600">
                      <TrendingUp size={11} />
                      {job.match} match
                    </span>
                  </div>

                  <p className="mt-4 text-[16px] font-bold tracking-[-0.01em] text-slate-900">{job.title}</p>
                  <p className="mt-1 text-[12.5px] font-semibold text-[#40577d]">{job.company}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-slate-500">
                    <MapPin size={12} className="text-slate-400" />
                    {job.location}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-[12.5px] font-bold text-slate-700">
                    <IndianRupee size={12} className="text-emerald-600" />
                    {job.salary}
                  </p>

                  <div className="mt-auto flex items-center justify-between border-t border-[#edf2f8] pt-4">
                    <span className="flex items-center gap-1 text-[12px] font-bold text-slate-700">
                      <Star size={12} style={{ fill: "#f59e0b", color: "#f59e0b" }} />
                      {job.rating}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#0b55d9]">
                      View role
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* DISCOVER JOBS ACROSS POPULAR ROLES */}
      <section className="bg-[#f6f7fb] py-10">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-[24px] border border-[#dce8fb] bg-white p-6 shadow-[0_18px_44px_rgba(37,87,167,0.07)] sm:p-8"
          >
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-[19px] font-black text-[#08143f] sm:text-[21px]">
                  <Briefcase size={18} className="text-[#0d5be1]" />
                  Discover jobs across popular roles
                </h2>
                <p className="mt-1 text-[13px] text-slate-500">Explore top roles and find the perfect opportunity for you</p>
              </div>
              <button
                onClick={() => goToSearch()}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-[12.5px] font-bold text-slate-700 shadow-sm transition-colors hover:border-[#2557a7]/30 hover:text-[#2557a7]"
              >
                Browse all roles
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {POPULAR_ROLES.map((role, i) => (
                <motion.button
                  key={role.title}
                  onClick={() => goToSearch(role.title)}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="group relative flex min-h-[190px] flex-col rounded-[18px] border border-[#dce8fb] bg-white p-5 text-left shadow-[0_8px_24px_rgba(37,87,167,0.05)] transition duration-300 hover:-translate-y-1 hover:border-[#b9d2f4] hover:shadow-[0_18px_38px_rgba(37,87,167,0.11)]"
                >
                  <div className="flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-[14px] ring-1 ring-inset ring-black/[0.03] ${role.iconBg}`}>
                      <role.icon size={21} strokeWidth={1.8} />
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e1e9f5] bg-white text-slate-400 shadow-sm transition-colors group-hover:border-[#b9d2f4] group-hover:text-[#0b55d9]">
                      <ChevronRight size={15} />
                    </span>
                  </div>
                  <p className="mt-4 text-[16px] font-bold tracking-[-0.01em] text-slate-900">{role.title}</p>
                  <p className="mt-1 text-[12.5px] font-semibold text-[#607397]">{role.count} open positions</p>
                  <div className="mt-auto flex items-center justify-between border-t border-[#edf2f8] pt-4">
                    <span className={`inline-flex w-fit items-center gap-1.5 text-[11.5px] font-bold ${role.tagColor}`}>
                      <role.tagIcon size={12} />
                      {role.tagText}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#0b55d9]">
                      Explore
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* PLATFORM STATS — recap bar */}
      <section className="bg-[#f6f7fb] py-10">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid overflow-hidden rounded-[24px] border border-[#dce8fb] bg-white shadow-[0_18px_44px_rgba(37,87,167,0.07)] sm:grid-cols-2 lg:grid-cols-4"
          >
            {BOTTOM_STATS.map((s, index) => (
              <div
                key={s.label}
                className={`flex items-center gap-4 px-6 py-6 sm:px-7 ${
                  index > 0 ? "border-t border-[#e7eef8] sm:[&:nth-child(even)]:border-l lg:border-l lg:border-t-0" : ""
                } ${index > 1 ? "sm:border-t lg:border-t-0" : ""}`}
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] ring-1 ring-inset ring-black/[0.03] ${s.iconBg}`}>
                  <s.icon size={20} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-[23px] font-black leading-none tracking-[-0.02em] text-[#08143f]">{s.value}</p>
                  <p className="mt-1.5 text-[12.5px] font-bold text-[#40577d]">{s.label}</p>
                  <p className="mt-0.5 text-[10.5px] text-slate-400">{s.sub}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* WHY CAREERBOT — differentiators vs. a plain job board */}
      <section className="bg-[#f6f7fb] py-10 md:py-14">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-10">
          <div className="rounded-[24px] border border-[#dce8fb] bg-white p-6 shadow-[0_18px_44px_rgba(37,87,167,0.07)] sm:p-8">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-[25px] font-black tracking-[-0.02em] text-[#08143f] sm:text-[29px]"
          >
            More than a job board
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-2 max-w-2xl text-[13.5px] leading-6 text-slate-500"
          >
            Everything you need to know if a job is worth your time — before you apply.
          </motion.p>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, iconBg, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="group rounded-[18px] border border-[#dce8fb] bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-[#b9d2f4] hover:shadow-[0_16px_34px_rgba(37,87,167,0.1)]"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-[14px] ring-1 ring-inset ring-black/[0.03] ${iconBg}`}>
                  <Icon size={21} strokeWidth={1.8} />
                </div>
                <h3 className="mt-4 text-[15.5px] font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-[12.5px] leading-5 text-slate-600">{desc}</p>
              </motion.div>
            ))}
          </div>
          </div>
        </div>
      </section>

      <LandingFooter
        cta={{
          title: "Ready to find your next role?",
          description: "Browse live job listings for free. No credit card required.",
          href: "/jobslogin",
          label: "Search Jobs",
        }}
      />

      <SignUpModal
        open={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingSearchUrl(undefined); }}
        initialFormType={authFormType}
        redirectTo={pendingSearchUrl}
      />
    </>
  );
}
