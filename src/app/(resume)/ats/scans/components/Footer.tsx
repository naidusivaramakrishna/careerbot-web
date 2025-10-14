"use client";

import React from "react";
import { Twitter, Linkedin, Github } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#0f1117] text-gray-300 pt-10 pb-6 relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-2 space-y-3">
            <h2 className="text-white text-lg font-bold">CareerBot</h2>
            <p className="text-gray-400 text-xs leading-relaxed">
              The world&apos;s most trusted ATS resume scanner, helping
              professionals optimize their resumes for applicant tracking
              systems worldwide.
            </p>

            <div className="flex gap-6 mt-4">
              <div>
                <p className="text-white text-base font-semibold">100K+</p>
                <p className="text-gray-400 text-xs">Resumes Scanned</p>
              </div>
              <div>
                <p className="text-white text-base font-semibold">500+</p>
                <p className="text-gray-400 text-xs">Enterprise Clients</p>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex gap-4 mt-4">
              <a href="#" className="hover:text-white transition">
                <Twitter size={18} />
              </a>
              <a href="#" className="hover:text-white transition">
                <Linkedin size={18} />
              </a>
              <a href="#" className="hover:text-white transition">
                <Github size={18} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">Product</h3>
            <ul className="space-y-1 text-xs">
              <li><a href="#" className="hover:text-white">ATS Scanner</a></li>
              <li><a href="#" className="hover:text-white">Keyword Intelligence</a></li>
              <li><a href="#" className="hover:text-white">Resume Builder</a></li>
              <li><a href="#" className="hover:text-white">API Documentation</a></li>
              <li><a href="#" className="hover:text-white">Integrations</a></li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">Solutions</h3>
            <ul className="space-y-1 text-xs">
              <li><a href="#" className="hover:text-white">For Job Seekers</a></li>
              <li><a href="#" className="hover:text-white">For HR Teams</a></li>
              <li><a href="#" className="hover:text-white">For Recruiters</a></li>
              <li><a href="#" className="hover:text-white">For Enterprises</a></li>
              <li><a href="#" className="hover:text-white">Custom Solutions</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">Resources</h3>
            <ul className="space-y-1 text-xs">
              <li><a href="#" className="hover:text-white">Help Center</a></li>
              <li><a href="#" className="hover:text-white">Resume Guide</a></li>
              <li><a href="#" className="hover:text-white">ATS Best Practices</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Webinars</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">Company</h3>
            <ul className="space-y-1 text-xs">
              <li><a href="#" className="hover:text-white">About Us</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
              <li><a href="#" className="hover:text-white">Press Kit</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
              <li><a href="#" className="hover:text-white">Partners</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">Legal</h3>
            <ul className="space-y-1 text-xs">
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white">GDPR Compliance</a></li>
              <li><a href="#" className="hover:text-white">Security</a></li>
              <li><a href="#" className="hover:text-white">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700 mt-8 pt-4 flex justify-center text-xs text-gray-400">
          © 2024 CareerBot. All rights reserved.
        </div>
      </div>

      {/* Watermark */}
      <h1 className="absolute bottom-0 left-0 right-0 text-[8rem] font-bold text-gray-800 opacity-10 text-center select-none">
        CareerBot
      </h1>
    </footer>
  );
};

export default Footer;