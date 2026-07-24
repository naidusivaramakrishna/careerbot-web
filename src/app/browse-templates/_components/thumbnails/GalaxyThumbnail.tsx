import React from 'react'
import { COLOR_TEXT, COLOR_DIVIDER, SkillRow } from './_shared'
import { GALAXY_DEFAULT_ACCENT } from '../CatalogueThumbnail'

export function GalaxyThumbnail({ accentColor }: { accentColor?: string }) {
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
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: accent, letterSpacing: '0.05em', marginBottom: '3px' }}>
          ANANYA NAIR
        </div>
        <div style={{ fontSize: '6px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          Hyderabad, India | ananyanair@gmail.com | +91 9875463201 | linkedin.com/in/ananyanair | github.com/ananyanair
        </div>
      </div>

      <Section title="PROFESSIONAL SUMMARY" accent={accent}>
        <p style={{ fontSize: '5.5px', textAlign: 'justify', margin: 0, lineHeight: 1.45 }}>
          Software Engineer with 2 years of experience building full-stack web applications using modern technologies. Proven expertise in MERN stack development with strong focus on clean code and user experience. Successfully delivered production applications impacting 10K+ users. Passionate about continuous learning and contributing to collaborative engineering teams.
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

      <Section title="PROFESSIONAL EXPERIENCE" accent={accent}>
        <ExpEntry
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
      </Section>

      <Section title="EDUCATION" accent={accent}>
        <EduEntry degree="Master of Science in Software Engineering" date="Jun 2020 – May 2022" school="Delhi Technological University (DTU), New Delhi" />
        <EduEntry degree="Bachelor of Technology in Computer Science" date="Jun 2016 – May 2020" school="National Institute of Technology (NIT), Warangal" />
      </Section>

      <Section title="CERTIFICATIONS" accent={accent}>
        <CertItem name="Java Programming Certification" issuer="Oracle Academy | Coursera" year="2023" />
        <CertItem name="Git and GitHub Certification" issuer="Coursera" year="2023" />
        <CertItem name="Full Stack Web Development Bootcamp" issuer="Udemy" year="2024" />
        <CertItem name="Problem Solving (Basic)" issuer="HackerRank" year="2024" />
      </Section>
    </div>
  )
}

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent: string }) {
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

function ExpEntry({
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '5px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '7px' }}>{degree}</span>
        <span style={{ fontSize: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>{date}</span>
      </div>
      <div style={{ fontSize: '6.5px', fontStyle: 'italic', marginTop: '1px' }}>{school}</div>
    </div>
  )
}

function CertItem({ name, issuer, year }: { name: string; issuer: string; year: string }) {
  return (
    <div style={{ fontSize: '6px', marginBottom: '1px', paddingLeft: '7px', textIndent: '-5px', lineHeight: 1.4 }}>
      • <span style={{ fontWeight: 'bold' }}>{name}</span> | {issuer} | {year}
    </div>
  )
}
