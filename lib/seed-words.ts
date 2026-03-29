import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const WORDS_KEY = "wordchain:norwegian_words";
const WORDLIST_URL =
  "https://raw.githubusercontent.com/Ondkloss/norwegian-wordlist/master/wordlist_20220201_norsk_ordbank_nob_2005.txt";

async function seed() {
  console.log("Fetching Norsk Ordbank word list...");

  const res = await fetch(WORDLIST_URL);
  if (!res.ok) throw new Error(`Failed to fetch word list: ${res.status}`);
  const text = await res.text();

  // Filter: lowercase only, 2-15 chars, Norwegian letters (a-z + æøå)
  const wordPattern = /^[a-zæøå]{2,15}$/;
  const all = text
    .split("\n")
    .map((w) => w.trim().toLowerCase())
    .filter((w) => wordPattern.test(w));

  const unique = [...new Set(all)];
  console.log(`Found ${unique.length} valid words (filtered from ${text.split("\n").length} total)`);

  // Clear existing
  await redis.del(WORDS_KEY);

  // Add in batches of 500
  for (let i = 0; i < unique.length; i += 500) {
    const batch = unique.slice(i, i + 500);
    await redis.sadd(WORDS_KEY, ...(batch as [string, ...string[]]));
    const progress = Math.min(i + 500, unique.length);
    if (progress % 5000 === 0 || progress === unique.length) {
      console.log(`  Added ${progress}/${unique.length} words`);
    }
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
