'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, Zap, Target, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MockTestInstructionsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{ background: '#F8F9FB' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-16">

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
            Master the Mock Tests
          </h1>
          <p className="text-lg sm:text-xl" style={{ color: '#64748B' }}>
            Practice with realistic company recruitment patterns and ace your interviews
          </p>
        </motion.div>

        {/* Why Mock Tests */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-12"
        >
          <div className="bg-white rounded-xl sm:rounded-2xl border p-6 sm:p-8" style={{ borderColor: '#E5E7EB' }}>
            <Target size={28} className="mb-3" style={{ color: '#1e3a8a' }} />
            <h3 className="text-lg font-bold mb-2" style={{ color: '#0F172A' }}>Real Patterns</h3>
            <p className="text-sm" style={{ color: '#64748B' }}>Based on actual company recruitment tests and patterns</p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border p-6 sm:p-8" style={{ borderColor: '#E5E7EB' }}>
            <TrendingUp size={28} className="mb-3" style={{ color: '#1e3a8a' }} />
            <h3 className="text-lg font-bold mb-2" style={{ color: '#0F172A' }}>Track Progress</h3>
            <p className="text-sm" style={{ color: '#64748B' }}>Monitor your improvement with detailed analytics and insights</p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border p-6 sm:p-8" style={{ borderColor: '#E5E7EB' }}>
            <Zap size={28} className="mb-3" style={{ color: '#1e3a8a' }} />
            <h3 className="text-lg font-bold mb-2" style={{ color: '#0F172A' }}>Boost Confidence</h3>
            <p className="text-sm" style={{ color: '#64748B' }}>Build skills and confidence before the actual interviews</p>
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-white rounded-xl sm:rounded-2xl border p-6 sm:p-10 mb-12"
          style={{ borderColor: '#E5E7EB' }}
        >
          <h2 className="text-2xl font-bold mb-6 sm:mb-8" style={{ color: '#0F172A' }}>How Mock Tests Work</h2>

          <div className="space-y-6">
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
                description: 'Answer questions section by section with real-time feedback and section-locked navigation.',
              },
              {
                step: 5,
                title: 'Review Results',
                description: 'Get detailed analytics, see your mistakes, and review explanations to learn.',
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4 sm:gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg text-white font-bold text-base" style={{ background: '#1e3a8a' }}>
                    {item.step}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-bold mb-1" style={{ color: '#0F172A' }}>{item.title}</h3>
                  <p className="text-sm" style={{ color: '#64748B' }}>{item.description}</p>
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
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-12"
        >
          <div className="bg-white rounded-xl sm:rounded-2xl border p-4 sm:p-6" style={{ borderColor: '#E5E7EB' }}>
            <div className="text-xs uppercase tracking-wide mb-2" style={{ color: '#94A3B8' }}>Questions</div>
            <div className="text-2xl sm:text-3xl font-bold" style={{ color: '#0F172A' }}>40</div>
          </div>
          <div className="bg-white rounded-xl sm:rounded-2xl border p-4 sm:p-6" style={{ borderColor: '#E5E7EB' }}>
            <div className="text-xs uppercase tracking-wide mb-2" style={{ color: '#94A3B8' }}>Duration</div>
            <div className="text-2xl sm:text-3xl font-bold" style={{ color: '#0F172A' }}>80 min</div>
          </div>
          <div className="bg-white rounded-xl sm:rounded-2xl border p-4 sm:p-6" style={{ borderColor: '#E5E7EB' }}>
            <div className="text-xs uppercase tracking-wide mb-2" style={{ color: '#94A3B8' }}>Sections</div>
            <div className="text-2xl sm:text-3xl font-bold" style={{ color: '#0F172A' }}>4</div>
          </div>
          <div className="bg-white rounded-xl sm:rounded-2xl border p-4 sm:p-6" style={{ borderColor: '#E5E7EB' }}>
            <div className="text-xs uppercase tracking-wide mb-2" style={{ color: '#94A3B8' }}>Difficulty</div>
            <div className="text-2xl sm:text-3xl font-bold" style={{ color: '#0F172A' }}>Medium</div>
          </div>
        </motion.div>

        {/* Before You Start Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="bg-white rounded-xl sm:rounded-2xl border p-6 sm:p-8 mb-12"
          style={{ borderColor: '#E5E7EB' }}
        >
          <h3 className="text-lg font-bold mb-6" style={{ color: '#0F172A' }}>Before You Start</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0" style={{ color: '#10b981' }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: '#0F172A' }}>Stable Internet Connection</p>
                <p className="text-sm" style={{ color: '#64748B' }}>Ensure uninterrupted connectivity throughout the test</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0" style={{ color: '#10b981' }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: '#0F172A' }}>Quiet Environment</p>
                <p className="text-sm" style={{ color: '#64748B' }}>Find a distraction-free space to focus on the test</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0" style={{ color: '#10b981' }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: '#0F172A' }}>Allocate Full Time</p>
                <p className="text-sm" style={{ color: '#64748B' }}>Dedicate 90-120 minutes without interruptions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0" style={{ color: '#10b981' }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: '#0F172A' }}>Close Other Apps</p>
                <p className="text-sm" style={{ color: '#64748B' }}>Minimize distractions and avoid multitasking</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Important Rules */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.27 }}
          className="bg-red-50 rounded-xl sm:rounded-2xl border p-6 sm:p-8 mb-12"
          style={{ borderColor: '#FECACA' }}
        >
          <h3 className="text-lg font-bold mb-6" style={{ color: '#7f1d1d' }}>⚠️ Important Rules</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" style={{ color: '#dc2626' }} />
              <p className="text-sm" style={{ color: '#7f1d1d' }}>
                <strong>Do not refresh or close</strong> the browser window during the test
              </p>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" style={{ color: '#dc2626' }} />
              <p className="text-sm" style={{ color: '#7f1d1d' }}>
                <strong>Section navigation is locked</strong> — once you submit a section, you cannot return to it
              </p>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" style={{ color: '#dc2626' }} />
              <p className="text-sm" style={{ color: '#7f1d1d' }}>
                <strong>Time limits are strict</strong> — each section has its own timer
              </p>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" style={{ color: '#dc2626' }} />
              <p className="text-sm" style={{ color: '#7f1d1d' }}>
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
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => router.push('/mock-test/browse')}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-lg text-base font-bold text-white transition hover:-translate-y-1 hover:shadow-lg w-full sm:w-auto"
            style={{
              background: '#1e3a8a',
              boxShadow: '0 4px 14px -4px rgba(30,58,138,0.35)',
            }}
          >
            Browse Mock Tests
            <ChevronRight size={18} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
