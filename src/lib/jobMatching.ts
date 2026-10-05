import { JobListing, JobMatchResult, MatchVerdict } from '../types.ts';
import { ResumeData } from '../components/resume/types.ts';
import { getDisplayExperience } from './text.ts';

export type TechDomain = 
  | 'DATA_ANALYTICS'
  | 'DATA_ENGINEERING'
  | 'AI_ML'
  | 'FULL_STACK'
  | 'FRONTEND'
  | 'BACKEND'
  | 'MOBILE'
  | 'UI_UX'
  | 'QA'
  | 'DEVOPS'
  | 'CYBERSECURITY'
  | 'MARKETING_SALES'
  | 'SALES_OPERATIONS'
  | 'OTHER';

/**
 * Normalizes any job title or designation string into canonical role and domain.
 */
export function normalizeRole(rawTitle?: string): { designation: string; domain: TechDomain } {
  if (!rawTitle || !rawTitle.trim()) {
    return { designation: 'Role not specified', domain: 'OTHER' };
  }
  const t = rawTitle.toLowerCase().trim();

  // 0. Marketing, Paid Ads, Performance Marketing, SEO, Social Media, ORM, Content (Check FIRST to prevent 'specialist' / 'trainee' false hits)
  if (/\b(paid ads|performance market\w*|ad specialist|media buyer|media planning|campaign specialist|ppc\b|sem\b|seo\b|social media|online reputation|orm\b|reputation management|reputation executive|content writer|copywriter|digital market\w*|growth market\w*|brand specialist|influencer|creative strategist|marketing)\b/i.test(t)) {
    return { designation: rawTitle.trim(), domain: 'MARKETING_SALES' };
  }

  // 0b. Sales, HR, Finance, Operations, Customer Support
  if (/\b(sales|telecaller|bde|bdr|sdr|accountant|accounting|auditor|payroll|tax specialist|recruiter|talent acquisition|human resources|hr executive|operations executive|customer support|customer care|call center|bpo)\b/i.test(t)) {
    return { designation: rawTitle.trim(), domain: 'SALES_OPERATIONS' };
  }

  // 1. Data Analytics / Business Intelligence (Must be explicit analytical role)
  if (/\b(data analytics|data analyst|business data analyst|bi analyst|power bi analyst|tableau analyst|sql analyst|data visualization|business intelligence analyst)\b/i.test(t) ||
      (/\banalyst\b/i.test(t) && /\b(data|bi|reporting|metrics|insights)\b/i.test(t))) {
    return { designation: 'Data Analyst', domain: 'DATA_ANALYTICS' };
  }

  // 2. Data Engineering
  if (/\b(data engineer|big data|etl developer|spark engineer)\b/i.test(t)) {
    return { designation: 'Data Engineer', domain: 'DATA_ENGINEERING' };
  }

  // 3. AI / Machine Learning / Data Science
  if (/\b(machine learning|ml engineer|ai engineer|data scientist|deep learning|nlp engineer|llm engineer)\b/i.test(t)) {
    return { designation: 'AI / Machine Learning Engineer', domain: 'AI_ML' };
  }

  // 4. Full Stack Developer (MERN / MEAN)
  if (/\b(full[\s-]?stack|mern|mean)\b/i.test(t)) {
    return { designation: 'Full Stack Developer', domain: 'FULL_STACK' };
  }

  // 5. Frontend Developer
  if (/\b(front[\s-]?end|frontend|react|angular|vue|next\.?js|svelte|ui developer)\b/i.test(t)) {
    return { designation: 'Frontend Developer', domain: 'FRONTEND' };
  }

  // 6. Python Developer
  if (/\b(python|django|fastapi|flask)\b/i.test(t) && /\b(developer|engineer|backend|back-end)\b/i.test(t)) {
    return { designation: 'Python Developer', domain: 'BACKEND' };
  }

  // 7. Backend Developer
  if (/\b(back[\s-]?end|backend|node\.?js|spring boot|laravel|ruby|php developer|java developer|\.net|golang|c# developer)\b/i.test(t)) {
    return { designation: 'Backend Developer', domain: 'BACKEND' };
  }

  // 8. Mobile Developer
  if (/\b(mobile|ios|android|react native|flutter|swift|kotlin)\b/i.test(t)) {
    return { designation: 'Mobile Developer', domain: 'MOBILE' };
  }

  // 9. UI/UX Designer
  if (/\b(ui[\s/]?ux|ux[\s/]?ui|product designer|ui designer|ux designer|ux researcher)\b/i.test(t)) {
    return { designation: 'UI/UX Designer', domain: 'UI_UX' };
  }

  // 10. QA Engineer
  if (/\b(qa|quality assurance|automation engineer|software tester|sdet|test engineer)\b/i.test(t)) {
    return { designation: 'QA Engineer', domain: 'QA' };
  }

  // 11. DevOps / Cloud
  if (/\b(devops|cloud engineer|aws|azure|site reliability|sre|platform engineer)\b/i.test(t)) {
    return { designation: 'DevOps / Cloud Engineer', domain: 'DEVOPS' };
  }

  // 12. Cybersecurity
  if (/\b(cyber[\s-]?security|infosec|security analyst|soc analyst)\b/i.test(t)) {
    return { designation: 'Cybersecurity Analyst', domain: 'CYBERSECURITY' };
  }

  // 13. General Software Developer
  if (/\b(software developer|software engineer|application developer|web developer|programmer|coder)\b/i.test(t)) {
    return { designation: 'Software Developer', domain: 'FULL_STACK' };
  }

  return { designation: rawTitle.trim(), domain: 'OTHER' };
}

/**
 * Infers candidate's canonical designation & domain from ResumeData
 */
export function inferCandidateDomain(resumeData: ResumeData): { designation: string; domain: TechDomain } {
  // 1. Check personal.targetRole
  if (resumeData.personal?.targetRole) {
    const roleNorm = normalizeRole(resumeData.personal.targetRole);
    if (roleNorm.domain !== 'OTHER') return roleNorm;
  }

  // 2. Check experience job titles
  for (const exp of (resumeData.experience || [])) {
    if (exp.jobTitle) {
      const expNorm = normalizeRole(exp.jobTitle);
      if (expNorm.domain !== 'OTHER') return expNorm;
    }
  }

  // 3. Check summary
  if (resumeData.summary) {
    const sumNorm = normalizeRole(resumeData.summary);
    if (sumNorm.domain !== 'OTHER') return sumNorm;
  }

  // 4. Check project roles / names
  for (const proj of (resumeData.projects || [])) {
    const text = `${proj.role || ''} ${proj.name || ''}`;
    const projNorm = normalizeRole(text);
    if (projNorm.domain !== 'OTHER') return projNorm;
  }

  // 5. Derive from extracted skills profile
  const allSkills = Object.values(resumeData.skills || {})
    .flat()
    .map(s => (typeof s === 'string' ? s.toLowerCase().trim() : ''))
    .filter(Boolean);

  let dataScore = 0;
  let webScore = 0;

  const dataKeywords = [
    'sql', 'power bi', 'powerbi', 'tableau', 'excel', 'pandas', 'numpy', 
    'eda', 'data visualization', 'statistics', 'matplotlib', 'seaborn', 
    'business intelligence', 'looker', 'etl', 'data analysis', 'data cleaning'
  ];
  const webKeywords = [
    'react', 'node', 'express', 'mongodb', 'mern', 'next.js', 'angular', 
    'vue', 'redux', 'full stack', 'html', 'css', 'tailwind', 'javascript', 'typescript'
  ];

  for (const skill of allSkills) {
    if (dataKeywords.some(k => skill.includes(k))) dataScore++;
    if (webKeywords.some(k => skill.includes(k))) webScore++;
  }

  if (dataScore > webScore && dataScore >= 2) {
    return { designation: 'Data Analyst', domain: 'DATA_ANALYTICS' };
  } else if (webScore > dataScore && webScore >= 2) {
    return { designation: 'Full Stack Developer', domain: 'FULL_STACK' };
  }

  return { designation: 'Candidate', domain: 'OTHER' };
}

/**
 * Checks compatibility between Candidate domain and Job domain
 */
function checkDomainCompatibility(
  candidateDomain: TechDomain,
  candidateDesig: string,
  jobDomain: TechDomain,
  jobDesig: string
): { isCompatible: boolean; scoreRatio: number; explanation: string } {
  // If either domain is MARKETING_SALES or SALES_OPERATIONS:
  if (candidateDomain === 'MARKETING_SALES' || jobDomain === 'MARKETING_SALES' || 
      candidateDomain === 'SALES_OPERATIONS' || jobDomain === 'SALES_OPERATIONS') {
    if (candidateDomain === jobDomain) {
      return {
        isCompatible: true,
        scoreRatio: 1.0,
        explanation: `✓ Role alignment: ${candidateDesig} matches ${jobDesig}`
      };
    }
    return {
      isCompatible: false,
      scoreRatio: 0.0,
      explanation: `Role mismatch: Candidate is in tech (${candidateDesig}), whereas this position is in marketing/operations (${jobDesig})`
    };
  }

  // Candidate is DATA_ANALYTICS
  if (candidateDomain === 'DATA_ANALYTICS') {
    if (jobDomain === 'DATA_ANALYTICS') {
      return {
        isCompatible: true,
        scoreRatio: 1.0,
        explanation: `✓ Direct role alignment: Data Analyst matches ${jobDesig}`
      };
    }
    if (jobDomain === 'DATA_ENGINEERING') {
      return {
        isCompatible: true,
        scoreRatio: 0.7,
        explanation: 'Compatible analytical foundation for Data Engineering'
      };
    }
    if (jobDomain === 'AI_ML') {
      return {
        isCompatible: true,
        scoreRatio: 0.6,
        explanation: 'Data analysis and modeling overlap with AI/ML'
      };
    }
    // If job domain was not classified (OTHER), check if job title explicitly mentions data/analyst/bi
    if (jobDomain === 'OTHER') {
      const isDataJob = /\b(data|analyst|analytics|bi\b|power[\s-]?bi|tableau|sql)\b/i.test(jobDesig);
      if (isDataJob) {
        return {
          isCompatible: true,
          scoreRatio: 0.7,
          explanation: `✓ Analytical role alignment: ${jobDesig}`
        };
      }
    }
    // Web development, Full Stack, MERN, Frontend, Backend, Mobile, QA, DevOps, Marketing, etc., are STRICTLY INCOMPATIBLE
    return {
      isCompatible: false,
      scoreRatio: 0.0,
      explanation: `Role mismatch: Candidate is Data Analyst, whereas this position is ${jobDesig}`
    };
  }

  // Candidate is FULL_STACK
  if (candidateDomain === 'FULL_STACK') {
    if (jobDomain === 'FULL_STACK') {
      return {
        isCompatible: true,
        scoreRatio: 1.0,
        explanation: `✓ Direct role alignment: Full Stack Developer matches ${jobDesig}`
      };
    }
    if (jobDomain === 'FRONTEND' || jobDomain === 'BACKEND') {
      return {
        isCompatible: true,
        scoreRatio: 0.8,
        explanation: `Strong engineering alignment: Full Stack matches ${jobDesig}`
      };
    }
    if (jobDomain === 'QA' || jobDomain === 'MOBILE') {
      return {
        isCompatible: true,
        scoreRatio: 0.6,
        explanation: `Transferable software engineering foundation for ${jobDesig}`
      };
    }
    if (jobDomain === 'OTHER') {
      const isDevJob = /\b(developer|software|engineer|programmer|coder|web|frontend|backend)\b/i.test(jobDesig);
      if (isDevJob) {
        return {
          isCompatible: true,
          scoreRatio: 0.7,
          explanation: `Engineering role compatibility: ${jobDesig}`
        };
      }
    }
    return {
      isCompatible: false,
      scoreRatio: 0.0,
      explanation: `Role mismatch: Candidate is Full Stack Developer, whereas this position is ${jobDesig}`
    };
  }

  // Candidate is FRONTEND
  if (candidateDomain === 'FRONTEND') {
    if (jobDomain === 'FRONTEND') {
      return { isCompatible: true, scoreRatio: 1.0, explanation: `✓ Direct role alignment: Frontend Developer matches ${jobDesig}` };
    }
    if (jobDomain === 'FULL_STACK') {
      return { isCompatible: true, scoreRatio: 0.75, explanation: `Frontend expertise applicable to ${jobDesig}` };
    }
    if (jobDomain === 'UI_UX') {
      return { isCompatible: true, scoreRatio: 0.6, explanation: `UI design and implementation overlap with ${jobDesig}` };
    }
    return {
      isCompatible: false,
      scoreRatio: 0.0,
      explanation: `Role mismatch: Candidate is Frontend Developer, whereas this position is ${jobDesig}`
    };
  }

  // Candidate is BACKEND
  if (candidateDomain === 'BACKEND') {
    if (jobDomain === 'BACKEND') {
      return { isCompatible: true, scoreRatio: 1.0, explanation: `✓ Direct role alignment: Backend Developer matches ${jobDesig}` };
    }
    if (jobDomain === 'FULL_STACK') {
      return { isCompatible: true, scoreRatio: 0.8, explanation: `Backend architecture foundation matches ${jobDesig}` };
    }
    if (jobDomain === 'DATA_ENGINEERING' || jobDomain === 'DEVOPS') {
      return { isCompatible: true, scoreRatio: 0.65, explanation: `System engineering foundation for ${jobDesig}` };
    }
    return {
      isCompatible: false,
      scoreRatio: 0.0,
      explanation: `Role mismatch: Candidate is Backend Developer, whereas this position is ${jobDesig}`
    };
  }

  // Exact same domain for any other role
  if (candidateDomain === jobDomain && candidateDomain !== 'OTHER') {
    return {
      isCompatible: true,
      scoreRatio: 1.0,
      explanation: `✓ Direct role alignment: ${candidateDesig} matches ${jobDesig}`
    };
  }

  // Default cross-domain mismatch
  return {
    isCompatible: false,
    scoreRatio: 0.0,
    explanation: `Role mismatch: Candidate (${candidateDesig}) differs from position (${jobDesig})`
  };
}

function cleanSkillStr(s: string): string {
  return s.toLowerCase().replace(/[\s\-_.]/g, '').trim();
}

const SKILL_SYNONYMS: Record<string, string[]> = {
  react: ['reactjs', 'react.js'],
  node: ['nodejs', 'node.js'],
  express: ['expressjs', 'express.js'],
  mongo: ['mongodb'],
  postgres: ['postgresql', 'psql'],
  powerbi: ['power bi', 'ms power bi', 'power-bi'],
  js: ['javascript'],
  ts: ['typescript'],
  py: ['python'],
  go: ['golang'],
  aws: ['amazon web services'],
  gcp: ['google cloud', 'google cloud platform'],
  excel: ['ms excel', 'advanced excel', 'microsoft excel'],
  tableau: ['tableau software'],
  eda: ['exploratory data analysis'],
  stats: ['statistics'],
  bi: ['business intelligence']
};

/**
 * Checks whether a single job skill matches a candidate's resume skill without substring false-positives.
 */
function skillsMatch(jobSkillRaw: string, resumeSkillRaw: string): boolean {
  const jRaw = jobSkillRaw.toLowerCase().trim();
  const rRaw = resumeSkillRaw.toLowerCase().trim();
  if (jRaw === rRaw) return true;

  const jClean = cleanSkillStr(jRaw);
  const rClean = cleanSkillStr(rRaw);
  if (jClean === rClean) return true;

  // Check synonym dictionary
  for (const [key, aliases] of Object.entries(SKILL_SYNONYMS)) {
    const family = [cleanSkillStr(key), ...aliases.map(cleanSkillStr)];
    if (family.includes(jClean) && family.includes(rClean)) return true;
  }

  // Whole word / boundary match ONLY when both lengths >= 4
  if (jRaw.length >= 4 && rRaw.length >= 4) {
    if (jRaw.includes(rRaw) || rRaw.includes(jRaw)) {
      return true;
    }
  }

  return false;
}

export function matchJobToResume(job: JobListing, resumeData: ResumeData): JobMatchResult {
  // Combine all resume skills into a flat array for easy checking
  const allResumeSkills = Object.values(resumeData.skills || {})
    .flat()
    .map(s => (typeof s === 'string' ? s.toLowerCase().trim() : ''))
    .filter(Boolean);

  // 1. Candidate and Job Domain Detection
  const candidateInfo = inferCandidateDomain(resumeData);
  const jobInfo = normalizeRole(job.normalizedDesignation || job.title);

  // 2. Designation & Domain Compatibility
  const maxDesignationScore = 40;
  const domainCheck = checkDomainCompatibility(
    candidateInfo.domain,
    candidateInfo.designation,
    jobInfo.domain,
    jobInfo.designation
  );
  const designationScore = Math.round(domainCheck.scoreRatio * maxDesignationScore);

  // 3. Technical Skills Matching
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  let skillsScore = 0;
  const maxSkillsScore = 35;
  const requiredSkillsCount = job.requiredSkills.length;

  if (!domainCheck.isCompatible) {
    // If the domain is incompatible (e.g. Paid Ads or MERN for Data Analyst),
    // strictly clear matched skills and skills score to 0
    skillsScore = 0;
    missingSkills.push(...job.requiredSkills);
  } else if (requiredSkillsCount > 0) {
    let matchCount = 0;
    for (const skill of job.requiredSkills) {
      const isMatched = allResumeSkills.some(rs => skillsMatch(skill, rs));
      if (isMatched) {
        matchedSkills.push(skill);
        matchCount++;
      } else {
        missingSkills.push(skill);
      }
    }
    skillsScore = Math.round((matchCount / requiredSkillsCount) * maxSkillsScore);
  } else {
    // If no required skills listed:
    // Only grant baseline skills if domain is compatible, otherwise 0
    skillsScore = 15;
  }

  // 4. Experience Matching (approximate based on resume experience dates)
  let rawExperienceScore = 0;
  const maxExperienceScore = 10;
  let experienceMatch: 'COMPATIBLE' | 'PARTIAL' | 'LOW' | 'UNKNOWN' = 'UNKNOWN';

  let totalMonthsExp = 0;
  (resumeData.experience || []).forEach(exp => {
    if (exp.startDate) {
      const start = new Date(exp.startDate);
      const end = exp.currentlyWorking || !exp.endDate ? new Date() : new Date(exp.endDate);
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      totalMonthsExp += Math.max(0, months);
    }
  });
  const totalYearsExp = totalMonthsExp / 12;

  let jobMinYears: number | null = job.minExperienceYears ?? null;
  const jobExpStr = getDisplayExperience(job).toLowerCase();
  const isUnspecified = jobExpStr.includes('not specified') || jobExpStr.includes('check job portal');

  if (jobMinYears === null) {
    if (jobExpStr.includes('fresh') || jobExpStr.includes('entry') || jobExpStr.includes('intern')) {
      jobMinYears = 0;
    } else {
      const numMatch = jobExpStr.match(/(\d+)/);
      if (numMatch && numMatch[1]) {
        jobMinYears = parseInt(numMatch[1], 10);
      }
    }
  }

  if (isUnspecified && jobMinYears === null) {
    rawExperienceScore = Math.round(maxExperienceScore * 0.75);
    experienceMatch = 'UNKNOWN';
  } else {
    const requiredYears = jobMinYears ?? 0;
    if (totalYearsExp >= requiredYears) {
      rawExperienceScore = maxExperienceScore;
      experienceMatch = 'COMPATIBLE';
    } else if (totalYearsExp >= requiredYears - 1) {
      rawExperienceScore = Math.round(maxExperienceScore * 0.6);
      experienceMatch = 'PARTIAL';
    } else {
      rawExperienceScore = 0;
      experienceMatch = 'LOW';
    }
  }

  const experienceScore = domainCheck.isCompatible ? rawExperienceScore : 0;

  // 5. Program Match Score
  // Only grant program points if the role domain is compatible!
  const programScore = domainCheck.isCompatible ? 15 : 0;
  const schoolMatch = domainCheck.isCompatible;
  const programMatch = domainCheck.isCompatible;

  // 6. Total Score Calculation
  let matchScore = 0;
  if (!domainCheck.isCompatible) {
    matchScore = 0;
  } else {
    matchScore = Math.min(100, Math.max(0, skillsScore + experienceScore + designationScore + programScore));
  }

  // 7. Verdict and Match Level
  let matchLevel: 'Excellent Match' | 'Good Match' | 'Partial Match' | 'Low Match' = 'Low Match';
  let verdict: MatchVerdict = 'NOT_MATCHED';

  if (!domainCheck.isCompatible || matchScore < 40) {
    matchLevel = 'Low Match';
    verdict = 'NOT_MATCHED';
  } else if (matchScore >= 75) {
    matchLevel = 'Excellent Match';
    verdict = 'MATCHED';
  } else if (matchScore >= 55) {
    matchLevel = 'Good Match';
    verdict = 'MATCHED';
  } else {
    matchLevel = 'Partial Match';
    verdict = 'PARTIALLY_MATCHED';
  }

  return {
    job,
    verdict,
    matchScore,
    matchLevel,
    designationScore,
    skillsScore,
    programScore,
    experienceScore,
    matchedSkills,
    missingSkills,
    schoolMatch,
    programMatch,
    designationMatch: domainCheck.isCompatible && designationScore > 0,
    experienceMatch: domainCheck.isCompatible ? experienceMatch : 'LOW',
    explanation: domainCheck.isCompatible
      ? `Role: ${designationScore}/${maxDesignationScore} (${jobInfo.designation}), Skills: ${skillsScore}/${maxSkillsScore}, Exp: ${experienceScore}/${maxExperienceScore}.`
      : `Role mismatch: Position is ${jobInfo.designation} (${jobInfo.domain}), which does not align with candidate profile (${candidateInfo.designation}).`,
    designationExplanation: domainCheck.explanation,
    programExplanation: domainCheck.isCompatible ? 'Program: Curriculum assessment' : 'Incompatible target domain',
    experienceExplanation: domainCheck.isCompatible
      ? `Candidate has ${totalYearsExp.toFixed(1)} yrs experience; requisition requires ~${jobMinYears} yrs.`
      : 'Experience not evaluated for mismatched domain'
  };
}
