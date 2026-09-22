// ──────────────────────────────────────────────────────────────────────────────
// AI Resume Agent — localStorage-based Resume Store
// ──────────────────────────────────────────────────────────────────────────────
// Manages CRUD for resume versions, auto-save with debounce, and pre-filling
// from the existing StudentProfile. All data persists in localStorage keyed
// by student ID until a backend Resume API is available.
// ──────────────────────────────────────────────────────────────────────────────

import { StudentProfile } from '../../types';
import {
  ResumeData,
  ResumeVersion,
  ResumeTemplate,
  ResumeSkills,
  createEmptyResumeData,
  generateId,
} from './types';

const STORAGE_KEY_PREFIX = 'haca_resume_';

function storageKey(studentId: string): string {
  return `${STORAGE_KEY_PREFIX}${studentId}`;
}

// ─── Read / Write ────────────────────────────────────────────────────────────

export function loadAllVersions(studentId: string): ResumeVersion[] {
  try {
    const raw = localStorage.getItem(storageKey(studentId));
    if (!raw) return [];
    return JSON.parse(raw) as ResumeVersion[];
  } catch {
    return [];
  }
}

export function saveAllVersions(studentId: string, versions: ResumeVersion[]): void {
  try {
    localStorage.setItem(storageKey(studentId), JSON.stringify(versions));
  } catch (e) {
    console.error('Failed to save resume versions to localStorage:', e);
  }
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export function createVersion(
  studentId: string,
  title: string,
  targetRole: string,
  template: ResumeTemplate = 'classic',
  initialData?: ResumeData
): ResumeVersion {
  const versions = loadAllVersions(studentId);
  const now = new Date().toISOString();
  const newVersion: ResumeVersion = {
    id: generateId('resume'),
    title,
    targetRole,
    data: initialData || createEmptyResumeData(),
    template,
    isDefault: versions.length === 0,
    createdAt: now,
    updatedAt: now,
  };
  versions.push(newVersion);
  saveAllVersions(studentId, versions);
  return newVersion;
}

export function updateVersion(studentId: string, version: ResumeVersion): void {
  const versions = loadAllVersions(studentId);
  const idx = versions.findIndex(v => v.id === version.id);
  if (idx >= 0) {
    versions[idx] = { ...version, updatedAt: new Date().toISOString() };
    saveAllVersions(studentId, versions);
  }
}

export function deleteVersion(studentId: string, versionId: string): void {
  let versions = loadAllVersions(studentId);
  versions = versions.filter(v => v.id !== versionId);
  // If we deleted the default, make the first remaining one default
  if (versions.length > 0 && !versions.some(v => v.isDefault)) {
    versions[0].isDefault = true;
  }
  saveAllVersions(studentId, versions);
}

export function getDefaultVersion(studentId: string): ResumeVersion | null {
  const versions = loadAllVersions(studentId);
  return versions.find(v => v.isDefault) || versions[0] || null;
}

export function setDefaultVersion(studentId: string, versionId: string): void {
  const versions = loadAllVersions(studentId);
  for (const v of versions) {
    v.isDefault = v.id === versionId;
  }
  saveAllVersions(studentId, versions);
}

// ─── Pre-fill from StudentProfile ────────────────────────────────────────────

/** Known skill keywords mapped to categories for auto-classification */
const SKILL_CATEGORY_MAP: Record<string, keyof ResumeSkills> = {
  // Programming
  python: 'programming', javascript: 'programming', typescript: 'programming',
  java: 'programming', 'c++': 'programming', 'c#': 'programming', c: 'programming',
  go: 'programming', rust: 'programming', ruby: 'programming', php: 'programming',
  swift: 'programming', kotlin: 'programming', dart: 'programming', r: 'programming',
  scala: 'programming', perl: 'programming', matlab: 'programming', sql: 'programming',
  html: 'web_technologies', css: 'web_technologies', sass: 'web_technologies',
  less: 'web_technologies',
  // Frameworks
  react: 'frameworks', angular: 'frameworks', vue: 'frameworks', svelte: 'frameworks',
  'next.js': 'frameworks', nextjs: 'frameworks', nuxt: 'frameworks',
  django: 'frameworks', flask: 'frameworks', fastapi: 'frameworks',
  express: 'frameworks', 'node.js': 'frameworks', nodejs: 'frameworks',
  'spring boot': 'frameworks', spring: 'frameworks', rails: 'frameworks',
  laravel: 'frameworks', '.net': 'frameworks', dotnet: 'frameworks',
  flutter: 'frameworks', 'react native': 'frameworks', tailwind: 'frameworks',
  bootstrap: 'frameworks',
  // AI / ML
  tensorflow: 'ai_ml', pytorch: 'ai_ml', keras: 'ai_ml', scikit: 'ai_ml',
  'scikit-learn': 'ai_ml', opencv: 'ai_ml', pandas: 'ai_ml', numpy: 'ai_ml',
  matplotlib: 'ai_ml', seaborn: 'ai_ml', 'machine learning': 'ai_ml',
  'deep learning': 'ai_ml', nlp: 'ai_ml', 'computer vision': 'ai_ml',
  'data science': 'ai_ml',
  // Generative AI
  llm: 'generative_ai', llms: 'generative_ai', rag: 'generative_ai',
  langchain: 'generative_ai', embeddings: 'generative_ai',
  'vector database': 'generative_ai', 'vector databases': 'generative_ai',
  openai: 'generative_ai', gpt: 'generative_ai', 'generative ai': 'generative_ai',
  'prompt engineering': 'generative_ai', huggingface: 'generative_ai',
  'hugging face': 'generative_ai', gemini: 'generative_ai',
  // Databases
  mongodb: 'databases', mysql: 'databases', postgresql: 'databases',
  postgres: 'databases', redis: 'databases', sqlite: 'databases',
  firebase: 'databases', supabase: 'databases', dynamodb: 'databases',
  cassandra: 'databases', neo4j: 'databases', elasticsearch: 'databases',
  pinecone: 'databases', weaviate: 'databases', chromadb: 'databases',
  // Cloud
  aws: 'cloud', azure: 'cloud', gcp: 'cloud', 'google cloud': 'cloud',
  heroku: 'cloud', vercel: 'cloud', netlify: 'cloud', digitalocean: 'cloud',
  // DevOps
  docker: 'devops', kubernetes: 'devops', 'ci/cd': 'devops', jenkins: 'devops',
  terraform: 'devops', ansible: 'devops', 'github actions': 'devops',
  nginx: 'devops', linux: 'devops',
  // Tools
  git: 'tools', github: 'tools', gitlab: 'tools', bitbucket: 'tools',
  jira: 'tools', confluence: 'tools', figma: 'tools', postman: 'tools',
  'vs code': 'tools', vscode: 'tools', jupyter: 'tools', slack: 'tools',
  notion: 'tools',
};

/** Normalize a skill string for duplicate detection */
export function normalizeSkill(skill: string): string {
  return skill.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Categorize a single skill */
function categorizeSkill(skill: string): keyof ResumeSkills {
  const normalized = normalizeSkill(skill);
  return SKILL_CATEGORY_MAP[normalized] || 'other';
}

/** Capitalize the first letter of each word */
function titleCase(str: string): string {
  // Preserve acronyms / known casings
  const known: Record<string, string> = {
    'html': 'HTML', 'css': 'CSS', 'sql': 'SQL', 'api': 'API',
    'rest': 'REST', 'graphql': 'GraphQL', 'mongodb': 'MongoDB',
    'mysql': 'MySQL', 'postgresql': 'PostgreSQL', 'nodejs': 'Node.js',
    'node.js': 'Node.js', 'next.js': 'Next.js', 'nextjs': 'Next.js',
    'react': 'React', 'vue': 'Vue', 'angular': 'Angular',
    'typescript': 'TypeScript', 'javascript': 'JavaScript',
    'python': 'Python', 'java': 'Java', 'django': 'Django',
    'flask': 'Flask', 'fastapi': 'FastAPI', 'express': 'Express',
    'tensorflow': 'TensorFlow', 'pytorch': 'PyTorch', 'opencv': 'OpenCV',
    'aws': 'AWS', 'gcp': 'GCP', 'azure': 'Azure',
    'docker': 'Docker', 'kubernetes': 'Kubernetes', 'git': 'Git',
    'github': 'GitHub', 'gitlab': 'GitLab', 'figma': 'Figma',
    'postman': 'Postman', 'redis': 'Redis', 'firebase': 'Firebase',
    'supabase': 'Supabase', 'vercel': 'Vercel', 'heroku': 'Heroku',
    'linux': 'Linux', 'nginx': 'Nginx', 'jenkins': 'Jenkins',
    'jira': 'Jira', 'llm': 'LLM', 'llms': 'LLMs', 'rag': 'RAG',
    'nlp': 'NLP', 'ai': 'AI', 'ml': 'ML', 'ci/cd': 'CI/CD',
    'langchain': 'LangChain', 'openai': 'OpenAI',
    'scikit-learn': 'Scikit-learn', 'pandas': 'Pandas', 'numpy': 'NumPy',
    'matplotlib': 'Matplotlib', 'keras': 'Keras',
    'tailwind': 'Tailwind', 'bootstrap': 'Bootstrap',
    'php': 'PHP', 'c++': 'C++', 'c#': 'C#', 'r': 'R',
    '.net': '.NET', 'dotnet': '.NET',
  };
  const lower = str.trim().toLowerCase();
  if (known[lower]) return known[lower];
  return str.trim().replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Creates a ResumeData pre-filled from an existing StudentProfile.
 * Does NOT overwrite the student's master profile — this is a snapshot.
 */
export function prefillFromProfile(profile: StudentProfile): ResumeData {
  const data = createEmptyResumeData();

  // Personal info
  data.personal.fullName = profile.fullName || '';
  data.personal.email = profile.email || '';
  data.personal.phone = profile.phone || '';
  data.personal.targetRole = profile.designation || '';
  data.personal.linkedin = profile.linkedinUrl || '';
  data.personal.portfolio = profile.portfolioUrl || '';

  // Education from academic record
  if (profile.academic) {
    const edu = profile.academic;
    data.education.push({
      id: generateId('edu'),
      degree: '',
      fieldOfStudy: edu.course || profile.program || '',
      institution: profile.school || 'HACA',
      location: '',
      startDate: '',
      endDate: '',
      gpa: edu.scores?.gpaOrPercentage ? String(edu.scores.gpaOrPercentage) : '',
      relevantCoursework: '',
      additionalDetails: '',
    });
  }

  // Skills — categorize from academic.skills
  if (profile.academic?.skills?.length) {
    const seenNormalized = new Set<string>();
    for (const rawSkill of profile.academic.skills) {
      const norm = normalizeSkill(rawSkill);
      if (seenNormalized.has(norm)) continue;
      seenNormalized.add(norm);

      const category = categorizeSkill(rawSkill);
      const displayName = titleCase(rawSkill);
      data.skills[category].push(displayName);
    }
  }

  // Projects from academic.projects
  if (profile.academic?.projects?.length) {
    for (const proj of profile.academic.projects) {
      data.projects.push({
        id: generateId('proj'),
        name: proj.title || '',
        description: proj.description || '',
        technologies: [],
        role: '',
        githubUrl: proj.githubUrl || '',
        liveDemoUrl: '',
        startDate: '',
        endDate: '',
        highlights: [],
      });
    }
  }

  return data;
}

// ─── Resume Completeness ─────────────────────────────────────────────────────

export interface CompletenessResult {
  percentage: number;
  missing: string[];
}

export function calculateCompleteness(data: ResumeData): CompletenessResult {
  const missing: string[] = [];
  let total = 0;
  let filled = 0;

  // Required
  const requiredChecks: [string, boolean][] = [
    ['Full Name', !!data.personal.fullName.trim()],
    ['Email', !!data.personal.email.trim()],
    ['Target Role', !!data.personal.targetRole.trim()],
    ['Phone', !!data.personal.phone.trim()],
    ['Professional Summary', !!data.summary.trim()],
    ['At least 1 Education', data.education.length > 0],
  ];
  for (const [label, ok] of requiredChecks) {
    total++;
    if (ok) filled++;
    else missing.push(label);
  }

  // Optional but valuable
  const optionalChecks: [string, boolean][] = [
    ['LinkedIn', !!data.personal.linkedin.trim()],
    ['Portfolio', !!data.personal.portfolio.trim()],
    ['At least 1 Skill', Object.values(data.skills).some(arr => arr.length > 0)],
    ['At least 1 Experience or Project', data.experience.length > 0 || data.projects.length > 0],
    ['At least 1 Project', data.projects.length > 0],
    ['At least 1 Certification', data.certifications.length > 0],
  ];
  for (const [label, ok] of optionalChecks) {
    total++;
    if (ok) filled++;
    else missing.push(label);
  }

  const percentage = Math.round((filled / total) * 100);
  return { percentage, missing };
}
