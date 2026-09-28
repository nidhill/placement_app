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

export function getDisplayExperience(job: { experienceRequirement?: string, minExperienceYears?: number, description?: string }): string {
  if (job.description) {
    const blockMatch = job.description.match(/\*\*Experience:\*\*\s*([^*]+?)(?=\*\*|\n\n|$)/i);
    if (blockMatch && blockMatch[1].trim().length > 0 && blockMatch[1].trim().length < 40) {
      const exp = blockMatch[1].trim().replace(/\n/g, ' ');
      return exp;
    }
    const match2 = job.description.match(/Experience:\s*([0-9+ -]+\s*(?:years?|yrs?))/i);
    if (match2 && match2[1]) {
      return match2[1].trim();
    }
  }

  if (job.minExperienceYears && job.minExperienceYears > 0) {
    return `${job.minExperienceYears}+ Years`;
  }

  return job.experienceRequirement || '0-1 year (Entry Level)';
}
