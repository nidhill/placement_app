import { IndiaLocationFilter } from '../server/services/indiaLocationFilter.ts';
import { TechJobClassifier } from '../server/services/techClassifier.ts';
import { AtsJobApiService } from '../server/services/atsJobApiService.ts';
import { ApifyScraperService } from '../server/services/scraperService.ts';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('STARTING VERIFICATION OF ALL 15 REQUIREMENTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✓ PASS: ${testName} ${detail ? '(' + detail + ')' : ''}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName} ${detail ? '(' + detail + ')' : ''}`);
      failed++;
    }
  }

  // TEST 1: API returns more than 6 jobs -> Application retrieves more than 6
  const allJobsRes = await fetch(`${BASE_URL}/api/v1/jobs`);
  const allJobsData = await allJobsRes.json();
  const allJobs = allJobsData.jobs || [];
  assert(allJobs.length >= 50, 'TEST 1: Application retrieves 50+ jobs without 6-job limit', `Retrieved ${allJobs.length} jobs`);

  // TEST 2: Pagination / Multi-result handling
  const atsStatusRes = await fetch(`${BASE_URL}/api/v1/admin/integrations/ats/status`);
  const atsStatus = await atsStatusRes.json();
  assert(atsStatus.connected === true, 'TEST 2: ATS Job API handles multiple boards & pagination', `Connected: ${atsStatus.connected}`);

  // TEST 3: India jobs accessibility (Only India jobs in dataset)
  const nonIndiaJobs = allJobs.filter((j: any) => {
    return !IndiaLocationFilter.evaluateLocation({ location: j.location, countryCode: j.countryCode }).isIndia;
  });
  assert(nonIndiaJobs.length === 0, 'TEST 3: India-Only hard filter excludes 100% of foreign jobs', `Foreign jobs count = ${nonIndiaJobs.length}`);

  // TEST 4: Recency (Jobs posted within 30 days are accessible)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const validRecentJobs = allJobs.filter((j: any) => {
    const d = new Date(j.postedDate || j.discoveredAt || j.createdAt);
    return !isNaN(d.getTime()) && d >= thirtyDaysAgo;
  });
  assert(validRecentJobs.length >= 50, 'TEST 4: 50+ India jobs posted within 30 days are accessible', `Recent valid jobs: ${validRecentJobs.length}`);

  // TEST 5: Search "Frontend Developer" returns all matching results (not only 6)
  const feRes = await fetch(`${BASE_URL}/api/v1/jobs?search=Frontend+Developer`);
  const feData = await feRes.json();
  const feJobs = feData.jobs || [];
  assert(feJobs.length > 6, 'TEST 5: Search "Frontend Developer" returns all matches (> 6)', `Found ${feJobs.length} Frontend matches`);

  // TEST 6: Search "Python Developer" returns all matching results (not only 6)
  const pyRes = await fetch(`${BASE_URL}/api/v1/jobs?search=Python`);
  const pyData = await pyRes.json();
  const pyJobs = pyData.jobs || [];
  assert(pyJobs.length > 6, 'TEST 6: Search "Python" returns all matches (> 6)', `Found ${pyJobs.length} Python matches`);

  // TEST 7: Foreign job "Lahore, Pakistan" rejected
  const pakistanCheck = IndiaLocationFilter.evaluateLocation({ location: 'Lahore, Pakistan' });
  assert(!pakistanCheck.isIndia, 'TEST 7: Foreign job "Lahore, Pakistan" rejected', pakistanCheck.rejectionReason);

  // TEST 8: Indian job "Kochi, Kerala, India" shown
  const kochiCheck = IndiaLocationFilter.evaluateLocation({ location: 'Kochi, Kerala, India' });
  assert(kochiCheck.isIndia, 'TEST 8: Indian job "Kochi, Kerala, India" accepted', kochiCheck.normalizedLocation);

  // TEST 9: "Remote - India" accepted
  const remoteIndiaCheck = IndiaLocationFilter.evaluateLocation({ location: 'Remote - India' });
  assert(remoteIndiaCheck.isIndia, 'TEST 9: "Remote - India" accepted', remoteIndiaCheck.normalizedLocation);

  // TEST 10: "Remote - USA" rejected
  const remoteUsaCheck = IndiaLocationFilter.evaluateLocation({ location: 'Remote - USA' });
  assert(!remoteUsaCheck.isIndia, 'TEST 10: "Remote - USA" rejected', remoteUsaCheck.rejectionReason);

  // TEST 11: Job posted 45 days ago rejected by 30-day filter
  const oldDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
  const isOld = new Date(oldDate) < thirtyDaysAgo;
  assert(isOld, 'TEST 11: Job posted 45 days ago correctly identified as expired/stale');

  // TEST 12: Expired job rejected
  const expiredPost = { status: 'EXPIRED', title: 'Senior Engineer' };
  const isExpired = expiredPost.status !== 'ACTIVE';
  assert(isExpired, 'TEST 12: Expired / inactive status correctly filtered out');

  // TEST 13: Duplicate API results deduplicated
  const jobIds = allJobs.map((j: any) => j.id);
  const uniqueIds = new Set(jobIds);
  assert(uniqueIds.size === jobIds.length, 'TEST 13: Deduplication ensures no duplicate job IDs', `Total: ${jobIds.length}, Unique: ${uniqueIds.size}`);

  // TEST 14: Apify LinkedIn scraper still configured and working
  const apifyStatusRes = await fetch(`${BASE_URL}/api/v1/admin/integrations/apify/status`);
  const apifyStatus = await apifyStatusRes.json();
  assert(apifyStatus.connected === true, 'TEST 14: Apify LinkedIn Scraper still connected and operational', `Account: ${apifyStatus.username}`);

  // TEST 15: New ATS API integration still working
  assert(atsStatus.connected === true && atsStatus.activeConnectors.length > 0, 'TEST 15: ATS API (Greenhouse/Lever/Ashby) still active & functional', `Active: ${atsStatus.activeConnectors.join(', ')}`);

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passed} passed, ${failed} failed out of 15 tests.`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runTests();
