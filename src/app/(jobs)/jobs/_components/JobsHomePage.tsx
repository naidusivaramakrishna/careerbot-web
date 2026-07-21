"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart2,
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Cloud,
  Code2,
  Filter,
  Flame,
  IndianRupee,
  MapPin,
  Monitor,
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

const QUICK_SEARCHES = [
  { label: "Remote jobs", icon: Briefcase },
  { label: "Data analyst", icon: BarChart2 },
  { label: "React developer", icon: Monitor },
  { label: "Product manager", icon: TrendingUp },
];

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
  { title: "Senior Data Scientist", company: "Google", location: "Hyderabad, India", mode: "Remote", salary: "₹18 - 28 LPA", rating: "4.8", match: "92%", posted: "2h ago", brand: "#4285F4" },
  { title: "Product Designer", company: "Microsoft", location: "Bengaluru, India", mode: "Hybrid", salary: "₹12 - 20 LPA", rating: "4.5", match: "89%", posted: "5h ago", brand: "#00A4EF" },
  { title: "Backend Engineer", company: "Amazon", location: "Pune, India", mode: "Remote", salary: "₹15 - 24 LPA", rating: "4.6", match: "91%", posted: "1d ago", brand: "#FF9900" },
  { title: "Marketing Analyst", company: "HubSpot", location: "Bengaluru, India", mode: "On-site", salary: "₹8 - 14 LPA", rating: "4.4", match: "87%", posted: "1d ago", brand: "#FF7A59" },
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
    title: "Resume-Aware Matching",
    desc: "See a match score for every job based on your resume, powered by Smart Match.",
  },
  {
    icon: Filter,
    title: "Smart Filters",
    desc: "Narrow results by location, salary, experience, source, and posting date in one click.",
  },
  {
    icon: Bookmark,
    title: "Save & Track",
    desc: "Bookmark roles you like and track every application from one dashboard.",
  },
  {
    icon: Bell,
    title: "New Job Alerts",
    desc: "Get notified as soon as roles matching your profile are posted.",
  },
  {
    icon: Briefcase,
    title: "Live Job Feed",
    desc: "Fresh listings pulled from top job portals and company career pages, updated continuously.",
  },
  {
    icon: Puzzle,
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

      {/* HERO — two-column, illustration-led */}
      <section
        className="relative overflow-hidden py-16 md:py-20"
        style={{ background: "radial-gradient(circle at 72% 22%, rgba(37,87,167,0.12), transparent 30%), linear-gradient(180deg,#ffffff 0%,#f6faff 72%,#ffffff 100%)" }}
      >
        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            {/* LEFT — copy + search bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#d7e5ff] bg-[#f3f7ff] px-4 py-1.5 text-[13px] font-semibold text-[#2557a7]">
                <Flame size={14} className="text-orange-500" fill="currentColor" />
                We&apos;re Hiring!
              </div>

              <h1 className="text-[40px] font-black leading-[1.1] tracking-tight text-[#08143f] sm:text-[48px] lg:text-[52px]">
                Find the right job.
                <br />
                <span className="text-[#0d5be1]">Right</span> now.
              </h1>

              <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-[#33446c]">
                Explore thousands of opportunities from top companies and build your dream career.
              </p>

              {/* Search bar */}
              <div className="mt-8 flex flex-col gap-0 divide-y divide-slate-100 rounded-lg bg-white p-2 shadow-[0_18px_48px_rgba(37,87,167,0.08)] md:flex-row md:items-center md:divide-x md:divide-y-0">
                <div ref={searchRef} className="relative flex min-w-0 flex-1 items-center gap-2 px-3.5 py-3 md:min-w-[150px]">
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
                    className="flex shrink-0 items-center gap-2 px-2.5 py-3 lg:px-3.5"
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
                    className="flex shrink-0 items-center gap-2 px-2.5 py-3 lg:px-3.5"
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
                <button
                  onClick={() => goToSearch(searchValue)}
                  className="m-1 inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#0b55d9] px-3.5 py-3 text-[13px] font-bold text-white shadow-[0_14px_28px_rgba(13,91,225,0.24)] transition hover:-translate-y-0.5 hover:bg-[#0848ba]"
                >
                  Search Jobs
                  <Search size={14} className="shrink-0" />
                </button>
              </div>

              {/* Popular searches */}
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <span className="text-[13px] font-medium text-slate-500">Popular Searches:</span>
                {QUICK_SEARCHES.map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => goToSearch(label)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#eef5ff] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#2557a7] transition-colors hover:bg-[#e3efff]"
                  >
                    <Icon size={13} className="shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* RIGHT — illustration + floating UI cards */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.15 }}
              className="relative mx-auto w-full max-w-[520px] self-start px-4 py-6 lg:-mt-4"
            >
              {/* Background blob + dot pattern */}
              <div
                className="pointer-events-none absolute inset-6 rounded-[48%_52%_58%_42%/42%_48%_52%_58%]"
                style={{ background: "linear-gradient(135deg, #dbe8ff 0%, #eef5ff 100%)" }}
              />
              <div
                className="pointer-events-none absolute inset-6 rounded-[48%_52%_58%_42%/42%_48%_52%_58%] opacity-60"
                style={{ backgroundImage: "radial-gradient(circle,rgba(37,87,167,0.22) 1.5px,transparent 1.5px)", backgroundSize: "18px 18px" }}
              />
              {[
                { top: "6%", left: "4%", size: 9, shape: "circle" },
                { top: "14%", right: "10%", size: 7, shape: "circle" },
                { bottom: "18%", left: "2%", size: 8, shape: "square" },
                { bottom: "8%", right: "6%", size: 10, shape: "circle" },
              ].map((d, i) => (
                <span
                  key={i}
                  className={`pointer-events-none absolute border-2 border-[#bcd6f7] ${d.shape === "circle" ? "rounded-full" : "rotate-45 rounded-sm"}`}
                  style={{ width: d.size, height: d.size, top: d.top, left: d.left, right: d.right, bottom: d.bottom }}
                />
              ))}

              {/* Illustration — edges masked to blend the image's own background into the page */}
              <Image
                src="/images/ChatGPT Image Jul 4, 2026, 03_02_48 PM.png"
                alt="Job seeker browsing matched job listings"
                width={1536}
                height={1024}
                priority
                className="relative h-auto w-full"
                style={{
                  WebkitMaskImage: "radial-gradient(ellipse 60% 65% at center, black 55%, transparent 92%)",
                  maskImage: "radial-gradient(ellipse 60% 65% at center, black 55%, transparent 92%)",
                  transform: "translate(-24%, 6%)",
                }}
              />

              {/* Floating search bubble */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-[-2%] top-[10%] z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(37,87,167,0.12)]"
              >
                <Search size={20} className="text-[#0d5be1]" />
              </motion.div>

              {/* AI Match Score card */}
              <motion.div
                initial={{ opacity: 0, y: -14, rotate: 2 }}
                animate={{ opacity: 1, y: 0, rotate: 2 }}
                transition={{ duration: 0.55, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-[0%] top-0 z-20 w-[200px] rounded-lg bg-white p-3.5 shadow-[0_18px_40px_rgba(37,87,167,0.14)]"
              >
                <div className="relative mb-2 inline-flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0b55d9] text-white">
                    <Target size={17} />
                  </div>
                  <span className="absolute -right-1.5 -top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white shadow-sm">
                    <CheckCircle2 size={15} className="text-[#0b55d9]" />
                  </span>
                </div>
                <p className="text-[13px] font-bold text-slate-900">AI Match Score</p>
                <p className="mt-1 text-[22px] font-extrabold leading-none text-emerald-600">92%</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[92%] rounded-full bg-emerald-500" />
                </div>
              </motion.div>

              {/* Interview Scheduled card */}
              <motion.div
                initial={{ opacity: 0, y: 14, rotate: -1 }}
                animate={{ opacity: 1, y: 0, rotate: -1 }}
                transition={{ duration: 0.55, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-[-4%] bottom-[6%] z-20 w-[190px] rounded-lg bg-white p-3.5 shadow-[0_18px_40px_rgba(37,87,167,0.14)]"
              >
                <div className="relative mb-2 inline-flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7c3aed] text-white">
                    <CalendarCheck2 size={17} />
                  </div>
                  <span className="absolute -right-1.5 -top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white shadow-sm">
                    <CheckCircle2 size={15} className="text-[#7c3aed]" />
                  </span>
                </div>
                <p className="text-[13px] font-bold text-slate-900">Interview Scheduled</p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">Your next interview is on Monday.</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* JOBS YOU MAY BE INTERESTED IN — horizontal preview row */}
      <section className="bg-[#f6f7fb] py-10">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-lg border border-[#dce8fb] bg-white p-6 shadow-[0_10px_26px_rgba(37,87,167,0.07)] sm:p-8"
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {JOB_PREVIEWS.map((job, i) => (
                <motion.button
                  key={job.title}
                  onClick={() => goToSearch(job.title)}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  className="rounded-lg border border-[#dce8fb] bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[14px] font-black text-white"
                      style={{ backgroundColor: job.brand }}
                    >
                      {job.company.charAt(0)}
                    </div>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock size={11} />
                      {job.posted}
                    </span>
                  </div>

                  <span
                    className={`mt-3 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10.5px] font-bold ${MODE_STYLES[job.mode]}`}
                  >
                    {job.mode}
                  </span>

                  <p className="mt-2 text-[13.5px] font-bold text-slate-900">{job.title}</p>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    {job.company} · {job.location}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1 text-[12px] font-semibold text-slate-600">
                    <IndianRupee size={11} className="text-emerald-600" />
                    {job.salary}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[12px] font-bold text-slate-700">
                      <Star size={12} style={{ fill: "#f59e0b", color: "#f59e0b" }} />
                      {job.rating}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
                      <TrendingUp size={11} />
                      {job.match} Match
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
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-lg border border-[#dce8fb] bg-white p-6 shadow-[0_10px_26px_rgba(37,87,167,0.07)] sm:p-8"
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {POPULAR_ROLES.map((role, i) => (
                <motion.button
                  key={role.title}
                  onClick={() => goToSearch(role.title)}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className={`relative flex flex-col rounded-lg p-4 text-left transition-transform hover:-translate-y-0.5 ${role.tint}`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${role.iconBg}`}>
                      <role.icon size={18} />
                    </div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                      <ChevronRight size={15} />
                    </span>
                  </div>
                  <p className="mt-3 text-[14.5px] font-bold text-slate-900">{role.title}</p>
                  <p className="text-[12px] text-slate-500">{role.count} Open Jobs</p>
                  <span className={`mt-4 inline-flex w-fit items-center gap-1 text-[11.5px] font-bold ${role.tagColor}`}>
                    <role.tagIcon size={12} />
                    {role.tagText}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* PLATFORM STATS — recap bar */}
      <section className="bg-[#f6f7fb] py-10">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 gap-6 rounded-lg border border-[#dce8fb] bg-white p-6 shadow-[0_10px_26px_rgba(37,87,167,0.07)] sm:grid-cols-4 sm:p-8"
          >
            {BOTTOM_STATS.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${s.iconBg}`}>
                  <s.icon size={20} />
                </div>
                <div>
                  <p className="text-[19px] font-extrabold leading-tight text-[#08143f]">{s.value}</p>
                  <p className="text-[12.5px] font-semibold text-slate-600">{s.label}</p>
                  <p className="text-[11px] text-slate-400">{s.sub}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* WHY CAREERBOT — differentiators vs. a plain job board */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center text-[26px] font-black text-[#08143f] sm:text-[30px]"
          >
            More than a job board
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mx-auto mt-2 max-w-lg text-center text-[13.5px] text-slate-500"
          >
            Everything you need to know if a job is worth your time — before you apply.
          </motion.p>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="rounded-lg border border-[#dce8fb] bg-white p-6 shadow-[0_10px_26px_rgba(37,87,167,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(37,87,167,0.12)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3ff] text-[#2557a7]">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 text-[15px] font-bold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{desc}</p>
              </motion.div>
            ))}
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
