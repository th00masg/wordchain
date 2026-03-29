import { NextRequest, NextResponse } from "next/server";
import { getGame, setGame } from "@/lib/redis";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { playerName, playerId } = await req.json();

  if (!playerName || !playerId) {
    return NextResponse.json({ error: "Navn og spiller-ID er påkrevd" }, { status: 400 });
  }

  const game = await getGame(code);
  if (!game) {
    return NextResponse.json({ error: "Spillet finnes ikke" }, { status: 404 });
  }

  if (game.state !== "waiting") {
    return NextResponse.json({ error: "Spillet har allerede startet" }, { status: 400 });
  }

  // Check if player already in game
  const existing = game.players.find((p) => p.id === playerId);
  if (existing) {
    return NextResponse.json({ ok: true });
  }

  if (game.players.length >= 8) {
    return NextResponse.json({ error: "Spillet er fullt (maks 8 spillere)" }, { status: 400 });
  }

  game.players.push({
    id: playerId,
    name: playerName,
    isHost: false,
    alive: true,
    score: 0,
  });

  await setGame(game);
  return NextResponse.json({ ok: true });
}
