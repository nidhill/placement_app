import { IndiaLocationFilter } from '../server/services/indiaLocationFilter.ts';
import { JobNormalizer } from '../server/services/jobNormalizer.ts';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✓ PASSED: ${msg}`);
  }
}

console.log('====================================================');
console.log('RUNNING INDIA-ONLY FILTER TEST SUITE');
console.log('====================================================\n');

// 1. ACCEPT CASES
console.log('--- 1. Testing Accept Cases ---');
const acceptCases = [
  { location: 'Kochi, Kerala, India' },
  { location: 'Bangalore, Karnataka, India' },
  { location: 'Chennai, Tamil Nadu, India' },
  { location: 'Hyderabad, Telangana, India' },
  { location: 'Mumbai, Maharashtra, India' },
  { location: 'Delhi, India' },
  { location: 'Remote - India' },
  { location: 'India - Remote' },
  { location: 'Ernakulam, Kerala' },
  { location: 'Thiruvananthapuram, Kerala' },
  { location: 'Bengaluru, Karnataka' },
  { location: 'Pune, Maharashtra' },
  { location: 'Gurugram, Haryana' },
  { location: 'Noida, Uttar Pradesh' },
  { location: 'Ahmedabad, Gujarat' },
  { location: 'Kolkata, West Bengal' },
  { location: 'Jaipur, Rajasthan' },
  { location: 'Coimbatore, Tamil Nadu' },
  { location: 'Anyplace', countryCode: 'IN' },
  { location: 'Anyplace', countryCode: 'in' },
  { location: 'Anyplace', country: 'India' }
];

for (const tc of acceptCases) {
  const res = IndiaLocationFilter.evaluateLocation(tc);
  assert(res.isIndia === true, `Accept: "${tc.location}" (countryCode: ${tc.countryCode || ''})`);
}

// 2. REJECT CASES
console.log('\n--- 2. Testing Reject Cases ---');
const rejectCases = [
  { location: 'Lahore, Pakistan' },
  { location: 'New York, USA' },
  { location: 'London, UK' },
  { location: 'Toronto, Canada' },
  { location: 'Dubai, UAE' },
  { location: 'Singapore' },
  { location: 'Karachi, PK' },
  { location: 'Islamabad, Pakistan' },
  { location: 'Paris, France' },
  { location: 'Sydney, Australia' },
  { location: 'Bangalore, India', countryCode: 'PK' }, // Contradicting PK country code
  { location: 'Anyplace', countryCode: 'US' },
  { location: 'Anyplace', countryCode: 'GB' },
  { location: 'Anyplace', countryCode: 'CA' },
  { location: 'Anyplace', country: 'Pakistan' },
  { location: 'Anyplace', country: 'United States' }
];

for (const tc of rejectCases) {
  const res = IndiaLocationFilter.evaluateLocation(tc);
  assert(res.isIndia === false, `Reject: "${tc.location}" (countryCode: ${tc.countryCode || ''})`);
}

// 3. COMPANY COUNTRY VS JOB LOCATION
console.log('\n--- 3. Testing Company Country vs Job Location ---');
// Company = USA, Job Location = Bangalore, India -> ACCEPT
const compUsaJobIndia = JobNormalizer.normalize({
  title: 'Full Stack Engineer',
  companyName: 'Stripe Inc (US Headquarters)',
  location: 'Bangalore, Karnataka, India',
  description: 'US tech giant hiring engineers in Bangalore office.'
});
assert(compUsaJobIndia.isIndia === true, 'Company = USA, Job Location = Bangalore, India -> ACCEPT');

// Company = India, Job Location = London, UK -> REJECT
const compIndiaJobUk = JobNormalizer.normalize({
  title: 'Senior Software Engineer',
  companyName: 'Tata Consultancy Services',
  location: 'London, United Kingdom',
  description: 'Indian multinational IT consulting firm hiring for London client site.'
});
assert(compIndiaJobUk.isIndia === false, 'Company = India, Job Location = London, UK -> REJECT');

// Description mentions India, Job Location = New York, USA -> REJECT
const descMentionsIndia = JobNormalizer.normalize({
  title: 'Lead Cloud Architect',
  companyName: 'Apex Cloud Solutions',
  location: 'New York, USA',
  description: 'We are a global firm with offices in India and the US. This role is based in our New York office.'
});
assert(descMentionsIndia.isIndia === false, 'Description mentions India, Job Location = New York, USA -> REJECT');

// 4. REMOTE DISAMBIGUATION
console.log('\n--- 4. Testing Remote Disambiguation ---');
// "Remote - India" -> ACCEPT
const remoteIndia = IndiaLocationFilter.evaluateLocation({ location: 'Remote - India' });
assert(remoteIndia.isIndia === true && remoteIndia.isRemoteInIndia === true, 'Remote - India -> ACCEPT');

// "India - Remote" -> ACCEPT
const indiaRemote = IndiaLocationFilter.evaluateLocation({ location: 'India - Remote' });
assert(indiaRemote.isIndia === true && indiaRemote.isRemoteInIndia === true, 'India - Remote -> ACCEPT');

// "Remote - US" -> REJECT
const remoteUs = IndiaLocationFilter.evaluateLocation({ location: 'Remote - US' });
assert(remoteUs.isIndia === false, 'Remote - US -> REJECT');

// "Remote - Europe" -> REJECT
const remoteEu = IndiaLocationFilter.evaluateLocation({ location: 'Remote - Europe' });
assert(remoteEu.isIndia === false, 'Remote - Europe -> REJECT');

// "Worldwide Remote" without India confirmation -> REJECT
const worldwideRemote = IndiaLocationFilter.evaluateLocation({ location: 'Worldwide Remote' });
assert(worldwideRemote.isIndia === false, 'Worldwide Remote (unconfirmed) -> REJECT');

// "Remote" alone without country -> REJECT
const remoteAlone = IndiaLocationFilter.evaluateLocation({ location: 'Remote' });
assert(remoteAlone.isIndia === false, 'Plain "Remote" -> REJECT');

console.log('\n====================================================');
console.log('ALL 38 UNIT TESTS PASSED SUCCESSFULLY! 🎉');
console.log('====================================================');
