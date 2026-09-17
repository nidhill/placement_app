import { dbStore } from '../server/db/store.ts';

function test() {
  dbStore.resetToSeed();
  const allJobs = dbStore.getAllJobs();
  console.log('Total jobs in store after resetToSeed:', allJobs.length);
  
  // Verify all jobs are India
  const nonIndia = allJobs.filter(j => j.countryCode !== 'IN');
  console.log('Non-India jobs count:', nonIndia.length);

  // Verify all jobs are active
  const inactive = allJobs.filter(j => j.status !== 'ACTIVE');
  console.log('Inactive jobs count:', inactive.length);

  // Verify dates within 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const oldJobs = allJobs.filter(j => {
    const d = new Date(j.postedDate || j.createdAt);
    return isNaN(d.getTime()) || d < thirtyDaysAgo;
  });
  console.log('Jobs older than 30 days:', oldJobs.length);

  // Sample search queries
  const frontendJobs = allJobs.filter(j => 
    j.title.toLowerCase().includes('frontend') || 
    (j.normalizedDesignation && j.normalizedDesignation.toLowerCase().includes('frontend'))
  );
  console.log('Frontend developer jobs count:', frontendJobs.length);

  const pythonJobs = allJobs.filter(j => 
    j.title.toLowerCase().includes('python') || 
    j.requiredSkills.some(s => s.toLowerCase().includes('python'))
  );
  console.log('Python jobs count:', pythonJobs.length);

  const dataJobs = allJobs.filter(j => 
    j.title.toLowerCase().includes('data') || 
    (j.normalizedDesignation && j.normalizedDesignation.toLowerCase().includes('data analyst'))
  );
  console.log('Data jobs count:', dataJobs.length);
}

test();
