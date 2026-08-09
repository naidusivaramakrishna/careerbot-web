'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Play, AlertCircle, Wand2 } from 'lucide-react';
import { checkCredits } from '@/api/creditsApi';

// Only the levels the backend accepts (mock_test schemas.py: VALID_DIFFICULTIES).
// "Mixed" was offered here but the backend rejects it, so it could never start a test.
type Difficulty = 'Easy' | 'Medium' | 'Hard';

const categoryOptions = ['Aptitude', 'Arithmetic', 'Reasoning', 'Technical'] as const;
type Category = typeof categoryOptions[number];

const difficultyOptions: Difficulty[] = ['Easy', 'Medium', 'Hard'];

const timePerQuestion: Record<Difficulty, number> = {
  Easy: 1.5, Medium: 2, Hard: 2.5,
};


const diffMeta: Record<Difficulty, { color: string; bg: string; border: string }> = {
  Easy:   { color: '#065f46', bg: '#d1fae5', border: '#6ee7b7' },
  Medium: { color: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
  Hard:   { color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
};

export default function CustomTestPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>(['Aptitude']);
  // No default: the user must pick explicitly. Pre-selecting 'Medium' let tests
  // start with a level the user never actually chose.
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [questionCount] = useState(30);
  const [validationError, setValidationError] = useState('');
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [outOfCredits, setOutOfCredits] = useState(false);

  const toggleCategory = (cat: Category) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
    setValidationError('');
  };

  const handleStartTest = async () => {
    if (categories.length === 0) {
      setValidationError('Please select at least one category to continue.');
      return;
    }
    if (!difficulty) {
      setValidationError('Please select a difficulty level to continue.');
      return;
    }
    setStarting(true);
    setStartError(null);
    setOutOfCredits(false);

    // Cheap credits pre-check — NOT the old generation probe. The previous probe
    // generated a full throwaway test (60s timeout) just to validate and then
    // discarded it; that is deliberately still gone. This is a single fast
    // /credits/check call, and it exists because a mock test costs credits: without
    // it the user only discovers an out-of-credits 402 after being dropped into the
    // test runner, which reads as "the custom test won't generate".
    try {
      const credits = await checkCredits('mock_test');
      if (!credits.can_proceed) {
        setOutOfCredits(true);
        setStartError(
          `Not enough credits. This test needs ${credits.credit_cost} credits and you have ${credits.credits_remaining}.`
        );
        setStarting(false);
        return;
      }
    } catch {
      // Advisory only — if the pre-check itself fails, continue and let the
      // runner's own error handling report whatever the real problem is.
    }

    // The custom-test runner generates the first section itself (180s timeout +
    // inline error handling), so we navigate straight there.
    const parentSessionId = crypto.randomUUID();
    const params = new URLSearchParams({
      parentSessionId,
      categories: categories.map(c => c.toLowerCase()).join(','),
      difficulty: difficulty.toLowerCase(),
      count: questionCount.toString(),
    });
    router.push(`/mock-test/custom-test?${params.toString()}`);
  };


  return (
    <div className="min-h-screen" style={{ background: '#F8F9FB' }}>
      <div className="max-w-5xl mx-auto px-6 md:px-10 pt-10 pb-16">

        {/* Breadcrumb — same shape as section intro */}
        <div className="mb-6 text-sm flex items-center gap-2">
          <button onClick={() => router.push('/mock-test')} style={{ color: '#64748B' }} className="hover:underline">Mock Tests</button>
          <span style={{ color: '#CBD5E1' }}>›</span>
          <span className="font-semibold" style={{ color: '#0F172A' }}>Custom Builder</span>
        </div>

        {/* Main builder card — section-intro DNA */}
        <div
          className="bg-white rounded-2xl border p-8 md:p-10"
          style={{
            borderColor: '#E5E7EB',
            boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.06)',
          }}
        >
          {/* Header */}
          <div className="flex items-start gap-4 mb-7">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
              style={{ borderColor: '#E5E7EB', background: '#F8FAFC' }}>
              <Wand2 size={22} style={{ color: '#1e3a8a' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1.5" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
                Build your custom test
              </h2>
              <p className="text-sm max-w-xl leading-relaxed" style={{ color: '#64748B' }}>
                Pick your topics, set the difficulty and question count, then start instantly.
              </p>
            </div>
          </div>

          {/* Configuration sections — numbered list shape like section intro instructions */}
          <ol className="space-y-7 mb-7">

            {/* 1. Categories */}
            <li className="flex gap-3">
              <span className="font-semibold tabular-nums shrink-0 w-5 pt-1.5" style={{ color: '#475569' }}>1.</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-3">
                  <p className="text-[15px]">
                    <span className="font-bold" style={{ color: '#000' }}>Select categories:</span>{' '}
                    <span style={{ color: '#dc2626' }}>required</span>
                  </p>
                  {categories.length > 0 && (
                    <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full"
                      style={{ background: '#dbeafe', color: '#1e3a8a' }}>
                      {categories.length} selected
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {categoryOptions.map(cat => {
                    const isSelected = categories.includes(cat);
                    return (
                      <label
                        key={cat}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition select-none"
                        style={isSelected
                          ? { borderColor: '#1e3a8a', background: '#dbeafe' }
                          : { borderColor: '#E5E7EB', background: '#ffffff' }
                        }
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCategory(cat)}
                          className="w-4 h-4 rounded cursor-pointer"
                          style={{ accentColor: '#1e3a8a' }}
                        />
                        <span className="text-sm font-semibold" style={{ color: isSelected ? '#1e3a8a' : '#0F172A' }}>{cat}</span>
                      </label>
                    );
                  })}
                </div>
                {validationError && (
                  <div className="mt-3 flex items-center gap-2 text-xs rounded-lg px-3 py-2.5"
                    style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }}>
                    <AlertCircle size={13} className="shrink-0" />
                    {validationError}
                  </div>
                )}
              </div>
            </li>

            {/* 2. Difficulty */}
            <li className="flex gap-3">
              <span className="font-semibold tabular-nums shrink-0 w-5 pt-1.5" style={{ color: '#475569' }}>2.</span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] mb-3">
                  <span className="font-bold" style={{ color: '#000' }}>Difficulty level:</span>{' '}
                  <span style={{ color: '#2d2d2d' }}>controls time per question</span>
                </p>
                <div className="grid grid-cols-4 gap-2.5">
                  {difficultyOptions.map(level => {
                    const meta = diffMeta[level];
                    const isSelected = difficulty === level;
                    return (
                      <label
                        key={level}
                        className="flex flex-col items-center gap-1 py-3 rounded-xl border-2 cursor-pointer transition"
                        style={isSelected
                          ? { borderColor: meta.border, background: meta.bg }
                          : { borderColor: '#E5E7EB', background: '#ffffff' }
                        }
                      >
                        <input type="radio" name="difficulty" value={level} checked={isSelected}
                          onChange={() => { setDifficulty(level); setValidationError(''); }} className="sr-only" />
                        <span className="text-sm font-bold"
                          style={{ color: isSelected ? meta.color : '#0F172A' }}>
                          {level}
                        </span>
                        <span className="text-[11px]" style={{ color: isSelected ? meta.color : '#94A3B8' }}>
                          {timePerQuestion[level]} min/Q
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </li>

          </ol>

        </div>

        {/* Tip pill — section intro style */}
        <div className="flex flex-wrap gap-2 mt-5">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}
          >
            <span>→</span> Harder levels mean fewer gimmes — Hard best simulates real exam pressure
          </div>
        </div>

        {/* Bottom action row — section-intro DNA */}
        <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => router.push('/mock-test')}
            className="text-sm font-medium hover:underline"
            style={{ color: '#475569' }}
          >
            ← Back to Tests
          </button>

          <div className="flex items-center gap-3 flex-wrap">
            {startError && (
              <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#ef4444' }} role="alert">
                <AlertCircle size={13} className="shrink-0" /> {startError}
              </p>
            )}
            {outOfCredits && (
              <button
                onClick={() => router.push('/settings/subscription')}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white transition hover:opacity-90"
                style={{ background: '#dc2626' }}
              >
                Get credits
              </button>
            )}
            <button
              disabled={categories.length === 0 || starting}
              onClick={handleStartTest}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_rgba(30,58,138,0.5)] disabled:opacity-60 disabled:hover:translate-y-0"
              style={{ background: '#1e3a8a', boxShadow: '0 4px 14px -4px rgba(30,58,138,0.35)' }}
            >
              {starting ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating…</>
              ) : (
                <><Play size={14} className="fill-white" /> Begin Test <ChevronRight size={14} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
