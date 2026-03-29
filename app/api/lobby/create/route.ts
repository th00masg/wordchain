import { NextRequest, NextResponse } from "next/server";
import { generateCode, getGame, setGame, getRandomWord } from "@/lib/redis";
import { Game } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { playerName, playerId } = await req.json();

  if (!playerName || !playerId) {
    return NextResponse.json({ error: "Navn og spiller-ID er påkrevd" }, { status: 400 });
  }

  // Generate a unique code
  let code: string;
  let attempts = 0;
  do {
    code = generateCode();
    const existing = await getGame(code);
    if (!existing) break;
    attempts++;
  } while (attempts < 10);

  if (attempts >= 10) {
    return NextResponse.json({ error: "Kunne ikke generere spillkode" }, { status: 500 });
  }

  const startWord = await getRandomWord();

  const game: Game = {
    code,
    hostId: playerId,
    players: [
      {
        id: playerId,
        name: playerName,
        isHost: true,
        alive: true,
        score: 0,
      },
    ],
    state: "waiting",
    chain: [{ word: startWord, playerId: "system", playerName: "System" }],
    usedWords: [startWord],
    currentTurnPlayerId: null,
    turnDeadline: null,
    turnTime: 15,
    eliminationReason: null,
    winnerName: null,
  };

  await setGame(game);
  return NextResponse.json({ code });
}
