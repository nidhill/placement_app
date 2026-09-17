import { AtsJobApiService } from '../server/services/atsJobApiService.ts';
import { ApifyScraperService } from '../server/services/scraperService.ts';
import { dbStore } from '../server/db/store.ts';

async function testFetch() {
  const actor = { id: 'user-root-admin', name: 'Root Admin', role: 'MAIN_ADMIN' as const };

  console.log('Testing ATS Job Fetch...');
  try {
    const atsRes = await AtsJobApiService.fetchAndIngestJobs(actor, { limit: 50 });
    console.log('ATS Result:', {
      totalReceived: atsRes.totalReceived,
      indiaJobsCount: atsRes.indiaJobsCount,
      foreignJobsRejectedCount: atsRes.foreignJobsRejectedCount,
      techJobsCount: atsRes.techJobsCount,
      newIngested: atsRes.newIngested,
      duplicatesCount: atsRes.duplicatesCount,
      newJobTitles: atsRes.newJobTitles
    });
  } catch (err: any) {
    console.error('ATS fetch error:', err.message);
  }

  console.log('\nTesting Apify Job Fetch...');
  try {
    const apifyRes = await ApifyScraperService.fetchAndIngestJobs(actor, { limit: 50 });
    console.log('Apify Result:', {
      totalReceived: apifyRes.totalReceived,
      indiaJobsCount: apifyRes.indiaJobsCount,
      foreignJobsRejectedCount: apifyRes.foreignJobsRejectedCount,
      techJobsCount: apifyRes.techJobsCount,
      newIngested: apifyRes.newIngested,
      duplicatesCount: apifyRes.duplicatesCount,
      newJobTitles: apifyRes.newJobTitles
    });
  } catch (err: any) {
    console.error('Apify fetch error:', err.message);
  }

  console.log('\nTotal jobs in store now:', dbStore.getAllJobs().length);
}

testFetch();
