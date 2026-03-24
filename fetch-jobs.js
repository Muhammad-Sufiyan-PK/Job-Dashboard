import { ApifyClient } from "apify-client";
import { writeFileSync } from "fs";

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

const searches = [
  "Remote Part-Time Research Analyst",
  "Remote Part-Time Program Coordinator NGO",
  "Remote Part-Time Monitoring Evaluation Development",
  "Remote Part-Time Data Analyst Social Impact",
  "Remote Part-Time Research Officer UNDP development",
];

let allJobs = [];

for (const keyword of searches) {
  const input = {
    query: keyword,
    countryCode: "us",
    languageCode: "en",
    maxPagesPerQuery: 2,
    datePosted: "month",
  };

  try {
    const run = await client.actor("igview-owner/google-jobs-scraper").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    const normalized = items.map(item => ({
      title: item.title || item.jobTitle || item.job_title || "Untitled",
      companyName: item.companyName || item.company || item.company_name || "Unknown",
      location: item.location || "Remote",
      datePosted: item.datePosted || item.date || item.posted || "N/A",
      jobUrl: item.applyUrl || item.applyLink || item.jobUrl || item.link || item.URL || "#",
    }));

    allJobs = [...allJobs, ...normalized];
    console.log(`Fetched ${items.length} jobs for: ${keyword}`);
  } catch (err) {
    console.error(`Failed for "${keyword}":`, err.message);
  }
}

const seen = new Set();
const uniqueJobs = allJobs.filter(job => {
  if (!job.jobUrl || job.jobUrl === "#" || seen.has(job.jobUrl)) return false;
  seen.add(job.jobUrl);
  return true;
});

writeFileSync("data/jobs.json", JSON.stringify(uniqueJobs, null, 2));
console.log(`✅ Saved ${uniqueJobs.length} unique jobs.`);
