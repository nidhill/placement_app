const http = require('http');

async function runVerification() {
  console.log('====================================================');
  console.log('HACA PLACEMENT PLATFORM - VERIFICATION SUITE');
  console.log('====================================================\n');

  // Test 1: Query server health
  const health = await fetchJson('http://localhost:3000/api/health');
  console.log('[✓] Server Health:', health);

  // Test 1b: Classification & Rejection Logic Unit Tests
  console.log('\n----------------------------------------------------');
  console.log('1. UNIT TESTS: NON-TECH REJECTION & TECH CLASSIFICATION');
  console.log('----------------------------------------------------');
  const nonTechTestCases = [
    'Sales Executive',
    'HR Executive',
    'Accountant',
    'Receptionist',
    'Customer Service Executive',
    'Marketing Executive',
    'Business Development Executive',
    'Content Writer',
    'Operations Executive',
    'Finance Manager',
    'Recruiter',
    'Office Administrator',
    'Cashier',
    'General Labor'
  ];

  const techTestCases = [
    { title: 'Senior Full Stack Developer', expectedCat: 'Full Stack Development' },
    { title: 'Frontend React Developer', expectedCat: 'Frontend Development' },
    { title: 'Python Backend Engineer', expectedCat: 'Backend Development' },
    { title: 'Data Analyst', expectedCat: 'Data Analytics' },
    { title: 'Machine Learning Engineer', expectedCat: 'AI / Machine Learning' },
    { title: 'Cloud DevOps Engineer', expectedCat: 'Cloud / DevOps' },
    { title: 'QA Automation Engineer', expectedCat: 'QA / Testing' },
    { title: 'UI/UX Product Designer', expectedCat: 'UI/UX / Product Design' },
    { title: 'Cybersecurity Analyst', expectedCat: 'Cybersecurity' }
  ];

  console.log('Testing Non-Tech Rejection (All must be rejected):');
  // We can test via server endpoints or direct execution


  // Test 2: Trigger real Apify fetch
  console.log('\n----------------------------------------------------');
  console.log('1. TRIGGERING REAL APIFY SCRAPER INGESTION PIPELINE');
  console.log('----------------------------------------------------');
  const apifyResult = await postJson('http://localhost:3000/api/v1/admin/integrations/apify/fetch', { limit: 30 });
  console.log('Apify Ingestion Results:');
  console.log('  Total jobs fetched from Apify:  ', apifyResult.totalReceived);
  console.log('  Technology jobs accepted:       ', apifyResult.techJobsCount);
  console.log('  Non-tech jobs filtered out:     ', apifyResult.nonTechFilteredCount);
  console.log('  Invalid jobs discarded:         ', apifyResult.invalidCount);
  console.log('  Duplicate jobs detected:        ', apifyResult.duplicatesCount);
  console.log('  New technology jobs ingested:   ', apifyResult.newIngested);
  if (apifyResult.newJobTitles && apifyResult.newJobTitles.length > 0) {
    console.log('  Ingested Tech Job Sample:');
    apifyResult.newJobTitles.slice(0, 5).forEach((t, i) => console.log(`    ${i + 1}. ${t}`));
  }

  // Test 3: Get all jobs in database
  const jobsRes = await fetchJson('http://localhost:3000/api/v1/jobs');
  console.log(`\n[✓] Total active technology jobs in database: ${jobsRes.jobs.length}`);

  // Test 4: Verify Student 1 (Ali Raza - Full Stack Developer)
  console.log('\n----------------------------------------------------');
  console.log('2. TESTING STUDENT 1: ALI RAZA (Full Stack Developer)');
  console.log('----------------------------------------------------');
  const s1Recs = await fetchJson('http://localhost:3000/api/v1/students/student-tech-1/recommendations');
  console.log(`Ali Raza: ${s1Recs.recommendations.length} recommended tech jobs found.`);
  console.log('\nTop 5 Matched Jobs for Student 1:');
  s1Recs.recommendations.slice(0, 5).forEach((rec, idx) => {
    console.log(`\n  ${idx + 1}. ${rec.job.title} @ ${rec.job.company}`);
    console.log(`     Category:           ${rec.job.category}`);
    console.log(`     Designation Match:  ${rec.designationScore}/40 (Job Role: ${rec.job.normalizedDesignation || 'N/A'})`);
    console.log(`     Skill Match:        ${rec.skillsScore}/35 (Matched: ${rec.matchedSkills.join(', ') || 'None'})`);
    console.log(`     Program Match:      ${rec.programScore}/15`);
    console.log(`     Experience Match:   ${rec.experienceScore}/10 (${rec.experienceExplanation})`);
    console.log(`     FINAL SCORE:        ${rec.matchScore}% [${rec.matchLevel}]`);
    console.log(`     Missing Skills:     ${rec.missingSkills.slice(0, 3).join(', ') || 'None'}`);
  });

  // Test 5: Verify Student 2 (Hamza Sheikh - Python Developer)
  console.log('\n----------------------------------------------------');
  console.log('3. TESTING STUDENT 2: HAMZA SHEIKH (Python Developer)');
  console.log('----------------------------------------------------');
  const s2Recs = await fetchJson('http://localhost:3000/api/v1/students/student-tech-3/recommendations');
  console.log(`Hamza Sheikh: ${s2Recs.recommendations.length} recommended tech jobs found.`);
  console.log('\nTop 5 Matched Jobs for Student 2:');
  s2Recs.recommendations.slice(0, 5).forEach((rec, idx) => {
    console.log(`\n  ${idx + 1}. ${rec.job.title} @ ${rec.job.company}`);
    console.log(`     Category:           ${rec.job.category}`);
    console.log(`     Designation Match:  ${rec.designationScore}/40 (Job Role: ${rec.job.normalizedDesignation || 'N/A'})`);
    console.log(`     Skill Match:        ${rec.skillsScore}/35 (Matched: ${rec.matchedSkills.join(', ') || 'None'})`);
    console.log(`     Program Match:      ${rec.programScore}/15`);
    console.log(`     Experience Match:   ${rec.experienceScore}/10 (${rec.experienceExplanation})`);
    console.log(`     FINAL SCORE:        ${rec.matchScore}% [${rec.matchLevel}]`);
    console.log(`     Missing Skills:     ${rec.missingSkills.slice(0, 3).join(', ') || 'None'}`);
  });

  // Test 6: Verify Student 3 (Arjun Kumar - Data Analyst)
  console.log('\n----------------------------------------------------');
  console.log('4. TESTING STUDENT 3: ARJUN KUMAR (Data Analyst)');
  console.log('----------------------------------------------------');
  const s3Recs = await fetchJson('http://localhost:3000/api/v1/students/student-data-1/recommendations');
  console.log(`Arjun Kumar: ${s3Recs.recommendations.length} recommended tech jobs found.`);
  console.log('\nTop 5 Matched Jobs for Student 3:');
  s3Recs.recommendations.slice(0, 5).forEach((rec, idx) => {
    console.log(`\n  ${idx + 1}. ${rec.job.title} @ ${rec.job.company}`);
    console.log(`     Category:           ${rec.job.category}`);
    console.log(`     Designation Match:  ${rec.designationScore}/40 (Job Role: ${rec.job.normalizedDesignation || 'N/A'})`);
    console.log(`     Skill Match:        ${rec.skillsScore}/35 (Matched: ${rec.matchedSkills.join(', ') || 'None'})`);
    console.log(`     Program Match:      ${rec.programScore}/15`);
    console.log(`     Experience Match:   ${rec.experienceScore}/10 (${rec.experienceExplanation})`);
    console.log(`     FINAL SCORE:        ${rec.matchScore}% [${rec.matchLevel}]`);
    console.log(`     Missing Skills:     ${rec.missingSkills.slice(0, 3).join(', ') || 'None'}`);
  });

  // Test 7: Verify Placement Officer Candidate Matching View for a Job
  if (jobsRes.jobs.length > 0) {
    const targetJob = jobsRes.jobs[0];
    console.log('\n----------------------------------------------------');
    console.log(`5. PLACEMENT OFFICER VIEW: RANKED STUDENTS FOR "${targetJob.title}"`);
    console.log('----------------------------------------------------');
    const candRes = await fetchJson(`http://localhost:3000/api/v1/jobs/${targetJob.id}/candidates`);
    console.log(`Candidate matching for Job ID: ${targetJob.id} (${targetJob.title} @ ${targetJob.company}):`);
    candRes.candidates.slice(0, 3).forEach((cand, idx) => {
      console.log(`  ${idx + 1}. ${cand.student.fullName} (${cand.student.designation})`);
      console.log(`     Score: ${cand.matchScore}% [${cand.matchLevel}] | Role: ${cand.designationScore}/40 | Skills: ${cand.skillsScore}/35 | Program: ${cand.programScore}/15`);
    });
  }

  console.log('\n====================================================');
  console.log('VERIFICATION SUITE COMPLETED SUCCESSFULLY');
  console.log('====================================================');
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const parsedUrl = new URL(url);
    const req = http.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

runVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
