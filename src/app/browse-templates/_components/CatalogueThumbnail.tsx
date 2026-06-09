"use client"
import React from "react"
import Image from "next/image"
import { STYLE_CATALOGUES } from "@/app/(resume)/builder/creation/_utils/templateStyles"

export const ECLIPSE_DEFAULT_SECTION_BG = '#ececec'

// Palette of section-header background colours shown below the Eclipse card.
export const ECLIPSE_PALETTE = [
  '#ececec', // neutral gray (default)
  '#fde2e2', // soft pink
  '#dbeafe', // soft blue
  '#dcfce7', // soft green
  '#fed7aa', // soft peach
]

export const CRIMSON_DEFAULT_ACCENT = '#0f172a'

// Palette of accent colours shown below the Crimson card (applied to name, divider, section titles).
export const CRIMSON_PALETTE = [
  '#1a1a1a', // black
  '#dc2626', // red
  '#e11d48', // rose
  '#db2777', // pink
  '#9333ea', // purple
  '#f97316', // orange
]

export const GALAXY_DEFAULT_ACCENT = '#0f172a'

// Palette of accent colours shown below the Galaxy card (applied to name + section titles).
export const GALAXY_PALETTE = [
  '#1a1a1a', // black
  '#1d4ed8', // blue
  '#4f46e5', // indigo
  '#7c3aed', // violet
  '#0369a1', // sky blue
  '#6366f1', // periwinkle
]

export const FOREST_DEFAULT_ACCENT = '#0f172a'

// Palette of accent colours shown below the Forest card
// (applied to name, section titles, experience role, and education institution/degree line).
export const FOREST_PALETTE = [
  '#1a1a1a', // black
  '#16a34a', // green
  '#0d9488', // teal
  '#059669', // emerald
  '#166534', // dark green
  '#0891b2', // cyan
]

export const SLATE_DEFAULT_ACCENT = '#0f172a'

// Palette of accent colours shown below the Slate card
// (applied to name, section titles, and the main divider below the header).
export const SLATE_PALETTE = [
  '#1a1a1a', // black
  '#475569', // slate
  '#334155', // dark slate
  '#374151', // gray
  '#4f46e5', // indigo
  '#0369a1', // blue
]

export const PILLAR_DEFAULT_ACCENT = '#0f172a'

// Palette of accent colours shown below the Pillar card
// (applied to name, left bar, section titles, experience role, education degree).
export const PILLAR_PALETTE = [
  '#1a1a1a', // black
  '#1d4ed8', // blue
  '#7c3aed', // purple
  '#16a34a', // green
  '#dc2626', // red
  '#0369a1', // sky
]

export const AMBER_DEFAULT_ACCENT = '#0f172a'
export const AMBER_PALETTE = [
  '#1a1a1a', // black
  '#b45309', // amber
  '#d97706', // yellow-orange
  '#ea580c', // orange
  '#c2410c', // dark orange
  '#92400e', // dark amber
]

export const OCEAN_DEFAULT_ACCENT = '#0f172a'
export const OCEAN_PALETTE = [
  '#1a1a1a', // black
  '#0369a1', // blue
  '#0891b2', // sky
  '#0e7490', // dark cyan
  '#2563eb', // bright blue
  '#0d9488', // teal
]

export const AETHER_DEFAULT_ACCENT = '#0f172a'
export const AETHER_PALETTE = [
  '#1a1a1a', // black
  '#475569', // slate
  '#374151', // gray
  '#1e293b', // dark slate
  '#4f46e5', // indigo
  '#0369a1', // blue
]

export const EMBER_DEFAULT_ACCENT = '#0f172a'
export const EMBER_PALETTE = [
  '#1a1a1a', // black
  '#ea580c', // orange
  '#dc2626', // red
  '#d97706', // amber
  '#b45309', // dark amber
  '#c2410c', // dark orange
]

// Per-catalogue palette + default colour, for catalogues with code-rendered thumbnails.
export const CATALOGUE_PALETTES: Record<string, { palette: string[]; defaultColor: string }> = {
  eclipse: { palette: ECLIPSE_PALETTE, defaultColor: ECLIPSE_DEFAULT_SECTION_BG },
  crimson: { palette: CRIMSON_PALETTE, defaultColor: CRIMSON_DEFAULT_ACCENT },
  galaxy: { palette: GALAXY_PALETTE, defaultColor: GALAXY_DEFAULT_ACCENT },
  forest: { palette: FOREST_PALETTE, defaultColor: FOREST_DEFAULT_ACCENT },
  slate: { palette: SLATE_PALETTE, defaultColor: SLATE_DEFAULT_ACCENT },
  pillar: { palette: PILLAR_PALETTE, defaultColor: PILLAR_DEFAULT_ACCENT },
  amber: { palette: AMBER_PALETTE, defaultColor: AMBER_DEFAULT_ACCENT },
  ocean: { palette: OCEAN_PALETTE, defaultColor: OCEAN_DEFAULT_ACCENT },
  aether: { palette: AETHER_PALETTE, defaultColor: AETHER_DEFAULT_ACCENT },
  ember: { palette: EMBER_PALETTE, defaultColor: EMBER_DEFAULT_ACCENT },
}

// Catalogues that have a code-rendered thumbnail (so hover-preview works on them).
export const CODE_THUMBNAIL_CATALOGUES = new Set([
  'eclipse', 'crimson', 'galaxy', 'forest', 'slate', 'pillar',
  'amber', 'ocean', 'aether', 'ember',
])

interface Props {
  catalogueKey: string
  fallbackImage?: string
  customColor?: string
}

export default function CatalogueThumbnail({ catalogueKey, fallbackImage, customColor }: Props) {
  if (catalogueKey === 'eclipse') return <EclipseThumbnail sectionBgColor={customColor} />
  if (catalogueKey === 'crimson') return <CrimsonThumbnail accentColor={customColor} />
  if (catalogueKey === 'galaxy') return <GalaxyThumbnail accentColor={customColor} />
  if (catalogueKey === 'forest') return <ForestThumbnail accentColor={customColor} />
  if (catalogueKey === 'slate') return <SlateThumbnail accentColor={customColor} />
  if (catalogueKey === 'pillar') return <PillarThumbnail accentColor={customColor} />
  if (catalogueKey === 'amber') return <AmberThumbnail accentColor={customColor} />
  if (catalogueKey === 'ocean') return <OceanThumbnail accentColor={customColor} />
  if (catalogueKey === 'aether') return <AetherThumbnail accentColor={customColor} />
  if (catalogueKey === 'ember') return <EmberThumbnail accentColor={customColor} />

  // Other catalogues — fall back to image preview until each has its own code thumbnail.
  const catalogue = STYLE_CATALOGUES[catalogueKey]
  return (
    <Image
      src={catalogue?.preview_url || fallbackImage || '/assets/templates/template-1.png'}
      alt={catalogue?.label || 'Template'}
      fill
      className="object-contain"
    />
  )
}

// ─── Eclipse ─────────────────────────────────────────────────────────────────

const COLOR_TEXT = '#1f2937'
const COLOR_NAME = '#0f172a'
const COLOR_DIVIDER = '#cbd5e1'

function EclipseThumbnail({ sectionBgColor }: { sectionBgColor?: string }) {
  const sectionBg = sectionBgColor || ECLIPSE_DEFAULT_SECTION_BG
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        padding: '16px 18px',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: COLOR_TEXT,
        fontSize: '5.5px',
        lineHeight: 1.4,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: '15px',
            fontWeight: 'bold',
            color: COLOR_NAME,
            marginBottom: '2px',
          }}
        >
          Howard Jones
        </div>
        <div style={{ fontSize: '6px', marginBottom: '4px' }}>San Francisco, CA</div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '9px',
            fontSize: '6px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          <span style={{ fontWeight: 600 }}>howard.jones@gmail.com</span>
          <span>+1 (415) 555-2671</span>
          <span>linkedin.com/in/hjones</span>
          <span>github.com/hjones</span>
        </div>
      </div>

      <div style={{ borderTop: `0.5px solid ${COLOR_DIVIDER}`, margin: '5px 0' }} />

      <Section title="SUMMARY" bg={sectionBg}>
        <p style={{ fontSize: '5.5px', textAlign: 'justify', margin: '2px 0 0', lineHeight: 1.45 }}>
          Experienced and innovative Lawyer with a passion and dedication to justice. Highly organized and skilled in public speaking, with a proven track record of achieving favourable outcomes for clients. Adept in preparing for trials, reviewing documents, and effectively presenting cases in court. A strong leader who works well under pressure and understands the complexities of the legal system.
        </p>
      </Section>

      <Section title="SKILLS" bg={sectionBg}>
        <SkillRow label="Practice Areas" value="Family Law, Immigration Law, Criminal Defense" />
        <SkillRow label="Compliance" value="Regulatory Compliance, Contract Negotiation" />
        <SkillRow label="Communication" value="Mediation, Negotiation, Public Speaking" />
        <SkillRow label="Documentation" value="Legal Briefs, Case Filings, Affidavits" />
        <SkillRow label="Research" value="Case Law, Statutory Analysis, LexisNexis" />
        <SkillRow label="Litigation" value="Trial Preparation, Depositions, Cross-Examination" />
        <SkillRow label="Soft Skills" value="Leadership, Time Management, Critical Thinking" />
      </Section>

      <Section title="EXPERIENCE" bg={sectionBg}>
        <ExpEntry
          title="Lawyer, Madison and Fletcher Attorneys at Law"
          date="Dec 2010 — Aug 2018"
          location="Madison and Fletcher | San Francisco"
          items={[
            'Performed legal research to ensure a deep understanding of cases.',
            'Prepared legal documents without error and in a timely manner.',
            'Filed briefings, collected evidence, and presented cases to judges.',
            'Built and fostered trusting relationships with clients.',
          ]}
        />
        <ExpEntry
          title="Lawyer, Johnson & Levine, LLC"
          date="Sep 2006 — Oct 2010"
          location="Johnson & Levine | Los Angeles"
          items={[
            'Worked with clients to understand their circumstances and needs.',
            'Mediated disputes and counselled clients on the law and legal options.',
            'Represented clients in criminal and civil court proceedings.',
            'Maintained the integrity and confidentiality of all cases.',
          ]}
        />
      </Section>

      <Section title="EDUCATION" bg={sectionBg}>
        <EduEntry school="New York Law School" date="Aug 2003 — May 2006" degree="Juris, Doctor" />
        <EduEntry school="New York University" date="Aug 1999 — May 2003" degree="Juris, Bachelor of Economics" />
      </Section>
    </div>
  )
}

function Section({ title, children, bg }: { title: string; children: React.ReactNode; bg: string }) {
  return (
    <>
      <div
        style={{
          backgroundColor: bg,
          textAlign: 'center',
          padding: '3px 0',
          margin: '5px 0 4px',
          fontSize: '9px',
          fontWeight: 'bold',
          letterSpacing: '0.12em',
          color: COLOR_TEXT,
        }}
      >
        {title}
      </div>
      <div>{children}</div>
    </>
  )
}

function SkillRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ fontSize: '5.5px', marginBottom: '1.5px', lineHeight: 1.45 }}>
      <span style={{ fontWeight: 'bold' }}>{label}:</span>
      <span style={{ marginLeft: '3px' }}>{value}</span>
    </div>
  )
}

function ExpEntry({
  title,
  date,
  location,
  items,
}: {
  title: string
  date: string
  location: string
  items: string[]
}) {
  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '5px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '7px', color: COLOR_NAME }}>{title}</span>
        <span style={{ fontSize: '5.5px', whiteSpace: 'nowrap', flexShrink: 0 }}>{date}</span>
      </div>
      <div style={{ fontSize: '5.5px', marginTop: '1.5px' }}>{location}</div>
      <ul style={{ margin: '2px 0 0', padding: 0, listStyle: 'none' }}>
        {items.map((item, idx) => (
          <li
            key={idx}
            style={{
              fontSize: '5.5px',
              marginBottom: '0.5px',
              paddingLeft: '7px',
              textIndent: '-5px',
              lineHeight: 1.4,
            }}
          >
            • {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function EduEntry({ school, date, degree }: { school: string; date: string; degree: string }) {
  return (
    <div style={{ marginBottom: '3px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '5px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '7px', color: COLOR_NAME }}>{school}</span>
        <span style={{ fontSize: '5.5px', whiteSpace: 'nowrap', flexShrink: 0 }}>{date}</span>
      </div>
      <div style={{ fontSize: '5.5px', fontStyle: 'italic', marginTop: '1px' }}>{degree}</div>
    </div>
  )
}

// ─── Crimson ─────────────────────────────────────────────────────────────────

function CrimsonThumbnail({ accentColor }: { accentColor?: string }) {
  const accent = accentColor || CRIMSON_DEFAULT_ACCENT
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        padding: '16px 18px',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: COLOR_TEXT,
        fontSize: '5.5px',
        lineHeight: 1.4,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: '15px',
            fontWeight: 'bold',
            color: accent,
            marginBottom: '2px',
          }}
        >
          Jessie Smith
        </div>
        <div style={{ fontSize: '7px', fontWeight: 'bold', marginBottom: '3px' }}>
          Human Resource Manager
        </div>
        <div style={{ borderTop: `3px solid ${accent}`, margin: '4px 0' }} />
        <div style={{ fontSize: '6px', marginTop: '4px' }}>
          New York, USA, 4759 Sunnydale Lane, Plano, TX 75071, United States
          {'  •  '}
          (469) 385-2948
          {'  •  '}
          email@youremail.com
        </div>
      </div>

      <CrimsonSection title="Summary" accent={accent}>
        <p style={{ fontSize: '5.5px', textAlign: 'justify', margin: 0, lineHeight: 1.45 }}>
          Human resources generalist with 8 years of experience in HR, including hiring and terminating, disciplining employees, and helping department managers improve employee performance. Worked with labor unions to negotiate compensation packages for workers. Organized new hire training initiatives as well as ongoing training to adhere to workplace safety standards. Worked with OSHA to ensure that all safety regulations are followed.
        </p>
      </CrimsonSection>

      <CrimsonSection title="Experience" accent={accent}>
        <CrimsonExpEntry
          title="Human Resource Manager"
          date="Apr 2019 - Current"
          company="Jim's Widget Factory, Plano, TX"
          items={[
            'Implement effective company policies to ensure all practices comply with labor regulations.',
            'Increased employee retention rates by managing workplace satisfaction to a 90% success rate.',
            'Develop targeted outreach practices to increase minority recruitment and ensure compliance.',
          ]}
        />
        <CrimsonExpEntry
          title="Workplace Culture & Compliance Specialist"
          date="Sep 2016 - Mar 2019"
          company="Acme Corp, Dallas, TX"
          items={[
            'Ensured HR policies aligned with state and federal regulations, maintaining 100% compliance.',
            'Implemented a conflict resolution system, decreasing workplace disputes by 40%.',
            'Organized leadership training sessions to enhance managerial effectiveness.',
          ]}
        />
        <CrimsonExpEntry
          title="Talent Acquisition & Retention Lead"
          date="Jan 2012 - Dec 2015"
          company="Jim's Widget Factory, Plano, TX"
          items={[
            'Developed and implemented company-wide HR policies to ensure compliance with labor laws.',
            'Spearheaded initiatives to boost employee satisfaction, resulting in a 90% retention rate.',
            'Led diversity and inclusion programs, increasing minority recruitment by 30%.',
          ]}
        />
      </CrimsonSection>

      <CrimsonSection title="Education" accent={accent}>
        <CrimsonEduEntry
          degree="Master, Human Resources"
          date="Sep 2007 - May 2011"
          school="The University of Texas, Dallas"
        />
      </CrimsonSection>

      <CrimsonSection title="Skills" accent={accent}>
        <SkillRow label="HR Operations" value="Hiring, Termination, Performance Management" />
        <SkillRow label="Compliance" value="Labor Laws, OSHA, Employment Regulations" />
        <SkillRow label="People Strategy" value="Diversity, Inclusion, Talent Acquisition" />
        <SkillRow label="Training" value="Onboarding, Leadership Development, Mentoring" />
        <SkillRow label="Soft Skills" value="Leadership, Communication, Analytical Thinking" />
      </CrimsonSection>
    </div>
  )
}

function CrimsonSection({ title, children, accent }: { title: string; children: React.ReactNode; accent: string }) {
  return (
    <div style={{ marginTop: '6px' }}>
      <div
        style={{
          fontSize: '9px',
          fontWeight: 'bold',
          color: accent,
          marginBottom: '3px',
          paddingBottom: '1.5px',
          borderBottom: `0.5px solid ${COLOR_DIVIDER}`,
        }}
      >
        {title}
      </div>
      <div>{children}</div>
    </div>
  )
}

function CrimsonExpEntry({
  title,
  date,
  company,
  items,
}: {
  title: string
  date: string
  company: string
  items: string[]
}) {
  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{ fontSize: '7px', fontWeight: 'bold' }}>{title}, <span style={{ fontWeight: 'normal' }}>{date}</span></div>
      <div style={{ fontSize: '6.5px', fontWeight: 'bold', marginTop: '1px' }}>{company}</div>
      <ul style={{ margin: '2px 0 0', padding: 0, listStyle: 'none' }}>
        {items.map((item, idx) => (
          <li
            key={idx}
            style={{
              fontSize: '5.5px',
              marginBottom: '0.5px',
              paddingLeft: '7px',
              textIndent: '-5px',
              lineHeight: 1.4,
            }}
          >
            • {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function CrimsonEduEntry({ degree, date, school }: { degree: string; date: string; school: string }) {
  return (
    <div style={{ marginBottom: '3px' }}>
      <div style={{ fontSize: '7px', fontWeight: 'bold' }}>{degree}, <span style={{ fontWeight: 'normal' }}>{date}</span></div>
      <div style={{ fontSize: '6.5px', marginTop: '1px' }}>{school}</div>
    </div>
  )
}

// ─── Galaxy ──────────────────────────────────────────────────────────────────

function GalaxyThumbnail({ accentColor }: { accentColor?: string }) {
  const accent = accentColor || GALAXY_DEFAULT_ACCENT
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        padding: '16px 18px',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: COLOR_TEXT,
        fontSize: '5.5px',
        lineHeight: 1.4,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: '15px',
            fontWeight: 'bold',
            color: accent,
            letterSpacing: '0.05em',
            marginBottom: '3px',
          }}
        >
          ANANYA NAIR
        </div>
        <div style={{ fontSize: '6px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          Hyderabad, India | ananyanair@gmail.com | +91 9875463201 | linkedin.com/in/ananyanair | github.com/ananyanair
        </div>
      </div>

      <GalaxySection title="PROFESSIONAL SUMMARY" accent={accent}>
        <p style={{ fontSize: '5.5px', textAlign: 'justify', margin: 0, lineHeight: 1.45 }}>
          Software Engineer with 2 years of experience building full-stack web applications using modern technologies. Proven expertise in MERN stack development with strong focus on clean code and user experience. Successfully delivered production applications impacting 10K+ users. Passionate about continuous learning and contributing to collaborative engineering teams.
        </p>
      </GalaxySection>

      <GalaxySection title="SKILLS" accent={accent}>
        <SkillRow label="Programming Languages" value="Java, Python, JavaScript" />
        <SkillRow label="Web Technologies" value="HTML, CSS, TypeScript" />
        <SkillRow label="Frameworks" value="React.js, Node.js, Express.js" />
        <SkillRow label="Database" value="MongoDB, MySQL, PostgreSQL, Firebase" />
        <SkillRow label="Testing" value="Jest, React Testing Library, Postman, Manual Testing" />
        <SkillRow label="Tools & DevOps" value="Git, GitHub, VS Code, Jira, Docker basics" />
      </GalaxySection>

      <GalaxySection title="PROFESSIONAL EXPERIENCE" accent={accent}>
        <GalaxyExpEntry
          company="TCS (Tata Consultancy Services)"
          location="Hyderabad, India"
          role="Junior Software Engineer"
          date="Jan 2023 – Present"
          stack="MongoDB, Express, React, Node.js"
          items={[
            'Developed full-stack food ordering web application using MERN stack serving 10K+ users with 95%+ uptime.',
            'Implemented secure JWT-based authentication with role-based access control, improving security compliance by 40%.',
            'Integrated MongoDB for efficient menu and order management, optimizing query performance by 30%.',
            'Built responsive UI using React and Tailwind, achieving 98% Lighthouse score and <2s page load time.',
            'Deployed application on AWS EC2 with automated CI/CD pipeline using GitHub Actions, reducing deploy time by 80%.',
          ]}
        />
      </GalaxySection>

      <GalaxySection title="EDUCATION" accent={accent}>
        <GalaxyEduEntry
          degree="Master of Science in Software Engineering"
          date="Jun 2020 – May 2022"
          school="Delhi Technological University (DTU), New Delhi"
        />
        <GalaxyEduEntry
          degree="Bachelor of Technology in Computer Science"
          date="Jun 2016 – May 2020"
          school="National Institute of Technology (NIT), Warangal"
        />
      </GalaxySection>

      <GalaxySection title="CERTIFICATIONS" accent={accent}>
        <GalaxyCertItem name="Java Programming Certification" issuer="Oracle Academy | Coursera" year="2023" />
        <GalaxyCertItem name="Git and GitHub Certification" issuer="Coursera" year="2023" />
        <GalaxyCertItem name="Full Stack Web Development Bootcamp" issuer="Udemy" year="2024" />
        <GalaxyCertItem name="Problem Solving (Basic)" issuer="HackerRank" year="2024" />
      </GalaxySection>
    </div>
  )
}

function GalaxySection({ title, children, accent }: { title: string; children: React.ReactNode; accent: string }) {
  return (
    <div style={{ marginTop: '5px' }}>
      <div
        style={{
          fontSize: '9px',
          fontWeight: 'bold',
          color: accent,
          letterSpacing: '0.05em',
          paddingBottom: '1.5px',
          borderBottom: `0.5px solid ${COLOR_DIVIDER}`,
          marginBottom: '3px',
        }}
      >
        {title}
      </div>
      <div>{children}</div>
    </div>
  )
}

function GalaxyExpEntry({
  company,
  location,
  role,
  date,
  stack,
  items,
}: {
  company: string
  location: string
  role: string
  date: string
  stack: string
  items: string[]
}) {
  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{ fontSize: '7px', fontWeight: 'bold' }}>{company}  |  {location}</div>
      <div style={{ fontSize: '6.5px', fontWeight: 'bold', marginTop: '1px' }}>{role}  |  {date}</div>
      <div style={{ fontSize: '6px', fontStyle: 'italic', marginTop: '1px' }}>Stack: {stack}</div>
      <ul style={{ margin: '2px 0 0', padding: 0, listStyle: 'none' }}>
        {items.map((item, idx) => (
          <li
            key={idx}
            style={{
              fontSize: '5.5px',
              marginBottom: '0.5px',
              paddingLeft: '7px',
              textIndent: '-5px',
              lineHeight: 1.4,
            }}
          >
            • {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function GalaxyEduEntry({ degree, date, school }: { degree: string; date: string; school: string }) {
  return (
    <div style={{ marginBottom: '3px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '5px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '7px' }}>{degree}</span>
        <span style={{ fontSize: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>{date}</span>
      </div>
      <div style={{ fontSize: '6.5px', fontStyle: 'italic', marginTop: '1px' }}>{school}</div>
    </div>
  )
}

function GalaxyCertItem({ name, issuer, year }: { name: string; issuer: string; year: string }) {
  return (
    <div
      style={{
        fontSize: '6px',
        marginBottom: '1px',
        paddingLeft: '7px',
        textIndent: '-5px',
        lineHeight: 1.4,
      }}
    >
      • <span style={{ fontWeight: 'bold' }}>{name}</span> | {issuer} | {year}
    </div>
  )
}

// ─── Forest ──────────────────────────────────────────────────────────────────

function ForestThumbnail({ accentColor }: { accentColor?: string }) {
  const accent = accentColor || FOREST_DEFAULT_ACCENT
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        padding: '16px 18px',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: COLOR_TEXT,
        fontSize: '5.5px',
        lineHeight: 1.4,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '6.5px', marginBottom: '2px' }}>Senior Sales Associate</div>
        <div
          style={{
            fontSize: '17px',
            fontWeight: 'bold',
            color: accent,
            marginBottom: '4px',
          }}
        >
          Samantha Williams
        </div>
        <div style={{ fontSize: '6px', marginBottom: '2px' }}>
          <span style={{ fontWeight: 'bold' }}>Address:</span> New York, NY, 10001
          {'   •   '}
          <span style={{ fontWeight: 'bold' }}>Email address:</span> samantha.williams@example.com
        </div>
        <div style={{ fontSize: '6px' }}>
          <span style={{ fontWeight: 'bold' }}>Phone number:</span> (555) 789-1234
        </div>
      </div>

      <div style={{ borderTop: `0.5px solid ${COLOR_DIVIDER}`, margin: '6px 0' }} />

      <ForestSection title="SUMMARY" accent={accent}>
        <p style={{ fontSize: '5.5px', textAlign: 'justify', margin: 0, lineHeight: 1.45 }}>
          Senior Analyst with 5+ years of experience in data analysis, business intelligence, and process optimization. Skilled in driving operational efficiency, forecasting, and leading data-driven strategies to support business decisions and improvements. Strong communicator focused on results.
        </p>
      </ForestSection>

      <ForestSection title="EXPERIENCE" accent={accent}>
        <ForestExpEntry
          role="SENIOR ANALYST"
          date="Jul 2021 — Current"
          company="Loom & Lantern Co. - New York, NY"
          items={[
            'Spearhead data analysis and reporting for key business functions, identifying trends and providing insights to improve company performance and profitability.',
            'Conduct in-depth market analysis and competitive benchmarking to inform strategic decisions, resulting in a 15% increase in market share within one year.',
            'Develop predictive models to forecast sales performance and customer behavior, contributing to more accurate budgeting and resource allocation.',
          ]}
          accent={accent}
        />
        <ForestExpEntry
          role="BUSINESS ANALYST"
          date="Aug 2017 — May 2021"
          company="Willow & Wren Ltd. - New York, NY"
          items={[
            'Analyzed and interpreted large datasets to identify business opportunities and recommend process improvements, leading to a 20% reduction in operational costs.',
            'Created detailed financial models and dashboards to track key performance indicators (KPIs), enabling data-driven decision-making across departments.',
            'Worked closely with project managers to monitor progress on major initiatives, ensuring projects were delivered on time and within budget.',
          ]}
          accent={accent}
        />
      </ForestSection>

      <ForestSection title="EDUCATION" accent={accent}>
        <ForestEduEntry
          institution="New York University - New York, NY"
          degree="Bachelor of Science"
          subject="Economics"
          date="Sep 2013 - May 2017"
          accent={accent}
        />
      </ForestSection>

      <ForestSection title="SKILLS" accent={accent}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '14px', rowGap: '0' }}>
          <ForestSkillBullet>Project Management</ForestSkillBullet>
          <ForestSkillBullet>Data-driven Decision Making</ForestSkillBullet>
          <ForestSkillBullet>SQL & Excel</ForestSkillBullet>
          <ForestSkillBullet>Financial Analysis</ForestSkillBullet>
          <ForestSkillBullet>Business Intelligence tools</ForestSkillBullet>
          <ForestSkillBullet>Statistical Modeling</ForestSkillBullet>
        </div>
      </ForestSection>
    </div>
  )
}

function ForestSection({ title, children, accent }: { title: string; children: React.ReactNode; accent: string }) {
  return (
    <div style={{ marginTop: '5px' }}>
      <div
        style={{
          fontSize: '9px',
          fontWeight: 'bold',
          color: accent,
          letterSpacing: '0.05em',
          marginBottom: '3px',
        }}
      >
        {title}
      </div>
      <div>{children}</div>
    </div>
  )
}

function ForestExpEntry({
  role,
  date,
  company,
  items,
  accent,
}: {
  role: string
  date: string
  company: string
  items: string[]
  accent: string
}) {
  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{ fontSize: '7px' }}>
        <span style={{ color: accent, fontWeight: 'bold' }}>{role}</span> | {date}
      </div>
      <div style={{ fontSize: '6.5px', marginTop: '1px' }}>{company}</div>
      <ul style={{ margin: '2px 0 0', padding: 0, listStyle: 'none' }}>
        {items.map((item, idx) => (
          <li
            key={idx}
            style={{
              fontSize: '5.5px',
              marginBottom: '0.5px',
              paddingLeft: '7px',
              textIndent: '-5px',
              lineHeight: 1.4,
            }}
          >
            • {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ForestEduEntry({
  institution,
  degree,
  subject,
  date,
  accent,
}: {
  institution: string
  degree: string
  subject: string
  date: string
  accent: string
}) {
  return (
    <div style={{ marginBottom: '3px' }}>
      <div style={{ fontSize: '7px', fontWeight: 'bold', color: accent }}>
        {institution} | {degree}
      </div>
      <div style={{ fontSize: '6.5px', marginTop: '1px' }}>
        {subject} | {date}
      </div>
    </div>
  )
}

function ForestSkillBullet({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '6px',
        paddingLeft: '7px',
        textIndent: '-5px',
        marginBottom: '1px',
        lineHeight: 1.45,
      }}
    >
      • {children}
    </div>
  )
}

// ─── Slate ───────────────────────────────────────────────────────────────────

function SlateThumbnail({ accentColor }: { accentColor?: string }) {
  const accent = accentColor || SLATE_DEFAULT_ACCENT
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        padding: '16px 18px',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: COLOR_TEXT,
        fontSize: '5.5px',
        lineHeight: 1.4,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Header — left aligned */}
      <div
        style={{
          fontSize: '17px',
          fontWeight: 'bold',
          color: accent,
          marginBottom: '2px',
        }}
      >
        Jessie Smith
      </div>
      <div style={{ fontSize: '7px', fontWeight: 'bold', marginBottom: '5px' }}>
        Human Resource Manager
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '6px', gap: '6px' }}>
        <span>New York, USA, 4759 Sunnydale Lane, Plano, TX 75071, United States</span>
        <span style={{ flexShrink: 0 }}>email@youremail.com</span>
      </div>
      <div style={{ fontSize: '6px', marginTop: '1px' }}>(469) 385-2948</div>

      {/* Main divider (accent) */}
      <div style={{ borderTop: `1.5px solid ${accent}`, margin: '6px 0' }} />

      <SlateSection title="Summary" accent={accent}>
        <p style={{ fontSize: '5.5px', textAlign: 'justify', margin: 0, lineHeight: 1.45 }}>
          Human resources generalist with 8 years of experience in HR, including hiring and terminating, disciplining employees, and helping department managers improve employee performance. Worked with labor unions to negotiate compensation packages for workers. Organized new hire training initiatives as well as ongoing training to adhere to workplace safety standards. Worked with OSHA to ensure that all safety regulations are followed.
        </p>
      </SlateSection>

      <SlateSection title="Experience" accent={accent}>
        <SlateExpEntry
          title="Human Resource Manager"
          company="Jim's Widget Factory, Plano, TX"
          date="Apr 2019 — Current"
          items={[
            'Implement effective company policies to ensure that all practices comply with labor and employment regulations.',
            'Increased employee retention rates by managing workplace satisfaction to an over 90% success rate by creating and maintaining a positive work environment.',
            'Develop targeted outreach practices to increase minority recruitment and ensure compliance with affirmative action policies.',
          ]}
        />
        <SlateExpEntry
          title="Workplace Culture & Compliance Specialist"
          company="Acme Corp, Dallas, TX"
          date="Sep 2016 — Mar 2019"
          items={[
            'Ensured HR policies aligned with state and federal regulations, maintaining 100% compliance in audits.',
            'Implemented a conflict resolution system, decreasing workplace disputes by 40%.',
            'Organized leadership training sessions to enhance managerial effectiveness and team collaboration.',
          ]}
        />
        <SlateExpEntry
          title="Talent Acquisition & Retention Lead"
          company="Jim's Widget Factory, Plano, TX"
          date="Jan 2012 — Dec 2015"
          items={[
            'Developed and implemented company-wide HR policies to ensure compliance with labor laws and improve workplace culture.',
            'Spearheaded initiatives to boost employee satisfaction, resulting in a 90% retention rate.',
            'Led diversity and inclusion programs, increasing minority recruitment by 30%.',
          ]}
        />
      </SlateSection>

      <SlateSection title="Education" accent={accent}>
        <div style={{ fontSize: '6.5px' }}>Master, Human Resources, Dallas, Sep 2007 — May 2011</div>
        <div style={{ fontSize: '6.5px', marginTop: '1px' }}>The University of Texas</div>
      </SlateSection>

      <SlateSection title="Skills" accent={accent}>
        <SkillRow label="HR Operations" value="Hiring, Termination, Performance Management" />
        <SkillRow label="Compliance" value="Labor Laws, OSHA, Employment Regulations" />
        <SkillRow label="People Strategy" value="Diversity, Inclusion, Talent Acquisition" />
        <SkillRow label="Training" value="Onboarding, Leadership Development, Mentoring" />
        <SkillRow label="Soft Skills" value="Detail-oriented, Platform expertise, Analytics, Communication" />
      </SlateSection>
    </div>
  )
}

function SlateSection({ title, children, accent }: { title: string; children: React.ReactNode; accent: string }) {
  return (
    <div style={{ marginTop: '6px' }}>
      <div
        style={{
          fontSize: '9px',
          fontWeight: 'bold',
          color: accent,
          paddingBottom: '1.5px',
          borderBottom: `0.5px solid ${accent}`,
          marginBottom: '3px',
        }}
      >
        {title}
      </div>
      <div>{children}</div>
    </div>
  )
}

function SlateExpEntry({
  title,
  company,
  date,
  items,
}: {
  title: string
  company: string
  date: string
  items: string[]
}) {
  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{ fontSize: '7px', fontWeight: 'bold' }}>{title}</div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          fontStyle: 'italic',
          fontSize: '6.5px',
          marginTop: '1px',
          gap: '5px',
        }}
      >
        <span>{company}</span>
        <span style={{ flexShrink: 0 }}>{date}</span>
      </div>
      <ul style={{ margin: '2px 0 0', padding: 0, listStyle: 'none' }}>
        {items.map((item, idx) => (
          <li
            key={idx}
            style={{
              fontSize: '5.5px',
              marginBottom: '0.5px',
              paddingLeft: '7px',
              textIndent: '-5px',
              lineHeight: 1.4,
            }}
          >
            • {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Pillar ──────────────────────────────────────────────────────────────────

function PillarThumbnail({ accentColor }: { accentColor?: string }) {
  const accent = accentColor || PILLAR_DEFAULT_ACCENT
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        padding: '16px 18px',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: COLOR_TEXT,
        fontSize: '5.5px',
        lineHeight: 1.4,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Header — left bar + name + contact */}
      <div
        style={{
          borderLeft: `2.5px solid ${accent}`,
          paddingLeft: '8px',
          marginBottom: '5px',
        }}
      >
        <div
          style={{
            fontSize: '15px',
            fontWeight: 'bold',
            color: accent,
            marginBottom: '2px',
          }}
        >
          Suma Rathod
        </div>
        <div style={{ fontSize: '6px' }}>sumarathod@gmail.com</div>
        <div style={{ fontSize: '6px' }}>+91 9848761230</div>
        <div style={{ fontSize: '6px' }}>Hyderabad, India</div>
      </div>

      <div style={{ borderTop: `0.5px solid ${COLOR_DIVIDER}`, margin: '4px 0 6px' }} />

      <PillarSection title="Summary" accent={accent}>
        <p style={{ fontSize: '5.5px', textAlign: 'justify', margin: 0, lineHeight: 1.45 }}>
          Results-Driven Full Stack developer with 5+ years building scalable web applications, expertise in React and Node.js and a track record of reducing load times by 40% while serving 100k+ users.
        </p>
      </PillarSection>

      <PillarSection title="Experience" accent={accent}>
        <PillarExpEntry
          role="Senior Software Engineer"
          company="Tech Innovation Inc | Hyderabad, India"
          date="Apr 24 - Present"
          items={[
            'Designed and implemented scalable cloud-based infrastructure, resulting in 40% cost savings and 50% increase in system capacity for Tech Innovations Inc.',
            'Led migration of legacy services to a microservices architecture, improving deployment frequency by 3x.',
          ]}
          accent={accent}
        />
        <PillarExpEntry
          role="Software Engineer"
          company="WebCraft Solutions | Bangalore, India"
          date="Jul 21 - Mar 24"
          items={[
            'Built customer-facing React dashboards used by 100k+ monthly active users.',
            'Optimised PostgreSQL queries and added caching, reducing average API latency by 40%.',
          ]}
          accent={accent}
        />
      </PillarSection>

      <PillarSection title="Education" accent={accent}>
        <PillarEduEntry
          degree="Master of Science in Software Engineering"
          school="Delhi Technological University | DTU"
          date="Jun 20 - May 22"
          accent={accent}
        />
        <PillarEduEntry
          degree="Bachelor of Science in Computer Science"
          school="University of Mumbai"
          date="Jun 16 - May 20"
          accent={accent}
        />
      </PillarSection>

      <PillarSection title="Skills" accent={accent} last>
        <SkillRow label="Programming Languages" value="Python, JavaScript, PHP, Java" />
        <SkillRow label="Frameworks" value="FastAPI, React, Node.js, Express" />
        <SkillRow label="Databases" value="MongoDB, PostgreSQL, Redis" />
        <SkillRow label="Cloud & DevOps" value="AWS, Docker, GitHub Actions, Kubernetes" />
      </PillarSection>
    </div>
  )
}

function PillarSection({
  title,
  children,
  accent,
  last,
}: {
  title: string
  children: React.ReactNode
  accent: string
  last?: boolean
}) {
  return (
    <>
      <div style={{ fontSize: '9px', fontWeight: 'bold', color: accent, marginBottom: '3px' }}>
        {title}
      </div>
      <div>{children}</div>
      {!last && <div style={{ borderTop: `0.5px solid ${COLOR_DIVIDER}`, margin: '5px 0' }} />}
    </>
  )
}

function PillarExpEntry({
  role,
  company,
  date,
  items,
  accent,
}: {
  role: string
  company: string
  date: string
  items: string[]
  accent: string
}) {
  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{ fontSize: '7px', fontWeight: 'bold', color: accent }}>{role}</div>
      <div style={{ fontSize: '6.5px', marginTop: '1px' }}>{company}</div>
      <div style={{ fontSize: '6.5px', marginTop: '0.5px' }}>{date}</div>
      <ul style={{ margin: '2px 0 0', padding: 0, listStyle: 'none' }}>
        {items.map((item, idx) => (
          <li
            key={idx}
            style={{
              fontSize: '5.5px',
              marginBottom: '0.5px',
              paddingLeft: '7px',
              textIndent: '-5px',
              lineHeight: 1.4,
            }}
          >
            • {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function PillarEduEntry({
  degree,
  school,
  date,
  accent,
}: {
  degree: string
  school: string
  date: string
  accent: string
}) {
  return (
    <div style={{ marginBottom: '3px' }}>
      <div style={{ fontSize: '7px', fontWeight: 'bold', color: accent }}>{degree}</div>
      <div style={{ fontSize: '6.5px', marginTop: '1px' }}>{school}</div>
      <div style={{ fontSize: '6.5px', marginTop: '0.5px' }}>{date}</div>
    </div>
  )
}

// ─── Amber (left-stacked layout) ─────────────────────────────────────────────

function AmberThumbnail({ accentColor }: { accentColor?: string }) {
  const accent = accentColor || AMBER_DEFAULT_ACCENT
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        padding: '16px 18px',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: COLOR_TEXT,
        fontSize: '5.5px',
        lineHeight: 1.4,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Arjun Mehta
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '12px', rowGap: '1px', fontSize: '6px', marginTop: '5px' }}>
          <div>testing@example.com</div>
          <div>+919330111234</div>
          <div>Hyderabad</div>
          <div>linkedin.com/in/arjun</div>
          <div>arjun-portfolio.com</div>
        </div>
      </div>
      <div style={{ borderTop: `0.5px solid ${COLOR_DIVIDER}`, margin: '6px 0' }} />

      <AmberSection title="SUMMARY" accent={accent}>
        <p style={{ fontSize: '5.5px', textAlign: 'justify', margin: 0, lineHeight: 1.45 }}>
          Results-Driven Full Stack Developer with 5+ years building scalable web applications, expertise in React and Node.js, and a track record of reducing load times by 40% while serving 100K+ users
        </p>
      </AmberSection>

      <AmberSection title="SKILLS" accent={accent}>
        <SkillRow label="Programming Languages" value="Python, PHP, Java" />
        <SkillRow label="Frameworks" value="FastAPI, React" />
        <SkillRow label="Databases" value="MongoDB" />
      </AmberSection>

      <AmberSection title="EDUCATION" accent={accent}>
        <AmberEduEntry
          degree="Master of Science in Software Engineering"
          date="Jun 20 – May 22"
          school="Delhi Technological University - [DTU]"
        />
        <AmberEduEntry
          degree="Bachelor of Science in Computer Science"
          date="Jun 16 – Apr 20"
          school="University of Mumbai"
        />
      </AmberSection>

      <AmberSection title="EXPERIENCE" accent={accent} last>
        <AmberExpEntry
          role="Senior Software Engineer"
          date="Apr 24 – Present"
          company="Tech Innovations Inc"
          items={[
            'Designed and implemented scalable cloud-based infrastructure, resulting in 40% cost savings and 50% increase in system capacity.',
            'Led migration of legacy services to a microservices architecture, improving deployment frequency by 3x.',
            'Mentored 5 junior engineers through code reviews and pair-programming sessions.',
            'Introduced GitHub Actions CI/CD pipeline, reducing manual release effort by 80%.',
          ]}
        />
        <AmberExpEntry
          role="Software Engineer"
          date="Jul 21 – Mar 24"
          company="WebCraft Solutions"
          items={[
            'Built customer-facing React dashboards used by 100K+ monthly active users.',
            'Optimised PostgreSQL queries and added Redis caching, reducing average API latency by 40%.',
            'Collaborated with product and design on the redesign of the onboarding flow, lifting conversion by 22%.',
            'Owned the migration from REST to GraphQL for the public API.',
          ]}
        />
      </AmberSection>
    </div>
  )
}

function AmberSection({
  title,
  children,
  accent,
  last,
}: {
  title: string
  children: React.ReactNode
  accent: string
  last?: boolean
}) {
  return (
    <>
      <div style={{ fontSize: '9px', fontWeight: 'bold', color: accent, letterSpacing: '0.08em', marginBottom: '3px' }}>{title}</div>
      <div>{children}</div>
      {!last && <div style={{ borderTop: `0.5px solid ${COLOR_DIVIDER}`, margin: '5px 0' }} />}
    </>
  )
}

function AmberExpEntry({
  role,
  date,
  company,
  items,
}: {
  role: string
  date: string
  company: string
  items: string[]
}) {
  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '5px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '7px' }}>{role}</span>
        <span style={{ fontSize: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>{date}</span>
      </div>
      <div style={{ fontSize: '6.5px', marginTop: '1px' }}>{company}</div>
      <ul style={{ margin: '2px 0 0', padding: 0, listStyle: 'none' }}>
        {items.map((item, idx) => (
          <li
            key={idx}
            style={{
              fontSize: '5.5px',
              marginBottom: '0.5px',
              paddingLeft: '7px',
              textIndent: '-5px',
              lineHeight: 1.4,
            }}
          >
            • {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function AmberEduEntry({ degree, school, date }: { degree: string; school: string; date: string }) {
  return (
    <div style={{ marginBottom: '3px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '5px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '7px' }}>{degree}</span>
        <span style={{ fontSize: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>{date}</span>
      </div>
      <div style={{ fontSize: '6.5px', marginTop: '1px' }}>{school}</div>
    </div>
  )
}

// ─── Ocean (left-right layout) ───────────────────────────────────────────────

function OceanThumbnail({ accentColor }: { accentColor?: string }) {
  const accent = accentColor || OCEAN_DEFAULT_ACCENT
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        padding: '16px 18px',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: COLOR_TEXT,
        fontSize: '5.5px',
        lineHeight: 1.4,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Header — name left, contact right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Priya Sharma
        </div>
        <div style={{ textAlign: 'right', fontSize: '6px', lineHeight: 1.55 }}>
          <div>+919330111234</div>
          <div>testing@example.com</div>
          <div>Hyderabad</div>
          <div>LinkedIn</div>
          <div>Portfolio</div>
        </div>
      </div>
      <div style={{ borderTop: `0.5px solid ${COLOR_DIVIDER}`, margin: '6px 0' }} />

      <OceanSection title="SUMMARY" accent={accent}>
        <p style={{ fontSize: '5.5px', textAlign: 'justify', margin: 0, lineHeight: 1.45 }}>
          Results-Driven Full Stack Developer with 5+ years building scalable web applications, expertise in React and Node.js, and a track record of reducing load times by 40% while serving 100K+ users
        </p>
      </OceanSection>

      <OceanSection title="SKILLS" accent={accent}>
        <SkillRow label="Programming Languages" value="Python, JavaScript, PHP, Java" />
        <SkillRow label="Frameworks" value="FastAPI, React" />
        <SkillRow label="Databases" value="MongoDB" />
      </OceanSection>

      <OceanSection title="EDUCATION" accent={accent}>
        <OceanEduEntry
          degree="Master of Science in Software Engineering"
          date="Jun 20 – May 22"
          school="Delhi Technological University - [DTU]"
        />
        <OceanEduEntry
          degree="Bachelor of Science in Computer Science"
          date="Jun 16 – Apr 20"
          school="University of Mumbai"
        />
      </OceanSection>

      <OceanSection title="EXPERIENCE" accent={accent} last>
        <OceanExpEntry
          role="Senior Software Engineer"
          date="Apr 24 – Present"
          company="Tech Innovations Inc• Hyderabad, India"
          items={[
            'Designed and implemented scalable cloud-based infrastructure, resulting in 40% cost savings and 50% increase in system capacity.',
            'Led migration of legacy services to a microservices architecture, improving deployment frequency by 3x.',
            'Mentored 5 junior engineers through code reviews and pair-programming sessions.',
            'Introduced GitHub Actions CI/CD pipeline, reducing manual release effort by 80%.',
          ]}
        />
        <OceanExpEntry
          role="Software Engineer"
          date="Jul 21 – Mar 24"
          company="WebCraft Solutions• Bangalore, India"
          items={[
            'Built customer-facing React dashboards used by 100K+ monthly active users.',
            'Optimised PostgreSQL queries and added Redis caching, reducing average API latency by 40%.',
            'Owned the migration from REST to GraphQL for the public API.',
            'Collaborated with product and design on the onboarding redesign, lifting conversion by 22%.',
          ]}
        />
      </OceanSection>
    </div>
  )
}

function OceanSection({
  title,
  children,
  accent,
  last,
}: {
  title: string
  children: React.ReactNode
  accent: string
  last?: boolean
}) {
  return (
    <>
      <div style={{ fontSize: '9px', fontWeight: 'bold', color: accent, letterSpacing: '0.08em', marginBottom: '3px' }}>{title}</div>
      <div>{children}</div>
      {!last && <div style={{ borderTop: `0.5px solid ${COLOR_DIVIDER}`, margin: '5px 0' }} />}
    </>
  )
}

function OceanExpEntry({ role, date, company, items }: { role: string; date: string; company: string; items: string[] }) {
  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '5px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '7px' }}>{role}</span>
        <span style={{ fontSize: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>{date}</span>
      </div>
      <div style={{ fontSize: '6.5px', marginTop: '1px' }}>{company}</div>
      <ul style={{ margin: '2px 0 0', padding: 0, listStyle: 'none' }}>
        {items.map((item, idx) => (
          <li key={idx} style={{ fontSize: '5.5px', paddingLeft: '7px', textIndent: '-5px', marginBottom: '0.5px', lineHeight: 1.4 }}>
            • {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function OceanEduEntry({ degree, school, date }: { degree: string; school: string; date: string }) {
  return (
    <div style={{ marginBottom: '3px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '5px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '7px' }}>{degree}</span>
        <span style={{ fontSize: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>{date}</span>
      </div>
      <div style={{ fontSize: '6.5px', marginTop: '1px' }}>{school}</div>
    </div>
  )
}

// ─── Aether (minimalist with ruled section headings) ─────────────────────────

function AetherThumbnail({ accentColor }: { accentColor?: string }) {
  const accent = accentColor || AETHER_DEFAULT_ACCENT
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        padding: '16px 18px',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: COLOR_TEXT,
        fontSize: '5.5px',
        lineHeight: 1.4,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Aditya Verma
        </div>
        <div style={{ fontSize: '6px', marginTop: '4px' }}>
          testing@example.com | +919330111234 | Hyderabad |
        </div>
        <div style={{ fontSize: '6px', marginTop: '1px' }}>
          linkedin.com/in/aditya | aditya-portfolio.com
        </div>
      </div>

      <AetherSection title="SUMMARY" accent={accent}>
        <p style={{ fontSize: '5.5px', textAlign: 'justify', margin: 0, lineHeight: 1.45 }}>
          Results-Driven Full Stack Developer with 5+ years building scalable web applications, expertise in React and Node.js, and a track record of reducing load times by 40% while serving 100K+ users
        </p>
      </AetherSection>

      <AetherSection title="SKILLS" accent={accent}>
        <SkillRow label="Programming Languages" value="Java, Python, JavaScript" />
        <SkillRow label="Web Technologies" value="HTML, CSS, TypeScript" />
        <SkillRow label="Frameworks" value="React.js, Node.js, Express.js" />
        <SkillRow label="Database" value="MongoDB, MySQL, PostgreSQL, Firebase" />
        <SkillRow label="Testing" value="Jest, React Testing Library, Postman, Manual Testing" />
        <SkillRow label="Tools & DevOps" value="Git, GitHub, VS Code, Jira, Docker basics" />
      </AetherSection>

      <AetherSection title="EDUCATION" accent={accent}>
        <AetherEduEntry
          degree="Master of Science in Software Engineering"
          date="Jun 20 – May 22"
          school="Delhi Technological University - [DTU]"
        />
        <AetherEduEntry
          degree="Bachelor of Science in Computer Science"
          date="Jun 16 – Apr 20"
          school="University of Mumbai"
        />
      </AetherSection>

      <AetherSection title="EXPERIENCE" accent={accent}>
        <AetherExpEntry
          company="Tech Innovations Inc | Hyderabad, India"
          role="Senior Software Engineer"
          date="Apr 24 – Present"
          items={[
            'Designed and implemented scalable cloud-based infrastructure, resulting in 40% cost savings and 50% increase in system capacity for Tech Innovations Inc.',
            'Led migration of legacy services to a microservices architecture, improving deployment frequency by 3x.',
            'Mentored 5 junior engineers through code reviews and pair-programming sessions.',
            'Introduced GitHub Actions CI/CD pipeline, reducing manual release effort by 80%.',
          ]}
        />
        <AetherExpEntry
          company="Digital Solutions Ltd | Bangalore, India"
          role="Full Stack Developer"
          date="Jun 22 – Mar 24"
          items={[
            'Spearheaded development of real-time analytics dashboard using GraphQL, Apache Kafka, and Tableau, providing data-driven insights and informing business decisions that drove 20% revenue growth.',
            'Built customer-facing React dashboards used by 100K+ monthly active users.',
            'Optimised PostgreSQL queries and added Redis caching, reducing average API latency by 40%.',
            'Collaborated with product and design on the onboarding redesign, lifting conversion by 22%.',
          ]}
        />
      </AetherSection>
    </div>
  )
}

function AetherSection({ title, children, accent }: { title: string; children: React.ReactNode; accent: string }) {
  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
        <span style={{ fontSize: '9px', fontWeight: 'bold', color: accent, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{title}</span>
        <span style={{ height: '0.5px', width: '100%', backgroundColor: accent }} />
      </div>
      <div>{children}</div>
    </div>
  )
}

function AetherExpEntry({
  company,
  role,
  date,
  items,
}: {
  company: string
  role: string
  date: string
  items: string[]
}) {
  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '5px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '7px' }}>{role}</span>
        <span style={{ fontSize: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>{date}</span>
      </div>
      <div style={{ fontSize: '6.5px', marginTop: '1px' }}>{company}</div>
      <ul style={{ margin: '2px 0 0', padding: 0, listStyle: 'none' }}>
        {items.map((item, idx) => (
          <li key={idx} style={{ fontSize: '5.5px', paddingLeft: '7px', textIndent: '-5px', marginBottom: '0.5px', lineHeight: 1.4 }}>
            • {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function AetherEduEntry({ degree, school, date }: { degree: string; school: string; date: string }) {
  return (
    <div style={{ marginBottom: '3px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '5px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '7px' }}>{degree}</span>
        <span style={{ fontSize: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>{date}</span>
      </div>
      <div style={{ fontSize: '6.5px', marginTop: '1px' }}>{school}</div>
    </div>
  )
}

// ─── Ember (right-aligned header) ────────────────────────────────────────────

function EmberThumbnail({ accentColor }: { accentColor?: string }) {
  const accent = accentColor || EMBER_DEFAULT_ACCENT
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        padding: '16px 18px',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: COLOR_TEXT,
        fontSize: '5.5px',
        lineHeight: 1.4,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Right-aligned header */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: accent }}>Dhruva</div>
        <div style={{ fontSize: '6px', marginTop: '2px' }}>dhruva@gmail.com</div>
        <div style={{ fontSize: '6px' }}>+91 9785462155</div>
        <div style={{ fontSize: '6px' }}>Hyderabad, India</div>
      </div>
      <div style={{ borderTop: `0.5px solid ${COLOR_DIVIDER}`, margin: '5px 0 6px' }} />

      <EmberSection title="Summary" accent={accent}>
        <p style={{ fontSize: '5.5px', textAlign: 'justify', margin: 0, lineHeight: 1.45 }}>
          Results- Driven Full Stack developer with 5+ years building scalable web applications, expertise in React and Node.js and a track record of reducing load times by 40% while serving 100k+ users.
        </p>
      </EmberSection>

      <EmberSection title="Experience" accent={accent}>
        <EmberExpEntry
          role="Senior Software Engineer"
          company="Tech Innovation Inc | Hyderabad, India"
          date="Apr 24 - Present"
          items={[
            'Designed and implemented scalable cloud-based infrastructure, resulting in 40% cost savings and 50% increase in system capacity for Tech Innovations Inc.',
            'Led migration of legacy services to a microservices architecture, improving deployment frequency by 3x.',
            'Mentored a team of 5 junior engineers, conducting code reviews and pairing sessions.',
            'Introduced GitHub Actions CI/CD pipeline, reducing manual release effort by 80%.',
          ]}
        />
        <EmberExpEntry
          role="Software Engineer"
          company="WebCraft Solutions | Bangalore, India"
          date="Jul 21 - Mar 24"
          items={[
            'Built customer-facing React dashboards used by 100k+ monthly active users.',
            'Optimised PostgreSQL queries and added Redis caching, reducing average API latency by 40%.',
            'Collaborated with product and design on the redesign of the onboarding flow.',
          ]}
        />
      </EmberSection>

      <EmberSection title="Education" accent={accent}>
        <EmberEduEntry
          degree="Master of Science in Software Engineering"
          school="Delhi Technological University | DTU"
          date="Jun 20 - May 22"
        />
        <EmberEduEntry
          degree="Bachelor of Science in Computer Science"
          school="University of Mumbai"
          date="Jun 16 - May 22"
        />
      </EmberSection>

      <EmberSection title="Skills" accent={accent} last>
        <SkillRow label="Programming Languages" value="Python, JavaScript, PHP, Java" />
        <SkillRow label="Frameworks" value="FastAPI, React" />
        <SkillRow label="Databases" value="MongoDB" />
      </EmberSection>
    </div>
  )
}

function EmberSection({
  title,
  children,
  accent,
  last,
}: {
  title: string
  children: React.ReactNode
  accent: string
  last?: boolean
}) {
  return (
    <>
      <div style={{ fontSize: '9px', fontWeight: 'bold', color: accent, marginBottom: '3px' }}>{title}</div>
      <div>{children}</div>
      {!last && <div style={{ borderTop: `0.5px solid ${COLOR_DIVIDER}`, margin: '5px 0' }} />}
    </>
  )
}

function EmberExpEntry({
  role,
  company,
  date,
  items,
}: {
  role: string
  company: string
  date: string
  items: string[]
}) {
  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{ fontSize: '7px', fontWeight: 'bold' }}>{role}</div>
      <div style={{ fontSize: '6.5px', marginTop: '1px' }}>{company}</div>
      <div style={{ fontSize: '6.5px', marginTop: '0.5px' }}>{date}</div>
      <ul style={{ margin: '2px 0 0', padding: 0, listStyle: 'none' }}>
        {items.map((item, idx) => (
          <li
            key={idx}
            style={{
              fontSize: '5.5px',
              marginBottom: '0.5px',
              paddingLeft: '7px',
              textIndent: '-5px',
              lineHeight: 1.4,
            }}
          >
            • {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function EmberEduEntry({ degree, school, date }: { degree: string; school: string; date: string }) {
  return (
    <div style={{ marginBottom: '3px' }}>
      <div style={{ fontSize: '7px', fontWeight: 'bold' }}>{degree}</div>
      <div style={{ fontSize: '6.5px', marginTop: '1px' }}>{school}</div>
      <div style={{ fontSize: '6.5px', marginTop: '0.5px' }}>{date}</div>
    </div>
  )
}
