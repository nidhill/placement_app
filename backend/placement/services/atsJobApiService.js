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
var atsJobApiService_exports = {};
__export(atsJobApiService_exports, {
  AtsJobAdapter: () => AtsJobAdapter,
  AtsJobApiService: () => AtsJobApiService
});
module.exports = __toCommonJS(atsJobApiService_exports);
var import_store = require('../store');
var import_jobNormalizer = require('./jobNormalizer');
var import_techClassifier = require('./techClassifier');
var import_designationNormalizer = require('./designationNormalizer');
var import_indiaLocationFilter = require('./indiaLocationFilter');
const DEFAULT_GREENHOUSE_BOARDS = ["postman", "inmobi", "groww", "cloudflare", "stripe", "figma", "github", "reddit"];
const DEFAULT_LEVER_COMPANIES = ["meesho", "cred", "netflix", "spotify", "palantir"];
const DEFAULT_ASHBY_COMPANIES = ["linear", "ramp", "notion", "retool"];

// Greenhouse returns the posting body as HTML-escaped HTML
// ("&lt;h3&gt;&lt;strong&gt;…"); Lever/Ashby sometimes send raw HTML. Store
// readable text so every screen can print the description as-is.
function toPlainText(input) {
  let t = String(input || "");
  for (let i = 0; i < 2 && /&(lt|gt|amp|quot|#39|nbsp);/.test(t); i++) {
    t = t.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
  }
  t = t.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n").replace(/<[^>]+>/g, "");
  return t.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

class AtsJobAdapter {
  /**
   * Transforms a raw ATS item into the canonical HACA JobListing schema.
   */
  static normalizeRawJob(rawItem) {
    if (!rawItem || !rawItem.title || !rawItem.company) {
      return { valid: false, isIndia: false, isTechJob: false, reason: "Missing title or company name" };
    }
    const title = rawItem.title.trim();
    const company = rawItem.company.trim();
    const locationResult = import_indiaLocationFilter.IndiaLocationFilter.evaluateLocation({
      location: rawItem.location,
      rawPayload: rawItem.rawPayload
    });
    if (!locationResult.isIndia) {
      return {
        valid: true,
        isIndia: false,
        isTechJob: false,
        reason: locationResult.rejectionReason || `Filtered foreign location: ${rawItem.location || "Unknown"}`
      };
    }
    const description = toPlainText(rawItem.description || "");
    const location = locationResult.normalizedLocation;
    const classification = import_techClassifier.TechJobClassifier.classify({
      title,
      description,
      company
    });
    if (!classification.isTechJob) {
      return {
        valid: true,
        isIndia: true,
        isTechJob: false,
        reason: `Filtered non-technical role: ${title} (${classification.reason})`
      };
    }
    const normalizedDesignation = import_designationNormalizer.DesignationNormalizer.normalize(title);
    const allSkills = import_jobNormalizer.JobNormalizer.extractSkills(title, description, classification.category);
    const requiredSkills = allSkills.slice(0, 4);
    const preferredSkills = allSkills.length > 4 ? allSkills.slice(4, 7) : ["Git", "Agile"];
    const { requirement: experienceRequirement, minYears: minExperienceYears } = import_jobNormalizer.JobNormalizer.parseExperience(void 0, description);
    let employmentType = "FULL_TIME";
    const typeStr = (rawItem.employmentType || "").toLowerCase();
    if (typeStr.includes("intern")) employmentType = "INTERNSHIP";
    else if (typeStr.includes("contract")) employmentType = "CONTRACT";
    else if (typeStr.includes("part")) employmentType = "PART_TIME";
    const salaryRange = rawItem.salaryText && rawItem.salaryText.trim() ? rawItem.salaryText.trim() : "Competitive / Market Standard";
    const eligibleSchools = ["School of Tech"];
    const eligiblePrograms = [];
    if (classification.category === "Full Stack Development") {
      eligiblePrograms.push("Full Stack Web Development");
    } else if (classification.category === "Frontend Development") {
      eligiblePrograms.push("Full Stack Web Development");
    } else if (classification.category === "Backend Development") {
      eligiblePrograms.push("Python Development", "Full Stack Web Development");
    } else if (classification.category === "Data Analytics") {
      eligiblePrograms.push("Data Analytics");
    } else if (classification.category === "AI / Machine Learning" || classification.category === "Data Engineering") {
      eligiblePrograms.push("Data Analytics", "Python Development");
    } else if (classification.category === "UI/UX / Product Design") {
      eligibleSchools.push("School of Design");
      eligiblePrograms.push("UI/UX Product Design");
    } else {
      eligiblePrograms.push("Full Stack Web Development", "Python Development");
    }
    const externalUrl = rawItem.applyUrl || `https://www.google.com/search?q=${encodeURIComponent(company + " " + title + " careers")}`;
    const applicationUrl = externalUrl;
    const externalJobId = String(rawItem.id);
    const postedDate = rawItem.publishedAt || (/* @__PURE__ */ new Date()).toISOString();
    const scrapedDate = (/* @__PURE__ */ new Date()).toISOString();
    const normalized = {
      title,
      company,
      location,
      countryCode: "IN",
      employmentType,
      experienceRequirement,
      minExperienceYears,
      salaryRange,
      description: description || `Professional ${classification.category} role discovered via ${rawItem.sourceProvider} Public ATS API.`,
      requiredSkills,
      preferredSkills,
      educationRequirements: ["HACA Graduate Certificate or relevant Bachelor Degree"],
      eligibleSchools,
      eligiblePrograms,
      category: classification.category,
      normalizedDesignation,
      sourceChannel: "ATS_JOB_API",
      externalUrl,
      applicationUrl,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString(),
      status: "ACTIVE",
      discoveredAt: postedDate,
      externalJobId,
      source: `ATS Public API (${rawItem.sourceProvider})`,
      sourceUrl: externalUrl,
      postedDate,
      scrapedDate
    };
    return {
      valid: true,
      isIndia: true,
      isTechJob: true,
      normalized
    };
  }
}
class AtsJobApiService {
  static getGreenhouseBoards() {
    const envVal = process.env.ATS_GREENHOUSE_BOARDS;
    if (envVal && envVal.trim()) {
      return envVal.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    }
    return DEFAULT_GREENHOUSE_BOARDS;
  }
  static getLeverCompanies() {
    const envVal = process.env.ATS_LEVER_COMPANIES;
    if (envVal && envVal.trim()) {
      return envVal.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    }
    return DEFAULT_LEVER_COMPANIES;
  }
  static getAshbyCompanies() {
    const envVal = process.env.ATS_ASHBY_COMPANIES;
    if (envVal && envVal.trim()) {
      return envVal.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    }
    return DEFAULT_ASHBY_COMPANIES;
  }
  /**
   * Test connectivity to public ATS endpoints.
   */
  static async testConnection() {
    const activeConnectors = [];
    const ghBoards = this.getGreenhouseBoards();
    const leverCompanies = this.getLeverCompanies();
    const ashbyCompanies = this.getAshbyCompanies();
    let connected = false;
    let error;
    try {
      if (ghBoards.length > 0) {
        const testRes = await fetch(`https://boards-api.greenhouse.io/v1/boards/${ghBoards[0]}/jobs`, { signal: AbortSignal.timeout(5e3) });
        if (testRes.ok) {
          activeConnectors.push("Greenhouse Board API");
          connected = true;
        }
      }
    } catch {
    }
    try {
      if (leverCompanies.length > 0) {
        const testRes = await fetch(`https://api.lever.co/v0/postings/${leverCompanies[0]}?mode=json`, { signal: AbortSignal.timeout(5e3) });
        if (testRes.ok) {
          activeConnectors.push("Lever Postings API");
          connected = true;
        }
      }
    } catch {
    }
    try {
      if (ashbyCompanies.length > 0) {
        const testRes = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${ashbyCompanies[0]}`, { signal: AbortSignal.timeout(5e3) });
        if (testRes.ok) {
          activeConnectors.push("Ashby Job Postings API");
          connected = true;
        }
      }
    } catch {
    }
    if (!connected) {
      error = "Unable to reach public ATS endpoints. Check network connection.";
    }
    const config = await import_store.dbStore.getAtsConfig();
    return {
      provider: "Public ATS API (Greenhouse/Lever/Ashby)",
      connected,
      activeConnectors,
      companiesConfigured: ghBoards.length + leverCompanies.length + ashbyCompanies.length,
      lastFetch: config.lastRunTimestamp,
      jobsFetched: config.leadsProcessedTotal,
      error
    };
  }
  /**
   * Ingests jobs from Greenhouse Public API
   */
  static async fetchGreenhouseJobs(board) {
    const items = [];
    try {
      const url = `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`;
      const res = await fetch(url, { signal: AbortSignal.timeout(1e4) });
      if (!res.ok) return items;
      const data = await res.json();
      const rawJobs = Array.isArray(data.jobs) ? data.jobs : [];
      const companyName = board.charAt(0).toUpperCase() + board.slice(1);
      for (const j of rawJobs) {
        items.push({
          id: `gh-${board}-${j.id}`,
          title: j.title || "",
          company: companyName,
          description: j.content || "",
          location: j.location?.name || "Remote / Hybrid",
          applyUrl: j.absolute_url || `https://boards.greenhouse.io/${board}/jobs/${j.id}`,
          publishedAt: j.updated_at || (/* @__PURE__ */ new Date()).toISOString(),
          sourceProvider: "Greenhouse",
          rawPayload: j
        });
      }
    } catch {
    }
    return items;
  }
  /**
   * Ingests jobs from Lever Public Postings API
   */
  static async fetchLeverJobs(company) {
    const items = [];
    try {
      const url = `https://api.lever.co/v0/postings/${company}?mode=json&limit=100`;
      const res = await fetch(url, { signal: AbortSignal.timeout(1e4) });
      if (!res.ok) return items;
      const data = await res.json();
      const rawJobs = Array.isArray(data) ? data : [];
      const companyName = company.charAt(0).toUpperCase() + company.slice(1);
      for (const j of rawJobs) {
        const postedMs = typeof j.createdAt === "number" ? j.createdAt : Date.now();
        items.push({
          id: `lever-${company}-${j.id}`,
          title: j.text || "",
          company: companyName,
          description: j.descriptionPlain || j.description || "",
          location: j.categories?.location || "Remote / Hybrid",
          applyUrl: j.applyUrl || j.hostedUrl || `https://jobs.lever.co/${company}/${j.id}`,
          publishedAt: new Date(postedMs).toISOString(),
          sourceProvider: "Lever",
          employmentType: j.categories?.commitment || "Full-Time",
          rawPayload: j
        });
      }
    } catch {
    }
    return items;
  }
  /**
   * Ingests jobs from Ashby Public Postings API
   */
  static async fetchAshbyJobs(company) {
    const items = [];
    try {
      const url = `https://api.ashbyhq.com/posting-api/job-board/${company}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(1e4) });
      if (!res.ok) return items;
      const data = await res.json();
      const rawJobs = Array.isArray(data.jobs) ? data.jobs : [];
      const companyName = company.charAt(0).toUpperCase() + company.slice(1);
      for (const j of rawJobs) {
        items.push({
          id: `ashby-${company}-${j.id}`,
          title: j.title || "",
          company: companyName,
          description: j.descriptionPlain || j.descriptionHtml || "",
          location: j.location || (j.isRemote ? "Remote" : "Hybrid"),
          applyUrl: j.applyUrl || `https://jobs.ashbyhq.com/${company}/${j.id}`,
          publishedAt: j.publishedAt || (/* @__PURE__ */ new Date()).toISOString(),
          sourceProvider: "Ashby",
          employmentType: j.employmentType || "Full-Time",
          rawPayload: j
        });
      }
    } catch {
    }
    return items;
  }
  /**
   * Fetches from all configured ATS sources, normalizes, filters by 30-day freshness
   * and tech role, deduplicates, and saves into dbStore.
   */
  static async fetchAndIngestJobs(actor, options) {
    const limit = options?.limit || 50;
    const ghBoards = this.getGreenhouseBoards();
    const leverCompanies = this.getLeverCompanies();
    const ashbyCompanies = this.getAshbyCompanies();
    const rawItems = [];
    const fetchPromises = [];
    for (const b of ghBoards) {
      fetchPromises.push(this.fetchGreenhouseJobs(b));
    }
    for (const c of leverCompanies) {
      fetchPromises.push(this.fetchLeverJobs(c));
    }
    for (const a of ashbyCompanies) {
      fetchPromises.push(this.fetchAshbyJobs(a));
    }
    const results = await Promise.allSettled(fetchPromises);
    for (const r of results) {
      if (r.status === "fulfilled" && Array.isArray(r.value)) {
        rawItems.push(...r.value);
      }
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
    for (const raw of rawItems) {
      if (!raw.title || !raw.company) {
        invalidCount++;
        continue;
      }
      activeCount++;
      const normResult = AtsJobAdapter.normalizeRawJob(raw);
      if (!normResult.valid) {
        invalidCount++;
        continue;
      }
      if (!normResult.isIndia) {
        foreignJobsRejectedCount++;
        continue;
      }
      indiaJobsCount++;
      const postedDate = new Date(raw.publishedAt || Date.now());
      if (isNaN(postedDate.getTime()) || postedDate < thirtyDaysAgo) {
        continue;
      }
      recentCount++;
      if (!normResult.isTechJob || !normResult.normalized) {
        nonTechFilteredCount++;
        continue;
      }
      techJobsCount++;
      const normalized = normResult.normalized;
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
        duplicatesCount++;
        continue;
      }
      if (newIngested >= limit) {
        continue;
      }
      const created = await import_store.dbStore.createJob(normalized, actor);
      existingJobs.unshift(created);
      newJobTitles.push(`${created.title} @ ${created.company}`);
      newIngested++;
      if (!sampleJob) {
        sampleJob = created;
      }
    }
    const atsConfig = await import_store.dbStore.getAtsConfig();
    await import_store.dbStore.updateAtsConfig({
      lastRunTimestamp: (/* @__PURE__ */ new Date()).toISOString(),
      leadsProcessedTotal: atsConfig.leadsProcessedTotal + newIngested
    }, actor);
    console.log("----------------------------------------------------");
    console.log("JOB SEARCH");
    console.log(`API RESULTS RECEIVED: ${totalReceived}`);
    console.log(`PAGES FETCHED: ${ghBoards.length + leverCompanies.length + ashbyCompanies.length}`);
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
      action: "ATS_API_SYNC",
      entityType: "JOB_SOURCE",
      entityId: "ATS_PUBLIC_API",
      details: `ATS Sync: ${totalReceived} received, ${indiaJobsCount} India jobs (${foreignJobsRejectedCount} foreign rejected), ${techJobsCount} tech roles, ${newIngested} newly ingested, ${duplicatesCount} duplicates skipped.`
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
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AtsJobAdapter,
  AtsJobApiService
});
