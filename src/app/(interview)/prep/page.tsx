"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, Briefcase, ChevronRight, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function InterviewPrepHub() {
  const router = useRouter();

  const options = [
    {
      id: "communication-assessment",
      title: "Communication Assessment",
      description: "Practice communication skills with AI-powered exercises and get real-time feedback.",
      icon: MessageSquare,
      href: "/communication",
      gradient: "linear-gradient(135deg, #72b880, #5ca189, #3c8d8f)",
      badge: "Recommended",
    },
    {
      id: "mock-interview",
      title: "Mock Interview",
      description: "Participate in AI-powered mock interviews and receive comprehensive performance analysis.",
      icon: Briefcase,
      href: "/mock",
      gradient: "linear-gradient(135deg, #72b880, #5ca189, #3c8d8f)",
      badge: "Advanced",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header with back button */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="mb-3">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Interview Prep
            </h1>
            <p className="text-gray-600 text-lg">
              Choose your interview preparation method and start practicing today.
            </p>
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <Link
                key={option.id}
                href={option.href}
                className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                {/* Background gradient accent */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
                  style={{ background: option.gradient }}
                />

                {/* Top accent bar */}
                <div
                  className="h-1 w-full"
                  style={{ background: option.gradient }}
                />

                {/* Content */}
                <div className="relative p-6 flex flex-col h-full">
                  {/* Badge */}
                  <div className="mb-4 flex items-start justify-between">
                    <div
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
                      style={{
                        background: "rgba(114, 184, 128, 0.1)",
                        color: "#72b880",
                      }}
                    >
                      <span>✓</span>
                      {option.badge}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="mb-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center shadow-sm mb-3"
                      style={{ background: option.gradient }}
                    >
                      <Icon size={24} className="text-white" />
                    </div>
                  </div>

                  {/* Title and Description */}
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {option.title}
                    </h2>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      {option.description}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-2 text-sm font-semibold text-white pt-4 border-t border-gray-100 group-hover:gap-3 transition-all">
                    <span>Get Started</span>
                    <ChevronRight
                      size={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </div>

                  {/* Gradient CTA background */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-12 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                    style={{ background: option.gradient }}
                  />
                </div>

                {/* Hover glow effect */}
                <div
                  className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"
                  style={{ background: option.gradient }}
                />
              </Link>
            );
          })}
        </div>

        {/* Info section */}
        <div className="mt-12 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-3">Which option is right for you?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <MessageSquare size={16} className="text-[#72b880]" />
                Communication Assessment
              </h4>
              <p className="text-sm text-gray-600">
                Best for improving your communication skills, pronunciation, and confidence. Perfect for practicing specific communication scenarios and receiving targeted feedback.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Briefcase size={16} className="text-[#72b880]" />
                Mock Interview
              </h4>
              <p className="text-sm text-gray-600">
                Best for full interview practice with realistic questions and scenarios. Get comprehensive analysis of your performance including technical and behavioral aspects.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
