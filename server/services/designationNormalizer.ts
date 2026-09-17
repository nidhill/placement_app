/**
 * DesignationNormalizer
 * 
 * Normalizes diverse job titles and student designations into canonical tech roles,
 * and calculates deterministic compatibility between student designation and job designation.
 */

export interface DesignationComparison {
  scoreRatio: number; // 0.0 to 1.0 (to be weighted into 40%)
  level: 'EXCELLENT' | 'GOOD' | 'PARTIAL' | 'LOW' | 'NONE';
  studentNormalized: string;
  jobNormalized: string;
  isCompatible: boolean;
  explanation: string;
}

export class DesignationNormalizer {
  /**
   * Normalizes a raw title or role string into a canonical designation.
   */
  public static normalize(rawTitle: string | undefined): string {
    if (!rawTitle || !rawTitle.trim()) {
      return 'Role not identified';
    }

    const t = rawTitle.toLowerCase().trim();

    // 1. Full Stack Development
    if (/\b(full[\s-]?stack|mern|mean)\b/i.test(t)) {
      return 'Full Stack Developer';
    }

    // 2. Frontend Development
    if (/\b(front[\s-]?end|frontend|react|angular|vue|next\.?js|svelte|ui developer)\b/i.test(t)) {
      return 'Frontend Developer';
    }

    // 3. Backend Development & Python
    if (/\b(python|django|fastapi|flask)\b/i.test(t) && /\b(developer|engineer|backend|back-end)\b/i.test(t)) {
      return 'Python Developer';
    }
    if (/\b(back[\s-]?end|backend|node\.?js|spring boot|laravel|ruby|php developer|java developer|\.net developer|c# developer|golang developer)\b/i.test(t)) {
      return 'Backend Developer';
    }

    // 4. Mobile Development
    if (/\b(mobile|ios|android|react native|flutter|swift|kotlin)\b/i.test(t)) {
      return 'Mobile Developer';
    }

    // 5. Data Analytics & Business Intelligence
    if (/\b(data analytics|data analyst|business data analyst|bi analyst|power bi analyst|tableau analyst|sql analyst)\b/i.test(t)) {
      return 'Data Analyst';
    }

    // 6. Data Engineering
    if (/\b(data engineer|big data engineer|etl developer|spark engineer)\b/i.test(t)) {
      return 'Data Engineer';
    }

    // 7. AI & Machine Learning
    if (/\b(machine learning|ml engineer|ai engineer|data scientist|deep learning|nlp engineer|llm engineer)\b/i.test(t)) {
      return 'AI / Machine Learning Engineer';
    }

    // 8. DevOps & Cloud
    if (/\b(devops|cloud engineer|aws engineer|azure engineer|site reliability|sre|platform engineer)\b/i.test(t)) {
      return 'DevOps / Cloud Engineer';
    }

    // 9. QA & Testing
    if (/\b(qa|quality assurance|automation engineer|software tester|sdet|test engineer)\b/i.test(t)) {
      return 'QA Engineer';
    }

    // 10. UI/UX & Product Design
    if (/\b(ui[\s/]?ux|ux[\s/]?ui|product designer|ui designer|ux designer|ux researcher)\b/i.test(t)) {
      return 'UI/UX Designer';
    }

    // 11. Cybersecurity
    if (/\b(cyber[\s-]?security|infosec|security analyst|soc analyst|penetration tester|ethical hacker)\b/i.test(t)) {
      return 'Cybersecurity Analyst';
    }

    // 12. IT Support
    if (/\b(it support|technical support|desktop support|helpdesk|it technician)\b/i.test(t)) {
      return 'IT Support Engineer';
    }

    // 13. System & Database Administration
    if (/\b(system administrator|sysadmin|network engineer|network administrator)\b/i.test(t)) {
      return 'System Administrator';
    }
    if (/\b(database administrator|dba|database engineer|sql dba)\b/i.test(t)) {
      return 'Database Administrator';
    }

    // 14. Technical Business Analysis
    if (/\b(technical business analyst|systems analyst|it business analyst)\b/i.test(t)) {
      return 'Technical Business Analyst';
    }

    // 15. General Software Developer
    if (/\b(software developer|software engineer|application developer|web developer|programmer|coder)\b/i.test(t)) {
      return 'Software Developer';
    }

    // Fallback: Title clean-up (remove Senior, Junior, Intern, Lead)
    const cleaned = rawTitle
      .replace(/\b(senior|junior|lead|principal|staff|associate|intern|entry level|graduate)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return cleaned || 'Software Developer';
  }

  /**
   * Compares student designation with job designation.
   * Weighting is out of 1.0 (will map to 40% in final score).
   */
  public static compareDesignations(
    studentDesignation: string | undefined,
    jobTitle: string,
    jobNormalized?: string
  ): DesignationComparison {
    if (!studentDesignation || !studentDesignation.trim()) {
      return {
        scoreRatio: 0.5,
        level: 'PARTIAL',
        studentNormalized: 'Designation not available',
        jobNormalized: jobNormalized || this.normalize(jobTitle),
        isCompatible: true,
        explanation: 'Designation not specified in student profile'
      };
    }

    const sNorm = this.normalize(studentDesignation);
    const jNorm = this.normalize(jobNormalized || jobTitle);

    // Exact canonical role match
    if (sNorm.toLowerCase() === jNorm.toLowerCase()) {
      return {
        scoreRatio: 1.0, // 100% of designation weight (40/40)
        level: 'EXCELLENT',
        studentNormalized: sNorm,
        jobNormalized: jNorm,
        isCompatible: true,
        explanation: `✓ ${sNorm}`
      };
    }

    // Compatibility matrix for related technical specializations
    const sLower = sNorm.toLowerCase();
    const jLower = jNorm.toLowerCase();

    // 1. Full Stack <-> Frontend or Backend
    if (sLower === 'full stack developer') {
      if (jLower === 'frontend developer' || jLower === 'backend developer' || jLower === 'software developer') {
        return {
          scoreRatio: 0.80, // Good match (32/40)
          level: 'GOOD',
          studentNormalized: sNorm,
          jobNormalized: jNorm,
          isCompatible: true,
          explanation: `Strong role alignment: Full Stack profile matches ${jNorm}`
        };
      }
      if (jLower === 'python developer' || jLower === 'mobile developer' || jLower === 'qa engineer') {
        return {
          scoreRatio: 0.65, // Partial match
          level: 'PARTIAL',
          studentNormalized: sNorm,
          jobNormalized: jNorm,
          isCompatible: true,
          explanation: `Transferable engineering skillset for ${jNorm}`
        };
      }
    }

    // 2. Python Developer <-> Backend Developer / Software Developer / Data Analyst / Data Engineer
    if (sLower === 'python developer') {
      if (jLower === 'backend developer' || jLower === 'software developer') {
        return {
          scoreRatio: 0.90, // Excellent/Good (36/40)
          level: 'EXCELLENT',
          studentNormalized: sNorm,
          jobNormalized: jNorm,
          isCompatible: true,
          explanation: `✓ Python backend engineering match for ${jNorm}`
        };
      }
      if (jLower === 'data engineer' || jLower === 'ai / machine learning engineer') {
        return {
          scoreRatio: 0.75, // Good match
          level: 'GOOD',
          studentNormalized: sNorm,
          jobNormalized: jNorm,
          isCompatible: true,
          explanation: `Compatible Python backend foundation for ${jNorm}`
        };
      }
      if (jLower === 'data analyst') {
        return {
          scoreRatio: 0.55,
          level: 'PARTIAL',
          studentNormalized: sNorm,
          jobNormalized: jNorm,
          isCompatible: true,
          explanation: `Partial overlap: Python programming for Data Analytics`
        };
      }
    }

    // 3. Frontend Developer <-> Full Stack / UI/UX / Web
    if (sLower === 'frontend developer') {
      if (jLower === 'software developer' || jLower === 'full stack developer') {
        return {
          scoreRatio: 0.75,
          level: 'GOOD',
          studentNormalized: sNorm,
          jobNormalized: jNorm,
          isCompatible: true,
          explanation: `Frontend expertise applicable to ${jNorm}`
        };
      }
      if (jLower === 'ui/ux designer' || jLower === 'mobile developer') {
        return {
          scoreRatio: 0.60,
          level: 'PARTIAL',
          studentNormalized: sNorm,
          jobNormalized: jNorm,
          isCompatible: true,
          explanation: `UI engineering overlap with ${jNorm}`
        };
      }
    }

    // 4. Data Analyst <-> Data Engineer / BI / AI/ML
    if (sLower === 'data analyst') {
      if (jLower === 'data engineer') {
        return {
          scoreRatio: 0.70, // Good / Partial
          level: 'GOOD',
          studentNormalized: sNorm,
          jobNormalized: jNorm,
          isCompatible: true,
          explanation: `Compatible analytical background for Data Engineering`
        };
      }
      if (jLower === 'ai / machine learning engineer' || jLower === 'technical business analyst') {
        return {
          scoreRatio: 0.60,
          level: 'PARTIAL',
          studentNormalized: sNorm,
          jobNormalized: jNorm,
          isCompatible: true,
          explanation: `Data proficiency applicable to ${jNorm}`
        };
      }
    }

    // 5. General Software Developer <-> Any developer role
    if (sLower === 'software developer') {
      if (jLower.includes('developer') || jLower.includes('engineer')) {
        return {
          scoreRatio: 0.75,
          level: 'GOOD',
          studentNormalized: sNorm,
          jobNormalized: jNorm,
          isCompatible: true,
          explanation: `Core software engineering alignment with ${jNorm}`
        };
      }
    }

    // Low match for divergent tech roles (e.g. Full Stack vs Data Analyst, or Python Developer vs Frontend Developer)
    return {
      scoreRatio: 0.20, // 8/40
      level: 'LOW',
      studentNormalized: sNorm,
      jobNormalized: jNorm,
      isCompatible: false,
      explanation: `Low designation match: Candidate role (${sNorm}) differs from ${jNorm}`
    };
  }
}
