import React from 'react'
import { COLOR_TEXT, COLOR_DIVIDER, SkillRow } from './_shared'
import { OCEAN_DEFAULT_ACCENT } from '../CatalogueThumbnail'

export function OceanThumbnail({ accentColor }: { accentColor?: string }) {
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

      <Section title="SUMMARY" accent={accent}>
        <p style={{ fontSize: '5.5px', textAlign: 'justify', margin: 0, lineHeight: 1.45 }}>
          Results-Driven Full Stack Developer with 5+ years building scalable web applications, expertise in React and Node.js, and a track record of reducing load times by 40% while serving 100K+ users
        </p>
      </Section>

      <Section title="SKILLS" accent={accent}>
        <SkillRow label="Programming Languages" value="Python, JavaScript, PHP, Java" />
        <SkillRow label="Frameworks" value="FastAPI, React" />
        <SkillRow label="Databases" value="MongoDB" />
      </Section>

      <Section title="EDUCATION" accent={accent}>
        <EduEntry degree="Master of Science in Software Engineering" date="Jun 20 – May 22" school="Delhi Technological University - [DTU]" />
        <EduEntry degree="Bachelor of Science in Computer Science" date="Jun 16 – Apr 20" school="University of Mumbai" />
      </Section>

      <Section title="EXPERIENCE" accent={accent} last>
        <ExpEntry
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
        <ExpEntry
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
      </Section>
    </div>
  )
}

function Section({
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

function ExpEntry({ role, date, company, items }: { role: string; date: string; company: string; items: string[] }) {
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

function EduEntry({ degree, school, date }: { degree: string; school: string; date: string }) {
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
