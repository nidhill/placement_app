import { JobListing, ApifyFetchResult, ApifyConnectionStatus } from '../../src/types.ts';
import { dbStore } from '../db/store.ts';
import { JobNormalizer } from './jobNormalizer.ts';

// Comprehensive dictionary for structured skill recognition from raw scraper text
const SKILL_DICTIONARY: { name: string; category: 'TECH' | 'DESIGN' | 'MARKETING' | 'GENERAL' }[] = [
  // Tech Skills
  { name: 'React', category: 'TECH' },
  { name: 'TypeScript', category: 'TECH' },
  { name: 'JavaScript', category: 'TECH' },
  { name: 'Python', category: 'TECH' },
  { name: 'Node.js', category: 'TECH' },
  { name: 'Express', category: 'TECH' },
  { name: 'SQL', category: 'TECH' },
  { name: 'PostgreSQL', category: 'TECH' },
  { name: 'HTML5', category: 'TECH' },
  { name: 'CSS3', category: 'TECH' },
  { name: 'Tailwind CSS', category: 'TECH' },
  { name: 'Git', category: 'TECH' },
  { name: 'REST APIs', category: 'TECH' },
  { name: 'Docker', category: 'TECH' },
  { name: 'AWS', category: 'TECH' },
  { name: 'Java', category: 'TECH' },
  { name: 'C++', category: 'TECH' },
  { name: 'Redux', category: 'TECH' },
  { name: 'Next.js', category: 'TECH' },
  { name: 'MongoDB', category: 'TECH' },
  // Design Skills
  { name: 'Figma', category: 'DESIGN' },
  { name: 'UI/UX', category: 'DESIGN' },
  { name: 'Design Systems', category: 'DESIGN' },
  { name: 'Wireframing', category: 'DESIGN' },
  { name: 'Prototyping', category: 'DESIGN' },
  { name: 'User Research', category: 'DESIGN' },
  { name: 'Product Design', category: 'DESIGN' },
  // Marketing Skills
  { name: 'Google Ads', category: 'MARKETING' },
  { name: 'Meta Ads', category: 'MARKETING' },
  { name: 'SEO', category: 'MARKETING' },
  { name: 'Analytics', category: 'MARKETING' },
  { name: 'Content Strategy', category: 'MARKETING' },
  { name: 'Growth Marketing', category: 'MARKETING' },
  { name: 'Email Marketing', category: 'MARKETING' },
  // General / Foundational
  { name: 'Communication', category: 'GENERAL' },
  { name: 'Problem Solving', category: 'GENERAL' },
  { name: 'Agile', category: 'GENERAL' }
];

export class ApifyJobAdapter {
  /**
   * Extracts structured skills by scanning job text for recognized keywords.
   */
  public static extractSkills(title: string, description: string, sector: string): {
    skills: string[];
    dominantCategory: 'TECH' | 'DESIGN' | 'MARKETING' | 'GENERAL';
  } {
    const combinedText = ` ${title} ${description} ${sector} `.toLowerCase();
    const matchedSkills = new Set<string>();
    const categoryCounts = { TECH: 0, DESIGN: 0, MARKETING: 0, GENERAL: 0 };

    for (const item of SKILL_DICTIONARY) {
      // Escape for regex matching on word boundaries
      const escaped = item.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(combinedText)) {
        matchedSkills.add(item.name);
        categoryCounts[item.category] += 1;
      }
    }

    let dominantCategory: 'TECH' | 'DESIGN' | 'MARKETING' | 'GENERAL' = 'GENERAL';
    let maxCount = 0;
    for (const [cat, count] of Object.entries(categoryCounts) as [('TECH' | 'DESIGN' | 'MARKETING' | 'GENERAL'), number][]) {
      if (count > maxCount) {
        maxCount = count;
        dominantCategory = cat;
      }
    }

    // Default fallback skills if none explicitly matched
    const skillList = Array.from(matchedSkills);
    if (skillList.length === 0) {
      if (dominantCategory === 'TECH' || /developer|software|engineer|web|frontend|backend/i.test(title)) {
        return { skills: ['React', 'JavaScript', 'Git'], dominantCategory: 'TECH' };
      }
      if (dominantCategory === 'DESIGN' || /designer|ui|ux/i.test(title)) {
        return { skills: ['Figma', 'UI/UX', 'Wireframing'], dominantCategory: 'DESIGN' };
      }
      if (dominantCategory === 'MARKETING' || /marketing|growth|sales/i.test(title)) {
        return { skills: ['Google Ads', 'SEO', 'Analytics'], dominantCategory: 'MARKETING' };
      }
      return { skills: ['Communication', 'Problem Solving', 'Agile'], dominantCategory: 'GENERAL' };
    }

    return { skills: skillList, dominantCategory };
  }

  /**
   * Normalizes raw Apify scraped job item into the application's canonical JobListing schema.
   * Only accepts technology / IT jobs and normalizes designation.
   */
  public static normalizeRawJob(rawItem: any): { valid: boolean; normalized?: Omit<JobListing, 'id' | 'jobCode' | 'createdAt' | 'updatedAt'>; reason?: string } {
    const res = JobNormalizer.normalize(rawItem);
    if (!res.valid) {
      return { valid: false, reason: res.reason || 'Invalid job item' };
    }
    if (!res.isTechJob || !res.normalized) {
      return { valid: false, reason: res.reason || 'Job rejected: non-technical role' };
    }
    return { valid: true, normalized: res.normalized };
  }
}

/**
 * Apify Job Scraper Service
 * Interacts with Apify REST API using APIFY_API_TOKEN and APIFY_ACTOR_ID from environment.
 * NEVER exposes secrets to client or logs.
 */
export class ApifyScraperService {
  private static getApiToken(): string | null {
    return process.env.APIFY_API_TOKEN || null;
  }

  private static getConfiguredActorId(): string | null {
    return process.env.APIFY_ACTOR_ID || null;
  }

  /**
   * Resolves the target actor and associated dataset from Apify.
   * Handles user ID or actor ID mapping gracefully.
   */
  public static async resolveActorAndDataset(token: string, configuredId: string): Promise<{
    actorId: string;
    actorTitle: string;
    datasetId: string;
  }> {
    // 1. First test if configuredId is directly an actor
    try {
      const actorRes = await fetch(`https://api.apify.com/v2/acts/${configuredId}?token=${token}`);
      if (actorRes.ok) {
        const actorData = await actorRes.json();
        const actorId = actorData.data?.id || configuredId;
        const actorTitle = actorData.data?.title || actorData.data?.name || 'LinkedIn Jobs Scraper';

        // Get last run dataset
        const lastRunRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs/last?token=${token}`);
        if (lastRunRes.ok) {
          const runData = await lastRunRes.json();
          if (runData.data?.defaultDatasetId) {
            return { actorId, actorTitle, datasetId: runData.data.defaultDatasetId };
          }
        }
      }
    } catch {
      // Continue to fallback resolution
    }

    // 2. If configuredId is a user ID or not found as direct actor, query user's actors
    const userActsRes = await fetch(`https://api.apify.com/v2/acts?token=${token}`);
    if (userActsRes.ok) {
      const userActs = await userActsRes.json();
      const items = userActs.data?.items || [];
      if (items.length > 0) {
        const foundActor = items[0];
        const actorId = foundActor.id;
        const actorTitle = foundActor.title || foundActor.name || 'LinkedIn Jobs Scraper';

        const lastRunRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs/last?token=${token}`);
        if (lastRunRes.ok) {
          const runData = await lastRunRes.json();
          if (runData.data?.defaultDatasetId) {
            return { actorId, actorTitle, datasetId: runData.data.defaultDatasetId };
          }
        }
      }
    }

    // 3. Fallback to recent runs
    const recentRunsRes = await fetch(`https://api.apify.com/v2/actor-runs?token=${token}&limit=1`);
    if (recentRunsRes.ok) {
      const recentRuns = await recentRunsRes.json();
      const runs = recentRuns.data?.items || [];
      if (runs.length > 0 && runs[0].defaultDatasetId) {
        return {
          actorId: runs[0].actId || configuredId,
          actorTitle: 'LinkedIn Jobs Scraper',
          datasetId: runs[0].defaultDatasetId
        };
      }
    }

    throw new Error(`Could not locate a valid run or dataset for Apify actor "${configuredId}".`);
  }

  /**
   * Tests the Apify connection and actor configuration.
   */
  public static async testConnection(): Promise<ApifyConnectionStatus> {
    const token = this.getApiToken();
    const actorId = this.getConfiguredActorId();

    if (!token) {
      return {
        provider: 'Apify',
        connected: false,
        actorConfigured: !!actorId,
        error: 'APIFY_API_TOKEN is not configured in server environment.'
      };
    }

    if (!actorId) {
      return {
        provider: 'Apify',
        connected: false,
        actorConfigured: false,
        error: 'Apify Actor is not configured.'
      };
    }

    try {
      // Verify token via users/me
      const userRes = await fetch(`https://api.apify.com/v2/users/me?token=${token}`);
      if (!userRes.ok) {
        return {
          provider: 'Apify',
          connected: false,
          actorConfigured: true,
          error: `Apify API rejected credentials: HTTP ${userRes.status}`
        };
      }

      const userData = await userRes.json();
      const username = userData.data?.username || 'Apify User';

      // Verify actor and dataset
      const resolved = await this.resolveActorAndDataset(token, actorId);

      const config = dbStore.getApifyConfig();

      return {
        provider: 'Apify',
        connected: true,
        actorConfigured: true,
        actorId: resolved.actorId,
        actorTitle: resolved.actorTitle,
        username,
        lastFetch: config.lastRunTimestamp,
        jobsFetched: config.leadsProcessedTotal
      };
    } catch (err: any) {
      return {
        provider: 'Apify',
        connected: false,
        actorConfigured: true,
        error: err.message || 'Unable to connect to Apify API'
      };
    }
  }

  /**
   * Fetches real scraped jobs from Apify, normalizes them, filters duplicates,
   * inserts them into the existing database store, and returns detailed metrics.
   */
  public static async fetchAndIngestJobs(
    actor: { id: string; name: string; role: any },
    options?: { limit?: number }
  ): Promise<ApifyFetchResult> {
    const token = this.getApiToken();
    const configuredActorId = this.getConfiguredActorId();

    if (!token) {
      throw new Error('APIFY_API_TOKEN is not configured in server environment.');
    }

    if (!configuredActorId) {
      throw new Error('Apify Actor is not configured.');
    }

    let rawItems: any[] = [];
    let resolvedActorTitle = 'LinkedIn Jobs Scraper';
    let pagesFetched = 0;

    try {
      const resolved = await this.resolveActorAndDataset(token, configuredActorId);
      resolvedActorTitle = resolved.actorTitle;

      const fetchLimit = options?.limit || 50;
      const safetyMaxItems = 1000;
      const pageSize = 100;
      let offset = 0;
      let hasMore = true;

      // Paginate through the Apify dataset to collect all items up to limit/cap
      while (hasMore && rawItems.length < fetchLimit && rawItems.length < safetyMaxItems) {
        const remaining = Math.min(pageSize, fetchLimit - rawItems.length, safetyMaxItems - rawItems.length);
        const datasetUrl = `https://api.apify.com/v2/datasets/${resolved.datasetId}/items?token=${token}&limit=${remaining}&offset=${offset}`;
        const datasetRes = await fetch(datasetUrl);

        if (!datasetRes.ok) {
          throw new Error(`Failed to fetch dataset items from Apify: HTTP ${datasetRes.status}`);
        }

        const pageItems: any[] = await datasetRes.json();
        pagesFetched += 1;
        if (pageItems.length === 0) {
          hasMore = false;
        } else {
          rawItems.push(...pageItems);
          offset += pageItems.length;
          // If we got fewer items than requested, we've reached the end
          if (pageItems.length < remaining) {
            hasMore = false;
          }
        }
      }
    } catch (fetchErr: any) {
      throw new Error(`The Apify job scraper could not be reached: ${fetchErr.message}`);
    }

    const totalReceived = rawItems.length;
    let activeCount = 0;
    let recentCount = 0;
    let indiaJobsCount = 0;
    let foreignJobsRejectedCount = 0;
    let techJobsCount = 0;
    let nonTechFilteredCount = 0;
    let duplicatesCount = 0;
    let invalidCount = 0;
    let newIngested = 0;
    const newJobTitles: string[] = [];
    let sampleJob: Partial<JobListing> | undefined;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const existingJobs = dbStore.getAllJobs();

    for (const rawItem of rawItems) {
      // 1. Basic validation
      if (!rawItem || (!rawItem.title && !rawItem.positionName)) {
        invalidCount += 1;
        continue;
      }

      // Active status check
      if (rawItem.status && /expired|closed|inactive|filled/i.test(String(rawItem.status))) {
        continue;
      }
      activeCount += 1;

      // 2. Normalization & India-Only Location Filter
      const result = JobNormalizer.normalize(rawItem);

      if (!result.valid) {
        invalidCount += 1;
        continue;
      }

      if (!result.isIndia) {
        foreignJobsRejectedCount += 1;
        continue;
      }

      indiaJobsCount += 1;

      // 3. 30-day dynamic freshness filter
      const rawDate = rawItem.postedDate || rawItem.postedAt || rawItem.publishedAt || rawItem.createdAt;
      if (rawDate) {
        const postedDate = new Date(rawDate);
        if (!isNaN(postedDate.getTime()) && postedDate < thirtyDaysAgo) {
          continue;
        }
      }
      recentCount += 1;

      if (!result.isTechJob || !result.normalized) {
        nonTechFilteredCount += 1;
        continue;
      }

      techJobsCount += 1;
      const normalized = result.normalized;

      // Strict Duplicate Detection:
      // 1. External Job ID if present
      // 2. Safe composite: Company + Title + (Location or URL)
      const isDuplicate = existingJobs.some(existing => {
        if (normalized.externalJobId && existing.externalJobId) {
          if (existing.externalJobId === normalized.externalJobId) return true;
        }
        const sameCompany = existing.company.toLowerCase().trim() === normalized.company.toLowerCase().trim();
        const sameTitle = existing.title.toLowerCase().trim() === normalized.title.toLowerCase().trim();
        const sameLocation = existing.location.toLowerCase().trim() === normalized.location.toLowerCase().trim();
        const sameUrl = Boolean(normalized.externalUrl && existing.externalUrl && normalized.externalUrl === existing.externalUrl);

        return sameCompany && sameTitle && (sameLocation || sameUrl);
      });

      if (isDuplicate) {
        duplicatesCount += 1;
        continue;
      }

      // Insert new real job into existing database store
      const created = dbStore.createJob(normalized, actor);
      existingJobs.unshift(created); // Add to local cache for intra-batch deduplication
      newJobTitles.push(`${created.title} @ ${created.company}`);
      newIngested += 1;

      if (!sampleJob) {
        sampleJob = created;
      }
    }

    // Update Apify Scraper statistics
    const config = dbStore.getApifyConfig();
    const now = new Date().toISOString();
    dbStore.updateApifyConfig({
      lastRunTimestamp: now,
      leadsProcessedTotal: config.leadsProcessedTotal + newIngested
    }, actor);

    console.log('----------------------------------------------------');
    console.log('JOB SEARCH');
    console.log(`API RESULTS RECEIVED: ${totalReceived}`);
    console.log(`PAGES FETCHED: ${pagesFetched}`);
    console.log(`INDIA JOBS: ${indiaJobsCount}`);
    console.log(`ACTIVE JOBS: ${activeCount}`);
    console.log(`LAST 30 DAYS: ${recentCount}`);
    console.log(`TECH JOBS: ${techJobsCount}`);
    console.log(`DUPLICATES REMOVED: ${duplicatesCount}`);
    console.log(`FINAL JOBS: ${newIngested}`);
    console.log('----------------------------------------------------');

    dbStore.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'APIFY_SCRAPER_RUN',
      entityType: 'SCRAPER',
      entityId: 'APIFY_ACTOR',
      details: `Apify Scraper (${resolvedActorTitle}): ${totalReceived} received, ${indiaJobsCount} India jobs (${foreignJobsRejectedCount} foreign rejected), ${techJobsCount} tech jobs, ${newIngested} new ingested, ${duplicatesCount} duplicates skipped.`
    });

    return {
      totalReceived,
      indiaJobsCount,
      foreignJobsRejectedCount,
      techJobsCount,
      nonTechFilteredCount,
      newIngested,
      duplicatesCount,
      invalidCount,
      newJobTitles,
      sampleJob
    };
  }

  /**
   * Backwards-compatible synchronous mock/cached fallback method if requested by legacy callers.
   */
  public static runScraperIngestion(actor: { id: string; name: string; role: any }): {
    ingestedCount: number;
    skippedDuplicatesCount: number;
    newJobTitles: string[];
  } {
    // Synchronous placeholder if called directly without async
    return {
      ingestedCount: 0,
      skippedDuplicatesCount: 0,
      newJobTitles: []
    };
  }
}
