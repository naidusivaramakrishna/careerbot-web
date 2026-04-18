'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Star, Play, RotateCcw, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMockTestCompanies, getActiveSession, ActiveSession } from '@/api/mockTestApi';
import { resolveCompanyInfo } from '@/lib/mockTestConstants';

interface MockTest {
  id: string;
  company: string;
  logoPath: string;
  rating: number;
  categories: string[];
  questions: number;
  duration: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  attempts: number;
  badge: string;
}


const fallbackTests: MockTest[] = [
  {
    id: '1',
    company: 'TCS Mock Test',
    logoPath: '/assets/icons/company_logo_icons/Tata_Consultancy_Services.svg',
    rating: 4.8,
    categories: ['Verbal', 'Logical', 'Aptitude'],
    questions: 92,
    duration: 190,
    difficulty: 'Medium',
    attempts: 12800,
    badge: 'tcs',
  },
  {
    id: '2',
    company: 'IBM Mock Test',
    logoPath: '/assets/icons/company_logo_icons/Vector-2.svg',
    rating: 4.7,
    categories: ['Verbal', 'Logical', 'Aptitude'],
    questions: 50,
    duration: 60,
    difficulty: 'Hard',
    attempts: 8900,
    badge: 'ibm',
  },
  {
    id: '3',
    company: 'Infosys Mock Test',
    logoPath: '/assets/icons/company_logo_icons/Vector-1.svg',
    rating: 4.6,
    categories: ['Verbal', 'Logical', 'Aptitude'],
    questions: 55,
    duration: 125,
    difficulty: 'Medium',
    attempts: 11200,
    badge: 'infosys',
  },
  {
    id: '4',
    company: 'Cognizant Mock Test',
    logoPath: '/assets/icons/company_logo_icons/Vector.svg',
    rating: 4.5,
    categories: ['Verbal', 'Logical', 'Aptitude'],
    questions: 60,
    duration: 120,
    difficulty: 'Easy',
    attempts: 7500,
    badge: 'cognizant',
  },
  {
    id: '5',
    company: 'L&T Mock Test',
    logoPath: '/assets/icons/company_logo_icons/Larsen___Toubro.svg',
    rating: 4.4,
    categories: ['Verbal', 'Logical', 'Aptitude'],
    questions: 50,
    duration: 75,
    difficulty: 'Medium',
    attempts: 5700,
    badge: 'lt',
  },
  {
    id: '6',
    company: 'Wipro Mock Test',
    logoPath: '/assets/icons/company_logo_icons/wipro-1.svg',
    rating: 4.6,
    categories: ['Verbal', 'Logical', 'Aptitude'],
    questions: 60,
    duration: 75,
    difficulty: 'Easy',
    attempts: 9100,
    badge: 'wipro',
  },
];

export default function MockTestPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [tests, setTests] = useState<MockTest[]>(fallbackTests);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);

  useEffect(() => {
    getMockTestCompanies()
      .then((companies: any[]) => {
        const mapped: MockTest[] = companies.map((c: any) => {
          // Handle both old and new backend formats
          const id = c.id || c.company_id;
          const name = c.name || c.company_name;

          return {
            id: id,
            company: name,
            logoPath: resolveCompanyInfo(id).logoPath,
            rating: c.rating ?? 4.5,
            categories: c.categories ?? ['Verbal', 'Logical', 'Aptitude'],
            questions: c.questions || c.total_questions || 50,
            duration: c.duration || c.total_duration_minutes || 60,
            difficulty: c.difficulty ?? 'Medium',
            attempts: c.attempts ?? 0,
            badge: id,
          };
        });
        setTests(mapped);
      })
      .catch((err) => {
      });
  }, []);

  useEffect(() => {
    const fetchActiveSession = async () => {
      try {
        const session = await getActiveSession();
        if (session) {
          setActiveSession(session);
        } else {
          setActiveSession(null);
        }
      } catch (err: any) {
        setActiveSession(null);
      }
    };
    fetchActiveSession();
  }, []);

  const filteredTests = useMemo(() => {
    return tests.filter((test: MockTest) =>
      test.company.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, tests]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatAttempts = (attempts: number) => {
    if (attempts >= 1000) return `${(attempts / 1000).toFixed(1)}K`;
    return attempts.toString();
  };

  const activeTestName = activeSession?.company_id
    ? (tests.find(t => t.id === activeSession.company_id)?.company ?? 'Mock Test')
    : 'Mock Test';

  return (
    <div className="w-full bg-white min-h-screen">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white px-8 py-12"
      >
        <div className="flex justify-between items-start gap-8">
          <div>
            <h1 className="text-4xl font-bold mb-3 text-slate-900">Mock Test</h1>
            <p className="text-slate-600 text-lg">
              Practice company-specific aptitude tests used in real hiring exams.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-12">
            <div>
              <div className="text-3xl font-bold text-slate-900">6</div>
              <div className="text-slate-600">Companies</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900">300+</div>
              <div className="text-slate-600">Questions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900">55K+</div>
              <div className="text-slate-600">Participants</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-8 py-12 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">

          {/* Active Session Recovery Banner */}
          <AnimatePresence>
            {activeSession && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-8 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <RotateCcw size={20} className="text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-900">You have an in-progress test</p>
                    <p className="text-sm text-amber-700">{activeTestName} — resume where you left off</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push(`/mock-test/${activeSession.company_id ?? 'custom'}`)}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
                  >
                    Resume Test
                  </button>
                  <button
                    onClick={() => setActiveSession(null)}
                    className="p-1.5 text-amber-500 hover:text-amber-700 transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Company Mock Tests Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-between items-center gap-4 mb-8">
              <h2 className="text-2xl font-bold text-slate-900 whitespace-nowrap">Company Mock Tests</h2>

              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search company tests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
                />
              </div>

              <span className="text-slate-600 font-medium whitespace-nowrap">{filteredTests.length} tests available</span>
            </div>

            {/* Tests Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {filteredTests.map((test, index) => (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => router.push(`/mock-test/company/${test.id}`)}
                  className="bg-white border-l-4 border-l-blue-500 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer group"
                >
                  {/* Logo, Company Name & Rating */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="w-16 h-12 flex items-center justify-center flex-shrink-0">
                      <img src={test.logoPath} alt={test.company} className="max-h-10 max-w-full object-contain" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <h3 className="text-lg font-bold text-slate-900">{test.company}</h3>
                      <div className="flex items-center gap-1">
                        <Star size={16} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold text-slate-900">{test.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {test.categories.map((cat) => (
                      <span
                        key={cat}
                        className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-700 rounded"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Meta Info */}
                  <div className="mb-4 pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-2 text-sm text-slate-600 flex-wrap">
                      <span>📋 {test.questions} Questions</span>
                      <span>⏱️ {test.duration} Mins</span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${getDifficultyColor(test.difficulty)}`}>
                        {test.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Attempts and Start Button */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 whitespace-nowrap">👥 {formatAttempts(test.attempts)} attempts</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/mock-test/company/${test.id}`); }}
                      className="bg-[#2557a7] hover:bg-[#1a3d73] text-white font-semibold py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Play size={14} className="fill-white" /> View & Start
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Build Custom Test CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-[#2557a7] to-[#1a3d73] rounded-2xl p-8 text-white"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Build Custom Test</h2>
                <p className="text-blue-200 mb-4">Choose your own topics, difficulty, and question count</p>
                <div className="flex flex-wrap gap-2">
                  {['Aptitude', 'Arithmetic', 'Reasoning', 'Technical'].map(tag => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1.5 bg-white/20 rounded-full text-white">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => router.push('/mock-test/custom')}
                className="flex items-center gap-2 bg-white text-[#2557a7] font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition whitespace-nowrap text-sm flex-shrink-0"
              >
                Start Building
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
