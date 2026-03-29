import { NextRequest, NextResponse } from "next/server";
import { getGame, setGame, getRandomWord } from "@/lib/redis";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { playerId } = await req.json();

  const game = await getGame(code);
  if (!game) {
    return NextResponse.json({ error: "Spillet finnes ikke" }, { status: 404 });
  }

  if (game.hostId !== playerId) {
    return NextResponse.json({ error: "Bare verten kan tilbakestille spillet" }, { status: 403 });
  }

  const startWord = await getRandomWord();

  game.state = "waiting";
  game.chain = [{ word: startWord, playerId: "system", playerName: "System" }];
  game.usedWords = [startWord];
  game.currentTurnPlayerId = null;
  game.turnDeadline = null;
  game.eliminationReason = null;
  game.winnerName = null;
  game.players.forEach((p) => {
    p.alive = true;
    p.score = 0;
  });

  await setGame(game);
  return NextResponse.json({ ok: true });
}
