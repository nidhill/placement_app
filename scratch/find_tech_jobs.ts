import { TechJobClassifier } from '../server/services/techClassifier.ts';

async function testCompanyJobs() {
  const ghBoards = ['postman', 'groww', 'inmobi'];
  const leverCompanies = ['meesho', 'cred'];

  console.log('--- Checking Greenhouse Tech Jobs ---');
  for (const b of ghBoards) {
    try {
      const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${b}/jobs?content=true`);
      if (res.ok) {
        const d = await res.json();
        const jobs = d.jobs || [];
        const techIndiaJobs = jobs.filter((j: any) => {
          const loc = (j.location?.name || '').toLowerCase();
          const isIndia = loc.includes('india') || loc.includes('bangalore') || loc.includes('bengaluru') || loc.includes('mumbai') || loc.includes('delhi') || loc.includes('hyderabad') || loc.includes('pune') || loc.includes('gurgaon') || loc.includes('noida') || loc.includes('kochi');
          if (!isIndia) return false;
          const cl = TechJobClassifier.classify({ title: j.title, description: j.content });
          return cl.isTechJob;
        });
        console.log(`GH [${b}]: total India tech = ${techIndiaJobs.length}`);
        techIndiaJobs.forEach((j: any) => console.log(`   - ${j.title} (${j.location?.name})`));
      }
    } catch (e: any) {
      console.log(`GH [${b}] error:`, e.message);
    }
  }

  console.log('\n--- Checking Lever Tech Jobs ---');
  for (const c of leverCompanies) {
    try {
      const res = await fetch(`https://api.lever.co/v0/postings/${c}?mode=json`);
      if (res.ok) {
        const jobs: any[] = await res.json();
        const techIndiaJobs = jobs.filter((j: any) => {
          const loc = (j.categories?.location || '').toLowerCase();
          const isIndia = loc.includes('india') || loc.includes('bangalore') || loc.includes('bengaluru') || loc.includes('mumbai') || loc.includes('delhi') || loc.includes('hyderabad') || loc.includes('pune') || loc.includes('gurgaon') || loc.includes('noida') || loc.includes('kochi');
          if (!isIndia) return false;
          const cl = TechJobClassifier.classify({ title: j.text, description: j.descriptionPlain });
          return cl.isTechJob;
        });
        console.log(`Lever [${c}]: total India tech = ${techIndiaJobs.length}`);
        techIndiaJobs.slice(0, 10).forEach((j: any) => console.log(`   - ${j.text} (${j.categories?.location})`));
      }
    } catch (e: any) {
      console.log(`Lever [${c}] error:`, e.message);
    }
  }
}

testCompanyJobs();
