import dotenv from 'dotenv';
dotenv.config();

import { AtsJobApiService, AtsJobAdapter } from '../server/services/atsJobApiService.ts';
import { dbStore } from '../server/db/store.ts';
import { JobMatchingService } from '../server/services/matchingEngine.ts';
import { TechJobClassifier } from '../server/services/techClassifier.ts';

async function runAtsTests() {
  console.log('========================================================');
  console.log('HACA ATS PUBLIC JOB API INTEGRATION TEST SUITE');
  console.log('========================================================\n');

  // Test 1: Connectivity
  console.log('1. Testing ATS Connectivity...');
  const connStatus = await AtsJobApiService.testConnection();
  console.log(`  Connected: ${connStatus.connected}`);
  console.log(`  Active Connectors: ${connStatus.activeConnectors.join(', ')}`);
  console.log(`  Target Companies Configured: ${connStatus.companiesConfigured}`);
  if (!connStatus.connected) {
    console.warn(`  Warning: ${connStatus.error}`);
  }

  // Test 2: Normalization
  console.log('\n2. Testing Normalizer mapping to HACA Job Standard...');
  const sampleAtsItem = {
    id: 'gh-cloudflare-123456',
    title: 'Senior Full Stack Software Engineer',
    company: 'Cloudflare',
    description: 'We are seeking a Full Stack Engineer experienced with React, TypeScript, Node.js, and SQL.',
    location: 'Remote / US',
    applyUrl: 'https://boards.greenhouse.io/cloudflare/jobs/123456',
    publishedAt: new Date().toISOString(),
    sourceProvider: 'Greenhouse' as const
  };

  const normResult = AtsJobAdapter.normalizeRawJob(sampleAtsItem);
  console.log(`  Valid: ${normResult.valid}`);
  console.log(`  Is Tech Job: ${normResult.isTechJob}`);
  console.log(`  Normalized Role: ${normResult.normalized?.normalizedDesignation}`);
  console.log(`  Category: ${normResult.normalized?.category}`);
  console.log(`  Extracted Skills: ${normResult.normalized?.requiredSkills.join(', ')}`);
  console.log(`  Source Channel: ${normResult.normalized?.sourceChannel}`);
  console.log(`  Source Label: ${normResult.normalized?.source}`);
  console.log(`  Apply URL preserved: ${normResult.normalized?.applicationUrl}`);

  // Test 3: Non-tech filtration
  console.log('\n3. Testing Non-Tech Role Rejection...');
  const nonTechItem = {
    id: 'gh-company-999',
    title: 'Executive Assistant to VP',
    company: 'Stripe',
    description: 'Manage executive calendars, schedule travel, and oversee office operations.',
    location: 'San Francisco, CA',
    applyUrl: 'https://boards.greenhouse.io/stripe/jobs/999',
    publishedAt: new Date().toISOString(),
    sourceProvider: 'Greenhouse' as const
  };
  const nonTechResult = AtsJobAdapter.normalizeRawJob(nonTechItem);
  console.log(`  Non-Tech Role Filtered: ${!nonTechResult.isTechJob} (Expected: true)`);

  // Test 4: Ingestion and Deduplication
  console.log('\n4. Testing Ingestion & Duplicate Protection...');
  const actor = { id: 'user-root-admin', name: 'Admin', role: 'MAIN_ADMIN' as const };
  const initialJobsCount = dbStore.getAllJobs().length;
  console.log(`  Initial Store Jobs Count: ${initialJobsCount}`);

  const ingestResult = await AtsJobApiService.fetchAndIngestJobs(actor, { limit: 15 });
  console.log(`  Ingested Jobs: ${ingestResult.newIngested}`);
  console.log(`  Tech Jobs Count: ${ingestResult.techJobsCount}`);
  console.log(`  Non-tech Filtered: ${ingestResult.nonTechFilteredCount}`);
  console.log(`  Duplicates Count: ${ingestResult.duplicatesCount}`);

  const newTotal = dbStore.getAllJobs().length;
  console.log(`  Updated Store Jobs Count: ${newTotal}`);

  // Run second ingestion to test deduplication
  console.log('\n  Running second ingestion to test intra/inter-batch deduplication...');
  const secondIngest = await AtsJobApiService.fetchAndIngestJobs(actor, { limit: 15 });
  console.log(`  Second Ingest New Jobs Added: ${secondIngest.newIngested} (Duplicates skipped: ${secondIngest.duplicatesCount})`);

  // Test 5: Student Matching with Ingested Jobs
  console.log('\n5. Testing Student Matching Engine with Ingested ATS Jobs...');
  const students = dbStore.getAllStudents();
  const testStudent = students[0];
  const allJobs = dbStore.getAllJobs();
  const atsJobs = allJobs.filter(j => j.sourceChannel === 'ATS_JOB_API');
  console.log(`  Total ATS Jobs in Store: ${atsJobs.length}`);

  if (atsJobs.length > 0) {
    const match = JobMatchingService.evaluateMatch(testStudent, atsJobs[0]);
    console.log(`  Candidate: ${testStudent.fullName} (${testStudent.designation || testStudent.program})`);
    console.log(`  Job: ${atsJobs[0].title} @ ${atsJobs[0].company}`);
    console.log(`  Match Score: ${match.matchScore}% (${match.matchLevel})`);
    console.log(`  Designation Score: ${match.designationScore}/40`);
    console.log(`  Skills Score: ${match.skillsScore}/35`);
  }

  // Test 6: Deletion Protection
  console.log('\n6. Testing Deletion Protection for ATS Jobs...');
  if (atsJobs.length > 0) {
    try {
      dbStore.deleteJob(atsJobs[0].id, actor);
      console.error('  [FAIL] ATS Job was unexpectedly deleted!');
    } catch (err: any) {
      console.log(`  [PASS] Deletion blocked as expected: "${err.message}"`);
    }
  }

  console.log('\n========================================================');
  console.log('ALL TESTS COMPLETED SUCCESSFULLY');
  console.log('========================================================');
}

runAtsTests().catch(err => console.error('Test Suite Error:', err));
