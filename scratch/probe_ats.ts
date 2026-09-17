async function probe() {
  const candidates = [
    'razorpay', 'swiggy', 'meesho', 'browserstack', 'clevertap', 'postman', 
    'inmobi', 'zeta', 'hasura', 'juspay', 'cars24', 'udaan', 'groww',
    'phonepe', 'dream11', 'urbancompany', 'cred', 'bharatpe', 'unacademy'
  ];

  console.log('--- Probing Greenhouse boards ---');
  for (const c of candidates) {
    try {
      const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${c}/jobs`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        const jobs = data.jobs || [];
        const indiaJobs = jobs.filter((j: any) => {
          const loc = (j.location?.name || '').toLowerCase();
          return loc.includes('india') || loc.includes('bangalore') || loc.includes('bengaluru') || loc.includes('mumbai') || loc.includes('delhi') || loc.includes('hyderabad') || loc.includes('pune') || loc.includes('gurgaon') || loc.includes('noida') || loc.includes('kochi');
        });
        console.log(`Greenhouse [${c}]: total ${jobs.length}, India: ${indiaJobs.length}`);
      }
    } catch {}
  }

  console.log('\n--- Probing Lever companies ---');
  for (const c of candidates) {
    try {
      const res = await fetch(`https://api.lever.co/v0/postings/${c}?mode=json`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const jobs = await res.json();
        if (Array.isArray(jobs)) {
          const indiaJobs = jobs.filter((j: any) => {
            const loc = (j.categories?.location || '').toLowerCase();
            return loc.includes('india') || loc.includes('bangalore') || loc.includes('bengaluru') || loc.includes('mumbai') || loc.includes('delhi') || loc.includes('hyderabad') || loc.includes('pune') || loc.includes('gurgaon') || loc.includes('noida') || loc.includes('kochi');
          });
          console.log(`Lever [${c}]: total ${jobs.length}, India: ${indiaJobs.length}`);
        }
      }
    } catch {}
  }

  console.log('\n--- Probing Ashby companies ---');
  for (const c of candidates) {
    try {
      const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${c}`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        const jobs = data.jobs || [];
        const indiaJobs = jobs.filter((j: any) => {
          const loc = (j.location || '').toLowerCase();
          return loc.includes('india') || loc.includes('bangalore') || loc.includes('bengaluru') || loc.includes('mumbai') || loc.includes('delhi') || loc.includes('hyderabad') || loc.includes('pune') || loc.includes('gurgaon') || loc.includes('noida') || loc.includes('kochi');
        });
        console.log(`Ashby [${c}]: total ${jobs.length}, India: ${indiaJobs.length}`);
      }
    } catch {}
  }
}

probe();
