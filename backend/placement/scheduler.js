// Placement tool nightly job (ported from placement_app 04176a4): the
// manual "Fetch Apify" / "Sync ATS" / "Trigger LMS sync" buttons are gone
// from the UI; this runs the three at 2:00 AM IST instead.
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
    const { ApifyScraperService } = require('./services/scraperService');
    const r = await ApifyScraperService.fetchAndIngestJobs(ACTOR, { limit: 50 });
    console.log(`${tag} apify: +${r.newIngested} jobs (${r.duplicatesCount} dupes)`);
  } catch (e) { console.warn(`${tag} apify skipped:`, e.message); }
  try {
    const { AtsJobApiService } = require('./services/atsJobApiService');
    const r = await AtsJobApiService.fetchAndIngestJobs(ACTOR, { limit: 50 });
    console.log(`${tag} ats: +${r.newIngested} jobs (${r.duplicatesCount} dupes)`);
  } catch (e) { console.warn(`${tag} ats skipped:`, e.message); }
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
  console.log(`   ⏰ Placement nightly sync (students + Apify + ATS) at 02:00 IST — next ${nextRun().toISOString()}`);
}

module.exports = { startPlacementScheduler, runNightlySync, nextRun };
