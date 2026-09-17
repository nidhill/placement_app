import { AtsJobApiService } from '../server/services/atsJobApiService.ts';

async function testWithIndiaBoards() {
  process.env.ATS_GREENHOUSE_BOARDS = 'inmobi,postman,groww,cloudflare,stripe';
  process.env.ATS_LEVER_COMPANIES = 'meesho,cred,netflix';
  
  const actor = { id: 'user-root-admin', name: 'Root Admin', role: 'MAIN_ADMIN' as const };
  const res = await AtsJobApiService.fetchAndIngestJobs(actor, { limit: 50 });
  console.log('Result:', {
    totalReceived: res.totalReceived,
    indiaJobsCount: res.indiaJobsCount,
    foreignJobsRejectedCount: res.foreignJobsRejectedCount,
    techJobsCount: res.techJobsCount,
    nonTechFilteredCount: res.nonTechFilteredCount,
    newIngested: res.newIngested,
    newJobTitles: res.newJobTitles.slice(0, 10)
  });
}
testWithIndiaBoards();
