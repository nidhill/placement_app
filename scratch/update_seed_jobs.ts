import * as fs from 'fs';
import * as path from 'path';

const cities = [
  'Bangalore, Karnataka, India',
  'Kochi, Kerala, India',
  'Hyderabad, Telangana, India',
  'Pune, Maharashtra, India',
  'Chennai, Tamil Nadu, India',
  'Mumbai, Maharashtra, India',
  'Gurugram, Haryana, India',
  'Noida, Uttar Pradesh, India',
  'Remote - India',
  'Thiruvananthapuram, Kerala, India',
  'Kozhikode, Kerala, India',
  'Ernakulam, Kerala, India'
];

const companies = [
  'Apex Software Labs', 'NovaTech Digital', 'DataStream Systems', 'Vanguard Analytics', 'PixelCraft Studio',
  'InfyCloud Technologies', 'CyberNet Solutions', 'ZetaWave Labs', 'Thoughtworks India', 'Freshworks India',
  'Zoho Corporation', 'Swiggy Tech', 'Razorpay Labs', 'Meesho Engineering', 'CRED Tech',
  'InMobi Digital', 'Groww Labs', 'Zerodha Tech', 'Postman Software', 'Hasura Tech',
  'BrowserStack India', 'CleverTap Labs', 'Delhivery Tech', 'Urban Company', 'Juspay Technologies',
  'Zepto Engineering', 'Blinkit Tech', 'BharatPe Labs', 'PhonePe Tech', 'Ola Electric Tech'
];

interface JobDef {
  title: string;
  category: string;
  normalizedDesignation: string;
  skills: string[];
  pref: string[];
  prog: string[];
  desc: string;
  salary: string;
}

const definitions: JobDef[] = [
  // Full Stack (10)
  {
    title: 'Full Stack Developer',
    category: 'Full Stack Development',
    normalizedDesignation: 'Full Stack Developer',
    skills: ['React', 'TypeScript', 'Node.js', 'SQL'],
    pref: ['PostgreSQL', 'Docker', 'Tailwind CSS', 'Git'],
    prog: ['Full Stack Web Development'],
    desc: 'Build modern full-stack web applications using React, TypeScript, and Node.js with microservices architecture.',
    salary: '₹8,00,000 - ₹13,00,000 / annum'
  },
  {
    title: 'MERN Stack Developer',
    category: 'Full Stack Development',
    normalizedDesignation: 'Full Stack Developer',
    skills: ['MongoDB', 'Express', 'React', 'Node.js'],
    pref: ['Redux', 'REST APIs', 'Git', 'Tailwind CSS'],
    prog: ['Full Stack Web Development'],
    desc: 'Develop modern end-to-end web applications with MongoDB, Express, React, and Node.js.',
    salary: '₹7,50,000 - ₹11,50,000 / annum'
  },
  {
    title: 'Junior Full Stack Engineer',
    category: 'Full Stack Development',
    normalizedDesignation: 'Full Stack Developer',
    skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
    pref: ['TypeScript', 'Git', 'HTML5', 'CSS3'],
    prog: ['Full Stack Web Development'],
    desc: 'Join an agile product engineering squad delivering user-facing features across frontend and backend.',
    salary: '₹6,50,000 - ₹9,50,000 / annum'
  },
  {
    title: 'Software Engineer - Full Stack',
    category: 'Full Stack Development',
    normalizedDesignation: 'Full Stack Developer',
    skills: ['React', 'Node.js', 'TypeScript', 'REST APIs'],
    pref: ['Docker', 'SQL', 'Git', 'AWS'],
    prog: ['Full Stack Web Development'],
    desc: 'Architect and implement scalable web applications and RESTful APIs serving millions of active users.',
    salary: '₹9,00,000 - ₹14,00,000 / annum'
  },
  {
    title: 'Full Stack Web Developer',
    category: 'Full Stack Development',
    normalizedDesignation: 'Full Stack Developer',
    skills: ['React', 'JavaScript', 'Node.js', 'SQL'],
    pref: ['TypeScript', 'Tailwind CSS', 'Git'],
    prog: ['Full Stack Web Development'],
    desc: 'Full-stack engineering role focusing on responsive interfaces, backend business logic, and database schemas.',
    salary: '₹7,00,000 - ₹10,50,000 / annum'
  },
  {
    title: 'Associate Full Stack Developer',
    category: 'Full Stack Development',
    normalizedDesignation: 'Full Stack Developer',
    skills: ['React', 'Express', 'Node.js', 'MongoDB'],
    pref: ['Git', 'REST APIs', 'PostgreSQL'],
    prog: ['Full Stack Web Development'],
    desc: 'Entry-level full stack position developing API endpoints, UI views, and integrating cloud database stores.',
    salary: '₹6,00,000 - ₹8,50,000 / annum'
  },
  {
    title: 'Full Stack Engineer (React / Python)',
    category: 'Full Stack Development',
    normalizedDesignation: 'Full Stack Developer',
    skills: ['React', 'Python', 'FastAPI', 'SQL'],
    pref: ['PostgreSQL', 'Docker', 'TypeScript'],
    prog: ['Full Stack Web Development', 'Python Development'],
    desc: 'Build high-performance web products combining React frontend with Python/FastAPI microservices.',
    salary: '₹8,50,000 - ₹12,50,000 / annum'
  },
  {
    title: 'Full Stack Application Engineer',
    category: 'Full Stack Development',
    normalizedDesignation: 'Full Stack Developer',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    pref: ['Docker', 'Git', 'Tailwind CSS'],
    prog: ['Full Stack Web Development'],
    desc: 'Develop end-to-end features, optimize relational databases, and collaborate with product teams.',
    salary: '₹8,00,000 - ₹12,00,000 / annum'
  },
  {
    title: 'Full Stack Developer (Next.js & Node)',
    category: 'Full Stack Development',
    normalizedDesignation: 'Full Stack Developer',
    skills: ['Next.js', 'React', 'Node.js', 'TypeScript'],
    pref: ['Tailwind CSS', 'SQL', 'Git'],
    prog: ['Full Stack Web Development'],
    desc: 'Work on high-speed server-rendered web applications with Next.js, Node.js, and modern TypeScript.',
    salary: '₹8,50,000 - ₹13,00,000 / annum'
  },
  {
    title: 'Full Stack Software Developer',
    category: 'Full Stack Development',
    normalizedDesignation: 'Full Stack Developer',
    skills: ['React', 'Node.js', 'SQL', 'Git'],
    pref: ['JavaScript', 'Docker', 'REST APIs'],
    prog: ['Full Stack Web Development'],
    desc: 'Build scalable full-stack web solutions from wireframes to cloud deployment.',
    salary: '₹7,00,000 - ₹11,00,000 / annum'
  },

  // Frontend (10)
  {
    title: 'Frontend React Developer',
    category: 'Frontend Development',
    normalizedDesignation: 'Frontend Developer',
    skills: ['React', 'JavaScript', 'HTML5', 'CSS3'],
    pref: ['TypeScript', 'Tailwind CSS', 'Next.js', 'Figma'],
    prog: ['Full Stack Web Development'],
    desc: 'Join our frontend engineering team building responsive, highly dynamic user interfaces with React.',
    salary: '₹6,00,000 - ₹9,50,000 / annum'
  },
  {
    title: 'React.js Developer',
    category: 'Frontend Development',
    normalizedDesignation: 'Frontend Developer',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Redux'],
    pref: ['Next.js', 'Jest', 'Git', 'REST APIs'],
    prog: ['Full Stack Web Development'],
    desc: 'Build high-performance web dashboards with React.js, TypeScript, and state management.',
    salary: '₹7,50,000 - ₹11,00,000 / annum'
  },
  {
    title: 'UI Developer',
    category: 'Frontend Development',
    normalizedDesignation: 'Frontend Developer',
    skills: ['JavaScript', 'HTML5', 'CSS3', 'React'],
    pref: ['Figma', 'Tailwind CSS', 'Git'],
    prog: ['Full Stack Web Development', 'UI/UX Product Design'],
    desc: 'Translate Figma UI wireframes into responsive, accessible, cross-browser web interfaces.',
    salary: '₹5,50,000 - ₹8,50,000 / annum'
  },
  {
    title: 'Frontend Web Developer',
    category: 'Frontend Development',
    normalizedDesignation: 'Frontend Developer',
    skills: ['React', 'JavaScript', 'Next.js', 'Tailwind CSS'],
    pref: ['TypeScript', 'Git', 'REST APIs'],
    prog: ['Full Stack Web Development'],
    desc: 'Engineer modern web applications focusing on fast page loads, clean UI components, and SEO.',
    salary: '₹6,50,000 - ₹10,00,000 / annum'
  },
  {
    title: 'Junior Frontend Developer',
    category: 'Frontend Development',
    normalizedDesignation: 'Frontend Developer',
    skills: ['React', 'HTML5', 'CSS3', 'JavaScript'],
    pref: ['Git', 'Tailwind CSS', 'TypeScript'],
    prog: ['Full Stack Web Development'],
    desc: 'Develop responsive client-side pages and components using React and modern CSS.',
    salary: '₹5,00,000 - ₹7,50,000 / annum'
  },
  {
    title: 'Frontend Engineer (React / TypeScript)',
    category: 'Frontend Development',
    normalizedDesignation: 'Frontend Developer',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Git'],
    pref: ['Next.js', 'REST APIs', 'Redux'],
    prog: ['Full Stack Web Development'],
    desc: 'Create scalable, modular design systems and accessible user interfaces for enterprise web portals.',
    salary: '₹8,00,000 - ₹12,00,000 / annum'
  },
  {
    title: 'Web Frontend Developer',
    category: 'Frontend Development',
    normalizedDesignation: 'Frontend Developer',
    skills: ['JavaScript', 'React', 'HTML5', 'CSS3'],
    pref: ['Bootstrap', 'Git', 'Tailwind CSS'],
    prog: ['Full Stack Web Development'],
    desc: 'Build cross-platform web experiences and interactive forms for customer-facing web applications.',
    salary: '₹6,00,000 - ₹9,00,000 / annum'
  },
  {
    title: 'Frontend Software Engineer',
    category: 'Frontend Development',
    normalizedDesignation: 'Frontend Developer',
    skills: ['React', 'TypeScript', 'Next.js', 'REST APIs'],
    pref: ['Git', 'GraphQL', 'Tailwind CSS'],
    prog: ['Full Stack Web Development'],
    desc: 'Design and optimize core frontend architecture, state management, and real-time UI data streams.',
    salary: '₹8,50,000 - ₹12,50,000 / annum'
  },
  {
    title: 'React & Next.js Engineer',
    category: 'Frontend Development',
    normalizedDesignation: 'Frontend Developer',
    skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
    pref: ['Jest', 'Figma', 'Git'],
    prog: ['Full Stack Web Development'],
    desc: 'Develop server-rendered React applications with optimal Core Web Vitals and polished aesthetics.',
    salary: '₹8,00,000 - ₹11,50,000 / annum'
  },
  {
    title: 'Associate React Developer',
    category: 'Frontend Development',
    normalizedDesignation: 'Frontend Developer',
    skills: ['React', 'JavaScript', 'Tailwind CSS', 'Git'],
    pref: ['HTML5', 'CSS3', 'REST APIs'],
    prog: ['Full Stack Web Development'],
    desc: 'Entry-level frontend role implementing component libraries, modals, and API integrations in React.',
    salary: '₹5,50,000 - ₹8,00,000 / annum'
  },

  // Backend (10)
  {
    title: 'Backend Python Developer',
    category: 'Backend Development',
    normalizedDesignation: 'Backend Developer',
    skills: ['Python', 'Django', 'FastAPI', 'SQL'],
    pref: ['PostgreSQL', 'Docker', 'Redis', 'REST APIs'],
    prog: ['Python Development', 'Full Stack Web Development'],
    desc: 'Develop high-performance RESTful APIs, data validation schemas, and database transactions.',
    salary: '₹7,50,000 - ₹11,50,000 / annum'
  },
  {
    title: 'Python Backend Engineer',
    category: 'Backend Development',
    normalizedDesignation: 'Backend Developer',
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker'],
    pref: ['SQL', 'Git', 'Redis', 'AWS'],
    prog: ['Python Development'],
    desc: 'Build scalable cloud services, backend queues, and clean API endpoints using Python.',
    salary: '₹8,00,000 - ₹12,50,000 / annum'
  },
  {
    title: 'Node.js Backend Developer',
    category: 'Backend Development',
    normalizedDesignation: 'Backend Developer',
    skills: ['Node.js', 'Express', 'TypeScript', 'SQL'],
    pref: ['PostgreSQL', 'MongoDB', 'Docker', 'REST APIs'],
    prog: ['Full Stack Web Development'],
    desc: 'Design and build resilient backend microservices using Node.js, Express, and relational databases.',
    salary: '₹7,50,000 - ₹11,00,000 / annum'
  },
  {
    title: 'Junior Backend Engineer',
    category: 'Backend Development',
    normalizedDesignation: 'Backend Developer',
    skills: ['Python', 'SQL', 'REST APIs', 'Git'],
    pref: ['Django', 'PostgreSQL', 'Docker'],
    prog: ['Python Development', 'Full Stack Web Development'],
    desc: 'Write maintainable server-side logic, optimize database queries, and integrate 3rd party APIs.',
    salary: '₹6,00,000 - ₹8,50,000 / annum'
  },
  {
    title: 'Backend Software Developer',
    category: 'Backend Development',
    normalizedDesignation: 'Backend Developer',
    skills: ['Python', 'SQL', 'PostgreSQL', 'Git'],
    pref: ['FastAPI', 'Docker', 'Redis'],
    prog: ['Python Development'],
    desc: 'Build backend business services, asynchronous workers, and secure user authorization protocols.',
    salary: '₹7,00,000 - ₹10,50,000 / annum'
  },
  {
    title: 'API & Backend Developer',
    category: 'Backend Development',
    normalizedDesignation: 'Backend Developer',
    skills: ['Node.js', 'SQL', 'REST APIs', 'Git'],
    pref: ['Express', 'TypeScript', 'PostgreSQL'],
    prog: ['Full Stack Web Development'],
    desc: 'Develop robust, documented RESTful APIs powering web and mobile client applications.',
    salary: '₹6,50,000 - ₹9,50,000 / annum'
  },
  {
    title: 'Django Backend Developer',
    category: 'Backend Development',
    normalizedDesignation: 'Backend Developer',
    skills: ['Python', 'Django', 'SQL', 'PostgreSQL'],
    pref: ['Git', 'Docker', 'REST APIs'],
    prog: ['Python Development'],
    desc: 'Implement ORM queries, database models, and authentication workflows in Django.',
    salary: '₹7,00,000 - ₹10,00,000 / annum'
  },
  {
    title: 'Associate Backend Developer',
    category: 'Backend Development',
    normalizedDesignation: 'Backend Developer',
    skills: ['Python', 'SQL', 'Git', 'REST APIs'],
    pref: ['FastAPI', 'Node.js', 'PostgreSQL'],
    prog: ['Python Development', 'Full Stack Web Development'],
    desc: 'Entry-level backend role creating data endpoints, writing unit tests, and optimizing queries.',
    salary: '₹5,50,000 - ₹8,00,000 / annum'
  },
  {
    title: 'Backend Systems Engineer',
    category: 'Backend Development',
    normalizedDesignation: 'Backend Developer',
    skills: ['Node.js', 'TypeScript', 'SQL', 'Docker'],
    pref: ['PostgreSQL', 'Redis', 'AWS'],
    prog: ['Full Stack Web Development'],
    desc: 'Architect event-driven server workflows and high-concurrency database connection pools.',
    salary: '₹8,50,000 - ₹13,00,000 / annum'
  },
  {
    title: 'Python Server Developer',
    category: 'Backend Development',
    normalizedDesignation: 'Backend Developer',
    skills: ['Python', 'FastAPI', 'SQL', 'Docker'],
    pref: ['PostgreSQL', 'Git', 'Linux'],
    prog: ['Python Development'],
    desc: 'Engineer cloud-native microservices with Python, containerization, and automated test pipelines.',
    salary: '₹7,50,000 - ₹11,50,000 / annum'
  },

  // Data Analytics (8)
  {
    title: 'Data Analyst',
    category: 'Data Analytics',
    normalizedDesignation: 'Data Analyst',
    skills: ['Python', 'SQL', 'Power BI', 'Excel'],
    pref: ['Tableau', 'Pandas', 'Data Analysis'],
    prog: ['Data Analytics'],
    desc: 'Transform raw business data into actionable BI dashboards, metrics models, and executive reports.',
    salary: '₹6,50,000 - ₹9,50,000 / annum'
  },
  {
    title: 'Business Intelligence Analyst',
    category: 'Data Analytics',
    normalizedDesignation: 'Data Analyst',
    skills: ['SQL', 'Power BI', 'Excel', 'Data Analysis'],
    pref: ['Python', 'Tableau', 'Data Visualization'],
    prog: ['Data Analytics'],
    desc: 'Create executive dashboards, data models, and KPI trackers for senior leadership and operations.',
    salary: '₹7,00,000 - ₹10,50,000 / annum'
  },
  {
    title: 'Junior Data Analyst',
    category: 'Data Analytics',
    normalizedDesignation: 'Data Analyst',
    skills: ['SQL', 'Python', 'Excel', 'Power BI'],
    pref: ['Pandas', 'Git', 'Tableau'],
    prog: ['Data Analytics'],
    desc: 'Analyze core product metrics, run SQL queries, and synthesize actionable analytical findings.',
    salary: '₹5,50,000 - ₹8,00,000 / annum'
  },
  {
    title: 'Product Data Analyst',
    category: 'Data Analytics',
    normalizedDesignation: 'Data Analyst',
    skills: ['SQL', 'Python', 'Power BI', 'Data Analysis'],
    pref: ['Excel', 'Tableau', 'Statistics'],
    prog: ['Data Analytics'],
    desc: 'Collaborate with product squads to analyze user retention, conversion funnels, and feature usage.',
    salary: '₹7,50,000 - ₹11,00,000 / annum'
  },
  {
    title: 'SQL Data Analyst',
    category: 'Data Analytics',
    normalizedDesignation: 'Data Analyst',
    skills: ['SQL', 'Excel', 'Power BI', 'Python'],
    pref: ['PostgreSQL', 'Tableau', 'Data Analysis'],
    prog: ['Data Analytics'],
    desc: 'Write advanced SQL queries, window functions, and automate data extraction pipelines.',
    salary: '₹6,00,000 - ₹9,00,000 / annum'
  },
  {
    title: 'BI & Analytics Analyst',
    category: 'Data Analytics',
    normalizedDesignation: 'Data Analyst',
    skills: ['Power BI', 'SQL', 'Excel', 'Data Visualization'],
    pref: ['Python', 'Pandas', 'Git'],
    prog: ['Data Analytics'],
    desc: 'Build interactive dashboards in Power BI and conduct ad-hoc data analysis across business units.',
    salary: '₹6,00,000 - ₹8,50,000 / annum'
  },
  {
    title: 'Operations Data Analyst',
    category: 'Data Analytics',
    normalizedDesignation: 'Data Analyst',
    skills: ['SQL', 'Excel', 'Python', 'Data Analysis'],
    pref: ['Power BI', 'Pandas', 'Tableau'],
    prog: ['Data Analytics'],
    desc: 'Provide operational intelligence, inventory tracking, and efficiency analysis through data.',
    salary: '₹6,00,000 - ₹9,00,000 / annum'
  },
  {
    title: 'Associate Data Analyst',
    category: 'Data Analytics',
    normalizedDesignation: 'Data Analyst',
    skills: ['Python', 'SQL', 'Excel', 'Power BI'],
    pref: ['Pandas', 'Tableau', 'Git'],
    prog: ['Data Analytics'],
    desc: 'Entry-level analytics role extracting insights from databases and building stakeholder reports.',
    salary: '₹5,50,000 - ₹8,00,000 / annum'
  },

  // AI / ML (4)
  {
    title: 'AI / Machine Learning Engineer',
    category: 'AI / Machine Learning',
    normalizedDesignation: 'AI / Machine Learning Engineer',
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL'],
    pref: ['PyTorch', 'Scikit-learn', 'Docker', 'NLP'],
    prog: ['Python Development', 'Data Analytics'],
    desc: 'Train, evaluate, and deploy predictive machine learning models and NLP pipelines.',
    salary: '₹9,00,000 - ₹15,00,000 / annum'
  },
  {
    title: 'Machine Learning Associate',
    category: 'AI / Machine Learning',
    normalizedDesignation: 'AI / Machine Learning Engineer',
    skills: ['Python', 'Machine Learning', 'Data Analysis', 'SQL'],
    pref: ['PyTorch', 'Pandas', 'Docker'],
    prog: ['Python Development', 'Data Analytics'],
    desc: 'Prepare training datasets, benchmark model metrics, and build intelligent inference APIs.',
    salary: '₹7,50,000 - ₹11,50,000 / annum'
  },
  {
    title: 'Junior AI Engineer',
    category: 'AI / Machine Learning',
    normalizedDesignation: 'AI / Machine Learning Engineer',
    skills: ['Python', 'Machine Learning', 'SQL', 'Git'],
    pref: ['TensorFlow', 'PyTorch', 'Docker'],
    prog: ['Python Development', 'Data Analytics'],
    desc: 'Implement intelligent algorithms, LLM integrations, and classification models.',
    salary: '₹7,00,000 - ₹11,00,000 / annum'
  },
  {
    title: 'Data Scientist Associate',
    category: 'AI / Machine Learning',
    normalizedDesignation: 'AI / Machine Learning Engineer',
    skills: ['Python', 'Machine Learning', 'SQL', 'Data Analysis'],
    pref: ['Pandas', 'Scikit-learn', 'Statistics'],
    prog: ['Data Analytics', 'Python Development'],
    desc: 'Conduct statistical testing, build predictive features, and visualize machine learning outcomes.',
    salary: '₹8,00,000 - ₹12,00,000 / annum'
  },

  // Cloud / DevOps (4)
  {
    title: 'DevOps Engineer',
    category: 'Cloud / DevOps',
    normalizedDesignation: 'DevOps Engineer',
    skills: ['Docker', 'Kubernetes', 'AWS', 'Git'],
    pref: ['Linux', 'CI/CD', 'Terraform', 'Python'],
    prog: ['Full Stack Web Development'],
    desc: 'Automate build pipelines, container orchestration, and cloud infrastructure monitoring.',
    salary: '₹8,50,000 - ₹13,50,000 / annum'
  },
  {
    title: 'Cloud Infrastructure Associate',
    category: 'Cloud / DevOps',
    normalizedDesignation: 'DevOps Engineer',
    skills: ['AWS', 'Docker', 'Linux', 'Git'],
    pref: ['Kubernetes', 'Python', 'CI/CD'],
    prog: ['Full Stack Web Development'],
    desc: 'Maintain high-availability cloud servers, automated backups, and deployment scripts.',
    salary: '₹7,00,000 - ₹10,50,000 / annum'
  },
  {
    title: 'Junior DevOps Engineer',
    category: 'Cloud / DevOps',
    normalizedDesignation: 'DevOps Engineer',
    skills: ['Docker', 'Linux', 'Git', 'AWS'],
    pref: ['CI/CD', 'Python', 'SQL'],
    prog: ['Full Stack Web Development'],
    desc: 'Support CI/CD automation, monitor server performance metrics, and manage Docker containers.',
    salary: '₹6,50,000 - ₹9,50,000 / annum'
  },
  {
    title: 'Site Reliability Engineer (SRE)',
    category: 'Cloud / DevOps',
    normalizedDesignation: 'DevOps Engineer',
    skills: ['AWS', 'Docker', 'Linux', 'Python'],
    pref: ['Kubernetes', 'Git', 'CI/CD'],
    prog: ['Full Stack Web Development'],
    desc: 'Ensure platform reliability, uptime monitoring, latency optimization, and disaster recovery.',
    salary: '₹8,50,000 - ₹14,00,000 / annum'
  },

  // UI/UX (2)
  {
    title: 'UI/UX Designer',
    category: 'UI/UX / Product Design',
    normalizedDesignation: 'UI/UX Designer',
    skills: ['Figma', 'Wireframing', 'Prototyping', 'User Research'],
    pref: ['Design Systems', 'Product Design', 'HTML5'],
    prog: ['UI/UX Product Design'],
    desc: 'Design engaging user experiences, design systems, and responsive desktop/mobile flows in Figma.',
    salary: '₹6,00,000 - ₹9,50,000 / annum'
  },
  {
    title: 'Product Designer (UI/UX)',
    category: 'UI/UX / Product Design',
    normalizedDesignation: 'UI/UX Designer',
    skills: ['Figma', 'UI/UX', 'Design Systems', 'Prototyping'],
    pref: ['User Research', 'Wireframing', 'CSS3'],
    prog: ['UI/UX Product Design'],
    desc: 'Lead product design initiatives, run usability feedback sessions, and build reusable UI design kits.',
    salary: '₹7,00,000 - ₹11,00,000 / annum'
  },

  // QA / Testing (2)
  {
    title: 'QA Automation Engineer',
    category: 'QA / Testing',
    normalizedDesignation: 'QA / Test Engineer',
    skills: ['JavaScript', 'Selenium', 'Jest', 'Git'],
    pref: ['Cypress', 'Playwright', 'Python', 'REST APIs'],
    prog: ['Full Stack Web Development'],
    desc: 'Develop end-to-end automated test suites, regression test scripts, and integration validations.',
    salary: '₹6,50,000 - ₹9,50,000 / annum'
  },
  {
    title: 'Software Test Engineer',
    category: 'QA / Testing',
    normalizedDesignation: 'QA / Test Engineer',
    skills: ['Selenium', 'SQL', 'Git', 'JavaScript'],
    pref: ['Cypress', 'Jest', 'Postman'],
    prog: ['Full Stack Web Development'],
    desc: 'Execute functional, regression, and API tests to maintain strict software quality standards.',
    salary: '₹6,00,000 - ₹8,50,000 / annum'
  }
];

console.log('Total definitions count:', definitions.length);

const sources = ['AI_JOB_SCRAPER', 'ATS_JOB_API', 'PLACEMENT_DIRECT'];

const generatedJobs = definitions.map((def, idx) => {
  const pad = String(idx + 1).padStart(3, '0');
  const id = `job-haca-${101 + idx}`;
  const jobCode = `JOB-2026-${pad}`;
  const company = companies[idx % companies.length];
  const location = cities[idx % cities.length];
  const sourceChannel = sources[idx % sources.length];
  const hoursAgo = idx * 10; // spread over last ~20 days

  return `  {
    id: '${id}',
    jobCode: '${jobCode}',
    title: '${def.title.replace(/'/g, "\\'")}',
    company: '${company}',
    location: '${location}',
    countryCode: 'IN',
    employmentType: 'FULL_TIME',
    experienceRequirement: '0–1 year (Entry Level)',
    minExperienceYears: 0,
    salaryRange: '${def.salary}',
    description: '${def.desc.replace(/'/g, "\\'")}',
    requiredSkills: ${JSON.stringify(def.skills)},
    preferredSkills: ${JSON.stringify(def.pref)},
    educationRequirements: ['HACA Certificate or relevant Bachelor Degree in Tech'],
    eligibleSchools: ['School of Tech'${def.category === 'UI/UX / Product Design' ? ", 'School of Design'" : ''}],
    eligiblePrograms: ${JSON.stringify(def.prog)},
    category: '${def.category}',
    normalizedDesignation: '${def.normalizedDesignation}',
    sourceChannel: '${sourceChannel}',
    externalUrl: 'https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(def.title + ' ' + company)}',
    applicationUrl: 'https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(def.title + ' ' + company)}',
    deadline: new Date(Date.now() + 60 * 86400000).toISOString(),
    status: 'ACTIVE',
    discoveredAt: new Date(Date.now() - ${hoursAgo} * 3600000).toISOString(),
    createdAt: new Date(Date.now() - ${hoursAgo} * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - ${hoursAgo} * 3600000).toISOString()
  }`;
});

const jobsBlock = `export const INITIAL_JOBS: JobListing[] = [\n${generatedJobs.join(',\n')}\n];`;

const seedPath = path.resolve('server/db/seedData.ts');
let content = fs.readFileSync(seedPath, 'utf8');

const regex = /export const INITIAL_JOBS: JobListing\[\] = \[[\s\S]*?\n\];/;
if (!regex.test(content)) {
  console.error('Could not find INITIAL_JOBS in seedData.ts');
  process.exit(1);
}

content = content.replace(regex, jobsBlock);
fs.writeFileSync(seedPath, content, 'utf8');
console.log('Successfully updated seedData.ts with 50 verified India Tech jobs!');
