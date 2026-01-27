import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ChevronDown,
  Target,
  FileText,
  Lock,
  Sparkles,
  BarChart3,
  Rocket,
  Globe,
  MessageCircle,
} from "lucide-react";

interface FAQ {
  question: string;
  answer: string;
  icon: string;
}

const iconMap: Record<string, React.ReactNode> = {
  "🎯": <Target className="w-6 h-6" />,
  "📄": <FileText className="w-6 h-6" />,
  "🔒": <Lock className="w-6 h-6" />,
  "✨": <Sparkles className="w-6 h-6" />,
  "📊": <BarChart3 className="w-6 h-6" />,
  "🚀": <Rocket className="w-6 h-6" />,
  "🌍": <Globe className="w-6 h-6" />,
  "💬": <MessageCircle className="w-6 h-6" />,
};

const faqs: FAQ[] = [
  {
    question: "How accurate is the ATS scoring system?",
    answer:
      "Our ATS scoring system is powered by AI and benchmarked against real recruitment data. It provides a reliable estimate of how applicant tracking systems rank your resume.",
    icon: "🎯",
  },
  {
    question: "What file formats are supported for resume scanning?",
    answer:
      "We currently support PDF, DOCX, and TXT file formats for resume scanning.",
    icon: "📄",
  },
  {
    question: "Is my resume data secure and private?",
    answer:
      "Yes. Your resume is encrypted, securely processed, and never shared with third parties.",
    icon: "🔒",
  },
  {
    question: "How does the AI resume enhancement work?",
    answer:
      "The AI analyzes formatting, keywords, readability, and job description alignment, then suggests improvements to boost your resume's score.",
    icon: "✨",
  },
  {
    question: "Can I analyze my resume against multiple job descriptions?",
    answer:
      "Yes, you can upload multiple job descriptions and compare your resume's match score across them.",
    icon: "📊",
  },
  {
    question: "What makes this different from other resume tools?",
    answer:
      "CareerBot ATS Scanner provides real-time feedback, keyword suggestions, and AI-driven enhancements, unlike traditional scanners.",
    icon: "🚀",
  },
  {
    question: "Do you offer support for international markets?",
    answer:
      "Yes, our ATS scanner works for global job applications, supporting multiple formats and industry standards.",
    icon: "🌍",
  },
  {
    question: "What kind of customer support is available?",
    answer:
      "We provide enterprise-grade support with a 24-hour response time and priority handling for premium users.",
    icon: "💬",
  },
];

function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 -right-40 w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-slate-400/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,0.02),transparent_50%)]" />

      <div className="w-full max-w-7xl relative z-10 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left (FAQ) */}
        <div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight tracking-tight mb-14">
            Frequently Asked
            <span className="block mt-2 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent">
              Questions
            </span>
          </h1>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`group bg-white rounded-2xl border-2 transition-all duration-300 overflow-hidden hover:shadow-lg ${
                  openIndex === index
                    ? "border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.02]"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full flex justify-between items-center p-6 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-2xl transition-all"
                  aria-expanded={openIndex === index}
                  aria-controls={`faq-answer-${index}`}
                >
                  <div className="flex items-center gap-4 pr-4 flex-1">
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        openIndex === index
                          ? "bg-gradient-to-br from-blue-500 to-cyan-600 text-white scale-110 shadow-lg shadow-blue-500/30"
                          : "bg-gradient-to-br from-gray-100 to-gray-50 text-gray-600 group-hover:from-blue-50 group-hover:to-cyan-50 group-hover:text-blue-600"
                      }`}
                    >
                      {iconMap[faq.icon]}
                    </div>
                    <span className="text-base sm:text-lg font-semibold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors">
                      {faq.question}
                    </span>
                  </div>
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      openIndex === index
                        ? "bg-blue-100 text-blue-600 rotate-180"
                        : "bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600"
                    }`}
                  >
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>
                <div
                  id={`faq-answer-${index}`}
                  className={`transition-all duration-500 ease-in-out ${
                    openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-6 pb-6 pl-[5.5rem]">
                    <div className="p-5 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 rounded-xl border border-blue-100/50 backdrop-blur-sm">
                      <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right (image) */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex flex-col gap-8 items-center justify-center w-full"
          style={{ minHeight: "600px" }}
        >
          <div className="relative w-full h-[380px] sm:h-[500px] lg:h-[600px] xl:h-[650px] flex items-center justify-center">
            <Image
              src="/images/FAQ.png"
              alt="FAQ Illustration - Customer support and questions"
              fill
              className="object-contain drop-shadow-2xl"
              priority
              sizes="(max-width: 1024px) 0vw, 35vw"
            />
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export default FAQPage;
