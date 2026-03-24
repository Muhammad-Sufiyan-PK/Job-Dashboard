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
    countryName: "usa",
    includeKeyword: keyword,
    pagesToFetch: 3,
  };

  try {
    const run = await client.actor("orgupdate/google-jobs-scraper").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    // Normalize field names to match what index.html expects
    const normalized = items.map(item => ({
      title: item.job_title || item.title || "Untitled",
      companyName: item.company_name || item.companyName || "Unknown",
      location: item.location || "Remote",
      datePosted: item.date || item.datePosted || "N/A",
      jobUrl: item.URL || item.jobUrl || "#",
    }));

    allJobs = [...allJobs, ...normalized];
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
