var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var techClassifier_exports = {};
__export(techClassifier_exports, {
  TechJobClassifier: () => TechJobClassifier,
  CATEGORY_SCHOOL: () => CATEGORY_SCHOOL
});
module.exports = __toCommonJS(techClassifier_exports);
const NON_TECH_TITLE_PATTERNS = [
  /\b(sales|salesperson|salesman|telecaller|cold caller|bde|business development representative|bdr|sdr)\b/i,
  /\b(hr|human resources|recruiter|talent acquisition|people operations|headhunter)\b/i,
  /\b(accountant|accounting|bookkeeper|auditor|payroll|tax specialist|accounts payable|accounts receivable)\b/i,
  /\b(receptionist|front desk|office assistant|office administrator|clerk|administrative assistant|secretary)\b/i,
  /\b(customer service|customer care|call center agent|bpo|contact center|guest service)\b/i,
  /\b(operations executive|operations associate|warehouse|logistics coordinator|supply chain associate|delivery driver|dispatcher)\b/i,
  /\b(finance manager|financial analyst|investment banker|teller|loan officer|credit analyst)\b/i,
  // Finance is not placed through this tool (Tech, Design and Marketing only).
  /\b(accounts (analyst|executive|assistant|manager|officer|associate|specialist)|accountant|fp&a|f&a|finance (executive|analyst|associate|specialist|intern)|financial (accountant|controller|planning)|tally|gst|taxation|tax (analyst|consultant|associate)|audit\w*|chartered accountant|ca inter|cost accountant|treasury)\b/i,
  /\b(cashier|retail associate|store manager|merchandiser|sales associate|counter attendant)\b/i,
  /\b(cook|chef|nurse|physician|janitor|cleaner|security guard|driver|plumber|electrician|carpenter|labor|laborer)\b/i
];
// HACA also places Design School and Marketing School students, so these are
// kept (not rejected as "non-tech") and get their own categories. Checked
// after the tech rules, so "Web Developer & SEO" stays a tech job, and design
// before marketing, so "Social Media Designer" is a design job.
const CREATIVE_CATEGORY_RULES = [
  { category: "Motion Graphics", school: "design", titleRegex: /\b(motion graphics?|motion designer|motion design|animator|2d animat\w*|3d animat\w*|animation artist|after effects|vfx artist|compositor)\b/i },
  { category: "Video Editing", school: "design", titleRegex: /\b(video editor|video editing|reels? editor|youtube editor|post[\s-]?production|videographer|video producer|film editor|video content creator)\b/i },
  { category: "Graphic Design", school: "design", titleRegex: /\b(graphic designer|graphic design|visual designer|creative designer|brand designer|illustrator|packaging designer|print designer|social media designer|canva designer|photoshop artist|dtp operator|layout designer|creative associate|creative executive)\b/i },
  { category: "Performance Marketing", school: "marketing", titleRegex: /\b(performance marketing|paid (ads|media|search|social|marketing)|ppc|sem|google ads|meta ads|facebook ads|amazon ads|bing ads|microsoft ads|linkedin ads|media buyer|ad operations|marketplace ads|campaign (manager|specialist|executive))\b/i },
  { category: "SEO", school: "marketing", titleRegex: /\b(seo|search engine optimi[sz]ation|off[\s-]?page|on[\s-]?page)\b/i },
  { category: "Social Media Marketing", school: "marketing", titleRegex: /\b(social media|community manager|instagram|influencer marketing)\b/i },
  { category: "Content Writing", school: "marketing", titleRegex: /\b(content writer|content writing|copywriter|copy writer|content strategist|content specialist|content creator|blog writer|content marketing|script writer)\b/i },
  { category: "Digital Marketing", school: "marketing", titleRegex: /\b(digital marketing|online reputation|orm|e-?commerce (specialist|executive|manager|associate)|growth market\w*|email marketing|crm marketing|brand (executive|manager|associate)|marketing (executive|specialist|manager|associate|intern|analyst|coordinator|lead|trainee|strategist))\b/i }
];
const CATEGORY_SCHOOL = Object.fromEntries(CREATIVE_CATEGORY_RULES.map((r) => [r.category, r.school]));
const ENGINEERING_TITLE_OVERRIDE = /\b(developer|software engineer|architect|devops|programmer|sdet)\b/i;
const TECH_CATEGORY_RULES = [
  {
    category: "Full Stack Development",
    titleRegex: /\b(full[\s-]?stack|mern|mean|fullstack)\b/i,
    keywordRegex: /\b(react|angular|vue).{0,50}\b(node|express|django|flask|spring|sql|mongodb)\b/i
  },
  {
    category: "Frontend Development",
    titleRegex: /\b(front[\s-]?end|frontend|react|angular|vue|next\.?js|nuxt|svelte|ui developer|web designer\/developer)\b/i,
    keywordRegex: /\b(react|angular|vue|javascript|typescript|html5?|css3?|tailwind|redux)\b/i
  },
  {
    category: "Backend Development",
    titleRegex: /\b(back[\s-]?end|backend|node\.?js|django|flask|fastapi|spring boot|laravel|ruby on rails|php developer|java developer|python developer|\.net developer|c# developer|golang developer)\b/i,
    keywordRegex: /\b(node\.?js|django|spring boot|rest api|graphql|postgresql|mongodb|microservices)\b/i
  },
  {
    category: "Mobile Development",
    titleRegex: /\b(mobile|ios|android|react native|flutter|swift|kotlin)\b/i,
    keywordRegex: /\b(react native|flutter|swift|kotlin|ios|android|mobile app)\b/i
  },
  {
    category: "AI / Machine Learning",
    titleRegex: /\b(machine learning|ml engineer|ai engineer|artificial intelligence|data scientist|nlp|deep learning|computer vision|llm)\b/i,
    keywordRegex: /\b(machine learning|deep learning|pytorch|tensorflow|scikit-learn|nlp|computer vision|transformers)\b/i
  },
  {
    category: "Data Engineering",
    titleRegex: /\b(data engineer|big data|etl|data warehouse|spark|hadoop|databricks|snowflake engineer)\b/i,
    keywordRegex: /\b(spark|hadoop|etl|data pipeline|snowflake|databricks|airflow|dbt)\b/i
  },
  {
    category: "Data Analytics",
    titleRegex: /\b(data analyst|business intelligence|bi analyst|power bi|tableau analyst|sql analyst|data analytics)\b/i,
    keywordRegex: /\b(power bi|tableau|looker|metabase|data analysis|exploratory data|data visualization|data analytics|business intelligence)\b/i
  },
  {
    category: "Cloud / DevOps",
    titleRegex: /\b(devops|cloud|aws|azure|gcp|sre|site reliability|kubernetes|infrastructure engineer|platform engineer)\b/i,
    keywordRegex: /\b(docker|kubernetes|aws|azure|terraform|ci\/cd|jenkins|ansible|helm)\b/i
  },
  {
    category: "Cybersecurity",
    titleRegex: /\b(cyber[\s-]?security|infosec|security analyst|penetration tester|soc analyst|ethical hacker|network security)\b/i,
    keywordRegex: /\b(penetration testing|siem|firewall|vulnerability|soc|cryptography|security compliance)\b/i
  },
  {
    category: "QA / Testing",
    titleRegex: /\b(qa|quality assurance|software tester|automation engineer|sdet|test engineer|manual tester)\b/i,
    keywordRegex: /\b(selenium|cypress|playwright|jest|testng|automation testing|qa|unit testing)\b/i
  },
  {
    category: "UI/UX / Product Design",
    titleRegex: /\b(ui[\s/]?ux|ux[\s/]?ui|product designer|ui designer|ux designer|ux researcher|interaction designer)\b/i,
    keywordRegex: /\b(figma|wireframing|prototyping|design systems|user research|usability testing)\b/i
  },
  {
    category: "Database",
    titleRegex: /\b(database administrator|dba|database engineer|sql developer|oracle dba|postgresql administrator)\b/i,
    keywordRegex: /\b(oracle|postgresql|mysql|sql server|database tuning|nosql|mongodb dba)\b/i
  },
  {
    category: "Systems / Infrastructure",
    titleRegex: /\b(system administrator|sysadmin|network engineer|systems engineer|linux administrator|network administrator)\b/i,
    keywordRegex: /\b(linux|windows server|cisco|active directory|networking|dns|dhcp|lan\/wan)\b/i
  },
  {
    category: "Technical Business Analysis",
    titleRegex: /\b(technical business analyst|systems analyst|it business analyst|technical product manager)\b/i,
    keywordRegex: /\b(business requirements|system design|functional specifications|sdlc|uml|user stories)\b/i
  },
  {
    category: "IT Support",
    titleRegex: /\b(it support|technical support|desktop support|helpdesk|it technician|service desk)\b/i,
    keywordRegex: /\b(troubleshooting|hardware support|help desk|ticket resolution|itil)\b/i
  },
  {
    category: "Software Development",
    titleRegex: /\b(software developer|software engineer|application developer|web developer|programmer|coder)\b/i,
    keywordRegex: /\b(software development|git|algorithms|data structures|object-oriented|coding)\b/i
  }
];
class TechJobClassifier {
  /**
   * Deterministically evaluates whether a job belongs to Technology / IT.
   */
  static classify(job) {
    const title = (job.title || "").trim();
    const desc = (job.description || "").trim();
    const skills = (job.skills || []).join(" ");
    const sector = (job.sector || "").trim();
    if (!title) {
      return {
        isTechJob: false,
        category: "Non-Tech",
        confidence: 0,
        reason: "Empty job title"
      };
    }
    const titleLower = title.toLowerCase();
    const combinedText = `${title} ${desc} ${skills} ${sector}`.toLowerCase();
    const matchesNonTech = NON_TECH_TITLE_PATTERNS.some((p) => p.test(titleLower));
    const hasEngineeringOverride = ENGINEERING_TITLE_OVERRIDE.test(titleLower);
    if (matchesNonTech && !hasEngineeringOverride) {
      return {
        isTechJob: false,
        category: "Non-Tech",
        confidence: 0.96,
        reason: `Title contains non-technical role indicator (${title})`
      };
    }
    for (const rule of TECH_CATEGORY_RULES) {
      if (rule.titleRegex.test(titleLower)) {
        return {
          isTechJob: true,
          category: rule.category,
          confidence: 0.95,
          reason: `Job title matches ${rule.category} pattern`
        };
      }
    }
    for (const rule of CREATIVE_CATEGORY_RULES) {
      if (rule.titleRegex.test(titleLower)) {
        return {
          isTechJob: true,
          category: rule.category,
          confidence: 0.93,
          reason: `Job title matches ${rule.category} pattern`
        };
      }
    }
    const generalTechTitleHints = /\b(tech|technical|engineer|developer|specialist|analyst|architect|consultant|intern|trainee)\b/i;
    // "Engineer" alone also means civil, mechanical, sales, cost engineers —
    // only treat it as a software job when the ad talks about software.
    const softwareContext = /\b(developer|software|programmer|programming|coding|javascript|typescript|python|java|react|node|api|git|frontend|backend|full[\s-]?stack|web)\b/i;
    const onlyEngineer = /\bengineer\b/i.test(titleLower) && !/\b(developer|software|programmer|data|ml|ai|devops|cloud|qa|test|security|network|system)\b/i.test(titleLower);
    if (generalTechTitleHints.test(titleLower) && !(onlyEngineer && !softwareContext.test(combinedText))) {
      for (const rule of TECH_CATEGORY_RULES) {
        // Most job ads mention SQL or Power BI somewhere; only call it an
        // analytics job when the title says so too.
        if (rule.category === "Data Analytics" && !/\b(analyst|analytics|data|mis|reporting|insights?)\b/i.test(titleLower)) continue;
        if (rule.keywordRegex.test(combinedText)) {
          return {
            isTechJob: true,
            category: rule.category,
            confidence: 0.85,
            reason: `Job description/skills match ${rule.category}`
          };
        }
      }
      if (/\b(developer|software|engineer|programmer)\b/i.test(titleLower)) {
        return {
          isTechJob: true,
          category: "Software Development",
          confidence: 0.8,
          reason: "General software developer/engineer role"
        };
      }
    }
    const techSkillTitlePattern = /\b(python|react|java|c\+\+|javascript|typescript|golang|aws|docker|kubernetes|flutter|figma|sql)\b/i;
    if (techSkillTitlePattern.test(titleLower)) {
      return {
        isTechJob: true,
        category: "Software Development",
        confidence: 0.88,
        reason: "Technical language or framework specified in title"
      };
    }
    return {
      isTechJob: false,
      category: "Non-Tech",
      confidence: 0.85,
      reason: "No technology/IT role criteria met"
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TechJobClassifier
});
