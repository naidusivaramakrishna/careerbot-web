"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiMenu, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { name: "Jobs", path: "/jobs" },
  { name: "Resume Builder", path: "/resume-builder" },
  { name: "ATS Scanner", path: "/ats-scanner" },
  { name: "Career Tools", path: "/career-tools" },
];

const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
  }, [menuOpen]);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        scrolled ? "shadow-sm border-b border-neutral-200" : ""
      }`}
      style={{ background: "var(--neutral-50)" }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/robot.png"
              alt="CareerBot Logo"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <span className="text-2xl font-bold text-neutral-900">
              Career<span className="text-orange-500">Bot</span>
            </span>
          </Link>
        </motion.div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex justify-center flex-1">
          <ul className="flex gap-8 text-sm font-semibold text-neutral-900 uppercase tracking-wide">
            {NAV_LINKS.map((link) => (
              <li key={link.name} className="flex items-center">
                <Link
                  href={link.path}
                  className="transition-colors hover:text-orange-500"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Side Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/signin"
            className="px-5 py-2 border border-neutral-900 text-neutral-900 rounded-full font-medium hover:bg-neutral-100 transition-all text-sm"
          >
            Sign In
          </Link>
          <Link
            href="/get-started"
            className="px-6 py-2 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-all text-sm"
          >
            Get Started Free
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <div className="md:hidden">
          <button
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="text-3xl text-neutral-900"
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed top-0 left-0 w-full h-full bg-neutral-50 z-40 flex flex-col pt-20 px-8 gap-6"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className="text-lg font-semibold text-neutral-900 border-b border-neutral-200 pb-2 hover:text-orange-500"
                onClick={() => setMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="mt-6 flex flex-col gap-4">
              <Link
                href="/signin"
                className="px-5 py-3 border border-neutral-900 text-neutral-900 rounded-full font-medium text-center hover:bg-neutral-100"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/get-started"
                className="px-6 py-3 bg-orange-500 text-white rounded-full font-semibold text-center hover:bg-orange-600"
                onClick={() => setMenuOpen(false)}
              >
                Get Started Free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Nav;
