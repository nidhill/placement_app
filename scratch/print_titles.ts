async function printTitles() {
  const ghRes = await fetch('https://boards-api.greenhouse.io/v1/boards/inmobi/jobs?content=true');
  const ghData = await ghRes.json();
  const jobs = ghData.jobs || [];
  console.log('InMobi India job titles:');
  jobs.filter((j: any) => (j.location?.name || '').toLowerCase().includes('bangalore') || (j.location?.name || '').toLowerCase().includes('india')).forEach((j: any) => {
    console.log(' - ', j.title);
  });
}
printTitles();
