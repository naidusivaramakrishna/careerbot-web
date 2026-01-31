"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiMenu, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { name: "Home", path: "/" },
  { name: "Resume Builder", path: "/resume-builder" },
  { name: "Resume Enhancer", path: "/resume-enhancer" },
  { name: "ATS Scan", path: "/ats-scan" },
  { name: "JD Match", path: "/jd-match" },
];

const Nav = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  return (
    <nav className="fixed top-0 left-0 w-full z-[9999] bg-white transition-all duration-500">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
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
            <span className="text-2xl font-bold text-gray-900">
              Career<span className="text-gray-900">Bot</span>
            </span>
          </Link>
        </motion.div>

        <div className="hidden md:flex justify-center flex-1">
          <ul className="flex gap-8 text-sm font-semibold text-gray-700 uppercase tracking-wide">
            {NAV_LINKS.map((link) => (
              <li key={link.name} className="flex items-center">
                <Link
                  href={link.path}
                  className="transition-colors hover:text-gray-900"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/signin"
            className="px-5 py-2 border border-gray-900 text-gray-900 rounded-md font-medium hover:bg-gray-50 transition-all text-sm"
          >
            Sign In
          </Link>
          <Link
            href="/get-started"
            className="px-6 py-2 bg-[#0275dd] text-white rounded-md font-semibold hover:bg-[#0261b8] transition-all text-sm"
          >
            Get Started Free
          </Link>
        </div>

        <div className="md:hidden">
          <button
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="text-3xl text-gray-900"
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed top-0 left-0 w-full h-full bg-white z-[9998] flex flex-col pt-20 px-8 gap-6"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 hover:text-gray-600"
                onClick={() => setMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}

            <div className="mt-6 flex flex-col gap-4">
              <Link
                href="/signin"
                className="px-5 py-3 border border-gray-900 text-gray-900 rounded-md font-medium text-center hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/get-started"
                className="px-6 py-3 bg-[#0275dd] text-white rounded-md font-semibold text-center hover:bg-[#0261b8]"
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
