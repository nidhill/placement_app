async function check() {
  try {
    const res = await fetch('http://localhost:3000/api/v1/jobs');
    const data = await res.json();
    console.log('GET /api/v1/jobs returned count:', data.jobs?.length);
    if (data.jobs && data.jobs.length > 0) {
      console.log('Jobs preview:');
      data.jobs.forEach((j: any, i: number) => {
        console.log(`  ${i + 1}. [${j.sourceChannel}] ${j.title} @ ${j.company} (${j.location})`);
      });
    }
  } catch (err: any) {
    console.error('Fetch error:', err.message);
  }
}
check();
