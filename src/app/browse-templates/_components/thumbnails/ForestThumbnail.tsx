import React from 'react'
import { COLOR_TEXT, COLOR_DIVIDER, SkillRow } from './_shared'
import { FOREST_DEFAULT_ACCENT } from '../CatalogueThumbnail'

export function ForestThumbnail({ accentColor }: { accentColor?: string }) {
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
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '17px', fontWeight: 'bold', color: accent, marginBottom: '4px' }}>
          Samantha Williams
        </div>
        <div style={{ fontSize: '6.5px', marginBottom: '2px' }}>Senior Sales Associate</div>
        <div style={{ fontSize: '6.5px', marginBottom: '2px' }}>New York, NY</div>
        <div className="flex gap-2 items-center justify-center">
          <span>samantha.williams@example.com</span>
          <span>(555) 789-1234</span>
          <span>LinkedIn</span>
          <span>GitHub</span>
        </div>
      </div>

      <div style={{ borderTop: `0.5px solid ${COLOR_DIVIDER}`, margin: '6px 0' }} />

      <Section title="SUMMARY" accent={accent}>
        <p style={{ fontSize: '5.5px', textAlign: 'justify', margin: 0, lineHeight: 1.45 }}>
          Senior Analyst with 5+ years of experience in data analysis, business intelligence, and process optimization. Skilled in driving operational efficiency, forecasting, and leading data-driven strategies to support business decisions and improvements. Strong communicator focused on results.
        </p>
      </Section>

      <Section title="EXPERIENCE" accent={accent}>
        <ExpEntry
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
        <ExpEntry
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
      </Section>

      <Section title="EDUCATION" accent={accent}>
        <EduEntry
          institution="New York University - New York, NY"
          degree="Bachelor of Science"
          subject="Economics"
          date="Sep 2013 - May 2017"
          accent={accent}
        />
      </Section>

      <Section title="SKILLS" accent={accent}>
        <SkillRow label="Programming Languages" value="Java, Python, JavaScript" />
        <SkillRow label="Web Technologies" value="HTML, CSS, TypeScript" />
        <SkillRow label="Frameworks" value="React.js, Node.js, Express.js" />
        <SkillRow label="Database" value="MongoDB, MySQL, PostgreSQL, Firebase" />
        <SkillRow label="Testing" value="Jest, React Testing Library, Postman, Manual Testing" />
        <SkillRow label="Tools & DevOps" value="Git, GitHub, VS Code, Jira, Docker basics" />
      </Section>
    </div>
  )
}

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent: string }) {
  return (
    <div style={{ marginTop: '5px' }}>
      <div style={{ fontSize: '9px', fontWeight: 'bold', color: accent, letterSpacing: '0.05em', marginBottom: '3px' }}>
        {title}
      </div>
      <div>{children}</div>
    </div>
  )
}

function ExpEntry({
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
        <span style={{ fontWeight: 'bold' }}>{role}</span> | {date}
      </div>
      <div style={{ fontSize: '6.5px', marginTop: '1px' }}>{company}</div>
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

function EduEntry({
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
      <div style={{ fontSize: '7px', fontWeight: 'bold' }}>
        {institution} | {degree}
      </div>
      <div style={{ fontSize: '6.5px', marginTop: '1px' }}>
        {subject} | {date}
      </div>
    </div>
  )
}
