import React from 'react'
import { COLOR_TEXT, COLOR_DIVIDER, SkillRow } from './_shared'
import { PILLAR_DEFAULT_ACCENT } from '../CatalogueThumbnail'

export function PillarThumbnail({ accentColor }: { accentColor?: string }) {
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
      <div style={{ borderLeft: `2.5px solid ${accent}`, paddingLeft: '8px', marginBottom: '5px' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: accent, marginBottom: '2px' }}>Suma Rathod</div>
        <div style={{ fontSize: '6px' }}>sumarathod@gmail.com</div>
        <div style={{ fontSize: '6px' }}>+91 9848761230</div>
        <div style={{ fontSize: '6px' }}>Hyderabad, India</div>
      </div>

      <div style={{ borderTop: `0.5px solid ${COLOR_DIVIDER}`, margin: '4px 0 6px' }} />

      <Section title="Summary" accent={accent}>
        <p style={{ fontSize: '5.5px', textAlign: 'justify', margin: 0, lineHeight: 1.45 }}>
          Results-Driven Full Stack developer with 5+ years building scalable web applications, expertise in React and Node.js and a track record of reducing load times by 40% while serving 100k+ users.
        </p>
      </Section>

      <Section title="Experience" accent={accent}>
        <ExpEntry
          role="Senior Software Engineer"
          company="Tech Innovation Inc | Hyderabad, India"
          date="Apr 24 - Present"
          items={[
            'Designed and implemented scalable cloud-based infrastructure, resulting in 40% cost savings and 50% increase in system capacity for Tech Innovations Inc.',
            'Led migration of legacy services to a microservices architecture, improving deployment frequency by 3x.',
          ]}
        />
        <ExpEntry
          role="Software Engineer"
          company="WebCraft Solutions | Bangalore, India"
          date="Jul 21 - Mar 24"
          items={[
            'Built customer-facing React dashboards used by 100k+ monthly active users.',
            'Optimised PostgreSQL queries and added caching, reducing average API latency by 40%.',
          ]}
        />
      </Section>

      <Section title="Education" accent={accent}>
        <EduEntry degree="Master of Science in Software Engineering" school="Delhi Technological University | DTU" date="Jun 20 - May 22" />
        <EduEntry degree="Bachelor of Science in Computer Science" school="University of Mumbai" date="Jun 16 - May 20" />
      </Section>

      <Section title="Skills" accent={accent} last>
        <SkillRow label="Programming Languages" value="Python, JavaScript, PHP, Java" />
        <SkillRow label="Frameworks" value="FastAPI, React, Node.js, Express" />
        <SkillRow label="Databases" value="MongoDB, PostgreSQL, Redis" />
        <SkillRow label="Cloud & DevOps" value="AWS, Docker, GitHub Actions, Kubernetes" />
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
      <div style={{ fontSize: '9px', fontWeight: 'bold', color: accent, marginBottom: '3px' }}>{title}</div>
      <div>{children}</div>
      {!last && <div style={{ borderTop: `0.5px solid ${COLOR_DIVIDER}`, margin: '5px 0' }} />}
    </>
  )
}

function ExpEntry({
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
          <li key={idx} style={{ fontSize: '5.5px', marginBottom: '0.5px', paddingLeft: '7px', textIndent: '-5px', lineHeight: 1.4 }}>
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
      <div style={{ fontSize: '7px', fontWeight: 'bold' }}>{degree}</div>
      <div style={{ fontSize: '6.5px', marginTop: '1px' }}>{school}</div>
      <div style={{ fontSize: '6.5px', marginTop: '0.5px' }}>{date}</div>
    </div>
  )
}
