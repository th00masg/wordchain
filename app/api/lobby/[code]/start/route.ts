import { NextRequest, NextResponse } from "next/server";
import { getGame, setGame } from "@/lib/redis";

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
    return NextResponse.json({ error: "Bare verten kan starte spillet" }, { status: 403 });
  }

  if (game.state !== "waiting") {
    return NextResponse.json({ error: "Spillet er allerede startet" }, { status: 400 });
  }

  if (game.players.length < 2) {
    return NextResponse.json({ error: "Trenger minst 2 spillere" }, { status: 400 });
  }

  // Give more time when a theme is active (AI validation adds ~1-2s per submit)
  if (game.theme !== "free") {
    game.turnTime = 25;
  }

  game.state = "playing";
  game.currentTurnPlayerId = game.players[0].id;
  game.turnDeadline = Date.now() + game.turnTime * 1000;

  await setGame(game);
  return NextResponse.json({ ok: true });
}
