export const FAMILY_TEMPLATES: Record<string, { id: number; image: string; previewUrl: string; previewUrls: Record<string, string>; description: string }> = {
  software_engineering: {
    id: 1, image: '/assets/templates/software_engineering.png',
    previewUrl: '/assets/templates/previews/software_engineering_early_career_resume.png',
    previewUrls: {
      'Fresher':         '/assets/templates/previews/software_engineering_fresher_resume.png',
      'Early Career':    '/assets/templates/previews/software_engineering_early_career_resume.png',
      'Mid-Level':       '/assets/templates/previews/software_engineering_mid_level_resume.png',
      'Senior-Level':    '/assets/templates/previews/software_engineering_senior_level_resume.png',
      'Lead':            '/assets/templates/previews/software_engineering_lead_resume.png',
      'Architect':       '/assets/templates/previews/software_engineering_architect_resume.png',
      'Manager':         '/assets/templates/previews/software_engineering_manager_resume.png',
      'Director':        '/assets/templates/previews/software_engineering_director_resume.png',
      'Vice President':  '/assets/templates/previews/software_engineering_vice_president_resume.png',
    },
    description: 'Modern template for tech professionals',
  },
  healthcare: {
    id: 2, image: '/assets/templates/healthcare.png',
    previewUrl: '/assets/templates/previews/healthcare_early_career_resume.png',
    previewUrls: {
      'Fresher':        '/assets/templates/previews/healthcare_fresher_resume.png',
      'Early Career':   '/assets/templates/previews/healthcare_early_career_resume.png',
      'Mid-Level':      '/assets/templates/previews/healthcare_mid_level_resume.png',
      'Senior-Level':   '/assets/templates/previews/healthcare_senior_level_resume.png',
      'Director':       '/assets/templates/previews/healthcare_director_resume.png',
    },
    description: 'Professional template for healthcare',
  },
  finance: {
    id: 3, image: '/assets/templates/finance.png',
    previewUrl: '/assets/templates/previews/finance_early_career_resume.png',
    previewUrls: {
      'Fresher':         '/assets/templates/previews/finance_fresher_resume.png',
      'Early Career':    '/assets/templates/previews/finance_early_career_resume.png',
      'Mid-Level':       '/assets/templates/previews/finance_mid_level_resume.png',
      'Senior-Level':    '/assets/templates/previews/finance_senior_level_resume.png',
      'Director':        '/assets/templates/previews/finance_director_resume.png',
      'Vice President':  '/assets/templates/previews/finance_vice_president_resume.png',
    },
    description: 'Professional layout for finance professionals',
  },
  education: {
    id: 4, image: '/assets/templates/education.png',
    previewUrl: '/assets/templates/previews/education_early_career_resume.png',
    previewUrls: {
      'Fresher':      '/assets/templates/previews/education_fresher_resume.png',
      'Early Career': '/assets/templates/previews/education_early_career_resume.png',
      'Mid-Level':    '/assets/templates/previews/education_mid_level_resume.png',
      'Senior-Level': '/assets/templates/previews/education_senior_level_resume.png',
      'Director':     '/assets/templates/previews/education_director_resume.png',
    },
    description: 'Template for educators and academics',
  },
  cybersecurity: {
    id: 5, image: '/assets/templates/cybersecurity.png',
    previewUrl: '/assets/templates/previews/cybersecurity_early_career.png',
    previewUrls: {
      'Fresher':        '/assets/templates/previews/cybersecurity_fresher.png',
      'Early Career':   '/assets/templates/previews/cybersecurity_early_career.png',
      'Mid-Level':      '/assets/templates/previews/cybersecurity_mid_level.png',
      'Senior-Level':   '/assets/templates/previews/cybersecurity_senior_level.png',
      'Architect':      '/assets/templates/previews/cybersecurity_architect.png',
      'Director':       '/assets/templates/previews/cybersecurity_director_resume.png',
    },
    description: 'Specialized template for security professionals',
  },
  core_engineering: {
    id: 6, image: '/assets/templates/core-engineering.png',
    previewUrl: '/assets/templates/previews/core_engineering_early_career_resume.png',
    previewUrls: {
      'Fresher':      '/assets/templates/previews/core_engineering_fresher_resume.png',
      'Early Career': '/assets/templates/previews/core_engineering_early_career_resume.png',
      'Mid-Level':    '/assets/templates/previews/core_engineering_mid_level_resume.png',
      'Senior-Level': '/assets/templates/previews/core_engineering_senior_level_resume.png',
      'Architect':    '/assets/templates/previews/core_engineering_architect_resume.png',
      'Manager':      '/assets/templates/previews/core_engineering_manager_resume.png',
      'Director':     '/assets/templates/previews/core_engineering_director_resume.png',
    },
    description: 'Template for mechanical, civil, and core engineers',
  },
  electronics_and_vlsi: {
    id: 7, image: '/assets/templates/electronics_vlsi.png',
    previewUrl: '/assets/templates/previews/electronics_and_vlsi_early_career.png',
    previewUrls: {
      'Fresher':      '/assets/templates/previews/electronics_and_vlsi_fresher.png',
      'Early Career': '/assets/templates/previews/electronics_and_vlsi_early_career.png',
      'Mid-Level':    '/assets/templates/previews/electronics_and_vlsi_mid_level.png',
      'Senior-Level': '/assets/templates/previews/electronics_and_vlsi_senior_level.png',
      'Architect':    '/assets/templates/previews/electronics_and_vlsi_architect.png',
      'Director':     '/assets/templates/previews/electronics_and_vlsi_director.png',
    },
    description: 'Technical template for electronics professionals',
  },
  government_standard: {
    id: 8, image: '/assets/templates/government_standard.png',
    previewUrl: '/assets/templates/previews/government_standard_early_career.png',
    previewUrls: {
      'Fresher':      '/assets/templates/previews/government_standard_fresher.png',
      'Early Career': '/assets/templates/previews/government_standard_early_career.png',
      'Mid-Level':    '/assets/templates/previews/government_standard_mid_level.png',
      'Senior-Level': '/assets/templates/previews/government_standard_senior_level.png',
    },
    description: 'Official format for government job applications',
  },
  legal: {
    id: 9, image: '/assets/templates/legal.png',
    previewUrl: '/assets/templates/previews/legal_early_career.png',
    previewUrls: {
      'Fresher':      '/assets/templates/previews/legal_fresher.png',
      'Early Career': '/assets/templates/previews/legal_early_career.png',
      'Mid-Level':    '/assets/templates/previews/legal_mid_level.png',
      'Senior-Level': '/assets/templates/previews/legal_senior_level.png',
      'Director':     '/assets/templates/previews/legal_director_resume.png',
    },
    description: 'Professional template for legal professionals',
  },
  logistics_warehouse_operations: {
    id: 10, image: '/assets/templates/logistics.png',
    previewUrl: '/assets/templates/previews/logistics_warehouse_operations_early_career.png',
    previewUrls: {
      'Fresher':      '/assets/templates/previews/logistics_warehouse_operations_fresher.png',
      'Early Career': '/assets/templates/previews/logistics_warehouse_operations_early_career.png',
      'Mid-Level':    '/assets/templates/previews/logistics_warehouse_operations_mid_level.png',
      'Senior-Level': '/assets/templates/previews/logistics_warehouse_operations_senior_level.png',
    },
    description: 'Template for logistics and warehouse operations',
  },
  marine_merchant_navy: {
    id: 11, image: '/assets/templates/marine_merchant.png',
    previewUrl: '/assets/templates/previews/marine_merchant_navy_early_career.png',
    previewUrls: {
      'Fresher':      '/assets/templates/previews/marine_merchant_navy_fresher.png',
      'Early Career': '/assets/templates/previews/marine_merchant_navy_early_career.png',
      'Mid-Level':    '/assets/templates/previews/marine_merchant_navy_mid_level.png',
      'Senior-Level': '/assets/templates/previews/marine_merchant_navy_senior_level.png',
    },
    description: 'Professional template for maritime professionals',
  },
  modern_minimal_template: {
    id: 12, image: '/assets/templates/modern_minimal.png',
    previewUrl: '/assets/templates/previews/modern_minimal_early_career.png',
    previewUrls: {
      'Fresher':         '/assets/templates/previews/modern_minimal_fresher.png',
      'Early Career':    '/assets/templates/previews/modern_minimal_early_career.png',
      'Mid-Level':       '/assets/templates/previews/modern_minimal_mid_level.png',
      'Senior-Level':    '/assets/templates/previews/modern_minimal_senior_level.png',
      'Director':        '/assets/templates/previews/modern_minimal_director_resume.png',
      'Vice President':  '/assets/templates/previews/modern_minimal_vice_president_resume.png',
    },
    description: 'Clean and minimal design for any profession',
  },
  research_scholar: {
    id: 13, image: '/assets/templates/research_scholar.png',
    previewUrl: '/assets/templates/previews/research_scholar_early_career.png',
    previewUrls: {
      'Fresher':      '/assets/templates/previews/research_scholar_fresher.png',
      'Early Career': '/assets/templates/previews/research_scholar_early_career.png',
      'Mid-Level':    '/assets/templates/previews/research_scholar_mid_level.png',
      'Senior-Level': '/assets/templates/previews/research_scholar_senior_level.png',
    },
    description: 'Academic template for researchers and scholars',
  },
  sales_business_development: {
    id: 14, image: '/assets/templates/sales_business.png',
    previewUrl: '/assets/templates/previews/sales_business_development_early_career.png',
    previewUrls: {
      'Fresher':         '/assets/templates/previews/sales_business_development_fresher.png',
      'Early Career':    '/assets/templates/previews/sales_business_development_early_career.png',
      'Mid-Level':       '/assets/templates/previews/sales_business_development_mid_level.png',
      'Senior-Level':    '/assets/templates/previews/sales_business_development_senior_level.png',
      'Director':        '/assets/templates/previews/sales_business_development_director_resume.png',
      'Vice President':  '/assets/templates/previews/sales_business_development_vice_president_resume.png',
    },
    description: 'Dynamic template for sales professionals',
  },
  general_professional: {
    id: 1, image: '/assets/templates/software_engineering.png',
    previewUrl: '/assets/templates/previews/classic_clean_early_career.png',
    previewUrls: {
      'Fresher':         '/assets/templates/previews/classic_clean_fresher.png',
      'Early Career':    '/assets/templates/previews/classic_clean_early_career.png',
      'Mid-Level':       '/assets/templates/previews/classic_clean_mid_level.png',
      'Senior-Level':    '/assets/templates/previews/classic_clean_senior_level.png',
      'Architect':       '/assets/templates/previews/classic_clean_architect.png',
      'Director':        '/assets/templates/previews/classic_clean_director.png',
      'Vice President':  '/assets/templates/previews/classic_clean_vp.png',
    },
    description: 'Professional template for any industry',
  },
}

export const FAMILY_DOMAINS: Record<string, string[]> = {
  software_engineering: [
    'ai_ml_engineering', 'analytics_engineer', 'backend_development', 'bi_architect',
    'blockchain_development', 'cloud_computing', 'computer_applications', 'computer_science_engineering',
    'cybersecurity', 'data_analyst', 'data_architect', 'data_engineer', 'data_science',
    'database_administrator', 'devops_engineering', 'frontend_development', 'full_stack_development',
    'game_development', 'information_technology', 'ml_engineer', 'mobile_development',
    'power_bi_developer', 'quality_assurance', 'site_reliability_engineering',
    'software_engineering', 'ui_development', 'web_development',
  ],
  core_engineering: [
    'aerospace_engineering', 'automotive_engineering', 'chemical_engineering', 'civil_engineering',
    'construction_engineering', 'electrical_engineering', 'environmental_engineering',
    'industrial_engineering', 'mechanical_engineering', 'production_engineering', 'structural_engineering',
  ],
  healthcare: [
    'clinical_nurse', 'dentist', 'dietitian_nutritionist', 'doctor_physician',
    'healthcare_administrator', 'medical_lab_scientist', 'mental_health_counselor',
    'nurse_practitioner', 'occupational_therapist', 'pediatrician', 'pharmacist',
    'physiotherapist', 'psychiatrist', 'public_health_professional', 'radiologist', 'surgeon',
  ],
  finance: [
    'accounting', 'actuarial_science', 'audit', 'banking', 'chartered_accountant',
    'corporate_finance', 'equity_research', 'financial_analysis', 'financial_planning',
    'fintech', 'insurance', 'investment_banking', 'management_consulting',
    'risk_management', 'tax_specialist', 'wealth_management',
  ],
  education: [
    'academic_researcher', 'assistant_professor', 'associate_professor', 'corporate_trainer',
    'curriculum_developer', 'education_coordinator', 'instructional_designer', 'lecturer',
    'professor', 'school_principal', 'special_education_teacher', 'teacher', 'visiting_faculty',
  ],
  cybersecurity: [
    'application_security', 'ciso', 'cloud_security', 'devsecops', 'digital_forensics',
    'grc', 'identity_access_management', 'incident_response', 'network_security',
    'penetration_testers', 'security_engineers', 'soc_analysts', 'threat_intelligence',
  ],
  electronics_and_vlsi: [
    'analog_design', 'automation', 'embedded_systems', 'fpga_design', 'hardware_design',
    'iot', 'pcb_design', 'plc_scada', 'rf_engineering', 'robotics', 'semiconductor', 'vlsi_design',
  ],
  government_standard: [
    'armed_forces', 'civil_services', 'defense', 'drdo', 'ias', 'isro',
    'judiciary', 'law_enforcement', 'police', 'psu', 'railways',
  ],
  legal: [
    'compliance_officers', 'corporate_law', 'criminal_defense', 'employment_law',
    'family_law', 'in_house_counsel', 'ip_attorneys', 'law_firms',
    'legal_operations', 'paralegals', 'regulatory_affairs',
  ],
  logistics_warehouse_operations: [
    'customs_clearance', 'demand_planning', 'distribution', 'fleet_management',
    'freight', 'import_export', 'inventory_management', 'procurement',
    'scm', 'transportation_management', 'warehousing',
  ],
  marine_merchant_navy: [
    'captain_master', 'chief_engineer', 'chief_officer', 'marine_engineering',
    'marine_superintendent', 'merchant_navy', 'naval_architecture', 'offshore',
    'port_operations', 'shipping',
  ],
  modern_minimal_template: [
    'associate_product_manager', 'brand_management', 'chief_product_officer', 'content_strategy',
    'customer_success', 'design', 'digital_marketing', 'director_of_engineering',
    'e_commerce', 'engineering_manager', 'growth', 'marketing', 'pr_communications',
    'product_management', 'seo_sem', 'social_media', 'startups', 'technical_product_manager',
    'ux_ui_design', 'vp_engineering',
  ],
  research_scholar: [
    'biotech', 'chemistry_research', 'clinical_trials', 'environmental_science',
    'food_science', 'genetics_genomics', 'life_sciences', 'material_science',
    'neuroscience', 'pharma', 'R&D', 'regulatory_affairs',
  ],
  sales_business_development: [
    'account_management', 'business_development', 'customer_service', 'entrepreneurship',
    'hospitality_management', 'hr', 'key_account_management', 'mba_general_management',
    'operations', 'project_management', 'retail_management', 'sales', 'talent_acquisition',
  ],
  general_professional: [
    'cloud_engineering', 'data_science', 'devops', 'full_stack_development',
    'machine_learning', 'mobile_development', 'software_engineering', 'web_development',
  ],
}

export const DOMAIN_NAMES: Record<string, string> = {
  software_engineering: 'Software Engineering',
  core_engineering: 'Core Engineering',
  healthcare: 'Healthcare',
  finance: 'Finance',
  education: 'Education',
  cybersecurity: 'Cybersecurity',
  electronics_and_vlsi: 'Electronics & VLSI',
  government_standard: 'Government Standard',
  legal: 'Legal',
  logistics_warehouse_operations: 'Logistics & Warehouse Operations',
  marine_merchant_navy: 'Marine & Merchant Navy',
  modern_minimal_template: 'Modern Minimal',
  research_scholar: 'Research Scholar',
  sales_business_development: 'Sales & Business Development',
  general_professional: 'General Professional',
}

export const DOMAIN_DISPLAY_NAMES: Record<string, string> = {
  // Engineering domains
  aerospace_engineering: 'Aerospace Engineer',
  automotive_engineering: 'Automotive Engineer',
  chemical_engineering: 'Chemical Engineer',
  civil_engineering: 'Civil Engineer',
  construction_engineering: 'Construction Engineer',
  devops_engineering: 'DevOps Engineer',
  embedded_systems: 'Embedded Systems Engineer',
  marine_engineering: 'Marine Engineer',
  mechanical_engineering: 'Mechanical Engineer',
  naval_architecture: 'Naval Architect',
  semiconductor: 'Semiconductor Engineer',
  vlsi_design: 'VLSI Design Engineer',
  robotics: 'Robotics Engineer',
  plc_scada: 'PLC/SCADA Engineer',

  // Education domains
  professor: 'Professor',
  associate_professor: 'Associate Professor',
  assistant_professor: 'Assistant Professor',
  senior_lecturer: 'Senior Lecturer',
  lecturer: 'Lecturer',
  senior_teacher: 'Senior Teacher',
  principal_teacher: 'Principal Teacher',
  teacher: 'Teacher',
  visiting_faculty: 'Visiting Faculty',
  academic_dean: 'Academic Dean',
  academic_researcher: 'Academic Researcher',
  education_director: 'Education Director',
  education_coordinator: 'Education Coordinator',
  department_head: 'Department Head',

  // Healthcare domains
  doctor_physician: 'Doctor/Physician',
  surgeon: 'Surgeon',
  clinical_nurse: 'Clinical Nurse',
  pharmacist: 'Pharmacist',
  physiotherapist: 'Physiotherapist',
  radiologist: 'Radiologist',
  medical_lab_scientist: 'Medical Lab Scientist',
  healthcare_administrator: 'Healthcare Administrator',
  clinical_trials: 'Clinical Trials Specialist',
  life_sciences: 'Life Sciences Professional',

  // IT & Technology domains
  software_engineering: 'Software Engineer',
  data_science: 'Data Scientist',
  cloud_computing: 'Cloud Computing Specialist',
  cybersecurity: 'Cybersecurity Specialist',
  application_security: 'Application Security Engineer',
  security_engineers: 'Security Engineer',
  incident_response: 'Incident Response Specialist',
  penetration_testers: 'Penetration Tester',
  soc_analysts: 'SOC Analyst',
  digital_forensics: 'Digital Forensics Specialist',
  information_technology: 'IT Professional',
  computer_science_engineering: 'Computer Science Engineer',
  computer_applications: 'Computer Applications Specialist',
  iot: 'IOT Engineer',
  ux_ui_design: 'UX/UI Designer',
  web_development: 'Web Development',
  full_stack_development: 'Full Stack Developer',
  mobile_development: 'Mobile Developer',
  cloud_engineering: 'Cloud Engineer',
  devops: 'DevOps Engineer',
  machine_learning: 'Machine Learning',

  // Finance domains
  accounting: 'Accountant',
  financial_planning: 'Financial Planner',
  financial_analysis: 'Financial Analyst',
  investment_banking: 'Investment Banker',
  corporate_finance: 'Corporate Finance Professional',
  banking: 'Banking Professional',
  audit: 'Audit Professional',
  risk_management: 'Risk Manager',
  mba_general_management: 'MBA General Management',

  // Legal domains
  ip_attorneys: 'IP Attorney',
  law_firms: 'Lawyer/Law Firm Professional',
  legal_operations: 'Legal Operations Specialist',
  paralegals: 'Paralegal',

  // HR & Business domains
  hr: 'HR Professional',
  account_management: 'Account Manager',
  sales: 'Sales Professional',
  marketing: 'Marketing Professional',
  business_development: 'Business Development Executive',
  product_management: 'Product Manager',
  growth: 'Growth Specialist',
  startups: 'Startup Professional',

  // Operations & Logistics domains
  operations: 'Operations Manager',
  procurement: 'Procurement Specialist',
  scm: 'Supply Chain Manager',
  demand_planning: 'Demand Planner',
  inventory_management: 'Inventory Manager',
  distribution: 'Distribution Manager',
  freight: 'Freight Specialist',
  shipping: 'Shipping Specialist',
  warehousing: 'Warehouse Manager',
  port_operations: 'Port Operations Specialist',

  // Government & Defense domains
  civil_services: 'Civil Services Officer',
  defense: 'Defense Professional',
  drdo: 'DRDO Scientist',
  isro: 'ISRO Scientist',
  psu: 'PSU Professional',
  ias: 'IAS Officer',
  railways: 'Railways Professional',
  ciso: 'CISO',
  compliance_officers: 'Compliance Officer',
  grc: 'GRC Specialist',

  // Merchant Navy & Shipping
  merchant_navy: 'Merchant Navy Officer',
  offshore: 'Offshore Professional',

  // Other domains
  biotech: 'Biotech Professional',
  pharma: 'Pharmaceutical Professional',
  hospitality_management: 'Hospitality Manager',
  insurance: 'Insurance Professional',
  regulatory_affairs: 'Regulatory Affairs Specialist',
  'R&D': 'R&D Professional',
  management_consulting: 'Management Consultant',
  design: 'Designer',
  automation: 'Automation Specialist',
  general_professional: 'General Professional',

  // Software Engineering — expanded
  ai_ml_engineering: 'AI/ML Engineer',
  backend_development: 'Backend Developer',
  blockchain_development: 'Blockchain Developer',
  database_administrator: 'Database Administrator',
  frontend_development: 'Frontend Developer',
  game_development: 'Game Developer',
  quality_assurance: 'QA Engineer',
  site_reliability_engineering: 'Site Reliability Engineer',
  ui_development: 'UI Developer',

  // Core Engineering — expanded
  electrical_engineering: 'Electrical Engineer',
  environmental_engineering: 'Environmental Engineer',
  industrial_engineering: 'Industrial Engineer',
  production_engineering: 'Production Engineer',
  structural_engineering: 'Structural Engineer',

  // Healthcare — expanded
  dentist: 'Dentist',
  dietitian_nutritionist: 'Dietitian/Nutritionist',
  mental_health_counselor: 'Mental Health Counselor',
  nurse_practitioner: 'Nurse Practitioner',
  occupational_therapist: 'Occupational Therapist',
  pediatrician: 'Pediatrician',
  psychiatrist: 'Psychiatrist',
  public_health_professional: 'Public Health Professional',

  // Finance — expanded
  actuarial_science: 'Actuary',
  chartered_accountant: 'Chartered Accountant',
  equity_research: 'Equity Research Analyst',
  fintech: 'Fintech Professional',
  tax_specialist: 'Tax Specialist',
  wealth_management: 'Wealth Manager',

  // Education — expanded
  corporate_trainer: 'Corporate Trainer',
  curriculum_developer: 'Curriculum Developer',
  instructional_designer: 'Instructional Designer',
  school_principal: 'School Principal',
  special_education_teacher: 'Special Education Teacher',

  // Cybersecurity — expanded
  cloud_security: 'Cloud Security Engineer',
  devsecops: 'DevSecOps Engineer',
  identity_access_management: 'IAM Specialist',
  network_security: 'Network Security Engineer',
  threat_intelligence: 'Threat Intelligence Analyst',

  // Electronics & VLSI — expanded
  analog_design: 'Analog Design Engineer',
  fpga_design: 'FPGA Design Engineer',
  hardware_design: 'Hardware Design Engineer',
  pcb_design: 'PCB Design Engineer',
  rf_engineering: 'RF Engineer',

  // Government — expanded
  armed_forces: 'Armed Forces Officer',
  judiciary: 'Judicial Officer',
  law_enforcement: 'Law Enforcement Officer',
  police: 'Police Officer',

  // Legal — expanded
  corporate_law: 'Corporate Lawyer',
  criminal_defense: 'Criminal Defense Lawyer',
  employment_law: 'Employment Lawyer',
  family_law: 'Family Lawyer',
  in_house_counsel: 'In-house Counsel',

  // Logistics — expanded
  customs_clearance: 'Customs Clearance Agent',
  fleet_management: 'Fleet Manager',
  import_export: 'Import/Export Specialist',
  transportation_management: 'Transportation Manager',

  // Marine — expanded
  captain_master: 'Captain / Master Mariner',
  chief_engineer: 'Chief Engineer',
  chief_officer: 'Chief Officer',
  marine_superintendent: 'Marine Superintendent',

  // Modern Minimal — expanded
  brand_management: 'Brand Manager',
  content_strategy: 'Content Strategist',
  customer_success: 'Customer Success Manager',
  digital_marketing: 'Digital Marketing Specialist',
  e_commerce: 'E-Commerce Manager',
  pr_communications: 'PR & Communications',
  seo_sem: 'SEO/SEM Specialist',
  social_media: 'Social Media Manager',

  // Research Scholar — expanded
  chemistry_research: 'Chemistry Researcher',
  environmental_science: 'Environmental Scientist',
  food_science: 'Food Scientist',
  genetics_genomics: 'Genetics/Genomics Researcher',
  material_science: 'Materials Scientist',
  neuroscience: 'Neuroscientist',

  // Sales & Business Development — expanded
  customer_service: 'Customer Service Manager',
  entrepreneurship: 'Entrepreneur',
  key_account_management: 'Key Account Manager',
  project_management: 'Project Manager',
  retail_management: 'Retail Manager',
  talent_acquisition: 'Talent Acquisition Specialist',

  // Data roles (under software_engineering)
  data_analyst: 'Data Analyst',
  power_bi_developer: 'Power BI / BI Developer',
  analytics_engineer: 'Analytics Engineer',
  data_engineer: 'Data Engineer',
  ml_engineer: 'ML Engineer',
  bi_architect: 'BI Architect',
  data_architect: 'Data Architect',

  // Product & Engineering Management (under modern_minimal_template)
  associate_product_manager: 'Associate Product Manager',
  product_manager: 'Product Manager',
  technical_product_manager: 'Technical Product Manager',
  engineering_manager: 'Engineering Manager',
  director_of_engineering: 'Director of Engineering',
  vp_engineering: 'VP Engineering',
  chief_product_officer: 'Chief Product Officer',
}

export const CAREER_LEVELS = ['Fresher', 'Early Career', 'Mid-Level', 'Senior-Level', 'Lead', 'Architect', 'Manager', 'Director', 'Vice President']

export const FALLBACK_IMAGE = '/assets/templates/template-1.png'
