"use client";

import { useEffect, useState, type ReactElement } from "react";
import {
  EnterpriseApplicationTrackerIcon,
  EnterpriseAtsScanIcon,
  EnterpriseCommunicationIcon,
  EnterpriseCoverLetterIcon,
  EnterpriseInterviewPrepIcon,
  EnterpriseJobMatchIcon,
  EnterpriseJobsIcon,
  EnterpriseNotesIcon,
  EnterpriseResumeIcon,
  type EnterpriseIconProps,
  type EnterpriseNavIcon,
} from "./EnterpriseNavIcons";

/* Fallbacks: the icon each nav item used before the SVG artwork. One is shown when its file is
   missing or fails to load, so a nav button is never blank. They use currentColor. */
const MockTestFallback = ({ size = 18, className = "", sw = 1.6 }: EnterpriseIconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="4" y="3" width="12" height="15" rx="1.5" stroke="currentColor" strokeWidth={sw} />
    <path d="M7.5 3.5V2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v1" stroke="currentColor" strokeWidth={sw} />
    <path d="M7 8h6M7 11.5h6M7 15h3.5" stroke="currentColor" strokeWidth={sw * 0.85} />
  </svg>
);

const CodingFallback = ({ size = 18, className = "", sw = 1.6 }: EnterpriseIconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="1.5" y="3" width="17" height="12.5" rx="1.5" stroke="currentColor" strokeWidth={sw} />
    <path d="M6 8.5L4 10L6 11.5" stroke="currentColor" strokeWidth={sw * 0.9} />
    <path d="M9 8.5L11 10L9 11.5" stroke="currentColor" strokeWidth={sw * 0.9} />
    <path d="M12.5 11.5H14.5" stroke="currentColor" strokeWidth={sw * 0.9} />
    <path d="M10 15.5V17.5" stroke="currentColor" strokeWidth={sw} />
    <path d="M7 17.5H13" stroke="currentColor" strokeWidth={sw} />
  </svg>
);

const TemplatesFallback = ({ size = 18, className = "", sw = 1.6 }: EnterpriseIconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="16" height="16" rx="1.5" stroke="currentColor" strokeWidth={sw} />
    <path d="M2 6h16" stroke="currentColor" strokeWidth={sw} />
    <path d="M6 6v12" stroke="currentColor" strokeWidth={sw} />
    <rect x="7" y="7" width="10" height="2" rx="0.5" stroke="currentColor" strokeWidth={sw * 0.8} />
    <rect x="7" y="10" width="10" height="2" rx="0.5" stroke="currentColor" strokeWidth={sw * 0.8} />
    <rect x="7" y="13" width="7" height="2" rx="0.5" stroke="currentColor" strokeWidth={sw * 0.8} />
  </svg>
);

/**
 * Sidebar icons backed by the SVG files in /public/icons/sidebar.
 * The artwork carries its own colours and is shown unchanged in every state
 * (including the active, light-blue highlighted one).
 * Previous icons are kept in ./_backup for reference.
 */
const createSidebarIcon = (file: string, label: string, Fallback: EnterpriseNavIcon) => {
  const SidebarIcon = ({ size = 18, className = "", sw }: EnterpriseIconProps): ReactElement => {
    const src = `/icons/sidebar/${file}.svg`;
    const [failed, setFailed] = useState(false);
    // A server-rendered <img> can fail before hydration, when its onError is not attached yet,
    // so check the file once more after mount.
    useEffect(() => {
      let active = true;
      const probe = new window.Image();
      probe.onerror = () => { if (active) setFailed(true); };
      probe.src = src;
      return () => { active = false; probe.onerror = null; };
    }, [src]);
    if (failed) return <Fallback size={size} className={`shrink-0 ${className}`} sw={sw} />;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        aria-hidden="true"
        width={size + 4}
        height={size + 4}
        draggable={false}
        className={`object-contain shrink-0 ${className}`}
        style={{ width: size + 4, height: size + 4 }}
        onError={() => setFailed(true)}
      />
    );
  };
  SidebarIcon.displayName = `SidebarIcon(${label})`;
  return SidebarIcon;
};

export const SidebarResumeIcon = createSidebarIcon("resume-builder", "Resume", EnterpriseResumeIcon);
export const SidebarAtsScanIcon = createSidebarIcon("ats-scan", "ATS Scan", EnterpriseAtsScanIcon);
export const SidebarTemplatesIcon = createSidebarIcon("templates", "Templates", TemplatesFallback);
export const SidebarJobMatchIcon = createSidebarIcon("job-match", "Job Match", EnterpriseJobMatchIcon);
export const SidebarJobsIcon = createSidebarIcon("jobs", "Jobs", EnterpriseJobsIcon);
export const SidebarTrackerIcon = createSidebarIcon("track-application", "Track Applications", EnterpriseApplicationTrackerIcon);
export const SidebarCoverLetterIcon = createSidebarIcon("cover-letter", "Cover Letter", EnterpriseCoverLetterIcon);
export const SidebarNotesIcon = createSidebarIcon("interview-notes", "Interview Notes", EnterpriseNotesIcon);
export const SidebarMockInterviewIcon = createSidebarIcon("mock-interview", "Mock Interview", EnterpriseInterviewPrepIcon);
export const SidebarCommunicationIcon = createSidebarIcon("communication", "Communication", EnterpriseCommunicationIcon);
export const SidebarMockTestIcon = createSidebarIcon("mock-test", "Mock Test", MockTestFallback);
export const SidebarCodingIcon = createSidebarIcon("coding-practice", "Coding Practice", CodingFallback);
