var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var scraperService_exports = {};
__export(scraperService_exports, {
  ApifyJobAdapter: () => ApifyJobAdapter,
  ApifyScraperService: () => ApifyScraperService
});
module.exports = __toCommonJS(scraperService_exports);
var import_store = require('../store');
var import_jobNormalizer = require('./jobNormalizer');
const SKILL_DICTIONARY = [
  // Tech Skills
  { name: "React", category: "TECH" },
  { name: "TypeScript", category: "TECH" },
  { name: "JavaScript", category: "TECH" },
  { name: "Python", category: "TECH" },
  { name: "Node.js", category: "TECH" },
  { name: "Express", category: "TECH" },
  { name: "SQL", category: "TECH" },
  { name: "PostgreSQL", category: "TECH" },
  { name: "HTML5", category: "TECH" },
  { name: "CSS3", category: "TECH" },
  { name: "Tailwind CSS", category: "TECH" },
  { name: "Git", category: "TECH" },
  { name: "REST APIs", category: "TECH" },
  { name: "Docker", category: "TECH" },
  { name: "AWS", category: "TECH" },
  { name: "Java", category: "TECH" },
  { name: "C++", category: "TECH" },
  { name: "Redux", category: "TECH" },
  { name: "Next.js", category: "TECH" },
  { name: "MongoDB", category: "TECH" },
  // Design Skills
  { name: "Figma", category: "DESIGN" },
  { name: "UI/UX", category: "DESIGN" },
  { name: "Design Systems", category: "DESIGN" },
  { name: "Wireframing", category: "DESIGN" },
  { name: "Prototyping", category: "DESIGN" },
  { name: "User Research", category: "DESIGN" },
  { name: "Product Design", category: "DESIGN" },
  // Marketing Skills
  { name: "Google Ads", category: "MARKETING" },
  { name: "Meta Ads", category: "MARKETING" },
  { name: "SEO", category: "MARKETING" },
  { name: "Analytics", category: "MARKETING" },
  { name: "Content Strategy", category: "MARKETING" },
  { name: "Growth Marketing", category: "MARKETING" },
  { name: "Email Marketing", category: "MARKETING" },
  // General / Foundational
  { name: "Communication", category: "GENERAL" },
  { name: "Problem Solving", category: "GENERAL" },
  { name: "Agile", category: "GENERAL" }
];
class ApifyJobAdapter {
  /**
   * Extracts structured skills by scanning job text for recognized keywords.
   */
  static extractSkills(title, description, sector) {
    const combinedText = ` ${title} ${description} ${sector} `.toLowerCase();
    const matchedSkills = /* @__PURE__ */ new Set();
    const categoryCounts = { TECH: 0, DESIGN: 0, MARKETING: 0, GENERAL: 0 };
    for (const item of SKILL_DICTIONARY) {
      const escaped = item.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      if (regex.test(combinedText)) {
        matchedSkills.add(item.name);
        categoryCounts[item.category] += 1;
      }
    }
    let dominantCategory = "GENERAL";
    let maxCount = 0;
    for (const [cat, count] of Object.entries(categoryCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantCategory = cat;
      }
    }
    const skillList = Array.from(matchedSkills);
    if (skillList.length === 0) {
      if (dominantCategory === "TECH" || /developer|software|engineer|web|frontend|backend/i.test(title)) {
        return { skills: ["React", "JavaScript", "Git"], dominantCategory: "TECH" };
      }
      if (dominantCategory === "DESIGN" || /designer|ui|ux/i.test(title)) {
        return { skills: ["Figma", "UI/UX", "Wireframing"], dominantCategory: "DESIGN" };
      }
      if (dominantCategory === "MARKETING" || /marketing|growth|sales/i.test(title)) {
        return { skills: ["Google Ads", "SEO", "Analytics"], dominantCategory: "MARKETING" };
      }
      return { skills: ["Communication", "Problem Solving", "Agile"], dominantCategory: "GENERAL" };
    }
    return { skills: skillList, dominantCategory };
  }
  /**
   * Normalizes raw Apify scraped job item into the application's canonical JobListing schema.
   * Only accepts technology / IT jobs and normalizes designation.
   */
  static normalizeRawJob(rawItem) {
    const res = import_jobNormalizer.JobNormalizer.normalize(rawItem);
    if (!res.valid) {
      return { valid: false, reason: res.reason || "Invalid job item" };
    }
    if (!res.isTechJob || !res.normalized) {
      return { valid: false, reason: res.reason || "Job rejected: non-technical role" };
    }
    return { valid: true, normalized: res.normalized };
  }
}
class ApifyScraperService {
  static getApiToken() {
    return process.env.APIFY_API_TOKEN || null;
  }
  static getConfiguredActorId() {
    return process.env.APIFY_ACTOR_ID || null;
  }
  /**
   * Resolves the target actor and associated dataset from Apify.
   * Handles user ID or actor ID mapping gracefully.
   */
  static async resolveActorAndDataset(token, configuredId) {
    try {
      const actorRes = await fetch(`https://api.apify.com/v2/acts/${configuredId}?token=${token}`);
      if (actorRes.ok) {
        const actorData = await actorRes.json();
        const actorId = actorData.data?.id || configuredId;
        const actorTitle = actorData.data?.title || actorData.data?.name || "LinkedIn Jobs Scraper";
        const lastRunRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs/last?token=${token}`);
        if (lastRunRes.ok) {
          const runData = await lastRunRes.json();
          if (runData.data?.defaultDatasetId) {
            return { actorId, actorTitle, datasetId: runData.data.defaultDatasetId };
          }
        }
      }
    } catch {
    }
    const userActsRes = await fetch(`https://api.apify.com/v2/acts?token=${token}`);
    if (userActsRes.ok) {
      const userActs = await userActsRes.json();
      const items = userActs.data?.items || [];
      if (items.length > 0) {
        const foundActor = items[0];
        const actorId = foundActor.id;
        const actorTitle = foundActor.title || foundActor.name || "LinkedIn Jobs Scraper";
        const lastRunRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs/last?token=${token}`);
        if (lastRunRes.ok) {
          const runData = await lastRunRes.json();
          if (runData.data?.defaultDatasetId) {
            return { actorId, actorTitle, datasetId: runData.data.defaultDatasetId };
          }
        }
      }
    }
    const recentRunsRes = await fetch(`https://api.apify.com/v2/actor-runs?token=${token}&limit=1`);
    if (recentRunsRes.ok) {
      const recentRuns = await recentRunsRes.json();
      const runs = recentRuns.data?.items || [];
      if (runs.length > 0 && runs[0].defaultDatasetId) {
        return {
          actorId: runs[0].actId || configuredId,
          actorTitle: "LinkedIn Jobs Scraper",
          datasetId: runs[0].defaultDatasetId
        };
      }
    }
    throw new Error(`Could not locate a valid run or dataset for Apify actor "${configuredId}".`);
  }
  /**
   * Tests the Apify connection and actor configuration.
   */
  static async testConnection() {
    const token = this.getApiToken();
    const actorId = this.getConfiguredActorId();
    if (!token) {
      return {
        provider: "Apify",
        connected: false,
        actorConfigured: !!actorId,
        error: "APIFY_API_TOKEN is not configured in server environment."
      };
    }
    if (!actorId) {
      return {
        provider: "Apify",
        connected: false,
        actorConfigured: false,
        error: "Apify Actor is not configured."
      };
    }
    try {
      const userRes = await fetch(`https://api.apify.com/v2/users/me?token=${token}`);
      if (!userRes.ok) {
        return {
          provider: "Apify",
          connected: false,
          actorConfigured: true,
          error: `Apify API rejected credentials: HTTP ${userRes.status}`
        };
      }
      const userData = await userRes.json();
      const username = userData.data?.username || "Apify User";
      const resolved = await this.resolveActorAndDataset(token, actorId);
      const config = await import_store.dbStore.getApifyConfig();
      return {
        provider: "Apify",
        connected: true,
        actorConfigured: true,
        actorId: resolved.actorId,
        actorTitle: resolved.actorTitle,
        username,
        lastFetch: config.lastRunTimestamp,
        jobsFetched: config.leadsProcessedTotal
      };
    } catch (err) {
      return {
        provider: "Apify",
        connected: false,
        actorConfigured: true,
        error: err.message || "Unable to connect to Apify API"
      };
    }
  }
  /**
   * Fetches real scraped jobs from Apify, normalizes them, filters duplicates,
   * inserts them into the existing database store, and returns detailed metrics.
   */
  static async fetchAndIngestJobs(actor, options) {
    const token = this.getApiToken();
    const configuredActorId = this.getConfiguredActorId();
    if (!token) {
      throw new Error("APIFY_API_TOKEN is not configured in server environment.");
    }
    let rawItems = [];
    let resolvedActorTitle = "LinkedIn Jobs Scraper";
    let pagesFetched = 0;
    let sourceReport = [];
    // Multi-board run (LinkedIn / Indeed / Glassdoor / Naukri) is the normal
    // path; the single configured actor's last dataset is the fallback for
    // installs that still rely on a manually run actor.
    const { runSources } = require("./apifySources");
    const cfg = await import_store.dbStore.getApifyConfig();
    const boards = Array.isArray(cfg.boards) ? cfg.boards : undefined;
    const useSources = options?.legacy !== true && (boards === undefined || boards.length > 0);
    if (useSources) {
      const run = await runSources(token, { searchTerms: cfg.searchTerms, locations: cfg.locations, boards: cfg.boards, maxPerSource: options?.limit || cfg.maxPerSource, hoursOld: cfg.hoursOld });
      rawItems = run.items;
      sourceReport = run.report;
      resolvedActorTitle = run.report.filter(r => r.ok).map(r => r.label).join(' + ') || 'Apify job boards';
      if (!run.report.some(r => r.ok)) {
        throw new Error('No job board could be fetched: ' + run.report.map(r => `${r.label}: ${r.error}`).join(' | '));
      }
    } else if (!configuredActorId) {
      throw new Error("Apify Actor is not configured.");
    }
    try {
      if (useSources) throw null;   // items already collected above
      const resolved = await this.resolveActorAndDataset(token, configuredActorId);
      resolvedActorTitle = resolved.actorTitle;
      const fetchLimit = options?.limit || 50;
      const safetyMaxItems = 1e3;
      const pageSize = 100;
      let offset = 0;
      let hasMore = true;
      while (hasMore && rawItems.length < fetchLimit && rawItems.length < safetyMaxItems) {
        const remaining = Math.min(pageSize, fetchLimit - rawItems.length, safetyMaxItems - rawItems.length);
        const datasetUrl = `https://api.apify.com/v2/datasets/${resolved.datasetId}/items?token=${token}&limit=${remaining}&offset=${offset}`;
        const datasetRes = await fetch(datasetUrl);
        if (!datasetRes.ok) {
          throw new Error(`Failed to fetch dataset items from Apify: HTTP ${datasetRes.status}`);
        }
        const pageItems = await datasetRes.json();
        pagesFetched += 1;
        if (pageItems.length === 0) {
          hasMore = false;
        } else {
          rawItems.push(...pageItems);
          offset += pageItems.length;
          if (pageItems.length < remaining) {
            hasMore = false;
          }
        }
      }
    } catch (fetchErr) {
      if (fetchErr !== null) throw new Error(`The Apify job scraper could not be reached: ${fetchErr.message}`);
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
    const newJobTitles = [];
    let sampleJob;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
    const existingJobs = await import_store.dbStore.getAllJobs();
    for (const rawItem of rawItems) {
      if (!rawItem || !rawItem.title && !rawItem.positionName) {
        invalidCount += 1;
        continue;
      }
      if (rawItem.status && /expired|closed|inactive|filled/i.test(String(rawItem.status))) {
        continue;
      }
      activeCount += 1;
      const result = import_jobNormalizer.JobNormalizer.normalize(rawItem);
      if (!result.valid) {
        invalidCount += 1;
        continue;
      }
      if (!result.isIndia) {
        foreignJobsRejectedCount += 1;
        continue;
      }
      indiaJobsCount += 1;
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
      const isDuplicate = existingJobs.some((existing) => {
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
      const created = await import_store.dbStore.createJob(normalized, actor);
      existingJobs.unshift(created);
      newJobTitles.push(`${created.title} @ ${created.company}`);
      newIngested += 1;
      if (!sampleJob) {
        sampleJob = created;
      }
    }
    const config = await import_store.dbStore.getApifyConfig();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await import_store.dbStore.updateApifyConfig({
      lastRunTimestamp: now,
      leadsProcessedTotal: config.leadsProcessedTotal + newIngested
    }, actor);
    console.log("----------------------------------------------------");
    console.log("JOB SEARCH");
    console.log(`API RESULTS RECEIVED: ${totalReceived}`);
    console.log(`PAGES FETCHED: ${pagesFetched}`);
    console.log(`INDIA JOBS: ${indiaJobsCount}`);
    console.log(`ACTIVE JOBS: ${activeCount}`);
    console.log(`LAST 30 DAYS: ${recentCount}`);
    console.log(`TECH JOBS: ${techJobsCount}`);
    console.log(`DUPLICATES REMOVED: ${duplicatesCount}`);
    console.log(`FINAL JOBS: ${newIngested}`);
    console.log("----------------------------------------------------");
    await import_store.dbStore.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "APIFY_SCRAPER_RUN",
      entityType: "SCRAPER",
      entityId: "APIFY_ACTOR",
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
      sampleJob,
      sources: sourceReport
    };
  }
  /**
   * Backwards-compatible synchronous mock/cached fallback method if requested by legacy callers.
   */
  static runScraperIngestion(actor) {
    return {
      ingestedCount: 0,
      skippedDuplicatesCount: 0,
      newJobTitles: []
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ApifyJobAdapter,
  ApifyScraperService
});
