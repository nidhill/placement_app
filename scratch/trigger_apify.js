fetch('http://localhost:3000/api/v1/jobs')
  .then(r => r.json())
  .then(async data => {
    console.log("Jobs count after GET:", data.jobs?.length);
    if (data.jobs?.length > 0) {
      data.jobs.slice(0, 5).forEach(j => {
        console.log(`- ${j.title} @ ${j.company}`);
        console.log(`  appUrl: ${j.applicationUrl}`);
        console.log(`  extUrl: ${j.externalUrl}`);
      });
    }
  });
