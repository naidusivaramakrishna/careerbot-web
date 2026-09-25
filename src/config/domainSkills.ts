export type SkillDomain =
  | 'general'
  | 'software_engineering'
  | 'core_engineering'
  | 'healthcare'
  | 'finance'
  | 'education'
  | 'cybersecurity'
  | 'electronics_and_vlsi'
  | 'government_standard'
  | 'legal'
  | 'logistics_warehouse_operations'
  | 'marine_merchant_navy'
  | 'research_scholar'
  | 'sales_business_development'
  | 'customer_support_service'
  | 'product_engineering_leadership'
  | 'marketing_creative'
  | 'operations_management'
  | 'human_resources';

export interface SkillCategory {
  key: string;
  label: string;
  placeholder: string;
  suggestions: string[];
}

// General domain - default for all templates
const GENERAL_SKILLS: SkillCategory[] = [
  {
    key: 'programming_languages',
    label: 'Programming Languages',
    placeholder: 'e.g., Python, JavaScript, Java...',
    suggestions: [
      'Python',
      'JavaScript',
      'TypeScript',
      'Java',
      'C++',
      'C#',
      'Go',
      'Rust',
      'Swift',
      'Kotlin',
      'PHP',
      'Ruby',
    ],
  },
  {
    key: 'frameworks',
    label: 'Frameworks & Libraries',
    placeholder: 'e.g., React, Django, FastAPI...',
    suggestions: [
      'React',
      'Angular',
      'Vue.js',
      'Next.js',
      'Django',
      'FastAPI',
      'Flask',
      'Node.js',
      'Express.js',
      'Spring Boot',
      'ASP.NET',
      'Laravel',
    ],
  },
  {
    key: 'project_management',
    label: 'Project Management',
    placeholder: 'e.g., Agile, Scrum, PMP...',
    suggestions: [
      'Agile',
      'Scrum',
      'Kanban',
      'Waterfall',
      'PRINCE2',
      'PMP',
      'Six Sigma',
      'Lean',
      'Risk Management',
      'Budgeting',
      'Stakeholder Management',
      'Change Management',
    ],
  },
  {
    key: 'marketing_sales',
    label: 'Marketing & Sales',
    placeholder: 'e.g., SEO, CRM, Digital Marketing...',
    suggestions: [
      'Digital Marketing',
      'SEO',
      'Social Media Marketing',
      'Content Marketing',
      'Email Marketing',
      'Market Research',
      'CRM',
      'Brand Management',
      'Sales Strategy',
      'Google Analytics',
      'Lead Generation',
      'Copywriting',
    ],
  },
  {
    key: 'soft_skills',
    label: 'Soft Skills',
    placeholder: 'e.g., Leadership, Communication...',
    suggestions: [
      'Leadership',
      'Team Collaboration',
      'Problem Solving',
      'Communication',
      'Time Management',
      'Critical Thinking',
      'Adaptability',
      'Creativity',
    ],
  },
];

// Healthcare domain
const HEALTHCARE_SKILLS: SkillCategory[] = [
  {
    key: 'clinical_skills',
    label: 'Clinical Skills & Diagnostics',
    placeholder: 'e.g., Patient Assessment, ECG Interpretation...',
    suggestions: [
      'Patient History Taking & Physical Examination',
      'Clinical Diagnosis & Treatment Planning',
      'IV Insertion & Blood Draw',
      'Phlebotomy',
      'Urinary Catheterization',
      'ECG Interpretation',
      'Basic Ultrasound (Abdominal, Cardiac)',
      'Laboratory Test Interpretation',
      'Vital Signs Monitoring',
      'Patient Counseling & Health Education',
      'Care Coordination',
      'Medical Examination',
      'Clinical Procedures',
    ],
  },
  {
    key: 'healthcare_compliance',
    label: 'Healthcare Operations & Compliance',
    placeholder: 'e.g., HIPAA, EHR Management...',
    suggestions: [
      'Electronic Health Records (EHR) Management',
      'Medical Documentation & Clinical Notes',
      'HIPAA & Regulatory Compliance',
      'Patient Safety Protocols',
      'Hospital-Acquired Infection Prevention',
      'Discharge Planning & Follow-up Care',
      'Quality Assurance in Healthcare',
      'Healthcare Privacy & Confidentiality',
      'Medical Records Management',
      'Patient Safety Standards',
      'Infection Control',
      'Risk Management',
    ],
  },
  {
    key: 'healthcare_systems',
    label: 'Disease Management & Pharmacology',
    placeholder: 'e.g., Diabetes Management, Cardiovascular Medications...',
    suggestions: [
      'Diabetes Mellitus (Type I & II)',
      'Hypertension & Cardiovascular Disease',
      'Respiratory Infections Management',
      'Acute Coronary Syndrome (ACS) Management',
      'Gastroenterological Disorders',
      'Urinary Tract Infections',
      'Cardiovascular Medications (ACE Inhibitors, Beta Blockers, Statins)',
      'Antidiabetic Agents & Insulin Management',
      'Antibiotics & Antimicrobials',
      'GI Medications & Proton Pump Inhibitors',
      'Drug Interactions & Adverse Effects',
      'Pharmaceutical Knowledge & Drug Interactions',
    ],
  },
  {
    key: 'soft_skills',
    label: 'Soft Skills',
    placeholder: 'e.g., Patient Communication, Leadership...',
    suggestions: [
      'Patient Communication & Empathy',
      'Active Listening',
      'Team Leadership & Collaboration',
      'Physician-Patient Collaboration',
      'Stress Management',
      'Critical Thinking & Problem Solving',
      'Attention to Detail',
      'Time Management',
      'Clinical Decision-Making',
      'Inter-departmental Collaboration',
      'Mentoring & Training',
    ],
  },
];

// Legal domain
const LEGAL_SKILLS: SkillCategory[] = [
  {
    key: 'legal_practice',
    label: 'Legal Practice Areas',
    placeholder: 'e.g., Corporate Law, Mergers & Acquisitions, Litigation...',
    suggestions: [
      'Corporate Law & Governance',
      'Mergers & Acquisitions (M&A)',
      'Commercial Contracts & Negotiation',
      'Intellectual Property Law',
      'Litigation & Dispute Resolution',
      'Regulatory Compliance',
      'Securities Law',
      'Real Estate & Infrastructure Law',
      'Employment Law',
      'Tax Law',
      'International Law',
      'Administrative Law',
    ],
  },
  {
    key: 'legal_research',
    label: 'Legal Research & Writing',
    placeholder: 'e.g., Contract Drafting, Due Diligence, Legal Opinion...',
    suggestions: [
      'Legal Research & Precedent Analysis',
      'Legal Writing & Documentation',
      'Complex Contract Drafting',
      'Transaction Structuring & Negotiation',
      'Due Diligence Leadership',
      'Litigation Strategy & Court Representation',
      'Legal Opinion & Advisories',
      'Legal Memoranda & Briefs',
      'Case Analysis',
      'Statutory Interpretation',
      'Arbitration & ADR',
      'Expert Witness Preparation',
    ],
  },
  {
    key: 'legal_compliance',
    label: 'Legal Compliance & Regulations',
    placeholder: 'e.g., Regulatory Strategy, Compliance Monitoring, Risk Assessment...',
    suggestions: [
      'Regulatory Compliance Strategy',
      'Due Diligence Procedures',
      'Risk Assessment & Mitigation',
      'Regulatory Investigation',
      'Compliance Monitoring & Auditing',
      'Policy Development & Governance',
      'FEMA Compliance',
      'GST & Income Tax Law',
      'Competition Law',
      'Data Privacy (DPDP)',
      'Insolvency & Bankruptcy Code (IBC)',
      'Third-Party Risk Management',
    ],
  },
  {
    key: 'soft_skills',
    label: 'Soft Skills',
    placeholder: 'e.g., Negotiation, Team Leadership, Client Management...',
    suggestions: [
      'Negotiation & Deal Closure',
      'Legal Team Management & Mentoring',
      'Client Relationship Management',
      'Matter Management & Process Optimization',
      'Oral Advocacy & Public Speaking',
      'Analytical Thinking & Problem Solving',
      'Attention to Detail',
      'Time Management',
      'Professional Communication',
      'Board-Level Counsel',
      'Leadership & Strategic Decision Making',
    ],
  },
];

// Government domain
const GOVERNMENT_SKILLS: SkillCategory[] = [
  {
    key: 'government_operations',
    label: 'Government Operations',
    placeholder: 'e.g., Policy Development, Procurement...',
    suggestions: [
      'Policy Development',
      'Procurement',
      'Budget Management',
      'Government Affairs',
      'Public Administration',
      'Interagency Coordination',
      'Federal Regulations',
      'Mission Planning',
      'Strategic Planning',
      'Project Management',
    ],
  },
  {
    key: 'government_compliance',
    label: 'Government Compliance & Security',
    placeholder: 'e.g., Security Clearance, FCIP...',
    suggestions: [
      'Security Clearance Management',
      'FISMA Compliance',
      'NIST Standards',
      'OMB Compliance',
      'Federal Regulations',
      'Security Protocols',
      'Access Controls',
      'Audit Procedures',
      'Risk Management',
      'Whistleblower Protections',
    ],
  },
  {
    key: 'soft_skills',
    label: 'Soft Skills',
    placeholder: 'e.g., Stakeholder Management, Leadership...',
    suggestions: [
      'Stakeholder Management',
      'Leadership',
      'Cross-functional Collaboration',
      'Communication',
      'Problem Solving',
      'Decision Making',
      'Critical Thinking',
      'Adaptability',
      'Negotiation',
    ],
  },
];

// Marine/Maritime domain
const MARINE_MERCHANT_SKILLS: SkillCategory[] = [
  {
    key: 'maritime_operations',
    label: 'Maritime Operations',
    placeholder: 'e.g., Vessel Command, Bridge Operations, Cargo Management...',
    suggestions: [
      'Vessel Command & Bridge Operations',
      'Advanced Navigation Systems (ECDIS, Radar, ARPA)',
      'International Cargo Operations Management',
      'Ship Stability & Ballast Operations',
      'Voyage Planning & Routing Optimization',
      'Port Authority Coordination',
      'Mooring & Anchoring Procedures',
      'Heavy Lift Cargo Operations',
      'Deck Operations & Maintenance',
      'Weather Routing & Route Optimization',
      'Equipment Maintenance & Budgeting',
      'Passage Planning for International Routes',
      'Marine Logistics & Supply Chain',
    ],
  },
  {
    key: 'maritime_regulations',
    label: 'Maritime Regulations & Compliance',
    placeholder: 'e.g., ISM Code, SOLAS, MARPOL Compliance...',
    suggestions: [
      'ISM Code & Maritime Safety Management',
      'International Maritime Regulations (SOLAS, MARPOL, IBC)',
      'Maritime Safety Excellence Management',
      'Environmental Protection & Compliance',
      'International Maritime Law',
      'Ship Security Officer (SSO) Compliance',
      'Ballast Water Management',
      'International Oil Pollution Prevention (IOPPC)',
      'International Dangerous Goods (IMDG) Code',
      'Container Securing & Cargo Securing Procedures',
      'Port State Control Procedures',
      'Vessel Inspection & Classification',
      'Crew Certification & Compliance',
    ],
  },
  {
    key: 'maritime_crew_management',
    label: 'Crew Management',
    placeholder: 'e.g., Crew Leadership, Training, Performance Management...',
    suggestions: [
      'Crew Leadership & Management (20+ personnel)',
      'Advanced Crew Training & Development',
      'Watch Keeping & Scheduling',
      'Crew Welfare & Performance Evaluation',
      'Maritime Safety Drills & Briefings',
      'Team Leadership & Mentoring',
      'Junior Officer Development',
      'Conflict Resolution & Dispute Management',
      'Work Scheduling & Resource Optimization',
      'Crew Safety Culture Development',
      'Health & Safety Management',
      'Crisis Management & Emergency Response',
    ],
  },
  {
    key: 'soft_skills',
    label: 'Soft Skills',
    placeholder: 'e.g., Leadership, Crisis Management, Communication...',
    suggestions: [
      'Vessel Leadership & Command',
      'Maritime Communication (English)',
      'Decision Making Under Pressure',
      'Problem Solving & Critical Thinking',
      'Stress Management & Mental Resilience',
      'Teamwork & Collaboration',
      'Adaptability to Different Cultures',
      'Attention to Detail & Safety Culture',
      'Crisis Management & Emergency Response',
      'Stakeholder Communication (Port Authorities)',
      'Risk Assessment & Safety Management',
      'Professional Integrity & Ethics',
    ],
  },
];

// Cybersecurity domain
const CYBERSECURITY_SKILLS: SkillCategory[] = [
  {
    key: 'penetration_testing',
    label: 'Penetration Testing & Assessment',
    placeholder: 'e.g., Penetration Testing, Red Team Operations...',
    suggestions: [
      'Red Team Operations & Adversary Emulation',
      'Web Application Penetration Testing (OWASP Top 10)',
      'Advanced Web Application Testing (Business Logic Flaws)',
      'Network Penetration Testing',
      'Lateral Movement Techniques',
      'Exploitation Development',
      'Custom Payload Development',
      'Burp Suite Professional',
      'Metasploit Framework',
      'Network Scanning (Nmap/Nessus)',
      'IDA Pro / Ghidra Reverse Engineering',
      'Wireless Security Testing',
      'Cloud Penetration Testing',
    ],
  },
  {
    key: 'security_defense',
    label: 'Defensive Security & Incident Response',
    placeholder: 'e.g., Threat Hunting, SIEM, Incident Response...',
    suggestions: [
      'Threat Hunting & Threat Intelligence Correlation',
      'Incident Response Leadership',
      'Digital Forensics & Cyber Forensics',
      'Forensic Evidence Collection',
      'Malware Analysis',
      'SIEM Architecture & Tuning (Splunk, ELK Stack)',
      'Intrusion Detection/Prevention (IDS/IPS)',
      'Endpoint Detection & Response (EDR)',
      'Log Analysis & Correlation',
      'Root Cause Analysis',
      'Incident Documentation',
      'Wireshark Packet Analysis',
    ],
  },
  {
    key: 'security_compliance',
    label: 'Compliance, GRC & Risk Management',
    placeholder: 'e.g., NIST Framework, PCI-DSS, Risk Assessment...',
    suggestions: [
      'NIST Cybersecurity Framework',
      'CIS Controls Maturity Assessment',
      'PCI-DSS Compliance',
      'HIPAA Security Compliance',
      'SOC 2 Compliance',
      'ISO 27001 Compliance',
      'GDPR Compliance',
      'Vulnerability Management Program Design',
      'Risk Assessment & Mitigation Strategy',
      'Security Policy Development',
      'Compliance Auditing',
      'Security Governance',
      'Third-Party Risk Management',
    ],
  },
  {
    key: 'cloud_security',
    label: 'Cloud & Infrastructure Security',
    placeholder: 'e.g., AWS Security, Azure, Zero Trust Architecture...',
    suggestions: [
      'Cloud Security Architecture',
      'AWS Security (IAM, VPC, EC2, Lambda, Security Hub)',
      'Azure Security (AAD, Sentinel, Application Gateway)',
      'GCP Security & Fundamentals',
      'Zero Trust Architecture Design',
      'Container Security (Docker, Kubernetes)',
      'Cloud Vulnerability Assessment',
      'Infrastructure as Code Security',
      'Cloud Access Control',
      'Cloud Encryption & Data Protection',
      'AWS Lambda Security',
      'Azure Sentinel SIEM',
      'Cloudflare Security',
    ],
  },
  {
    key: 'soft_skills',
    label: 'Soft Skills',
    placeholder: 'e.g., Leadership, Problem Solving, Communication...',
    suggestions: [
      'Problem Solving & Critical Thinking',
      'Communication & Documentation',
      'Team Leadership & Mentoring',
      'Attention to Detail',
      'Analytical Skills',
      'Teamwork & Collaboration',
      'Stress Management',
      'Decision Making',
      'Adaptability',
      'Project Management',
    ],
  },
];

// Research Scholar domain
const RESEARCH_SCHOLAR_SKILLS: SkillCategory[] = [
  {
    key: 'programming_ml',
    label: 'Programming & Machine Learning',
    placeholder: 'e.g., Python, Deep Learning, TensorFlow...',
    suggestions: [
      'Python (Expert)',
      'R (Expert)',
      'Java (Advanced)',
      'SQL (Advanced)',
      'Deep Learning (TensorFlow, PyTorch, Keras)',
      'Advanced Machine Learning Algorithms',
      'Natural Language Processing',
      'Computer Vision',
      'Statistical Modeling',
      'Bayesian Inference',
      'Feature Engineering',
      'Model Optimization & Tuning',
    ],
  },
  {
    key: 'research_methodologies',
    label: 'Research Methodologies & Analysis',
    placeholder: 'e.g., Multi-omics Analysis, RNA-seq, Statistical Analysis...',
    suggestions: [
      'Multi-omics Analysis',
      'RNA-seq & Transcriptomics',
      'Single-Cell Genomics & scRNA-seq',
      'ChIP-seq & ATAC-seq Analysis',
      'Metabolomics & Proteomics',
      'Network Analysis & Pathway Analysis',
      'Survival Analysis',
      'Time-Series Analysis',
      'Data Visualization & Interpretation',
      'Literature Review & Meta-Analysis',
      'Experimental Design & Validation',
      'Biostatistics & Advanced Statistics',
    ],
  },
  {
    key: 'research_infrastructure',
    label: 'Research Infrastructure & Tools',
    placeholder: 'e.g., HPC Clusters, Cloud Computing, Docker, Workflow Tools...',
    suggestions: [
      'High-Performance Computing (HPC) Clusters (SLURM)',
      'Cloud Computing (AWS, GCP, Azure)',
      'Docker & Containerization',
      'Kubernetes & Orchestration',
      'Workflow Management (Nextflow, Snakemake)',
      'Version Control (Git, GitHub)',
      'Bioinformatics Software & Tools',
      'Database Management',
      'Linux/Unix System Administration',
      'Research Data Management',
      'Open Science & Reproducibility',
    ],
  },
  {
    key: 'research_leadership',
    label: 'Research Leadership & Grant Management',
    placeholder: 'e.g., Grant Writing, Team Leadership, Project Planning...',
    suggestions: [
      'Research Grant Writing & Management',
      'Proposal Development (NIH, NSF, EU Horizon)',
      'Team Leadership & Mentoring',
      'Project Planning & Execution',
      'Research Strategy Development',
      'Budget Planning & Resource Allocation',
      'Collaborative Research Networks',
      'Publication Strategy & Impact Assessment',
      'Research Ethics & Compliance',
      'Conference Presentations & Public Speaking',
      'Peer Review & Editorial Work',
      'Interdisciplinary Collaboration',
    ],
  },
  {
    key: 'soft_skills',
    label: 'Soft Skills',
    placeholder: 'e.g., Leadership, Communication, Problem Solving...',
    suggestions: [
      'Leadership & Decision Making',
      'Scientific Communication & Writing',
      'Presentation & Public Speaking',
      'Teamwork & Collaboration',
      'Problem Solving & Critical Thinking',
      'Time Management & Organization',
      'Attention to Detail',
      'Adaptability & Innovation',
      'Teaching & Knowledge Transfer',
      'Research Ethics & Integrity',
      'Interdisciplinary Communication',
      'Professional Development',
    ],
  },
];

// Software Engineering domain
const SOFTWARE_ENGINEERING_SKILLS: SkillCategory[] = [
  {
    key: 'programming_languages',
    label: 'Programming Languages',
    placeholder: 'e.g., Python, Java, JavaScript, Go...',
    suggestions: [
      'Python',
      'Java',
      'JavaScript/TypeScript',
      'C++',
      'Go',
      'Rust',
      'C#',
      'Ruby',
      'PHP',
      'Scala',
      'Kotlin',
      'Swift',
    ],
  },
  {
    key: 'frameworks_libraries',
    label: 'Frameworks & Libraries',
    placeholder: 'e.g., React, Spring Boot, Django...',
    suggestions: [
      'React / Vue / Angular',
      'Spring Boot',
      'Django / FastAPI',
      'Node.js / Express',
      'GraphQL / REST APIs',
      'Apache Kafka',
      'Docker & Kubernetes',
      'Microservices Architecture',
      'Flask / Flask-RESTful',
      'FastAPI',
      'Laravel',
      'ASP.NET Core',
    ],
  },
  {
    key: 'databases_data_storage',
    label: 'Databases & Data Storage',
    placeholder: 'e.g., PostgreSQL, MongoDB, Redis...',
    suggestions: [
      'PostgreSQL / MySQL',
      'MongoDB / NoSQL',
      'Redis / Caching',
      'Elasticsearch',
      'Firebase / Firestore',
      'AWS S3 / Cloud Storage',
      'Data Warehousing (Snowflake, Redshift)',
      'DynamoDB',
      'Oracle Database',
      'SQL Server',
      'Graph Databases (Neo4j)',
    ],
  },
  {
    key: 'cloud_devops',
    label: 'Cloud & DevOps',
    placeholder: 'e.g., AWS, Docker, CI/CD, Kubernetes...',
    suggestions: [
      'AWS (EC2, Lambda, RDS, S3)',
      'Google Cloud Platform',
      'Microsoft Azure',
      'Docker & Containerization',
      'Kubernetes & Orchestration',
      'CI/CD Pipelines (Jenkins, GitLab CI, GitHub Actions)',
      'Infrastructure as Code (Terraform)',
      'Monitoring & Logging (Prometheus, ELK)',
      'API Gateway & Load Balancing',
      'Serverless Architecture',
    ],
  },
  {
    key: 'soft_skills',
    label: 'Soft Skills',
    placeholder: 'e.g., Leadership, Communication, Problem-Solving...',
    suggestions: [
      'System Design & Architecture',
      'Problem Solving & Algorithm Design',
      'Code Review & Quality Assurance',
      'Communication & Documentation',
      'Team Collaboration & Leadership',
      'Agile / Scrum',
      'Technical Mentoring',
      'Project Management',
      'Debugging & Troubleshooting',
      'Performance Optimization',
    ],
  },
];

// Finance domain
const FINANCE_SKILLS: SkillCategory[] = [
  {
    key: 'financial_analysis',
    label: 'Financial Analysis & Modeling',
    placeholder: 'e.g., Financial Modeling, Valuation, Analysis...',
    suggestions: [
      'Financial Modeling & Forecasting',
      'Valuations (DCF, Comparables)',
      'Investment Analysis',
      'Portfolio Management',
      'Financial Statement Analysis',
      'Ratio Analysis & Metrics',
      'M&A Analysis',
      'Budget Planning & Variance Analysis',
      'Cost-Benefit Analysis',
      'Equity Research',
    ],
  },
  {
    key: 'accounting_auditing',
    label: 'Accounting & Auditing',
    placeholder: 'e.g., GAAP, IFRS, Audit, GL Management...',
    suggestions: [
      'GAAP & IFRS Compliance',
      'Journal Entry & General Ledger',
      'Financial Reporting & Statements',
      'Auditing & Internal Controls',
      'Tax Planning & Compliance',
      'Accounts Payable & Receivable',
      'Reconciliation & Close Process',
      'Statutory Audits',
      'Management Accounting',
      'ERP Systems (SAP, Oracle)',
    ],
  },
  {
    key: 'risk_compliance',
    label: 'Risk Management & Compliance',
    placeholder: 'e.g., Risk Assessment, Regulatory Compliance...',
    suggestions: [
      'Risk Assessment & Management',
      'Regulatory Compliance (Basel III, SOX)',
      'Anti-Money Laundering (AML)',
      'Know Your Customer (KYC)',
      'Data Privacy & GDPR',
      'Operational Risk',
      'Credit Risk Management',
      'Market Risk',
      'Compliance Monitoring',
      'Internal Audit',
    ],
  },
  {
    key: 'soft_skills',
    label: 'Soft Skills',
    placeholder: 'e.g., Leadership, Analytics, Communication...',
    suggestions: [
      'Financial Analysis & Analytics',
      'Communication & Stakeholder Management',
      'Problem Solving & Decision Making',
      'Team Leadership & Mentoring',
      'Attention to Detail',
      'Time Management',
      'Critical Thinking',
      'Vendor Management',
      'Negotiation Skills',
      'Business Acumen',
    ],
  },
];

// Education domain
const EDUCATION_SKILLS: SkillCategory[] = [
  {
    key: 'pedagogical_expertise',
    label: 'Pedagogical Expertise',
    placeholder: 'e.g., Curriculum Design, Teaching Methods...',
    suggestions: [
      'Curriculum Design & Development',
      'Instructional Design & Delivery',
      'Student-Centric Teaching Methods',
      'Blended Learning & e-Learning',
      'Assessment & Evaluation Design',
      'Learning Outcome Mapping',
      'Competency-Based Education',
      'Inclusive Teaching Practices',
      'Subject Matter Expertise',
      'Online Course Development',
    ],
  },
  {
    key: 'research_publication',
    label: 'Research & Publication',
    placeholder: 'e.g., Research Methodology, Publication...',
    suggestions: [
      'Research Methodology',
      'Academic Publishing',
      'Literature Review',
      'Thesis/Dissertation Guidance',
      'Grant Writing',
      'Research Paper Writing',
      'Citation Management (Zotero, Mendeley)',
      'Peer Review',
      'Conference Presentations',
      'Academic Collaboration',
    ],
  },
  {
    key: 'academic_leadership',
    label: 'Academic Leadership & Administration',
    placeholder: 'e.g., Department Leadership, Accreditation...',
    suggestions: [
      'Department Leadership & Management',
      'Academic Planning & Strategy',
      'Faculty Development & Mentoring',
      'Student Mentoring & Advising',
      'Accreditation & Quality Assurance',
      'Program Evaluation',
      'Admission & Enrollment Management',
      'Institutional Governance',
      'Academic Ethics & Integrity',
      'Budget Management',
    ],
  },
  {
    key: 'soft_skills',
    label: 'Soft Skills',
    placeholder: 'e.g., Communication, Leadership, Collaboration...',
    suggestions: [
      'Communication & Public Speaking',
      'Leadership & Decision Making',
      'Teamwork & Collaboration',
      'Student Engagement',
      'Time Management',
      'Critical Thinking',
      'Adaptability & Innovation',
      'Problem Solving',
      'Mentoring & Coaching',
      'Professional Development',
    ],
  },
];

// Finance domain (already defined above)

// Core Engineering domain
const CORE_ENGINEERING_SKILLS: SkillCategory[] = [
  {
    key: 'design_analysis',
    label: 'Design & Analysis',
    placeholder: 'e.g., CAD, Simulation, Structural Analysis...',
    suggestions: [
      'CAD (AutoCAD, CATIA, Pro/ENGINEER)',
      'FEA (Finite Element Analysis)',
      'CFD (Computational Fluid Dynamics)',
      'Simulation (ANSYS, Abaqus)',
      'Structural Design & Analysis',
      'Thermal Design & Analysis',
      'Vibration Analysis',
      'Stress Analysis',
      'Design Optimization',
      '3D Modeling & Visualization',
    ],
  },
  {
    key: 'manufacturing_operations',
    label: 'Manufacturing & Operations',
    placeholder: 'e.g., Manufacturing Processes, Quality Control...',
    suggestions: [
      'Manufacturing Processes & Techniques',
      'Machining & Material Processing',
      'Welding & Joining Processes',
      'Quality Control & Assurance',
      'Lean Manufacturing',
      'Six Sigma & Process Improvement',
      'Production Planning & Scheduling',
      'Tooling & Fixture Design',
      'Cost Estimation',
      'Supply Chain Management',
    ],
  },
  {
    // Must be the fixed key: the API resolves "Project Management" to its fixed
    // projectManagement field, so a separate key would vanish after a reload.
    key: 'project_management',
    label: 'Project Management',
    placeholder: 'e.g., Project Planning, Execution, Delivery...',
    suggestions: [
      'Project Planning & Scheduling',
      'Project Execution & Monitoring',
      'Resource Management',
      'Risk Management',
      'Vendor Management',
      'Budget Control',
      'Team Leadership',
      'Quality Management',
      'Stakeholder Management',
      'Project Documentation',
    ],
  },
  {
    key: 'soft_skills',
    label: 'Soft Skills',
    placeholder: 'e.g., Problem Solving, Communication, Leadership...',
    suggestions: [
      'Problem Solving & Analysis',
      'Communication & Documentation',
      'Team Leadership & Collaboration',
      'Attention to Detail',
      'Time Management',
      'Critical Thinking',
      'Adaptability',
      'Client Interaction',
      'Technical Mentoring',
      'Professional Development',
    ],
  },
];

// Government Standard domain
const GOVERNMENT_STANDARD_SKILLS: SkillCategory[] = [
  {
    key: 'governance_administration',
    label: 'Governance & Administration',
    placeholder: 'e.g., Urban Governance, Project Management...',
    suggestions: [
      'Urban Governance & Municipal Management',
      'Public Policy Formulation & Implementation',
      'Interagency Coordination & Stakeholder Management',
      'Revenue Administration & Land Records',
      'Disaster Management & Crisis Response',
      'Citizen Engagement & Public Services',
      'Administrative Law & Procedures',
      'Electoral Administration',
      'Land Acquisition & Dispute Resolution',
      'Public-Private Partnerships',
    ],
  },
  {
    key: 'financial_management',
    label: 'Financial Management & Budget Administration',
    placeholder: 'e.g., Budget Planning, Fund Management...',
    suggestions: [
      'Large-Scale Budget Administration',
      'Financial Management & Fund Allocation',
      'Public Finance & Accounting',
      'Capital Projects & Infrastructure Investment',
      'Cost-Benefit Analysis',
      'Expenditure Control & Audit',
      'Revenue Enhancement Strategies',
      'Financial Reporting & Compliance',
      'Procurement & Tender Management',
      'Asset Management',
    ],
  },
  {
    key: 'digital_governance',
    label: 'Digital Governance & Smart Systems',
    placeholder: 'e.g., Digital Platforms, Smart City Technology...',
    suggestions: [
      'Digital Governance & e-Government',
      'Smart City Technology & IoT',
      'Citizen Services Platform Development',
      'Data Analytics & Dashboard Design',
      'Digital Infrastructure Planning',
      'Cybersecurity & Data Privacy',
      'Digital Transformation',
      'GIS & Spatial Analysis',
      'Database Management',
      'Process Automation',
    ],
  },
  {
    key: 'soft_skills',
    label: 'Soft Skills',
    placeholder: 'e.g., Leadership, Communication, Problem-Solving...',
    suggestions: [
      'Leadership & Organizational Management',
      'Strategic Planning & Decision Making',
      'Communication & Public Speaking',
      'Negotiation & Conflict Resolution',
      'Team Building & Motivation',
      'Political Acumen & Sensitivity',
      'Ethical Governance & Transparency',
      'Crisis Management',
      'Stakeholder Management',
      'Professional Development',
    ],
  },
];

// Electronics & VLSI domain
const ELECTRONICS_VLSI_SKILLS: SkillCategory[] = [
  {
    key: 'digital_vlsi_design',
    label: 'Digital & VLSI Design',
    placeholder: 'e.g., Verilog, VHDL, Logic Design...',
    suggestions: [
      'Digital Logic Design',
      'Verilog / VHDL Programming',
      'RTL (Register Transfer Level) Design',
      'FPGA Design (Xilinx, Altera)',
      'Synthesis & Place & Route',
      'Static Timing Analysis',
      'Power Analysis & Optimization',
      'Design Verification & Simulation',
      'SystemVerilog & Assertions',
      'UVM (Universal Verification Methodology)',
    ],
  },
  {
    key: 'embedded_systems',
    label: 'Embedded Systems & Firmware',
    placeholder: 'e.g., ARM, RTOS, Embedded C, Protocols...',
    suggestions: [
      'ARM Architecture & Microcontroller Programming',
      'Real-Time Operating Systems (RTOS)',
      'Embedded C/C++ Programming',
      'Embedded Linux',
      'IoT Applications & Edge Computing',
      'Embedded Protocols (SPI, I2C, UART, CAN)',
      'Bootloader Development',
      'Firmware Development & Debugging',
      'Power Management & Optimization',
      'Sensor Integration',
    ],
  },
  {
    key: 'analog_design',
    label: 'Analog & Mixed Signal Design',
    placeholder: 'e.g., Analog Circuits, Op-Amps, Power Conversion...',
    suggestions: [
      'Analog Circuit Design',
      'Op-Amp & Amplifier Design',
      'Power Conversion & Regulation',
      'RF Circuit Design & Layout',
      'Analog Integrated Circuits',
      'Signal Conditioning',
      'PCB Layout & Design',
      'Electromagnetic Compatibility (EMC)',
      'Thermal Management',
      'Analog Simulation Tools (SPICE, ADS)',
    ],
  },
  {
    key: 'soft_skills',
    label: 'Soft Skills',
    placeholder: 'e.g., Problem Solving, Collaboration, Leadership...',
    suggestions: [
      'Problem Solving & Circuit Troubleshooting',
      'Technical Documentation & Datasheets',
      'Team Collaboration & Code Review',
      'Leadership & Project Management',
      'Communication & Presentation',
      'Attention to Detail',
      'Time Management',
      'Testing & Validation',
      'Performance Optimization',
      'Professional Development',
    ],
  },
];

// Logistics & Warehouse Operations domain
const LOGISTICS_WAREHOUSE_SKILLS: SkillCategory[] = [
  {
    key: 'warehouse_operations',
    label: 'Warehouse Operations & Management',
    placeholder: 'e.g., Warehouse Management, Inventory Control...',
    suggestions: [
      'Warehouse Management System (WMS)',
      'Inventory Control & Accuracy',
      'Material Handling & Storage',
      'Order Picking, Packing & Dispatch',
      'Receiving & Quality Inspection',
      'Safety Protocols & Compliance',
      'Space Optimization',
      'Equipment Operation & Maintenance',
      'Cycle Counting & Audits',
      'Warehouse Layout Design',
    ],
  },
  {
    key: 'supply_chain_logistics',
    label: 'Supply Chain & Logistics Management',
    placeholder: 'e.g., Logistics Planning, Transportation, Procurement...',
    suggestions: [
      'Logistics Planning & Optimization',
      'Transportation Management',
      'Route Planning & Optimization',
      'Supplier Management & Sourcing',
      'Procurement & Cost Management',
      'Demand Forecasting & Planning',
      'Supply Chain Analytics',
      'Customs Clearance & Documentation',
      'Last-Mile Delivery Management',
      'International Logistics',
    ],
  },
  {
    key: 'systems_tools',
    label: 'Systems & Tools',
    placeholder: 'e.g., ERP, Warehouse Management Systems, Analytics...',
    suggestions: [
      'ERP Systems (SAP, Oracle)',
      'Warehouse Management Systems (WMS)',
      'Transportation Management Systems (TMS)',
      'Business Intelligence & Analytics',
      'Excel & Data Analysis',
      'Barcode & RFID Systems',
      'Inventory Management Software',
      'Reporting & Dashboard Tools',
      'API Integration',
      'Process Automation',
    ],
  },
  {
    key: 'soft_skills',
    label: 'Soft Skills',
    placeholder: 'e.g., Leadership, Problem Solving, Communication...',
    suggestions: [
      'Leadership & Team Management',
      'Problem Solving & Troubleshooting',
      'Communication & Stakeholder Management',
      'Process Improvement & Optimization',
      'Attention to Detail',
      'Time Management',
      'Negotiation Skills',
      'Safety Awareness',
      'Customer Service',
      'Professional Development',
    ],
  },
];

// Sales & Business Development domain
const SALES_BUSINESS_DEV_SKILLS: SkillCategory[] = [
  {
    key: 'sales_competencies',
    label: 'Sales Competencies',
    placeholder: 'e.g., Sales Strategy, Negotiation, Closing...',
    suggestions: [
      'Sales Strategy & Planning',
      'Account Management & Relationship Building',
      'Sales Pipeline Management',
      'Negotiation & Closing Techniques',
      'Customer Relationship Management (CRM)',
      'Lead Generation & Prospecting',
      'Sales Forecasting & Reporting',
      'Territory Management',
      'Sales Presentations & Demos',
      'Customer Retention Strategies',
    ],
  },
  {
    key: 'business_development',
    label: 'Business Development & Growth',
    placeholder: 'e.g., Market Analysis, Partnership Strategy...',
    suggestions: [
      'Market Analysis & Research',
      'Business Strategy & Planning',
      'Partnership Development',
      'Channel Strategy & Development',
      'Market Entry Strategy',
      'Competitive Analysis',
      'Revenue Growth & Expansion',
      'Strategic Partnerships',
      'Joint Ventures & Alliances',
      'Business Case Development',
    ],
  },
  {
    key: 'tools_platforms',
    label: 'Tools & Platforms',
    placeholder: 'e.g., Salesforce, HubSpot, Excel...',
    suggestions: [
      'Salesforce CRM',
      'HubSpot',
      'Microsoft Dynamics',
      'Excel & Data Analysis',
      'Sales Analytics Tools',
      'Business Intelligence Platforms',
      'Email Marketing Tools',
      'Presentation Software',
      'Proposal Management Tools',
      'Contract Management Systems',
    ],
  },
  {
    key: 'soft_skills',
    label: 'Soft Skills',
    placeholder: 'e.g., Communication, Presentation, Leadership...',
    suggestions: [
      'Communication & Presentation',
      'Negotiation Skills',
      'Problem Solving & Adaptability',
      'Relationship Building',
      'Time Management',
      'Leadership & Coaching',
      'Customer Focus',
      'Resilience & Persistence',
      'Analytical Thinking',
      'Professional Development',
    ],
  },
];

// Customer Support & Account Management domain
const CUSTOMER_SUPPORT_SKILLS: SkillCategory[] = [
  {
    key: 'customer_success',
    label: 'Customer Success & Experience',
    placeholder: 'e.g., Customer Retention, Satisfaction, Support...',
    suggestions: [
      'Customer Success Management',
      'Customer Satisfaction & NPS',
      'Customer Retention Strategies',
      'Account Growth & Upsell/Cross-sell',
      'Onboarding & Implementation',
      'Customer Lifecycle Management',
      'Customer Support & Troubleshooting',
      'Issue Resolution & Escalation',
      'Feedback Management',
      'Customer Advocacy & Testimonials',
    ],
  },
  {
    key: 'account_management',
    label: 'Account & Relationship Management',
    placeholder: 'e.g., Account Strategy, Client Relations...',
    suggestions: [
      'Key Account Management',
      'Strategic Account Planning',
      'Client Relationship Management',
      'Account Performance Analysis',
      'Stakeholder Management',
      'Business Reviews & Meetings',
      'Contract & Renewal Management',
      'Churn Prevention',
      'Customer Communication Plans',
      'Account Expansion Strategies',
    ],
  },
  {
    key: 'tools_systems',
    label: 'Tools & Systems',
    placeholder: 'e.g., Salesforce, Zendesk, Helpdesk Software...',
    suggestions: [
      'Salesforce & CRM Systems',
      'Zendesk / Ticketing Systems',
      'Helpdesk Software',
      'Freshdesk / Intercom',
      'Customer Data Platforms',
      'Analytics & Reporting Tools',
      'Communication Platforms',
      'Project Management Tools',
      'Knowledge Management Systems',
      'Automation Tools',
    ],
  },
  {
    key: 'soft_skills',
    label: 'Soft Skills',
    placeholder: 'e.g., Communication, Empathy, Problem-Solving...',
    suggestions: [
      'Communication & Active Listening',
      'Empathy & Customer Empathy',
      'Problem Solving & Troubleshooting',
      'Patience & Resilience',
      'Time Management',
      'Multitasking',
      'Relationship Building',
      'Attention to Detail',
      'Leadership (for team leads)',
      'Professional Development',
    ],
  },
];

// Product & Engineering Leadership domain
const PRODUCT_ENGINEERING_SKILLS: SkillCategory[] = [
  {
    key: 'product_strategy',
    label: 'Product Strategy & Management',
    placeholder: 'e.g., Product Roadmap, Requirements, Strategy...',
    suggestions: [
      'Product Strategy & Vision',
      'Product Roadmap Development',
      'Requirements Gathering & Analysis',
      'User Stories & Acceptance Criteria',
      'Feature Prioritization & Backlog Management',
      'Product Metrics & Analytics',
      'Market Research & Competitive Analysis',
      'Go-to-Market Strategy',
      'Product Launch Management',
      'User Experience & Design Thinking',
    ],
  },
  {
    key: 'engineering_leadership',
    label: 'Engineering Leadership & Architecture',
    placeholder: 'e.g., System Architecture, Team Leadership...',
    suggestions: [
      'System Architecture & Design',
      'Technical Decision Making',
      'Engineering Team Leadership',
      'Mentoring & Development',
      'Performance Management',
      'Hiring & Talent Acquisition',
      'Code Quality & Standards',
      'Security & Compliance',
      'Scalability & Performance',
      'Technical Debt Management',
    ],
  },
  {
    key: 'cross_functional',
    label: 'Cross-Functional Leadership',
    placeholder: 'e.g., Stakeholder Management, Collaboration...',
    suggestions: [
      'Cross-Functional Collaboration',
      'Stakeholder Management',
      'Communication & Presentation',
      'Change Management',
      'Conflict Resolution',
      'Agile & Scrum Leadership',
      'OKR (Objectives & Key Results)',
      'Budget Management & Planning',
      'Risk Management',
      'Strategic Planning',
    ],
  },
  {
    key: 'soft_skills',
    label: 'Soft Skills',
    placeholder: 'e.g., Leadership, Vision, Communication...',
    suggestions: [
      'Leadership & Vision Setting',
      'Strategic Thinking',
      'Communication & Storytelling',
      'Decision Making & Problem Solving',
      'Emotional Intelligence',
      'Adaptability & Resilience',
      'Delegation & Empowerment',
      'Coaching & Mentoring',
      'Professional Development',
      'Business Acumen',
    ],
  },
];

// Marketing & Creative domain
const MARKETING_CREATIVE_SKILLS: SkillCategory[] = [
  {
    key: 'marketing_strategy',
    label: 'Marketing Strategy & Planning',
    placeholder: 'e.g., Campaign Strategy, Brand Strategy...',
    suggestions: [
      'Marketing Strategy & Planning',
      'Brand Strategy & Positioning',
      'Campaign Strategy & Execution',
      'Digital Marketing & Content',
      'Social Media Strategy & Management',
      'SEO & SEM Strategy',
      'Email Marketing & Automation',
      'Analytics & Performance Tracking',
      'Market Research & Consumer Insights',
      'Competitive Analysis',
    ],
  },
  {
    key: 'creative_design',
    label: 'Creative & Design',
    placeholder: 'e.g., Graphic Design, UX/UI, Video...',
    suggestions: [
      'Graphic Design & Visual Branding',
      'UX/UI Design',
      'Video Production & Editing',
      'Content Writing & Copywriting',
      'Photography & Asset Creation',
      'Adobe Creative Suite (Photoshop, Illustrator)',
      'Figma & Design Tools',
      'Animation & Motion Graphics',
      'Web Design',
      'Brand Guidelines & Standards',
    ],
  },
  {
    key: 'marketing_tools',
    label: 'Marketing Tools & Platforms',
    placeholder: 'e.g., Marketing Automation, Analytics...',
    suggestions: [
      'Marketing Automation (Marketo, Hubspot)',
      'Google Analytics & Data Analysis',
      'Google Ads & Facebook Ads',
      'Email Platforms (Mailchimp, Klaviyo)',
      'Social Media Management Tools',
      'CRM Systems (Salesforce)',
      'SEO Tools (SEMrush, Ahrefs)',
      'Content Management Systems (CMS)',
      'A/B Testing & Experimentation',
      'BI & Reporting Tools',
    ],
  },
  {
    key: 'soft_skills',
    label: 'Soft Skills',
    placeholder: 'e.g., Creativity, Communication, Collaboration...',
    suggestions: [
      'Creativity & Innovation',
      'Communication & Storytelling',
      'Collaboration & Teamwork',
      'Project Management',
      'Problem Solving',
      'Attention to Detail',
      'Time Management',
      'Presentation Skills',
      'Customer Focus',
      'Professional Development',
    ],
  },
];

// Operations & Management domain
const OPERATIONS_MANAGEMENT_SKILLS: SkillCategory[] = [
  {
    key: 'operations_strategy',
    label: 'Operations Strategy & Management',
    placeholder: 'e.g., Process Optimization, Operations Planning...',
    suggestions: [
      'Operations Strategy & Planning',
      'Process Design & Optimization',
      'Lean Manufacturing & Six Sigma',
      'Quality Management (ISO 9001)',
      'Supply Chain Optimization',
      'Cost Management & Reduction',
      'Capacity Planning',
      'Vendor Management',
      'Performance Metrics & KPIs',
      'Continuous Improvement',
    ],
  },
  {
    key: 'project_delivery',
    label: 'Project & Program Management',
    placeholder: 'e.g., Project Planning, Execution, Delivery...',
    suggestions: [
      'Project Planning & Scheduling',
      'Project Execution & Monitoring',
      'Program Management',
      'Risk & Issue Management',
      'Resource & Budget Management',
      'Stakeholder Communication',
      'Quality Assurance',
      'Change Management',
      'Documentation & Reporting',
      'Project Closure',
    ],
  },
  {
    key: 'business_analysis',
    label: 'Business Analysis & Analytics',
    placeholder: 'e.g., Business Analysis, Data Analytics...',
    suggestions: [
      'Business Analysis & Requirements',
      'Data Analysis & Interpretation',
      'Business Intelligence & Analytics',
      'Process Mapping & Flowcharting',
      'Financial Analysis',
      'Market & Competitor Analysis',
      'Dashboard Development',
      'Reporting & Visualization',
      'Forecasting & Projections',
      'Performance Analysis',
    ],
  },
  {
    key: 'soft_skills',
    label: 'Soft Skills',
    placeholder: 'e.g., Leadership, Communication, Problem-Solving...',
    suggestions: [
      'Leadership & Team Management',
      'Communication & Presentation',
      'Problem Solving & Decision Making',
      'Time Management & Organization',
      'Stakeholder Management',
      'Negotiation Skills',
      'Adaptability',
      'Attention to Detail',
      'Customer Focus',
      'Professional Development',
    ],
  },
];

// Human Resources domain
const HUMAN_RESOURCES_SKILLS: SkillCategory[] = [
  {
    key: 'talent_management',
    label: 'Talent Management & Acquisition',
    placeholder: 'e.g., Recruitment, Onboarding, Development...',
    suggestions: [
      'Talent Acquisition & Recruitment',
      'Candidate Screening & Interviewing',
      'Onboarding & Integration',
      'Talent Development & Training',
      'Career Planning & Development',
      'Performance Management',
      'Succession Planning',
      'Retention Strategies',
      'Employer Branding',
      'Job Description & Compensation',
    ],
  },
  {
    key: 'employee_relations',
    label: 'Employee Relations & Engagement',
    placeholder: 'e.g., Employee Relations, Engagement, Culture...',
    suggestions: [
      'Employee Relations & Engagement',
      'Organizational Culture Development',
      'Employee Wellness Programs',
      'Conflict Resolution & Mediation',
      'Communication & Transparency',
      'Recognition & Rewards Programs',
      'Team Building & Events',
      'Employee Surveys & Feedback',
      'Retention & Satisfaction',
      'Labor Relations',
    ],
  },
  {
    key: 'hr_operations',
    label: 'HR Operations & Administration',
    placeholder: 'e.g., HRIS, Payroll, Compliance...',
    suggestions: [
      'HRIS Systems & Databases',
      'Payroll & Benefits Administration',
      'Compensation & Benefits',
      'Employee Records Management',
      'Attendance & Leave Management',
      'HR Compliance & Regulations',
      'Policy Development & Implementation',
      'Document Management',
      'Reporting & Analytics',
      'Employee File Management',
    ],
  },
  {
    key: 'soft_skills',
    label: 'Soft Skills',
    placeholder: 'e.g., Communication, Leadership, Empathy...',
    suggestions: [
      'Communication & Interpersonal Skills',
      'Leadership & Influence',
      'Empathy & Emotional Intelligence',
      'Problem Solving & Conflict Resolution',
      'Confidentiality & Ethics',
      'Time Management',
      'Attention to Detail',
      'Organizational Skills',
      'Business Acumen',
      'Professional Development',
    ],
  },
];

export const DOMAIN_SKILLS: Record<SkillDomain, SkillCategory[]> = {
  general: GENERAL_SKILLS,
  software_engineering: SOFTWARE_ENGINEERING_SKILLS,
  core_engineering: CORE_ENGINEERING_SKILLS,
  healthcare: HEALTHCARE_SKILLS,
  finance: FINANCE_SKILLS,
  education: EDUCATION_SKILLS,
  cybersecurity: CYBERSECURITY_SKILLS,
  electronics_and_vlsi: ELECTRONICS_VLSI_SKILLS,
  government_standard: GOVERNMENT_STANDARD_SKILLS,
  legal: LEGAL_SKILLS,
  logistics_warehouse_operations: LOGISTICS_WAREHOUSE_SKILLS,
  marine_merchant_navy: MARINE_MERCHANT_SKILLS,
  research_scholar: RESEARCH_SCHOLAR_SKILLS,
  sales_business_development: SALES_BUSINESS_DEV_SKILLS,
  customer_support_service: CUSTOMER_SUPPORT_SKILLS,
  product_engineering_leadership: PRODUCT_ENGINEERING_SKILLS,
  marketing_creative: MARKETING_CREATIVE_SKILLS,
  operations_management: OPERATIONS_MANAGEMENT_SKILLS,
  human_resources: HUMAN_RESOURCES_SKILLS,
};

export function getSkillsForDomain(domain: SkillDomain): SkillCategory[] {
  return DOMAIN_SKILLS[domain] ?? GENERAL_SKILLS;
}

/** Category definition for an editor key, preferring the general list. */
export function findSkillCategory(key: string): SkillCategory | undefined {
  return (
    GENERAL_SKILLS.find((c) => c.key === key) ??
    Object.values(DOMAIN_SKILLS).flat().find((c) => c.key === key)
  );
}

// ── Category key ↔ backend category name ─────────────────────────────────────
// The skills API (careerbot-api app/shared/skills_taxonomy.py) stores the five
// fixed categories under their own fields and every other category under
// custom_skills[slugify_category(<name sent in the URL>)]. Add, delete and
// reload must therefore all go through the same name, and reload must map the
// slug back to the editor key.

const FIXED_API_CATEGORY_NAMES: Record<string, string> = {
  programming_languages: 'programmingLanguages',
  frameworks: 'frameworks',
  soft_skills: 'softSkills',
  project_management: 'projectManagement',
  marketing_sales: 'marketingSales',
};

const LABEL_BY_KEY: Record<string, string> = {};
Object.values(DOMAIN_SKILLS).forEach((categories) => {
  categories.forEach((c) => {
    if (!(c.key in LABEL_BY_KEY)) LABEL_BY_KEY[c.key] = c.label;
  });
});

/** Category name to send to the skills API for an editor category key. */
export function skillCategoryApiName(key: string): string {
  return FIXED_API_CATEGORY_NAMES[key] ?? LABEL_BY_KEY[key] ?? key;
}

/** Mirror of the backend's slugify_category (camel_to_snake + non-alnum → "_"). */
export function slugifySkillCategory(name: string): string {
  const snake = name
    .replace(/(.)([A-Z][a-z]+)/g, '$1_$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase();
  return snake.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'custom';
}

/**
 * Editor key of `domain`'s category stored under custom_skills[slug], or
 * undefined when the slug is not one of that domain's categories (then it is
 * a user-created category and stays in custom_categories).
 */
export function domainSkillKeyForSlug(slug: string, domain?: string | null): string | undefined {
  if (!domain) return undefined;
  const categories = DOMAIN_SKILLS[domain as SkillDomain];
  if (!categories) return undefined;
  const match = categories.find(
    (c) => !(c.key in FIXED_API_CATEGORY_NAMES) && slugifySkillCategory(skillCategoryApiName(c.key)) === slug,
  );
  return match?.key;
}

export function getDomainFromTemplate(templateName: string | undefined): SkillDomain {
  if (!templateName) return 'general';

  const name = templateName.toLowerCase();

  if (name.includes('healthcare')) return 'healthcare';
  if (name.includes('legal')) return 'legal';
  if (name.includes('government')) return 'government_standard';
  if (name.includes('marine') || name.includes('merchant') || name.includes('navy')) return 'marine_merchant_navy';
  if (name.includes('cybersecurity') || name.includes('cyber')) return 'cybersecurity';
  if (name.includes('research') || name.includes('scholar')) return 'research_scholar';
  if (name.includes('finance')) return 'finance';
  if (name.includes('education')) return 'education';
  if (name.includes('core_engineering') || name.includes('core')) return 'core_engineering';
  if (name.includes('electronics') || name.includes('vlsi')) return 'electronics_and_vlsi';
  if (name.includes('logistics') || name.includes('warehouse')) return 'logistics_warehouse_operations';
  if (name.includes('sales') || name.includes('business_development')) return 'sales_business_development';
  if (name.includes('customer') || name.includes('support') || name.includes('account')) return 'customer_support_service';
  if (name.includes('product') || name.includes('engineering_leadership')) return 'product_engineering_leadership';
  if (name.includes('marketing') || name.includes('creative')) return 'marketing_creative';
  if (name.includes('operations')) return 'operations_management';
  if (name.includes('human_resources') || name.includes('hr')) return 'human_resources';
  if (name.includes('software')) return 'software_engineering';

  return 'general';
}
