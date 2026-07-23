import React from 'react'
import { COLOR_TEXT, COLOR_DIVIDER, SkillRow } from './_shared'
import { SLATE_DEFAULT_ACCENT } from '../CatalogueThumbnail'

export function SlateThumbnail({ accentColor }: { accentColor?: string }) {
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
      <div style={{ fontSize: '17px', fontWeight: 'bold', color: accent, marginBottom: '2px' }}>
        Jessie Smith
      </div>
      <div style={{ fontSize: '7px', marginBottom: '5px' }}>Human Resource Manager</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '6px', gap: '6px' }}>
        <div className="flex gap-2">
          <span>New York, USA</span>
          <span>(469) 385-2948</span>
          <span>LinkedIn</span>
          <span>GitHub</span>
        </div>
        <span style={{ flexShrink: 0 }}>email@youremail.com</span>
      </div>

      <Section title="Summary" accent={accent}>
        <p style={{ fontSize: '5.5px', textAlign: 'justify', margin: 0, lineHeight: 1.45 }}>
          Human resources generalist with 8 years of experience in HR, including hiring and terminating, disciplining employees, and helping department managers improve employee performance. Worked with labor unions to negotiate compensation packages for workers. Organized new hire training initiatives as well as ongoing training to adhere to workplace safety standards. Worked with OSHA to ensure that all safety regulations are followed.
        </p>
      </Section>

      <Section title="Experience" accent={accent}>
        <ExpEntry
          title="Human Resource Manager"
          company="Jim's Widget Factory, Plano, TX"
          date="Apr 2019 — Current"
          items={[
            'Implement effective company policies to ensure that all practices comply with labor and employment regulations.',
            'Increased employee retention rates by managing workplace satisfaction to an over 90% success rate by creating and maintaining a positive work environment.',
            'Develop targeted outreach practices to increase minority recruitment and ensure compliance with affirmative action policies.',
          ]}
        />
        <ExpEntry
          title="Workplace Culture & Compliance Specialist"
          company="Acme Corp, Dallas, TX"
          date="Sep 2016 — Mar 2019"
          items={[
            'Ensured HR policies aligned with state and federal regulations, maintaining 100% compliance in audits.',
            'Implemented a conflict resolution system, decreasing workplace disputes by 40%.',
            'Organized leadership training sessions to enhance managerial effectiveness and team collaboration.',
          ]}
        />
        <ExpEntry
          title="Talent Acquisition & Retention Lead"
          company="Jim's Widget Factory, Plano, TX"
          date="Jan 2012 — Dec 2015"
          items={[
            'Developed and implemented company-wide HR policies to ensure compliance with labor laws and improve workplace culture.',
            'Spearheaded initiatives to boost employee satisfaction, resulting in a 90% retention rate.',
            'Led diversity and inclusion programs, increasing minority recruitment by 30%.',
          ]}
        />
      </Section>

      <Section title="Education" accent={accent}>
        <div style={{ fontSize: '6.5px' }}>Master, Human Resources, Dallas, Sep 2007 — May 2011</div>
        <div style={{ fontSize: '6.5px', marginTop: '1px' }}>The University of Texas</div>
      </Section>

      <Section title="Skills" accent={accent}>
        <SkillRow label="HR Operations" value="Hiring, Termination, Performance Management" />
        <SkillRow label="Compliance" value="Labor Laws, OSHA, Employment Regulations" />
        <SkillRow label="People Strategy" value="Diversity, Inclusion, Talent Acquisition" />
        <SkillRow label="Training" value="Onboarding, Leadership Development, Mentoring" />
        <SkillRow label="Soft Skills" value="Detail-oriented, Platform expertise, Analytics, Communication" />
      </Section>
    </div>
  )
}

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent: string }) {
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

function ExpEntry({
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontStyle: 'italic', fontSize: '6.5px', marginTop: '1px', gap: '5px' }}>
        <span>{company}</span>
        <span style={{ flexShrink: 0 }}>{date}</span>
      </div>
      <ul style={{ margin: '2px 0 0', padding: 0, listStyle: 'none' }}>
        {items.map((item, idx) => (
          <li key={idx} style={{ fontSize: '5.5px', marginBottom: '0.5px', paddingLeft: '7px', textIndent: '-5px', lineHeight: 1.4 }}>
            • {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
