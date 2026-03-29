import { NextRequest, NextResponse } from "next/server";
import { getGame, setGame, isValidWord } from "@/lib/redis";
import { checkTheme } from "@/lib/theme-check";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { playerId, word } = await req.json();

  if (!playerId || !word) {
    return NextResponse.json({ error: "Spiller-ID og ord er påkrevd" }, { status: 400 });
  }

  const game = await getGame(code);
  if (!game) {
    return NextResponse.json({ error: "Spillet finnes ikke" }, { status: 404 });
  }

  if (game.state !== "playing") {
    return NextResponse.json({ error: "Spillet er ikke i gang" }, { status: 400 });
  }

  if (game.currentTurnPlayerId !== playerId) {
    return NextResponse.json({ error: "Det er ikke din tur" }, { status: 403 });
  }

  const normalizedWord = word.trim().toLowerCase();

  // Check if word was already used
  if (game.usedWords.includes(normalizedWord)) {
    return NextResponse.json({ error: "Ordet er allerede brukt" }, { status: 400 });
  }

  // Check that word starts with last letter of previous word
  const lastWord = game.chain[game.chain.length - 1].word;
  const lastLetter = lastWord[lastWord.length - 1];
  if (normalizedWord[0] !== lastLetter) {
    return NextResponse.json(
      { error: `Ordet må begynne med "${lastLetter}"` },
      { status: 400 }
    );
  }

  // Validate word exists in dictionary
  const valid = await isValidWord(normalizedWord);
  if (!valid) {
    return NextResponse.json({ error: "Ikke et gyldig norsk ord 🤔" }, { status: 400 });
  }

  // Pause the timer — record when the player submitted
  const submitTime = Date.now();

  // Check theme if not "free"
  if (game.theme !== "free") {
    try {
      const themeResult = await checkTheme(normalizedWord, game.theme);
      if (!themeResult.fits) {
        // Give back the time spent on API call
        const apiTime = Date.now() - submitTime;
        game.turnDeadline = (game.turnDeadline ?? 0) + apiTime;
        await setGame(game);
        return NextResponse.json(
          { error: `«${normalizedWord}» passer ikke til temaet! ${themeResult.reason} 🚫` },
          { status: 400 }
        );
      }
    } catch (err) {
      // Log the error so we can debug, but allow the word
      console.error("Theme check failed:", err);
    }
  }

  // Add word to chain
  const player = game.players.find((p) => p.id === playerId)!;
  game.chain.push({
    word: normalizedWord,
    playerId,
    playerName: player.name,
  });
  game.usedWords.push(normalizedWord);

  // Score: 1 point base + bonus for longer words
  let points = 1;
  if (normalizedWord.length >= 6) points = 2;
  if (normalizedWord.length >= 8) points = 3;
  if (normalizedWord.length >= 10) points = 5;
  player.score += points;

  game.eliminationReason = null;

  // Move to next alive player
  const currentIndex = game.players.findIndex((p) => p.id === playerId);
  let nextIndex = (currentIndex + 1) % game.players.length;
  while (!game.players[nextIndex].alive) {
    nextIndex = (nextIndex + 1) % game.players.length;
  }
  game.currentTurnPlayerId = game.players[nextIndex].id;
  game.turnDeadline = Date.now() + game.turnTime * 1000;

  await setGame(game);
  return NextResponse.json({ ok: true });
}
