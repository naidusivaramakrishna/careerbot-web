'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Play, AlertTriangle, Clock, BookOpen, Calculator, Brain, Code, Lightbulb, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getMockTestCompanyById, generateMockTest } from '@/api/mockTestApi';
import { resolveCompanyId, resolveCompanyInfo } from '@/lib/mockTestConstants';

interface CompanyTemplate {
  name: string;
  totalQ: number;
  totalMin: number;
  navigation: string;
  negativeMarking: boolean;
  negativeValue: string | null;
  passing: string;
  lastVerified: string;
  confidence: string;
  rules: string[];
  tips: string[];
}

interface MockSection {
  name: string;
  icon: React.ElementType;
  questions: number;
  duration: number;
  description: string;
  color: string;
  iconColor: string;
  bgColor: string;
}

const MOCK_SECTIONS: MockSection[] = [
  {
    name: 'Arithmetic',
    icon: Calculator,
    questions: 10,
    duration: 20,
    description: 'Number systems, percentages, profit & loss, time & work, ratios',
    color: 'border-blue-200',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    name: 'Aptitude',
    icon: BookOpen,
    questions: 10,
    duration: 25,
    description: 'Data interpretation, averages, permutations, probability',
    color: 'border-purple-200',
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    name: 'Reasoning',
    icon: Brain,
    questions: 10,
    duration: 25,
    description: 'Logical sequences, blood relations, directions, coding-decoding',
    color: 'border-amber-200',
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    name: 'Technical',
    icon: Code,
    questions: 10,
    duration: 20,
    description: 'Computer science fundamentals, programming concepts, algorithms',
    color: 'border-green-200',
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
  },
];


const companyTemplates: Record<string, CompanyTemplate> = {
  '1': {
    name: 'TCS NQT',
    totalQ: 92,
    totalMin: 190,
    navigation: 'locked',
    negativeMarking: true,
    negativeValue: '-1/3',
    passing: '50% overall + 30% per section',
    lastVerified: 'March 2026',
    confidence: 'approximate',
    rules: [
      'Section-locked: you must finish each section before moving on',
      'Once a section is submitted, you cannot go back',
      'Negative marking (-1/3) applies to Quant, Reasoning, and Programming sections only',
      'Unanswered questions score 0 (no penalty for skipping)',
      'Passing: 50% overall + 30% per section',
    ],
    tips: [
      'TCS NQT has sectional time limits — you cannot go back to a section',
      'Negative marking is -1/3 — skip questions you are unsure about',
      'Verbal and Coding sections have no negative marking',
    ],
  },
  '2': {
    name: 'IBM Aptitude Test',
    totalQ: 50,
    totalMin: 60,
    navigation: 'locked',
    negativeMarking: false,
    negativeValue: null,
    passing: '60% overall',
    lastVerified: 'March 2026',
    confidence: 'approximate',
    rules: [
      'Section-locked navigation',
      'No negative marking',
      'Minimum 60% overall to qualify',
    ],
    tips: [
      'Focus on speed — 1 minute per question average',
      'Logical Reasoning section is most time-consuming',
      "Verbal questions are straightforward — don't overthink",
    ],
  },
  '3': {
    name: 'Infosys InfyTQ',
    totalQ: 55,
    totalMin: 125,
    navigation: 'locked',
    negativeMarking: false,
    negativeValue: null,
    passing: '65% overall',
    lastVerified: 'March 2026',
    confidence: 'approximate',
    rules: [
      'Section-locked: cannot revisit previous sections',
      'No negative marking in any section',
      'Minimum 65% overall required to pass',
    ],
    tips: [
      'Infosys InfyTQ requires 65%+ overall — aim high',
      'Programming section is separately evaluated',
      'Puzzle Solving tests spatial and logical thinking',
    ],
  },
  '4': {
    name: 'Cognizant GenC',
    totalQ: 60,
    totalMin: 120,
    navigation: 'locked',
    negativeMarking: false,
    negativeValue: null,
    passing: '50%+ (GenC), 65%+ (GenC Next)',
    lastVerified: 'March 2026',
    confidence: 'approximate',
    rules: [
      'Section-locked navigation',
      'No negative marking across all sections',
      'GenC: 50% cutoff, GenC Next: 65% cutoff',
    ],
    tips: [
      'Automata Fix tests pseudo-code debugging ability',
      'Verbal section is scoring — maximize here',
      'Coding quality determines GenC vs GenC Next placement',
    ],
  },
  '5': {
    name: 'L&T Recruitment Test',
    totalQ: 50,
    totalMin: 75,
    navigation: 'locked',
    negativeMarking: false,
    negativeValue: null,
    passing: '50% overall',
    lastVerified: 'March 2026',
    confidence: 'approximate',
    rules: [
      'Section-locked navigation',
      'No negative marking',
      'Technical section varies by specialization',
    ],
    tips: [
      'Technical questions are specific to engineering domain',
      'Aptitude and Reasoning are standard — practice thoroughly',
      'L&T test pattern varies by department — verify before exam',
    ],
  },
  '6': {
    name: 'Wipro NLTH',
    totalQ: 60,
    totalMin: 75,
    navigation: 'free',
    negativeMarking: false,
    negativeValue: null,
    passing: '50% overall',
    lastVerified: 'March 2026',
    confidence: 'approximate',
    rules: [
      'Free navigation: you can jump between sections anytime',
      'No negative marking',
      'Minimum 50% overall to qualify',
    ],
    tips: [
      'Wipro NLTH has free navigation — use it to your advantage',
      'English section is scoring — attempt it first if comfortable',
      'No negative marking — attempt all questions',
    ],
  },
};

// Transform backend response to match expected format
function transformCompanyData(data: any): any {
  if (!data) return null;

  // If already in expected format, return as is
  if (data.rules && data.tips) {
    return data;
  }

  // Transform backend format to expected format
  return {
    name: data.name || data.company_name || 'Unknown',
    totalQ: data.total_questions || data.questions || 50,
    totalMin: data.total_duration_minutes || data.duration || 60,
    navigation: data.config?.navigation || 'locked',
    negativeMarking: data.config?.negative_marking ?? false,
    negativeValue: data.config?.negative_value || null,
    passing: data.config?.passing_score ? `${data.config.passing_score}%` : '50%',
    lastVerified: data.last_verified || 'March 2026',
    confidence: 'high',
    rules: data.rules || [
      'Section-locked: you must finish each section before moving on',
      'Once a section is submitted, you cannot go back',
      `${data.config?.negative_marking ? 'Negative marking applies' : 'No negative marking'}`,
    ],
    tips: data.tips || [
      `This is a ${data.company_name || 'company'} recruitment test`,
      `Total ${data.total_questions || 50} questions in ${data.total_duration_minutes || 60} minutes`,
      'Practice thoroughly before the actual test',
    ],
    description: data.description,
    config: data.config,
    sections: data.sections,
  };
}

export default function CompanyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    getMockTestCompanyById(companyId)
      .then((data) => {
        const transformed = transformCompanyData(data);
        setCompany(transformed);
      })
      .catch((err) => {
        // Fall back to hardcoded data
        const fallback = companyTemplates[companyId];
        if (fallback) {
          setCompany(fallback);
        }
      })
      .finally(() => setLoading(false));
  }, [companyId]);

  const template = company || companyTemplates[companyId];
  const logoPath = resolveCompanyInfo(companyId).logoPath;

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2557a7] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-lg">Loading company details...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-slate-500 text-lg mb-4">Company not found.</p>
          <button
            onClick={() => router.push('/mock-test')}
            className="text-[#2557a7] font-semibold hover:underline"
          >
            Back to Mock Tests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white px-8 py-6 border-b border-slate-200"
      >
        <button
          onClick={() => router.push('/mock-test')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm mb-6 transition"
        >
          <ArrowLeft size={16} />
          Back to Mock Tests
        </button>

        <div className="flex items-center gap-5">
          {logoPath && (
            <div className="w-20 h-14 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl p-2 flex-shrink-0">
              <img src={logoPath} alt={template.name} className="max-h-10 max-w-full object-contain" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{template.name}</h1>
            <p className="text-slate-500 mt-1">Company Mock Test — Pattern as of {template.lastVerified}</p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-8 py-8 bg-slate-50 min-h-screen">
        <div className="max-w-4xl mx-auto">

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-white rounded-xl border border-slate-200 p-5 text-center shadow-sm">
              <div className="text-3xl font-bold text-slate-900 mb-1">40</div>
              <div className="text-sm text-slate-500 font-medium">Total Questions</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 text-center shadow-sm">
              <div className="text-3xl font-bold text-slate-900 mb-1">90</div>
              <div className="text-sm text-slate-500 font-medium">Total Minutes</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 text-center shadow-sm">
              <div className="text-3xl font-bold text-slate-900 mb-1">4</div>
              <div className="text-sm text-slate-500 font-medium">Sections</div>
            </div>
            <div className={`rounded-xl border p-5 text-center shadow-sm ${template.negativeMarking ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <div className={`text-xl font-bold mb-1 ${template.negativeMarking ? 'text-red-700' : 'text-green-700'}`}>
                {template.negativeMarking ? `Yes (${template.negativeValue})` : 'No'}
              </div>
              <div className={`text-sm font-medium ${template.negativeMarking ? 'text-red-600' : 'text-green-600'}`}>
                Negative Marking
              </div>
            </div>
          </motion.div>

          {/* Disclaimer Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-amber-50 border border-amber-300 rounded-xl p-5 mb-8 flex items-start gap-4"
          >
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <p className="text-sm font-bold text-amber-900">Pattern Notice</p>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${template.confidence === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {template.confidence === 'verified' ? '✓ Verified' : '~ Approximate pattern'}
                </span>
              </div>
              <p className="text-sm text-amber-800">
                This mock test is modelled on the <strong>{template.name}</strong> exam pattern as of <strong>{template.lastVerified}</strong>.
                Company test patterns change yearly — always verify against official sources before your actual exam.
              </p>
            </div>
          </motion.div>

          {/* Mock Test Section Order */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Lightbulb size={18} className="text-[#2557a7]" />
                Your Mock Test — Section Order
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Your test will follow this order. Complete each section before moving to the next.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {MOCK_SECTIONS.map((section, i) => {
                const Icon = section.icon;
                return (
                  <div key={section.name} className="flex items-center gap-4 px-6 py-4">
                    {/* Step number */}
                    <div className="w-8 h-8 rounded-full bg-[#2557a7] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>

                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl ${section.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={20} className={section.iconColor} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-bold text-slate-900">{section.name}</h3>
                        {i < MOCK_SECTIONS.length - 1 && (
                          <span className="text-xs text-slate-400">→ next</span>
                        )}
                        {i === MOCK_SECTIONS.length - 1 && (
                          <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Final Section</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{section.description}</p>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-slate-600 flex-shrink-0">
                      <span className="flex items-center gap-1">
                        <BookOpen size={13} className="text-slate-400" />
                        {section.questions} Qs
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-slate-400" />
                        {section.duration} min
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table footer */}
            <div className="px-6 py-3 bg-blue-50 border-t-2 border-slate-200 flex items-center justify-between">
              <span className="text-sm font-bold text-[#2557a7]">Total</span>
              <div className="flex items-center gap-6 text-sm font-bold text-[#2557a7]">
                <span>40 Questions</span>
                <span>90 Minutes</span>
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle size={12} /> No Negative Marking
                </span>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Test Rules */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-lg">📋</span> Test Rules
              </h2>
              <ul className="space-y-3">
                {template.rules.map((rule: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {rule}
                  </li>
                ))}
              </ul>

              <div className="mt-5 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Navigation Mode</span>
                  <span className="font-semibold px-2.5 py-0.5 rounded-full text-xs bg-red-50 text-red-700">
                    🔒 Section-Locked
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-slate-500">Passing Criteria</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[60%]">{template.passing}</span>
                </div>
              </div>
            </motion.div>

            {/* Tips */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-lg">💡</span> Tips for Success
              </h2>
              <ol className="space-y-4">
                {template.tips.map((tip: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="w-6 h-6 rounded-full bg-[#2557a7] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ol>
            </motion.div>
          </div>

          {/* Start Test Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex justify-center"
          >
            <button
              onClick={async () => {
                try {
                  const backendCompanyId = resolveCompanyId(companyId);

                  // Generate first section (Arithmetic)
                  const arithmeticSubcategories = ['percentages', 'time_and_work', 'profit_and_loss', 'ratios', 'number_systems'];
                  const randomSubcategory = arithmeticSubcategories[Math.floor(Math.random() * arithmeticSubcategories.length)];

                  const session = await generateMockTest(backendCompanyId, ['arithmetic'], [randomSubcategory], 30000);

                  router.push(`/mock-test/${companyId}?sessionId=${session.session_id}`);
                } catch (err: any) {
                  // Fallback: navigate without sessionId, test page will generate one
                  router.push(`/mock-test/${companyId}`);
                }
              }}
              className="bg-[#2557a7] hover:bg-[#1a3d73] text-white font-bold px-12 py-4 rounded-xl transition-colors flex items-center gap-3 text-lg shadow-md hover:shadow-lg"
            >
              <Play size={20} className="fill-white" />
              Start Test
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
