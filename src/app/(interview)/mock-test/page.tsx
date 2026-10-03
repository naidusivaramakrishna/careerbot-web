'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Zap, Target, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { STANDARD_TEST_TOTALS } from '@/lib/mockTestConstants';

export default function MockTestPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{ background: '#F8F9FB' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10">

        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 mb-6 text-sm font-medium hover:opacity-70 transition"
          style={{ color: '#64748B' }}
        >
          <ChevronLeft size={18} />
          Back to Dashboard
        </button>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
            Master the Mock Tests
          </h1>
          <p className="text-sm sm:text-lg lg:text-xl max-w-2xl mx-auto" style={{ color: '#64748B' }}>
            Practice with realistic company recruitment patterns and ace your interviews
          </p>
        </motion.div>

        {/* Why Mock Tests */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl border p-4 sm:p-5" style={{ borderColor: '#E5E7EB' }}>
            <Target size={24} className="mb-2 sm:mb-3" style={{ color: '#1e3a8a' }} />
            <h3 className="text-base sm:text-lg font-bold mb-1.5" style={{ color: '#0F172A' }}>Real Patterns</h3>
            <p className="text-xs sm:text-sm" style={{ color: '#64748B' }}>Based on actual company recruitment tests and patterns</p>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl border p-4 sm:p-5" style={{ borderColor: '#E5E7EB' }}>
            <TrendingUp size={24} className="mb-2 sm:mb-3" style={{ color: '#1e3a8a' }} />
            <h3 className="text-base sm:text-lg font-bold mb-1.5" style={{ color: '#0F172A' }}>Track Progress</h3>
            <p className="text-xs sm:text-sm" style={{ color: '#64748B' }}>Monitor your improvement with detailed analytics and insights</p>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl border p-4 sm:p-5" style={{ borderColor: '#E5E7EB' }}>
            <Zap size={24} className="mb-2 sm:mb-3" style={{ color: '#1e3a8a' }} />
            <h3 className="text-base sm:text-lg font-bold mb-1.5" style={{ color: '#0F172A' }}>Boost Confidence</h3>
            <p className="text-xs sm:text-sm" style={{ color: '#64748B' }}>Build skills and confidence before the actual interviews</p>
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl border p-4 sm:p-6 mb-6 sm:mb-8"
          style={{ borderColor: '#E5E7EB' }}
        >
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6" style={{ color: '#0F172A' }}>How Mock Tests Work</h2>

          <div className="space-y-3 sm:space-y-4">
            {[
              {
                step: 1,
                title: 'Choose a Test',
                description: 'Browse through available mock tests from different companies. Each test is modeled on the actual recruitment pattern.',
              },
              {
                step: 2,
                title: 'Read Instructions',
                description: 'Understand the test format, rules, sections, and time limits specific to that company.',
              },
              {
                step: 3,
                title: 'Select Difficulty',
                description: 'Choose your preferred difficulty level (Easy, Medium, or Hard) for all sections.',
              },
              {
                step: 4,
                title: 'Take the Test',
                description: 'Answer questions section by section, with your progress tracked as you go.',
              },
              {
                step: 5,
                title: 'Review Results',
                description: 'Get detailed analytics, see your mistakes, and review explanations to learn.',
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-3 sm:gap-4 lg:gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg text-white font-bold text-sm sm:text-base" style={{ background: '#1e3a8a' }}>
                    {item.step}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base lg:text-lg font-bold mb-1" style={{ color: '#0F172A' }}>{item.title}</h3>
                  <p className="text-xs sm:text-sm" style={{ color: '#64748B' }}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.22 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8"
        >
          <div className="bg-white rounded-lg sm:rounded-xl border p-3 sm:p-4" style={{ borderColor: '#E5E7EB' }}>
            <div className="text-[9px] sm:text-xs uppercase tracking-wide mb-1.5" style={{ color: '#94A3B8' }}>Questions</div>
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold" style={{ color: '#0F172A' }}>{STANDARD_TEST_TOTALS.questions}</div>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl border p-3 sm:p-4" style={{ borderColor: '#E5E7EB' }}>
            <div className="text-[9px] sm:text-xs uppercase tracking-wide mb-1.5" style={{ color: '#94A3B8' }}>Duration</div>
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold" style={{ color: '#0F172A' }}>{STANDARD_TEST_TOTALS.minutes} min</div>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl border p-3 sm:p-4" style={{ borderColor: '#E5E7EB' }}>
            <div className="text-[9px] sm:text-xs uppercase tracking-wide mb-1.5" style={{ color: '#94A3B8' }}>Sections</div>
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold" style={{ color: '#0F172A' }}>{STANDARD_TEST_TOTALS.sections}</div>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl border p-3 sm:p-4" style={{ borderColor: '#E5E7EB' }}>
            <div className="text-[9px] sm:text-xs uppercase tracking-wide mb-1.5" style={{ color: '#94A3B8' }}>Difficulty</div>
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold" style={{ color: '#0F172A' }}>Medium</div>
          </div>
        </motion.div>

        {/* Before You Start Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="bg-white rounded-lg sm:rounded-xl border p-4 sm:p-6 mb-6 sm:mb-8"
          style={{ borderColor: '#E5E7EB' }}
        >
          <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4" style={{ color: '#0F172A' }}>Before You Start</h3>
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex items-start gap-3 sm:gap-4">
              <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 sm:mt-1" style={{ color: '#10b981' }} />
              <div className="min-w-0">
                <p className="font-semibold text-xs sm:text-sm" style={{ color: '#0F172A' }}>Stable Internet Connection</p>
                <p className="text-xs sm:text-sm mt-0.5" style={{ color: '#64748B' }}>Ensure uninterrupted connectivity throughout the test</p>
              </div>
            </div>
            <div className="flex items-start gap-3 sm:gap-4">
              <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 sm:mt-1" style={{ color: '#10b981' }} />
              <div className="min-w-0">
                <p className="font-semibold text-xs sm:text-sm" style={{ color: '#0F172A' }}>Quiet Environment</p>
                <p className="text-xs sm:text-sm mt-0.5" style={{ color: '#64748B' }}>Find a distraction-free space to focus on the test</p>
              </div>
            </div>
            <div className="flex items-start gap-3 sm:gap-4">
              <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 sm:mt-1" style={{ color: '#10b981' }} />
              <div className="min-w-0">
                <p className="font-semibold text-xs sm:text-sm" style={{ color: '#0F172A' }}>Allocate Full Time</p>
                <p className="text-xs sm:text-sm mt-0.5" style={{ color: '#64748B' }}>Dedicate {STANDARD_TEST_TOTALS.minutes + 10}-{STANDARD_TEST_TOTALS.minutes + 40} minutes without interruptions</p>
              </div>
            </div>
            <div className="flex items-start gap-3 sm:gap-4">
              <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 sm:mt-1" style={{ color: '#10b981' }} />
              <div className="min-w-0">
                <p className="font-semibold text-xs sm:text-sm" style={{ color: '#0F172A' }}>Close Other Apps</p>
                <p className="text-xs sm:text-sm mt-0.5" style={{ color: '#64748B' }}>Minimize distractions and avoid multitasking</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Important Rules */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.27 }}
          className="bg-red-50 rounded-lg sm:rounded-xl border p-4 sm:p-6 mb-6 sm:mb-8"
          style={{ borderColor: '#FECACA' }}
        >
          <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4" style={{ color: '#7f1d1d' }}>⚠️ Important Rules</h3>
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex items-start gap-3 sm:gap-4">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0 sm:mt-1" style={{ color: '#dc2626' }} />
              <p className="text-xs sm:text-sm" style={{ color: '#7f1d1d' }}>
                <strong>Do not refresh or close</strong> the browser window during the test
              </p>
            </div>
            <div className="flex items-start gap-3 sm:gap-4">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0 sm:mt-1" style={{ color: '#dc2626' }} />
              <p className="text-xs sm:text-sm" style={{ color: '#7f1d1d' }}>
                <strong>Section navigation is locked</strong> — once you submit a section, you cannot return to it
              </p>
            </div>
            <div className="flex items-start gap-3 sm:gap-4">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0 sm:mt-1" style={{ color: '#dc2626' }} />
              <p className="text-xs sm:text-sm" style={{ color: '#7f1d1d' }}>
                <strong>Time limits are strict</strong> — each section has its own timer
              </p>
            </div>
            <div className="flex items-start gap-3 sm:gap-4">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0 sm:mt-1" style={{ color: '#dc2626' }} />
              <p className="text-xs sm:text-sm" style={{ color: '#7f1d1d' }}>
                <strong>Your answers are auto-saved</strong> as you navigate through questions
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-col items-center justify-center"
        >
          <button
            onClick={() => router.push('/mock-test/browse')}
            className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-sm sm:text-base font-bold text-white transition hover:-translate-y-1 hover:shadow-lg active:opacity-80 w-full sm:w-auto"
            style={{
              background: '#1e3a8a',
              boxShadow: '0 4px 14px -4px rgba(30,58,138,0.35)',
            }}
          >
            Browse Mock Tests
            <ChevronRight size={16} className="sm:hidden" />
            <ChevronRight size={18} className="hidden sm:block" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
