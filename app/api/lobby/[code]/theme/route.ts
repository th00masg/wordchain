import { NextRequest, NextResponse } from "next/server";
import { getGame, setGame } from "@/lib/redis";
import { ThemeId } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { playerId, theme } = await req.json() as { playerId: string; theme: ThemeId };

  const game = await getGame(code);
  if (!game) {
    return NextResponse.json({ error: "Spillet finnes ikke" }, { status: 404 });
  }

  if (game.hostId !== playerId) {
    return NextResponse.json({ error: "Bare verten kan endre tema" }, { status: 403 });
  }

  if (game.state !== "waiting") {
    return NextResponse.json({ error: "Kan ikke endre tema etter start" }, { status: 400 });
  }

  game.theme = theme;
  await setGame(game);
  return NextResponse.json({ ok: true });
}
