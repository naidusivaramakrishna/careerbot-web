import React from 'react'
import { COLOR_TEXT, COLOR_NAME, COLOR_DIVIDER, SkillRow } from './_shared'
import { ECLIPSE_DEFAULT_SECTION_BG } from '../CatalogueThumbnail'

export function EclipseThumbnail({ sectionBgColor }: { sectionBgColor?: string }) {
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
          <span>howard.jones@gmail.com</span>
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
