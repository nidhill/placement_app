async function runApiVerification() {
  console.log('Testing live API endpoints for India-Only Jobs...\n');

  // 1. Check GET /api/v1/jobs
  const jobsRes = await fetch('http://localhost:3000/api/v1/jobs');
  const jobsData = await jobsRes.json();
  console.log(`GET /api/v1/jobs returned ${jobsData.jobs?.length} jobs:`);
  let anyForeignJob = false;
  for (const j of jobsData.jobs || []) {
    console.log(` - [${j.countryCode || 'NO_CC'}] ${j.title} @ ${j.company} | Location: ${j.location}`);
    if (j.countryCode !== 'IN' && !j.location.toLowerCase().includes('india')) {
      anyForeignJob = true;
      console.error(`❌ Foreign job detected: ${j.title} at ${j.location}`);
    }
  }

  if (anyForeignJob) {
    throw new Error('FAILED: One or more foreign jobs were returned by GET /api/v1/jobs');
  } else {
    console.log('✓ SUCCESS: 100% of jobs in /api/v1/jobs are verified inside India!\n');
  }

  // 2. Check Student Recommendations
  const recRes = await fetch('http://localhost:3000/api/v1/students/student-tech-1/recommendations');
  const recData = await recRes.json();
  console.log(`GET /api/v1/students/student-tech-1/recommendations returned ${recData.recommendations?.length} recommendations:`);
  for (const r of recData.recommendations || []) {
    const j = r.job;
    console.log(` - Score: ${r.matchScore}% | ${j.title} @ ${j.company} | Location: ${j.location}`);
    if (j.countryCode !== 'IN' && !j.location.toLowerCase().includes('india')) {
      throw new Error(`FAILED: Recommended job is outside India: ${j.title} at ${j.location}`);
    }
  }
  console.log('✓ SUCCESS: 100% of student recommendations are verified inside India!\n');

  // 3. Test Manual Creation: Foreign Location Rejection
  console.log('Testing rejection of foreign job creation:');
  const rejectRes = await fetch('http://localhost:3000/api/v1/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'DevOps Engineer',
      company: 'Dubai Cloud Corp',
      location: 'Dubai, UAE',
      sourceChannel: 'PLACEMENT_DIRECT',
      requiredSkills: ['Docker', 'AWS']
    })
  });
  const rejectData = await rejectRes.json();
  if (rejectRes.status === 400 && rejectData.error?.includes('outside India')) {
    console.log(`✓ SUCCESS: Foreign job creation correctly rejected (HTTP 400): "${rejectData.error}"\n`);
  } else {
    throw new Error(`FAILED: Foreign job was not rejected! Status: ${rejectRes.status}`);
  }

  // 4. Test Manual Creation: Indian Location Acceptance
  console.log('Testing acceptance of Indian job creation:');
  const acceptRes = await fetch('http://localhost:3000/api/v1/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Senior React Engineer',
      company: 'Kochi Tech Ventures',
      location: 'Kochi, Kerala, India',
      sourceChannel: 'PLACEMENT_DIRECT',
      requiredSkills: ['React', 'TypeScript', 'Node.js'],
      salaryRange: '₹10,00,000 - ₹15,00,000 / annum'
    })
  });
  const acceptData = await acceptRes.json();
  if (acceptRes.status === 201 && acceptData.job?.countryCode === 'IN') {
    console.log(`✓ SUCCESS: Indian job created successfully: "${acceptData.job.title}" @ "${acceptData.job.location}" (countryCode: ${acceptData.job.countryCode})\n`);
  } else {
    throw new Error(`FAILED: Indian job was not accepted! Status: ${acceptRes.status}`);
  }

  console.log('====================================================');
  console.log('ALL API ENDPOINT VERIFICATIONS PASSED! 🎉');
  console.log('====================================================');
}

runApiVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
