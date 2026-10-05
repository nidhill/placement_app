// Job descriptions arrive from several ATS feeds; older rows still hold
// HTML-escaped HTML. Print them as readable text everywhere.
export function plainText(input?: string | null): string {
  let t = String(input || '');
  for (let i = 0; i < 2 && /&(lt|gt|amp|quot|#39|nbsp);/.test(t); i++) {
    t = t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
  }
  t = t.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n').replace(/<[^>]+>/g, '');
  return t.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// A usable application link, or undefined (older rows carry a fabricated
// web-search URL that we no longer send students to).
export function applyLink(job?: { applicationUrl?: string; externalUrl?: string; sourceUrl?: string } | null): string | undefined {
  if (!job) return undefined;
  const real = (u?: string) => (
    u && 
    !/google\.com\/search/i.test(u) && 
    !/haca\.internal|direct-drive|internal-drive/i.test(u) 
      ? u 
      : undefined
  );
  return real(job.applicationUrl) || real(job.externalUrl) || real(job.sourceUrl);
}

export function extractAccurateExperience(job?: {
  title?: string;
  experienceRequirement?: string;
  minExperienceYears?: number | null;
  description?: string;
} | null): { requirement: string; minYears: number | null; isExplicit: boolean } {
  if (!job) return { requirement: 'Not specified', minYears: null, isExplicit: false };

  const desc = plainText(job.description || '');
  const title = (job.title || '').trim();
  const titleLower = title.toLowerCase();
  const descLower = desc.toLowerCase();

  // 1. Explicit Markdown or Section Header in Description (e.g. **Experience:** 2-4 Years or Experience: 3+ yrs)
  const headerMatch = desc.match(/\*\*(?:Experience|Work Experience|Experience Required):\*\*\s*([^*\n]+?)(?=\*\*|\n|$)/i) ||
                      desc.match(/(?:^|\n)(?:Experience|Work Experience|Experience Required)\s*[:\-–]\s*([^\n\r]+)/i);
  if (headerMatch && headerMatch[1]) {
    const val = headerMatch[1].trim();
    if (val.length > 0 && val.length < 50 && !/^(0[\s-]?1|entry|fresher)/i.test(val)) {
      const numRange = val.match(/(\d+)\s*(?:-|–|to)\s*(\d+)/);
      if (numRange) {
        return { requirement: `${numRange[1]}–${numRange[2]} Years`, minYears: parseInt(numRange[1], 10), isExplicit: true };
      }
      const plusM = val.match(/(\d+)\s*\+/);
      if (plusM) {
        return { requirement: `${plusM[1]}+ Years`, minYears: parseInt(plusM[1], 10), isExplicit: true };
      }
      return { requirement: val, minYears: null, isExplicit: true };
    }
  }

  // 2. High-precision numeric experience ranges in description (e.g., "2-4 years", "2 to 3 years", "3-5 years of experience")
  const rangeMatch = descLower.match(/\b(\d+)\s*(?:-|–|to)\s*(\d+)\s*(?:years?|yrs?)(?:\s+(?:of\s+)?(?:relevant\s+|work\s+|professional\s+|industry\s+|software\s+)?experience)?\b/i);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    if (min < 25 && max < 30 && min <= max) {
      if (min === 0 && max <= 1) {
        return { requirement: '0–1 Year (Entry Level)', minYears: 0, isExplicit: true };
      }
      return { requirement: `${min}–${max} Years`, minYears: min, isExplicit: true };
    }
  }

  // 3. Minimum or "X+ years" in description (e.g. "minimum 2 years", "at least 3 years", "3+ years of experience")
  const plusMatch = descLower.match(/\b(?:minimum|min|at\s+least)\s+(\d+)\+?\s*(?:years?|yrs?)\b/i) ||
                    descLower.match(/\b(\d+)\+\s*(?:years?|yrs?)(?:\s+(?:of\s+)?(?:relevant\s+|work\s+|professional\s+|industry\s+|software\s+)?experience)?\b/i) ||
                    descLower.match(/\b(\d+)\s*(?:years?|yrs?)\s+of\s+(?:relevant\s+|work\s+|professional\s+|industry\s+|software\s+)?experience\b/i);
  if (plusMatch) {
    const yrs = parseInt(plusMatch[1], 10);
    if (yrs > 0 && yrs < 25) {
      return { requirement: `${yrs}+ Years`, minYears: yrs, isExplicit: true };
    }
  }

  // 4. Role Seniority in Title
  if (/\b(principal|staff|lead|architect|head|director|vp)\b/i.test(titleLower)) {
    return { requirement: '5–8+ Years (Lead / Staff)', minYears: 5, isExplicit: false };
  }
  if (/\b(senior|sr\.?)\b/i.test(titleLower)) {
    return { requirement: '3–5+ Years (Senior)', minYears: 3, isExplicit: false };
  }
  if (/\b(mid[- ]?level|intermediate)\b/i.test(titleLower)) {
    return { requirement: '2–4 Years (Mid-Level)', minYears: 2, isExplicit: false };
  }
  if (/\b(junior|jr\.?|associate)\b/i.test(titleLower)) {
    return { requirement: '1–2 Years (Junior / Associate)', minYears: 1, isExplicit: false };
  }
  if (/\b(intern|internship|trainee)\b/i.test(titleLower)) {
    return { requirement: 'Internship / Trainee', minYears: 0, isExplicit: true };
  }
  if (/\b(fresher|fresh graduate|entry[- ]level|campus)\b/i.test(titleLower)) {
    return { requirement: '0–1 Year (Entry Level)', minYears: 0, isExplicit: true };
  }

  // 5. Existing stored requirement — check if it's genuinely valid, NOT the legacy fake "0-1 year (Entry Level)"
  const stored = (job.experienceRequirement || '').trim();
  const isLegacyFakeDefault = /^(0[\s-–]?1\s*year\s*(\/|\()?entry\s*level\)?|0-1\s*years?)$/i.test(stored);

  if (stored && !isLegacyFakeDefault) {
    return { requirement: stored, minYears: job.minExperienceYears || null, isExplicit: true };
  }

  // If stored was "0-1 year (Entry Level)" but neither title nor description has any fresher keywords,
  // it was a legacy scraper hallucination. Don't show it!
  const hasFresherKeywords = /\b(fresher|entry[- ]level|fresh graduate|intern|internship|trainee)\b/i.test(descLower);
  if (isLegacyFakeDefault && hasFresherKeywords) {
    return { requirement: '0–1 Year (Entry Level)', minYears: 0, isExplicit: true };
  }

  if (job.minExperienceYears && job.minExperienceYears > 0) {
    return { requirement: `${job.minExperienceYears}+ Years`, minYears: job.minExperienceYears, isExplicit: true };
  }

  // 6. Genuine fallback when unspecified: NEVER fake 0-1 year!
  return { requirement: 'Check Job Portal (Not Specified)', minYears: null, isExplicit: false };
}

export function getDisplayExperience(job?: {
  title?: string;
  experienceRequirement?: string;
  minExperienceYears?: number | null;
  description?: string;
} | null): string {
  return extractAccurateExperience(job).requirement;
}

