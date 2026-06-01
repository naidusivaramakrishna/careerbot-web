"use client";

import React from "react";
import { Twitter, Linkedin, Github, Mail, Sparkles } from "lucide-react";
import Link from "next/link";

const links = {
  Product: [
    { label: "ATS Resume Checker", href: "/ats" },
    { label: "Resume Builder",     href: "/resume/builder" },
    { label: "Job Match",          href: "/jobmatch/app" },
    { label: "Interview Prep",     href: "/interview" },
    { label: "Career Insights",    href: "/insights" },
  ],
  Company: [
    { label: "About Us",    href: "#" },
    { label: "Blog",        href: "#" },
    { label: "Careers",     href: "#" },
    { label: "Contact",     href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy",    href: "#" },
    { label: "Terms of Service",  href: "#" },
    { label: "Cookie Policy",     href: "#" },
  ],
};

const socials = [
  { icon: Twitter,  href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Github,   href: "#", label: "GitHub" },
  { icon: Mail,     href: "#", label: "Email" },
];

const Footer = () => {
  return (
    <footer style={{ background: "#0f1c3f", color: "rgba(255,255,255,0.65)" }}>

      {/* ── Main footer body ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10">

          {/* Brand column */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: "linear-gradient(135deg,#2557a7,#1a3a8f)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles style={{ width: 16, height: 16, color: "#FFC85E" }} />
              </div>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
                CareerBot
              </span>
            </div>

            <p style={{ fontSize: 13.5, lineHeight: 1.7, maxWidth: 280, color: "rgba(255,255,255,0.45)" }}>
              AI-powered career tools to help you land more interviews — ATS checker, resume builder,
              job matching, and interview prep.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3 mt-1">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#2557a7")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                >
                  <Icon style={{ width: 15, height: 15, color: "rgba(255,255,255,0.6)" }} />
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(links).map(([heading, items]) => (
            <div key={heading}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
                {heading}
              </p>
              <ul className="flex flex-col gap-3">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)", transition: "color 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: "16px 0",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            © {new Date().getFullYear()} CareerBot. All rights reserved.
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
            Built with ❤️ to help job seekers land better opportunities.
          </p>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
