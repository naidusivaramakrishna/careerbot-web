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
  ChevronLeft,
  ChevronRight,
  Clock,
  Cloud,
  Code2,
  Filter,
  FileText,
  Flame,
  IndianRupee,
  MapPin,
  Mic2,
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
  LayoutDashboard,
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

const FEATURE_STORIES = [
  {
    key: "matching",
    eyebrow: "AI Job Matching",
    title: "Opportunities selected around your strengths.",
    description: "CareerBOT compares your skills and goals with live roles to surface stronger matches first.",
    accent: "#176cf0",
    soft: "#dceaff",
    image: "/images/jobs/feature-stories/ai-job-matching-v2.png",
    icon: Target,
  },
  {
    key: "resume",
    eyebrow: "Resume Intelligence",
    title: "Know exactly what your resume needs next.",
    description: "Get a focused score, missing-skill signals, and practical improvements before you apply.",
    accent: "#7c3aed",
    soft: "#eee6ff",
    image: "/images/jobs/feature-stories/resume-intelligence.png",
    icon: FileText,
  },
  {
    key: "interview",
    eyebrow: "Interview Practice",
    title: "Practice smarter. Interview confidently.",
    description: "Rehearse realistic questions and get focused coaching on every answer.",
    accent: "#0f9f73",
    soft: "#dcf8ef",
    image: "/images/jobs/feature-stories/interview-practice-v2.png",
    icon: Mic2,
  },
  {
    key: "tracking",
    eyebrow: "Application Tracking",
    title: "Keep every opportunity and next step in view.",
    description: "Organize applications, interviews, follow-ups, and offers from one simple workspace.",
    accent: "#ea580c",
    soft: "#ffeadc",
    image: "/images/jobs/feature-stories/application-tracking.png",
    icon: LayoutDashboard,
  },
] as const;

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
  const [activeFeature, setActiveFeature] = useState(0);
  const featureTouchStart = useRef<number | null>(null);
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

  // NOTE: the auto-rotating interval that used to drive this was removed —
  // its only consumer is the "retained in source for reference only" dead
  // carousel block below ({false && (...)}), so it was running forever on
  // every visit to this public page for a value nothing ever rendered.
  // Restore it here if that carousel is ever re-enabled.
  const showFeature = (index: number) => {
    setActiveFeature((index + FEATURE_STORIES.length) % FEATURE_STORIES.length);
  };

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

            {/* Previous product card retained in source for reference only. */}
            {false && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.15 }}
              className="relative mx-auto w-full min-w-0 max-w-[650px] py-3 lg:-mr-1"
            >
              <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[44px] bg-[radial-gradient(circle_at_55%_40%,rgba(76,145,255,0.2),transparent_66%)] blur-2xl" />
              <div className="overflow-hidden rounded-[28px] border border-[#dce7f7] bg-white shadow-[0_24px_64px_rgba(31,92,180,0.14)]">
                <div className="flex items-center justify-between border-b border-[#e7eef8] px-5 py-3.5 sm:px-6">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0b55d9]">
                      <Target size={14} />
                      Your strongest match
                    </div>
                    <p className="mt-1 text-[12px] text-[#7181a0]">Personalized from your skills and preferences</p>
                  </div>
                  <div className="rounded-full bg-[#eafaf3] px-3 py-1.5 text-[12px] font-bold text-[#087a55]">
                    94% match
                  </div>
                </div>

                <div className="px-5 py-4 sm:px-6 sm:py-5">
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] border border-[#e2e9f5] bg-white shadow-sm">
                      <Image src="/assets/icons/microsoft-icon.svg" alt="" width={24} height={24} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#607397]">
                        Microsoft
                        <ShieldCheck size={13} className="text-[#0b55d9]" aria-label="Verified employer" />
                      </p>
                      <h2 className="mt-0.5 text-[22px] font-black tracking-[-0.025em] text-[#071744]">
                        Senior Product Designer
                      </h2>
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] font-medium text-[#607397]">
                        <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> Bengaluru · Hybrid</span>
                        <span className="inline-flex items-center gap-1.5"><Briefcase size={14} /> Full-time</span>
                        <span className="inline-flex items-center gap-1.5"><TrendingUp size={14} /> Senior level</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-y border-[#e7eef8] py-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a99b4]">Estimated salary</p>
                      <p className="mt-0.5 text-[20px] font-black text-[#071744]">₹18–28 LPA</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["Product strategy", "Figma", "Design systems"].map((skill) => (
                        <span key={skill} className="rounded-lg border border-[#dce7f7] bg-[#f7faff] px-2.5 py-1.5 text-[10px] font-semibold text-[#486188]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[13px] font-bold text-[#172c54]">Why this role fits you</p>
                    <div className="mt-2.5 grid gap-2">
                      {[
                        "Your core design skills align with the role",
                        "The seniority matches your recent experience",
                        "Location and salary fit your preferences",
                      ].map((reason) => (
                        <div key={reason} className="flex items-center gap-2.5 text-[12px] text-[#5a6d93]">
                          <ShieldCheck size={15} className="shrink-0 text-[#0aa673]" />
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => goToSearch("Senior Product Designer")}
                      className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b55d9] px-5 text-[13px] font-bold text-white shadow-[0_14px_28px_rgba(13,91,225,0.22)] transition-colors hover:bg-[#0848ba]"
                    >
                      View role details
                      <ArrowRight size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Save matched role"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#d7e4f6] text-[#274a80] transition-colors hover:bg-[#f4f8ff]"
                    >
                      <Bookmark size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
            )}

            {/* Previous carousel retained in source for reference only. */}
            {false && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.15 }}
              className="relative mx-auto w-full min-w-0 max-w-[680px] py-4 lg:-mr-2"
              onTouchStart={(event) => {
                featureTouchStart.current = event.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(event) => {
                const start = featureTouchStart.current;
                const end = event.changedTouches[0]?.clientX;
                if (start != null && end != null && Math.abs(start - end) > 45) {
                  showFeature(activeFeature + (start > end ? 1 : -1));
                }
                featureTouchStart.current = null;
              }}
            >
              <div className="pointer-events-none absolute -inset-3 rounded-[38px] bg-[radial-gradient(circle_at_55%_45%,rgba(63,145,255,0.2),transparent_64%)] blur-2xl" />
              <div className="relative aspect-[16/10] overflow-hidden rounded-[32px] border border-white/90 bg-white/55 p-2 shadow-[0_28px_72px_rgba(31,92,180,0.18)] backdrop-blur-xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={FEATURE_STORIES[activeFeature].key}
                    initial={reduceMotion ? false : { opacity: 0, x: 34, scale: 0.985 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, x: -28, scale: 0.99 }}
                    transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="relative h-full overflow-hidden rounded-[28px]"
                    style={{
                      background: `radial-gradient(circle at 72% 34%, ${FEATURE_STORIES[activeFeature].soft}, transparent 34%), linear-gradient(145deg, #fafdff 0%, #edf5ff 100%)`,
                    }}
                  >
                    <motion.div
                      className="absolute inset-x-0 top-0 h-[70%] overflow-hidden"
                      initial={reduceMotion ? false : { scale: 1.035, x: 12 }}
                      animate={{ scale: 1, x: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 5.5, ease: "easeOut" }}
                    >
                      <Image
                        src={FEATURE_STORIES[activeFeature].image}
                        alt={`${FEATURE_STORIES[activeFeature].eyebrow} animated illustration`}
                        fill
                        priority={activeFeature === 0}
                        sizes="(min-width: 1024px) 46vw, 92vw"
                        className={`object-cover ${
                          FEATURE_STORIES[activeFeature].key === "interview"
                            ? "object-top"
                            : "object-center"
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/30" />
                    </motion.div>
                    <div className="hidden">
                      {FEATURE_STORIES[activeFeature].key === "matching" && (
                        <div className="relative mx-auto mt-8 h-[220px] max-w-[480px]">
                          {[0, 1, 2].map((ring) => (
                            <motion.div
                              key={ring}
                              className="absolute left-1/2 top-1/2 rounded-full border border-[#93baff]/50"
                              style={{ width: 116 + ring * 64, height: 116 + ring * 64, marginLeft: -(58 + ring * 32), marginTop: -(58 + ring * 32) }}
                              animate={reduceMotion ? undefined : { rotate: ring % 2 ? -360 : 360 }}
                              transition={{ duration: 18 + ring * 5, repeat: Infinity, ease: "linear" }}
                            >
                              <span className="absolute -right-2 top-1/2 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#176cf0] shadow-lg">
                                {ring === 0 ? <Briefcase size={14} /> : ring === 1 ? <MapPin size={14} /> : <Star size={14} />}
                              </span>
                            </motion.div>
                          ))}
                          <motion.div
                            className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[28px] bg-[#176cf0] text-white shadow-[0_24px_60px_rgba(23,108,240,0.35)]"
                            animate={reduceMotion ? undefined : { y: [-4, 4, -4] }}
                            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <Target size={38} />
                          </motion.div>
                          <div className="absolute right-2 top-4 rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-xl">
                            <p className="text-[10px] font-semibold text-slate-400">Match score</p>
                            <p className="text-[24px] font-black text-emerald-500">94%</p>
                          </div>
                        </div>
                      )}

                      {FEATURE_STORIES[activeFeature].key === "resume" && (
                        <div className="relative mx-auto mt-7 flex h-[230px] max-w-[430px] items-center justify-center">
                          <motion.div
                            className="relative h-[210px] w-[270px] rounded-[24px] border border-white bg-white p-5 shadow-[0_26px_65px_rgba(60,70,150,0.18)]"
                            animate={reduceMotion ? undefined : { rotate: [-1.5, 1, -1.5] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eee6ff] text-[#7c3aed]"><FileText size={20} /></span>
                              <div className="space-y-2"><div className="h-2 w-28 rounded bg-slate-200" /><div className="h-1.5 w-20 rounded bg-slate-100" /></div>
                            </div>
                            <div className="mt-5 space-y-3">
                              {[84, 96, 72, 90].map((width, index) => (
                                <motion.div
                                  key={width}
                                  className="h-2 rounded-full bg-[#d9c8ff]"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${width}%` }}
                                  transition={{ duration: 0.8, delay: index * 0.12 }}
                                />
                              ))}
                            </div>
                          </motion.div>
                          <motion.div
                            className="absolute -right-2 top-8 flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-[#7c3aed] border-l-[#e8dcff] bg-white shadow-xl"
                            animate={reduceMotion ? undefined : { scale: [1, 1.04, 1] }}
                            transition={{ duration: 2.4, repeat: Infinity }}
                          >
                            <div className="text-center"><p className="text-[27px] font-black text-[#26105c]">88</p><p className="text-[9px] text-slate-400">Resume score</p></div>
                          </motion.div>
                        </div>
                      )}

                      {FEATURE_STORIES[activeFeature].key === "interview" && (
                        <div className="relative mx-auto mt-8 flex h-[220px] max-w-[470px] items-center justify-center">
                          <div className="absolute inset-x-8 top-4 rounded-[26px] border border-white bg-white/85 p-5 shadow-[0_25px_60px_rgba(15,159,115,0.16)]">
                            <div className="flex items-center justify-between">
                              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dcf8ef] text-[#0f9f73]"><Mic2 size={24} /></span>
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600">Live practice</span>
                            </div>
                            <div className="mt-6 flex h-20 items-center justify-center gap-2">
                              {[28, 52, 76, 44, 88, 60, 34, 70, 48, 82, 38, 58].map((height, index) => (
                                <motion.span
                                  key={index}
                                  className="w-2 rounded-full bg-[#0f9f73]"
                                  animate={reduceMotion ? { height } : { height: [height * 0.45, height, height * 0.55] }}
                                  transition={{ duration: 0.9 + (index % 4) * 0.18, repeat: Infinity, ease: "easeInOut" }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {FEATURE_STORIES[activeFeature].key === "tracking" && (
                        <div className="mx-auto mt-8 grid h-[220px] max-w-[500px] grid-cols-3 gap-3 px-4">
                          {[
                            ["Applied", 2],
                            ["Interview", 3],
                            ["Offer", 1],
                          ].map(([label, count], column) => (
                            <div key={String(label)} className="rounded-2xl border border-white bg-white/76 p-3 shadow-[0_18px_45px_rgba(234,88,12,0.1)]">
                              <div className="flex items-center justify-between text-[10px] font-bold text-[#5b6478]"><span>{label}</span><span>{count}</span></div>
                              <div className="mt-3 space-y-2">
                                {Array.from({ length: Number(count) }).map((_, card) => (
                                  <motion.div
                                    key={card}
                                    className="rounded-xl border border-[#ffe1ce] bg-white p-2.5"
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: column * 0.12 + card * 0.1 }}
                                  >
                                    <div className="h-2 w-3/4 rounded bg-[#ffd3b8]" /><div className="mt-2 h-1.5 w-1/2 rounded bg-slate-100" />
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/96 to-white/35 px-6 pb-5 pt-12 sm:px-8">
                      <div className="flex items-end justify-between gap-4">
                        <div className="max-w-[470px]">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: FEATURE_STORIES[activeFeature].accent }}>
                            {(() => {
                              const ActiveIcon = FEATURE_STORIES[activeFeature].icon;
                              return <ActiveIcon size={14} />;
                            })()}
                            {FEATURE_STORIES[activeFeature].eyebrow}
                          </div>
                          <h3 className="mt-1.5 text-[19px] font-black leading-tight tracking-[-0.02em] text-[#071744] sm:text-[22px]">
                            {FEATURE_STORIES[activeFeature].title}
                          </h3>
                          <p className="mt-1.5 max-w-[500px] text-[11px] leading-[1.55] text-[#5a6d93] sm:text-[12px]">
                            {FEATURE_STORIES[activeFeature].description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="absolute right-5 top-5 z-20 flex items-center gap-2">
                  <button type="button" onClick={() => showFeature(activeFeature - 1)} aria-label="Previous feature" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/80 text-[#173263] shadow-sm backdrop-blur transition hover:bg-white">
                    <ChevronLeft size={16} />
                  </button>
                  <button type="button" onClick={() => showFeature(activeFeature + 1)} aria-label="Next feature" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/80 text-[#173263] shadow-sm backdrop-blur transition hover:bg-white">
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="absolute bottom-5 right-6 z-20 flex items-center gap-2">
                  {FEATURE_STORIES.map((story, index) => (
                    <button key={story.key} type="button" onClick={() => showFeature(index)} aria-label={`Show ${story.eyebrow}`} className="relative h-1.5 w-8 overflow-hidden rounded-full bg-[#d8e4f6]">
                      {index === activeFeature && (
                        <motion.span
                          key={activeFeature}
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ backgroundColor: story.accent }}
                          initial={{ width: reduceMotion ? "100%" : "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: reduceMotion ? 0 : 5, ease: "linear" }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
            )}
          </div>

          {false && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.45 }}
            className="mt-6 grid overflow-hidden rounded-[22px] border border-white/90 bg-white/72 shadow-[0_22px_54px_rgba(37,87,167,0.11)] backdrop-blur-xl sm:grid-cols-3"
          >
            {[
              { icon: Briefcase, value: "120K+", label: "opportunities", sub: "curated and updated daily" },
              { icon: Building2, value: "5K+", label: "companies", sub: "hiring across industries" },
              { icon: Sparkles, value: "Updated daily", label: "fresh matches", sub: "so you never miss out" },
            ].map((item, index) => (
              <div key={item.value} className={`flex items-center gap-4 px-6 py-5 ${index > 0 ? "border-t border-[#dfe9f8] sm:border-l sm:border-t-0" : ""}`}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#d7e5fb] bg-[#f6f9ff] text-[#0b55d9]">
                  <item.icon size={20} />
                </span>
                <div>
                  <p className="text-[22px] font-black leading-tight text-[#071744]">{item.value}</p>
                  <p className="text-[11px] font-bold text-[#32486e]">{item.label}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">{item.sub}</p>
                </div>
              </div>
            ))}
          </motion.div>
          )}
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
