import { Redis } from "@upstash/redis";
import { Game } from "./types";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const GAME_TTL = 7200; // 2 hours
const WORDS_KEY = "wordchain:norwegian_words";

function gameKey(code: string) {
  return `wordchain:game:${code}`;
}

export async function getGame(code: string): Promise<Game | null> {
  return await redis.get<Game>(gameKey(code));
}

export async function setGame(game: Game): Promise<void> {
  await redis.set(gameKey(game.code), game, { ex: GAME_TTL });
}

export async function deleteGame(code: string): Promise<void> {
  await redis.del(gameKey(code));
}

export async function isValidWord(word: string): Promise<boolean> {
  const result = await redis.sismember(WORDS_KEY, word.toLowerCase());
  return result === 1;
}

export async function getRandomWord(): Promise<string> {
  const word = await redis.srandmember<string>(WORDS_KEY);
  return word || "hund";
}

export async function getWordCount(): Promise<number> {
  return await redis.scard(WORDS_KEY);
}

export function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default redis;
