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
var designationNormalizer_exports = {};
__export(designationNormalizer_exports, {
  DesignationNormalizer: () => DesignationNormalizer
});
module.exports = __toCommonJS(designationNormalizer_exports);
class DesignationNormalizer {
  /**
   * Normalizes a raw title or role string into a canonical designation.
   */
  static normalize(rawTitle) {
    if (!rawTitle || !rawTitle.trim()) {
      return "Role not identified";
    }
    const t = rawTitle.toLowerCase().trim();
    if (/\b(full[\s-]?stack|mern|mean)\b/i.test(t)) {
      return "Full Stack Developer";
    }
    if (/\b(front[\s-]?end|frontend|react|angular|vue|next\.?js|svelte|ui developer)\b/i.test(t)) {
      return "Frontend Developer";
    }
    if (/\b(python|django|fastapi|flask)\b/i.test(t) && /\b(developer|engineer|backend|back-end)\b/i.test(t)) {
      return "Python Developer";
    }
    if (/\b(back[\s-]?end|backend|node\.?js|spring boot|laravel|ruby|php developer|java developer|\.net developer|c# developer|golang developer)\b/i.test(t)) {
      return "Backend Developer";
    }
    if (/\b(mobile|ios|android|react native|flutter|swift|kotlin)\b/i.test(t)) {
      return "Mobile Developer";
    }
    if (/\b(data analytics|data analyst|business data analyst|bi analyst|power bi analyst|tableau analyst|sql analyst)\b/i.test(t)) {
      return "Data Analyst";
    }
    if (/\b(data engineer|big data engineer|etl developer|spark engineer)\b/i.test(t)) {
      return "Data Engineer";
    }
    if (/\b(machine learning|ml engineer|ai engineer|data scientist|deep learning|nlp engineer|llm engineer)\b/i.test(t)) {
      return "AI / Machine Learning Engineer";
    }
    if (/\b(devops|cloud engineer|aws engineer|azure engineer|site reliability|sre|platform engineer)\b/i.test(t)) {
      return "DevOps / Cloud Engineer";
    }
    if (/\b(qa|quality assurance|automation engineer|software tester|sdet|test engineer)\b/i.test(t)) {
      return "QA Engineer";
    }
    if (/\b(ui[\s/]?ux|ux[\s/]?ui|product designer|ui designer|ux designer|ux researcher)\b/i.test(t)) {
      return "UI/UX Designer";
    }
    if (/\b(cyber[\s-]?security|infosec|security analyst|soc analyst|penetration tester|ethical hacker)\b/i.test(t)) {
      return "Cybersecurity Analyst";
    }
    if (/\b(it support|technical support|desktop support|helpdesk|it technician)\b/i.test(t)) {
      return "IT Support Engineer";
    }
    if (/\b(system administrator|sysadmin|network engineer|network administrator)\b/i.test(t)) {
      return "System Administrator";
    }
    if (/\b(database administrator|dba|database engineer|sql dba)\b/i.test(t)) {
      return "Database Administrator";
    }
    if (/\b(technical business analyst|systems analyst|it business analyst)\b/i.test(t)) {
      return "Technical Business Analyst";
    }
    if (/\b(software developer|software engineer|application developer|web developer|programmer|coder)\b/i.test(t)) {
      return "Software Developer";
    }
    const cleaned = rawTitle.replace(/\b(senior|junior|lead|principal|staff|associate|intern|entry level|graduate)\b/gi, "").replace(/\s{2,}/g, " ").trim();
    return cleaned || "Software Developer";
  }
  /**
   * Compares student designation with job designation.
   * Weighting is out of 1.0 (will map to 40% in final score).
   */
  static compareDesignations(studentDesignation, jobTitle, jobNormalized) {
    if (!studentDesignation || !studentDesignation.trim()) {
      return {
        scoreRatio: 0.5,
        level: "PARTIAL",
        studentNormalized: "Designation not available",
        jobNormalized: jobNormalized || this.normalize(jobTitle),
        isCompatible: true,
        explanation: "Designation not specified in student profile"
      };
    }
    const sNorm = this.normalize(studentDesignation);
    const jNorm = this.normalize(jobNormalized || jobTitle);
    if (sNorm.toLowerCase() === jNorm.toLowerCase()) {
      return {
        scoreRatio: 1,
        // 100% of designation weight (40/40)
        level: "EXCELLENT",
        studentNormalized: sNorm,
        jobNormalized: jNorm,
        isCompatible: true,
        explanation: `\u2713 ${sNorm}`
      };
    }
    const sLower = sNorm.toLowerCase();
    const jLower = jNorm.toLowerCase();
    if (sLower === "full stack developer") {
      if (jLower === "frontend developer" || jLower === "backend developer" || jLower === "software developer") {
        return {
          scoreRatio: 0.8,
          // Good match (32/40)
          level: "GOOD",
          studentNormalized: sNorm,
          jobNormalized: jNorm,
          isCompatible: true,
          explanation: `Strong role alignment: Full Stack profile matches ${jNorm}`
        };
      }
      if (jLower === "python developer" || jLower === "mobile developer" || jLower === "qa engineer") {
        return {
          scoreRatio: 0.65,
          // Partial match
          level: "PARTIAL",
          studentNormalized: sNorm,
          jobNormalized: jNorm,
          isCompatible: true,
          explanation: `Transferable engineering skillset for ${jNorm}`
        };
      }
    }
    if (sLower === "python developer") {
      if (jLower === "backend developer" || jLower === "software developer") {
        return {
          scoreRatio: 0.9,
          // Excellent/Good (36/40)
          level: "EXCELLENT",
          studentNormalized: sNorm,
          jobNormalized: jNorm,
          isCompatible: true,
          explanation: `\u2713 Python backend engineering match for ${jNorm}`
        };
      }
      if (jLower === "data engineer" || jLower === "ai / machine learning engineer") {
        return {
          scoreRatio: 0.75,
          // Good match
          level: "GOOD",
          studentNormalized: sNorm,
          jobNormalized: jNorm,
          isCompatible: true,
          explanation: `Compatible Python backend foundation for ${jNorm}`
        };
      }
      if (jLower === "data analyst") {
        return {
          scoreRatio: 0.55,
          level: "PARTIAL",
          studentNormalized: sNorm,
          jobNormalized: jNorm,
          isCompatible: true,
          explanation: `Partial overlap: Python programming for Data Analytics`
        };
      }
    }
    if (sLower === "frontend developer") {
      if (jLower === "software developer" || jLower === "full stack developer") {
        return {
          scoreRatio: 0.75,
          level: "GOOD",
          studentNormalized: sNorm,
          jobNormalized: jNorm,
          isCompatible: true,
          explanation: `Frontend expertise applicable to ${jNorm}`
        };
      }
      if (jLower === "ui/ux designer" || jLower === "mobile developer") {
        return {
          scoreRatio: 0.6,
          level: "PARTIAL",
          studentNormalized: sNorm,
          jobNormalized: jNorm,
          isCompatible: true,
          explanation: `UI engineering overlap with ${jNorm}`
        };
      }
    }
    if (sLower === "data analyst") {
      if (jLower === "data engineer") {
        return {
          scoreRatio: 0.7,
          // Good / Partial
          level: "GOOD",
          studentNormalized: sNorm,
          jobNormalized: jNorm,
          isCompatible: true,
          explanation: `Compatible analytical background for Data Engineering`
        };
      }
      if (jLower === "ai / machine learning engineer" || jLower === "technical business analyst") {
        return {
          scoreRatio: 0.6,
          level: "PARTIAL",
          studentNormalized: sNorm,
          jobNormalized: jNorm,
          isCompatible: true,
          explanation: `Data proficiency applicable to ${jNorm}`
        };
      }
    }
    if (sLower === "software developer") {
      if (jLower.includes("developer") || jLower.includes("engineer")) {
        return {
          scoreRatio: 0.75,
          level: "GOOD",
          studentNormalized: sNorm,
          jobNormalized: jNorm,
          isCompatible: true,
          explanation: `Core software engineering alignment with ${jNorm}`
        };
      }
    }
    return {
      scoreRatio: 0.2,
      // 8/40
      level: "LOW",
      studentNormalized: sNorm,
      jobNormalized: jNorm,
      isCompatible: false,
      explanation: `Low designation match: Candidate role (${sNorm}) differs from ${jNorm}`
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DesignationNormalizer
});
