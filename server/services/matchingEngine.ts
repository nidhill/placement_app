import { 
  StudentProfile, 
  JobListing, 
  JobMatchResult, 
  MatchVerdict 
} from '../../src/types.ts';
import { DesignationNormalizer } from './designationNormalizer.ts';

/**
 * CONFIGURABLE MATCHING WEIGHTS
 * Configurable in one place as required.
 */
export const MATCHING_WEIGHTS = {
  designation: 0.40, // 40%
  skills: 0.35,      // 35%
  program: 0.15,     // 15%
  experience: 0.10   // 10%
};

export class JobMatchingService {
  /**
   * Evaluates a Student against a Job Listing using multi-dimensional weighted scoring:
   * 1. Designation / Role Match (40%)
   * 2. Skills Match (35%)
   * 3. Program / Course Match (15%)
   * 4. Experience Match (10%)
   */
  public static evaluateMatch(student: StudentProfile, job: JobListing): JobMatchResult {
    // -------------------------------------------------------------
    // 1. Designation / Role Match (40%)
    // -------------------------------------------------------------
    const studentDesignation = student.designation || student.academic?.course || '';
    const jobNormalized = job.normalizedDesignation || DesignationNormalizer.normalize(job.title);
    const designationComparison = DesignationNormalizer.compareDesignations(
      studentDesignation,
      job.title,
      jobNormalized
    );

    const designationScore = Math.round(designationComparison.scoreRatio * (MATCHING_WEIGHTS.designation * 100));
    const designationMatch = designationComparison.isCompatible;
    const designationExplanation = designationComparison.explanation;

    // -------------------------------------------------------------
    // 2. Program / Course Match (15%)
    // -------------------------------------------------------------
    const studentProgram = (student.program || '').trim().toLowerCase();
    const studentSchool = (student.school || '').trim().toLowerCase();
    let programScoreRatio = 0;
    let programMatch = false;
    let programExplanation = '';

    if (!student.program) {
      programExplanation = 'Program not specified';
      programScoreRatio = 0.5;
    } else {
      const eligibleProgs = (job.eligiblePrograms || []).map(p => p.toLowerCase());
      const eligibleSchools = (job.eligibleSchools || []).map(s => s.toLowerCase());

      const exactProgramMatch = eligibleProgs.some(p => 
        p === studentProgram || studentProgram.includes(p) || p.includes(studentProgram)
      );

      const schoolMatch = eligibleSchools.length === 0 || eligibleSchools.includes(studentSchool);

      if (exactProgramMatch) {
        programMatch = true;
        programScoreRatio = 1.0;
        programExplanation = `✓ ${student.program}`;
      } else if (schoolMatch && eligibleProgs.length === 0) {
        programMatch = true;
        programScoreRatio = 0.85;
        programExplanation = `✓ School of Tech curriculum alignment`;
      } else if (schoolMatch) {
        programMatch = true;
        programScoreRatio = 0.65;
        programExplanation = `Compatible technical curriculum (${student.program})`;
      } else {
        programMatch = false;
        programScoreRatio = 0.20;
        programExplanation = `Different target faculty`;
      }
    }

    const programScore = Math.round(programScoreRatio * (MATCHING_WEIGHTS.program * 100));

    // -------------------------------------------------------------
    // 3. Skills Match (35%)
    // -------------------------------------------------------------
    const rawStudentSkills = student.academic?.skills || [];
    const studentSkillsLower = new Map<string, string>();
    rawStudentSkills.forEach(s => {
      studentSkillsLower.set(s.trim().toLowerCase(), s.trim());
    });

    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
    const jobReqSkills = job.requiredSkills || [];

    if (rawStudentSkills.length === 0) {
      missingSkills.push(...jobReqSkills);
    } else {
      jobReqSkills.forEach(req => {
        const reqLower = req.trim().toLowerCase();
        // Exact match or contains match
        let found = false;
        for (const [sLow, sOrig] of studentSkillsLower.entries()) {
          if (sLow === reqLower || sLow.includes(reqLower) || reqLower.includes(sLow)) {
            matchedSkills.push(req);
            found = true;
            break;
          }
        }
        if (!found) {
          missingSkills.push(req);
        }
      });
    }

    let skillsScoreRatio = 0;
    if (rawStudentSkills.length === 0) {
      skillsScoreRatio = 0.1;
    } else if (jobReqSkills.length === 0) {
      skillsScoreRatio = 0.75;
    } else {
      const matchRatio = matchedSkills.length / jobReqSkills.length;
      // Preferred skills bonus
      const prefMatches = (job.preferredSkills || []).filter(pref => {
        const prefLower = pref.trim().toLowerCase();
        return Array.from(studentSkillsLower.keys()).some(s => s === prefLower || s.includes(prefLower));
      });
      const prefBonus = Math.min(0.15, prefMatches.length * 0.05);
      skillsScoreRatio = Math.min(1.0, matchRatio + prefBonus);
    }

    const skillsScore = Math.round(skillsScoreRatio * (MATCHING_WEIGHTS.skills * 100));

    // -------------------------------------------------------------
    // 4. Experience Match (10%)
    // -------------------------------------------------------------
    const studentYears = student.yearsOfExperience ?? 1;
    const jobMinYears = job.minExperienceYears ?? 0;
    let expRatio = 1.0;
    let expVerdict: 'COMPATIBLE' | 'PARTIAL' | 'LOW' | 'UNKNOWN' = 'COMPATIBLE';
    let experienceExplanation = '';

    const expReqText = (job.experienceRequirement || '').toLowerCase();

    if (!job.experienceRequirement) {
      expVerdict = 'UNKNOWN';
      expRatio = 0.7;
      experienceExplanation = 'Experience requirement not specified';
    } else if (jobMinYears <= studentYears || expReqText.includes('fresh') || expReqText.includes('0-1') || expReqText.includes('0–1') || expReqText.includes('entry')) {
      expVerdict = 'COMPATIBLE';
      expRatio = 1.0;
      experienceExplanation = '✓ Suitable for fresher / 0–1 year';
    } else if (jobMinYears <= studentYears + 1) {
      expVerdict = 'PARTIAL';
      expRatio = 0.65;
      experienceExplanation = `Requires ${job.experienceRequirement}`;
    } else {
      expVerdict = 'LOW';
      expRatio = 0.25;
      experienceExplanation = `⚠ Requires ${job.experienceRequirement}`;
    }

    const experienceScore = Math.round(expRatio * (MATCHING_WEIGHTS.experience * 100));

    // -------------------------------------------------------------
    // Overall Match Calculation
    // -------------------------------------------------------------
    let totalScore = designationScore + skillsScore + programScore + experienceScore;
    totalScore = Math.min(100, Math.max(15, totalScore));

    // Match Level Label
    let matchLevel: 'Excellent Match' | 'Good Match' | 'Partial Match' | 'Low Match' = 'Low Match';
    if (totalScore >= 80) matchLevel = 'Excellent Match';
    else if (totalScore >= 65) matchLevel = 'Good Match';
    else if (totalScore >= 50) matchLevel = 'Partial Match';
    else matchLevel = 'Low Match';

    // Match Verdict
    let verdict: MatchVerdict = 'NOT_MATCHED';
    if (totalScore >= 65) verdict = 'MATCHED';
    else if (totalScore >= 45) verdict = 'PARTIALLY_MATCHED';
    else verdict = 'NOT_MATCHED';

    // Summary Explanation
    let explanation = `${matchLevel} (${totalScore}%): `;
    if (designationMatch) {
      explanation += `Target role (${jobNormalized}) matches student profile. `;
    }
    if (matchedSkills.length > 0) {
      explanation += `Matched: ${matchedSkills.join(', ')}. `;
    }
    if (missingSkills.length > 0) {
      explanation += `Missing: ${missingSkills.join(', ')}.`;
    }

    return {
      job,
      verdict,
      matchScore: totalScore,
      matchLevel,
      designationScore,
      skillsScore,
      programScore,
      experienceScore,
      matchedSkills,
      missingSkills,
      schoolMatch: true,
      programMatch,
      designationMatch,
      experienceMatch: expVerdict,
      explanation,
      designationExplanation,
      programExplanation,
      experienceExplanation
    };
  }

  /**
   * Recommends active tech jobs for a student, sorted strictly by matchScore descending.
   */
  public static getRecommendedJobsForStudent(
    student: StudentProfile, 
    allJobs: JobListing[]
  ): JobMatchResult[] {
    const activeJobs = allJobs.filter(j => j.status === 'ACTIVE');
    const results = activeJobs.map(job => this.evaluateMatch(student, job));

    // Sort strictly by matchScore descending
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Ranks candidates for a specific job requisition.
   */
  public static rankCandidatesForJob(
    job: JobListing, 
    allStudents: StudentProfile[]
  ): { student: StudentProfile; match: JobMatchResult }[] {
    const eligibleStudents = allStudents.filter(
      s => s.eligibilityStatus === 'ELIGIBLE' || s.eligibilityStatus === 'ADMIN_OVERRIDE'
    );

    return eligibleStudents
      .map(student => ({
        student,
        match: this.evaluateMatch(student, job)
      }))
      .sort((a, b) => b.match.matchScore - a.match.matchScore);
  }
}

// Backwards compatibility export
export const RuleBasedMatchingEngine = JobMatchingService;
