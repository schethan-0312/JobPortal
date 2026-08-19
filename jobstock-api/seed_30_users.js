import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:2014@localhost:5432/jobstock';
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const usersData = [
  {
    email: 'user1@example.com',
    fullName: 'Aarav Sharma',
    headline: 'Senior Fullstack Engineer (React & Node.js)',
    location: 'Bengaluru, India',
    phone: '+91 9876543201',
    experienceYears: 6,
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'GraphQL'],
    about: 'Passionate fullstack engineer with 6 years of experience building scalable web applications and microservices.',
    languages: ['English', 'Hindi', 'Kannada'],
    resumeUrl: 'https://example.com/resumes/aarav_sharma_resume.pdf',
    educations: [
      { title: 'B.Tech in Computer Science', academy: 'IIT Bangalore', year: '2014 - 2018', description: 'Specialized in Distributed Systems & Web Technologies.' }
    ],
    experiences: [
      { title: 'Senior Fullstack Engineer', company: 'CloudScale Technologies', startDate: '2021-04', endDate: 'Present', description: 'Led frontend & API design for multi-tenant SaaS dashboard serving 100k+ active users.' },
      { title: 'Software Developer', company: 'Infosys', startDate: '2018-07', endDate: '2021-03', description: 'Developed React frontends and Node.js microservices for financial clients.' }
    ],
    projects: [
      { title: 'Realtime Analytics Platform', link: 'https://github.com/aarav/analytics-platform', description: 'Fullstack dashboard using React, Node.js, and WebSockets for live data metrics.' }
    ],
    certifications: [
      { title: 'AWS Certified Solutions Architect – Associate', year: '2022', description: 'Cloud architecture design and best practices.' }
    ]
  },
  {
    email: 'user2@example.com',
    fullName: 'Ananya Patel',
    headline: 'Frontend Developer & UI Specialist',
    location: 'Mumbai, India',
    phone: '+91 9876543202',
    experienceYears: 4,
    skills: ['Vue.js', 'React', 'CSS3/Sass', 'Tailwind CSS', 'Redux', 'JavaScript'],
    about: 'Frontend developer focused on creating fast, accessible, and responsive user interfaces.',
    languages: ['English', 'Gujarati', 'Hindi'],
    resumeUrl: 'https://example.com/resumes/ananya_patel_resume.pdf',
    educations: [
      { title: 'B.E. in Information Technology', academy: 'VJTI Mumbai', year: '2016 - 2020', description: 'Graduated with Distinction in Web Design & HCI.' }
    ],
    experiences: [
      { title: 'Frontend Developer', company: 'Designify Studios', startDate: '2020-09', endDate: 'Present', description: 'Built responsive web interfaces with Vue 3 and Tailwind CSS.' }
    ],
    projects: [
      { title: 'Component Design System', link: 'https://github.com/ananya/ui-kit', description: 'Accessible React UI component library with 100% Storybook test coverage.' }
    ],
    certifications: [
      { title: 'Meta Frontend Developer Professional Certificate', year: '2021', description: 'Advanced UI development and performance optimization.' }
    ]
  },
  {
    email: 'user3@example.com',
    fullName: 'Rohan Verma',
    headline: 'Python & ML Engineer',
    location: 'Hyderabad, India',
    phone: '+91 9876543203',
    experienceYears: 5,
    skills: ['Python', 'PyTorch', 'TensorFlow', 'FastAPI', 'Pandas', 'scikit-learn'],
    about: 'Machine learning engineer experienced in deploying LLMs, predictive modeling, and REST APIs.',
    languages: ['English', 'Hindi', 'Telugu'],
    resumeUrl: 'https://example.com/resumes/rohan_verma_resume.pdf',
    educations: [
      { title: 'M.Tech in Artificial Intelligence', academy: 'IIIT Hyderabad', year: '2017 - 2019', description: 'Thesis on Deep Neural Networks for Sentiment Analysis.' }
    ],
    experiences: [
      { title: 'ML Engineer', company: 'AI Labs India', startDate: '2019-08', endDate: 'Present', description: 'Deployed NLP models and LLM wrappers with FastAPI and Docker on AWS.' }
    ],
    projects: [
      { title: 'Automated Resume Parser', link: 'https://github.com/rohan/resume-parser', description: 'Extracted structured skills and experience from PDF resumes using spaCy and Transformers.' }
    ],
    certifications: [
      { title: 'TensorFlow Developer Certificate', year: '2020', description: 'Deep learning model building and deployment.' }
    ]
  },
  {
    email: 'user4@example.com',
    fullName: 'Priya Singh',
    headline: 'Lead UI/UX & Product Designer',
    location: 'Delhi NCR, India',
    phone: '+91 9876543204',
    experienceYears: 7,
    skills: ['Figma', 'User Research', 'Wireframing', 'Design Systems', 'Prototyping', 'Adobe XD'],
    about: 'Product designer creating human-centered interfaces and scalable design systems for fintech and SaaS.',
    languages: ['English', 'Hindi'],
    resumeUrl: 'https://example.com/resumes/priya_singh_resume.pdf',
    educations: [
      { title: 'Bachelor of Design (B.Des)', academy: 'NID Ahmedabad', year: '2013 - 2017', description: 'Specialized in Interaction Design & User Research.' }
    ],
    experiences: [
      { title: 'Lead Product Designer', company: 'FinPulse SaaS', startDate: '2020-01', endDate: 'Present', description: 'Redesigned core mobile & web flows, boosting user conversion by 35%.' }
    ],
    projects: [
      { title: 'Fintech Mobile Wallet UI', link: 'https://figma.com/@priyadesign', description: 'End-to-end design system and user journey maps for digital banking app.' }
    ],
    certifications: [
      { title: 'Nielsen Norman UX Master Certification', year: '2021', description: 'Advanced user experience research & usability testing.' }
    ]
  },
  {
    email: 'user5@example.com',
    fullName: 'Rahul Kumar',
    headline: 'DevOps & Cloud Infrastructure Architect',
    location: 'Pune, India',
    phone: '+91 9876543205',
    experienceYears: 8,
    skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Docker', 'Prometheus'],
    about: 'Cloud enthusiast specializing in infrastructure automation, zero-downtime deployments, and Kubernetes.',
    languages: ['English', 'Hindi', 'Marathi'],
    resumeUrl: 'https://example.com/resumes/rahul_kumar_resume.pdf',
    educations: [
      { title: 'B.Tech in Computer Science', academy: 'COEP Pune', year: '2012 - 2016', description: 'Cloud Computing & Computer Networks emphasis.' }
    ],
    experiences: [
      { title: 'Principal DevOps Engineer', company: 'NextGen Infra Solutions', startDate: '2019-03', endDate: 'Present', description: 'Managed multi-cluster EKS infrastructure with GitOps, ArgoCD, and Terraform.' }
    ],
    projects: [
      { title: 'Terraform AWS Blueprints', link: 'https://github.com/rahul/aws-terraform-modules', description: 'Reusable IaC modules for production-grade VPC, EKS, and RDS setups.' }
    ],
    certifications: [
      { title: 'Certified Kubernetes Administrator (CKA)', year: '2021', description: 'Kubernetes cluster setup, security, and troubleshooting.' }
    ]
  },
  {
    email: 'user6@example.com',
    fullName: 'Sneha Gupta',
    headline: 'Mobile App Developer (React Native / Flutter)',
    location: 'Gurgaon, India',
    phone: '+91 9876543206',
    experienceYears: 3,
    skills: ['React Native', 'Flutter', 'Dart', 'iOS/Android', 'Redux Toolkit', 'Firebase'],
    about: 'Cross-platform mobile developer building smooth 60fps iOS and Android applications.',
    languages: ['English', 'Hindi'],
    resumeUrl: 'https://example.com/resumes/sneha_gupta_resume.pdf',
    educations: [
      { title: 'B.Tech in Computer Engineering', academy: 'DTU Delhi', year: '2017 - 2021', description: 'Focus on Mobile & Ubiquitous Computing.' }
    ],
    experiences: [
      { title: 'Mobile Developer', company: 'Appify Mobility', startDate: '2021-07', endDate: 'Present', description: 'Built and published 4+ React Native apps on App Store and Play Store.' }
    ],
    projects: [
      { title: 'Fitness Tracker App', link: 'https://github.com/sneha/fitness-flutter', description: 'Flutter app integrating step counters, Bluetooth heart rate monitors, and dark mode UI.' }
    ],
    certifications: [
      { title: 'Google Associate Android Developer', year: '2022', description: 'Android development standards and architecture.' }
    ]
  },
  {
    email: 'user7@example.com',
    fullName: 'Vikram Malhotra',
    headline: 'Backend Systems Engineer (Go & Distributed Systems)',
    location: 'Bengaluru, India',
    phone: '+91 9876543207',
    experienceYears: 5,
    skills: ['Go', 'gRPC', 'Kafka', 'Redis', 'PostgreSQL', 'Distributed Systems'],
    about: 'Backend engineer focused on high-throughput microservices and event-driven architectures.',
    languages: ['English', 'Hindi', 'Punjabi'],
    resumeUrl: 'https://example.com/resumes/vikram_malhotra_resume.pdf',
    educations: [
      { title: 'B.Tech in Computer Science', academy: 'BITS Pilani', year: '2015 - 2019', description: 'Software Engineering & Parallel Computing.' }
    ],
    experiences: [
      { title: 'Senior Backend Engineer', company: 'PayStream Systems', startDate: '2021-01', endDate: 'Present', description: 'Built Go microservices handling 50k transactions/sec with Redis & Kafka.' }
    ],
    projects: [
      { title: 'Distributed Rate Limiter', link: 'https://github.com/vikram/go-ratelimiter', description: 'Token bucket and sliding window rate limiter implementation in Go with Redis backend.' }
    ],
    certifications: [
      { title: 'Confluent Certified Developer for Apache Kafka', year: '2022', description: 'Event streaming and Kafka topic architecture.' }
    ]
  },
  {
    email: 'user8@example.com',
    fullName: 'Ishita Roy',
    headline: 'Data Engineer & ETL Pipeline Specialist',
    location: 'Kolkata, India',
    phone: '+91 9876543208',
    experienceYears: 4,
    skills: ['Apache Spark', 'Airflow', 'Snowflake', 'Python', 'SQL', 'Databricks'],
    about: 'Data engineer architecting real-time streaming pipelines and modern data warehouses.',
    languages: ['English', 'Bengali', 'Hindi'],
    resumeUrl: 'https://example.com/resumes/ishita_roy_resume.pdf',
    educations: [
      { title: 'B.Sc in Statistics & Computer Science', academy: 'St. Xavier College Kolkata', year: '2016 - 2019', description: 'Statistical analysis and algorithmic computing.' }
    ],
    experiences: [
      { title: 'Data Engineer', company: 'DataWise Analytics', startDate: '2019-09', endDate: 'Present', description: 'Designed PySpark ETL pipelines ingesting 5TB of log data daily into Snowflake.' }
    ],
    projects: [
      { title: 'Airflow Pipeline Orchestrator', link: 'https://github.com/ishita/etl-airflow', description: 'Automated DAG workflow for data validation and Snowflake reporting.' }
    ],
    certifications: [
      { title: 'Snowflake SnowPro Core Certified', year: '2022', description: 'Snowflake architecture, warehousing, and security.' }
    ]
  },
  {
    email: 'user9@example.com',
    fullName: 'Arjun Mehta',
    headline: 'Java Enterprise Developer (Spring Boot)',
    location: 'Chennai, India',
    phone: '+91 9876543209',
    experienceYears: 6,
    skills: ['Java 17', 'Spring Boot', 'Hibernate', 'Microservices', 'Oracle DB', 'Kafka'],
    about: 'Enterprise Java developer with experience in banking and payment processing platforms.',
    languages: ['English', 'Tamil', 'Hindi'],
    resumeUrl: 'https://example.com/resumes/arjun_mehta_resume.pdf',
    educations: [
      { title: 'B.E. in Computer Science', academy: 'Anna University Chennai', year: '2014 - 2018', description: 'Enterprise Computing & OOP Principles.' }
    ],
    experiences: [
      { title: 'Lead Java Developer', company: 'CoreBank Tech', startDate: '2020-05', endDate: 'Present', description: 'Maintained core Spring Boot banking modules and ISO 8583 payment gateways.' }
    ],
    projects: [
      { title: 'Microservices Auth Gateway', link: 'https://github.com/arjun/spring-auth-gateway', description: 'OAuth2 and JWT authentication server built with Spring Security and Redis.' }
    ],
    certifications: [
      { title: 'Oracle Certified Professional: Java SE 17 Developer', year: '2021', description: 'Advanced Java programming and concurrency.' }
    ]
  },
  {
    email: 'user10@example.com',
    fullName: 'Pooja Joshi',
    headline: 'QA Automation Lead & SDET',
    location: 'Noida, India',
    phone: '+91 9876543210',
    experienceYears: 6,
    skills: ['Playwright', 'Cypress', 'Selenium', 'Java', 'Jest', 'CI/CD Pipelines'],
    about: 'Quality engineer dedicated to zero-defect software releases through robust end-to-end automation.',
    languages: ['English', 'Hindi'],
    resumeUrl: 'https://example.com/resumes/pooja_joshi_resume.pdf',
    educations: [
      { title: 'B.Tech in Computer Science', academy: 'AKTU Lucknow', year: '2014 - 2018', description: 'Software Quality Assurance & Testing.' }
    ],
    experiences: [
      { title: 'SDET Lead', company: 'QualityFirst Labs', startDate: '2020-02', endDate: 'Present', description: 'Created Playwright automation suite integrated into GitHub Actions CI pipeline.' }
    ],
    projects: [
      { title: 'E2E Testing Framework', link: 'https://github.com/pooja/playwright-suite', description: 'Page Object Model based framework supporting multi-browser parallel runs.' }
    ],
    certifications: [
      { title: 'ISTQB Certified Tester Advanced Level (Test Automation Engineer)', year: '2020', description: 'Automated test design and execution.' }
    ]
  },
  {
    email: 'user11@example.com',
    fullName: 'Siddharth Nair',
    headline: 'Technical Product Manager',
    location: 'Kochi, India',
    phone: '+91 9876543211',
    experienceYears: 7,
    skills: ['Agile/Scrum', 'Product Strategy', 'Roadmapping', 'JIRA', 'SQL', 'A/B Testing'],
    about: 'Product leader bridging business goals with technical execution in fast-paced startup environments.',
    languages: ['English', 'Malayalam', 'Hindi'],
    resumeUrl: 'https://example.com/resumes/siddharth_nair_resume.pdf',
    educations: [
      { title: 'MBA in Technology Management', academy: 'IIM Kozhikode', year: '2017 - 2019', description: 'Product Lifecycle & Strategic Leadership.' }
    ],
    experiences: [
      { title: 'Senior Product Manager', company: 'SaaSify Platforms', startDate: '2019-06', endDate: 'Present', description: 'Managed product roadmap from ideation to release, growing ARR by 40% year-over-year.' }
    ],
    projects: [
      { title: 'Customer Onboarding Redesign', link: 'https://siddharthnair.pm/case-studies', description: 'Streamlined user onboarding steps reducing drop-off rates by 22%.' }
    ],
    certifications: [
      { title: 'Certified Scrum Product Owner (CSPO)', year: '2019', description: 'Agile product backlog management and release planning.' }
    ]
  },
  {
    email: 'user12@example.com',
    fullName: 'Neha Kapoor',
    headline: 'Cybersecurity Analyst & Penetration Tester',
    location: 'Chandigarh, India',
    phone: '+91 9876543212',
    experienceYears: 4,
    skills: ['Ethical Hacking', 'OWASP Top 10', 'Wireshark', 'Burp Suite', 'Python', 'Network Security'],
    about: 'Security researcher auditing web apps, APIs, and cloud configurations for vulnerability management.',
    languages: ['English', 'Hindi', 'Punjabi'],
    resumeUrl: 'https://example.com/resumes/neha_kapoor_resume.pdf',
    educations: [
      { title: 'B.Tech in Information Security', academy: 'PEC Chandigarh', year: '2016 - 2020', description: 'Network Defense & Cryptography.' }
    ],
    experiences: [
      { title: 'Security Analyst', company: 'CyberGuard Audits', startDate: '2020-08', endDate: 'Present', description: 'Performed VAPT audits for 30+ web and mobile applications.' }
    ],
    projects: [
      { title: 'Automated Vulnerability Scanner', link: 'https://github.com/neha/python-vuln-scanner', description: 'Python tool detecting misconfigured HTTP headers, CORS policies, and outdated dependencies.' }
    ],
    certifications: [
      { title: 'Certified Ethical Hacker (CEH v11)', year: '2021', description: 'Penetration testing and security threat mitigation.' }
    ]
  },
  {
    email: 'user13@example.com',
    fullName: 'Aditya Rao',
    headline: 'Full Stack JavaScript Engineer (Next.js & Prisma)',
    location: 'Hyderabad, India',
    phone: '+91 9876543213',
    experienceYears: 3,
    skills: ['Next.js', 'React', 'TypeScript', 'Prisma', 'Tailwind CSS', 'PostgreSQL'],
    about: 'Modern web developer building server-rendered web applications with top-notch Lighthouse scores.',
    languages: ['English', 'Telugu', 'Hindi'],
    resumeUrl: 'https://example.com/resumes/aditya_rao_resume.pdf',
    educations: [
      { title: 'B.Tech in Computer Science', academy: 'JNTU Hyderabad', year: '2018 - 2022', description: 'Software Engineering & Web Technologies.' }
    ],
    experiences: [
      { title: 'Fullstack Web Engineer', company: 'StackCraft Labs', startDate: '2022-06', endDate: 'Present', description: 'Built Next.js 14 applications with App Router, Server Actions, and Prisma ORM.' }
    ],
    projects: [
      { title: 'JobPortal Marketplace', link: 'https://github.com/aditya/job-marketplace', description: 'End-to-end job board app with candidate profiles, job postings, and instant search.' }
    ],
    certifications: [
      { title: 'Vercel Next.js Certified Developer', year: '2023', description: 'SSR, SSG, and edge rendering optimization.' }
    ]
  },
  {
    email: 'user14@example.com',
    fullName: 'Kavya Reddy',
    headline: 'AI Research Scientist & NLP Developer',
    location: 'Bengaluru, India',
    phone: '+91 9876543214',
    experienceYears: 5,
    skills: ['Hugging Face', 'Transformers', 'Python', 'PyTorch', 'LangChain', 'Vector DBs'],
    about: 'Specialist in Generative AI, RAG pipelines, fine-tuning open-source LLMs, and semantic search.',
    languages: ['English', 'Telugu', 'Kannada'],
    resumeUrl: 'https://example.com/resumes/kavya_reddy_resume.pdf',
    educations: [
      { title: 'M.S. in Computer Science (NLP)', academy: 'IISc Bangalore', year: '2017 - 2019', description: 'Natural Language Processing and Knowledge Graphs.' }
    ],
    experiences: [
      { title: 'AI Research Engineer', company: 'DeepSense AI', startDate: '2019-09', endDate: 'Present', description: 'Constructed RAG systems using Qdrant vector database and Llama-3 model fine-tuning.' }
    ],
    projects: [
      { title: 'Domain Knowledge QA Bot', link: 'https://github.com/kavya/rag-qa-bot', description: 'LangChain-powered enterprise document assistant with hybrid semantic search.' }
    ],
    certifications: [
      { title: 'DeepLearning.AI Generative AI Developer', year: '2023', description: 'Prompt engineering, RAG, and LLM orchestration.' }
    ]
  },
  {
    email: 'user15@example.com',
    fullName: 'Rajesh Iyer',
    headline: 'Solutions Architect & Cloud Consultant',
    location: 'Mumbai, India',
    phone: '+91 9876543215',
    experienceYears: 10,
    skills: ['AWS Certified Architect', 'Azure', 'System Design', 'Serverless', 'Cost Optimization'],
    about: 'Senior architect helping enterprise clients migrate legacy systems into resilient multi-cloud architectures.',
    languages: ['English', 'Marathi', 'Tamil'],
    resumeUrl: 'https://example.com/resumes/rajesh_iyer_resume.pdf',
    educations: [
      { title: 'B.E. in Electronics & Telecom', academy: 'University of Mumbai', year: '2010 - 2014', description: 'Telecommunication Networks & Systems Design.' }
    ],
    experiences: [
      { title: 'Principal Solutions Architect', company: 'Enterprise Cloud Corp', startDate: '2018-02', endDate: 'Present', description: 'Architected cloud migration strategy for Fortune 500 financial institutions.' }
    ],
    projects: [
      { title: 'Multi-Region Failover Architecture', link: 'https://github.com/rajesh/aws-disaster-recovery', description: 'Active-active cross-region database replication with Route53 latency routing.' }
    ],
    certifications: [
      { title: 'AWS Certified Solutions Architect – Professional', year: '2020', description: 'Enterprise cloud solution design.' }
    ]
  },
  {
    email: 'user16@example.com',
    fullName: 'Swati Deshmukh',
    headline: 'Site Reliability Engineer (SRE)',
    location: 'Pune, India',
    phone: '+91 9876543216',
    experienceYears: 5,
    skills: ['Linux', 'Kubernetes', 'Grafana', 'Datadog', 'Ansible', 'Python'],
    about: 'SRE maintaining 99.99% uptime for high-volume consumer web services.',
    languages: ['English', 'Marathi', 'Hindi'],
    resumeUrl: 'https://example.com/resumes/swati_deshmukh_resume.pdf',
    educations: [
      { title: 'B.Tech in Computer Science', academy: 'Pune University', year: '2015 - 2019', description: 'Systems Administration & OS Security.' }
    ],
    experiences: [
      { title: 'Senior SRE', company: 'HighAvailability Inc', startDate: '2021-03', endDate: 'Present', description: 'Managed incident response, error budgets, and Grafana dashboards for 500+ services.' }
    ],
    projects: [
      { title: 'Automated Incident Triage Bot', link: 'https://github.com/swati/sre-triage-slack', description: 'Slack bot parsing PagerDuty alerts and automatically collecting pod logs.' }
    ],
    certifications: [
      { title: 'Google Certified Professional Cloud DevOps Engineer', year: '2022', description: 'SRE practices and GCP telemetry.' }
    ]
  },
  {
    email: 'user17@example.com',
    fullName: 'Manish Pandey',
    headline: 'Android Native Developer (Kotlin)',
    location: 'Ahmedabad, India',
    phone: '+91 9876543217',
    experienceYears: 4,
    skills: ['Kotlin', 'Jetpack Compose', 'Coroutines', 'Clean Architecture', 'Dagger Hilt', 'Room'],
    about: 'Native Android software developer creating clean, modular apps with Jetpack Compose.',
    languages: ['English', 'Hindi', 'Gujarati'],
    resumeUrl: 'https://example.com/resumes/manish_pandey_resume.pdf',
    educations: [
      { title: 'B.Tech in Information Technology', academy: 'Nirma University', year: '2016 - 2020', description: 'Mobile Systems & Object Oriented Software.' }
    ],
    experiences: [
      { title: 'Android Developer', company: 'MobiTech Apps', startDate: '2020-07', endDate: 'Present', description: 'Refactored legacy Java Android codebases to 100% Kotlin with Jetpack Compose.' }
    ],
    projects: [
      { title: 'Offline-First News App', link: 'https://github.com/manish/news-compose', description: 'Clean architecture Android app with Room DB caching and Flow stream updates.' }
    ],
    certifications: [
      { title: 'Android Kotlin Developer Nanodegree', year: '2021', description: 'Advanced Kotlin features and Jetpack dependencies.' }
    ]
  },
  {
    email: 'user18@example.com',
    fullName: 'Riya Banerjee',
    headline: 'Scrum Master & Agile Coach',
    location: 'Kolkata, India',
    phone: '+91 9876543218',
    experienceYears: 6,
    skills: ['Certified ScrumMaster', 'Kanban', 'Sprint Planning', 'Agile Metrics', 'JIRA', 'Confluence'],
    about: 'Facilitating high-performing engineering teams to deliver iterative value smoothly.',
    languages: ['English', 'Bengali', 'Hindi'],
    resumeUrl: 'https://example.com/resumes/riya_banerjee_resume.pdf',
    educations: [
      { title: 'B.Tech in Electrical Engineering', academy: 'Jadavpur University', year: '2014 - 2018', description: 'Engineering Leadership & Project Management.' }
    ],
    experiences: [
      { title: 'Scrum Master', company: 'AgileWorks Software', startDate: '2019-11', endDate: 'Present', description: 'Coached 4 cross-functional development squads in Scrum and Kanban best practices.' }
    ],
    projects: [
      { title: 'Agile Velocity & Burndown Tracker', link: 'https://github.com/riya/agile-jira-dashboard', description: 'Custom JIRA dashboard gadget analyzing sprint predictability and cycle times.' }
    ],
    certifications: [
      { title: 'Certified ScrumMaster (CSM)', year: '2019', description: 'Agile facilitation and sprint execution.' }
    ]
  },
  {
    email: 'user19@example.com',
    fullName: 'Amit Saxena',
    headline: 'Database Administrator (PostgreSQL & MySQL)',
    location: 'Indore, India',
    phone: '+91 9876543219',
    experienceYears: 9,
    skills: ['PostgreSQL', 'Query Optimization', 'Database Replication', 'MySQL', 'MongoDB', 'Backup Recovery'],
    about: 'DBA with expertise in query tuning, indexing strategy, and multi-region database replication.',
    languages: ['English', 'Hindi'],
    resumeUrl: 'https://example.com/resumes/amit_saxena_resume.pdf',
    educations: [
      { title: 'B.E. in Computer Science', academy: 'IET DAVV Indore', year: '2011 - 2015', description: 'Database Management Systems & Data Warehousing.' }
    ],
    experiences: [
      { title: 'Lead Database Administrator', company: 'DataVault Solutions', startDate: '2018-04', endDate: 'Present', description: 'Managed production PostgreSQL clusters with Patroni for high availability.' }
    ],
    projects: [
      { title: 'Postgres Query Profiler Script', link: 'https://github.com/amit/pg-stat-profiler', description: 'Automated tool analyzing pg_stat_statements to identify missing indexes.' }
    ],
    certifications: [
      { title: 'PostgreSQL Certified Associate', year: '2020', description: 'PostgreSQL server configuration and administration.' }
    ]
  },
  {
    email: 'user20@example.com',
    fullName: 'Divya Pillai',
    headline: 'Technical Writer & Developer Relations Engineer',
    location: 'Thiruvananthapuram, India',
    phone: '+91 9876543220',
    experienceYears: 4,
    skills: ['API Documentation', 'OpenAPI/Swagger', 'Markdown', 'Git', 'Docusaurus', 'Developer Evangelism'],
    about: 'Creating comprehensive API documentation, tutorials, and SDK samples for developer communities.',
    languages: ['English', 'Malayalam', 'Hindi'],
    resumeUrl: 'https://example.com/resumes/divya_pillai_resume.pdf',
    educations: [
      { title: 'B.A. in English & Mass Communication', academy: 'University of Kerala', year: '2016 - 2019', description: 'Technical Communication & Journalism.' }
    ],
    experiences: [
      { title: 'DevRel & Technical Writer', company: 'APIHub Technologies', startDate: '2020-03', endDate: 'Present', description: 'Authored REST & GraphQL API docs and managed Docusaurus developer portal.' }
    ],
    projects: [
      { title: 'OpenAPI Specification Guide', link: 'https://github.com/divya/api-docs-template', description: 'Interactive Swagger UI template with copyable code snippets in Python, JS, and Curl.' }
    ],
    certifications: [
      { title: 'Certified Professional Technical Communicator (CPTC)', year: '2021', description: 'Technical documentation standards.' }
    ]
  },
  {
    email: 'user21@example.com',
    fullName: 'Suresh Choudhary',
    headline: 'Embedded Systems & IoT Developer',
    location: 'Jaipur, India',
    phone: '+91 9876543221',
    experienceYears: 5,
    skills: ['C/C++', 'RTOS', 'ESP32', 'MQTT', 'Firmware', 'Hardware Interfacing'],
    about: 'Firmware engineer designing low-power IoT hardware devices and microcontrollers.',
    languages: ['English', 'Hindi', 'Rajasthani'],
    resumeUrl: 'https://example.com/resumes/suresh_choudhary_resume.pdf',
    educations: [
      { title: 'B.Tech in Electronics & Communication', academy: 'MNIT Jaipur', year: '2015 - 2019', description: 'Microcontrollers & Embedded C.' }
    ],
    experiences: [
      { title: 'Embedded Software Engineer', company: 'SmartIo Devices', startDate: '2019-07', endDate: 'Present', description: 'Developed FreeRTOS firmware for ESP32 energy meters transmitting data over MQTT.' }
    ],
    projects: [
      { title: 'Smart Home Gateway Firmware', link: 'https://github.com/suresh/esp32-freertos-gateway', description: 'Low-latency C++ firmware handling Wi-Fi reconnects and sensor data encryption.' }
    ],
    certifications: [
      { title: 'Arm Accredited Engineer (AAE)', year: '2021', description: 'Arm Cortex-M processor architecture.' }
    ]
  },
  {
    email: 'user22@example.com',
    fullName: 'Meera Bhatnagar',
    headline: 'Business Intelligence & Power BI Analyst',
    location: 'Noida, India',
    phone: '+91 9876543222',
    experienceYears: 3,
    skills: ['Power BI', 'Tableau', 'SQL', 'DAX', 'Data Analysis', 'Excel VBA'],
    about: 'Transforming complex data into actionable executive dashboards and key performance indicators.',
    languages: ['English', 'Hindi'],
    resumeUrl: 'https://example.com/resumes/meera_bhatnagar_resume.pdf',
    educations: [
      { title: 'B.Com in Computer Applications', academy: 'Delhi University', year: '2017 - 2020', description: 'Business Statistics & Financial Accounting.' }
    ],
    experiences: [
      { title: 'BI Analyst', company: 'Insight Analytics', startDate: '2020-10', endDate: 'Present', description: 'Built 20+ Power BI dashboards tracking monthly active users, churn rate, and revenue.' }
    ],
    projects: [
      { title: 'Executive Sales Dashboard', link: 'https://meera.bi/dashboards', description: 'Interactive DAX model analyzing year-over-year revenue growth by territory.' }
    ],
    certifications: [
      { title: 'Microsoft Certified: Power BI Data Analyst Associate', year: '2022', description: 'Data modeling, DAX queries, and dashboard reporting.' }
    ]
  },
  {
    email: 'user23@example.com',
    fullName: 'Deepak Mittal',
    headline: 'Rust Software Engineer',
    location: 'Bengaluru, India',
    phone: '+91 9876543223',
    experienceYears: 4,
    skills: ['Rust', 'WebAssembly', 'Async Rust (Tokio)', 'Memory Safety', 'C++', 'System Design'],
    about: 'Systems programmer building ultra-low-latency networking and WebAssembly modules in Rust.',
    languages: ['English', 'Hindi'],
    resumeUrl: 'https://example.com/resumes/deepak_mittal_resume.pdf',
    educations: [
      { title: 'B.Tech in Computer Science', academy: 'IIT Roorkee', year: '2016 - 2020', description: 'Systems Programming & Operating Systems.' }
    ],
    experiences: [
      { title: 'Systems Engineer (Rust)', company: 'FastNet Infrastructure', startDate: '2020-08', endDate: 'Present', description: 'Engineered memory-safe TCP proxy in Rust with Tokio handling 100k persistent sockets.' }
    ],
    projects: [
      { title: 'Rust WASM Image Processing Engine', link: 'https://github.com/deepak/rust-wasm-image', description: 'Blazing fast browser-side image resize and filters compiled to WebAssembly.' }
    ],
    certifications: [
      { title: 'Rust Foundation Certified Professional', year: '2023', description: 'Advanced Rust concurrency and zero-cost abstractions.' }
    ]
  },
  {
    email: 'user24@example.com',
    fullName: 'Anusha Hegde',
    headline: 'GraphQL & API Gateway Engineer',
    location: 'Mangaluru, India',
    phone: '+91 9876543224',
    experienceYears: 4,
    skills: ['GraphQL', 'Apollo Server', 'Node.js', 'REST APIs', 'Kong Gateway', 'TypeScript'],
    about: 'Designing unified GraphQL federated schemas and secure API gateways.',
    languages: ['English', 'Kannada', 'Hindi'],
    resumeUrl: 'https://example.com/resumes/anusha_hegde_resume.pdf',
    educations: [
      { title: 'B.E. in Information Science', academy: 'NITK Surathkal', year: '2016 - 2020', description: 'Web Architectures & Database Systems.' }
    ],
    experiences: [
      { title: 'API Engineer', company: 'OmniChannel Retail', startDate: '2020-09', endDate: 'Present', description: 'Built Apollo Federation supergraph unifying 12 microservice GraphQL schemas.' }
    ],
    projects: [
      { title: 'GraphQL Caching Layer', link: 'https://github.com/anusha/graphql-redis-cache', description: 'Field-level response caching middleware using Redis for Apollo GraphQL server.' }
    ],
    certifications: [
      { title: 'Apollo GraphQL Associate Certification', year: '2022', description: 'Federation, subgraphs, and schema composition.' }
    ]
  },
  {
    email: 'user25@example.com',
    fullName: 'Harsh Vardhan',
    headline: 'Salesforce Developer & CRM Consultant',
    location: 'Gurgaon, India',
    phone: '+91 9876543225',
    experienceYears: 5,
    skills: ['Salesforce Apex', 'LWC (Lightning Web Components)', 'SOQL', 'Sales Cloud', 'Integrations'],
    about: 'Certified Salesforce developer customizing CRM workflows, integrations, and lightning components.',
    languages: ['English', 'Hindi'],
    resumeUrl: 'https://example.com/resumes/harsh_vardhan_resume.pdf',
    educations: [
      { title: 'B.Tech in Computer Science', academy: 'Amity University', year: '2015 - 2019', description: 'Enterprise Software & Cloud Platforms.' }
    ],
    experiences: [
      { title: 'Senior Salesforce Consultant', company: 'CloudConsult Services', startDate: '2019-07', endDate: 'Present', description: 'Built custom Apex triggers and LWC interfaces for enterprise sales teams.' }
    ],
    projects: [
      { title: 'Salesforce REST Integration Suite', link: 'https://github.com/harsh/salesforce-rest-adapter', description: 'Bi-directional sync adapter between Salesforce CRM and external ERP system.' }
    ],
    certifications: [
      { title: 'Salesforce Certified Platform Developer I & II', year: '2021', description: 'Custom Apex and LWC application development.' }
    ]
  },
  {
    email: 'user26@example.com',
    fullName: 'Niharika Sen',
    headline: 'Frontend Engineer (Angular Specialist)',
    location: 'Bhubaneswar, India',
    phone: '+91 9876543226',
    experienceYears: 5,
    skills: ['Angular', 'RxJS', 'NgRx', 'TypeScript', 'HTML5/SCSS', 'Jasmine/Karma'],
    about: 'Specialized in building large-scale enterprise single-page applications with Angular and RxJS.',
    languages: ['English', 'Odia', 'Hindi'],
    resumeUrl: 'https://example.com/resumes/niharika_sen_resume.pdf',
    educations: [
      { title: 'B.Tech in Computer Science', academy: 'KIIT Bhubaneswar', year: '2015 - 2019', description: 'Web Application Architectures.' }
    ],
    experiences: [
      { title: 'Senior Angular Developer', company: 'Enterprise Apps Ltd', startDate: '2019-08', endDate: 'Present', description: 'Developed Angular 16 enterprise portal with NgRx state management.' }
    ],
    projects: [
      { title: 'RxJS Data Stream Dashboard', link: 'https://github.com/niharika/angular-rxjs-dashboard', description: 'Reactive dashboard consuming WebSocket streams with custom RxJS operators.' }
    ],
    certifications: [
      { title: 'Ng-Skill Certified Angular Architect', year: '2022', description: 'Enterprise Angular performance and state architecture.' }
    ]
  },
  {
    email: 'user27@example.com',
    fullName: 'Gaurav Bhatia',
    headline: 'Growth Marketer & SEO Specialist',
    location: 'Delhi, India',
    phone: '+91 9876543227',
    experienceYears: 4,
    skills: ['SEO', 'Google Analytics 4', 'Ahrefs', 'Content Marketing', 'Conversion Rate Optimization'],
    about: 'Driving organic search traffic and optimizing conversion funnels for tech products.',
    languages: ['English', 'Hindi'],
    resumeUrl: 'https://example.com/resumes/gaurav_bhatia_resume.pdf',
    educations: [
      { title: 'B.BA in Marketing', academy: 'IP University Delhi', year: '2016 - 2019', description: 'Digital Marketing & Consumer Behavior.' }
    ],
    experiences: [
      { title: 'SEO & Growth Lead', company: 'ScaleUp Media', startDate: '2020-01', endDate: 'Present', description: 'Grew organic blog search traffic from 10k to 250k monthly sessions.' }
    ],
    projects: [
      { title: 'Programmatic SEO Engine', link: 'https://gauravbhatia.marketing/seo-case-study', description: 'Generated 500+ landing pages with dynamic meta templates driving 50k inbound leads.' }
    ],
    certifications: [
      { title: 'Google Analytics 4 Individual Qualification', year: '2023', description: 'GA4 event tracking and funnel analysis.' }
    ]
  },
  {
    email: 'user28@example.com',
    fullName: 'Tanvi Kulkarni',
    headline: 'iOS Native Developer (Swift & SwiftUI)',
    location: 'Pune, India',
    phone: '+91 9876543228',
    experienceYears: 4,
    skills: ['Swift', 'SwiftUI', 'Combine', 'CoreData', 'Xcode', 'App Store Publishing'],
    about: 'Crafting elegant iOS and iPadOS apps using Apple modern SwiftUI and Swift concurrency.',
    languages: ['English', 'Marathi', 'Hindi'],
    resumeUrl: 'https://example.com/resumes/tanvi_kulkarni_resume.pdf',
    educations: [
      { title: 'B.E. in Computer Engineering', academy: 'MIT Pune', year: '2016 - 2020', description: 'Mobile Software Engineering & HCI.' }
    ],
    experiences: [
      { title: 'iOS Developer', company: 'AppCraft Mobile', startDate: '2020-07', endDate: 'Present', description: 'Built 3 iOS apps utilizing SwiftUI, Combine framework, and in-app subscriptions.' }
    ],
    projects: [
      { title: 'Habit Tracker iOS App', link: 'https://github.com/tanvi/swiftui-habit-tracker', description: 'SwiftUI app featuring custom widgets, CoreData persistence, and interactive charts.' }
    ],
    certifications: [
      { title: 'Apple Certified iOS App Developer', year: '2021', description: 'Swift UI, Combine, and iOS design guidelines.' }
    ]
  },
  {
    email: 'user29@example.com',
    fullName: 'Sanjay Mishra',
    headline: 'Cloud Security & Compliance Lead',
    location: 'Lucknow, India',
    phone: '+91 9876543229',
    experienceYears: 8,
    skills: ['SOC2 Compliance', 'AWS Security', 'IAM', 'ISO 27001', 'SIEM', 'Threat Modeling'],
    about: 'Securing cloud infrastructure, implementing zero-trust frameworks, and leading audit compliance.',
    languages: ['English', 'Hindi'],
    resumeUrl: 'https://example.com/resumes/sanjay_mishra_resume.pdf',
    educations: [
      { title: 'B.Tech in Computer Science', academy: 'NIT Allahabad', year: '2012 - 2016', description: 'Information Security & Cryptography.' }
    ],
    experiences: [
      { title: 'Cloud Security Lead', company: 'SecuredCloud Systems', startDate: '2019-02', endDate: 'Present', description: 'Led SOC2 Type II certification and implemented AWS GuardDuty & SecurityHub.' }
    ],
    projects: [
      { title: 'AWS IAM Policy Linter', link: 'https://github.com/sanjay/aws-iam-policy-checker', description: 'Automated linter flagging overly permissive wildcard permissions in AWS IAM policies.' }
    ],
    certifications: [
      { title: 'Certified Information Systems Security Professional (CISSP)', year: '2020', description: 'Information security governance & risk management.' }
    ]
  },
  {
    email: 'user30@example.com',
    fullName: 'Simran Kaur',
    headline: 'Junior Web Developer (MERN Stack)',
    location: 'Ludhiana, India',
    phone: '+91 9876543230',
    experienceYears: 1,
    skills: ['MongoDB', 'Express.js', 'React', 'Node.js', 'JavaScript', 'Git'],
    about: 'Enthusiastic entry-level MERN stack developer eager to build modern web solutions.',
    languages: ['English', 'Punjabi', 'Hindi'],
    resumeUrl: 'https://example.com/resumes/simran_kaur_resume.pdf',
    educations: [
      { title: 'B.Tech in Computer Science', academy: 'GNDEC Ludhiana', year: '2019 - 2023', description: 'Fullstack Web Development & Database Foundations.' }
    ],
    experiences: [
      { title: 'Junior Web Developer', company: 'WebInnovations Studio', startDate: '2023-07', endDate: 'Present', description: 'Assisted in building React user interfaces and Express backend REST endpoints.' }
    ],
    projects: [
      { title: 'Task Management App', link: 'https://github.com/simran/mern-task-app', description: 'MERN stack app featuring JWT authentication, drag-and-drop task boards, and filter tags.' }
    ],
    certifications: [
      { title: 'FreeCodeCamp Full Stack Web Development Certification', year: '2023', description: 'Web responsive design and JavaScript algorithms.' }
    ]
  }
];

async function main() {
  console.log('🚀 Starting CandidateResume seeding for 30 Candidate Users...');
  let seededResumeCount = 0;

  for (const item of usersData) {
    const user = await prisma.user.findUnique({
      where: { email: item.email },
      include: { candidateProfile: true }
    });

    if (!user || !user.candidateProfile) {
      console.log(`⚠️ Candidate profile not found for ${item.email}, skipping resume...`);
      continue;
    }

    const candidateId = user.candidateProfile.id;

    // Delete existing CandidateResume if it exists (cascades to educations, experiences, projects, certifications)
    await prisma.candidateResume.deleteMany({
      where: { candidateId }
    });

    // Create fresh CandidateResume with nested relations
    await prisma.candidateResume.create({
      data: {
        candidateId,
        resumeUrl: item.resumeUrl,
        summary: item.about,
        skills: item.skills,
        languages: item.languages,
        experienceYears: item.experienceYears,
        educations: {
          create: item.educations
        },
        experiences: {
          create: item.experiences
        },
        projects: {
          create: item.projects
        },
        certifications: {
          create: item.certifications
        }
      }
    });

    seededResumeCount++;
    console.log(`✅ Resume seeded for ${item.email} (${item.fullName})`);
  }

  console.log(`\n🎉 CandidateResume seeding completed successfully!`);
  console.log(`- Created/Updated candidateResume records for ${seededResumeCount} candidate profiles.`);
}

main()
  .catch((e) => {
    console.error('❌ Error during CandidateResume seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
