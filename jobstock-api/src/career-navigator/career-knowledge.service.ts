import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { pipeline } from '@xenova/transformers';

export interface CareerRole {
  title: string;
  level: string;
  description: string;
  salaryRange: string;
  experienceRequired: string;
  requiredSkills: string[];
  recommendedProjects: string[];
  recommendedCertifications: string[];
  requiredTechnologies: string[];
  learningOrder: string[];
  nextCareerRole: string;
}

const CAREER_KNOWLEDGE_BASE: CareerRole[] = [
  {
    title: 'Software Engineer',
    level: 'Mid-Level',
    description: 'Develops, tests, and maintains core software applications. Solves complex technical challenges and writes clean, scalable code.',
    salaryRange: '₹8,00,000 - ₹15,00,000 PA',
    experienceRequired: '2-4 years',
    requiredSkills: ['Data Structures', 'Algorithms', 'System Design', 'Git', 'Agile'],
    recommendedProjects: ['Inventory Management System', 'Chat Application'],
    recommendedCertifications: ['AWS Certified Developer', 'Oracle Certified Professional'],
    requiredTechnologies: ['Java / Python / C++', 'SQL', 'Docker', 'Linux'],
    learningOrder: ['Core Language Concepts', 'DS & Algorithms', 'Database Design', 'Version Control', 'System Architecture'],
    nextCareerRole: 'Senior Software Engineer'
  },
  {
    title: 'Java Developer',
    level: 'Entry to Mid-Level',
    description: 'Specializes in building enterprise-grade backend systems and APIs using the Java ecosystem.',
    salaryRange: '₹6,00,000 - ₹12,00,000 PA',
    experienceRequired: '1-3 years',
    requiredSkills: ['Java', 'Spring Boot', 'Hibernate', 'REST APIs', 'Microservices', 'JUnit', 'SQL'],
    recommendedProjects: ['Banking Application', 'E-commerce Backend', 'Microservices Project'],
    recommendedCertifications: ['Oracle Certified Associate, Java SE 8 Programmer', 'Spring Professional Certification'],
    requiredTechnologies: ['Java 11+', 'Spring Framework', 'PostgreSQL / MySQL', 'Maven / Gradle', 'Kafka'],
    learningOrder: ['Java Basics', 'OOP', 'Collections', 'Spring Core', 'Spring Boot', 'JPA/Hibernate', 'Microservices'],
    nextCareerRole: 'Senior Java Developer'
  },
  {
    title: 'Full Stack Developer',
    level: 'Mid-Level',
    description: 'Handles both frontend client and backend server development. Builds end-to-end web applications.',
    salaryRange: '₹7,00,000 - ₹14,00,000 PA',
    experienceRequired: '2-5 years',
    requiredSkills: ['Frontend Frameworks', 'Backend APIs', 'Database Management', 'State Management', 'Web Security'],
    recommendedProjects: ['Full-stack E-commerce Platform', 'Social Media Clone', 'Task Management Tool'],
    recommendedCertifications: ['Meta Front-End Developer', 'IBM Full Stack Software Developer'],
    requiredTechnologies: ['React / Angular', 'Node.js / Express', 'MongoDB / PostgreSQL', 'TypeScript', 'Tailwind CSS'],
    learningOrder: ['HTML/CSS/JS', 'Frontend Framework', 'Node.js', 'Databases', 'Authentication', 'Deployment'],
    nextCareerRole: 'Technical Lead'
  },
  {
    title: 'Frontend Developer',
    level: 'Entry to Mid-Level',
    description: 'Creates user interfaces and ensures an optimal user experience across various devices and browsers.',
    salaryRange: '₹5,00,000 - ₹11,00,000 PA',
    experienceRequired: '1-3 years',
    requiredSkills: ['UI/UX Implementation', 'Responsive Design', 'State Management', 'Performance Optimization'],
    recommendedProjects: ['Portfolio Website', 'Weather Dashboard', 'Movie Database App'],
    recommendedCertifications: ['Google UX Design Professional', 'Meta Front-End Developer'],
    requiredTechnologies: ['React / Vue', 'CSS / SASS', 'JavaScript / TypeScript', 'Webpack / Vite', 'Redux / Context'],
    learningOrder: ['Semantic HTML', 'CSS Grid/Flexbox', 'Advanced JS', 'React Ecosystem', 'Testing'],
    nextCareerRole: 'Senior Frontend Developer'
  },
  {
    title: 'Backend Developer',
    level: 'Mid-Level',
    description: 'Focuses on server-side logic, databases, and application architecture ensuring high performance and responsiveness.',
    salaryRange: '₹7,00,000 - ₹14,00,000 PA',
    experienceRequired: '2-4 years',
    requiredSkills: ['API Design', 'Database Optimization', 'Authentication/Authorization', 'Caching', 'Message Queues'],
    recommendedProjects: ['Payment Gateway Integration', 'Real-time Chat Backend', 'URL Shortener'],
    recommendedCertifications: ['AWS Certified Solutions Architect', 'Google Cloud Professional Cloud Architect'],
    requiredTechnologies: ['Node.js / Python / Go', 'PostgreSQL / MongoDB', 'Redis', 'RabbitMQ / Kafka', 'Docker'],
    learningOrder: ['Backend Language', 'Relational Databases', 'NoSQL', 'API Security', 'Caching Strategies', 'Microservices'],
    nextCareerRole: 'Senior Backend Developer'
  },
  {
    title: 'DevOps Engineer',
    level: 'Mid to Senior',
    description: 'Bridges development and operations to automate workflows, manage infrastructure, and ensure smooth deployments.',
    salaryRange: '₹10,00,000 - ₹20,00,000 PA',
    experienceRequired: '3-6 years',
    requiredSkills: ['CI/CD Pipelines', 'Infrastructure as Code', 'Monitoring & Logging', 'Containerization', 'Cloud Security'],
    recommendedProjects: ['Automated CI/CD Pipeline', 'Kubernetes Cluster Setup', 'Infrastructure Monitoring Dashboard'],
    recommendedCertifications: ['AWS Certified DevOps Engineer', 'Certified Kubernetes Administrator (CKA)'],
    requiredTechnologies: ['Jenkins / GitHub Actions', 'Docker', 'Kubernetes', 'Terraform / Ansible', 'Prometheus / Grafana'],
    learningOrder: ['Linux Basics', 'Scripting (Bash/Python)', 'Git', 'Containers', 'CI/CD Tools', 'Orchestration', 'IaC'],
    nextCareerRole: 'DevOps Architect'
  },
  {
    title: 'Cloud Engineer',
    level: 'Mid to Senior',
    description: 'Designs and manages cloud-based systems and services, optimizing for scale, cost, and security.',
    salaryRange: '₹10,00,000 - ₹22,00,000 PA',
    experienceRequired: '3-5 years',
    requiredSkills: ['Cloud Architecture', 'Networking', 'Identity & Access Management', 'Serverless', 'Cost Optimization'],
    recommendedProjects: ['Serverless Web App', 'Multi-Region High Availability Setup', 'Cloud Migration Strategy'],
    recommendedCertifications: ['AWS Certified Solutions Architect', 'Microsoft Certified: Azure Solutions Architect Expert'],
    requiredTechnologies: ['AWS / Azure / GCP', 'Terraform', 'Serverless Framework', 'Linux', 'Python'],
    learningOrder: ['Networking Basics', 'Cloud Providers', 'Compute & Storage Services', 'Security', 'Automation'],
    nextCareerRole: 'Cloud Architect'
  },
  {
    title: 'Data Scientist',
    level: 'Mid-Level',
    description: 'Analyzes large datasets to extract actionable insights using statistical techniques and machine learning models.',
    salaryRange: '₹9,00,000 - ₹18,00,000 PA',
    experienceRequired: '2-5 years',
    requiredSkills: ['Statistical Analysis', 'Machine Learning', 'Data Wrangling', 'Data Visualization', 'A/B Testing'],
    recommendedProjects: ['Customer Churn Prediction', 'Recommendation System', 'Sales Forecasting'],
    recommendedCertifications: ['IBM Data Science Professional', 'Google Data Analytics'],
    requiredTechnologies: ['Python / R', 'Pandas', 'Scikit-learn', 'SQL', 'Tableau / PowerBI'],
    learningOrder: ['Math/Stats Basics', 'Python for Data', 'Data Cleaning', 'Exploratory Data Analysis', 'Machine Learning Models'],
    nextCareerRole: 'Senior Data Scientist'
  },
  {
    title: 'AI Engineer',
    level: 'Senior Level',
    description: 'Builds and deploys artificial intelligence models and scalable AI-driven applications using LLMs and computer vision.',
    salaryRange: '₹12,00,000 - ₹25,00,000 PA',
    experienceRequired: '3-6 years',
    requiredSkills: ['Deep Learning', 'NLP', 'Computer Vision', 'Prompt Engineering', 'Model Deployment'],
    recommendedProjects: ['LLM RAG Chatbot', 'Image Classification App', 'Generative AI Content Creator'],
    recommendedCertifications: ['DeepLearning.AI TensorFlow Developer', 'AWS Certified Machine Learning'],
    requiredTechnologies: ['Python', 'TensorFlow / PyTorch', 'Hugging Face', 'LangChain', 'OpenAI / Gemini APIs'],
    learningOrder: ['Machine Learning', 'Neural Networks', 'NLP / CV', 'Model Fine-tuning', 'Deployment (MLOps)'],
    nextCareerRole: 'Principal AI Engineer'
  },
  {
    title: 'Machine Learning Engineer',
    level: 'Mid to Senior',
    description: 'Focuses on designing, training, and productionizing machine learning models at scale.',
    salaryRange: '₹10,00,000 - ₹22,00,000 PA',
    experienceRequired: '3-5 years',
    requiredSkills: ['Model Optimization', 'Feature Engineering', 'MLOps', 'Distributed Training', 'Data Pipelines'],
    recommendedProjects: ['Fraud Detection System', 'Object Detection Pipeline', 'Real-time Pricing Engine'],
    recommendedCertifications: ['Google Professional Machine Learning Engineer', 'AWS Certified Machine Learning'],
    requiredTechnologies: ['Python', 'PyTorch / TensorFlow', 'Kubeflow / MLflow', 'Apache Spark', 'Docker'],
    learningOrder: ['Software Engineering Basics', 'ML Algorithms', 'Data Engineering', 'Model Serving', 'MLOps Tools'],
    nextCareerRole: 'Senior Machine Learning Engineer'
  },
  {
    title: 'Cyber Security Engineer',
    level: 'Mid-Level',
    description: 'Protects systems and networks from cyber threats. Conducts penetration testing and manages security protocols.',
    salaryRange: '₹8,00,000 - ₹16,00,000 PA',
    experienceRequired: '3-5 years',
    requiredSkills: ['Penetration Testing', 'Vulnerability Assessment', 'Network Security', 'Cryptography', 'Incident Response'],
    recommendedProjects: ['Network Vulnerability Scanner', 'Secure Authentication System', 'Malware Analysis Sandbox'],
    recommendedCertifications: ['Certified Ethical Hacker (CEH)', 'CompTIA Security+', 'CISSP'],
    requiredTechnologies: ['Linux / Kali', 'Wireshark', 'Metasploit', 'Python / Bash', 'SIEM Tools'],
    learningOrder: ['Networking Fundamentals', 'OS Security', 'Ethical Hacking', 'Security Architecture', 'Incident Response'],
    nextCareerRole: 'Security Architect'
  },
  {
    title: 'Mobile Developer',
    level: 'Entry to Mid-Level',
    description: 'Creates applications for mobile devices (iOS and Android) focusing on performance and mobile UX.',
    salaryRange: '₹6,00,000 - ₹13,00,000 PA',
    experienceRequired: '1-4 years',
    requiredSkills: ['Mobile UI/UX', 'State Management', 'API Integration', 'App Store Deployment', 'Offline Storage'],
    recommendedProjects: ['Fitness Tracker App', 'Food Delivery App', 'Expense Manager'],
    recommendedCertifications: ['Associate Android Developer', 'iOS Developer Certification'],
    requiredTechnologies: ['React Native / Flutter', 'Swift / Kotlin', 'SQLite / Realm', 'Firebase', 'REST/GraphQL'],
    learningOrder: ['Mobile UI Basics', 'State Management', 'Device Hardware APIs', 'Data Persistence', 'App Deployment'],
    nextCareerRole: 'Senior Mobile Developer'
  },
  {
    title: 'UI/UX Designer',
    level: 'Mid-Level',
    description: 'Designs intuitive, visually appealing user interfaces and conducts research to ensure a great user experience.',
    salaryRange: '₹6,00,000 - ₹12,00,000 PA',
    experienceRequired: '2-4 years',
    requiredSkills: ['Wireframing', 'Prototyping', 'User Research', 'Interaction Design', 'Visual Design'],
    recommendedProjects: ['E-commerce App Redesign', 'Dashboard Interface Design', 'UX Case Study'],
    recommendedCertifications: ['Google UX Design Professional Certificate', 'Nielsen Norman Group UX Certification'],
    requiredTechnologies: ['Figma / Sketch', 'Adobe XD', 'InVision', 'Zeplin', 'Webflow'],
    learningOrder: ['Design Principles', 'User Research', 'Wireframing', 'High-Fidelity Prototyping', 'Usability Testing'],
    nextCareerRole: 'Lead Product Designer'
  },
  {
    title: 'QA Engineer',
    level: 'Entry to Mid-Level',
    description: 'Ensures software quality by designing automated tests, finding bugs, and executing testing strategies.',
    salaryRange: '₹5,00,000 - ₹10,00,000 PA',
    experienceRequired: '1-3 years',
    requiredSkills: ['Test Automation', 'Manual Testing', 'API Testing', 'Performance Testing', 'Defect Tracking'],
    recommendedProjects: ['Automated UI Test Suite', 'API Testing Framework', 'Load Testing Script'],
    recommendedCertifications: ['ISTQB Foundation Level', 'Certified Software Quality Engineer (CSQE)'],
    requiredTechnologies: ['Selenium / Cypress', 'Postman', 'JUnit / TestNG', 'Jira', 'Jenkins'],
    learningOrder: ['Manual Testing', 'Test Case Design', 'API Testing', 'UI Automation', 'CI/CD Integration'],
    nextCareerRole: 'Senior QA Engineer / SDET'
  },
  {
    title: 'Product Manager',
    level: 'Mid to Senior',
    description: 'Guides the success of a product and leads the cross-functional team that is responsible for improving it.',
    salaryRange: '₹10,00,000 - ₹25,00,000 PA',
    experienceRequired: '4-7 years',
    requiredSkills: ['Product Strategy', 'Agile Methodologies', 'User Empathy', 'Data-Driven Decision Making', 'Roadmapping'],
    recommendedProjects: ['Product Launch Strategy', 'Market Analysis Report', 'Feature Prioritization Framework'],
    recommendedCertifications: ['Certified Scrum Product Owner (CSPO)', 'Pragmatic Institute Certification'],
    requiredTechnologies: ['Jira / Asana', 'Mixpanel / Google Analytics', 'Figma', 'Confluence', 'SQL (Basic)'],
    learningOrder: ['Market Research', 'Agile & Scrum', 'Roadmapping', 'Analytics & KPIs', 'Stakeholder Management'],
    nextCareerRole: 'Director of Product'
  }
];

@Injectable()
export class CareerKnowledgeService implements OnModuleInit {
  private readonly logger = new Logger(CareerKnowledgeService.name);
  private extractor: any = null;
  private embeddedRoles: { role: CareerRole; embedding: number[] }[] = [];

  async onModuleInit() {
    try {
      this.logger.log('Initializing local embedding model (Xenova/all-MiniLM-L6-v2)...');
      // @ts-ignore
      this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true,
      });

      this.logger.log('Computing embeddings for the Career Knowledge Base...');
      for (const role of CAREER_KNOWLEDGE_BASE) {
        const textToEmbed = `${role.title}. ${role.description}. Required Skills: ${role.requiredSkills.join(', ')}. Tech: ${role.requiredTechnologies.join(', ')}`;
        const output = await this.extractor(textToEmbed, { pooling: 'mean', normalize: true });
        const embedding = Array.from(output.data) as number[];
        this.embeddedRoles.push({ role, embedding });
      }
      this.logger.log(`Successfully embedded ${this.embeddedRoles.length} roles.`);
    } catch (err) {
      this.logger.error('Failed to initialize embedding model', err);
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    if (!this.extractor) {
      throw new Error('Embedding model not initialized');
    }
    const output = await this.extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data) as number[];
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async search(query: string, topK: number = 3): Promise<CareerRole[]> {
    if (this.embeddedRoles.length === 0) {
      return CAREER_KNOWLEDGE_BASE.slice(0, topK); // Fallback if embeddings failed
    }

    const queryEmbedding = await this.getEmbedding(query);

    const scored = this.embeddedRoles.map((item) => {
      const score = this.cosineSimilarity(queryEmbedding, item.embedding);
      return { role: item.role, score };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK).map(s => s.role);
  }
}
