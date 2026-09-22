"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  Activity as ActivityIcon,
  AlertCircle,
  ArrowRight,
  Briefcase,
  Check,
  Code2,
  Crown,
  FileText,
  Loader2,
  MessageSquare,
  ScanSearch,
  Sparkles,
  Upload,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardSummary, type Activity } from "@/types/dashboard.types";
import { useResumeProfileFill } from "@/hooks/useResumeProfileFill";
import { useDashboard } from "@/contexts/DashboardContext";
import ProfileFillModal from "./ProfileFillModal";
import { runAtsScan } from "@/api/resumeatsapi";
import {
  EnterpriseAtsScanIcon as IcoAtsScan,
  EnterpriseInterviewPrepIcon as IcoInterview,
  EnterpriseJobMatchIcon as IcoJobMatch,
  EnterpriseJobsIcon as IcoJobs,
  EnterpriseProfileIcon as IcoProfile,
  EnterpriseResumeIcon as IcoResume,
} from "@/components/icons/EnterpriseNavIcons";

const SURFACE = "rounded-2xl border border-gray-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.055)]";
const PAD = "px-5 py-5 sm:px-6";

type ActivityItem = Activity & { type?: string };

type DashboardAction = {
  label: string;
  detail: string;
  cta: string;
  meta: string;
  href?: string;
  onClick?: () => void;
  loading?: boolean;
  Icon: React.ElementType;
};

type _ExtensionItem = {
  title: string;
  detail: string;
  href: string;
  Icon: React.ElementType;
};

const activityIcons: Record<string, React.ElementType> = {
  ats_scan: IcoAtsScan,
  assessment: MessageSquare,
  enhancement: IcoAtsScan,
  interview: IcoInterview,
  mock_interview: IcoInterview,
  job_application: IcoJobs,
  job_match: IcoJobMatch,
  profile_update: IcoProfile,
  profile_updated: IcoProfile,
  resume_create: IcoResume,
  resume_enhanced: IcoResume,
  resume_parse: IcoResume,
};

const formatPlan = (planId: string, planName?: string) => planName || planId.replace(/[_-]/g, " ").trim() || "Free Plan";

const firstName = (name: string) => {
  const trimmed = name?.trim();
  if (!trimmed) return "there";
  return trimmed
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const timeAgo = (ts: string) => {
  const diff = Date.now() - new Date(ts).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const percent = (value: number, total: number) => (total > 0 ? Math.min(100, Math.max(0, Math.round((value / total) * 100))) : 0);

const Header = ({ data }: { data: DashboardSummary }) => {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const planLabel = formatPlan(data.plan.plan_id, data.plan.plan_name);
  const [justOnboarded, setJustOnboarded] = useState(false);
  const hasProgress = Object.values(data.progress).some(Boolean);
  const hasUsage = Object.values(data.usage_counts).some((value) => Number(value) > 0);
  const isNewUser = justOnboarded || (!hasProgress && !hasUsage && data.recent_activity.length === 0);
  const greeting = isNewUser ? "Welcome" : "Welcome back";

  React.useEffect(() => {
    const completedOnboarding = window.sessionStorage.getItem("careerbot_onboarding_just_completed") === "1";
    if (completedOnboarding) {
      setJustOnboarded(true);
      window.sessionStorage.removeItem("careerbot_onboarding_just_completed");
    }
  }, []);

  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-[0_12px_38px_rgba(15,23,42,0.04)] sm:px-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-bold text-gray-500">{today}</p>
        <h1 className="mt-1 text-[22px] font-black leading-tight tracking-[-0.03em] text-gray-950 sm:text-[26px]">
          {greeting}, {firstName(data.user.name)}
        </h1>
        <p className="mt-1.5 max-w-3xl text-[13px] leading-5 text-gray-600">
          Complete your resume setup, improve ATS readiness, match better jobs, and keep your applications moving.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-1.5">
        <div className="px-3 py-1.5">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Plan</p>
          <p className="mt-0.5 text-sm font-black text-gray-950">{planLabel}</p>
        </div>
        <Link href="/payments" className="inline-flex h-9 items-center rounded-xl bg-white px-3.5 text-sm font-black text-[#2557a7] shadow-sm ring-1 ring-gray-200 transition hover:bg-[#eef4ff]">
          Manage
        </Link>
      </div>
    </header>
  );
};

const ReadinessPath = ({ data, lowCredits }: { data: DashboardSummary; lowCredits: boolean }) => {
  const steps = [
    { label: "Upload Resume", complete: data.progress.resume_uploaded },
    { label: "Complete Profile", complete: data.progress.profile_completed },
    { label: "ATS Scan", complete: data.progress.ats_scan_done },
    { label: "Browse & Apply", complete: data.progress.job_applied },
  ];
  const completed = steps.filter((step) => step.complete).length;
  const activeIndex = steps.findIndex((step) => !step.complete);
  const currentIndex = activeIndex === -1 ? steps.length - 1 : activeIndex;

  return (
    <div className="border-b border-gray-200 px-4 py-3.5 sm:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Career readiness</p>
          <p className="mt-1 text-sm font-bold text-gray-700">{completed}/4 steps complete</p>
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-4 lg:max-w-3xl">
          {steps.map((step, index) => {
            const active = !lowCredits && index === currentIndex && !step.complete;
            const dimmed = lowCredits; // all steps inactive when upgrade needed
            return (
              <div key={step.label} className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black ${
                    step.complete
                      ? dimmed ? "bg-gray-300 text-white" : "bg-[#2557a7] text-white"
                      : active ? "bg-[#eef4ff] text-[#2557a7] ring-1 ring-[#2557a7]"
                      : "bg-gray-100 text-gray-400"
                  }`}>
                    {step.complete ? <Check size={9} strokeWidth={3} /> : index + 1}
                  </span>
                  <span className={`truncate text-[13px] font-black ${
                    step.complete
                      ? dimmed ? "text-gray-400" : "text-gray-950"
                      : active ? "text-gray-950" : "text-gray-500"
                  }`}>{step.label}</span>
                </div>
                <div className="mt-2 h-1 rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-[#2557a7]" style={{
                    width: step.complete ? (dimmed ? "100%" : "100%") : active ? "42%" : "0%",
                    opacity: dimmed && step.complete ? 0.25 : 1,
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const StatusRow = ({ label, value, detail }: { label: string; value: string; detail: string }) => (
  <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-gray-100 py-3 last:border-b-0">
    <div>
      <p className="text-sm font-black text-gray-950">{label}</p>
      <p className="mt-1 text-xs font-semibold text-gray-500">{detail}</p>
    </div>
    <p className="text-base font-black text-gray-950">{value}</p>
  </div>
);

const PrimaryDashboardPanel = ({ data, action, lowCredits }: { data: DashboardSummary; action: DashboardAction; lowCredits: boolean }) => {
  const ActionIcon = action.Icon;
  const profileState = data.profile.completeness >= 85 ? "Strong" : data.profile.completeness >= 60 ? "Improving" : "Needs setup";
  const atsValue = data.best_scores.ats_score == null ? "Not scanned" : `${data.best_scores.ats_score}`;
  const matchValue = data.best_scores.job_match_score == null ? "No match" : `${data.best_scores.job_match_score}`;

  return (
    <section className={`${SURFACE} overflow-hidden`}>
      <ReadinessPath data={data} lowCredits={lowCredits} />
      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="px-4 py-5 sm:px-5 lg:py-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#c8d7ef] bg-[#f8fbff] px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#2557a7]">
            <ActionIcon size={14} /> Next best action
          </div>
          <h2 className="mt-3 max-w-3xl text-[24px] font-black leading-tight tracking-[-0.03em] text-gray-950 sm:text-[28px]">
            {action.label}
          </h2>
          <p className="mt-2 max-w-3xl text-[13px] leading-5 text-gray-600">{action.detail}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {action.href ? (
              <Link href={action.href} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2557a7] px-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,87,167,0.2)] transition hover:bg-[#1f4a91]">
                {action.cta} <ArrowRight size={16} />
              </Link>
            ) : (
              <button type="button" onClick={action.onClick} disabled={action.loading} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2557a7] px-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,87,167,0.2)] transition hover:bg-[#1f4a91] disabled:cursor-not-allowed disabled:opacity-60">
                {action.loading ? <Loader2 size={16} className="animate-spin" /> : <ActionIcon size={16} />}
                {action.loading ? "Processing" : action.cta}
              </button>
            )}
            {action.meta && <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-black text-gray-600">{action.meta}</span>}
          </div>
        </div>

        <aside className="border-t border-gray-200 bg-[#fbfcfd] px-4 py-3.5 sm:px-5 lg:border-l lg:border-t-0">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Readiness details</p>
          <div className="mt-3">
            <StatusRow label="Profile score" value={`${data.profile.completeness}%`} detail={profileState} />
            <StatusRow label="ATS score" value={atsValue} detail={data.best_scores.ats_score == null ? "Run your first scan" : "Best scan score"} />
            <StatusRow label="Job match" value={matchValue} detail={data.best_scores.job_match_score == null ? "Compare a job first" : "Best match score"} />
          </div>
        </aside>
      </div>
    </section>
  );
};

const ProfileGaps = ({ data }: { data: DashboardSummary }) => {
  const gaps = data.profile.missing_fields.length ? data.profile.missing_fields : ["No critical gaps"];

  return (
    <section className={`${SURFACE} ${PAD}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Personalization</p>
          <h2 className="mt-1.5 text-lg font-black tracking-[-0.025em] text-gray-950">Profile gaps</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">Missing fields that affect matching, ATS guidance, and interview recommendations.</p>
        </div>
        <Link href="/profile" className="rounded-full border border-gray-200 px-3 py-1.5 text-sm font-black text-[#2557a7] transition hover:bg-[#eef4ff]">Fix</Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {gaps.slice(0, 8).map((field) => (
          <span key={field} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-black capitalize text-gray-700">{field.replace(/_/g, " ")}</span>
        ))}
      </div>
    </section>
  );
};

const OperationsTable = ({ data }: { data: DashboardSummary }) => {
  const rows = [
    { label: "Resume Builder", detail: "Create, parse, and maintain your resume workspace", href: "/builder/start", Icon: FileText, metric: `${data.usage_counts.resumes_created + data.usage_counts.resumes_parsed} used` },
    { label: "ATS Scan", detail: "Check screening compatibility before applying", href: "/atslogin", Icon: ScanSearch, metric: data.best_scores.ats_score == null ? "Not scanned" : `${data.best_scores.ats_score} best` },
    { label: "Job Match", detail: "Compare roles against your resume and profile", href: "/jobmatch", Icon: Briefcase, metric: `${data.usage_counts.job_matches} matches` },
    { label: "Browse Jobs", detail: "Find roles and continue your application momentum", href: "/jobslogin", Icon: Briefcase, metric: `${data.usage_counts.job_applications} applied` },
    { label: "Mock Interview", detail: "AI-powered live mock interview sessions", href: "/mock-interview", Icon: MessageSquare, metric: `${data.usage_counts.mock_interviews_taken ?? 0} sessions` },
    { label: "Communication Assessment", detail: "Improve spoken and listening communication skills", href: "/communication/start", Icon: MessageSquare, metric: `${data.usage_counts.assessments_taken ?? 0} sessions` },
    { label: "Mock Test", detail: "Aptitude, arithmetic, reasoning and technical practice", href: "/mock-test", Icon: MessageSquare, metric: `${data.usage_counts.mock_tests_taken ?? 0} tests` },
    { label: "Coding Practice", detail: "Prepare for coding rounds and technical problems", href: "/coding-test", Icon: Code2, metric: `${data.usage_counts.coding_tests_taken ?? 0} sessions` },
  ];

  return (
    <section className={`${SURFACE} overflow-hidden`}>
      <div className="grid gap-2 border-b border-gray-200 px-4 py-3.5 sm:px-5 lg:grid-cols-[180px_1fr] lg:items-end">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">App workflows</p>
          <h2 className="mt-1.5 text-lg font-black tracking-[-0.025em] text-gray-950">Career operations</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-gray-500">Core product workflows aligned to the official dashboard journey.</p>
      </div>
      <div className="divide-y divide-gray-100">
        {rows.map((row) => {
          const Icon = row.Icon;
          return (
            <div key={row.label} className="grid grid-cols-[40px_1fr_auto] items-center gap-3 px-5 py-3 sm:px-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-[#2557a7]"><Icon size={17} /></span>
              <span className="min-w-0">
                <span className="block text-sm font-black text-gray-950">{row.label}</span>
                <span className="mt-1 block truncate text-xs leading-5 text-gray-500">{row.detail}</span>
              </span>
              <span className="hidden text-sm font-black text-gray-500 sm:block">{row.metric}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const PlanUsage = ({ data, creditsUsed }: { data: DashboardSummary; creditsUsed: number }) => {
  const creditUsagePct = percent(creditsUsed, data.plan.credits_total);

  return (
    <section className={`${SURFACE} ${PAD}`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Plan usage</p>
          <h2 className="mt-1.5 text-lg font-black tracking-[-0.025em] text-gray-950">Credits</h2>
        </div>
        <p className="text-2xl font-black tracking-[-0.035em] text-gray-950">{creditUsagePct}%</p>
      </div>
      <div className="mt-4 h-2 rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-[#2557a7]" style={{ width: `${creditUsagePct}%` }} />
      </div>
      <p className="mt-3 text-sm font-semibold text-gray-500">{creditsUsed} used, {data.plan.credits_remaining} remaining</p>
    </section>
  );
};

const ExtensionsPanel = () => (
  <section className={`${SURFACE} overflow-hidden`}>
    <div className="border-b border-gray-200 px-4 py-3.5 sm:px-5">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Extensions</p>
      <h2 className="mt-1.5 text-lg font-black tracking-[-0.025em] text-gray-950">Install browser tools</h2>
      <p className="mt-2 text-sm leading-6 text-gray-500">Move job context into CareerBot workflows faster.</p>
    </div>
    <div className="grid grid-cols-[40px_1fr_auto] items-center gap-3 px-5 py-3.5 sm:px-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4ff] text-[#2557a7]">
        <Briefcase size={17} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black text-gray-950">CareerBot Extension</span>
        <span className="mt-1 block text-xs leading-5 text-gray-500">Capture job descriptions, open job match, and generate cover letters directly from any job board.</span>
      </span>
      <span className="hidden text-sm font-black text-[#2557a7] sm:inline">Install now</span>
    </div>
  </section>
);

const ActivityLedger = ({ activities }: { activities: ActivityItem[] }) => {
  const visibleActivities = activities.slice(0, 4);

  return (
    <section className={`${SURFACE} overflow-hidden`}>
      <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="text-lg font-black tracking-[0.025em] text-gray-950">Recent activity</h2>
          <p className="mt-1 text-sm leading-5 text-gray-500">Latest resume, ATS, profile, and job-search actions.</p>
        </div>
        <Link
          href="/dashboard/recent-activity"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-black text-[#2557a7] transition hover:bg-[#eef4ff]"
        >
          View all <ArrowRight size={14} />
        </Link>
      </div>

      {visibleActivities.length > 0 ? (
        <div className="px-4 py-3 sm:px-5">
          <div className="relative space-y-2 before:absolute before:left-5 before:top-5 before:h-[calc(100%-40px)] before:w-px before:bg-gray-200">
            {visibleActivities.map((item) => {
              const Icon = activityIcons[(item.type ?? item.feature ?? "").toLowerCase()] ?? ActivityIcon;
              const creditLabel = item.credits_used ? `${item.credits_used} cr` : "Free";

              return (
                <div key={item.id} className="relative grid grid-cols-[42px_1fr] gap-3 rounded-2xl border border-transparent px-1 py-2 transition hover:border-gray-200 hover:bg-gray-50 sm:grid-cols-[42px_1fr_auto]">
                  <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-[#d9e5f8] bg-[#eef4ff] text-[#2557a7] shadow-[0_8px_20px_rgba(37,87,167,0.08)]">
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0 self-center">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[13px] font-black text-gray-950">{item.feature_label}</p>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-black text-gray-500">{creditLabel}</span>
                    </div>
                    <p className="mt-1 truncate text-xs leading-5 text-gray-500">{item.result_summary || "Action completed successfully"}</p>
                  </div>
                  <div className="col-start-2 self-center text-left sm:col-start-auto sm:text-right">
                    <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-bold text-gray-500 ring-1 ring-gray-200">
                      {timeAgo(item.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="px-5 py-8 sm:px-6">
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-7 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#2557a7] shadow-sm ring-1 ring-gray-200">
              <ActivityIcon size={18} />
            </span>
            <p className="mt-3 text-sm font-black text-gray-950">No activity yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-gray-500">
              Your completed resume uploads, ATS scans, profile updates, and applications will appear here.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

const TrendsPanel = ({ data }: { data: DashboardSummary }) => {
  const fallbackRoles = [
    { title: "Full Stack Developer", growth: "+18%", job_count: 1240, vacancies: 0 },
    { title: "Data Analyst", growth: "+12%", job_count: 860, vacancies: 0 },
    { title: "UX Designer", growth: "+9%", job_count: 520, vacancies: 0 },
  ];
  const roles = data.trending_roles?.length ? data.trending_roles : fallbackRoles;

  return (
    <section className={`${SURFACE} ${PAD}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Hiring signal</p>
      <h2 className="mt-1.5 text-lg font-black tracking-[-0.025em] text-gray-950">Trending roles</h2>
      <div className="mt-4 divide-y divide-gray-100">
        {roles.slice(0, 3).map((role, index) => (
          <div key={`${role.title}-${index}`} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-black text-gray-950">{role.title}</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">{role.job_count || role.vacancies || "Live"} openings</p>
            </div>
            <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-black text-[#2557a7]">{role.growth}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

const UpgradeNote = ({ lowCredits }: { lowCredits: boolean }) => {
  if (!lowCredits) return null;

  return (
    <section className="rounded-2xl border border-[#c8d7ef] bg-[#f4f8ff] px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4ff] text-[#2557a7]"><Sparkles size={18} /></span>
          <div>
            <p className="text-sm font-black text-gray-950">Credits are running low</p>
            <p className="mt-1 text-sm leading-6 text-gray-600">Upgrade to keep ATS scans, job matching, and applications available when you need them.</p>
          </div>
        </div>
        <Link href="/payments" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#c8d7ef] bg-white px-4 text-sm font-black text-[#2557a7] transition hover:bg-[#eef4ff]">
          Manage plan <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
};

const AtsPopup = ({
  running,
  score,
  error,
  resumeId,
  onRetry,
  onCancel,
}: {
  running: boolean;
  score: number | null;
  error: string | null;
  resumeId: string | null;
  onRetry: () => void;
  onCancel: () => void;
}) => {
  const scorePct = score !== null ? Math.min(Math.max(score, 0), 100) : 0;
  const label = scorePct >= 70 ? "ATS ready" : scorePct >= 40 ? "Needs work" : "High risk";
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);
  const reportHref = `/atslogin/report${resumeId ? `?resume_id=${encodeURIComponent(resumeId)}` : ""}`;

  React.useEffect(() => {
    previousActiveElementRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
      previousActiveElementRef.current?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {running
        ? <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        : <button aria-label="Cancel" className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      }
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ats-popup-title"
        tabIndex={-1}
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
        onKeyDown={(e) => !running && e.key === "Escape" && onCancel()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ background: "linear-gradient(135deg, #1f4e98, #2557a7, #5896d7)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <ScanSearch size={15} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider leading-none mb-0.5">ATS Analysis</p>
              <p id="ats-popup-title" className="text-sm font-bold text-white leading-none">ATS Score Report</p>
            </div>
          </div>
          {!running && (
            <button onClick={onCancel} aria-label="Cancel" className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <X size={14} className="text-white" />
            </button>
          )}
        </div>

        {/* Calculating */}
        {running && (
          <div className="p-5 flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center mt-2" style={{ width: 80, height: 80 }}>
              <svg width="80" height="80" className="-rotate-90 animate-spin" style={{ animationDuration: "2s" }}>
                <circle cx="40" cy="40" r="32" fill="none" stroke="#dbeafe" strokeWidth="6" />
                <circle cx="40" cy="40" r="32" fill="none" stroke="#2557a7" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 32 * 0.25} ${2 * Math.PI * 32 * 0.75}`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <ScanSearch size={22} style={{ color: "#2557a7" }} />
              </div>
            </div>
            <div className="text-center pb-2">
              <p className="text-sm font-bold text-gray-900">Calculating your ATS score…</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Analysing your resume against ATS screening criteria</p>
            </div>
          </div>
        )}

        {/* Score */}
        {!running && score !== null && (
          <div className="px-5 py-6 text-center sm:px-6">
            <p className="text-5xl font-black leading-none text-gray-950">{scorePct}</p>
            <p className="mt-2 text-sm font-black uppercase text-[#2557a7]">{label}</p>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-600">
              Open the full ATS report to review keyword gaps, formatting quality, and recruiter-screening risk.
            </p>
            <div className="mt-5 flex gap-3">
              <Link href={reportHref} className="flex h-10 flex-1 items-center justify-center rounded-xl bg-[#2557a7] text-sm font-black text-white">
                Full report
              </Link>
              <button type="button" onClick={onCancel} className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-black text-gray-700">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {!running && error && (
          <div className="p-5 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mt-2" style={{ background: "#fef2f2" }}>
              <AlertCircle size={26} className="text-red-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-900 mb-1">Scan failed</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">{error}</p>
            </div>
            <div className="flex gap-2 w-full pb-1">
              <button onClick={onRetry} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90" style={{ background: "linear-gradient(135deg, #2557a7, #1f4e98)" }}>
                Try Again
              </button>
              <button onClick={onCancel} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardContent = ({ data }: { data: DashboardSummary }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { refreshDashboard } = useDashboard();
  const { step, error: fillError, result: fillResult, resumeId, fill, reset } = useResumeProfileFill(data.user.id);
  // P2 fix: derived from prop so it updates on every silent refresh
  const atsScore = data.best_scores.ats_score ?? null;

  const [showAtsScanPopup, setShowAtsScanPopup] = useState(false);
  const [atsScanRunning, setAtsScanRunning] = useState(false);
  const [atsScanScore, setAtsScanScore] = useState<number | null>(null);
  const [atsScanError, setAtsScanError] = useState<string | null>(null);
  const [atsScanDismissed, setAtsScanDismissed] = useState(false);
  const [resumeJustUploaded, setResumeJustUploaded] = useState(false);

  // When upload completes, mark step done optimistically and refresh backend data
  React.useEffect(() => {
    if (step === "done") {
      setResumeJustUploaded(true);
      refreshDashboard();
    }
  }, [step, refreshDashboard]);

  const modalOpen = step !== "idle";
  const creditsUsed = Math.max(0, data.plan.credits_total - data.plan.credits_remaining);
  const lowCredits = data.plan.credits_total > 0 ? data.plan.credits_remaining / data.plan.credits_total <= 0.2 : data.plan.credits_remaining <= 10;
  const effectiveData: DashboardSummary = {
    ...data,
    progress: {
      ...data.progress,
      resume_uploaded: resumeJustUploaded ? true : data.progress.resume_uploaded,
      ats_scan_done: (atsScore !== null || atsScanDismissed) ? true : data.progress.ats_scan_done,
    },
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) fill(file);
    event.target.value = "";
  };

  const executeScan = async () => {
    if (!resumeId) return;
    setAtsScanRunning(true);
    setAtsScanError(null);
    setAtsScanScore(null);
    try {
      const score = await runAtsScan(resumeId);
      setAtsScanScore(score);
    } catch (err) {
      setAtsScanError(err instanceof Error ? err.message : "Failed to calculate ATS score");
    } finally {
      setAtsScanRunning(false);
    }

  };

  const handleAtsScan = () => {
    if (atsScore !== null) {
      // Existing backend score — show popup immediately with it
      setAtsScanScore(atsScore);
      setAtsScanError(null);
      setAtsScanRunning(false);
      setShowAtsScanPopup(true);
      return;
    }

    if (!resumeId) {
      toast.info("Upload or parse a resume first, then your ATS report will be ready.");
      window.location.href = "/atslogin";
      return;
    }

    // Open popup immediately in calculating state, run scan in background
    setAtsScanScore(null);
    setAtsScanError(null);
    setShowAtsScanPopup(true);
    executeScan();
  };

  const handleAtsScanCancel = () => {
    setShowAtsScanPopup(false);
    // If a fresh scan just completed, advance step 4 optimistically and pull fresh data
    if (atsScore === null && atsScanScore !== null) {
      setAtsScanDismissed(true);
      refreshDashboard();
    }
  };

  const primaryAction: DashboardAction = lowCredits
    ? {
        label: "Upgrade Plan",
        detail: "Your credits are low. Upgrade to keep ATS scans, job matching, and applications moving without interruption.",
        cta: "Upgrade plan",
        meta: `${data.plan.credits_remaining} credits left`,
        href: "/payments",
        Icon: Crown,
      }
    : !effectiveData.progress.resume_uploaded
      ? {
          label: "Upload Resume",
          detail: "Upload your resume to create the baseline for profile completion, ATS scoring, and job matching.",
          cta: "Upload resume",
          meta: "",
          onClick: () => fileInputRef.current?.click(),
          Icon: Upload,
        }
      : !effectiveData.progress.profile_completed
        ? {
            label: "Complete Profile",
            detail: "Add missing profile details so CareerBot can personalize matches, ATS guidance, and interview preparation.",
            cta: "Complete profile",
            meta: `${data.profile.completeness}% complete`,
            href: "/profile",
            Icon: User,
          }
        : !effectiveData.progress.ats_scan_done
          ? {
              label: "ATS Scan",
              detail: "Run an ATS scan before applying so you can catch formatting, keyword, and screening gaps early.",
              cta: "Run ATS scan",
              meta: data.recommended_step.estimated_time || "~1 minute",
              onClick: handleAtsScan,
              Icon: ScanSearch,
            }
          : {
              label: "Browse & Apply",
              detail: "Your core setup is ready. Browse matched roles and continue your application momentum.",
              cta: "Browse jobs",
              meta: `${data.usage_counts.job_applications} applications`,
              href: "/jobslogin",
              Icon: Briefcase,
            };

  return (
    <>
      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />

      {modalOpen && (
        <ProfileFillModal
          isOpen={modalOpen}
          step={step}
          error={fillError}
          result={fillResult}
          onClose={reset}
        />
      )}

      {showAtsScanPopup && (
        <AtsPopup
          running={atsScanRunning}
          score={atsScanScore}
          error={atsScanError}
          resumeId={resumeId}
          onRetry={executeScan}
          onCancel={handleAtsScanCancel}
        />
      )}

      <main className="min-h-screen bg-[#f6f7f9] px-4 py-5 text-gray-950 sm:px-6 lg:px-8 lg:py-6">
        <div className="mx-auto max-w-[1320px] space-y-5">
          <Header data={effectiveData} />
          <PrimaryDashboardPanel data={effectiveData} action={primaryAction} lowCredits={lowCredits} />

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
              <ProfileGaps data={data} />
              <OperationsTable data={data} />
              <ActivityLedger activities={data.recent_activity} />
            </div>
            <div className="space-y-5">
              <PlanUsage data={data} creditsUsed={creditsUsed} />
              <ExtensionsPanel />
              <TrendsPanel data={data} />
            </div>
          </section>

          <UpgradeNote lowCredits={lowCredits} />
        </div>
      </main>
    </>
  );
};

export default DashboardContent;






