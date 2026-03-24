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

    // Log first item to see actual field names
    if (items.length > 0) {
      console.log("Sample fields:", Object.keys(items[0]).join(", "));
    }

    const normalized = items.map(item => ({
      title: item.title || item.jobTitle || item.job_title || "Untitled",
      companyName: item.companyName || item.company || item.company_name || "Unknown",
      location: item.location || "Remote",
      datePosted: item.datePosted || item.date || item.posted || "N/A",
      jobUrl: item.applyUrl || item.applyLink || item.jobUrl || item.link || item.URL || item.url || item.sourceUrl || "",
    }));

    allJobs = [...allJobs, ...normalized];
    console.log(`Fetched ${items.length} jobs for: ${keyword}`);
  } catch (err) {
    console.error(`Failed for "${keyword}":`, err.message);
  }
}

// Deduplicate by title + company instead of URL
const seen = new Set();
const uniqueJobs = allJobs.filter(job => {
  const key = `${job.title}|${job.companyName}`.toLowerCase();
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

writeFileSync("data/jobs.json", JSON.stringify(uniqueJobs, null, 2));
console.log(`✅ Saved ${uniqueJobs.length} unique jobs.`);
