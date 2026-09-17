import { INITIAL_JOBS } from '../server/db/seedData.ts';
import { dbStore } from '../server/db/store.ts';

dbStore.resetToSeed();
const allJobs = dbStore.getAllJobs();
console.log('INITIAL_JOBS count:', INITIAL_JOBS.length);
console.log('dbStore jobs count:', allJobs.length);

const storeIds = new Set(allJobs.map(j => j.id));
INITIAL_JOBS.forEach(j => {
  if (!storeIds.has(j.id)) {
    console.log('Missing job:', j.id, j.title, j.category);
  }
});
