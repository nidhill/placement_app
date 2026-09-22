import { JobListing, JobMatchResult, MatchVerdict } from '../types.ts';
import { ResumeData } from '../components/resume/types.ts';

export function matchJobToResume(job: JobListing, resumeData: ResumeData): JobMatchResult {
  // Combine all resume skills into a flat array for easy checking
  const allResumeSkills = Object.values(resumeData.skills || {})
    .flat()
    .map(s => (typeof s === 'string' ? s.toLowerCase().trim() : ''))
    .filter(Boolean);

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  
  let skillsScore = 0;
  const maxSkillsScore = 35;
  const requiredSkillsCount = job.requiredSkills.length;
  
  if (requiredSkillsCount > 0) {
    let matchCount = 0;
    for (const skill of job.requiredSkills) {
      const lowerSkill = skill.toLowerCase().trim();
      const isMatched = allResumeSkills.some(rs => rs.includes(lowerSkill) || lowerSkill.includes(rs));
      if (isMatched) {
        matchedSkills.push(skill);
        matchCount++;
      } else {
        missingSkills.push(skill);
      }
    }
    skillsScore = Math.round((matchCount / requiredSkillsCount) * maxSkillsScore);
  } else {
    skillsScore = maxSkillsScore; // Free points if no required skills
  }

  // Experience Matching (approximate based on resume experience dates)
  let experienceScore = 0;
  const maxExperienceScore = 10;
  let experienceMatch: 'COMPATIBLE' | 'PARTIAL' | 'LOW' | 'UNKNOWN' = 'UNKNOWN';
  
  // Calculate total years of experience from resume
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

  // Job requirements (heuristics from string if minExperienceYears not available)
  const jobExpStr = (job.experienceRequirement || '').toLowerCase();
  let jobMinYears = 0;
  if (jobExpStr.includes('0') || jobExpStr.includes('fresh') || jobExpStr.includes('entry')) {
    jobMinYears = 0;
  } else if (jobExpStr.includes('1')) {
    jobMinYears = 1;
  } else if (jobExpStr.includes('2')) {
    jobMinYears = 2;
  } else if (jobExpStr.includes('3')) {
    jobMinYears = 3;
  }

  if (totalYearsExp >= jobMinYears) {
    experienceScore = maxExperienceScore;
    experienceMatch = 'COMPATIBLE';
  } else if (totalYearsExp >= jobMinYears - 1) {
    experienceScore = maxExperienceScore / 2;
    experienceMatch = 'PARTIAL';
  } else {
    experienceScore = 0;
    experienceMatch = 'LOW';
  }

  // Designation Matching (checking past job titles and target role)
  let designationScore = 0;
  const maxDesignationScore = 40;
  const targetRoles = [
    resumeData.personal?.targetRole?.toLowerCase() || '',
    ...(resumeData.experience || []).map(e => (e.jobTitle || '').toLowerCase())
  ];
  
  const jobTitle = job.title.toLowerCase();
  const normalizedDesig = (job.normalizedDesignation || '').toLowerCase();
  
  const designationMatched = targetRoles.some(role => 
    role && (jobTitle.includes(role) || role.includes(jobTitle) || 
    (normalizedDesig && (normalizedDesig.includes(role) || role.includes(normalizedDesig))))
  );

  if (designationMatched) {
    designationScore = maxDesignationScore;
  } else if (targetRoles.some(role => role && (jobTitle.split(' ').some(w => w.length > 3 && role.includes(w))))) {
    designationScore = maxDesignationScore / 2; // Partial designation match
  }

  // Program Match - Assumed True for AI matching as we rely heavily on skills
  const programScore = 15;
  const schoolMatch = true;
  const programMatch = true;

  // Total Score Calculation
  const matchScore = skillsScore + experienceScore + designationScore + programScore;

  let matchLevel: 'Excellent Match' | 'Good Match' | 'Partial Match' | 'Low Match';
  let verdict: MatchVerdict = 'LOW';
  
  if (matchScore >= 80) {
    matchLevel = 'Excellent Match';
    verdict = 'HIGH';
  } else if (matchScore >= 60) {
    matchLevel = 'Good Match';
    verdict = 'MEDIUM';
  } else if (matchScore >= 40) {
    matchLevel = 'Partial Match';
    verdict = 'LOW';
  } else {
    matchLevel = 'Low Match';
    verdict = 'LOW';
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
    designationMatch: designationScore > 0,
    experienceMatch,
    explanation: `Matched based on AI-extracted resume. Skills: ${skillsScore}/${maxSkillsScore}, Experience: ${experienceScore}/${maxExperienceScore}, Role: ${designationScore}/${maxDesignationScore}.`,
    designationExplanation: designationMatched ? 'Matches your target role or past experience.' : 'Role is somewhat different from your history.',
    experienceExplanation: `You have ${totalYearsExp.toFixed(1)} years experience. Job requires roughly ${jobMinYears} years.`
  };
}
