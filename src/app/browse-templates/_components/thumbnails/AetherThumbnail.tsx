import React from 'react'
import { COLOR_TEXT, COLOR_DIVIDER, SkillRow } from './_shared'
import { AETHER_DEFAULT_ACCENT } from '../CatalogueThumbnail'

export function AetherThumbnail({ accentColor }: { accentColor?: string }) {
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

      <Section title="SUMMARY" accent={accent}>
        <p style={{ fontSize: '5.5px', textAlign: 'justify', margin: 0, lineHeight: 1.45 }}>
          Results-Driven Full Stack Developer with 5+ years building scalable web applications, expertise in React and Node.js, and a track record of reducing load times by 40% while serving 100K+ users
        </p>
      </Section>

      <Section title="SKILLS" accent={accent}>
        <SkillRow label="Programming Languages" value="Java, Python, JavaScript" />
        <SkillRow label="Web Technologies" value="HTML, CSS, TypeScript" />
        <SkillRow label="Frameworks" value="React.js, Node.js, Express.js" />
        <SkillRow label="Database" value="MongoDB, MySQL, PostgreSQL, Firebase" />
        <SkillRow label="Testing" value="Jest, React Testing Library, Postman, Manual Testing" />
        <SkillRow label="Tools & DevOps" value="Git, GitHub, VS Code, Jira, Docker basics" />
      </Section>

      <Section title="EDUCATION" accent={accent}>
        <EduEntry degree="Master of Science in Software Engineering" date="Jun 20 – May 22" school="Delhi Technological University - [DTU]" />
        <EduEntry degree="Bachelor of Science in Computer Science" date="Jun 16 – Apr 20" school="University of Mumbai" />
      </Section>

      <Section title="EXPERIENCE" accent={accent}>
        <ExpEntry
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
        <ExpEntry
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
      </Section>
    </div>
  )
}

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent: string }) {
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

function ExpEntry({
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
