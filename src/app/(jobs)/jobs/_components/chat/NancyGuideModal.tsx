"use client";

import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import PromptCard from "./PromptCard";

interface NancyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPromptClick: (prompt: string) => void;
}

export default function NancyGuideModal({
  isOpen,
  onClose,
  onPromptClick,
}: NancyGuideModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!isOpen || !mounted) return null;

  const sections = [
    {
      title: "📚 Learn About This Job",
      description: "Get comprehensive job insights and understand role requirements",
      details: [
        "Get a job summary and key details",
        "Compare the role with your resume",
        "Generate common interview questions",
        "Analyze salary and compensation insights",
      ],
      prompts: [
        "Give me a quick summary of this job",
        "How closely do my skills match this role?",
        "What interview questions should I prepare for?",
        "What's the salary range and compensation for this role?",
      ],
    },
    {
      title: "🚀 Improve Your Chances",
      description: "Enhance your profile to stand out to recruiters",
      details: [
        "Identify skill gaps with visual analysis",
        "Get portfolio project suggestions",
        "Receive resume improvement tips",
        "Learn ATS optimization strategies",
      ],
      prompts: [
        "What skills are missing from my profile for this role?",
        "What portfolio projects should I build to impress this company?",
        "How can I improve my resume for this job?",
        "What's the best way to optimize my resume for ATS?",
      ],
    },
    {
      title: "🔍 Refine Your Job Search",
      description: "Find jobs that match your preferences and goals",
      details: [
        "Filter jobs by salary range",
        "Filter by experience level required",
        "Find remote-only opportunities",
        "Discover H1B sponsorship positions",
      ],
      prompts: [
        "Show me jobs in a higher salary range",
        "Find jobs matching my experience level",
        "Are there remote-only opportunities available?",
        "Which jobs offer H1B sponsorship?",
      ],
    },
    {
      title: "💬 Interview Preparation",
      description: "Master interview techniques and practice with confidence",
      details: [
        "Practice common interview formats and questions",
        "Learn behavioral interview strategies (STAR method)",
        "Prepare for technical interview rounds",
        "Master follow-up communication templates",
      ],
      prompts: [
        "Create a behavioral question prep guide for this role",
        "What technical topics should I brush up on for this interview?",
        "Help me practice the STAR method for common questions",
        "Generate a professional follow-up email template",
      ],
    },
    {
      title: "📝 Application Strategy",
      description: "Optimize your applications for higher success rates",
      details: [
        "Learn best timing for job applications",
        "Understand ATS optimization techniques",
        "Customize cover letters for each role",
        "Track and manage multiple applications effectively",
      ],
      prompts: [
        "When should I apply to this job for maximum visibility?",
        "How do I customize my cover letter for this specific role?",
        "What are the best practices for managing multiple job applications?",
        "How can I make my application stand out to recruiters?",
      ],
    },
    {
      title: "💰 Salary Negotiation",
      description: "Negotiate confidently and maximize your compensation",
      details: [
        "Understand market rates for your role and level",
        "Learn effective negotiation tactics and phrases",
        "Evaluate comprehensive benefits packages",
        "Handle counter-offers strategically",
      ],
      prompts: [
        "What's the fair market salary for this role in my location?",
        "How should I approach salary negotiation for this offer?",
        "What benefits should I prioritize beyond base salary?",
        "How do I evaluate and counter a job offer?",
      ],
    },
    {
      title: "🤝 Networking & Connections",
      description: "Build relationships that accelerate your career growth",
      details: [
        "Find and connect with relevant professionals",
        "Conduct effective informational interviews",
        "Leverage referrals to get your foot in the door",
        "Build a strong professional network on LinkedIn",
      ],
      prompts: [
        "How can I find professionals at this company to connect with?",
        "What questions should I ask in an informational interview?",
        "How do I ask for a referral without being pushy?",
        "What's the best way to optimize my LinkedIn for recruiters?",
      ],
    },
    {
      title: "📈 Career Development",
      description: "Plan your long-term career growth and progression",
      details: [
        "Create a career development roadmap",
        "Identify key skills for career advancement",
        "Explore learning paths and certifications",
        "Align opportunities with your career goals",
      ],
      prompts: [
        "What's a realistic career progression path from this role?",
        "What skills should I develop for my next career milestone?",
        "Are there certifications that would boost my career in this field?",
        "How does this job align with my long-term career goals?",
      ],
    },
    {
      title: "🏢 Company Research",
      description: "Make informed decisions with thorough company analysis",
      details: [
        "Research company culture and values",
        "Identify red flags and warning signs",
        "Evaluate company growth and stability",
        "Assess work environment and team dynamics",
      ],
      prompts: [
        "What can you tell me about this company's culture and values?",
        "What are the red flags I should watch for at this company?",
        "Is this company financially stable and growing?",
        "What do employees say about working at this company?",
      ],
    },
    {
      title: "🔗 LinkedIn Optimization",
      description: "Build a compelling LinkedIn profile that attracts recruiters",
      details: [
        "Complete and optimize your LinkedIn profile",
        "Craft a compelling headline and summary",
        "Use keywords for recruiter search visibility",
        "Engage strategically to attract opportunities",
      ],
      prompts: [
        "How should I optimize my LinkedIn headline for this field?",
        "What keywords should I include in my LinkedIn profile?",
        "How can I make my LinkedIn summary more compelling?",
        "What engagement strategies attract recruiters on LinkedIn?",
      ],
    },
    {
      title: "🎨 Portfolio & Projects",
      description: "Showcase your best work and accomplishments effectively",
      details: [
        "Curate and present your portfolio strategically",
        "Optimize your GitHub or project repository",
        "Create compelling case study presentations",
        "Select projects that demonstrate key skills",
      ],
      prompts: [
        "What projects should I include in my portfolio for this role?",
        "How do I present my work most effectively?",
        "What makes a strong GitHub profile for recruiters?",
        "How should I structure project case studies?",
      ],
    },
    {
      title: "⭐ Personal Branding",
      description: "Build your professional reputation and stand out",
      details: [
        "Develop a consistent professional image",
        "Leverage social media strategically",
        "Pursue speaking and writing opportunities",
        "Establish thought leadership in your field",
      ],
      prompts: [
        "How can I build my personal brand in this industry?",
        "What social media presence helps my career?",
        "How do I become a thought leader in my field?",
        "What content should I create to showcase expertise?",
      ],
    },
    {
      title: "🔄 Transition & Career Change",
      description: "Successfully navigate career pivots and industry changes",
      details: [
        "Plan strategic transitions between industries",
        "Address career gaps convincingly",
        "Reframe experience for new field requirements",
        "Build credibility in new career direction",
      ],
      prompts: [
        "How do I transition from my current field to this role?",
        "How should I explain my career gap in interviews?",
        "What skills from my background transfer to this role?",
        "How can I build credibility as a career changer?",
      ],
    },
    {
      title: "💻 Remote Work Excellence",
      description: "Thrive in remote positions and distributed teams",
      details: [
        "Prepare for remote-specific interview questions",
        "Set up an effective remote work environment",
        "Master remote team communication",
        "Demonstrate productivity and accountability remotely",
      ],
      prompts: [
        "What should I emphasize for remote work positions?",
        "How do I prepare for a remote interview?",
        "What tools and setup do remote jobs expect?",
        "How can I build relationships in a remote team?",
      ],
    },
    {
      title: "🧘 Mental Health & Work-Life Balance",
      description: "Maintain well-being throughout your job search",
      details: [
        "Manage job search stress and anxiety",
        "Build resilience against rejection",
        "Establish healthy work-life boundaries",
        "Prevent burnout during career transitions",
      ],
      prompts: [
        "How do I stay motivated during a long job search?",
        "What strategies help manage rejection?",
        "How can I maintain work-life balance in this role?",
        "What red flags indicate poor work-life balance?",
      ],
    },
    {
      title: "🎁 Multiple Offer Evaluation",
      description: "Make confident decisions when comparing opportunities",
      details: [
        "Create a comprehensive offer evaluation framework",
        "Assess factors beyond base salary",
        "Evaluate growth and learning opportunities",
        "Compare company culture and values alignment",
      ],
      prompts: [
        "How should I compare these job offers?",
        "What factors matter beyond salary in job offers?",
        "How do I evaluate growth potential in each role?",
        "What questions reveal true company culture?",
      ],
    },
    {
      title: "🛠️ Skill-Specific Preparation",
      description: "Master technical and role-specific requirements",
      details: [
        "Identify role-specific technical requirements",
        "Plan certification and learning paths",
        "Learn industry-specific tools and frameworks",
        "Master domain knowledge for your field",
      ],
      prompts: [
        "What specific technical skills does this role require?",
        "Which certifications would make me most competitive?",
        "What tools should I be proficient in for this role?",
        "What industry knowledge is essential for this position?",
      ],
    },
    {
      title: "💬 Communication & Soft Skills",
      description: "Develop professional communication excellence",
      details: [
        "Master professional email communication",
        "Develop strong presentation skills",
        "Practice conflict resolution techniques",
        "Build leadership and influence capabilities",
      ],
      prompts: [
        "How can I improve my professional communication?",
        "What email etiquette is most important in this field?",
        "How do I prepare for presentation-heavy roles?",
        "What soft skills are most valued in this industry?",
      ],
    },
    {
      title: "🎯 First 90 Days Success",
      description: "Excel in your new role from day one",
      details: [
        "Create an effective onboarding strategy",
        "Build strong relationships with new team",
        "Set clear expectations and quick wins",
        "Position yourself for long-term success",
      ],
      prompts: [
        "What should my first 90 days focus be?",
        "How do I build relationships quickly in new role?",
        "What quick wins can I achieve early on?",
        "How do I prove myself in the first months?",
      ],
    },
    {
      title: "🔮 Future-Proofing Your Career",
      description: "Stay ahead of industry changes and build long-term resilience",
      details: [
        "Anticipate emerging trends in your industry",
        "Develop recession-proof and adaptable skills",
        "Build multiple expertise areas and income streams",
        "Stay informed and continuously evolve",
      ],
      prompts: [
        "What emerging trends should I prepare for in my field?",
        "Which skills will remain relevant in 5-10 years?",
        "How do I build a recession-proof career strategy?",
        "What actions can I take now to secure my future career?",
      ],
    },
  ];

  const handlePromptClick = (prompt: string) => {
    onPromptClick(prompt);
    onClose();
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-9998"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-3">
        <div className="bg-white rounded-lg shadow-lg w-[45vw] max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-300">
          {/* Header - Minimal */}
          <div className="shrink-0 px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">How Nancy Can Help</h2>
            <button
              onClick={onClose}
              type="button"
              title="Close guide"
              aria-label="Close Nancy guide"
              className="w-8 h-8 rounded-md hover:bg-gray-100 transition-all flex items-center justify-center text-gray-600 hover:text-gray-900"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Intro Section */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Nancy Quick Guide
              </h3>
              <p className="text-sm text-gray-600">
                Explore these prompt examples to discover what Nancy can help you with. Ask any question in your own words.
              </p>
            </div>

            {sections.map((section, idx) => (
              <div key={idx}>
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  {section.title}
                </h3>

                {/* Original Guidance List */}
                <div className="mb-4 space-y-2 text-sm text-gray-700">
                  {section.details.map((detail, didx) => (
                    <div key={didx} className="flex gap-2">
                      <span className="text-blue-600 flex-shrink-0">•</span>
                      <p>{detail}</p>
                    </div>
                  ))}
                </div>

                {/* Prompt Cards */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {section.prompts.map((prompt, pidx) => (
                    <PromptCard
                      key={pidx}
                      prompt={prompt}
                      onClick={handlePromptClick}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Pro Tips Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-900 mb-2">Pro Tips:</p>
              <ul className="text-xs text-gray-700 space-y-1">
                <li>• Ask Nancy specific questions about the job</li>
                <li>• Use quick actions for faster insights</li>
                <li>• Check your interview readiness before applying</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-gray-200 px-6 py-4 bg-white">
            <button
              onClick={onClose}
              type="button"
              className="w-full py-2 bg-blue-600 text-white rounded-md font-medium text-sm hover:bg-blue-700 transition-colors duration-150"
            >
              Got it, let&apos;s go
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
