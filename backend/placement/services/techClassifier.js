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
  TechJobClassifier: () => TechJobClassifier
});
module.exports = __toCommonJS(techClassifier_exports);
const NON_TECH_TITLE_PATTERNS = [
  /\b(sales|salesperson|salesman|telecaller|cold caller|bde|business development representative|bdr|sdr)\b/i,
  /\b(hr|human resources|recruiter|talent acquisition|people operations|headhunter)\b/i,
  /\b(accountant|accounting|bookkeeper|auditor|payroll|tax specialist|accounts payable|accounts receivable)\b/i,
  /\b(receptionist|front desk|office assistant|office administrator|clerk|administrative assistant|secretary)\b/i,
  /\b(customer service|customer care|call center agent|bpo|contact center|guest service)\b/i,
  /\b(marketing executive|content writer|copywriter|social media manager|growth marketer|digital marketing specialist|seo executive)\b/i,
  /\b(operations executive|operations associate|warehouse|logistics coordinator|supply chain associate|delivery driver|dispatcher)\b/i,
  /\b(finance manager|financial analyst|investment banker|teller|loan officer|credit analyst)\b/i,
  /\b(cashier|retail associate|store manager|merchandiser|sales associate|counter attendant)\b/i,
  /\b(cook|chef|nurse|physician|janitor|cleaner|security guard|driver|plumber|electrician|carpenter|labor|laborer)\b/i
];
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
    keywordRegex: /\b(node\.?js|django|spring boot|rest api|graphql|sql|postgresql|mongodb|microservices)\b/i
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
    keywordRegex: /\b(power bi|tableau|sql|excel|data analysis|looker|metabase|dashboard)\b/i
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
    const generalTechTitleHints = /\b(tech|technical|engineer|developer|specialist|analyst|architect|consultant|intern|trainee)\b/i;
    if (generalTechTitleHints.test(titleLower)) {
      for (const rule of TECH_CATEGORY_RULES) {
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
