async function inspect() {
  const ghRes = await fetch('https://boards-api.greenhouse.io/v1/boards/inmobi/jobs');
  const ghData = await ghRes.json();
  console.log('Greenhouse job sample keys:', Object.keys(ghData.jobs[0] || {}));
  console.log('Greenhouse job sample:', {
    id: ghData.jobs[0]?.id,
    title: ghData.jobs[0]?.title,
    location: ghData.jobs[0]?.location,
    updated_at: ghData.jobs[0]?.updated_at,
  });

  const leverRes = await fetch('https://api.lever.co/v0/postings/meesho?mode=json');
  const leverData = await leverRes.json();
  console.log('Lever job sample keys:', Object.keys(leverData[0] || {}));
  console.log('Lever job sample:', {
    id: leverData[0]?.id,
    title: leverData[0]?.text,
    location: leverData[0]?.categories?.location,
    createdAt: leverData[0]?.createdAt,
    dateType: typeof leverData[0]?.createdAt
  });
}
inspect();
