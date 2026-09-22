// ──────────────────────────────────────────────────────────────────────────────
// AI Resume Agent — Structured Resume Types
// ──────────────────────────────────────────────────────────────────────────────
// These types define the structured JSON schema for a student's resume.
// They are the single source of truth for the live preview, PDF generation,
// ATS analysis, and job tailoring features.
// ──────────────────────────────────────────────────────────────────────────────

export interface ResumePersonalInfo {
  fullName: string;
  targetRole: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  nationality: string;
  linkedin: string;
  github: string;
  portfolio: string;
  googleScholar: string;
  otherLink: string;
}

export interface ResumeEducation {
  id: string;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
  relevantCoursework: string;
  additionalDetails: string;
}

export interface ResumeSkills {
  programming: string[];
  frameworks: string[];
  ai_ml: string[];
  generative_ai: string[];
  databases: string[];
  cloud: string[];
  devops: string[];
  tools: string[];
  web_technologies: string[];
  other: string[];
}

export const SKILL_CATEGORY_LABELS: Record<keyof ResumeSkills, string> = {
  programming: 'Programming Languages',
  frameworks: 'Frameworks',
  ai_ml: 'AI / ML',
  generative_ai: 'Generative AI',
  databases: 'Databases',
  cloud: 'Cloud',
  devops: 'DevOps',
  tools: 'Tools',
  web_technologies: 'Web Technologies',
  other: 'Other',
};

export interface ResumeExperience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
}

export interface ResumeProject {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  role: string;
  githubUrl: string;
  liveDemoUrl: string;
  startDate: string;
  endDate: string;
  highlights: string[];
}

export interface ResumeCertification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
  credentialUrl: string;
}

export interface ResumeAchievement {
  id: string;
  title: string;
  description: string;
  date: string;
  organization: string;
}

export interface ResumeLanguage {
  id: string;
  language: string;
  proficiency: 'Native' | 'Professional' | 'Conversational' | 'Basic' | string;
}

// The complete structured resume data
export interface ResumeData {
  personal: ResumePersonalInfo;
  summary: string;
  education: ResumeEducation[];
  skills: ResumeSkills;
  experience: ResumeExperience[];
  projects: ResumeProject[];
  certifications: ResumeCertification[];
  achievements: ResumeAchievement[];
  languages: ResumeLanguage[];
}

export type ResumeTemplate = 'classic' | 'modern';

// A single saved resume version
export interface ResumeVersion {
  id: string;
  title: string;
  targetRole: string;
  data: ResumeData;
  template: ResumeTemplate;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ATS Analysis result
export interface ATSCheckItem {
  label: string;
  passed: boolean;
  detail?: string;
}

export interface ATSAnalysisResult {
  overallScore: number;
  structureChecks: ATSCheckItem[];
  formattingChecks: ATSCheckItem[];
  contentChecks: ATSCheckItem[];
}

// Job tailoring result
export interface JobKeywordMatch {
  keyword: string;
  status: 'matched' | 'missing' | 'partial';
  resumeEvidence?: string;
}

export interface JobTailorResult {
  matchedSkills: string[];
  missingSkills: string[];
  partialSkills: string[];
  keywordMatches: JobKeywordMatch[];
  suggestions: string[];
  tailoredResume?: ResumeData;
}

// Save status for auto-save UI
export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

// Helper to create empty resume data
export function createEmptyResumeData(): ResumeData {
  return {
    personal: {
      fullName: '',
      targetRole: '',
      email: '',
      phone: '',
      city: '',
      state: '',
      country: '',
      nationality: '',
      linkedin: '',
      github: '',
      portfolio: '',
      googleScholar: '',
      otherLink: '',
    },
    summary: '',
    education: [],
    skills: {
      programming: [],
      frameworks: [],
      ai_ml: [],
      generative_ai: [],
      databases: [],
      cloud: [],
      devops: [],
      tools: [],
      web_technologies: [],
      other: [],
    },
    experience: [],
    projects: [],
    certifications: [],
    achievements: [],
    languages: [],
  };
}

// Helper to generate unique IDs
export function generateId(prefix: string = 'item'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}
