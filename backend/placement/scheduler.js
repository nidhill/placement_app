// Placement tool nightly job (ported from placement_app 04176a4): the
// manual "Fetch Apify" / "Sync ATS" / "Trigger LMS sync" buttons are gone
// from the UI; this runs the three at 2:00 AM IST instead.
//
// Apify is the exception: it costs money per job, so it runs on the admin's
// own schedule (Job boards to scrape: on/off, every N days, at an hour IST)
// and within their monthly budget — see runScheduledApify below.
const cron = require('node-cron');

const SCHEDULE = '0 2 * * *';
const TZ = 'Asia/Kolkata';
const ACTOR = { id: 'system-scheduler', name: 'Automated Scheduler', role: 'MAIN_ADMIN' };

async function runNightlySync() {
  const tag = '[placement 2AM]';
  console.log(`${tag} starting ${new Date().toISOString()}`);
  try {
    const { syncEligibleStudents } = require('./sync');
    const r = await syncEligibleStudents(ACTOR);
    console.log(`${tag} students: +${r.syncedCount} new, ${r.updatedCount} refreshed, ${r.removedCount} removed`);
  } catch (e) { console.error(`${tag} student sync failed:`, e.message); }
  try {
    const { dbStore } = require('./store');
    const r = await dbStore.expireOldJobs();
    console.log(`${tag} old jobs: ${r.deleted} deleted, ${r.expired} expired (>30 days)`);
  } catch (e) { console.error(`${tag} job cleanup failed:`, e.message); }
  try {
    const { AtsJobApiService } = require('./services/atsJobApiService');
    const r = await AtsJobApiService.fetchAndIngestJobs(ACTOR, { limit: 50 });
    console.log(`${tag} ats: +${r.newIngested} jobs (${r.duplicatesCount} dupes)`);
  } catch (e) { console.warn(`${tag} ats skipped:`, e.message); }
}

const DAY = 24 * 3600e3;
const IST = 5.5 * 3600e3;

// When the admin's schedule next fires, as a UTC instant: the first
// runHourIst:00 IST that is at least everyDays after the last run.
function nextApifyRun(cfg, now = new Date()) {
  const hour = Number.isInteger(cfg.runHourIst) ? cfg.runHourIst : 2;
  const every = Math.max(1, Number(cfg.everyDays) || 1);
  // A failed run counts as a run for scheduling: retry on the next scheduled
  // day, not every hour (a spent quota fails the same way all day).
  const last = Math.max(cfg.lastRunTimestamp ? new Date(cfg.lastRunTimestamp).getTime() : 0, cfg.lastErrorAt ? new Date(cfg.lastErrorAt).getTime() : 0);
  // Two hours' slack, so a run that took a while doesn't push the next one a day.
  const earliest = Math.max(now.getTime(), last ? last + every * DAY - 2 * 3600e3 : 0);
  const ist = new Date(earliest + IST);
  let t = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate(), hour, 0, 0) - IST;
  if (t < earliest) t += DAY;
  return new Date(t);
}

// Hourly: run Apify when the admin's schedule says this hour is due.
async function runScheduledApify() {
  const tag = '[placement apify]';
  try {
    const { dbStore } = require('./store');
    const cfg = await dbStore.getApifyConfig();
    if (cfg.isEnabled === false) return;
    const due = nextApifyRun(cfg, new Date(Date.now() - 5 * 60e3));
    if (due.getTime() > Date.now()) return;
    const { ApifyScraperService } = require('./services/scraperService');
    const r = await ApifyScraperService.fetchAndIngestJobs(ACTOR, {});
    console.log(`${tag} +${r.newIngested} jobs (${r.duplicatesCount} dupes)`);
  } catch (e) {
    console.warn(`${tag} failed:`, e.message);
    try { await require('./store').dbStore.recordApifyFailure(e.message); } catch (_) { /* nothing more to do */ }
  }
}

function nextRun() {
  // Next 02:00 in IST, expressed as a UTC instant.
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 3600e3);
  const target = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate(), 2, 0, 0));
  if (ist.getTime() >= target.getTime()) target.setUTCDate(target.getUTCDate() + 1);
  return new Date(target.getTime() - 5.5 * 3600e3);
}

function startPlacementScheduler() {
  cron.schedule(SCHEDULE, runNightlySync, { timezone: TZ });
  cron.schedule('0 * * * *', runScheduledApify, { timezone: TZ });
  console.log(`   ⏰ Placement nightly sync (students + ATS) at 02:00 IST — next ${nextRun().toISOString()}; Apify on the admin's schedule`);
}

module.exports = { startPlacementScheduler, runNightlySync, runScheduledApify, nextApifyRun, nextRun };
