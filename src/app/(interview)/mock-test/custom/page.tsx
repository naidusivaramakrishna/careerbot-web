'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Play, AlertCircle, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { generateCustomTest, submitTest } from '@/api/mockTestApi';

type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Mixed';

const categoryOptions = ['Aptitude', 'Arithmetic', 'Reasoning', 'Technical'] as const;
type Category = typeof categoryOptions[number];

const difficultyOptions: Difficulty[] = ['Easy', 'Medium', 'Hard', 'Mixed'];
const questionCountOptions = [10, 20, 30, 40, 50, 75, 100];

const timePerQuestion: Record<Difficulty, number> = {
  Easy: 1.5, Medium: 2, Hard: 2.5, Mixed: 2,
};


const diffMeta: Record<Difficulty, { emoji: string; color: string; bg: string; border: string }> = {
  Easy:   { emoji: '😊', color: '#065f46', bg: '#d1fae5', border: '#6ee7b7' },
  Medium: { emoji: '😐', color: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
  Hard:   { emoji: '😤', color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
  Mixed:  { emoji: '🎲', color: '#4c1d95', bg: '#ede9fe', border: '#c4b5fd' },
};

export default function CustomTestPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>(['Aptitude']);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [questionCount, setQuestionCount] = useState(30);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const estimatedTime = useMemo(
    () => Math.round(questionCount * timePerQuestion[difficulty]),
    [questionCount, difficulty],
  );

  const toggleCategory = (cat: Category) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
    setValidationError('');
  };

  const handleStartTest = async () => {
    if (categories.length === 0) {
      setValidationError('Please select at least one category to continue.');
      return;
    }
    setStarting(true);
    setStartError(null);
    try {
      const parentSessionId = crypto.randomUUID();
      // Validate the AI service is reachable; then close the probe session
      // so the test page can generate all sections cleanly under the same parent.
      const probeSession = await generateCustomTest(
        categories.map(c => c.toLowerCase()),
        difficulty.toLowerCase(),
        parentSessionId,
      );
      try { await submitTest(probeSession.session_id); } catch { /* ignore */ }

      const params = new URLSearchParams({
        parentSessionId,
        categories: categories.map(c => c.toLowerCase()).join(','),
        difficulty: difficulty.toLowerCase(),
        count: questionCount.toString(),
      });
      router.push(`/mock-test/custom-test?${params.toString()}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error_code?: string; message?: string }; status?: number } };
      const code = e?.response?.data?.error_code;
      const status = e?.response?.status;
      if (status === 402 || code === 'HTTP_402') {
        setStartError('Not enough credits to generate a test.');
      } else if (code === 'AI_SERVICE_UNAVAILABLE') {
        setStartError('AI service is temporarily unavailable. Please wait a moment and try again.');
      } else if (code === 'ACTIVE_SESSION_EXISTS') {
        setStartError('An active session already exists. Please complete or exit it before starting a new test.');
      } else {
        setStartError(e?.response?.data?.message ?? 'Failed to generate test. Please try again.');
      }
    } finally {
      setStarting(false);
    }
  };

  const dm = diffMeta[difficulty];

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F4F2EC' }}>

      {/* Breadcrumb */}
      <div className="flex items-center justify-between px-6 pt-5 pb-0">
        <div className="flex items-center gap-1.5 text-xs font-bold tracking-widest" style={{ color: '#2d2d2d', opacity: 0.5 }}>
          <button onClick={() => router.push('/mock-test')} className="hover:opacity-80 transition">MOCK TESTS</button>
          <ChevronRight size={10} />
          <span style={{ color: '#2557a7', opacity: 1 }}>CUSTOM BUILD</span>
        </div>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-4 pb-3"
      >
        <div className="flex items-start justify-between gap-6">
          {/* Left: icon + title */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border"
              style={{ borderColor: '#e5e7eb', background: '#fff' }}>
              <Wand2 size={26} style={{ color: '#2557a7' }} />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest mb-1" style={{ color: '#2d2d2d', opacity: 0.45 }}>
                CUSTOM BUILDER · PERSONALISED TEST
              </p>
              <h1 className="text-2xl font-black mb-1" style={{ color: '#000', letterSpacing: '-0.5px' }}>
                Build Your Custom Test
              </h1>
              <p className="text-sm max-w-lg leading-relaxed mb-4" style={{ color: '#2d2d2d', opacity: 0.7 }}>
                Pick your topics, set the difficulty and question count, then start instantly.{' '}
                {negativeMarking
                  ? <span>Negative marking <span className="font-black" style={{ color: '#dc2626' }}>-1/3</span> enabled.</span>
                  : <span>No negative marking.</span>
                }{' '}
                Pass mark <span className="font-black" style={{ color: '#2557a7' }}>50%</span>.
              </p>

              {/* Inline stats strip */}
              <div className="flex items-center gap-0 rounded-xl overflow-hidden border w-fit" style={{ borderColor: '#e5e7eb' }}>
                {[
                  { label: 'QUESTIONS',   value: String(questionCount),   suffix: '',     accent: false },
                  { label: 'EST. TIME',   value: String(estimatedTime),   suffix: 'min',  accent: false },
                  { label: 'SECTIONS',    value: String(categories.length || '—'), suffix: '', accent: false },
                  { label: 'DIFFICULTY',  value: difficulty,              suffix: '',     accent: true  },
                ].map((stat, i, arr) => (
                  <div
                    key={stat.label}
                    className="px-5 py-3 text-center bg-white"
                    style={{ borderRight: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none' }}
                  >
                    <div className="flex items-baseline justify-center gap-0.5 font-black"
                      style={{ color: stat.accent ? '#2557a7' : '#000', fontSize: 22 }}>
                      {stat.value}
                      {stat.suffix && (
                        <span className="text-xs font-semibold ml-0.5" style={{ color: '#2d2d2d', opacity: 0.5 }}>{stat.suffix}</span>
                      )}
                    </div>
                    <div className="text-xs font-semibold mt-0.5" style={{ color: '#2d2d2d', opacity: 0.5 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Two-column body */}
      <div className="flex gap-5 px-6">

        {/* Left: configuration */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border overflow-hidden"
            style={{ borderColor: '#e5e7eb' }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: '#f3f4f6' }}>
              <p className="text-sm font-black" style={{ color: '#000' }}>
                Select categories <span style={{ color: '#ef4444' }}>*</span>
              </p>
              {categories.length > 0 && (
                <span className="text-xs font-black px-2.5 py-1 rounded-full"
                  style={{ background: '#eef3ff', color: '#2557a7' }}>
                  {categories.length} selected
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 p-5">
              {categoryOptions.map(cat => {
                const isSelected = categories.includes(cat);
                return (
                  <label
                    key={cat}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 cursor-pointer transition select-none"
                    style={isSelected
                      ? { borderColor: '#2557a7', background: '#eef3ff' }
                      : { borderColor: '#e5e7eb', background: '#f9fafb' }
                    }
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCategory(cat)}
                      className="w-4 h-4 rounded cursor-pointer"
                      style={{ accentColor: '#2557a7' }}
                    />
                    <p className="text-xs font-black" style={{ color: isSelected ? '#2557a7' : '#000' }}>{cat}</p>
                  </label>
                );
              })}
            </div>

            {validationError && (
              <div className="mx-5 mb-4 flex items-center gap-2 text-xs rounded-lg px-3 py-2.5"
                style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }}>
                <AlertCircle size={13} className="shrink-0" />
                {validationError}
              </div>
            )}
          </motion.div>

          {/* Difficulty */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border overflow-hidden"
            style={{ borderColor: '#e5e7eb' }}
          >
            <div className="px-5 py-3 border-b" style={{ borderColor: '#f3f4f6' }}>
              <p className="text-sm font-black" style={{ color: '#000' }}>Difficulty level</p>
            </div>

            <div className="grid grid-cols-4 gap-3 p-5">
              {difficultyOptions.map(level => {
                const meta = diffMeta[level];
                const isSelected = difficulty === level;
                return (
                  <label
                    key={level}
                    className="flex flex-col items-center gap-2 py-4 rounded-xl border-2 cursor-pointer transition"
                    style={isSelected
                      ? { borderColor: meta.border, background: meta.bg }
                      : { borderColor: '#e5e7eb', background: '#f9fafb' }
                    }
                  >
                    <input type="radio" name="difficulty" value={level} checked={isSelected}
                      onChange={() => setDifficulty(level)} className="sr-only" />
                    <span className="text-xs font-black tracking-wide"
                      style={{ color: isSelected ? meta.color : '#2d2d2d' }}>
                      {level.toUpperCase()}
                    </span>
                    <span className="text-xs" style={{ color: '#2d2d2d', opacity: 0.45 }}>{timePerQuestion[level]} min/Q</span>
                  </label>
                );
              })}
            </div>
          </motion.div>

          {/* Question Count */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border overflow-hidden"
            style={{ borderColor: '#e5e7eb' }}
          >
            <div className="px-5 py-3 border-b" style={{ borderColor: '#f3f4f6' }}>
              <p className="text-sm font-black" style={{ color: '#000' }}>Number of questions</p>
            </div>

            <div className="p-5">
              {/* Slider */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs" style={{ color: '#2d2d2d', opacity: 0.45 }}>10</span>
                  <span className="text-base font-black" style={{ color: '#2557a7' }}>{questionCount} Questions</span>
                  <span className="text-xs" style={{ color: '#2d2d2d', opacity: 0.45 }}>100</span>
                </div>
                <input
                  type="range" min={10} max={100} step={5} value={questionCount}
                  onChange={e => setQuestionCount(parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: '#2557a7' }}
                />
                <div className="flex justify-between mt-1.5">
                  {[10, 25, 50, 75, 100].map(n => (
                    <span key={n} className="text-xs" style={{ color: '#2d2d2d', opacity: 0.3 }}>{n}</span>
                  ))}
                </div>
              </div>

              {/* Quick pick */}
              <div>
                <p className="text-xs font-black tracking-widest mb-2.5" style={{ color: '#2d2d2d', opacity: 0.45 }}>QUICK SELECT</p>
                <div className="flex flex-wrap gap-2">
                  {questionCountOptions.map(num => (
                    <button key={num} onClick={() => setQuestionCount(num)}
                      className="px-3.5 py-1.5 rounded-lg border text-xs font-black transition"
                      style={questionCount === num
                        ? { background: '#2557a7', color: '#fff', borderColor: '#2557a7' }
                        : { background: '#f9fafb', color: '#2d2d2d', borderColor: '#e5e7eb' }
                      }>
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Negative Marking */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl border overflow-hidden"
            style={{ borderColor: '#e5e7eb' }}
          >
            <div className="px-5 py-3 border-b" style={{ borderColor: '#f3f4f6' }}>
              <p className="text-sm font-black" style={{ color: '#000' }}>Negative marking</p>
            </div>

            <div className="flex gap-3 p-5">
              <label className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl border-2 cursor-pointer transition"
                style={negativeMarking
                  ? { borderColor: '#fca5a5', background: '#fef2f2' }
                  : { borderColor: '#e5e7eb', background: '#f9fafb' }
                }>
                <input type="radio" name="negMarking" checked={negativeMarking}
                  onChange={() => setNegativeMarking(true)} className="w-4 h-4" style={{ accentColor: '#dc2626' }} />
                <span className="font-black text-sm" style={{ color: negativeMarking ? '#991b1b' : '#2d2d2d' }}>
                  Yes · -1/3
                </span>
              </label>
              <label className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl border-2 cursor-pointer transition"
                style={!negativeMarking
                  ? { borderColor: '#6ee7b7', background: '#d1fae5' }
                  : { borderColor: '#e5e7eb', background: '#f9fafb' }
                }>
                <input type="radio" name="negMarking" checked={!negativeMarking}
                  onChange={() => setNegativeMarking(false)} className="w-4 h-4" style={{ accentColor: '#059669' }} />
                <span className="font-black text-sm" style={{ color: !negativeMarking ? '#065f46' : '#2d2d2d' }}>
                  No Penalty
                </span>
              </label>
            </div>
          </motion.div>
        </div>

        {/* Right: preview panel — styled like the company history panel */}
        <div className="w-64 shrink-0 space-y-4">

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border overflow-hidden"
            style={{ borderColor: '#e5e7eb' }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: '#f3f4f6' }}>
              <p className="text-xs font-black tracking-widest" style={{ color: '#2d2d2d', opacity: 0.45 }}>
                TEST PREVIEW
              </p>
            </div>

            <div className="p-4 space-y-4">
              {/* Categories */}
              <div>
                <p className="text-xs font-black tracking-widest mb-1.5" style={{ color: '#2d2d2d', opacity: 0.45 }}>CATEGORIES</p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.length > 0 ? categories.map(cat => (
                    <span key={cat} className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: '#eef3ff', color: '#2557a7' }}>
                      {cat}
                    </span>
                  )) : (
                    <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>None selected</span>
                  )}
                </div>
              </div>

              {/* Scoring grid */}
              <div>
                <p className="text-xs font-black tracking-widest mb-2" style={{ color: '#2d2d2d', opacity: 0.45 }}>CONFIGURATION</p>
                <div className="grid grid-cols-3 pb-1.5 border-b" style={{ borderColor: '#f3f4f6' }}>
                  <span className="text-xs font-black" style={{ color: '#2d2d2d', opacity: 0.4 }}>FIELD</span>
                  <span className="text-xs font-black col-span-2" style={{ color: '#2d2d2d', opacity: 0.4 }}>VALUE</span>
                </div>
                {[
                  { label: 'Difficulty',  value: difficulty,                color: dm.color,   bg: dm.bg },
                  { label: 'Questions',   value: String(questionCount),     color: '#000',     bg: '' },
                  { label: 'Time',        value: `~${estimatedTime} min`,   color: '#2557a7',  bg: '' },
                  { label: 'Neg. Mark',   value: negativeMarking ? '-1/3' : 'None', color: negativeMarking ? '#991b1b' : '#065f46', bg: '' },
                  { label: 'Total Marks', value: String(questionCount),     color: '#000',     bg: '' },
                  { label: 'Pass Mark',   value: `${Math.ceil(questionCount * 0.5)} (50%)`, color: '#2557a7', bg: '' },
                ].map(row => (
                  <div key={row.label} className="grid grid-cols-3 py-1.5 border-b last:border-b-0" style={{ borderColor: '#f8f8f8' }}>
                    <span className="text-xs" style={{ color: '#2d2d2d', opacity: 0.55 }}>{row.label}</span>
                    <span className="text-xs font-black col-span-2" style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Tip */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl p-3 border flex items-start gap-2.5"
            style={{ background: '#fffbeb', borderColor: '#fde68a' }}
          >
            <span style={{ color: '#d97706', fontSize: 13, marginTop: 1, flexShrink: 0 }}>→</span>
            <p className="text-xs leading-relaxed" style={{ color: '#92400e' }}>
              Mixed difficulty pulls from all levels — best for simulating real exam conditions.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Fixed bottom bar */}
      <div
        className="fixed bottom-0 left-52 right-0 z-30 border-t px-6 py-3 flex items-center justify-between gap-4"
        style={{ background: '#ffffff', borderColor: '#e5e7eb' }}
      >
        {/* Left info */}
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs font-bold tracking-widest" style={{ color: '#2d2d2d', opacity: 0.45 }}>QUESTIONS</p>
            <p className="text-sm font-black" style={{ color: '#000' }}>{questionCount}</p>
          </div>
          <div className="w-px h-8" style={{ background: '#e5e7eb' }} />
          <div>
            <p className="text-xs font-bold tracking-widest" style={{ color: '#2d2d2d', opacity: 0.45 }}>WINDOW</p>
            <p className="text-sm font-black" style={{ color: '#000' }}>
              {estimatedTime} MIN · <span style={{ color: '#2d2d2d', opacity: 0.55, fontWeight: 600 }}>NO PAUSE</span>
            </p>
          </div>
          <div className="w-px h-8" style={{ background: '#e5e7eb' }} />
          <div>
            <p className="text-xs font-bold tracking-widest" style={{ color: '#2d2d2d', opacity: 0.45 }}>DIFFICULTY</p>
            <p className="text-sm font-black" style={{ color: dm.color }}>{difficulty}</p>
          </div>
          <div className="w-px h-8" style={{ background: '#e5e7eb' }} />
          <div>
            <p className="text-xs font-bold tracking-widest" style={{ color: '#2d2d2d', opacity: 0.45 }}>CATEGORIES</p>
            <p className="text-sm font-black" style={{ color: '#000' }}>
              {categories.length > 0 ? categories.join(', ') : <span style={{ color: '#ef4444' }}>None</span>}
            </p>
          </div>
        </div>

        {/* Error + CTA */}
        <div className="flex items-center gap-3">
          {startError && (
            <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#ef4444' }}>
              <AlertCircle size={13} /> {startError}
            </p>
          )}
          <button
            disabled={categories.length === 0 || starting}
            onClick={handleStartTest}
            className="flex items-center gap-2 font-black px-7 py-2.5 rounded-xl text-white text-sm tracking-wide transition disabled:opacity-60"
            style={{ background: '#2557a7' }}
          >
            {starting ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> GENERATING...</>
            ) : (
              <><Play size={14} className="fill-white" /> BEGIN TEST <ChevronRight size={14} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
