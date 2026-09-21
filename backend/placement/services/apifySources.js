// Job sourcing through Apify: LinkedIn, Indeed, Glassdoor and Naukri via
// one Store actor (openclawai/job-board-scraper). It is run for the
// configured search terms and locations, the items are normalised to the
// shape jobNormalizer already understands (title / companyName / location /
// description / applyUrl / salary / publishedAt) and tagged with the board
// they came from. Runs use Apify's run-sync endpoint, so one call returns
// the dataset (up to ~4 minutes per run).
const APIFY = 'https://api.apify.com/v2';

// One actor covers all four boards (it also knows zip_recruiter / bayt,
// which we don't use). Limits from its input schema: ≤ 5 search terms per
// run, maxResults is per site (≤ 100), location is one string.
const ACTOR = 'openclawai~job-board-scraper';
const ALL_BOARDS = ['linkedin', 'indeed', 'glassdoor', 'naukri'];
const TERMS_PER_RUN = 5;

const BOARD_LABEL = { linkedin: 'LinkedIn', indeed: 'Indeed', glassdoor: 'Glassdoor', naukri: 'Naukri' };

const DEFAULTS = {
  searchTerms: ['Frontend Developer', 'Full Stack Developer', 'React Developer', 'Python Developer', 'Data Analyst', 'MERN Stack Developer', 'UI UX Designer', 'Graphic Designer', 'Video Editor', 'Motion Graphics', 'Digital Marketing', 'Performance Marketing', 'SEO Specialist', 'Social Media Marketing', 'Content Writer', 'Accountant'],
  locations: ['India'],          // one run per location; 'India' covers every city
  boards: ALL_BOARDS,
  maxPerSource: 100,             // per board, per run (actor max)
  hoursOld: 24,                  // nightly run: only jobs posted since yesterday — fresh listings, no re-paying for old ones
};

function first(...vals) { for (const v of vals) if (v !== undefined && v !== null && String(v).trim() !== '') return v; return undefined; }
const text = v => (v == null ? '' : typeof v === 'string' ? v : Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? (v.name || v.text || v.value || '') : String(v));

// Boards report the posting date in different shapes: ISO dates, epoch
// millis, or relative labels ("3+ weeks ago", "Just now"). Returns an ISO
// string, or undefined when the value cannot be read — never "now", so a
// job is not shown as freshly posted just because we scraped it today.
const UNIT_MS = { minute: 60e3, hour: 3600e3, day: 86400e3, week: 7 * 86400e3, month: 30 * 86400e3 };
function parsePostedDate(v) {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v === 'number') { const d = new Date(v < 1e12 ? v * 1000 : v); return isNaN(d) ? undefined : d.toISOString(); }
  const s = String(v).trim();
  if (/^(just now|today|few (hours|minutes) ago)$/i.test(s)) return new Date().toISOString();
  if (/^yesterday$/i.test(s)) return new Date(Date.now() - UNIT_MS.day).toISOString();
  const rel = s.match(/(\d+)\+?\s*(minute|hour|day|week|month)s?\s*ago/i);
  if (rel) return new Date(Date.now() - Number(rel[1]) * UNIT_MS[rel[2].toLowerCase()]).toISOString();
  const d = new Date(s);
  return isNaN(d) ? undefined : d.toISOString();
}

// Naukri never returns a posting date, but its job ids are DDMMYY followed
// by six digits (nk-120526502914 → 12 May 2026, also the tail of the job
// URL), so the date the listing went up can be read from the id.
function naukriPostedDate(item) {
  const src = String(first(item.id, item.job_url, item.jobUrl, item.url) || '');
  const m = src.match(/(\d{2})(\d{2})(\d{2})\d{6}$/);
  if (!m) return undefined;
  const [day, month, year] = [Number(m[1]), Number(m[2]), 2000 + Number(m[3])];
  if (day < 1 || day > 31 || month < 1 || month > 12) return undefined;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (isNaN(d) || d.getTime() > Date.now() + UNIT_MS.day || year < 2015) return undefined;
  return d.toISOString();
}

// Actor outputs differ per board; fold them into the aliases the
// normaliser reads. Anything unknown is kept on `raw` for debugging.
function normalizeItem(board, item) {
  const company = text(first(item.company, item.companyName, item.company_name, item.employer, item.hiringOrganization?.name, item.companyInfo?.name));
  const location = text(first(item.location, item.jobLocation, item.city, item.formattedLocation, item.placeFormatted, Array.isArray(item.locations) ? item.locations[0] : undefined));
  const url = first(item.job_url_direct, item.jobUrlDirect, item.applyUrl, item.apply_url, item.applyLink, item.job_url, item.jobUrl, item.url, item.link, item.jdURL);
  let posted = parsePostedDate(first(item.date_posted, item.datePosted, item.postedAt, item.publishedAt, item.postedDate, item.createdDate, item.footerPlaceholderLabel));
  if (!posted && board === 'naukri') posted = naukriPostedDate(item);
  const salary = first(item.salary, item.salaryText, item.salary_range, item.compensation, (item.min_amount || item.max_amount) ? `${item.currency || '₹'}${item.min_amount || ''}${item.max_amount ? ' - ' + item.max_amount : ''} / ${item.interval || 'yr'}` : undefined);
  return {
    id: first(item.id, item.jobId, item.job_id, item.jobKey, url),
    title: text(first(item.title, item.jobTitle, item.job_title, item.positionName)),
    companyName: company,
    location: location || 'India',
    country: 'India', countryCode: 'IN',
    description: text(first(item.description, item.descriptionText, item.job_description, item.jobDescription, item.snippet)),
    applyUrl: url, jobUrl: url,
    salary: salary ? text(salary) : undefined,
    publishedAt: posted,
    contractType: text(first(item.job_type, item.jobType, item.employmentType, item.contractType)),
    experience: text(first(item.experience, item.experienceText, item.experienceLevel)),
    sourceBoard: BOARD_LABEL[board] || board,
    sourceChannelBoard: board,
  };
}

async function runActorSync(token, actorId, input, { timeoutSecs = 240, maxItems = 300 } = {}) {
  const url = `${APIFY}/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=${timeoutSecs}&limit=${maxItems}&format=json&clean=true`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Apify ${actorId} → HTTP ${res.status}${body ? ': ' + body.slice(0, 200) : ''}`);
  }
  const items = await res.json();
  return Array.isArray(items) ? items : [];
}

// Runs the actor for every (location × chunk of ≤5 search terms) and returns
// normalised items plus a per-run report. One failing run never blocks the rest.
async function runSources(token, config = {}) {
  const cfg = { ...DEFAULTS, ...config };
  cfg.searchTerms = (cfg.searchTerms || []).map(s => String(s).trim()).filter(Boolean);
  cfg.locations = (cfg.locations || []).map(s => String(s).trim()).filter(Boolean);
  if (!cfg.locations.length) cfg.locations = ['India'];
  cfg.boards = (cfg.boards || []).map(s => String(s).toLowerCase()).filter(b => ALL_BOARDS.includes(b));
  cfg.maxPerSource = Math.min(100, Math.max(1, Number(cfg.maxPerSource) || 50));
  const items = []; const report = [];
  if (!cfg.boards.length || !cfg.searchTerms.length) return { items, report, config: cfg };
  const chunks = []; for (let i = 0; i < cfg.searchTerms.length; i += TERMS_PER_RUN) chunks.push(cfg.searchTerms.slice(i, i + TERMS_PER_RUN));
  for (const location of cfg.locations) {
    for (const terms of chunks) {
      const started = Date.now();
      const label = `${cfg.boards.map(b => BOARD_LABEL[b]).join(' · ')} — ${location} — ${terms.join(', ')}`;
      try {
        const raw = await runActorSync(token, ACTOR, {
          searchTerms: terms, location, sites: cfg.boards, maxResults: cfg.maxPerSource,
          countryIndeed: 'india', hoursOld: cfg.hoursOld, linkedinFetchDescription: true,
        }, { maxItems: cfg.maxPerSource * cfg.boards.length });
        const all = raw.map(it => normalizeItem(String(it.site || it.source || it.jobBoard || '').toLowerCase(), it)).filter(it => it.title && it.companyName);
        // Naukri ignores hoursOld and returns by relevance, so listings that
        // went up months ago come back; anything older than the 30-day
        // window is dropped here rather than shown as fresh.
        const cutoff = Date.now() - 30 * 86400e3;
        const norm = all.filter(it => !it.publishedAt || new Date(it.publishedAt).getTime() >= cutoff);
        const perBoard = {}; norm.forEach(n => { perBoard[n.sourceBoard] = (perBoard[n.sourceBoard] || 0) + 1; });
        items.push(...norm);
        report.push({ source: 'jobboards', label, actor: ACTOR, ok: true, received: raw.length, usable: norm.length, stale: all.length - norm.length, perBoard, ms: Date.now() - started });
      } catch (e) {
        report.push({ source: 'jobboards', label, actor: ACTOR, ok: false, error: e.message, ms: Date.now() - started });
      }
    }
  }
  return { items, report, config: cfg };
}

module.exports = { ACTOR, ALL_BOARDS, DEFAULTS, BOARD_LABEL, runSources, normalizeItem, runActorSync, parsePostedDate, naukriPostedDate };
