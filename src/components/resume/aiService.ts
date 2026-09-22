// ──────────────────────────────────────────────────────────────────────────────
// AI Resume Agent — Groq AI Service
// ──────────────────────────────────────────────────────────────────────────────
// Calls the Groq API directly from the frontend using the VITE_GROQ_API_KEY.
// Every prompt enforces strict factuality: the AI never invents information.
// ──────────────────────────────────────────────────────────────────────────────

import { ResumeData, ATSAnalysisResult, ATSCheckItem, JobKeywordMatch, SKILL_CATEGORY_LABELS, ResumeSkills } from './types';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ─── Core API Call ───────────────────────────────────────────────────────────

async function callGemini(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key is not configured. Please set VITE_GROQ_API_KEY in your .env file.');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq API error (${response.status})`);
  }

  const result = await response.json();
  return result?.choices?.[0]?.message?.content?.trim() || '';
}

async function extractTextFromPdfBase64(base64Data: string): Promise<string> {
  const binary_string = window.atob(base64Data);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }

  const loadingTask = pdfjsLib.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(' ') + '\n';
  }
  return text;
}

async function callGeminiWithFile(prompt: string, base64Data: string, mimeType: string): Promise<string> {
  let documentText = '';
  try {
    if (mimeType.includes('pdf')) {
      documentText = await extractTextFromPdfBase64(base64Data);
    } else {
      documentText = window.atob(base64Data); // Fallback for simple text files
    }
  } catch (err) {
    console.error("PDF Parsing Error:", err);
    throw new Error("Failed to extract text from the uploaded document.");
  }

  const fullPrompt = `${prompt}\n\nDocument Contents:\n${documentText}`;
  return callGemini(fullPrompt);
}

// ─── Factuality Preamble ─────────────────────────────────────────────────────

const FACTUALITY_RULES = `
CRITICAL RULES — YOU MUST FOLLOW THESE:
1. NEVER invent, fabricate, or assume any information not explicitly provided.
2. NEVER invent metrics, percentages, user counts, revenue figures, or performance improvements.
3. NEVER invent company names, job titles, certifications, awards, or years of experience.
4. NEVER add technologies, tools, or skills the student has not mentioned.
5. You may ONLY rewrite, summarize, reorganize, improve grammar, improve clarity, and improve professional tone.
6. If information is insufficient, say "Information not provided" rather than making something up.
7. Use action-oriented, ATS-friendly language.
8. Keep output concise and professional.
`.trim();

// ─── Generate Professional Summary ──────────────────────────────────────────

export async function generateSummary(data: ResumeData): Promise<string> {
  const allSkills = Object.values(data.skills).flat().filter(Boolean);
  const experienceSummary = data.experience.map(e =>
    `${e.jobTitle} at ${e.company} (${e.technologies.join(', ')})`
  ).join('; ');
  const projectSummary = data.projects.map(p => p.name).join(', ');
  const educationSummary = data.education.map(e =>
    `${e.degree || ''} ${e.fieldOfStudy} from ${e.institution}`.trim()
  ).join('; ');

  const prompt = `
${FACTUALITY_RULES}

Generate a concise, professional summary (3-4 sentences) for a resume based ONLY on the following verified information:

Name: ${data.personal.fullName}
Target Role: ${data.personal.targetRole}
Skills: ${allSkills.join(', ') || 'Not provided'}
Education: ${educationSummary || 'Not provided'}
Experience: ${experienceSummary || 'Not provided'}
Projects: ${projectSummary || 'Not provided'}

Write in third person implied (no "I" or name). Make it ATS-friendly and professional.
Return ONLY the summary text, no quotes or labels.
`.trim();

  return callGemini(prompt);
}

// ─── Improve Professional Summary ───────────────────────────────────────────

export async function improveSummary(currentSummary: string, data: ResumeData): Promise<string> {
  const allSkills = Object.values(data.skills).flat().filter(Boolean);

  const prompt = `
${FACTUALITY_RULES}

Improve the following professional resume summary. Make it more impactful, concise, and ATS-friendly.
Do NOT add any information not present in the original or the provided context.

Current Summary:
"${currentSummary}"

Context:
Target Role: ${data.personal.targetRole}
Skills: ${allSkills.join(', ') || 'Not provided'}

Return ONLY the improved summary text, no quotes or labels.
`.trim();

  return callGemini(prompt);
}

// ─── Improve Experience Bullet ──────────────────────────────────────────────

export async function improveBullet(bullet: string, context: { jobTitle: string; company: string; technologies: string[] }): Promise<string> {
  const prompt = `
${FACTUALITY_RULES}

Improve this resume bullet point. Make it more impactful and ATS-friendly using action verbs.
Do NOT add metrics, numbers, or achievements not mentioned in the original.

Original: "${bullet}"
Context: ${context.jobTitle} at ${context.company}, using ${context.technologies.join(', ') || 'various technologies'}

Return ONLY the improved bullet point text (a single line), no quotes, no bullet marker, no labels.
`.trim();

  return callGemini(prompt);
}

// ─── Improve Project Description ────────────────────────────────────────────

export async function improveProjectDescription(description: string, context: { name: string; technologies: string[] }): Promise<string> {
  const prompt = `
${FACTUALITY_RULES}

Improve this project description for a resume. Make it concise, impactful, and ATS-friendly.
Do NOT add features, metrics, or technologies not mentioned.

Project: ${context.name}
Technologies: ${context.technologies.join(', ') || 'Not specified'}
Current Description: "${description}"

Return ONLY the improved description text (2-3 sentences max), no quotes or labels.
`.trim();

  return callGemini(prompt);
}

// ─── ATS Resume Analysis ────────────────────────────────────────────────────

export function analyzeResume(data: ResumeData): ATSAnalysisResult {
  const structureChecks: ATSCheckItem[] = [
    {
      label: 'Contact information found',
      passed: !!(data.personal.fullName && data.personal.email && data.personal.phone),
      detail: !data.personal.fullName ? 'Missing name' : !data.personal.email ? 'Missing email' : !data.personal.phone ? 'Missing phone' : undefined,
    },
    {
      label: 'Professional summary found',
      passed: !!data.summary.trim(),
      detail: !data.summary.trim() ? 'Add a professional summary' : undefined,
    },
    {
      label: 'Education section found',
      passed: data.education.length > 0,
      detail: data.education.length === 0 ? 'Add at least one education entry' : undefined,
    },
    {
      label: 'Skills section found',
      passed: Object.values(data.skills).some(arr => arr.length > 0),
      detail: Object.values(data.skills).every(arr => arr.length === 0) ? 'Add at least one skill' : undefined,
    },
    {
      label: 'Experience or Projects found',
      passed: data.experience.length > 0 || data.projects.length > 0,
      detail: data.experience.length === 0 && data.projects.length === 0 ? 'Add experience or projects' : undefined,
    },
  ];

  const formattingChecks: ATSCheckItem[] = [
    {
      label: 'Standard section headings used',
      passed: true,
      detail: 'Using standard ATS-recognized section names',
    },
    {
      label: 'Text is machine-readable',
      passed: true,
      detail: 'All text is selectable and parseable',
    },
    {
      label: 'No image-based text',
      passed: true,
    },
    {
      label: 'No excessive graphics',
      passed: true,
    },
    {
      label: 'Clean, single-column layout',
      passed: true,
    },
  ];

  const totalSkills = Object.values(data.skills).flat().length;
  const hasDetailedExperience = data.experience.every(e => e.responsibilities.length > 0 || e.achievements.length > 0);
  const hasProjectTech = data.projects.every(p => p.technologies.length > 0);

  const contentChecks: ATSCheckItem[] = [
    {
      label: 'Target role identified',
      passed: !!data.personal.targetRole.trim(),
      detail: !data.personal.targetRole.trim() ? 'Specify your target role' : undefined,
    },
    {
      label: 'Skills are categorized',
      passed: totalSkills >= 3,
      detail: totalSkills < 3 ? `Only ${totalSkills} skill(s) listed. Add more relevant skills.` : undefined,
    },
    {
      label: 'Experience bullets are descriptive',
      passed: data.experience.length === 0 || hasDetailedExperience,
      detail: !hasDetailedExperience ? 'Some experience entries lack responsibilities or achievements' : undefined,
    },
    {
      label: 'Projects include technologies',
      passed: data.projects.length === 0 || hasProjectTech,
      detail: !hasProjectTech ? 'Some projects are missing technology tags' : undefined,
    },
    {
      label: 'LinkedIn profile provided',
      passed: !!data.personal.linkedin.trim(),
      detail: !data.personal.linkedin.trim() ? 'Adding a LinkedIn URL improves credibility' : undefined,
    },
  ];

  const allChecks = [...structureChecks, ...formattingChecks, ...contentChecks];
  const passedCount = allChecks.filter(c => c.passed).length;
  const overallScore = Math.round((passedCount / allChecks.length) * 100);

  return { overallScore, structureChecks, formattingChecks, contentChecks };
}

// ─── Job Keyword Extraction & Matching ──────────────────────────────────────

export function extractAndMatchKeywords(
  jobDescription: string,
  jobRequiredSkills: string[],
  jobPreferredSkills: string[],
  resumeData: ResumeData
): { keywordMatches: JobKeywordMatch[]; matchedSkills: string[]; missingSkills: string[]; partialSkills: string[] } {
  // Collect all resume skills
  const allResumeSkills = Object.values(resumeData.skills).flat().map(s => s.toLowerCase());
  const resumeText = [
    resumeData.summary,
    ...resumeData.experience.flatMap(e => [...e.responsibilities, ...e.achievements, ...e.technologies]),
    ...resumeData.projects.flatMap(p => [p.description, ...p.technologies, ...p.highlights]),
  ].join(' ').toLowerCase();

  // Combine job skills
  const jobSkills = [...new Set([...jobRequiredSkills, ...jobPreferredSkills])];

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  const partialSkills: string[] = [];
  const keywordMatches: JobKeywordMatch[] = [];

  for (const skill of jobSkills) {
    const lower = skill.toLowerCase();
    const inSkillsList = allResumeSkills.some(s => s === lower || s.includes(lower) || lower.includes(s));
    const inText = resumeText.includes(lower);

    if (inSkillsList) {
      matchedSkills.push(skill);
      keywordMatches.push({ keyword: skill, status: 'matched', resumeEvidence: 'Found in skills section' });
    } else if (inText) {
      partialSkills.push(skill);
      keywordMatches.push({ keyword: skill, status: 'partial', resumeEvidence: 'Mentioned in resume text' });
    } else {
      missingSkills.push(skill);
      keywordMatches.push({ keyword: skill, status: 'missing' });
    }
  }

  return { keywordMatches, matchedSkills, missingSkills, partialSkills };
}

// ─── AI-powered Job Tailoring ───────────────────────────────────────────────

export async function tailorResumeToJob(
  resumeData: ResumeData,
  jobTitle: string,
  jobDescription: string,
  jobRequiredSkills: string[],
): Promise<string> {
  const allSkills = Object.values(resumeData.skills).flat().filter(Boolean);
  const experienceText = resumeData.experience.map(e =>
    `${e.jobTitle} at ${e.company}: ${e.responsibilities.join('; ')}`
  ).join('\n');
  const projectText = resumeData.projects.map(p =>
    `${p.name}: ${p.description} [${p.technologies.join(', ')}]`
  ).join('\n');

  const prompt = `
${FACTUALITY_RULES}

You are helping tailor a resume summary for a specific job. Based ONLY on the student's verified information below, write a tailored professional summary (3-4 sentences) that emphasizes the most relevant skills and experience for this job.

JOB:
Title: ${jobTitle}
Required Skills: ${jobRequiredSkills.join(', ')}
Description: ${jobDescription.substring(0, 500)}

STUDENT'S VERIFIED INFORMATION:
Target Role: ${resumeData.personal.targetRole}
Skills: ${allSkills.join(', ')}
Experience: ${experienceText || 'None listed'}
Projects: ${projectText || 'None listed'}
Education: ${resumeData.education.map(e => `${e.degree} ${e.fieldOfStudy} from ${e.institution}`).join('; ') || 'Not provided'}

IMPORTANT: Only emphasize skills and experience the student ACTUALLY HAS. Do NOT add skills or experience not listed above.

Return ONLY the tailored summary text, no quotes or labels.
`.trim();

  return callGemini(prompt);
}

// ─── Suggest Skills ─────────────────────────────────────────────────────────

export async function suggestSkills(data: ResumeData): Promise<string[]> {
  const allSkills = Object.values(data.skills).flat().filter(Boolean);
  const projectTech = data.projects.flatMap(p => p.technologies);
  const expTech = data.experience.flatMap(e => e.technologies);

  const prompt = `
${FACTUALITY_RULES}

Based on the student's existing skills, projects, and experience, suggest skills they might have forgotten to add.
ONLY suggest skills that are strongly implied by their existing profile. Do NOT suggest random popular skills.

Existing Skills: ${allSkills.join(', ')}
Project Technologies: ${projectTech.join(', ') || 'None listed'}
Experience Technologies: ${expTech.join(', ') || 'None listed'}
Target Role: ${data.personal.targetRole}

Return a JSON array of skill name strings, max 5 suggestions.
Example: ["Git", "REST API", "Agile"]
Return ONLY the JSON array, nothing else.
`.trim();

  const raw = await callGemini(prompt);
  try {
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

// ─── Document Extraction ────────────────────────────────────────────────────

export async function extractResumeDataFromFile(base64Data: string, mimeType: string): Promise<Partial<ResumeData>> {
  const prompt = `
Extract the resume details from the attached document into a structured JSON format.
The JSON must perfectly match the following TypeScript interface structure:

export interface ResumeData {
  personal: { fullName: string; email: string; phone: string; linkedin: string; github: string; portfolio: string; city: string; state: string; country: string; targetRole: string; };
  summary: string;
  education: Array<{ degree: string; fieldOfStudy: string; institution: string; location: string; startDate: string; endDate: string; gpa: string; relevantCoursework: string; }>;
  skills: { programming: string[]; frameworks: string[]; ai_ml: string[]; generative_ai: string[]; databases: string[]; cloud: string[]; devops: string[]; tools: string[]; web_technologies: string[]; other: string[]; };
  experience: Array<{ jobTitle: string; company: string; location: string; employmentType: string; startDate: string; endDate: string; currentlyWorking: boolean; responsibilities: string[]; achievements: string[]; technologies: string[]; }>;
  projects: Array<{ name: string; role: string; startDate: string; endDate: string; description: string; highlights: string[]; technologies: string[]; githubUrl: string; liveDemoUrl: string; }>;
  certifications: Array<{ name: string; issuingOrganization: string; issueDate: string; expiryDate: string; credentialId: string; credentialUrl: string; }>;
  achievements: Array<{ title: string; organization: string; date: string; description: string; }>;
  languages: Array<{ language: string; proficiency: 'Native' | 'Professional' | 'Conversational' | 'Basic'; }>;
}

Rules:
1. ONLY return valid JSON. Do not include markdown code blocks like \`\`\`json.
2. If a field is not found in the resume, use an empty string for strings, false for booleans, and [] for arrays.
3. For dates, try to format them as YYYY-MM if possible, otherwise keep the original string.
4. Categorize skills appropriately into the provided categories.
5. Extract bullet points accurately into 'responsibilities' and 'achievements'.
  `.trim();

  const raw = await callGeminiWithFile(prompt, base64Data, mimeType);
  try {
    const jsonStr = raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
    return JSON.parse(jsonStr || raw);
  } catch (err) {
    console.error('Failed to parse Gemini extracted JSON:', raw);
    throw new Error('Failed to parse the extracted resume data into structured format.');
  }
}

export function isAIConfigured(): boolean {
  return !!GROQ_API_KEY;
}
