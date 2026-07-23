import React from 'react'
import { COLOR_TEXT, COLOR_DIVIDER, SkillRow } from './_shared'
import { CRIMSON_DEFAULT_ACCENT } from '../CatalogueThumbnail'

export function CrimsonThumbnail({ accentColor }: { accentColor?: string }) {
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
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: accent, marginBottom: '2px' }}>
          Jessie Smith
        </div>
        <div style={{ fontSize: '7px', marginBottom: '3px' }}>Human Resource Manager</div>
        <div style={{ borderTop: `3px solid ${accent}`, margin: '4px 0' }} />
        <div style={{ fontSize: '6px', marginTop: '4px' }}>
          email@youremail.com{'  •  '}New York, USA{'  •  '}(469) 385-2948{'  •  '}LinkedIn{'  •  '}GitHub
        </div>
      </div>

      <Section title="Summary" accent={accent}>
        <p style={{ fontSize: '5.5px', textAlign: 'justify', margin: 0, lineHeight: 1.45 }}>
          Human resources generalist with 8 years of experience in HR, including hiring and terminating, disciplining employees, and helping department managers improve employee performance. Worked with labor unions to negotiate compensation packages for workers. Organized new hire training initiatives as well as ongoing training to adhere to workplace safety standards. Worked with OSHA to ensure that all safety regulations are followed.
        </p>
      </Section>

      <Section title="Experience" accent={accent}>
        <ExpEntry
          title="Human Resource Manager"
          date="Apr 2019 - Current"
          company="Jim's Widget Factory, Plano, TX"
          items={[
            'Implement effective company policies to ensure all practices comply with labor regulations.',
            'Increased employee retention rates by managing workplace satisfaction to a 90% success rate.',
            'Develop targeted outreach practices to increase minority recruitment and ensure compliance.',
          ]}
        />
        <ExpEntry
          title="Workplace Culture & Compliance Specialist"
          date="Sep 2016 - Mar 2019"
          company="Acme Corp, Dallas, TX"
          items={[
            'Ensured HR policies aligned with state and federal regulations, maintaining 100% compliance.',
            'Implemented a conflict resolution system, decreasing workplace disputes by 40%.',
            'Organized leadership training sessions to enhance managerial effectiveness.',
          ]}
        />
        <ExpEntry
          title="Talent Acquisition & Retention Lead"
          date="Jan 2012 - Dec 2015"
          company="Jim's Widget Factory, Plano, TX"
          items={[
            'Developed and implemented company-wide HR policies to ensure compliance with labor laws.',
            'Spearheaded initiatives to boost employee satisfaction, resulting in a 90% retention rate.',
            'Led diversity and inclusion programs, increasing minority recruitment by 30%.',
          ]}
        />
      </Section>

      <Section title="Education" accent={accent}>
        <EduEntry degree="Master, Human Resources" date="Sep 2007 - May 2011" school="The University of Texas, Dallas" />
      </Section>

      <Section title="Skills" accent={accent}>
        <SkillRow label="HR Operations" value="Hiring, Termination, Performance Management" />
        <SkillRow label="Compliance" value="Labor Laws, OSHA, Employment Regulations" />
        <SkillRow label="People Strategy" value="Diversity, Inclusion, Talent Acquisition" />
        <SkillRow label="Training" value="Onboarding, Leadership Development, Mentoring" />
        <SkillRow label="Soft Skills" value="Leadership, Communication, Analytical Thinking" />
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

function ExpEntry({
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
          <li key={idx} style={{ fontSize: '5.5px', marginBottom: '0.5px', paddingLeft: '7px', textIndent: '-5px', lineHeight: 1.4 }}>
            • {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function EduEntry({ degree, date, school }: { degree: string; date: string; school: string }) {
  return (
    <div style={{ marginBottom: '3px' }}>
      <div style={{ fontSize: '7px', fontWeight: 'bold' }}>{degree}, <span style={{ fontWeight: 'normal' }}>{date}</span></div>
      <div style={{ fontSize: '6.5px', marginTop: '1px' }}>{school}</div>
    </div>
  )
}
