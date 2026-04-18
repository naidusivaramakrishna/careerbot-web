'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Mixed';

const categoryOptions = ['Aptitude', 'Arithmetic', 'Reasoning', 'Technical'] as const;
type Category = typeof categoryOptions[number];

const difficultyOptions: Difficulty[] = ['Easy', 'Medium', 'Hard', 'Mixed'];
const questionCountOptions = [10, 20, 30, 40, 50, 75, 100];

const timePerQuestion: Record<Difficulty, number> = {
  Easy: 1.5,
  Medium: 2,
  Hard: 2.5,
  Mixed: 2,
};

const getDifficultyColor = (d: Difficulty) => {
  switch (d) {
    case 'Easy': return { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', badge: 'bg-green-100 text-green-700' };
    case 'Medium': return { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' };
    case 'Hard': return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', badge: 'bg-red-100 text-red-700' };
    case 'Mixed': return { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' };
  }
};

export default function CustomTestPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>(['Aptitude']);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [questionCount, setQuestionCount] = useState(30);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [validationError, setValidationError] = useState('');

  const estimatedTime = useMemo(() => {
    return Math.round(questionCount * timePerQuestion[difficulty]);
  }, [questionCount, difficulty]);

  const toggleCategory = (cat: Category) => {
    setCategories(prev => {
      if (prev.includes(cat)) {
        return prev.filter(c => c !== cat);
      }
      return [...prev, cat];
    });
    setValidationError('');
  };

  const handleStartTest = () => {
    if (categories.length === 0) {
      setValidationError('Please select at least one category to continue.');
      return;
    }
    const params = new URLSearchParams({
      categories: categories.map(c => c.toLowerCase()).join(','),
      difficulty: difficulty.toLowerCase(),
      count: questionCount.toString(),
    });
    router.push(`/mock-test/custom-test?${params.toString()}`);
  };

  const diffStyle = getDifficultyColor(difficulty);

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

        <div>
          <h1 className="text-3xl font-bold text-slate-900">Build Your Custom Test</h1>
          <p className="text-slate-500 mt-1">Choose your own topics, difficulty, and question count to build a personalized practice test.</p>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-8 py-8 bg-slate-50 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column — Configuration */}
            <div className="lg:col-span-2 space-y-6">

              {/* Categories */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
              >
                <h2 className="text-lg font-bold text-slate-900 mb-1">
                  Select Categories
                  <span className="text-red-500 ml-1">*</span>
                </h2>
                <p className="text-sm text-slate-500 mb-5">Choose one or more topics for your test</p>

                <div className="grid grid-cols-2 gap-3">
                  {categoryOptions.map((cat) => {
                    const isSelected = categories.includes(cat);
                    const catEmoji = { Aptitude: '🧮', Arithmetic: '➕', Reasoning: '🧩', Technical: '⚙️' }[cat];
                    return (
                      <label
                        key={cat}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                          isSelected
                            ? 'border-[#2557a7] bg-blue-50'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCategory(cat)}
                          className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-[#2557a7]"
                        />
                        <span className="text-lg">{catEmoji}</span>
                        <span className={`font-semibold text-sm ${isSelected ? 'text-[#2557a7]' : 'text-slate-700'}`}>
                          {cat}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {validationError && (
                  <div className="flex items-center gap-2 mt-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <AlertCircle size={15} className="flex-shrink-0" />
                    {validationError}
                  </div>
                )}
              </motion.div>

              {/* Difficulty */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
              >
                <h2 className="text-lg font-bold text-slate-900 mb-1">Difficulty Level</h2>
                <p className="text-sm text-slate-500 mb-5">Select how challenging you want the questions to be</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {difficultyOptions.map((level) => {
                    const style = getDifficultyColor(level);
                    const isSelected = difficulty === level;
                    return (
                      <label
                        key={level}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition ${
                          isSelected
                            ? `${style.border} ${style.bg}`
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="difficulty"
                          value={level}
                          checked={isSelected}
                          onChange={() => setDifficulty(level)}
                          className="sr-only"
                        />
                        <span className="text-2xl">
                          {level === 'Easy' ? '😊' : level === 'Medium' ? '😐' : level === 'Hard' ? '😤' : '🎲'}
                        </span>
                        <span className={`font-semibold text-sm ${isSelected ? style.text : 'text-slate-700'}`}>
                          {level}
                        </span>
                        <span className="text-xs text-slate-400">
                          {timePerQuestion[level]} min/Q
                        </span>
                      </label>
                    );
                  })}
                </div>
              </motion.div>

              {/* Question Count */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
              >
                <h2 className="text-lg font-bold text-slate-900 mb-1">Number of Questions</h2>
                <p className="text-sm text-slate-500 mb-5">Slide or select from the dropdown</p>

                {/* Slider */}
                <div className="mb-5">
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span>10</span>
                    <span className="font-bold text-[#2557a7] text-base">{questionCount} Questions</span>
                    <span>100</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={questionCount}
                    onChange={e => setQuestionCount(parseInt(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#2557a7]"
                  />
                  <div className="flex justify-between mt-1">
                    {[10, 25, 50, 75, 100].map(n => (
                      <span key={n} className="text-[10px] text-slate-400">{n}</span>
                    ))}
                  </div>
                </div>

                {/* Quick select dropdown */}
                <div>
                  <label className="text-sm text-slate-600 font-medium block mb-2">Quick select</label>
                  <select
                    value={questionCount}
                    onChange={e => setQuestionCount(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7] text-sm"
                  >
                    {questionCountOptions.map(num => (
                      <option key={num} value={num}>{num} Questions</option>
                    ))}
                  </select>
                </div>
              </motion.div>

              {/* Negative Marking */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
              >
                <h2 className="text-lg font-bold text-slate-900 mb-1">Negative Marking</h2>
                <p className="text-sm text-slate-500 mb-5">Simulate real exam negative marking</p>

                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition ${
                    negativeMarking ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="negMarking"
                      checked={negativeMarking}
                      onChange={() => setNegativeMarking(true)}
                      className="w-4 h-4 accent-red-600"
                    />
                    <span className={`font-semibold text-sm ${negativeMarking ? 'text-red-700' : 'text-slate-700'}`}>
                      Yes (-1/3)
                    </span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition ${
                    !negativeMarking ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="negMarking"
                      checked={!negativeMarking}
                      onChange={() => setNegativeMarking(false)}
                      className="w-4 h-4 accent-green-600"
                    />
                    <span className={`font-semibold text-sm ${!negativeMarking ? 'text-green-700' : 'text-slate-700'}`}>
                      No
                    </span>
                  </label>
                </div>
              </motion.div>
            </div>

            {/* Right Column — Live Preview */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="sticky top-6"
              >
                <div className="bg-white rounded-xl border-2 border-[#2557a7] shadow-sm p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-5">Test Preview</h2>

                  <div className="space-y-4 mb-6">
                    {/* Categories preview */}
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categories</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {categories.length > 0 ? (
                          categories.map(cat => (
                            <span key={cat} className="text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">
                              {cat}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-red-500 font-medium">No category selected</span>
                        )}
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Difficulty</span>
                      <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${diffStyle.badge}`}>
                        {difficulty}
                      </span>
                    </div>

                    {/* Questions */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Questions</span>
                      <span className="text-sm font-bold text-slate-900">{questionCount}</span>
                    </div>

                    {/* Estimated Time */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Est. Time</span>
                      <span className="text-sm font-bold text-[#2557a7]">~{estimatedTime} minutes (auto)</span>
                    </div>

                    {/* Negative Marking */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Neg. Marking</span>
                      <span className={`text-sm font-bold ${negativeMarking ? 'text-red-600' : 'text-green-600'}`}>
                        {negativeMarking ? 'Yes (-1/3)' : 'No'}
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-200 pt-4 mb-5">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-500">Total marks</span>
                      <span className="font-bold text-slate-900">{questionCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Pass mark</span>
                      <span className="font-bold text-slate-900">{Math.ceil(questionCount * 0.5)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleStartTest}
                    className={`w-full py-3 font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm ${
                      categories.length > 0
                        ? 'bg-[#2557a7] hover:bg-[#1a3d73] text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                    disabled={categories.length === 0}
                  >
                    <Play size={16} className={categories.length > 0 ? 'fill-white' : ''} />
                    Start Test
                  </button>

                  {categories.length === 0 && (
                    <p className="text-xs text-red-500 text-center mt-2">Select at least one category</p>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
