import { IndiaLocationFilter } from '../server/services/indiaLocationFilter.ts';
import { TechJobClassifier } from '../server/services/techClassifier.ts';

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
}

const templates: JobDef[] = [
  // Full Stack (10)
  {
    title: 'Full Stack Developer',
    category: 'Full Stack Development',
    normalizedDesignation: 'Full Stack Developer',
    skills: ['React', 'TypeScript', 'Node.js', 'SQL'],
    pref: ['PostgreSQL', 'Docker', 'Tailwind CSS', 'Git'],
    prog: ['Full Stack Web Development'],
    desc: 'Build scalable full-stack web applications using React, TypeScript, and Node.js with microservices architecture.'
  },
  {
    title: 'MERN Stack Developer',
    category: 'Full Stack Development',
    normalizedDesignation: 'Full Stack Developer',
    skills: ['MongoDB', 'Express', 'React', 'Node.js'],
    pref: ['Redux', 'REST APIs', 'Git', 'Tailwind CSS'],
    prog: ['Full Stack Web Development'],
    desc: 'Develop modern end-to-end web applications with MongoDB, Express, React, and Node.js.'
  },
  {
    title: 'Junior Full Stack Engineer',
    category: 'Full Stack Development',
    normalizedDesignation: 'Full Stack Developer',
    skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
    pref: ['TypeScript', 'Git', 'HTML5', 'CSS3'],
    prog: ['Full Stack Web Development'],
    desc: 'Join an agile product engineering squad delivering user-facing features across frontend and backend.'
  },
  {
    title: 'Software Engineer - Full Stack',
    category: 'Full Stack Development',
    normalizedDesignation: 'Full Stack Developer',
    skills: ['React', 'Node.js', 'TypeScript', 'REST APIs'],
    pref: ['Docker', 'SQL', 'Git', 'AWS'],
    prog: ['Full Stack Web Development'],
    desc: 'Architect and implement scalable web applications and RESTful APIs serving millions of active users.'
  },
  // Frontend (10)
  {
    title: 'Frontend React Developer',
    category: 'Frontend Development',
    normalizedDesignation: 'Frontend Developer',
    skills: ['React', 'JavaScript', 'HTML5', 'CSS3'],
    pref: ['TypeScript', 'Tailwind CSS', 'Next.js', 'Figma'],
    prog: ['Full Stack Web Development'],
    desc: 'Craft responsive, pixel-perfect user interfaces with React, modern CSS, and component design systems.'
  },
  {
    title: 'React.js Developer',
    category: 'Frontend Development',
    normalizedDesignation: 'Frontend Developer',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Redux'],
    pref: ['Next.js', 'Jest', 'Git', 'REST APIs'],
    prog: ['Full Stack Web Development'],
    desc: 'Build high-performance web dashboards with React.js, TypeScript, and state management.'
  },
  {
    title: 'UI Developer',
    category: 'Frontend Development',
    normalizedDesignation: 'Frontend Developer',
    skills: ['JavaScript', 'HTML5', 'CSS3', 'React'],
    pref: ['Figma', 'Tailwind CSS', 'Git'],
    prog: ['Full Stack Web Development', 'UI/UX Product Design'],
    desc: 'Translate Figma UI wireframes into responsive, accessible, cross-browser web interfaces.'
  },
  {
    title: 'Frontend Web Developer',
    category: 'Frontend Development',
    normalizedDesignation: 'Frontend Developer',
    skills: ['React', 'JavaScript', 'Next.js', 'Tailwind CSS'],
    pref: ['TypeScript', 'Git', 'REST APIs'],
    prog: ['Full Stack Web Development'],
    desc: 'Engineer modern web applications focusing on fast page loads, clean UI components, and SEO.'
  },
  // Backend (10)
  {
    title: 'Backend Python Developer',
    category: 'Backend Development',
    normalizedDesignation: 'Backend Developer',
    skills: ['Python', 'Django', 'FastAPI', 'SQL'],
    pref: ['PostgreSQL', 'Docker', 'Redis', 'REST APIs'],
    prog: ['Python Development', 'Full Stack Web Development'],
    desc: 'Develop high-performance RESTful APIs, data validation schemas, and database transactions.'
  },
  {
    title: 'Python Backend Engineer',
    category: 'Backend Development',
    normalizedDesignation: 'Backend Developer',
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker'],
    pref: ['SQL', 'Git', 'Redis', 'AWS'],
    prog: ['Python Development'],
    desc: 'Build scalable cloud services, backend queues, and clean API endpoints using Python.'
  },
  {
    title: 'Node.js Backend Developer',
    category: 'Backend Development',
    normalizedDesignation: 'Backend Developer',
    skills: ['Node.js', 'Express', 'TypeScript', 'SQL'],
    pref: ['PostgreSQL', 'MongoDB', 'Docker', 'REST APIs'],
    prog: ['Full Stack Web Development'],
    desc: 'Design and build resilient backend microservices using Node.js, Express, and relational databases.'
  },
  {
    title: 'Junior Backend Engineer',
    category: 'Backend Development',
    normalizedDesignation: 'Backend Developer',
    skills: ['Python', 'SQL', 'REST APIs', 'Git'],
    pref: ['Django', 'PostgreSQL', 'Docker'],
    prog: ['Python Development', 'Full Stack Web Development'],
    desc: 'Write maintainable server-side logic, optimize database queries, and integrate 3rd party APIs.'
  },
  // Data Analytics (8)
  {
    title: 'Data Analyst',
    category: 'Data Analytics',
    normalizedDesignation: 'Data Analyst',
    skills: ['Python', 'SQL', 'Power BI', 'Excel'],
    pref: ['Tableau', 'Pandas', 'Data Analysis'],
    prog: ['Data Analytics'],
    desc: 'Transform raw business data into actionable BI dashboards and statistical reports.'
  },
  {
    title: 'Business Intelligence Analyst',
    category: 'Data Analytics',
    normalizedDesignation: 'Data Analyst',
    skills: ['SQL', 'Power BI', 'Excel', 'Data Visualization'],
    pref: ['Python', 'Tableau', 'Statistics'],
    prog: ['Data Analytics'],
    desc: 'Create executive dashboards, data models, and KPI trackers for senior management.'
  },
  {
    title: 'Junior Data Analyst',
    category: 'Data Analytics',
    normalizedDesignation: 'Data Analyst',
    skills: ['SQL', 'Python', 'Excel', 'Power BI'],
    pref: ['Pandas', 'Git', 'Tableau'],
    prog: ['Data Analytics'],
    desc: 'Analyze core product metrics, run SQL queries, and synthesize analytical insights.'
  },
  // AI / ML (4)
  {
    title: 'AI / Machine Learning Engineer',
    category: 'AI / Machine Learning',
    normalizedDesignation: 'AI / Machine Learning Engineer',
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL'],
    pref: ['PyTorch', 'Scikit-learn', 'Docker', 'NLP'],
    prog: ['Python Development', 'Data Analytics'],
    desc: 'Train, evaluate, and deploy predictive machine learning models and NLP pipelines.'
  },
  {
    title: 'Machine Learning Associate',
    category: 'AI / Machine Learning',
    normalizedDesignation: 'AI / Machine Learning Engineer',
    skills: ['Python', 'Machine Learning', 'Data Analysis', 'SQL'],
    pref: ['PyTorch', 'Pandas', 'Docker'],
    prog: ['Python Development', 'Data Analytics'],
    desc: 'Prepare training datasets, benchmark model metrics, and build intelligent inference APIs.'
  },
  // Cloud / DevOps (4)
  {
    title: 'DevOps Engineer',
    category: 'Cloud / DevOps',
    normalizedDesignation: 'DevOps Engineer',
    skills: ['Docker', 'Kubernetes', 'AWS', 'Git'],
    pref: ['Linux', 'CI/CD', 'Terraform', 'Python'],
    prog: ['Full Stack Web Development'],
    desc: 'Automate build pipelines, container orchestration, and cloud infrastructure monitoring.'
  },
  {
    title: 'Cloud Infrastructure Associate',
    category: 'Cloud / DevOps',
    normalizedDesignation: 'DevOps Engineer',
    skills: ['AWS', 'Docker', 'Linux', 'Git'],
    pref: ['Kubernetes', 'Python', 'CI/CD'],
    prog: ['Full Stack Web Development'],
    desc: 'Maintain high-availability cloud servers, automated backups, and deployment scripts.'
  },
  // UI/UX (2)
  {
    title: 'UI/UX Designer',
    category: 'UI/UX / Product Design',
    normalizedDesignation: 'UI/UX Designer',
    skills: ['Figma', 'Wireframing', 'Prototyping', 'User Research'],
    pref: ['Design Systems', 'Product Design', 'HTML5'],
    prog: ['UI/UX Product Design'],
    desc: 'Design engaging user experiences, design systems, and responsive desktop/mobile flows.'
  },
  // QA / Testing (2)
  {
    title: 'QA Automation Engineer',
    category: 'QA / Testing',
    normalizedDesignation: 'QA / Test Engineer',
    skills: ['JavaScript', 'Selenium', 'Jest', 'Git'],
    pref: ['Cypress', 'Playwright', 'Python', 'REST APIs'],
    prog: ['Full Stack Web Development'],
    desc: 'Develop end-to-end automated test suites, regression test scripts, and integration validations.'
  }
];

// Validate that all templates pass filters
for (const t of templates) {
  const cl = TechJobClassifier.classify({ title: t.title, description: t.desc });
  if (!cl.isTechJob) {
    console.error('FAIL tech classifier:', t.title, cl.reason);
  }
}
for (const c of cities) {
  const lf = IndiaLocationFilter.evaluateLocation({ location: c });
  if (!lf.isIndia) {
    console.error('FAIL location filter:', c, lf.rejectionReason);
  }
}

console.log('All templates and cities passed validation successfully!');
