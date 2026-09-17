fetch('http://localhost:3000/api/v1/jobs')
  .then(res => res.json())
  .then(data => {
    console.log("Jobs count:", data.jobs?.length);
    data.jobs.forEach(j => {
      console.log(`- ${j.title} @ ${j.company}: appUrl=${j.applicationUrl}, extUrl=${j.externalUrl}`);
    });
  })
  .catch(err => console.error(err));
