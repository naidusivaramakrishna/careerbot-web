"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  ChevronRight,
  CircleCheck,
  Clock,
  Loader2,
  MessageSquareText,
  MessagesSquare,
  Plus,
  Search,
  Ticket as TicketIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  getChatSessionHistory,
  getSupportTickets,
  getTicketDetails,
  cancelTicket,
  escalateToSupport,
  uploadTicketAttachment,
  type ChatSessionSummary,
  type SupportTicket,
  type TicketAttachmentSummary,
} from "@/api/chatbotApi";
import { getProfile } from "@/api/userApi";
import {
  TICKET_CATEGORIES,
  FEATURE_ISSUE_TYPES,
  TICKET_STATUS_META,
  CANCELLABLE_TICKET_STATUSES,
  formatFeatureLabel,
  MAX_TICKET_ATTACHMENTS,
  MAX_TICKET_ATTACHMENT_BYTES,
  MAX_TICKET_SUBJECT_CHARS,
  TICKET_CONTEXT_PARAM,
  readTicketContext,
  clearTicketContext,
} from "@/lib/ticketCategories";
import TicketAttachmentLink from "@/components/common/TicketAttachmentLink";

// The explicit terminal set, used to decide solvedCount below -- NOT just
// "whatever isn't pending". A status this frontend doesn't recognize (a
// future backend addition, a typo) falls back to the "Open" pill visually
// (see TICKET_STATUS_META[ticket.status] || TICKET_STATUS_META.open); if
// solvedCount were instead `tickets.length - pendingCount`, that same
// ticket would silently count as Solved/Closed while its badge says
// Open -- the summary cards and the row it's describing would disagree.
const TERMINAL_TICKET_STATUSES = new Set(["resolved", "closed", "cancelled"]);

type DashboardView = "overview" | "tickets";

const NAV_ITEMS: { id: DashboardView; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Support Center", icon: MessageSquareText },
  { id: "tickets", label: "My Tickets", icon: TicketIcon },
];

const describeError = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

const getHttpStatus = (error: unknown): number | undefined =>
  typeof error === "object" && error !== null && "response" in error
    ? (error as { response?: { status?: number } }).response?.status
    : undefined;

// Same logic ChatApp.tsx and the guest ticket portal use to derive a ticket
// subject from the question that preceded an unhelpful answer -- duplicated
// here (not imported) since it's a small pure text helper, not shared
// business logic.
const firstSentence = (text: string): string => {
  const firstLine = text.split("\n")[0];

  const match = firstLine.match(/^.{20,}?[.!?](?=\s|$)/);
  if (match) return match[0].trim();

  if (firstLine.length >= 20) return firstLine.trim();

  if (text.length > 160) {
    const truncated = text.substring(0, 160);
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > 20) return truncated.substring(0, lastSpace).trim() + "…";
  }

  return text.trim();
};

const formatDate = (iso?: string): string =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

const MIN_SUBJECT_LENGTH = 5;
const MIN_DESCRIPTION_LENGTH = 20;

type FieldErrors = Partial<Record<"category" | "subject" | "description", string>>;

export default function SupportHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeView, setActiveView] = useState<DashboardView>(() =>
    searchParams.get("tab") === "tickets" ? "tickets" : "overview"
  );
  const [searchQuery, setSearchQuery] = useState("");
  // Receives ?raise=1 (open the create-ticket form at once) plus the
  // original Q&A, for the subject prefill: the chatbot's "Raise a support
  // ticket" entry points send signed-in users here (ChatApp.tsx
  // redirectToTicketPage), with the Q&A in sessionStorage (?ctx=) or, when
  // that failed, ?question=&answer= -- same hand-off as /support/tickets/new.
  //
  // This is state, not a plain one-time read, specifically so it can be
  // CLEARED (see clearRaiseContext below): without that, the question/
  // answer captured from the URL would stick around for the rest of the
  // page visit and get attached to every later ticket too -- including
  // ones opened via the unrelated "Create Ticket" button for a completely
  // different issue.
  //
  // Read after mount, not in a state initializer: this page is
  // server-rendered and sessionStorage exists only in the browser, so an
  // initializer gave the server an empty prefill and the client the stored
  // one (a hydration mismatch). The create-ticket form waits for this read
  // (raiseContextReady) because it takes its subject prefill once, at mount.
  const [raiseContext, setRaiseContext] = useState<{ question: string; answer: string } | null>(null);
  const [raiseContextReady, setRaiseContextReady] = useState(false);
  useEffect(() => {
    // Capped defensively here too (readTicketContext caps; ChatApp.tsx
    // already caps before handing them over) -- this page must not trust
    // the query string alone. Only a non-empty read is applied: a re-run
    // after the hand-off was cleared (or the params stripped) must not
    // drop the context already captured.
    const { question, answer } = readTicketContext(searchParams);
    if (question || answer) setRaiseContext({ question, answer });
    // One-time hand-off: drop the stored Q&A once read.
    clearTicketContext(searchParams);
    setRaiseContextReady(true);
  }, [searchParams]);
  const [autoRaise] = useState(() => searchParams.get("raise") === "1");
  // Lifted to page level so the Create Ticket action is reachable from both
  // the sidebar nav item and the main content's header button.
  const [showCreateForm, setShowCreateForm] = useState(autoRaise);

  // Drops raise/question/answer from the URL (keeping any other param,
  // e.g. ?tab=) so refreshing or going back never reopens the create-ticket
  // form with stale prefill -- the URL otherwise keeps them forever, since
  // nothing else ever removes them.
  const stripRaiseParamsFromUrl = () => {
    if (
      !searchParams.has("raise") &&
      !searchParams.has("question") &&
      !searchParams.has("answer") &&
      !searchParams.has(TICKET_CONTEXT_PARAM)
    ) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("raise");
    next.delete("question");
    next.delete("answer");
    next.delete(TICKET_CONTEXT_PARAM);
    const query = next.toString();
    router.replace(`/dashboard/support-history${query ? `?${query}` : ""}`);
  };

  const clearRaiseContext = () => {
    setRaiseContext(null);
    stripRaiseParamsFromUrl();
  };
  // Bumped after a successful creation so an already-mounted
  // SupportTicketsSection remounts and refetches -- if the ticket was
  // created while on the Support Center view instead, that section simply
  // fetches fresh data the next time it mounts, same as today.
  const [ticketsRefreshKey, setTicketsRefreshKey] = useState(0);

  // Bumped when the signed-in account actually changes (detected the same
  // way ChatApp.tsx does: a storage event on the auth keys, or the tab
  // regaining focus). Used as part of both sections' `key` below, so React
  // unmounts and remounts them on a switch -- without this, a second
  // account signing in from another tab would leave this page showing the
  // FIRST account's conversations/tickets, and any ticket created here
  // would be filed under the account whose cookie is now active, not the
  // one still displayed as "Submitting as". Also closes any open
  // create-ticket modal, since it isn't safe to let a submission in flight
  // land under a different account than the one that opened it.
  const [accountGeneration, setAccountGeneration] = useState(0);
  const knownEmailRef = useRef<string | null>(null);
  // Set when a check fails before any baseline exists: the sections may
  // have loaded under an account we never identified, so the first
  // successful read afterwards refetches them instead of being trusted.
  const baselineMissedRef = useRef(false);
  // storage and visibilitychange can both fire checkAccount back-to-back,
  // and their getProfile requests can resolve out of order -- without a
  // sequence number, a slow OLDER check resolving after a fast NEWER one
  // would overwrite knownEmailRef with its stale read, re-detecting (or
  // masking) a switch on every check after. Same pattern as ChatApp.tsx's
  // checkAuthStatus (authCheckSeqRef/answeredAuthCheckRef).
  const checkSeqRef = useRef(0);
  const answeredCheckSeqRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const checkAccount = async () => {
      const checkSeq = ++checkSeqRef.current;
      try {
        const profile = await getProfile({ skipAuthRedirect: true });
        if (cancelled) return;
        // A newer check already produced a definite answer -- this one's
        // result is stale by the time it arrived, discard it.
        if (checkSeq < answeredCheckSeqRef.current) return;
        answeredCheckSeqRef.current = checkSeq;
        const email = profile?.email || null;
        if (knownEmailRef.current && email && knownEmailRef.current !== email) {
          setAccountGeneration((g) => g + 1);
          setShowCreateForm(false);
          clearRaiseContext();
        } else if (!knownEmailRef.current && email && baselineMissedRef.current) {
          setAccountGeneration((g) => g + 1);
        }
        if (email) baselineMissedRef.current = false;
        knownEmailRef.current = email;
      } catch {
        if (!knownEmailRef.current) baselineMissedRef.current = true;
        // Signed out, or the check itself failed -- neither is treated as
        // a confirmed switch to a DIFFERENT account here, and (being
        // inconclusive) never marks this sequence number as answered, so
        // it can't block a different in-flight check from applying its
        // own result once it resolves.
      }
    };
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "access_token" || e.key === "user_email" || e.key === "token_last_refreshed_at") {
        checkAccount();
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") checkAccount();
    };
    checkAccount();
    window.addEventListener("storage", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f6f7f9] text-gray-950">
      <aside className="flex w-16 shrink-0 flex-col border-r border-gray-200 bg-white px-2 py-5 sm:w-60 sm:px-4">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 px-1 text-xs font-bold text-gray-400 transition hover:text-[#2557a7]"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        <div className="mb-6 flex items-center gap-2 px-1">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#2557a7] text-white">
            <Bot className="h-4 w-4" />
          </span>
          <span className="hidden text-base font-black tracking-[-0.02em] text-gray-950 sm:inline">CareerBot</span>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                title={item.label}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-black transition ${
                  isActive ? "bg-[#eef4ff] text-[#2557a7]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto hidden flex-col items-center rounded-2xl px-3 py-4 text-center sm:flex">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef4ff] text-[#2557a7]">
            <MessagesSquare className="h-5 w-5" />
          </span>
          <p className="mt-2 text-sm font-black text-gray-950">Need help?</p>
          <p className="text-xs text-gray-500">We&apos;re here for you</p>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <div className="mx-auto max-w-5xl space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations or tickets…"
                aria-label="Search conversations or tickets"
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2557a7]"
              />
            </div>
            <button
              onClick={() => {
                // A fresh, unrelated ticket -- never reuses whatever
                // question/answer brought the user here originally.
                clearRaiseContext();
                setShowCreateForm(true);
              }}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#2557a7] px-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,87,167,0.2)] transition hover:bg-[#1f4a91]"
            >
              <Plus className="h-4 w-4" />
              Create Ticket
            </button>
          </div>

          {activeView === "overview" ? (
            <ConversationHistorySection key={accountGeneration} searchQuery={searchQuery} />
          ) : (
            <SupportTicketsSection key={`${accountGeneration}-${ticketsRefreshKey}`} searchQuery={searchQuery} />
          )}
        </div>
      </main>

      {showCreateForm && raiseContextReady && (
        <RaiseTicketModal
          originalQuestion={raiseContext?.question || ""}
          chatbotAnswer={raiseContext?.answer || ""}
          onClose={() => {
            setShowCreateForm(false);
            clearRaiseContext();
          }}
          onCreated={() => {
            setShowCreateForm(false);
            clearRaiseContext();
            setTicketsRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CONVERSATION HISTORY
══════════════════════════════════════════════════════════════ */

// getChatSessionHistory's own default -- kept explicit here so loadMore's
// skip math (sessions.length is always a multiple of this after a full
// page) matches the page size actually requested.
const SESSIONS_PAGE_SIZE = 20;

function ConversationHistorySection({ searchQuery }: { searchQuery: string }) {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { sessions: data, total: count } = await getChatSessionHistory(0, SESSIONS_PAGE_SIZE);
        if (!cancelled) {
          setSessions(data);
          setTotal(count);
        }
      } catch (err) {
        if (!cancelled) setError(describeError(err, "Failed to load conversation history."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const { sessions: data, total: count } = await getChatSessionHistory(sessions.length, SESSIONS_PAGE_SIZE);
      setSessions((prev) => [...prev, ...data]);
      setTotal(count);
    } catch (err) {
      toast.error(describeError(err, "Failed to load more conversations."));
    } finally {
      setLoadingMore(false);
    }
  };

  // This page is chatbot-excluded (see chatbotVisibility.ts) so it can be a
  // true full-screen view -- the floating widget never sits on top of it.
  // That means continuing/starting a chat has to navigate to a page where
  // the widget IS allowed, so it's actually there to open. /dashboard
  // always qualifies. A full reload (not router.push) is required either
  // way: the widget only reads ?chat_session=/?chat=new from the URL once, on
  // its own mount.
  const continueConversation = (sessionId: string) => {
    window.location.href = `/dashboard?chat_session=${encodeURIComponent(sessionId)}`;
  };

  const startNewConversation = () => {
    window.location.href = `/dashboard?chat=new`;
  };

  if (loading) {
    return (
      <section className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.055)]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#2557a7]" />
          <p className="mt-3 text-sm font-black text-gray-950">Loading conversations</p>
        </div>
      </section>
    );
  }

  const query = searchQuery.trim().toLowerCase();
  // A closed session has no live conversation to continue -- the backend
  // keeps it (and still returns it from history) but a follow-up message
  // into it 409s, so it must not appear as an open, clickable row here.
  const visibleSessions = sessions.filter(
    (s) =>
      s.status !== "closed" &&
      (!query || s.title.toLowerCase().includes(query) || s.preview.toLowerCase().includes(query))
  );

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.055)]">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
        <h2 className="text-lg font-black tracking-[-0.025em] text-gray-950">Conversation History</h2>
        <button
          onClick={startNewConversation}
          className="shrink-0 whitespace-nowrap text-xs font-black text-[#2557a7] hover:underline"
        >
          ✨ New Conversation
        </button>
      </div>

      {error && (
        <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {!error && (
        <>
          {/* "Load more" must be reachable regardless of whether the
              CURRENTLY loaded sessions happen to all be closed (filtered out
              above) -- nesting it inside the non-empty branch would strand a
              user whose most recent page is entirely closed conversations
              with no way to reach their older, still-active ones. */}
          {visibleSessions.length === 0 ? (
            <div className="px-5 py-12 text-center sm:px-6">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#2557a7] ring-1 ring-[#d9e5f8]">
                <MessageSquareText className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-black text-gray-950">
                {total === 0
                  ? "No conversations yet"
                  : query
                    ? "No conversations match your search"
                    : "No active conversations on this page"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                {total === 0
                  ? "Start chatting with CareerBot and your conversations will show up here."
                  : query
                    ? // Search only runs against the sessions already loaded
                      // on this page -- with more still unloaded, "no match"
                      // would otherwise read as "none of your conversations
                      // match" when really only some were ever checked.
                      sessions.length < total
                      ? "Try a different search term, or load more conversations to search within them too."
                      : "Try a different search term."
                    : sessions.length < total
                      ? "Load more to see older conversations."
                      : "Closed conversations are hidden here."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {visibleSessions.map((session) => (
                <li
                  key={session.session_id}
                  className="flex cursor-pointer items-center gap-3 px-5 py-4 transition hover:bg-gray-50 sm:px-6"
                  role="button"
                  tabIndex={0}
                  onClick={() => continueConversation(session.session_id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      continueConversation(session.session_id);
                    }
                  }}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#2557a7]">
                    <MessageSquareText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-gray-950">{session.title}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">{session.preview}</p>
                  </div>
                  <div className="hidden shrink-0 text-right text-xs text-gray-400 sm:block">
                    <p>{formatDate(session.updated_at || session.created_at)}</p>
                    <p>{session.message_count} message{session.message_count === 1 ? "" : "s"}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                </li>
              ))}
            </ul>
          )}
          {sessions.length < total && (
            <div className="border-t border-gray-100 px-5 py-4 text-center sm:px-6">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="text-xs font-black text-[#2557a7] hover:underline disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : `Load more (${total - sessions.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════
   SUPPORT TICKETS
══════════════════════════════════════════════════════════════ */

// Only these 4 are shown in the dropdown -- "In Progress", "Waiting on
// You", and "Closed" are intentionally hidden here (still real, filterable
// statuses in TICKET_STATUS_META and still returned by the API; "All
// Statuses" still includes them, see the filtering logic below). This is a
// display-only trim, not a change to the underlying status system.
const VISIBLE_STATUS_FILTER_KEYS = ["open", "resolved", "cancelled"] as const;

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  ...VISIBLE_STATUS_FILTER_KEYS.map((status) => ({ value: status, label: TICKET_STATUS_META[status].label })),
];

function SupportTicketsSection({ searchQuery }: { searchQuery: string }) {
  // The full, unfiltered list -- summary counts always reflect every
  // ticket regardless of the status filter/search currently applied to the
  // visible list below, same as the "All / Pending / Solved" cards in the
  // reference design never change as you filter the table under them.
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      // Summary counts (and search/filter below) need the user's COMPLETE
      // ticket set, not just the first page -- walk every page the list
      // endpoint reports rather than assuming everything fits on page 1.
      // 50 is the backend's hard max for `limit` (422 above it).
      const first = await getSupportTickets(undefined, 1, 50);
      let all = first.data;
      for (let page = 2; page <= first.total_pages; page++) {
        const next = await getSupportTickets(undefined, page, 50);
        all = all.concat(next.data);
      }
      setTickets(all);
    } catch (err) {
      setError(describeError(err, "Failed to load support tickets."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // "Not terminal" (not "explicitly pending"), so an unrecognized status
  // -- which falls back to the "Open" pill visually -- is also counted as
  // pending here, rather than vanishing from both cards.
  const solvedCount = tickets.filter((t) => TERMINAL_TICKET_STATUSES.has(t.status)).length;
  const pendingCount = tickets.length - solvedCount;

  const query = searchQuery.trim().toLowerCase();
  const visibleTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesQuery =
      !query || t.subject.toLowerCase().includes(query) || t.ticket_id.toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard icon={TicketIcon} label="All Tickets" value={tickets.length} />
        <SummaryCard icon={Clock} label="Pending Tickets" value={pendingCount} />
        <SummaryCard icon={CircleCheck} label="Solved/Closed Tickets" value={solvedCount} />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.055)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-black tracking-[-0.025em] text-gray-950">My Tickets</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter tickets by status"
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs font-bold text-gray-700"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#2557a7]" />
          </div>
        ) : !error && visibleTickets.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#2557a7] ring-1 ring-[#d9e5f8]">
              <TicketIcon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-black text-gray-950">
              {tickets.length === 0 ? "No tickets yet" : "No tickets match your search/filter"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              {tickets.length === 0
                ? "Raise a ticket whenever you need help from a human."
                : 'Try a different search term or status, or choose "All statuses".'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop/tablet: table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-[11px] font-black uppercase tracking-[0.1em] text-gray-400">
                    <th className="px-5 py-3 sm:px-6">Ticket ID</th>
                    <th className="px-5 py-3">Subject</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Created</th>
                    <th className="px-5 py-3">Last updated</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleTickets.map((ticket) => {
                    const meta = TICKET_STATUS_META[ticket.status] || TICKET_STATUS_META.open;
                    return (
                      <tr
                        key={ticket.ticket_id}
                        className="cursor-pointer transition hover:bg-gray-50"
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedTicketId(ticket.ticket_id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedTicketId(ticket.ticket_id);
                          }
                        }}
                      >
                        <td className="px-5 py-3 font-mono text-xs font-bold text-gray-500 sm:px-6">{ticket.ticket_id}</td>
                        <td className="max-w-[220px] truncate px-5 py-3 font-black text-gray-950">{ticket.subject}</td>
                        <td className="px-5 py-3 text-xs font-bold text-gray-500">{formatFeatureLabel(ticket.affected_feature)}</td>
                        <td className="px-5 py-3">
                          <PriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">{formatDate(ticket.created_at)}</td>
                        <td className="px-5 py-3 text-xs text-gray-500">{formatDate(ticket.updated_at)}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${statusPillClass(meta.color)}`}>
                            {meta.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: cards */}
            <ul className="divide-y divide-gray-100 md:hidden">
              {visibleTickets.map((ticket) => {
                const meta = TICKET_STATUS_META[ticket.status] || TICKET_STATUS_META.open;
                return (
                  <li
                    key={ticket.ticket_id}
                    className="cursor-pointer px-5 py-4 transition hover:bg-gray-50"
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedTicketId(ticket.ticket_id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedTicketId(ticket.ticket_id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-black text-gray-950">{ticket.subject}</p>
                      <span className={`shrink-0 inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${statusPillClass(meta.color)}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs font-bold text-gray-400">{ticket.ticket_id}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="font-bold">{formatFeatureLabel(ticket.affected_feature)}</span>
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    <p className="mt-2 text-[11px] font-bold text-gray-400">
                      Created {formatDate(ticket.created_at)} · Updated {formatDate(ticket.updated_at)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {selectedTicketId && (
          <TicketDetailModal
            ticketId={selectedTicketId}
            onClose={() => setSelectedTicketId(null)}
            onCancelled={() => {
              setSelectedTicketId(null);
              loadTickets();
            }}
          />
        )}
      </section>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-[0_18px_55px_rgba(15,23,42,0.055)]">
      <div className="flex items-center gap-2 text-gray-500">
        <Icon className="h-4 w-4" />
        <p className="text-[11px] font-black uppercase tracking-[0.12em]">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-black text-gray-950">{value}</p>
    </div>
  );
}

const statusPillClass = (color: string): string => {
  switch (color) {
    case "status-open":
      return "bg-blue-100 text-blue-700";
    case "status-progress":
      return "bg-amber-100 text-amber-700";
    case "status-resolved":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

// Shows exactly what's stored for this ticket -- never a default/guessed
// value. The backend only ever stores 'normal' or 'urgent' (TicketPriority
// enum), so anything else (unexpected data) still renders its raw value
// rather than silently becoming "Normal".
function PriorityBadge({ priority }: { priority: string }) {
  const isUrgent = priority === "urgent";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${
        isUrgent ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
      }`}
    >
      {isUrgent ? "🔥 Urgent" : priority === "normal" ? "Normal" : priority}
    </span>
  );
}

function TicketDetailModal({
  ticketId,
  onClose,
  onCancelled,
}: {
  ticketId: string;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getTicketDetails(ticketId);
        if (!cancelled) setTicket(data);
      } catch (err) {
        if (!cancelled) setError(describeError(err, "Failed to load ticket details."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  const handleCancel = async () => {
    if (!window.confirm("Cancel this ticket? This cannot be undone.")) return;
    setCancelling(true);
    try {
      await cancelTicket(ticketId);
      toast.success("Ticket cancelled.");
      onCancelled();
    } catch (err) {
      toast.error(describeError(err, "Failed to cancel ticket."));
    } finally {
      setCancelling(false);
    }
  };

  const meta = ticket ? TICKET_STATUS_META[ticket.status] || TICKET_STATUS_META.open : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-detail-modal-title"
        className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 id="ticket-detail-modal-title" className="text-lg font-black text-gray-950">Ticket {ticketId}</h3>
          <button autoFocus onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-[#2557a7]" />
          </div>
        )}

        {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}

        {ticket && meta && (
          <div className="mt-4 space-y-5">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${statusPillClass(meta.color)}`}>
              {meta.label}
            </span>
            <div>
              <p className="text-base font-black text-gray-950">{ticket.subject}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">{ticket.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 text-xs text-gray-500 sm:grid-cols-4">
              <div>
                <p className="font-black uppercase tracking-[0.1em] text-gray-400">Category</p>
                <p className="mt-1 font-bold text-gray-700">{formatFeatureLabel(ticket.affected_feature)}</p>
              </div>
              {ticket.issue_type && (
                <div>
                  <p className="font-black uppercase tracking-[0.1em] text-gray-400">Subcategory</p>
                  <p className="mt-1 font-bold text-gray-700">{formatFeatureLabel(ticket.issue_type)}</p>
                </div>
              )}
              <div>
                <p className="font-black uppercase tracking-[0.1em] text-gray-400">Priority</p>
                <p className="mt-1"><PriorityBadge priority={ticket.priority} /></p>
              </div>
              <div>
                <p className="font-black uppercase tracking-[0.1em] text-gray-400">Created</p>
                <p className="mt-1 font-bold text-gray-700">{formatDate(ticket.created_at)}</p>
              </div>
              <div>
                <p className="font-black uppercase tracking-[0.1em] text-gray-400">Last updated</p>
                <p className="mt-1 font-bold text-gray-700">{formatDate(ticket.updated_at)}</p>
              </div>
            </div>
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div>
                <p className="text-xs font-black uppercase tracking-[0.1em] text-gray-400">Attachments</p>
                <div className="mt-2 flex flex-col gap-1.5">
                  {ticket.attachments.map((att) => (
                    <TicketAttachmentLink key={att.attachment_id} ticketId={ticketId} attachment={att} />
                  ))}
                </div>
              </div>
            )}
            {CANCELLABLE_TICKET_STATUSES.has(ticket.status) && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-black text-red-600 transition hover:bg-red-100 disabled:opacity-60"
              >
                {cancelling ? "Cancelling…" : "Cancel ticket"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RaiseTicketModal({
  originalQuestion = "",
  chatbotAnswer = "",
  onClose,
  onCreated,
}: {
  originalQuestion?: string;
  chatbotAnswer?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [issueType, setIssueType] = useState("");
  const [priority, setPriority] = useState<1 | 2>(1);
  // Prefilled from the chatbot's "Raise a support ticket" context, same as
  // the old in-widget modal and the guest ticket portal both already do --
  // subject is a concise issue title, so it comes from the user's original
  // QUESTION, never the (potentially long) chatbot answer.
  const [subject, setSubject] = useState(() =>
    originalQuestion ? firstSentence(originalQuestion).slice(0, MAX_TICKET_SUBJECT_CHARS) : ""
  );
  const [description, setDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentNotice, setAttachmentNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<{ ticket_id: string } | null>(null);
  const [successAttachments, setSuccessAttachments] = useState<TicketAttachmentSummary[]>([]);
  // escalateToSupport relies on the httpOnly session cookie, not a captured
  // value -- if the account switches (another tab) between opening this
  // modal and submitting, the cookie now belongs to the NEW account, and
  // the ticket would be filed under them instead of whoever actually filled
  // out the form. Captured at mount so handleSubmit can detect that switch
  // and abort instead of silently misattributing the ticket.
  const authenticatedEmailRef = useRef<string | null>(null);
  // Separate from the ref above being null: true once the signed-in
  // user's email has actually been read successfully at least once. If
  // the mount-time fetch below fails, this stays false and the pre-step
  // check must establish the baseline (or block) instead of silently
  // skipping the switch guard for the rest of the modal's lifetime.
  const accountBaselineConfirmedRef = useRef(false);
  // Keyed by File object identity so a retry (after a failed submit, or an
  // account-check abort) never re-uploads a file that already succeeded.
  const uploadedAttachmentsRef = useRef<Map<File, TicketAttachmentSummary>>(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getProfile({ skipAuthRedirect: true });
        if (!cancelled) {
          setName(profile.full_name || "");
          setEmail(profile.email || "");
          authenticatedEmailRef.current = profile.email || null;
          accountBaselineConfirmedRef.current = true;
        }
      } catch {
        // Submitting as an authenticated user doesn't need these for the
        // ticket body (the backend reads the session cookie) -- they're
        // display-only here, so a failed fetch just leaves them blank.
        // The switch guard's baseline is deliberately left unconfirmed
        // here -- verifyAccountUnchanged below establishes it on the
        // first successful re-check instead of defaulting to "no guard".
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setIssueType("");
  };

  const handleAttachmentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const picked = Array.from(files);
      const tooLarge = picked.filter((f) => f.size > MAX_TICKET_ATTACHMENT_BYTES);
      const fitting = picked.filter((f) => f.size <= MAX_TICKET_ATTACHMENT_BYTES);
      const room = Math.max(0, MAX_TICKET_ATTACHMENTS - attachments.length);
      const overCount = fitting.slice(room);
      const notes: string[] = [];
      if (tooLarge.length > 0) {
        notes.push(`Not attached (larger than 5 MB): ${tooLarge.map((f) => f.name).join(", ")}.`);
      }
      if (overCount.length > 0) {
        notes.push(`You can attach up to ${MAX_TICKET_ATTACHMENTS} files. Not attached: ${overCount.map((f) => f.name).join(", ")}.`);
      }
      setAttachmentNotice(notes.join(" "));
      setAttachments((prev) => [...prev, ...fitting.slice(0, room)]);
      event.target.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      uploadedAttachmentsRef.current.delete(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!category) errors.category = "Please select an issue category.";
    if (!subject.trim()) errors.subject = "Subject is required.";
    else if (subject.trim().length < MIN_SUBJECT_LENGTH) errors.subject = `Subject must be at least ${MIN_SUBJECT_LENGTH} characters.`;
    if (!description.trim()) errors.description = "Description is required.";
    else if (description.trim().length < MIN_DESCRIPTION_LENGTH) errors.description = `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters.`;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Re-reads the signed-in account and tells apart three outcomes, since
  // only one of them is actually "the account changed": the check itself
  // failing (network/server error, or the session expired) says nothing
  // about which account is active and must never be reported as a switch;
  // no confirmed baseline existing yet (the mount-time fetch failed) makes
  // this successful read the baseline instead of a false "switch"; and a
  // confirmed baseline that genuinely disagrees with this read.
  const verifyAccountUnchanged = async (): Promise<{ ok: true } | { ok: false; message: string }> => {
    let profile: { email?: string } | null = null;
    try {
      profile = await getProfile({ skipAuthRedirect: true });
    } catch (error) {
      if (getHttpStatus(error) === 401) {
        return { ok: false, message: "You've been signed out. Please sign in again and resubmit this ticket." };
      }
      return { ok: false, message: "Couldn't confirm your account before continuing. Please check your connection and try again." };
    }
    const currentEmail = profile.email || null;
    if (!accountBaselineConfirmedRef.current) {
      authenticatedEmailRef.current = currentEmail;
      accountBaselineConfirmedRef.current = true;
      return { ok: true };
    }
    if (currentEmail !== authenticatedEmailRef.current) {
      return {
        ok: false,
        message: "Your account changed in another tab since you opened this form. Please refresh and submit again to avoid filing this ticket under the wrong account.",
      };
    }
    return { ok: true };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Checked before anything irreversible happens (an upload, or the
      // submission itself) -- catches an already-switched account before
      // a single file is sent under the wrong one.
      const preUploadCheck = await verifyAccountUnchanged();
      if (!preUploadCheck.ok) {
        setSubmitError(preUploadCheck.message);
        return;
      }

      let uploaded: TicketAttachmentSummary[] = [];
      let failedAttachmentNames: string[] = [];
      if (attachments.length > 0) {
        const results = await Promise.allSettled(
          attachments.map(async (file) => {
            const cached = uploadedAttachmentsRef.current.get(file);
            if (cached) return cached;
            const result = await uploadTicketAttachment(file);
            const summary: TicketAttachmentSummary = { attachment_id: result.attachment_id, filename: result.filename };
            uploadedAttachmentsRef.current.set(file, summary);
            return summary;
          }),
        );
        uploaded = results
          .filter((r): r is PromiseFulfilledResult<TicketAttachmentSummary> => r.status === "fulfilled")
          .map((r) => r.value);
        // A failed upload must never silently vanish -- the ticket still
        // goes out without it (resilience), but the submitter needs to know
        // which file(s) didn't make it so they can resend some other way.
        failedAttachmentNames = results
          .map((r, i) => (r.status === "rejected" ? attachments[i].name : null))
          .filter((name): name is string => name !== null);
      }
      const attachmentIds = uploaded.map((a) => a.attachment_id);

      const preSubmitCheck = await verifyAccountUnchanged();
      if (!preSubmitCheck.ok) {
        setSubmitError(preSubmitCheck.message);
        return;
      }

      const response = await escalateToSupport({
        issue_category: category,
        issue_title: subject.trim(),
        issue_description: description.trim(),
        // Signed in: verifyAccountUnchanged just confirmed it with getProfile.
        authenticated: true,
        attachment_ids: attachmentIds.length > 0 ? attachmentIds : undefined,
        issue_details: {
          feature: category,
          issue_type: issueType || undefined,
          priority,
          steps_to_reproduce: stepsToReproduce.trim() || undefined,
          original_question: originalQuestion || undefined,
          chatbot_answer: chatbotAnswer || undefined,
        },
      });
      // Guest tickets get a view_url back per attachment (a single-use,
      // login-free link); authenticated tickets don't (never needed --
      // TicketAttachmentLink falls back to the credentialed fetch for
      // whichever attachment has no view_url).
      const viewUrlByAttachmentId = new Map((response.attachments || []).map((a) => [a.attachment_id, a.view_url]));
      setSuccessAttachments(uploaded.map((a) => ({ ...a, view_url: viewUrlByAttachmentId.get(a.attachment_id) })));
      setCreated({ ticket_id: response.ticket_id });
      toast.success("Support ticket submitted.");
      if (failedAttachmentNames.length > 0) {
        toast.warning(
          `${failedAttachmentNames.length === 1 ? "This file" : "These files"} couldn't be attached: ${failedAttachmentNames.join(", ")}. The ticket was submitted without ${failedAttachmentNames.length === 1 ? "it" : "them"} -- reply to the confirmation email to send it another way.`,
        );
      }
    } catch (err) {
      setSubmitError(describeError(err, "Failed to create ticket. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // The request keeps running if the form unmounts, and its success view
  // and list refresh would be lost -- so no closing mid-submit.
  const closeUnlessSubmitting = () => {
    if (!isSubmitting) onClose();
  };

  if (created) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        onKeyDown={(e) => { if (e.key === "Escape") onCreated(); }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ticket-created-modal-title"
          className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl"
        >
          <CircleCheck className="mx-auto h-12 w-12 text-green-600" />
          <h3 id="ticket-created-modal-title" className="mt-4 text-lg font-black text-gray-950">Ticket submitted</h3>
          <p className="mt-2 text-sm text-gray-600">
            Your ticket <strong>{created.ticket_id}</strong> has been raised. Our support team will follow up by email.
          </p>
          {successAttachments.length > 0 && (
            <div className="mt-4 flex flex-col gap-1.5 text-left">
              {successAttachments.map((att) => (
                <TicketAttachmentLink key={att.attachment_id} ticketId={created.ticket_id} attachment={att} />
              ))}
            </div>
          )}
          <button
            autoFocus
            onClick={onCreated}
            className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#2557a7] text-sm font-black text-white transition hover:bg-[#1f4a91]"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={closeUnlessSubmitting}
      onKeyDown={(e) => { if (e.key === "Escape") closeUnlessSubmitting(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="raise-ticket-modal-title"
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 id="raise-ticket-modal-title" className="text-lg font-black text-gray-950">Raise a support ticket</h3>
          <button autoFocus onClick={closeUnlessSubmitting} aria-label="Close" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Submitting as <strong>{name || "your account"}</strong> {email && `(${email})`}
          </div>

          <div>
            <label htmlFor="dash-ticket-category" className="mb-1.5 block text-sm font-semibold text-gray-700">
              Issue category <span className="text-red-500">*</span>
            </label>
            <select
              id="dash-ticket-category"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              disabled={isSubmitting}
              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                fieldErrors.category ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-[#2557a7]"
              }`}
            >
              <option value="">Select a category…</option>
              {TICKET_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            {fieldErrors.category && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.category}</p>}
          </div>

          <div>
            <label htmlFor="dash-ticket-issue-type" className="mb-1.5 block text-sm font-semibold text-gray-700">
              Feature / Issue Type
            </label>
            <select
              id="dash-ticket-issue-type"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              disabled={isSubmitting || !category}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2557a7]"
            >
              <option value="">{category ? "Select an issue type…" : "Select a category first"}</option>
              {category && (FEATURE_ISSUE_TYPES[category] || FEATURE_ISSUE_TYPES.other).map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Priority</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPriority(1)}
                disabled={isSubmitting}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  priority === 1 ? "border-[#2557a7] bg-[#2557a7] text-white" : "border-gray-300 bg-white text-gray-700"
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setPriority(2)}
                disabled={isSubmitting}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  priority === 2 ? "border-red-600 bg-red-600 text-white" : "border-gray-300 bg-white text-gray-700"
                }`}
              >
                🔥 Urgent
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="dash-ticket-subject" className="mb-1.5 block text-sm font-semibold text-gray-700">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              id="dash-ticket-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value.slice(0, MAX_TICKET_SUBJECT_CHARS))}
              maxLength={MAX_TICKET_SUBJECT_CHARS}
              placeholder="Brief summary of your issue"
              disabled={isSubmitting}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                fieldErrors.subject ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-[#2557a7]"
              }`}
            />
            {fieldErrors.subject && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.subject}</p>}
          </div>

          <div>
            <label htmlFor="dash-ticket-description" className="mb-1.5 block text-sm font-semibold text-gray-700">
              Detailed description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="dash-ticket-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your issue in as much detail as possible"
              rows={5}
              disabled={isSubmitting}
              className={`w-full resize-y rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                fieldErrors.description ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-[#2557a7]"
              }`}
            />
            {fieldErrors.description && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.description}</p>}
          </div>

          <div>
            <label htmlFor="dash-ticket-steps" className="mb-1.5 block text-sm font-semibold text-gray-700">
              Steps to reproduce <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="dash-ticket-steps"
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              rows={3}
              disabled={isSubmitting}
              className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2557a7]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Attachments <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleAttachmentUpload}
              accept=".png,.jpg,.jpeg,.pdf"
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              📎 Upload screenshot/file
            </button>
            {attachmentNotice && <p role="alert" className="mt-1 text-xs font-semibold text-amber-600">{attachmentNotice}</p>}
            {attachments.length > 0 && (
              <ul className="mt-2 space-y-1">
                {attachments.map((file, index) => (
                  <li key={index} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => removeAttachment(index)}
                      disabled={isSubmitting}
                      className="ml-2 text-gray-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {submitError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#2557a7] py-2.5 text-sm font-black text-white transition hover:bg-[#1f4a91] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting…" : "Submit ticket"}
          </button>
        </form>
      </div>
    </div>
  );
}
