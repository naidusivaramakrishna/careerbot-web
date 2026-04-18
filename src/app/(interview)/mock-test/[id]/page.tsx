'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Flag, Clock, EyeOff, AlertTriangle, Brain, BookOpen, Calculator, Code, Lightbulb, CheckCircle, Play, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { resolveCompanyId, resolveCompanyInfo } from '@/lib/mockTestConstants';
import {
  generateMockTest,
  getSectionQuestions,
  submitAnswer,
  submitTest,
  submitParentSession,
  reportIssue,
  getActiveSession,
  getSessionById,
  MockTestSection,
  MockTestSession,
  SessionMetadata,
  AnswerFeedback,
} from '@/api/mockTestApi';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Question {
  id: number | string;
  section: string;
  text: string;
  options: string[];
  selected: string | null;
  markedForReview: boolean;
}

type Phase = 'loading' | 'section_intro' | 'section_testing' | 'results_summary' | 'submitting';

interface SectionResult {
  name: string;
  answered: number;
  total: number;
}

// ─── Static maps ─────────────────────────────────────────────────────────────


const negMarkingSections: Record<string, string[]> = {
  '1': ['Quantitative Aptitude', 'Reasoning Ability', 'Programming Logic'],
};

const sectionColors = [
  { bg: 'bg-blue-50', border: 'border-blue-300', icon: 'text-blue-600', btn: 'bg-[#2557a7] hover:bg-[#1a3d73]', badge: 'bg-blue-100 text-blue-700', progress: 'bg-blue-500' },
  { bg: 'bg-purple-50', border: 'border-purple-300', icon: 'text-purple-600', btn: 'bg-purple-600 hover:bg-purple-700', badge: 'bg-purple-100 text-purple-700', progress: 'bg-purple-500' },
  { bg: 'bg-emerald-50', border: 'border-emerald-300', icon: 'text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700', badge: 'bg-emerald-100 text-emerald-700', progress: 'bg-emerald-500' },
  { bg: 'bg-amber-50', border: 'border-amber-300', icon: 'text-amber-600', btn: 'bg-amber-600 hover:bg-amber-700', badge: 'bg-amber-100 text-amber-700', progress: 'bg-amber-500' },
  { bg: 'bg-rose-50', border: 'border-rose-300', icon: 'text-rose-600', btn: 'bg-rose-600 hover:bg-rose-700', badge: 'bg-rose-100 text-rose-700', progress: 'bg-rose-500' },
];

function getSectionIcon(name: string): React.ElementType {
  const n = name.toLowerCase();
  if (n.includes('arithmetic') || n.includes('quantitative') || n.includes('math')) return Calculator;
  if (n.includes('aptitude') || n.includes('verbal') || n.includes('english') || n.includes('communication')) return BookOpen;
  if (n.includes('reasoning') || n.includes('logical') || n.includes('logic') || n.includes('puzzle')) return Brain;
  if (n.includes('technical') || n.includes('programming') || n.includes('coding') || n.includes('automata')) return Code;
  return Lightbulb;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MockTestPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const urlTestId = params.id as string;
  const initialSessionId = searchParams.get('sessionId');

  const isCustomTest = urlTestId === 'custom-test';
  const testId = resolveCompanyId(urlTestId);

  // Custom test config from query params
  const customCategories = isCustomTest
    ? (searchParams.get('categories') ?? 'arithmetic').split(',').filter(Boolean)
    : null;

  // Section progression: Arithmetic(0) → Aptitude(1) → Reasoning(2) → Technical(3)
  // Valid subcategories: abstract, algebra, analytical, dsa, geometry, java, logical, oops, percentages, profit_loss, python, ratios, simple_interest, sql, statistics, time_and_work, trigonometry, verbal, web
  const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
    arithmetic: ['percentages', 'profit_loss', 'ratios', 'simple_interest', 'time_and_work', 'algebra'],
    aptitude:   ['verbal', 'abstract', 'analytical', 'statistics', 'geometry', 'trigonometry'],
    reasoning:  ['logical', 'logical', 'logical', 'logical', 'logical'],
    technical:  ['python', 'java', 'dsa', 'sql', 'oops', 'web'],
  };

  const STATIC_SECTION_PROGRESSION = [
    { name: 'arithmetic', subcategories: CATEGORY_SUBCATEGORIES['arithmetic'] },
    { name: 'aptitude',   subcategories: CATEGORY_SUBCATEGORIES['aptitude'] },
    { name: 'reasoning',  subcategories: CATEGORY_SUBCATEGORIES['reasoning'] },
    { name: 'technical',  subcategories: CATEGORY_SUBCATEGORIES['technical'] },
  ];

  const SECTION_PROGRESSION = isCustomTest && customCategories && customCategories.length > 0
    ? customCategories.map(cat => ({
        name: cat,
        subcategories: CATEGORY_SUBCATEGORIES[cat] ?? [cat],
      }))
    : STATIC_SECTION_PROGRESSION;

  // Core state
  const [phase, setPhase] = useState<Phase>('loading');
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [currentBackendSectionId, setCurrentBackendSectionId] = useState<string | null>(null);
  const [sessionSections, setSessionSections] = useState<MockTestSection[]>([]);
  const [currentSectionProgressionIndex, setCurrentSectionProgressionIndex] = useState(0); // Track which section in progression (0-3)
  const [sessionMetadata, setSessionMetadata] = useState<SessionMetadata | null>(null);


  // Per-section question state (active section)
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);

  // Timer — starts when "Start Now" is clicked
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tracks when the current question was first shown (for 3s minimum rule)
  const questionStartTimeRef = useRef<number>(Date.now());

  // UUID shared across all sections of this test run.
  // Generated once when the page mounts — a new UUID is created every time
  // the user navigates to the test page (i.e. every "Start Test" click).
  const parentSessionIdRef = useRef<string>(crypto.randomUUID());

  // Anti-cheating
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);

  // Section submit modal
  const [sectionSubmitting, setSectionSubmitting] = useState(false);
  const [answerSubmitting, setAnswerSubmitting] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState<AnswerFeedback | null>(null);
  const [loadingSection, setLoadingSection] = useState(false);

  // Init error (fatal — shown instead of spinner when session cannot be created)
  const [initError, setInitError] = useState<string | null>(null);

  // Report issue modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Completed section results (for transition screen)
  const [sectionResults, setSectionResults] = useState<SectionResult[]>([]);

  // Use SECTION_PROGRESSION as the source of truth for section names
  const currentSectionProgression = SECTION_PROGRESSION[currentSectionProgressionIndex];
  const currentSection = {
    section_id: currentSectionProgression?.name || 'unknown',
    section_name: currentSectionProgression ?
      currentSectionProgression.name.charAt(0).toUpperCase() + currentSectionProgression.name.slice(1)
      : 'Unknown',
    duration_minutes: currentSectionProgression?.name === 'arithmetic' || currentSectionProgression?.name === 'technical' ? 20 : 25,
    question_count: 10,
  };
  const isLastSection = currentSectionProgressionIndex === SECTION_PROGRESSION.length - 1;
  const color = sectionColors[currentSectionProgressionIndex % sectionColors.length];
  const SectionIcon = getSectionIcon(currentSection.section_name);
  const testName = isCustomTest ? 'Custom Test' : resolveCompanyInfo(testId).name;

  // ── Sections derived from SECTION_PROGRESSION ─────────────────────────────
  const EDUCATIONAL_SECTIONS: MockTestSection[] = SECTION_PROGRESSION.map(s => ({
    section_id: s.name,
    section_name: s.name.charAt(0).toUpperCase() + s.name.slice(1),
    duration_minutes: s.name === 'arithmetic' || s.name === 'technical' ? 20 : 25,
    question_count: 10,
  }));

  type RawQ = { question_id?: number | string; question_text?: string; text?: string; options?: string[]; choices?: string[] };

  // ── Step 1: Show intro screen — no session created here
  // Sessions are created per-section when the user clicks "Start Now"
  useEffect(() => {
    const init = async () => {
      try {
        // Re-use an existing active session if one is already open for this company
        if (initialSessionId) {
          setSessionId(initialSessionId);
        } else {
          try {
            const activeSession = await getActiveSession();
            if (activeSession?.session_id && activeSession?.company_id === testId) {
              setSessionId(activeSession.session_id);
            }
          } catch {
            // No active session — fine, handleStartSection will create one
          }
        }

        setSessionSections(EDUCATIONAL_SECTIONS);
        setPhase('section_intro');
      } catch (err: any) {
        setInitError(err?.message || 'Failed to load mock test. Please try again.');
        setPhase('loading');
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  // ── Fetch session metadata when sessionId is available ──────────────────
  useEffect(() => {
    if (!sessionId) return;

    const fetchMetadata = async () => {
      try {
        const metadata = await getSessionById(sessionId);
        setSessionMetadata(metadata);
      } catch (err: any) {
        // Metadata is optional, continue without it
      }
    };

    fetchMetadata();
  }, [sessionId]);

  // ── Step 2: "Start Now" — fetch real questions from backend ─────────────
  const handleStartSection = async () => {
    if (!currentSection) return;

    setLoadingSection(true);
    try {
      // Generate a fresh session per section — backend returns real questions only
      // when called with a specific category + subcategory combination.
      const sectionInfo = SECTION_PROGRESSION[currentSectionProgressionIndex];
      const activeCategory = isCustomTest && customCategories
        ? customCategories[currentSectionProgressionIndex % customCategories.length]
        : sectionInfo.name;
      const randomSubcategory = sectionInfo.subcategories[Math.floor(Math.random() * sectionInfo.subcategories.length)];

      let newSession: MockTestSession;
      try {
        newSession = await generateMockTest(testId, [activeCategory], [randomSubcategory], parentSessionIdRef.current, 180000);
      } catch (genErr: any) {
        if (genErr?.response?.data?.error_code === 'ACTIVE_SESSION_EXISTS') {
          // Close the blocking session then retry once
          const existingId = genErr.response.data.details?.session_id as string | undefined;
          if (existingId) {
            try { await submitTest(existingId); } catch { /* ignore close errors */ }
          }
          newSession = await generateMockTest(testId, [activeCategory], [randomSubcategory], parentSessionIdRef.current, 180000);
        } else {
          throw genErr;
        }
      }

      const newSections = newSession.sections ?? [];
      const backendSectionId = newSections[0]?.section_id ?? null;

      if (!backendSectionId) {
        toast.error(`No section data for ${currentSection.section_name}. Please try again.`);
        return;
      }

      setSessionId(newSession.session_id);
      setCurrentBackendSectionId(backendSectionId);

      let qs: RawQ[] = [];
      try {
        const raw = await getSectionQuestions(newSession.session_id, backendSectionId);
        qs = Array.isArray(raw) ? raw : ((raw as { questions?: RawQ[] })?.questions ?? []);
        if (qs.length === 0) throw new Error('No questions returned from backend');
      } catch (questionsErr: any) {
        if (questionsErr?.response?.status === 404) {
          toast.error('Session or section not found. Please refresh and start a new test.');
        }
        throw questionsErr;
      }

      const questions: Question[] = qs.map((q, idx) => ({
        id: q.question_id ?? idx + 1,
        section: currentSection.section_name,
        text: q.question_text ?? q.text ?? `Question ${idx + 1}`,
        options: q.options ?? q.choices ?? [],
        selected: null,
        markedForReview: false,
      }));

      if (questions.length < currentSection.question_count) {
        toast.info(`This section has ${questions.length} questions. Attempt all to proceed.`);
      }

      setQuestions(questions);
      setCurrentQ(0);
      setTimeRemaining((currentSection.duration_minutes ?? 30) * 60);
      setPhase('section_testing');
    } catch (err: any) {
      const backendMsg = err?.response?.data?.detail
        ?? err?.response?.data?.message
        ?? err?.response?.data?.error
        ?? err?.message
        ?? 'Unknown error';
      console.error('[handleStartSection] failed:', err?.response?.status, err?.response?.data ?? err?.message);
      toast.error(`Failed to load ${currentSection.section_name}: ${backendMsg}`);
    } finally {
      setLoadingSection(false);
    }
  };

  // ── Timer (runs only during section_testing) ───────────────────────────────
  useEffect(() => {
    if (phase !== 'section_testing') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmitSection();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── beforeunload warning ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (phase === 'section_testing' || phase === 'section_intro') {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [phase]);

  // ── Tab switch detection ───────────────────────────────────────────────────
  useEffect(() => {
    const handle = () => {
      if (document.hidden && phase === 'section_testing') {
        setTabSwitchCount(p => p + 1);
        setShowTabWarning(true);
      }
    };
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, [phase]);

  // ── Disable right-click ────────────────────────────────────────────────────
  useEffect(() => {
    const prevent = (e: MouseEvent) => { if (phase === 'section_testing') e.preventDefault(); };
    document.addEventListener('contextmenu', prevent);
    return () => document.removeEventListener('contextmenu', prevent);
  }, [phase]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (phase !== 'section_testing') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'N') handleNext();
      if (e.key === 'ArrowLeft' || e.key === 'p' || e.key === 'P') handlePrevious();
      if (e.key === 'f' || e.key === 'F') handleMarkForReview();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentQ, questions]);

  // ── Reset question start time whenever the displayed question changes ────────
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
  }, [currentQ]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const answered = questions.filter(q => q.selected !== null).length;
  const notAnswered = questions.filter(q => q.selected === null).length;
  const flagged = questions.filter(q => q.markedForReview).length;
  const progressPct = questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 0;
  const currentQuestion = questions[currentQ];
  const hasNegMarking = (negMarkingSections[testId] ?? []).includes(currentSection?.section_name ?? '');

  // ── Answer handlers ────────────────────────────────────────────────────────
  const handleSelectAnswer = async (option: string) => {
    const q = questions[currentQ];
    setQuestions(prev => prev.map((item, i) =>
      i === currentQ ? { ...item, selected: option } : item
    ));

    if (!sessionId) {
      return;
    }

    // Backend requires at least 3 seconds elapsed per question.
    // Wait out any remaining time, then pass the actual elapsed seconds in the payload.
    const MIN_ANSWER_MS = 3000;
    const elapsedMs = Date.now() - questionStartTimeRef.current;
    const waitMs = Math.max(0, MIN_ANSWER_MS - elapsedMs);

    setAnswerSubmitting(true);
    setAnswerFeedback(null);
    try {
      if (waitMs > 0) {
        await new Promise(resolve => setTimeout(resolve, waitMs));
      }

      // Calculate final elapsed seconds after any wait, clamped to minimum 3
      const timeTakenSeconds = Math.max(3, Math.round((Date.now() - questionStartTimeRef.current) / 1000));

      const answerIndex = q.options.findIndex(opt => opt === option);
      let answerLetter = 'A';
      if (answerIndex >= 0) {
        answerLetter = String.fromCharCode(65 + answerIndex);
      }

      const feedback = await submitAnswer(sessionId, String(q.id), answerLetter, timeTakenSeconds);
      if (feedback) {
        setAnswerFeedback(feedback);
      }
    } catch (err: any) {
    } finally {
      setAnswerSubmitting(false);
    }
  };

  const handleClearAnswer = () => {
    setQuestions(prev => prev.map((item, i) =>
      i === currentQ ? { ...item, selected: null } : item
    ));
  };

  const handleMarkForReview = () => {
    setQuestions(prev => prev.map((item, i) =>
      i === currentQ ? { ...item, markedForReview: !item.markedForReview } : item
    ));
  };

  const handleNext = async () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(p => p + 1);
      setAnswerFeedback(null);
    }
  };

  const handlePrevious = () => {
    if (currentQ > 0) {
      setCurrentQ(p => p - 1);
      setAnswerFeedback(null);
    }
  };

  // ── Section submit ─────────────────────────────────────────────────────────
  const handleAutoSubmitSection = useCallback(async () => {
    const result: SectionResult = {
      name: currentSection.section_name,
      answered: questions.filter(q => q.selected !== null).length,
      total: questions.length,
    };
    setSectionResults(prev => [...prev, result]);

    const nextProgressionIndex = currentSectionProgressionIndex + 1;
    if (nextProgressionIndex >= SECTION_PROGRESSION.length) {
      setPhase('results_summary');
    } else {
      setCurrentSectionProgressionIndex(nextProgressionIndex);
      setQuestions([]);
      setCurrentQ(0);
      setPhase('section_intro');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, currentBackendSectionId, currentSection, questions, currentSectionProgressionIndex]);

  const handleSectionSubmit = async () => {
    // Validate that all questions have been attempted
    const unattemptedQuestions = questions.filter(q => q.selected === null);

    if (unattemptedQuestions.length > 0) {
      toast.warning(`${unattemptedQuestions.length} question${unattemptedQuestions.length > 1 ? 's' : ''} unanswered. Answer all questions before submitting.`);
      return;
    }

    setSectionSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const result: SectionResult = {
      name: currentSection.section_name,
      answered,
      total: questions.length,
    };
    setSectionResults(prev => [...prev, result]);

    // Check if there are more sections in progression
    const nextProgressionIndex = currentSectionProgressionIndex + 1;
    if (nextProgressionIndex < SECTION_PROGRESSION.length) {
      // Move to next section intro - it will load when user clicks "Start Now"
      setCurrentSectionProgressionIndex(nextProgressionIndex);
      setQuestions([]);
      setCurrentQ(0);
      setPhase('section_intro');
    } else {
      // All sections completed - show results summary
      setPhase('results_summary');
    }

    setSectionSubmitting(false);
  };

  // ── Final test submission ──────────────────────────────────────────────────
  const finalSubmit = async () => {
    setPhase('submitting');
    try {
      await submitParentSession(parentSessionIdRef.current);
    } catch {
      // non-fatal — proceed to results even if parent submit fails
    }
    await new Promise(resolve => setTimeout(resolve, 4000));
    const resultUrl = `/mock-test/results/${testId}?parentSession=${parentSessionIdRef.current}`;
    router.push(resultUrl);
  };

  // ── Report issue ───────────────────────────────────────────────────────────
  const handleReportIssue = async () => {
    if (!reportReason.trim() || !sessionId || !currentQuestion) {
      return;
    }


    setReportSubmitting(true);
    try {
      await reportIssue(sessionId, currentQuestion.id, reportReason);

      toast.success('Issue reported. Our team will review it shortly.');
      setReportReason('');
      setShowReportModal(false);
    } catch (err: any) {

      toast.error(`Failed to report issue: ${err?.message || 'Unknown error'}`);
    } finally {
      setReportSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    if (initError) {
      return (
        <div className="w-full bg-white min-h-screen flex flex-col items-center justify-center gap-4 p-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <div className="text-center max-w-md">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Failed to Load Test</h2>
            <p className="text-slate-500 mb-6">{initError}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setInitError(null); router.push('/mock-test'); }}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition text-sm"
              >
                Back to Tests
              </button>
              <button
                onClick={() => { setInitError(null); window.location.reload(); }}
                className="px-5 py-2.5 bg-[#2557a7] text-white font-semibold rounded-lg hover:bg-[#1a3d73] transition text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="w-full bg-white min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#2557a7] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 font-semibold text-lg">Preparing your test...</p>
        <p className="text-slate-400 text-sm">Generating questions from the bank</p>
      </div>
    );
  }

  // ── Results Summary ───────────────────────────────────────────────────────
  if (phase === 'results_summary') {
    const totalQuestions = sectionResults.reduce((sum, r) => sum + r.total, 0);
    const totalAnswered = sectionResults.reduce((sum, r) => sum + r.answered, 0);
    const percentage = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

    return (
      <div className="w-full bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Test Completed! 🎉</h1>
            <p className="text-slate-600">You have successfully completed all {SECTION_PROGRESSION.length} sections</p>
          </div>

          {/* Section Results */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-6">Section Results</h2>
            <div className="space-y-4">
              {sectionResults.map((result, idx) => (
                <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                  sectionColors[idx % sectionColors.length].border
                } ${sectionColors[idx % sectionColors.length].bg}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${sectionColors[idx % sectionColors.length].btn} text-white flex items-center justify-center font-bold text-sm`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{result.name}</p>
                      <p className="text-sm text-slate-600">{result.answered} of {result.total} questions answered</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{result.answered}/{result.total}</p>
                    <p className="text-xs text-slate-600">{Math.round((result.answered / result.total) * 100)}%</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-200">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#2557a7]">{totalAnswered}</p>
                <p className="text-sm text-slate-600 mt-1">Answered</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#2557a7]">{totalQuestions}</p>
                <p className="text-sm text-slate-600 mt-1">Total Questions</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-700">{percentage}%</p>
                <p className="text-sm text-slate-600 mt-1">Completion</p>
              </div>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-4"
          >
            <button
              onClick={() => router.push('/mock-test')}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
            >
              Back to Tests
            </button>
            <button
              onClick={async () => {
                await finalSubmit();
              }}
              className="flex-1 px-6 py-3 rounded-xl bg-[#2557a7] hover:bg-[#1a3d73] text-white font-bold transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              Submit Full Test
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ── Submitting ─────────────────────────────────────────────────────────────
  if (phase === 'submitting') {
    return (
      <div className="w-full bg-white min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 font-semibold text-lg">Scoring your test...</p>
        <p className="text-slate-400 text-sm">Please wait while we calculate your results</p>
      </div>
    );
  }

  // ── Loading Next Section (removed - sections load in background) ───────────

  // ── Section Intro ──────────────────────────────────────────────────────────
  if (phase === 'section_intro') {
    const nextColor = sectionColors[currentSectionProgressionIndex % sectionColors.length];
    const IconComp = currentSection ? getSectionIcon(currentSection.section_name) : Lightbulb;

    return (
      <div className="w-full bg-slate-50 min-h-screen flex flex-col items-center justify-center p-6">
        {/* Session Metadata Header */}
        {sessionMetadata && (
          <div className="w-full max-w-7xl mb-8 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Session Information</h3>
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Company</p>
                    <p className="text-sm font-semibold text-slate-900">{sessionMetadata.company_name || testName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Status</p>
                    <p className="text-sm font-semibold text-slate-900 capitalize">{sessionMetadata.status || 'in-progress'}</p>
                  </div>
                  {sessionMetadata.total_duration_minutes && (
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Total Duration</p>
                      <p className="text-sm font-semibold text-slate-900">{sessionMetadata.total_duration_minutes} mins</p>
                    </div>
                  )}
                  {sessionMetadata.expires_at && (
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Expires</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {new Date(sessionMetadata.expires_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-1">Session ID</p>
                <p className="text-xs font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded">{sessionMetadata.session_id.substring(0, 12)}...</p>
              </div>
            </div>
          </div>
        )}

        {/* Overall section breadcrumb */}
        <div className="flex items-center gap-2 mb-8">
          {sessionSections.map((sec, i) => {
            const done = i < currentSectionProgressionIndex;
            const active = i === currentSectionProgressionIndex;
            const c = sectionColors[i % sectionColors.length];
            return (
              <div key={sec.section_id} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  done ? 'bg-green-100 text-green-700' : active ? `${c.badge} ring-2 ring-offset-1` : 'bg-slate-200 text-slate-500'
                }`}>
                  {done && <CheckCircle size={12} />}
                  {sec.section_name}
                </div>
                {i < sessionSections.length - 1 && (
                  <div className={`w-6 h-0.5 ${done ? 'bg-green-400' : 'bg-slate-300'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Section intro card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`w-full max-w-lg bg-white rounded-2xl shadow-xl border-2 ${nextColor.border} overflow-hidden`}
        >
          {/* Top colored band */}
          <div className={`${nextColor.bg} px-8 pt-8 pb-6 text-center`}>
            <div className={`w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mx-auto mb-4`}>
              <IconComp size={40} className={nextColor.icon} />
            </div>
            <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-3 ${nextColor.badge}`}>
              Section {currentSectionProgressionIndex + 1} of {sessionSections.length}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              {currentSection?.section_name}
            </h1>
            <p className="text-slate-500 text-sm">
              {testName}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-px bg-slate-100 border-t border-b border-slate-200">
            <div className="bg-white px-6 py-4 text-center">
              <div className="text-2xl font-bold text-slate-900">{currentSection?.question_count ?? '—'}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Questions</div>
            </div>
            <div className="bg-white px-6 py-4 text-center">
              <div className="text-2xl font-bold text-slate-900">{currentSection?.duration_minutes ?? '—'}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Minutes</div>
            </div>
          </div>

          {/* Rules */}
          <div className="px-8 py-5">
            <ul className="space-y-2 text-sm text-slate-600 mb-6">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                Once you start, the timer begins and cannot be paused.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                You can flag questions for review and come back within this section.
              </li>
              {hasNegMarking && (
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  <span className="text-red-600 font-medium">Wrong answer deducts 1/3 mark. Skip if unsure.</span>
                </li>
              )}
              {sectionResults.length > 0 && (
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                  <span className="text-green-700 font-medium">
                    {sectionResults.length} section{sectionResults.length > 1 ? 's' : ''} completed ✓
                  </span>
                </li>
              )}
            </ul>

            <button
              onClick={() => {
                handleStartSection();
              }}
              disabled={loadingSection}
              className={`w-full ${nextColor.btn} text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-3 text-base disabled:opacity-60 disabled:cursor-not-allowed ${!loadingSection && 'hover:opacity-90'}`}
            >
              {loadingSection ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating questions… this may take a minute</span>
                </>
              ) : (
                <>
                  <Play size={18} className="fill-white" />
                  Start Now
                </>
              )}
            </button>

            {/* Allow submitting completed sections without finishing all remaining */}
            {sectionResults.length > 0 && (
              <button
                onClick={async () => {
                  setPhase('results_summary');
                }}
                className="w-full mt-3 py-3 border-2 border-slate-300 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition text-sm flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} />
                Skip & View Results for Completed Sections
              </button>
            )}
          </div>
        </motion.div>

        {/* Previously completed sections summary */}
        {sectionResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex gap-3 flex-wrap justify-center"
          >
            {sectionResults.map((r, i) => (
              <div key={i} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold ${sectionColors[i % sectionColors.length].badge}`}>
                <CheckCircle size={12} />
                {r.name}: {r.answered}/{r.total}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    );
  }

  // ── Section Transition (between sections) ─────────────────────────────────
  // ── Section Testing ────────────────────────────────────────────────────────
  const isTimerWarning = timeRemaining > 0 && timeRemaining <= 300;
  const isTimerCritical = timeRemaining > 0 && timeRemaining <= 60;

  return (
    <div className="w-full bg-white min-h-screen flex flex-col">
      {/* Tab Switch Warning Toast */}
      <AnimatePresence>
        {showTabWarning && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <EyeOff size={18} />
            <span className="font-semibold text-sm">Tab switch detected ({tabSwitchCount}). This is recorded.</span>
            <button onClick={() => setShowTabWarning(false)} className="ml-2 text-red-200 hover:text-white font-bold text-lg leading-none">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <div className="bg-white px-6 py-4 border-b border-slate-200">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm mb-3 transition"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 className="text-2xl font-bold text-slate-900">{testName}</h1>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        {/* Section progress strip */}
        <div className="flex items-center gap-1.5 mb-3">
          {sessionSections.map((sec, i) => {
            const done = i < currentSectionProgressionIndex;
            const active = i === currentSectionProgressionIndex;
            const c = sectionColors[i % sectionColors.length];
            return (
              <div key={sec.section_id} className="flex items-center gap-1.5 flex-1 min-w-0">
                <div className={`h-1.5 flex-1 rounded-full ${done ? 'bg-green-500' : active ? c.progress : 'bg-slate-200'}`} />
                <span className={`text-xs font-semibold whitespace-nowrap hidden sm:block ${active ? c.icon : done ? 'text-green-600' : 'text-slate-400'}`}>
                  {sec.section_name.split(' ')[0]}{done ? ' ✓' : ''}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Left: test name + section info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <SectionIcon size={16} className={color.icon} />
              <h1 className="text-base font-bold text-slate-900 truncate">{testName}</h1>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${color.badge}`}>
                {currentSection?.section_name}
              </span>
            </div>
            {/* Question progress bar */}
            <div className="relative w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className={`h-2 rounded-full ${color.progress}`}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-slate-500">Q {currentQ + 1} / {questions.length}</span>
              <span className="text-xs text-slate-500">{answered} answered · {notAnswered} remaining</span>
            </div>
          </div>

          {/* Right: tab count, timer, submit */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {tabSwitchCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-red-500 font-semibold">
                <EyeOff size={12} />
                {tabSwitchCount}
              </div>
            )}
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono font-bold text-sm ${
              isTimerCritical ? 'bg-red-100 text-red-700 animate-pulse' : isTimerWarning ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-900'
            }`}>
              <Clock size={16} />
              {formatTime(timeRemaining)}
            </div>
            <button
              onClick={handleSectionSubmit}
              disabled={sectionSubmitting}
              className={`font-bold px-5 py-2.5 rounded-lg text-sm transition text-white disabled:opacity-70 ${
                isLastSection ? 'bg-green-600 hover:bg-green-700' : color.btn.split(' ')[0] + ' ' + (color.btn.split(' ')[1] ?? '')
              }`}
            >
              {sectionSubmitting ? 'Submitting...' : isLastSection ? 'Submit Test' : 'Submit Section'}
            </button>
          </div>
        </div>
      </div>

      {/* Main: question area + sidebar */}
      <div className="flex-1 flex overflow-hidden bg-blue-50">
        {/* Question area */}
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 overflow-y-auto p-8"
        >
          <div className="max-w-2xl mx-auto">
            {/* Marked for review badge */}
            {currentQuestion?.markedForReview && !currentQuestion?.selected && (
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-300 text-yellow-700 px-4 py-2 rounded-lg mb-4 text-sm font-medium">
                ⭐ Marked for review — answer before submitting
              </div>
            )}

            {/* Negative marking notice */}
            {hasNegMarking && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg mb-4 text-xs font-semibold">
                <AlertTriangle size={14} />
                Wrong answer deducts 1/3 mark. Skip if unsure.
              </div>
            )}

            {/* Question box */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5" style={{ userSelect: 'none' }}>
              <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Question {currentQ + 1}
              </p>
              <h2 className="text-lg font-semibold text-slate-900">{currentQuestion?.text}</h2>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {currentQuestion?.options.map((option, idx) => {
                const isSelected = currentQuestion.selected === option;
                // Derive correct answer letter index from feedback (e.g. "A. 20%" → index 0)
                const correctLetter = answerFeedback?.correct_answer?.trim().charAt(0).toUpperCase();
                const correctIndex = correctLetter ? correctLetter.charCodeAt(0) - 65 : -1;
                const isCorrectOption = answerFeedback !== null && correctIndex === idx;
                const isWrongSelected = answerFeedback !== null && isSelected && !answerFeedback.is_correct;

                let optionStyle = 'border-slate-200 hover:border-[#2557a7] hover:bg-blue-50';
                if (answerFeedback) {
                  if (isCorrectOption) optionStyle = 'border-emerald-500 bg-emerald-50';
                  else if (isWrongSelected) optionStyle = 'border-red-400 bg-red-50';
                  else if (isSelected) optionStyle = 'border-emerald-500 bg-emerald-50'; // selected + correct
                } else if (isSelected) {
                  optionStyle = 'border-[#2557a7] bg-blue-50';
                }

                return (
                  <label
                    key={idx}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition bg-white ${
                      answerSubmitting ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                    } ${optionStyle}`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      checked={isSelected}
                      onChange={() => handleSelectAnswer(option)}
                      disabled={answerSubmitting || answerFeedback !== null}
                      className="w-5 h-5 cursor-pointer accent-[#2557a7] disabled:cursor-not-allowed"
                    />
                    <span className="flex-1 text-base font-medium text-slate-900">{option}</span>
                    {answerFeedback && isCorrectOption && (
                      <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
                    )}
                    {answerFeedback && isWrongSelected && (
                      <span className="text-red-500 font-bold text-lg flex-shrink-0">✗</span>
                    )}
                    {answerSubmitting && isSelected && (
                      <div className="ml-auto w-4 h-4 border-2 border-[#2557a7] border-t-transparent rounded-full animate-spin" />
                    )}
                  </label>
                );
              })}
            </div>

            {/* Answer Explanation Panel */}
            <AnimatePresence>
              {answerFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className={`mb-6 rounded-xl border-2 overflow-hidden ${
                    answerFeedback.is_correct
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-red-400 bg-red-50'
                  }`}
                >
                  {/* Header */}
                  <div className={`flex items-center gap-3 px-5 py-3 ${
                    answerFeedback.is_correct ? 'bg-emerald-500' : 'bg-red-500'
                  }`}>
                    {answerFeedback.is_correct
                      ? <CheckCircle size={18} className="text-white" />
                      : <span className="text-white font-bold text-lg leading-none">✗</span>
                    }
                    <span className="text-white font-bold text-sm">
                      {answerFeedback.is_correct ? 'Correct Answer!' : 'Incorrect Answer'}
                    </span>
                    {!answerFeedback.is_correct && answerFeedback.correct_answer && (
                      <span className="ml-auto text-white text-xs font-semibold opacity-90">
                        Correct: {answerFeedback.correct_answer}
                      </span>
                    )}
                  </div>

                  <div className="px-5 py-4 space-y-4">
                    {/* Explanation */}
                    {answerFeedback.explanation && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Explanation</p>
                        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                          {answerFeedback.explanation}
                        </p>
                      </div>
                    )}

                    {/* AI Feedback */}
                    {answerFeedback.feedback && (
                      <div className={`rounded-lg p-3 ${
                        answerFeedback.is_correct ? 'bg-emerald-100' : 'bg-red-100'
                      }`}>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">AI Feedback</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{answerFeedback.feedback}</p>
                      </div>
                    )}

                    {/* Solution steps */}
                    {answerFeedback.solution_steps && answerFeedback.solution_steps.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Solution Steps</p>
                        <ol className="space-y-1.5">
                          {answerFeedback.solution_steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex-shrink-0 flex items-center justify-center mt-0.5">{i + 1}</span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleMarkForReview}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg border-2 font-semibold text-sm transition ${
                  currentQuestion?.markedForReview
                    ? 'border-yellow-500 text-yellow-600 bg-yellow-50'
                    : 'border-yellow-400 text-yellow-600 hover:bg-yellow-50'
                }`}
              >
                <Flag size={16} />
                Mark for Review
              </button>
              {currentQuestion?.selected && (
                <button
                  onClick={handleClearAnswer}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg border-2 border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold text-sm transition"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 px-5 py-2 rounded-lg border-2 border-red-200 text-red-500 hover:bg-red-50 font-semibold text-sm transition"
              >
                ⚠ Report
              </button>
            </div>

            {/* Navigation */}
            <div className="flex gap-4 justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQ === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-slate-300 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
              >
                <ChevronLeft size={18} /> Previous
              </button>
              <button
                onClick={handleNext}
                disabled={currentQ === questions.length - 1}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition bg-[#2557a7] hover:bg-[#1a3d73] text-white"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Sidebar: question palette */}
        <div className="w-72 border-l border-slate-200 bg-slate-50 p-5 overflow-y-auto flex-shrink-0">
          <h3 className="font-bold text-slate-900 mb-1 text-sm">Question Palette</h3>
          <p className="text-xs text-slate-500 mb-4">{currentSection?.section_name}</p>

          <div className="grid grid-cols-5 gap-2 mb-6">
            {questions.map((q, i) => (
              <button
                key={i}
                onClick={() => { setCurrentQ(i); setAnswerFeedback(null); }}
                className={`w-10 h-10 rounded-lg font-bold text-xs transition flex items-center justify-center relative ${
                  i === currentQ
                    ? 'bg-[#2557a7] text-white ring-2 ring-blue-300'
                    : q.markedForReview
                    ? 'bg-yellow-400 text-yellow-900'
                    : q.selected !== null
                    ? 'bg-green-500 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:border-[#2557a7]'
                }`}
              >
                {i + 1}
                {q.markedForReview && i !== currentQ && (
                  <span className="absolute -top-0.5 -right-0.5 text-[8px]">⭐</span>
                )}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="space-y-1.5 pt-4 border-t border-slate-200 mb-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Legend</p>
            {[['bg-green-500', 'Answered'], ['bg-white border border-slate-300', 'Not Attempted'], ['bg-[#2557a7]', 'Current'], ['bg-yellow-400', 'Flagged']].map(([cls, label]) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${cls}`} />
                <span className="text-xs text-slate-600">{label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-200">
            <div className="bg-green-100 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-green-700">{answered}</div>
              <div className="text-xs text-green-600">Answered</div>
            </div>
            <div className="bg-slate-200 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-slate-700">{notAnswered}</div>
              <div className="text-xs text-slate-600">Remaining</div>
            </div>
            {flagged > 0 && (
              <div className="col-span-2 bg-yellow-100 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-yellow-700">{flagged}</div>
                <div className="text-xs text-yellow-600">Flagged</div>
              </div>
            )}
          </div>

          {/* Tab switch indicator */}
          {tabSwitchCount > 0 && (
            <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5">
              <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-600 font-medium">{tabSwitchCount} tab switch{tabSwitchCount > 1 ? 'es' : ''} recorded</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Report Issue Modal ───────────────────────────────────────────────── */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-lg font-bold text-slate-900 mb-1">Report an Issue</h2>
            <p className="text-sm text-slate-500 mb-4">Question {currentQ + 1} — describe the problem</p>
            <textarea
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              placeholder="e.g. Wrong answer key, typo, missing option..."
              rows={4}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2557a7] resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowReportModal(false); setReportReason(''); }}
                className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReportIssue}
                disabled={!reportReason.trim() || reportSubmitting}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-sm transition disabled:opacity-50"
              >
                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
