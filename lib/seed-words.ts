import { Redis } from "@upstash/redis";
import { NORWEGIAN_WORDS } from "./words";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const WORDS_KEY = "wordchain:norwegian_words";

async function seed() {
  console.log("Seeding Norwegian words to Upstash Redis...");

  // Deduplicate and normalize
  const unique = [...new Set(NORWEGIAN_WORDS.map((w) => w.toLowerCase().trim()))];

  // Clear existing
  await redis.del(WORDS_KEY);

  // Add in batches of 500
  for (let i = 0; i < unique.length; i += 500) {
    const batch = unique.slice(i, i + 500);
    await redis.sadd(WORDS_KEY, ...(batch as [string, ...string[]]));
    console.log(`  Added ${Math.min(i + 500, unique.length)}/${unique.length} words`);
  }

  console.log(`\nDone! ${unique.length} unique Norwegian words loaded.`);

  // Stats
  const letters: Record<string, number> = {};
  for (const word of unique) {
    const first = word[0];
    letters[first] = (letters[first] || 0) + 1;
  }
  console.log("\nWords per starting letter:");
  for (const [letter, count] of Object.entries(letters).sort()) {
    console.log(`  ${letter}: ${count}`);
  }
}

seed().catch(console.error);
