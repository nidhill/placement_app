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
var jobNormalizer_exports = {};
__export(jobNormalizer_exports, {
  JobNormalizer: () => JobNormalizer,
  schoolsAndPrograms: () => schoolsAndPrograms
});
module.exports = __toCommonJS(jobNormalizer_exports);
var import_techClassifier = require('./techClassifier');
var import_designationNormalizer = require('./designationNormalizer');
var import_indiaLocationFilter = require('./indiaLocationFilter');
const TECH_SKILL_DICTIONARY = [
  "React",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Express",
  "Python",
  "Django",
  "FastAPI",
  "Flask",
  "SQL",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "HTML5",
  "CSS3",
  "Tailwind CSS",
  "Next.js",
  "Vue.js",
  "Angular",
  "Git",
  "REST APIs",
  "GraphQL",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "GCP",
  "Java",
  "Spring Boot",
  "C++",
  "C#",
  ".NET",
  "PHP",
  "Laravel",
  "Ruby",
  "Go",
  "Figma",
  "UI/UX",
  "Product Design",
  "Wireframing",
  "Design Systems",
  "Power BI",
  "Tableau",
  "Excel",
  "Data Analysis",
  "Pandas",
  "NumPy",
  "Machine Learning",
  "TensorFlow",
  "PyTorch",
  "NLP",
  "Computer Vision",
  "Linux",
  "CI/CD",
  "Jest",
  "Cypress",
  "Selenium",
  "Automation",
  // Marketing
  "Google Ads", "Meta Ads", "Facebook Ads", "Google Analytics", "SEO", "SEM", "Keyword Research", "Content Marketing",
  "Social Media Marketing", "Email Marketing", "Copywriting", "WordPress", "HubSpot", "Semrush", "Ahrefs", "Shopify",
  // Design and video
  "Photoshop", "Illustrator", "InDesign", "CorelDRAW", "Canva", "Premiere Pro", "After Effects", "Final Cut Pro",
  "DaVinci Resolve", "Blender", "Cinema 4D", "Motion Graphics", "Video Editing", "Typography", "Branding"
];
// Fallback skills when a listing names none, per category.
const CATEGORY_DEFAULT_SKILLS = {
  "Graphic Design": ["Photoshop", "Illustrator", "Canva", "Typography"],
  "Video Editing": ["Premiere Pro", "After Effects", "Video Editing", "DaVinci Resolve"],
  "Motion Graphics": ["After Effects", "Motion Graphics", "Illustrator", "Premiere Pro"],
  "Performance Marketing": ["Google Ads", "Meta Ads", "Google Analytics", "Excel"],
  "SEO": ["SEO", "Keyword Research", "Google Analytics", "Semrush"],
  "Social Media Marketing": ["Social Media Marketing", "Meta Ads", "Canva", "Copywriting"],
  "Content Writing": ["Copywriting", "Content Marketing", "SEO", "WordPress"],
  "Digital Marketing": ["SEO", "Google Ads", "Social Media Marketing", "Google Analytics"]
};
// Which HACA school (and programmes) a category belongs to. School names are
// exactly the SHO App's (schools collection), so matching compares like with like.
const DESIGN_CATS = ["Graphic Design", "Video Editing", "Motion Graphics"];
const MARKETING_CATS = ["Performance Marketing", "SEO", "Social Media Marketing", "Content Writing", "Digital Marketing"];
function schoolsAndPrograms(category) {
  if (DESIGN_CATS.includes(category)) {
    return { schools: ["Design School"], programs: category === "Graphic Design" ? ["Graphic Design"] : ["Video Editing", "Motion Graphics"] };
  }
  if (MARKETING_CATS.includes(category)) {
    return { schools: ["Marketing School"], programs: category === "Performance Marketing" ? ["Performance Marketing", "Digital Marketing"] : ["Digital Marketing"] };
  }
  if (category === "UI/UX / Product Design") return { schools: ["Design School", "Tech School"], programs: ["UI/UX Product Design", "UI-UX"] };
  const programs = category === "Full Stack Development" || category === "Frontend Development" ? ["Full Stack Web Development", "MERN"]
    : category === "Backend Development" ? ["Python Development", "Full Stack Web Development", "MERN", "Python"]
    : category === "Data Analytics" ? ["Data Analytics"]
    : category === "AI / Machine Learning" || category === "Data Engineering" ? ["Data Analytics", "Python Development", "Python"]
    : ["Full Stack Web Development", "Python Development", "MERN", "Python"];
  return { schools: ["Tech School"], programs };
}
class JobNormalizer {
  /**
   * Scans title and text for recognized technical skills.
   */
  static extractSkills(title, description, category) {
    const combined = ` ${title} ${description} `.toLowerCase();
    const matched = /* @__PURE__ */ new Set();
    for (const skill of TECH_SKILL_DICTIONARY) {
      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      if (regex.test(combined)) {
        matched.add(skill);
      }
    }
    if (matched.size === 0 && CATEGORY_DEFAULT_SKILLS[category]) {
      CATEGORY_DEFAULT_SKILLS[category].forEach((s) => matched.add(s));
    } else if (matched.size === 0) {
      if (category === "Full Stack Development") {
        ["React", "Node.js", "JavaScript", "SQL"].forEach((s) => matched.add(s));
      } else if (category === "Frontend Development") {
        ["React", "JavaScript", "HTML5", "CSS3"].forEach((s) => matched.add(s));
      } else if (category === "Backend Development") {
        ["Python", "Node.js", "SQL", "REST APIs"].forEach((s) => matched.add(s));
      } else if (category === "Data Analytics") {
        ["Python", "SQL", "Power BI", "Excel"].forEach((s) => matched.add(s));
      } else if (category === "AI / Machine Learning") {
        ["Python", "Machine Learning", "SQL", "Git"].forEach((s) => matched.add(s));
      } else if (category === "Cloud / DevOps") {
        ["Docker", "AWS", "Linux", "CI/CD"].forEach((s) => matched.add(s));
      } else if (category === "UI/UX / Product Design") {
        ["Figma", "UI/UX", "Wireframing", "Design Systems"].forEach((s) => matched.add(s));
      } else {
        ["JavaScript", "Git", "SQL"].forEach((s) => matched.add(s));
      }
    }
    return Array.from(matched);
  }
  /**
   * Normalizes experience requirements from text into standardized strings and minimum years.
   */
  static parseExperience(rawExp, description) {
    const text = `${rawExp || ""} ${description || ""}`.toLowerCase();
    if (/\b(intern|internship|trainee)\b/i.test(text)) {
      return { requirement: "Internship / Fresh Graduate", minYears: 0 };
    }
    if (/\b(0[\s-]?1|0[\s-]?2|fresher|fresh graduate|entry level|junior)\b/i.test(text)) {
      return { requirement: "0\u20131 year (Entry Level)", minYears: 0 };
    }
    if (/\b(1[\s-]?3|1[\s-]?2|2[\s-]?3)\s*(?:years?|yrs?)\b/i.test(text)) {
      return { requirement: "1\u20133 years", minYears: 1 };
    }
    if (/\b(3[\s-]?5|3\+)\s*(?:years?|yrs?)\b/i.test(text)) {
      return { requirement: "3\u20135 years", minYears: 3 };
    }
    if (/\b(5\+|5[\s-]?8|senior)\s*(?:years?|yrs?)\b/i.test(text)) {
      return { requirement: "5+ years (Senior)", minYears: 5 };
    }
    if (rawExp && typeof rawExp === "string" && rawExp.trim()) {
      return { requirement: rawExp.trim(), minYears: 0 };
    }
    return { requirement: "0\u20131 year / Entry Level", minYears: 0 };
  }
  /**
   * Ingests a raw job item from Apify or external feed, applies the TechJobClassifier,
   * normalizes the role, and builds a canonical JobListing object.
   */
  static normalize(rawItem) {
    if (!rawItem || typeof rawItem !== "object") {
      return { valid: false, isTechJob: false, isIndia: false, reason: "Empty job object" };
    }
    const title = (rawItem.title || rawItem.jobTitle || "").trim();
    const company = (rawItem.companyName || rawItem.company || "").trim();
    if (!title || !company) {
      return { valid: false, isTechJob: false, isIndia: false, reason: "Missing mandatory title or company" };
    }
    const rawLocation = (rawItem.location || rawItem.jobLocation || rawItem.placeFormatted || "").trim();
    const rawCountry = (rawItem.country || rawItem.countryName || "").trim();
    const rawCountryCode = (rawItem.countryCode || rawItem.country_code || "").trim();
    const rawCity = (rawItem.city || rawItem.locationCity || "").trim();
    const rawState = (rawItem.state || rawItem.region || "").trim();
    const locationResult = import_indiaLocationFilter.IndiaLocationFilter.evaluateLocation({
      location: rawLocation,
      country: rawCountry,
      countryCode: rawCountryCode,
      city: rawCity,
      state: rawState,
      rawPayload: rawItem
    });
    if (!locationResult.isIndia) {
      return {
        valid: true,
        isTechJob: false,
        isIndia: false,
        locationResult,
        reason: locationResult.rejectionReason || `Filtered non-India location: ${rawLocation || "Unknown"}`
      };
    }
    const description = (rawItem.description || rawItem.descriptionText || "").trim();
    const location = locationResult.normalizedLocation;
    const sector = (rawItem.sector || "").trim();
    const classification = import_techClassifier.TechJobClassifier.classify({
      title,
      description,
      sector,
      company
    });
    if (!classification.isTechJob) {
      return {
        valid: true,
        isTechJob: false,
        isIndia: true,
        locationResult,
        classification,
        reason: `Filtered non-technical job: ${title} (${classification.reason})`
      };
    }
    const normalizedDesignation = import_designationNormalizer.DesignationNormalizer.normalize(title);
    const allSkills = this.extractSkills(title, description, classification.category);
    const requiredSkills = allSkills.slice(0, 4);
    const isTechCategory = !CATEGORY_DEFAULT_SKILLS[classification.category];
    const preferredSkills = allSkills.length > 4 ? allSkills.slice(4, 7) : isTechCategory ? ["Git", "Agile"] : [];
    const { requirement: experienceRequirement, minYears: minExperienceYears } = this.parseExperience(rawItem.experienceLevel, description);
    let employmentType = "FULL_TIME";
    const contract = (rawItem.contractType || "").toLowerCase();
    if (contract.includes("intern")) employmentType = "INTERNSHIP";
    else if (contract.includes("part")) employmentType = "PART_TIME";
    else if (contract.includes("contract")) employmentType = "CONTRACT";
    let salaryRange = "Competitive / Market Standard";
    if (rawItem.salary && typeof rawItem.salary === "string" && rawItem.salary.trim()) {
      salaryRange = rawItem.salary.trim();
    } else if (rawItem.salaryMin && rawItem.salaryMax) {
      salaryRange = `${rawItem.salaryCurrency || "$"}${rawItem.salaryMin} - ${rawItem.salaryMax} / ${rawItem.salaryPeriod || "yr"}`;
    }
    const { schools: eligibleSchools, programs: eligiblePrograms } = schoolsAndPrograms(classification.category);
    const externalUrl = rawItem.applyUrl || rawItem.jobUrl || rawItem.externalApplicationLink || rawItem.link || rawItem.url || `https://www.google.com/search?q=${encodeURIComponent(company + " " + title + " apply")}`;
    const externalJobId = rawItem.id ? String(rawItem.id) : void 0;
    // postedDate is the board's own posting date; left empty when the board
    // did not give one, so the listing is never shown as "posted just now"
    // only because it was scraped now. discoveredAt is when we found it.
    const postedDate = rawItem.publishedAt || rawItem.postedDateString || void 0;
    const scrapedDate = (/* @__PURE__ */ new Date()).toISOString();
    const normalized = {
      title,
      // originalJobTitle preserved
      company,
      location,
      countryCode: "IN",
      employmentType,
      experienceRequirement,
      minExperienceYears,
      salaryRange,
      description: description || `Professional ${classification.category} opportunity discovered via AI Scraper.`,
      requiredSkills,
      preferredSkills,
      educationRequirements: ["HACA Graduate Certificate or relevant Bachelor Degree"],
      eligibleSchools,
      eligiblePrograms,
      category: classification.category,
      normalizedDesignation,
      sourceChannel: "AI_JOB_SCRAPER",
      externalUrl,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString(),
      status: "ACTIVE",
      discoveredAt: scrapedDate,
      externalJobId,
      source: rawItem.sourceBoard ? `${rawItem.sourceBoard} (via Apify)` : "AI Job Scraper",
      jobBoard: rawItem.sourceBoard || undefined,
      sourceUrl: rawItem.jobUrl || externalUrl,
      postedDate,
      scrapedDate
    };
    return {
      valid: true,
      isTechJob: true,
      isIndia: true,
      locationResult,
      classification,
      normalized
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  JobNormalizer
});
