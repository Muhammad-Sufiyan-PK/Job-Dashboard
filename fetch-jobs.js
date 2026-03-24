import { ApifyClient } from "apify-client";
import { writeFileSync } from "fs";

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

// Tailored to Muhammad Sufiyan's profile
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
    countryCode: "us",
    keyword: keyword,
    maxResults: 20,
  };

  try {
    const run = await client.actor("apify/google-jobs-scraper").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    allJobs = [...allJobs, ...items];
    console.log(`Fetched ${items.length} jobs for: ${keyword}`);
  } catch (err) {
    console.error(`Failed for "${keyword}":`, err.message);
  }
}

// Deduplicate by job URL
const seen = new Set();
const uniqueJobs = allJobs.filter(job => {
  if (!job.jobUrl || seen.has(job.jobUrl)) return false;
  seen.add(job.jobUrl);
  return true;
});

writeFileSync("data/jobs.json", JSON.stringify(uniqueJobs, null, 2));
console.log(`✅ Saved ${uniqueJobs.length} unique jobs.`);
