import { JobListing } from '../../src/types.ts';
import { TechJobClassifier, TechClassificationResult } from './techClassifier.ts';
import { DesignationNormalizer } from './designationNormalizer.ts';
import { IndiaLocationFilter, LocationEvaluationResult } from './indiaLocationFilter.ts';

// Comprehensive technical skill dictionary for precise skill matching
const TECH_SKILL_DICTIONARY: string[] = [
  'React', 'TypeScript', 'JavaScript', 'Node.js', 'Express', 'Python', 'Django',
  'FastAPI', 'Flask', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
  'HTML5', 'CSS3', 'Tailwind CSS', 'Next.js', 'Vue.js', 'Angular',
  'Git', 'REST APIs', 'GraphQL', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
  'Java', 'Spring Boot', 'C++', 'C#', '.NET', 'PHP', 'Laravel', 'Ruby', 'Go',
  'Figma', 'UI/UX', 'Product Design', 'Wireframing', 'Design Systems',
  'Power BI', 'Tableau', 'Excel', 'Data Analysis', 'Pandas', 'NumPy',
  'Machine Learning', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision',
  'Linux', 'CI/CD', 'Jest', 'Cypress', 'Selenium', 'Automation'
];

export interface NormalizedJobResult {
  valid: boolean;
  isTechJob: boolean;
  isIndia: boolean;
  locationResult?: LocationEvaluationResult;
  classification?: TechClassificationResult;
  normalized?: Omit<JobListing, 'id' | 'jobCode' | 'createdAt' | 'updatedAt'>;
  reason?: string;
}

export class JobNormalizer {
  /**
   * Scans title and text for recognized technical skills.
   */
  public static extractSkills(title: string, description: string, category: string): string[] {
    const combined = ` ${title} ${description} `.toLowerCase();
    const matched = new Set<string>();

    for (const skill of TECH_SKILL_DICTIONARY) {
      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(combined)) {
        matched.add(skill);
      }
    }

    // Fallbacks if zero matched based on category
    if (matched.size === 0) {
      if (category === 'Full Stack Development') {
        ['React', 'Node.js', 'JavaScript', 'SQL'].forEach(s => matched.add(s));
      } else if (category === 'Frontend Development') {
        ['React', 'JavaScript', 'HTML5', 'CSS3'].forEach(s => matched.add(s));
      } else if (category === 'Backend Development') {
        ['Python', 'Node.js', 'SQL', 'REST APIs'].forEach(s => matched.add(s));
      } else if (category === 'Data Analytics') {
        ['Python', 'SQL', 'Power BI', 'Excel'].forEach(s => matched.add(s));
      } else if (category === 'AI / Machine Learning') {
        ['Python', 'Machine Learning', 'SQL', 'Git'].forEach(s => matched.add(s));
      } else if (category === 'Cloud / DevOps') {
        ['Docker', 'AWS', 'Linux', 'CI/CD'].forEach(s => matched.add(s));
      } else if (category === 'UI/UX / Product Design') {
        ['Figma', 'UI/UX', 'Wireframing', 'Design Systems'].forEach(s => matched.add(s));
      } else {
        ['JavaScript', 'Git', 'SQL'].forEach(s => matched.add(s));
      }
    }

    return Array.from(matched);
  }

  /**
   * Normalizes experience requirements from text into standardized strings and minimum years.
   */
  public static parseExperience(rawExp: any, description: string): { requirement: string; minYears: number } {
    const text = `${rawExp || ''} ${description || ''}`.toLowerCase();

    if (/\b(intern|internship|trainee)\b/i.test(text)) {
      return { requirement: 'Internship / Fresh Graduate', minYears: 0 };
    }
    if (/\b(0[\s-]?1|0[\s-]?2|fresher|fresh graduate|entry level|junior)\b/i.test(text)) {
      return { requirement: '0–1 year (Entry Level)', minYears: 0 };
    }
    if (/\b(1[\s-]?3|1[\s-]?2|2[\s-]?3)\s*(?:years?|yrs?)\b/i.test(text)) {
      return { requirement: '1–3 years', minYears: 1 };
    }
    if (/\b(3[\s-]?5|3\+)\s*(?:years?|yrs?)\b/i.test(text)) {
      return { requirement: '3–5 years', minYears: 3 };
    }
    if (/\b(5\+|5[\s-]?8|senior)\s*(?:years?|yrs?)\b/i.test(text)) {
      return { requirement: '5+ years (Senior)', minYears: 5 };
    }

    if (rawExp && typeof rawExp === 'string' && rawExp.trim()) {
      return { requirement: rawExp.trim(), minYears: 0 };
    }

    return { requirement: '0–1 year / Entry Level', minYears: 0 };
  }

  /**
   * Ingests a raw job item from Apify or external feed, applies the TechJobClassifier,
   * normalizes the role, and builds a canonical JobListing object.
   */
  public static normalize(rawItem: any): NormalizedJobResult {
    if (!rawItem || typeof rawItem !== 'object') {
      return { valid: false, isTechJob: false, isIndia: false, reason: 'Empty job object' };
    }

    const title = (rawItem.title || rawItem.jobTitle || '').trim();
    const company = (rawItem.companyName || rawItem.company || '').trim();

    if (!title || !company) {
      return { valid: false, isTechJob: false, isIndia: false, reason: 'Missing mandatory title or company' };
    }

    // 1. INDIA-ONLY HARD FILTER (Enforced before tech classification and role mapping)
    const rawLocation = (rawItem.location || rawItem.jobLocation || rawItem.placeFormatted || '').trim();
    const rawCountry = (rawItem.country || rawItem.countryName || '').trim();
    const rawCountryCode = (rawItem.countryCode || rawItem.country_code || '').trim();
    const rawCity = (rawItem.city || rawItem.locationCity || '').trim();
    const rawState = (rawItem.state || rawItem.region || '').trim();

    const locationResult = IndiaLocationFilter.evaluateLocation({
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
        reason: locationResult.rejectionReason || `Filtered non-India location: ${rawLocation || 'Unknown'}`
      };
    }

    const description = (rawItem.description || rawItem.descriptionText || '').trim();
    const location = locationResult.normalizedLocation;
    const sector = (rawItem.sector || '').trim();

    // 2. Tech Job Classification
    const classification = TechJobClassifier.classify({
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

    // 2. Designation Normalization
    const normalizedDesignation = DesignationNormalizer.normalize(title);

    // 3. Extract technical skills
    const allSkills = this.extractSkills(title, description, classification.category);
    const requiredSkills = allSkills.slice(0, 4);
    const preferredSkills = allSkills.length > 4 ? allSkills.slice(4, 7) : ['Git', 'Agile'];

    // 4. Parse experience
    const { requirement: experienceRequirement, minYears: minExperienceYears } = this.parseExperience(rawItem.experienceLevel, description);

    // 5. Map employment type
    let employmentType: 'FULL_TIME' | 'INTERNSHIP' | 'CONTRACT' | 'PART_TIME' = 'FULL_TIME';
    const contract = (rawItem.contractType || '').toLowerCase();
    if (contract.includes('intern')) employmentType = 'INTERNSHIP';
    else if (contract.includes('part')) employmentType = 'PART_TIME';
    else if (contract.includes('contract')) employmentType = 'CONTRACT';

    // 6. Map salary
    let salaryRange = 'Competitive / Market Standard';
    if (rawItem.salary && typeof rawItem.salary === 'string' && rawItem.salary.trim()) {
      salaryRange = rawItem.salary.trim();
    } else if (rawItem.salaryMin && rawItem.salaryMax) {
      salaryRange = `${rawItem.salaryCurrency || '$'}${rawItem.salaryMin} - ${rawItem.salaryMax} / ${rawItem.salaryPeriod || 'yr'}`;
    }

    // 7. Map eligible schools & programs
    const eligibleSchools: string[] = ['School of Tech'];
    const eligiblePrograms: string[] = [];

    if (classification.category === 'Full Stack Development') {
      eligiblePrograms.push('Full Stack Web Development');
    } else if (classification.category === 'Frontend Development') {
      eligiblePrograms.push('Full Stack Web Development');
    } else if (classification.category === 'Backend Development') {
      eligiblePrograms.push('Python Development', 'Full Stack Web Development');
    } else if (classification.category === 'Data Analytics') {
      eligiblePrograms.push('Data Analytics');
    } else if (classification.category === 'AI / Machine Learning' || classification.category === 'Data Engineering') {
      eligiblePrograms.push('Data Analytics', 'Python Development');
    } else if (classification.category === 'UI/UX / Product Design') {
      eligibleSchools.push('School of Design');
      eligiblePrograms.push('UI/UX Product Design');
    } else {
      eligiblePrograms.push('Full Stack Web Development', 'Python Development');
    }

    const externalUrl = rawItem.applyUrl || rawItem.jobUrl || rawItem.externalApplicationLink || rawItem.link || rawItem.url || `https://www.google.com/search?q=${encodeURIComponent(company + ' ' + title + ' apply')}`;
    const externalJobId = rawItem.id ? String(rawItem.id) : undefined;
    const postedDate = rawItem.publishedAt || rawItem.postedDateString || new Date().toISOString();
    const scrapedDate = new Date().toISOString();

    const normalized: Omit<JobListing, 'id' | 'jobCode' | 'createdAt' | 'updatedAt'> = {
      title, // originalJobTitle preserved
      company,
      location,
      countryCode: 'IN',
      employmentType,
      experienceRequirement,
      minExperienceYears,
      salaryRange,
      description: description || `Professional ${classification.category} opportunity discovered via AI Scraper.`,
      requiredSkills,
      preferredSkills,
      educationRequirements: ['HACA Graduate Certificate or relevant Bachelor Degree'],
      eligibleSchools,
      eligiblePrograms,
      category: classification.category,
      normalizedDesignation,
      sourceChannel: 'AI_JOB_SCRAPER',
      externalUrl,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE',
      discoveredAt: postedDate,
      externalJobId,
      source: 'AI Job Scraper',
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
