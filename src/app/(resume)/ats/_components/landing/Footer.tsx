"use client";

import React from "react";
import {
  Twitter,
  Linkedin,
  Github,
  Mail,
  MapPin,
  Phone,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-black text-gray-300 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#3b82f6]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#60a5fa]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div>
              <h2 className="text-white text-2xl font-bold mb-2 flex items-center gap-2">
                <span className="bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] p-2 rounded-lg">
                  <Zap className="w-5 h-5 text-white" />
                </span>
                CareerBot
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                The world&apos;s most trusted ATS resume scanner, powered by advanced AI to help professionals optimize resumes and land their dream jobs.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <p className="text-white text-lg font-bold">100K+</p>
                <p className="text-gray-400 text-xs">Resumes Scanned</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <p className="text-white text-lg font-bold">500+</p>
                <p className="text-gray-400 text-xs">Enterprise Clients</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <p className="text-white text-lg font-bold">98%</p>
                <p className="text-gray-400 text-xs">Accuracy Rate</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <p className="text-white text-lg font-bold">24/7</p>
                <p className="text-gray-400 text-xs">Support Available</p>
              </div>
            </div>

            <div className="flex gap-3">
              <a
                href="#"
                className="bg-white/5 hover:bg-[#3b82f6] border border-white/10 p-3 rounded-xl transition-all duration-300 hover:scale-110 group"
                aria-label="Twitter"
              >
                <Twitter size={18} className="text-[#60a5fa] group-hover:text-white" />
              </a>
              <a
                href="#"
                className="bg-white/5 hover:bg-[#3b82f6] border border-white/10 p-3 rounded-xl transition-all duration-300 hover:scale-110 group"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} className="text-[#60a5fa] group-hover:text-white" />
              </a>
              <a
                href="#"
                className="bg-white/5 hover:bg-[#6366f1] border border-white/10 p-3 rounded-xl transition-all duration-300 hover:scale-110 group"
                aria-label="GitHub"
              >
                <Github size={18} className="text-[#818cf8] group-hover:text-white" />
              </a>
              <a
                href="#"
                className="bg-white/5 hover:bg-[#ef4444] border border-white/10 p-3 rounded-xl transition-all duration-300 hover:scale-110 group"
                aria-label="Email"
              >
                <Mail size={18} className="text-[#f87171] group-hover:text-white" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-white font-bold mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
              <div className="w-1 h-4 bg-[#3b82f6] rounded-full"></div>
              Product
            </h3>
            <ul className="space-y-2 text-sm">
              {["ATS Scanner", "Keyword Intelligence", "Resume Builder", "API Documentation", "Integrations"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white hover:translate-x-1 inline-flex items-center gap-2 transition-all duration-200 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-white font-bold mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
              <div className="w-1 h-4 bg-[#60a5fa] rounded-full"></div>
              Solutions
            </h3>
            <ul className="space-y-2 text-sm">
              {["For Job Seekers", "For HR Teams", "For Recruiters", "For Enterprises", "Custom Solutions"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white hover:translate-x-1 inline-flex items-center gap-2 transition-all duration-200 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-white font-bold mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
              <div className="w-1 h-4 bg-[#6366f1] rounded-full"></div>
              Resources
            </h3>
            <ul className="space-y-2 text-sm">
              {["Help Center", "Resume Guide", "ATS Best Practices", "Blog", "Webinars"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white hover:translate-x-1 inline-flex items-center gap-2 transition-all duration-200 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-white font-bold mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
              <div className="w-1 h-4 bg-[#818cf8] rounded-full"></div>
              Company
            </h3>
            <ul className="space-y-2 text-sm">
              {["About Us", "Careers", "Press Kit", "Contact", "Partners"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white hover:translate-x-1 inline-flex items-center gap-2 transition-all duration-200 group"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="py-6 border-t border-gray-700/50">
          <div className="grid md:grid-cols-3 gap-5">
            <div className="flex items-start gap-3 group cursor-pointer">
              <div className="bg-[#3b82f6]/20 p-2.5 rounded-xl group-hover:bg-[#3b82f6]/30 transition-all">
                <MapPin className="w-5 h-5 text-[#60a5fa]" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-1">Visit Us</p>
                <p className="text-gray-400 text-xs">
                  123 Innovation Street, Tech Valley, CA 94000
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 group cursor-pointer">
              <div className="bg-[#6366f1]/20 p-2.5 rounded-xl group-hover:bg-[#6366f1]/30 transition-all">
                <Mail className="w-5 h-5 text-[#818cf8]" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-1">Email Us</p>
                <p className="text-gray-400 text-xs">support@careerbot.ai</p>
              </div>
            </div>
            <div className="flex items-start gap-3 group cursor-pointer">
              <div className="bg-[#8b5cf6]/20 p-2.5 rounded-xl group-hover:bg-[#8b5cf6]/30 transition-all">
                <Phone className="w-5 h-5 text-[#a78bfa]" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-1">Call Us</p>
                <p className="text-gray-400 text-xs">+1 (555) 123-4567</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700/50 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-400 text-center md:text-left">
              © 2025 CareerBot. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-400">
              <a href="#" className="hover:text-white transition-colors flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-white transition-colors">
                GDPR Compliance
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Security
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
        <h1 className="text-[5rem] md:text-[6rem] lg:text-[7rem] font-bold bg-gradient-to-r from-gray-700/10 via-gray-600/10 to-gray-700/10 bg-clip-text text-transparent select-none animate-pulse-slow">
          CareerBot
        </h1>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.05;
          }
          50% {
            opacity: 0.15;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </footer>
  );
};

export default Footer;
