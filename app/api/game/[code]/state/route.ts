import { NextRequest, NextResponse } from "next/server";
import { getGame, setGame } from "@/lib/redis";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const game = await getGame(code);

  if (!game) {
    return NextResponse.json({ error: "Spillet finnes ikke" }, { status: 404 });
  }

  // Check if current player's turn has timed out
  if (
    game.state === "playing" &&
    game.turnDeadline &&
    Date.now() > game.turnDeadline
  ) {
    const currentPlayer = game.players.find(
      (p) => p.id === game.currentTurnPlayerId
    );
    if (currentPlayer) {
      currentPlayer.alive = false;
      game.eliminationReason = `${currentPlayer.name} brukte for lang tid!`;

      // Check if game is over
      const alivePlayers = game.players.filter((p) => p.alive);
      if (alivePlayers.length <= 1) {
        game.state = "finished";
        game.winnerName = alivePlayers[0]?.name ?? null;
        game.currentTurnPlayerId = null;
        game.turnDeadline = null;
      } else {
        // Move to next alive player
        const currentIndex = game.players.findIndex(
          (p) => p.id === game.currentTurnPlayerId
        );
        let nextIndex = (currentIndex + 1) % game.players.length;
        while (!game.players[nextIndex].alive) {
          nextIndex = (nextIndex + 1) % game.players.length;
        }
        game.currentTurnPlayerId = game.players[nextIndex].id;
        game.turnDeadline = Date.now() + game.turnTime * 1000;
      }

      await setGame(game);
    }
  }

  return NextResponse.json(game);
}
